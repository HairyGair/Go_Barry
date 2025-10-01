/**
 * Enhanced Passenger Cloud Integration
 * Phase 2 Priority 5: Advanced service management and passenger communication
 * 
 * Features:
 * - Automatic service adjustment during breakdowns
 * - Real-time passenger notifications
 * - Alternative route suggestions
 * - Service cancellation and replacement management
 * - Journey disruption tracking and reporting
 */

class PassengerCloudIntegration {
    constructor() {
        this.apiBaseUrl = this.getApiBaseUrl();
        this.apiKey = this.getApiKey();
        this.connected = false;
        this.activeDisruptions = new Map();
        this.serviceAdjustments = new Map();
        this.notificationQueue = [];
        
        this.config = {
            maxNotificationDelay: 5000, // 5 seconds
            retryAttempts: 3,
            serviceAdjustmentTimeout: 120000, // 2 minutes
            priorityRoutes: ['X10', 'X21', '1', '307'],
            notificationChannels: ['app', 'website', 'stops', 'sms']
        };
        
        this.init();
    }
    
    init() {
        console.log('🚌 Passenger Cloud Integration initializing...');
        
        // Test API connection
        this.testConnection();
        
        // Set up breakdown event handlers
        this.setupBreakdownHandlers();
        
        // Set up real-time integration
        this.setupRealTimeIntegration();
        
        // Process notification queue
        this.processNotificationQueue();
        
        console.log('✅ Passenger Cloud Integration initialized');
    }
    
    getApiBaseUrl() {
        return process.env.PASSENGER_CLOUD_API_URL || 'https://api.passengercloud.gonortheast.co.uk';
    }
    
    getApiKey() {
        return process.env.PASSENGER_CLOUD_API_KEY || 'demo_passenger_cloud_key';
    }
    
    async testConnection() {
        try {
            const response = await this.makeApiCall('GET', '/health');
            this.connected = response.status === 'operational';
            console.log(`🚌 Passenger Cloud connection: ${this.connected ? 'Connected' : 'Failed'}`);
        } catch (error) {
            console.error('❌ Passenger Cloud connection test failed:', error);
            this.connected = false;
        }
    }
    
    setupBreakdownHandlers() {
        // Listen for breakdown assessments
        window.addEventListener('breakdown-assessment-complete', (event) => {
            this.handleBreakdownAssessment(event.detail);
        });
        
        // Listen for breakdown status changes
        window.addEventListener('breakdown-status-change', (event) => {
            this.handleBreakdownStatusChange(event.detail);
        });
        
        // Listen for work order updates
        window.addEventListener('tracerit-workorder-created', (event) => {
            this.handleWorkOrderCreated(event.detail);
        });
    }
    
    setupRealTimeIntegration() {
        if (window.RealTime) {
            window.RealTime.onMessage('passenger_cloud_update', (message) => {
                this.handlePassengerCloudUpdate(message);
            });
            
            window.RealTime.onMessage('service_adjustment_complete', (message) => {
                this.handleServiceAdjustmentComplete(message);
            });
        }
    }
    
    async handleBreakdownAssessment(assessmentData) {
        const { decision, breakdown_id, vehicle_id, route_id, location } = assessmentData;
        
        console.log('🚌 Processing breakdown for passenger impact:', breakdown_id);
        
        try {
            // Determine service impact
            const serviceImpact = this.assessServiceImpact(assessmentData);
            
            if (serviceImpact.requiresAction) {
                // Create service disruption record
                const disruption = await this.createServiceDisruption({
                    breakdownId: breakdown_id,
                    vehicleId: vehicle_id,
                    routeId: route_id,
                    location: location,
                    severity: this.mapDecisionToSeverity(decision),
                    estimatedDuration: this.estimateDisruptionDuration(decision),
                    affectedServices: serviceImpact.affectedServices,
                    alternativeOptions: serviceImpact.alternatives
                });
                
                console.log('📋 Service disruption created:', disruption.disruptionId);
                
                // Send passenger notifications
                await this.sendPassengerNotifications(disruption);
                
                // Suggest service adjustments
                if (serviceImpact.requiresReplacement) {
                    await this.suggestServiceAdjustments(disruption);
                }
                
                return disruption;
            }
            
        } catch (error) {
            console.error('❌ Failed to process passenger impact:', error);
            this.queueNotificationForRetry(assessmentData);
        }
    }
    
