/**
 * Assessment Broadcaster Service
 * Broadcasts real-time assessment progress to SDC Dashboard
 *
 * This service bridges the gap between the breakdown guide wizards
 * and the SDC Operations Dashboard, enabling live tracking of assessments
 * Supabase removed - now uses backend MySQL API with WebSocket
 */

// Supabase import removed - no longer using Supabase for authentication

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://breakdowns.gobarry.co.uk/api';

class AssessmentBroadcaster {
    constructor() {
        this.assessmentId = null;
        this.breakdownId = null;
        this.wizardType = null;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.startTime = null;
        this.supervisor = null;
        this.vehicle = null;
        this.location = null;
        this.route = null;
        
        // WebSocket connection for real-time updates
        this.ws = null;
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }
    
    /**
     * Initialize assessment tracking
     * Called when a wizard starts
     */
    initAssessment(data) {
        this.assessmentId = data.assessmentId || `ASSESS-${Date.now()}`;
        this.breakdownId = data.breakdownId;
        this.wizardType = data.wizardType;
        this.totalSteps = data.totalSteps || 5; // Default to 5 steps
        this.currentStep = 1;
        this.startTime = new Date();
        this.supervisor = data.supervisor || this.getSupervisorFromStorage();
        this.vehicle = data.vehicle;
        this.location = data.location;
        this.route = data.route;
        
        // Connect WebSocket if not connected
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connectWebSocket();
        }
        
        // Broadcast assessment started
        this.broadcastUpdate({
            type: 'assessment_started',
            assessmentId: this.assessmentId,
            breakdownId: this.breakdownId,
            wizardType: this.wizardType,
            totalSteps: this.totalSteps,
            currentStep: this.currentStep,
            stepDescription: this.getStepDescription(this.wizardType, 1),
            supervisor: this.supervisor,
            vehicle: this.vehicle,
            location: this.location,
            route: this.route,
            estimatedCompletion: this.estimateCompletion(),
            startTime: this.startTime.toISOString()
        });
        
