/**
 * TracerIt Integration System
 * Phase 2 Priority 5: Automatic work order creation and maintenance tracking
 * 
 * Features:
 * - Automatic work order creation from breakdown assessments
 * - Real-time job status tracking and updates
 * - Parts availability checking and ordering
 * - Engineer dispatch coordination
 * - Job completion synchronization
 */

class TracerItIntegration {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.apiKey = this.getApiKey();
        this.connected = false;
        this.jobQueue = [];
        this.activeJobs = new Map();
        this.jobStatusListeners = new Map();
        
        this.config = {
            retryAttempts: 3,
            retryDelay: 2000,
            timeout: 30000,
            priorityLevels: {
                'STOP': 'Critical',
                'AMBER': 'High', 
                'CONTINUE': 'Standard'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🔧 TracerIt Integration initializing...');
        
        // Test API connection
        this.testConnection();
        
        // Set up real-time integration
        this.setupRealTimeIntegration();
        
        // Process any queued jobs
        this.processJobQueue();
        
        console.log('✅ TracerIt Integration initialized');
    }
    
    getApiBaseUrl() {
        // In production, this would come from environment variables
        return process.env.TRACERIT_API_URL || 'https://api.tracerit.gonortheast.co.uk';
    }
    
    getApiKey() {
        // In production, this would be securely managed
        return process.env.TRACERIT_API_KEY || 'demo_api_key_breakdown_guide';
    }
    
    async testConnection() {
        try {
            const response = await this.makeApiCall('GET', '/health');
            this.connected = response.status === 'healthy';
            console.log(`🔧 TracerIt connection: ${this.connected ? 'Connected' : 'Failed'}`);
        } catch (error) {
            console.error('❌ TracerIt connection test failed:', error);
            this.connected = false;
        }
    }
    
    setupRealTimeIntegration() {
        // Listen for breakdown assessments that require work orders
        window.addEventListener('breakdown-assessment-complete', (event) => {
            this.handleBreakdownAssessment(event.detail);
        });
        
        // Listen for real-time job updates
        if (window.RealTime) {
            window.RealTime.onMessage('tracerit_job_update', (message) => {
                this.handleJobUpdate(message);
            });
        }
        
        // Periodic job status sync
        setInterval(() => {
            this.syncActiveJobs();
        }, 60000); // Every minute
    }
    
    async handleBreakdownAssessment(assessmentData) {
        const { decision, breakdown_id, vehicle_id, issue_description, location } = assessmentData;
        
        // Only create work orders for STOP and AMBER decisions
        if (decision === 'CONTINUE') {
            console.log('🟢 No work order needed for CONTINUE decision');
            return;
        }
        
        console.log('🔧 Creating TracerIt work order for breakdown:', breakdown_id);
        
        try {
            const workOrder = await this.createWorkOrder({
                breakdownId: breakdown_id,
                vehicleId: vehicle_id,
                priority: this.config.priorityLevels[decision],
                description: issue_description,
                location: location,
                reportedBy: assessmentData.supervisor_id || 'System',
                categoryCode: this.determineJobCategory(assessmentData),
                urgency: decision === 'STOP' ? 'Emergency' : 'Urgent'
            });
            
            console.log('✅ Work order created:', workOrder.jobNumber);
            
            // Notify breakdown system
            this.notifyWorkOrderCreated(breakdown_id, workOrder);
            
            return workOrder;
            
        } catch (error) {
            console.error('❌ Failed to create work order:', error);
            this.queueJobForRetry(assessmentData);
        }
    }
    
    async createWorkOrder(jobData) {
        const workOrderRequest = {
            vehicle: {
                fleetNumber: jobData.vehicleId,
                registration: await this.getVehicleRegistration(jobData.vehicleId)
            },
            job: {
                category: jobData.categoryCode,
                priority: jobData.priority,
                urgency: jobData.urgency,
                description: jobData.description,
                reportedBy: jobData.reportedBy,
                reportedDate: new Date().toISOString(),
                location: jobData.location
            },
            breakdown: {
                id: jobData.breakdownId,
                status: 'Work Order Created',
                engineerRequired: true
            },
            scheduling: {
                requestedBy: new Date().toISOString(),
                maxResponseTime: jobData.urgency === 'Emergency' ? 30 : 120 // minutes
            }
        };
        
        const response = await this.makeApiCall('POST', '/workorders', workOrderRequest);
        
        // Store job for tracking
        this.activeJobs.set(response.jobNumber, {
            ...response,
            breakdownId: jobData.breakdownId,
            createdAt: Date.now(),
            lastStatusCheck: Date.now()
        });
        
        return response;
    }
    
    determineJobCategory(assessmentData) {
        const { assessment_type, safety_evaluation } = assessmentData;
        
        if (safety_evaluation?.immediate_danger) {
            return 'SAFETY_CRITICAL';
        }
        
        if (assessment_type?.includes('brake')) {
            return 'BRAKE_SYSTEM';
        } else if (assessment_type?.includes('steering')) {
            return 'STEERING_SYSTEM';
        } else if (assessment_type?.includes('engine')) {
            return 'ENGINE_MECHANICAL';
        } else if (assessment_type?.includes('electrical')) {
            return 'ELECTRICAL_SYSTEM';
        } else if (assessment_type?.includes('door')) {
            return 'DOOR_SYSTEM';
        } else {
            return 'GENERAL_MAINTENANCE';
        }
    }
    
    async getVehicleRegistration(fleetNumber) {
        try {
            const response = await this.makeApiCall('GET', `/vehicles/${fleetNumber}`);
            return response.registration;
        } catch (error) {
            console.warn('⚠️ Could not fetch vehicle registration:', error);
            return `Fleet ${fleetNumber}`;
        }
    }
    
    async checkPartsAvailability(jobNumber, partNumbers) {
        try {
            const response = await this.makeApiCall('POST', `/jobs/${jobNumber}/parts/check`, {
                parts: partNumbers
            });
            
            return response.availability;
        } catch (error) {
            console.error('❌ Parts availability check failed:', error);
            return null;
        }
    }
    
    async requestEngineerDispatch(jobNumber, engineerPreference = null) {
        try {
            const dispatchRequest = {
                jobNumber: jobNumber,
                requestedTime: new Date().toISOString(),
                preferredEngineer: engineerPreference,
                urgency: this.activeJobs.get(jobNumber)?.urgency || 'Standard'
            };
            
            const response = await this.makeApiCall('POST', `/jobs/${jobNumber}/dispatch`, dispatchRequest);
            
            console.log('🚗 Engineer dispatch requested:', response.dispatchId);
            
            // Update job status
            if (this.activeJobs.has(jobNumber)) {
                const job = this.activeJobs.get(jobNumber);
                job.dispatchId = response.dispatchId;
                job.engineerAssigned = response.engineerName;
                job.estimatedArrival = response.estimatedArrival;
                this.activeJobs.set(jobNumber, job);
            }
            
            return response;
            
        } catch (error) {
            console.error('❌ Engineer dispatch request failed:', error);
            throw error;
        }
    }
    
    async updateJobStatus(jobNumber, status, notes = '') {
        try {
            const updateData = {
                status: status,
                updatedBy: 'Breakdown Guide System',
                updatedAt: new Date().toISOString(),
                notes: notes
            };
            
            const response = await this.makeApiCall('PUT', `/jobs/${jobNumber}/status`, updateData);
            
            // Update local job data
            if (this.activeJobs.has(jobNumber)) {
                const job = this.activeJobs.get(jobNumber);
                job.status = status;
                job.lastUpdate = Date.now();
                this.activeJobs.set(jobNumber, job);
            }
            
            // Notify listeners
            this.notifyJobStatusChange(jobNumber, status, notes);
            
            return response;
            
        } catch (error) {
            console.error('❌ Job status update failed:', error);
            throw error;
        }
    }
    
    async getJobStatus(jobNumber) {
        try {
            const response = await this.makeApiCall('GET', `/jobs/${jobNumber}/status`);
            
            // Update local job data
            if (this.activeJobs.has(jobNumber)) {
                const job = this.activeJobs.get(jobNumber);
                job.status = response.status;
                job.lastStatusCheck = Date.now();
                this.activeJobs.set(jobNumber, job);
            }
            
            return response;
            
        } catch (error) {
            console.error('❌ Job status check failed:', error);
            return null;
        }
    }
    
    async syncActiveJobs() {
        if (!this.connected) return;
        
        const jobPromises = Array.from(this.activeJobs.keys()).map(async (jobNumber) => {
            try {
                const status = await this.getJobStatus(jobNumber);
                if (status && status.status === 'Completed') {
                    // Remove completed jobs from active tracking
                    this.activeJobs.delete(jobNumber);
                }
            } catch (error) {
                console.error(`❌ Failed to sync job ${jobNumber}:`, error);
            }
        });
        
        await Promise.allSettled(jobPromises);
        console.log(`🔄 Synced ${this.activeJobs.size} active jobs`);
    }
    
    handleJobUpdate(message) {
        const { jobNumber, status, engineer, estimatedArrival } = message;
        
        console.log('📧 TracerIt job update:', jobNumber, status);
        
        if (this.activeJobs.has(jobNumber)) {
            const job = this.activeJobs.get(jobNumber);
            job.status = status;
            job.engineerAssigned = engineer;
            job.estimatedArrival = estimatedArrival;
            job.lastUpdate = Date.now();
            this.activeJobs.set(jobNumber, job);
        }
        
        this.notifyJobStatusChange(jobNumber, status);
    }
    
    notifyWorkOrderCreated(breakdownId, workOrder) {
        window.dispatchEvent(new CustomEvent('tracerit-workorder-created', {
            detail: {
                breakdownId,
                jobNumber: workOrder.jobNumber,
                priority: workOrder.priority,
                engineerRequired: true
            }
        }));
        
        // Show in-app notification
        if (window.PushNotificationManager) {
            window.PushNotificationManager.showInAppNotification(
                `Work order ${workOrder.jobNumber} created for breakdown ${breakdownId}`,
                'success'
            );
        }
    }
    
    notifyJobStatusChange(jobNumber, status, notes = '') {
        window.dispatchEvent(new CustomEvent('tracerit-job-status-change', {
            detail: {
                jobNumber,
                status,
                notes,
                timestamp: Date.now()
            }
        }));
        
        // Notify specific listeners
        if (this.jobStatusListeners.has(jobNumber)) {
            const listeners = this.jobStatusListeners.get(jobNumber);
            listeners.forEach(callback => {
                try {
                    callback(status, notes);
                } catch (error) {
                    console.error('❌ Job status listener error:', error);
                }
            });
        }
    }
    
    queueJobForRetry(jobData) {
        this.jobQueue.push({
            ...jobData,
            attempts: 0,
            queuedAt: Date.now()
        });
        
        console.log('📥 Job queued for retry:', jobData.breakdown_id);
    }
    
    async processJobQueue() {
        if (!this.connected || this.jobQueue.length === 0) return;
        
        const jobsToProcess = this.jobQueue.slice();
        this.jobQueue = [];
        
        for (const queuedJob of jobsToProcess) {
            if (queuedJob.attempts < this.config.retryAttempts) {
                queuedJob.attempts++;
                
                try {
                    await this.handleBreakdownAssessment(queuedJob);
                    console.log('✅ Queued job processed:', queuedJob.breakdown_id);
                } catch (error) {
                    console.error('❌ Queued job failed again:', error);
                    
                    if (queuedJob.attempts < this.config.retryAttempts) {
                        this.jobQueue.push(queuedJob);
                    } else {
                        console.error('❌ Job permanently failed:', queuedJob.breakdown_id);
                    }
                }
                
                // Small delay between retries
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            }
        }
    }
    
    async makeApiCall(method, endpoint, data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-System-Source': 'BreakdownGuide'
            },
            timeout: this.config.timeout
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`TracerIt API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Public API methods
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }
    
    getJobByBreakdownId(breakdownId) {
        return Array.from(this.activeJobs.values()).find(job => job.breakdownId === breakdownId);
    }
    
    onJobStatusChange(jobNumber, callback) {
        if (!this.jobStatusListeners.has(jobNumber)) {
            this.jobStatusListeners.set(jobNumber, new Set());
        }
        this.jobStatusListeners.get(jobNumber).add(callback);
    }
    
    offJobStatusChange(jobNumber, callback) {
        if (this.jobStatusListeners.has(jobNumber)) {
            this.jobStatusListeners.get(jobNumber).delete(callback);
        }
    }
    
    isConnected() {
        return this.connected;
    }
    
    // Demo/testing methods
    simulateJobUpdate(jobNumber, status) {
        this.handleJobUpdate({
            jobNumber,
            status,
            engineer: 'Demo Engineer',
            estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 mins
        });
    }
    
    getQueuedJobs() {
        return this.jobQueue.length;
    }
}

// TracerIt Status Component
const TracerItStatus = ({ breakdownId }) => {
    const [job, setJob] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        if (window.TracerItIntegration && breakdownId) {
            // Get job for this breakdown
            const foundJob = window.TracerItIntegration.getJobByBreakdownId(breakdownId);
            setJob(foundJob);
            setLoading(false);
            
            // Listen for job updates
            const handleJobUpdate = (event) => {
                const { jobNumber, status } = event.detail;
                if (foundJob && foundJob.jobNumber === jobNumber) {
                    setJob(prev => ({ ...prev, status }));
                }
            };
            
            window.addEventListener('tracerit-job-status-change', handleJobUpdate);
            
            return () => {
                window.removeEventListener('tracerit-job-status-change', handleJobUpdate);
            };
        }
    }, [breakdownId]);
    
    if (loading) {
        return React.createElement('div', {
            className: 'p-3 bg-gray-800/40 rounded-lg border border-gray-600/30'
        }, [
            React.createElement('div', {
                key: 'loading',
                className: 'text-sm text-gray-300'
            }, '🔧 Checking TracerIt status...')
        ]);
    }
    
    if (!job) {
        return React.createElement('div', {
            className: 'p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'no-job',
                className: 'text-sm text-blue-200'
            }, '📋 No work order required')
        ]);
    }
    
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'created': return 'text-blue-200';
            case 'assigned': return 'text-amber-200';
            case 'in_progress': return 'text-green-200';
            case 'completed': return 'text-green-400';
            case 'cancelled': return 'text-red-200';
            default: return 'text-gray-200';
        }
    };
    
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'created': return '📋';
            case 'assigned': return '👨‍🔧';
            case 'in_progress': return '🔧';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '📄';
        }
    };
    
    return React.createElement('div', {
        className: 'p-4 bg-green-500/10 border border-green-400/30 rounded-lg space-y-3'
    }, [
        React.createElement('div', {
            key: 'header',
            className: 'flex items-center justify-between'
        }, [
            React.createElement('div', {
                key: 'title',
                className: 'text-sm font-medium text-green-200'
            }, '🔧 TracerIt Work Order'),
            React.createElement('div', {
                key: 'status',
                className: `text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`
            }, `${getStatusIcon(job.status)} ${job.status}`)
        ]),
        
        React.createElement('div', {
            key: 'details',
            className: 'space-y-2'
        }, [
            React.createElement('div', {
                key: 'job-number',
                className: 'text-xs text-green-300'
            }, `Job Number: ${job.jobNumber}`),
            
            job.engineerAssigned && React.createElement('div', {
                key: 'engineer',
                className: 'text-xs text-green-300'
            }, `Engineer: ${job.engineerAssigned}`),
            
            job.estimatedArrival && React.createElement('div', {
                key: 'eta',
                className: 'text-xs text-green-300'
            }, `ETA: ${new Date(job.estimatedArrival).toLocaleTimeString()}`),
            
            React.createElement('div', {
                key: 'priority',
                className: 'text-xs text-green-300'
            }, `Priority: ${job.priority}`)
        ])
    ]);
};

// Initialize TracerIt integration
window.TracerItIntegration = new TracerItIntegration();

// Export components and utilities
window.TracerItStatus = TracerItStatus;
window.TracerIt = {
    isConnected: () => window.TracerItIntegration.isConnected(),
    getActiveJobs: () => window.TracerItIntegration.getActiveJobs(),
    createWorkOrder: (data) => window.TracerItIntegration.createWorkOrder(data),
    updateJobStatus: (jobNumber, status, notes) => window.TracerItIntegration.updateJobStatus(jobNumber, status, notes),
    checkPartsAvailability: (jobNumber, parts) => window.TracerItIntegration.checkPartsAvailability(jobNumber, parts),
    requestEngineerDispatch: (jobNumber, engineer) => window.TracerItIntegration.requestEngineerDispatch(jobNumber, engineer),
    onJobStatusChange: (jobNumber, callback) => window.TracerItIntegration.onJobStatusChange(jobNumber, callback)
};

console.log('🔧 TracerIt integration system loaded');