    assessServiceImpact(assessmentData) {
        const { decision, route_id, vehicle_id, time_of_day } = assessmentData;
        
        const isPriorityRoute = this.config.priorityRoutes.includes(route_id);
        const isPeakTime = this.isPeakTime(time_of_day);
        
        const impact = {
            requiresAction: decision !== 'CONTINUE',
            requiresReplacement: decision === 'STOP',
            severity: this.calculateImpactSeverity(decision, isPriorityRoute, isPeakTime),
            affectedServices: this.getAffectedServices(route_id, vehicle_id),
            alternatives: this.findAlternativeServices(route_id),
            estimatedPassengerCount: this.estimateAffectedPassengers(route_id, time_of_day)
        };
        
        return impact;
    }
    
    calculateImpactSeverity(decision, isPriorityRoute, isPeakTime) {
        let severity = 1; // Base severity
        
        if (decision === 'STOP') severity += 3;
        else if (decision === 'AMBER') severity += 1;
        
        if (isPriorityRoute) severity += 2;
        if (isPeakTime) severity += 1;
        
        // Return severity level
        if (severity >= 5) return 'Critical';
        if (severity >= 3) return 'High';
        if (severity >= 2) return 'Medium';
        return 'Low';
    }
    
    isPeakTime(timeOfDay) {
        const hour = new Date().getHours();
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    }
    
    getAffectedServices(routeId, vehicleId) {
        // In a real system, this would query current service schedules
        return [
            {
                routeId: routeId,
                direction: 'Outbound',
                nextDepartures: ['14:30', '14:45', '15:00'],
                affectedStops: this.getRouteStops(routeId)
            }
        ];
    }
    
    findAlternativeServices(routeId) {
        // Suggest alternative routes and transport options
        const alternatives = [];
        
        // Same operator alternatives
        if (routeId === 'X21') {
            alternatives.push({
                type: 'alternative_route',
                routeId: '21',
                description: 'Route 21 serves similar destinations',
                additionalTime: 15
            });
        }
        
        // Metro alternatives
        alternatives.push({
            type: 'metro',
            description: 'Tyne and Wear Metro available',
            stations: ['Central Station', 'Monument'],
            additionalTime: 10
        });
        
        // Other operators
        alternatives.push({
            type: 'other_operator',
            operator: 'Stagecoach',
            routes: ['38', '39'],
            description: 'Alternative operator services available'
        });
        
        return alternatives;
    }
    
    estimateAffectedPassengers(routeId, timeOfDay) {
        // Estimate passenger impact based on route and time
        const routeMultipliers = {
            'X10': 150,
            'X21': 120,
            '1': 80,
            '307': 40
        };
        
        const timeMultiplier = this.isPeakTime(timeOfDay) ? 1.5 : 1.0;
        const baseCount = routeMultipliers[routeId] || 30;
        
        return Math.round(baseCount * timeMultiplier);
    }
    
    async createServiceDisruption(disruptionData) {
        const disruption = {
            disruptionId: `DIS-${Date.now()}`,
            breakdownId: disruptionData.breakdownId,
            type: 'Vehicle Breakdown',
            severity: disruptionData.severity,
            status: 'Active',
            affectedServices: disruptionData.affectedServices,
            location: disruptionData.location,
            startTime: new Date().toISOString(),
            estimatedEndTime: new Date(Date.now() + disruptionData.estimatedDuration).toISOString(),
            alternatives: disruptionData.alternativeOptions,
            lastUpdated: new Date().toISOString()
        };
        
        const response = await this.makeApiCall('POST', '/disruptions', disruption);
        
        // Store locally for tracking
        this.activeDisruptions.set(disruption.disruptionId, response);
        
        return response;
    }
    