        console.log('🚀 Assessment broadcasting initialized:', {
            assessmentId: this.assessmentId,
            wizardType: this.wizardType,
            supervisor: this.supervisor?.name
        });
    }
    
    /**
     * Update assessment progress
     * Called when moving between wizard steps
     */
    updateProgress(stepNumber, stepDescription) {
        if (!this.assessmentId) {
            console.warn('No active assessment to update');
            return;
        }
        
        this.currentStep = stepNumber;
        
        // Broadcast progress update
        this.broadcastUpdate({
            type: 'assessment_progress',
            assessmentId: this.assessmentId,
            breakdownId: this.breakdownId,
            wizardType: this.wizardType,
            totalSteps: this.totalSteps,
            currentStep: this.currentStep,
            stepDescription: stepDescription || this.getStepDescription(this.wizardType, stepNumber),
            progress: Math.round((this.currentStep / this.totalSteps) * 100),
            estimatedCompletion: this.estimateCompletion(),
            elapsedTime: Math.floor((Date.now() - this.startTime) / 1000)
        });
        
        console.log(`📊 Assessment progress: Step ${this.currentStep}/${this.totalSteps}`, stepDescription);
    }
    
    /**
     * Complete assessment
     * Called when wizard is completed
     */
    completeAssessment(decision, notes) {
        if (!this.assessmentId) {
            console.warn('No active assessment to complete');
            return;
        }
        
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Broadcast assessment completed
        this.broadcastUpdate({
            type: 'assessment_completed',
            assessmentId: this.assessmentId,
            breakdownId: this.breakdownId,
            wizardType: this.wizardType,
            decision: decision,
            notes: notes,
            duration: duration,
            completedAt: new Date().toISOString(),
            supervisor: this.supervisor
        });
        
        console.log('✅ Assessment completed:', {
            assessmentId: this.assessmentId,
            decision: decision,
            duration: `${duration}s`
        });
        
        // Reset state
        this.resetAssessment();
    }
    
    /**
     * Cancel assessment
     * Called when wizard is cancelled
     */
    cancelAssessment() {
        if (!this.assessmentId) {
            return;
        }
        
        // Broadcast assessment cancelled
        this.broadcastUpdate({
            type: 'assessment_cancelled',
            assessmentId: this.assessmentId,
            breakdownId: this.breakdownId,
            cancelledAt: new Date().toISOString()
        });
        
        console.log('❌ Assessment cancelled:', this.assessmentId);
        
        // Reset state
        this.resetAssessment();
    }
    
    /**
     * Connect to WebSocket for real-time updates
     * NOTE: Authentication now uses HTTP-only cookies (XSS protection)
     */
    async connectWebSocket() {
        try {
            // NOTE: Authentication now uses HTTP-only cookies (XSS protection)
            // The browser automatically sends the auth_token cookie with WebSocket upgrade request
            console.log('🔒 Using HTTP-only cookie authentication for Assessment Broadcaster WebSocket');

            const baseWsUrl = BACKEND_URL.replace('http', 'ws');
            const wsUrl = `${baseWsUrl}/ws?channel=assessment-tracker`;
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected for assessment broadcasting');
                this.wsReconnectAttempts = 0;
                
                // Send identification
                this.ws.send(JSON.stringify({
                    type: 'identify',
                    role: 'supervisor',
                    supervisor: this.supervisor
                }));
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.handleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            // Fall back to API broadcasting
        }
    }
    
    /**
     * Handle WebSocket reconnection
     */
    handleReconnect() {
        if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached, falling back to API');
            return;
        }
        
        this.wsReconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
        
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }
    
    /**
     * Broadcast update via WebSocket and/or API
     */
    async broadcastUpdate(data) {
        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        // Try WebSocket first
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(data));
                console.log('📡 Broadcasted via WebSocket:', data.type);
            } catch (error) {
                console.error('WebSocket broadcast failed:', error);
                await this.broadcastViaAPI(data);
            }
        } else {
            // Fallback to API
            await this.broadcastViaAPI(data);
        }
    }
    
    /**
     * Broadcast update via REST API (fallback)
     */
    async broadcastViaAPI(data) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/assessment/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('📡 Broadcasted via API:', data.type);
            } else {
                console.error('API broadcast failed:', response.status);
            }
        } catch (error) {
            console.error('Failed to broadcast via API:', error);
            // Store locally for later sync if needed
            this.storeForRetry(data);
        }
    }
    
    /**
     * Store failed broadcast for retry
     */
    storeForRetry(data) {
        try {
            const pending = JSON.parse(localStorage.getItem('pending_broadcasts') || '[]');
            pending.push(data);
            localStorage.setItem('pending_broadcasts', JSON.stringify(pending));
        } catch (error) {
            console.error('Failed to store broadcast for retry:', error);
        }
    }
    
    /**
     * Get step description based on wizard type and step number
     */
    getStepDescription(wizardType, stepNumber) {
        // Map of wizard types to step descriptions
        const stepDescriptions = {
            'steering': [
                'Initial steering assessment',
                'Checking steering wheel play (DVSA 75mm limit)',
                'Testing power steering function',
                'Checking for leaks or damage',
                'Final safety decision'
            ],
            'brakes': [
                'Initial brake assessment',
                'Checking brake pedal response',
                'Testing brake effectiveness',
                'Inspecting for leaks',
                'Final safety decision'
            ],
            'abs-light': [
                'ABS light status check',
                'System reset attempt',
                'Testing at 10mph',
                'Final safety decision'
            ],
            'battery': [
                'Battery warning light check',
                'Belt inspection (engine OFF)',
                'Master switch check',
                'Final safety decision'
            ],
            'non-starter': [
                'Initial troubleshooting',
                'Checking gear selector and instruments',
                'Rear start attempt',
                'Gathering diagnostic information',
                'Final decision'
            ],
            // Add more wizard types as needed
            'default': [
                'Initial assessment',
                'Detailed inspection',
                'Testing and verification',
                'Documentation',
                'Final safety decision'
            ]
        };
        
        const steps = stepDescriptions[wizardType] || stepDescriptions['default'];
        return steps[stepNumber - 1] || `Step ${stepNumber} of ${this.totalSteps}`;
    }
    
    /**
     * Estimate completion time based on wizard type and current progress
     */
    estimateCompletion() {
        // Average time per step in seconds (based on wizard type)
        const avgTimePerStep = {
            'steering': 30,
            'brakes': 30,
            'abs-light': 25,
            'battery': 25,
            'non-starter': 35,
            'road-traffic-incidents': 60,
            'default': 30
        };
        
        const timePerStep = avgTimePerStep[this.wizardType] || avgTimePerStep['default'];
        const remainingSteps = this.totalSteps - this.currentStep + 1;
        const estimatedSeconds = remainingSteps * timePerStep;
        
        if (estimatedSeconds < 60) {
            return `${estimatedSeconds} secs`;
        } else {
            const minutes = Math.ceil(estimatedSeconds / 60);
            return `${minutes} min${minutes > 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Get supervisor from storage
     */
    getSupervisorFromStorage() {
        try {
            const sources = [
                'currentSupervisor',
                'supervisorData',
                'supervisor_session'
            ];
            
            for (const source of sources) {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.name || parsed.badge) {
                        return {
                            name: parsed.name,
                            badge: parsed.badge || parsed.supervisorBadge,
                            depot: parsed.depot
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Failed to get supervisor from storage:', error);
        }
        
        return null;
    }
    
    /**
     * Reset assessment state
     */
    resetAssessment() {
        this.assessmentId = null;
        this.breakdownId = null;
        this.wizardType = null;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.startTime = null;
        this.vehicle = null;
        this.location = null;
        this.route = null;
    }
    
    /**
     * Cleanup and disconnect
     */
    cleanup() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.resetAssessment();
    }
}

// Create singleton instance
const assessmentBroadcaster = new AssessmentBroadcaster();

// Export singleton
export default assessmentBroadcaster;