    async sendPassengerNotifications(disruption) {
        console.log('📢 Sending passenger notifications for disruption:', disruption.disruptionId);
        
        const notifications = [];
        
        // App notification
        notifications.push(this.createAppNotification(disruption));
        
        // Website banner
        notifications.push(this.createWebsiteBanner(disruption));
        
        // Bus stop displays
        notifications.push(this.createBusStopNotifications(disruption));
        
        // SMS for registered passengers (if critical)
        if (disruption.severity === 'Critical') {
            notifications.push(this.createSMSNotifications(disruption));
        }
        
        // Send all notifications
        const results = await Promise.allSettled(
            notifications.map(notification => this.sendNotification(notification))
        );
        
        console.log(`📤 Sent ${results.filter(r => r.status === 'fulfilled').length}/${results.length} notifications`);
        
        return results;
    }
    
    createAppNotification(disruption) {
        return {
            channel: 'app',
            type: 'service_disruption',
            title: `${disruption.affectedServices[0]?.routeId} Service Disruption`,
            message: `Due to a vehicle breakdown, services are currently disrupted. Alternative options available.`,
            data: {
                disruptionId: disruption.disruptionId,
                severity: disruption.severity,
                alternatives: disruption.alternatives
            },
            priority: disruption.severity === 'Critical' ? 'high' : 'normal'
        };
    }
    
    createWebsiteBanner(disruption) {
        return {
            channel: 'website',
            type: 'banner',
            content: {
                title: 'Service Disruption',
                message: `Route ${disruption.affectedServices[0]?.routeId} experiencing delays due to vehicle breakdown`,
                severity: disruption.severity,
                showAlternatives: true,
                alternatives: disruption.alternatives
            },
            displayUntil: disruption.estimatedEndTime
        };
    }
    
    createBusStopNotifications(disruption) {
        const affectedStops = [];
        disruption.affectedServices.forEach(service => {
            if (service.affectedStops) {
                affectedStops.push(...service.affectedStops);
            }
        });
        
        return {
            channel: 'bus_stops',
            type: 'display_update',
            stops: affectedStops,
            message: `Service disruption - check alternative routes`,
            alternatives: disruption.alternatives.slice(0, 2), // Limit for display space
            priority: disruption.severity
        };
    }
    
    createSMSNotifications(disruption) {
        return {
            channel: 'sms',
            type: 'emergency_alert',
            criteria: {
                routes: disruption.affectedServices.map(s => s.routeId),
                timeWindow: 60 // Next 60 minutes
            },
            message: `Go North East: ${disruption.affectedServices[0]?.routeId} service disrupted due to breakdown. Alternative options: ${disruption.alternatives[0]?.description}. More info: gne.co.uk`,
            priority: 'high'
        };
    }
    
    async sendNotification(notification) {
        try {
            const response = await this.makeApiCall('POST', '/notifications', notification);
            console.log(`✅ ${notification.channel} notification sent`);
            return response;
        } catch (error) {
            console.error(`❌ Failed to send ${notification.channel} notification:`, error);
            throw error;
        }
    }
    
    async suggestServiceAdjustments(disruption) {
        console.log('🔄 Suggesting service adjustments for disruption:', disruption.disruptionId);
        
        const suggestions = {
            disruptionId: disruption.disruptionId,
            adjustmentType: 'vehicle_replacement',
            options: [
                {
                    type: 'replacement_vehicle',
                    description: 'Deploy spare vehicle from depot',
                    estimatedTime: 20,
                    confidence: 'High',
                    impact: 'Minimal service gap'
                },
                {
                    type: 'service_merge',
                    description: 'Merge with next scheduled service',
                    estimatedTime: 5,
                    confidence: 'Medium',
                    impact: 'Slightly longer wait times'
                },
                {
                    type: 'route_diversion',
                    description: 'Divert other vehicles to cover route',
                    estimatedTime: 15,
                    confidence: 'Medium',
                    impact: 'Temporary route changes'
                }
            ],
            recommendedOption: 0, // First option
            automaticApprovalAvailable: disruption.severity !== 'Critical'
        };
        
        const response = await this.makeApiCall('POST', '/adjustments/suggest', suggestions);
        
        // Store adjustment for tracking
        this.serviceAdjustments.set(disruption.disruptionId, response);
        
        // Notify breakdown system
        this.notifyServiceAdjustmentSuggested(disruption.disruptionId, response);
        
        return response;
    }
    
    async approveServiceAdjustment(adjustmentId, optionIndex) {
        try {
            const response = await this.makeApiCall('POST', `/adjustments/${adjustmentId}/approve`, {
                selectedOption: optionIndex,
                approvedBy: 'BreakdownGuide',
                approvedAt: new Date().toISOString()
            });
            
            console.log('✅ Service adjustment approved:', adjustmentId);
            
            // Update local tracking
            if (this.serviceAdjustments.has(adjustmentId)) {
                const adjustment = this.serviceAdjustments.get(adjustmentId);
                adjustment.status = 'Approved';
                adjustment.selectedOption = optionIndex;
                this.serviceAdjustments.set(adjustmentId, adjustment);
            }
            
            return response;
            
        } catch (error) {
            console.error('❌ Failed to approve service adjustment:', error);
            throw error;
        }
    }
    
    async updateDisruptionStatus(disruptionId, status, notes = '') {
        try {
            const response = await this.makeApiCall('PUT', `/disruptions/${disruptionId}`, {
                status: status,
                notes: notes,
                updatedAt: new Date().toISOString(),
                updatedBy: 'BreakdownGuide'
            });
            
            // Update local tracking
            if (this.activeDisruptions.has(disruptionId)) {
                const disruption = this.activeDisruptions.get(disruptionId);
                disruption.status = status;
                disruption.lastUpdated = new Date().toISOString();
                this.activeDisruptions.set(disruptionId, disruption);
            }
            
            // If resolved, send resolution notifications
            if (status === 'Resolved') {
                await this.sendResolutionNotifications(disruptionId);
            }
            
            return response;
            
        } catch (error) {
            console.error('❌ Failed to update disruption status:', error);
            throw error;
        }
    }
    
    async sendResolutionNotifications(disruptionId) {
        const disruption = this.activeDisruptions.get(disruptionId);
        if (!disruption) return;
        
        const resolutionNotification = {
            channel: 'app',
            type: 'disruption_resolved',
            title: 'Service Restored',
            message: `${disruption.affectedServices[0]?.routeId} service has been restored to normal operation`,
            data: {
                disruptionId: disruptionId,
                resolvedAt: new Date().toISOString()
            }
        };
        
        await this.sendNotification(resolutionNotification);
        console.log('📢 Resolution notification sent for:', disruptionId);
    }
    
    handlePassengerCloudUpdate(message) {
        const { disruptionId, status, update } = message;
        console.log('📧 Passenger Cloud update:', disruptionId, status);
        
        if (this.activeDisruptions.has(disruptionId)) {
            const disruption = this.activeDisruptions.get(disruptionId);
            disruption.status = status;
            disruption.lastUpdated = Date.now();
            this.activeDisruptions.set(disruptionId, disruption);
        }
        
        // Notify breakdown system
        window.dispatchEvent(new CustomEvent('passenger-cloud-update', {
            detail: { disruptionId, status, update }
        }));
    }
    
    handleServiceAdjustmentComplete(message) {
        const { adjustmentId, status, details } = message;
        console.log('🔄 Service adjustment complete:', adjustmentId);
        
        if (this.serviceAdjustments.has(adjustmentId)) {
            const adjustment = this.serviceAdjustments.get(adjustmentId);
            adjustment.status = status;
            adjustment.completedAt = Date.now();
            this.serviceAdjustments.set(adjustmentId, adjustment);
        }
        
        // Notify breakdown system
        window.dispatchEvent(new CustomEvent('service-adjustment-complete', {
            detail: { adjustmentId, status, details }
        }));
    }
    
    notifyServiceAdjustmentSuggested(disruptionId, suggestions) {
        window.dispatchEvent(new CustomEvent('service-adjustment-suggested', {
            detail: { disruptionId, suggestions }
        }));
        
        // Show in-app notification
        if (window.PushNotificationManager) {
            window.PushNotificationManager.showInAppNotification(
                `Service adjustment options suggested for disruption ${disruptionId}`,
                'info'
            );
        }
    }
    
    queueNotificationForRetry(assessmentData) {
        this.notificationQueue.push({
            ...assessmentData,
            attempts: 0,
            queuedAt: Date.now()
        });
    }
    
    async processNotificationQueue() {
        if (!this.connected || this.notificationQueue.length === 0) return;
        
        const notifications = this.notificationQueue.slice();
        this.notificationQueue = [];
        
        for (const notification of notifications) {
            if (notification.attempts < this.config.retryAttempts) {
                notification.attempts++;
                
                try {
                    await this.handleBreakdownAssessment(notification);
                } catch (error) {
                    if (notification.attempts < this.config.retryAttempts) {
                        this.notificationQueue.push(notification);
                    }
                }
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
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Passenger Cloud API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Utility methods
    mapDecisionToSeverity(decision) {
        switch (decision) {
            case 'STOP': return 'Critical';
            case 'AMBER': return 'High';
            case 'CONTINUE': return 'Low';
            default: return 'Medium';
        }
    }
    
    estimateDisruptionDuration(decision) {
        switch (decision) {
            case 'STOP': return 90 * 60 * 1000; // 90 minutes
            case 'AMBER': return 30 * 60 * 1000; // 30 minutes
            case 'CONTINUE': return 10 * 60 * 1000; // 10 minutes
            default: return 60 * 60 * 1000; // 60 minutes
        }
    }
    
    getRouteStops(routeId) {
        // Mock route stops - in production this would come from route data
        const routeStops = {
            'X21': ['Newcastle', 'Gateshead', 'Team Valley', 'Durham'],
            'X10': ['Newcastle', 'Hexham', 'Carlisle'],
            '1': ['Newcastle', 'Gateshead', 'Blaydon'],
            '307': ['Newcastle', 'Gosforth', 'Cramlington']
        };
        
        return routeStops[routeId] || ['Various stops'];
    }
    
    // Public API methods
    getActiveDisruptions() {
        return Array.from(this.activeDisruptions.values());
    }
    
    getDisruptionByBreakdownId(breakdownId) {
        return Array.from(this.activeDisruptions.values()).find(d => d.breakdownId === breakdownId);
    }
    
    getServiceAdjustments() {
        return Array.from(this.serviceAdjustments.values());
    }
    
    isConnected() {
        return this.connected;
    }
}

// Passenger Impact Component
const PassengerImpactStatus = ({ breakdownId }) => {
    const [disruption, setDisruption] = React.useState(null);
    const [adjustment, setAdjustment] = React.useState(null);
    
    React.useEffect(() => {
        if (window.PassengerCloudIntegration && breakdownId) {
            const foundDisruption = window.PassengerCloudIntegration.getDisruptionByBreakdownId(breakdownId);
            setDisruption(foundDisruption);
            
            // Listen for updates
            const handleUpdate = (event) => {
                const { disruptionId } = event.detail;
                if (foundDisruption && foundDisruption.disruptionId === disruptionId) {
                    const updated = window.PassengerCloudIntegration.getDisruptionByBreakdownId(breakdownId);
                    setDisruption(updated);
                }
            };
            
            const handleAdjustmentSuggested = (event) => {
                const { disruptionId, suggestions } = event.detail;
                if (foundDisruption && foundDisruption.disruptionId === disruptionId) {
                    setAdjustment(suggestions);
                }
            };
            
            window.addEventListener('passenger-cloud-update', handleUpdate);
            window.addEventListener('service-adjustment-suggested', handleAdjustmentSuggested);
            
            return () => {
                window.removeEventListener('passenger-cloud-update', handleUpdate);
                window.removeEventListener('service-adjustment-suggested', handleAdjustmentSuggested);
            };
        }
    }, [breakdownId]);
    
    if (!disruption) {
        return React.createElement('div', {
            className: 'p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'no-impact',
                className: 'text-sm text-blue-200'
            }, '🚌 No passenger impact expected')
        ]);
    }
    
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'text-red-200 bg-red-500/20 border-red-400/30';
            case 'High': return 'text-amber-200 bg-amber-500/20 border-amber-400/30';
            case 'Medium': return 'text-yellow-200 bg-yellow-500/20 border-yellow-400/30';
            case 'Low': return 'text-green-200 bg-green-500/20 border-green-400/30';
            default: return 'text-gray-200 bg-gray-500/20 border-gray-400/30';
        }
    };
    
    return React.createElement('div', {
        className: 'space-y-3'
    }, [
        // Disruption status
        React.createElement('div', {
            key: 'disruption',
            className: `p-4 rounded-lg border ${getSeverityColor(disruption.severity)}`
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'flex items-center justify-between mb-2'
            }, [
                React.createElement('div', {
                    key: 'title',
                    className: 'text-sm font-medium'
                }, '🚌 Passenger Impact'),
                React.createElement('div', {
                    key: 'severity',
                    className: 'text-xs px-2 py-1 rounded bg-white/10'
                }, disruption.severity)
            ]),
            
            React.createElement('div', {
                key: 'details',
                className: 'space-y-1 text-xs'
            }, [
                React.createElement('div', { key: 'route' }, 
                    `Affected: ${disruption.affectedServices.map(s => s.routeId).join(', ')}`
                ),
                React.createElement('div', { key: 'status' }, 
                    `Status: ${disruption.status}`
                ),
                disruption.alternatives.length > 0 && React.createElement('div', { key: 'alternatives' }, 
                    `Alternatives: ${disruption.alternatives.length} options available`
                )
            ])
        ]),
        
        // Service adjustment suggestions
        adjustment && React.createElement('div', {
            key: 'adjustment',
            className: 'p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'adj-title',
                className: 'text-sm font-medium text-purple-200 mb-2'
            }, '🔄 Service Adjustment Suggested'),
            
            React.createElement('div', {
                key: 'recommended',
                className: 'text-xs text-purple-300'
            }, `Recommended: ${adjustment.options[adjustment.recommendedOption]?.description}`)
        ])
    ]);
};

// Initialize Passenger Cloud integration
window.PassengerCloudIntegration = new PassengerCloudIntegration();

// Export components and utilities
window.PassengerImpactStatus = PassengerImpactStatus;
window.PassengerCloud = {
    isConnected: () => window.PassengerCloudIntegration.isConnected(),
    getActiveDisruptions: () => window.PassengerCloudIntegration.getActiveDisruptions(),
    updateDisruptionStatus: (id, status, notes) => window.PassengerCloudIntegration.updateDisruptionStatus(id, status, notes),
    approveServiceAdjustment: (id, option) => window.PassengerCloudIntegration.approveServiceAdjustment(id, option),
    getServiceAdjustments: () => window.PassengerCloudIntegration.getServiceAdjustments()
};

console.log('🚌 Enhanced Passenger Cloud integration loaded');
