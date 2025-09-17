/**
 * Offline-Enhanced Mobile Wizard Base
 * Phase 2: PWA Integration with Offline Support
 * 
 * Features:
 * - Offline assessment completion
 * - Background sync when online
 * - Offline status indicators
 * - Cached data handling
 */

const OfflineEnhancedWizard = {
    // Enhanced completion handler with offline support
    async handleComplete(assessmentData, originalOnComplete) {
        try {
            // Add offline metadata
            const enhancedData = {
                ...assessmentData,
                offline_completed: !window.PWA?.isOnline(),
                device_timestamp: new Date().toISOString(),
                device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                }
            };
            
            if (window.PWA?.isOnline()) {
                // Online - try to submit immediately
                console.log('🌐 Submitting assessment online');
                try {
                    await originalOnComplete(enhancedData);
                    this.showSuccessMessage('Assessment submitted successfully');
                } catch (error) {
                    console.log('❌ Online submission failed, saving offline');
                    await this.saveOffline(enhancedData);
                }
            } else {
                // Offline - save for later sync
                console.log('📱 Saving assessment offline');
                await this.saveOffline(enhancedData);
            }
        } catch (error) {
            console.error('❌ Assessment completion failed:', error);
            this.showErrorMessage('Failed to save assessment');
        }
    },
    
    async saveOffline(assessmentData) {
        if (window.PWA?.saveAssessmentOffline) {
            const id = await window.PWA.saveAssessmentOffline(assessmentData);
            this.showOfflineMessage(`Assessment saved offline (ID: ${id.slice(-6)})`);
            return id;
        } else {
            throw new Error('Offline storage not available');
        }
    },
    
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    },
    
    showOfflineMessage(message) {
        this.showNotification(message, 'offline');
    },
    
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    },
    
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            offline: 'bg-amber-600', 
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };
        
        const icons = {
            success: '✅',
            offline: '📱',
            error: '❌',
            info: 'ℹ️'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 mx-auto max-w-md`;
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-xl">${icons[type]}</span>
                <div>
                    <div class="font-semibold text-sm">${message}</div>
                    ${type === 'offline' ? '<div class="text-xs opacity-90 mt-1">Will sync when online</div>' : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    },
    
    // Connection status component
    createConnectionStatus() {
        const isOnline = window.PWA?.isOnline() ?? navigator.onLine;
        const pendingCount = window.PWA?.getPendingAssessments()?.length ?? 0;
        
        return React.createElement('div', {
            className: 'flex items-center justify-between p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/20 mb-4'
        }, [
            // Connection indicator
            React.createElement('div', {
                key: 'connection',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('div', {
                    key: 'indicator',
                    className: `w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`
                }),
                React.createElement('span', {
                    key: 'status',
                    className: 'text-sm text-gray-300'
                }, isOnline ? 'Online' : 'Offline')
            ]),
            
            // Pending sync indicator
            pendingCount > 0 && React.createElement('div', {
                key: 'pending',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('span', {
                    key: 'icon',
                    className: 'text-sm'
                }, '⏳'),
                React.createElement('span', {
                    key: 'count',
                    className: 'text-xs text-amber-300'
                }, `${pendingCount} pending`)
            ])
        ]);
    }
};

// Enhanced Mobile Steering Wizard with offline support
const OfflineSteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, Shield } = Icons;
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(),
        () => onPrevious()
    );
    
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {/* Connection status */}
                        {OfflineEnhancedWizard.createConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={<Shield className="w-8 h-8" />}
                            title="🚗 Steering Safety Check"
                            description="Critical safety evaluation - works offline"
                            variant="danger"
                            emergency={true}
                        />
                        
                        <MobileAlertCard 
                            type="danger" 
                            title="⚠️ SAFETY CRITICAL SYSTEM"
                            icon={<AlertTriangle className="w-6 h-6" />}
                        >
                            <div className="space-y-3">
                                <p>Steering defects pose immediate danger. ANY compromise requires immediate action.</p>
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="font-semibold mb-2">SDC Requirements:</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Max 75mm play for power steering</li>
                                        <li>• ANY defect = immediate shutdown</li>
                                        <li>• Await engineering - no exceptions</li>
                                    </ul>
                                </div>
                            </div>
                        </MobileAlertCard>

                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => updateResponse('location', value)}
                            placeholder="e.g., Newcastle Central Station, A1, Team Valley"
                            icon={<span>📍</span>}
                        />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">What steering issue needs assessment?</h3>
                            <p className="text-gray-300 text-sm">ANY of these symptoms = critical stop required</p>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'excessive_play'); onNext(); }}
                                    selected={responses.initial_concern === 'excessive_play'}
                                    variant="danger"
                                    icon={<span className="text-xl">🎯</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Excessive steering wheel play</div>
                                        <div className="text-sm opacity-80 mt-1">Wheel moves before wheels respond (>75mm)</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'difficulty_steering'); onNext(); }}
                                    selected={responses.initial_concern === 'difficulty_steering'}
                                    variant="danger"
                                    icon={<span className="text-xl">💪</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Difficulty steering or control issues</div>
                                        <div className="text-sm opacity-80 mt-1">Heavy steering, hard to turn</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'vehicle_pulling'); onNext(); }}
                                    selected={responses.initial_concern === 'vehicle_pulling'}
                                    variant="danger"
                                    icon={<span className="text-xl">↗️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Vehicle pulling to one side</div>
                                        <div className="text-sm opacity-80 mt-1">Vehicle drifts left or right during operation</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {OfflineEnhancedWizard.createConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={<AlertTriangle className="w-8 h-8" />}
                            title="🛑 IMMEDIATE STOP REQUIRED"
                            description="Critical steering defect identified"
                            variant="danger"
                            emergency={true}
                        />

                        <MobileAlertCard 
                            type="danger" 
                            title="SAFETY CRITICAL DECISION"
                            icon={<Shield className="w-6 h-6" />}
                        >
                            <div className="space-y-4">
                                <p className="font-semibold">Based on the steering issue reported, this vehicle must stop immediately.</p>
                                
                                <div className="bg-white/10 rounded-lg p-4">
                                    <p className="font-semibold mb-2">Immediate Actions Required:</p>
                                    <ol className="space-y-2 text-sm">
                                        <li>1. ✋ <strong>Stop the vehicle safely</strong></li>
                                        <li>2. 🔧 <strong>Switch off engine</strong></li>
                                        <li>3. 📞 <strong>Contact engineering immediately</strong></li>
                                        <li>4. 👥 <strong>Keep passengers informed</strong></li>
                                        <li>5. 📋 <strong>Document everything</strong></li>
                                    </ol>
                                </div>
                            </div>
                        </MobileAlertCard>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Confirm Actions</h3>
                            
                            <MobileTouchButton
                                onClick={() => { updateResponse('driver_informed_stop', !responses.driver_informed_stop); onNext(); }}
                                selected={responses.driver_informed_stop}
                                variant="warning"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Driver instructed to stop immediately</div>
                                    <div className="text-sm opacity-80 mt-1">Vehicle to stop safely and switch off engine</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => { updateResponse('engineering_contacted', !responses.engineering_contacted); onNext(); }}
                                selected={responses.engineering_contacted}
                                variant="warning"
                                icon={<span className="text-xl">🔧</span>}
                            >
                                <div>
                                    <div className="font-semibold">Engineering team contacted</div>
                                    <div className="text-sm opacity-80 mt-1">Immediate engineering attendance requested</div>
                                </div>
                            </MobileTouchButton>
                        </div>

                        <MobileInput
                            label="📝 Additional Notes"
                            value={responses.additional_notes || ''}
                            onChange={(value) => updateResponse('additional_notes', value)}
                            placeholder="Any additional details about the steering issue..."
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-center space-y-4">
                        <div className="text-red-400">Unknown step: {currentStep}</div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            <div className="px-4 pt-6">
                {renderStep()}
            </div>
            
            <MobileNavigation
                currentStep={currentStep}
                totalSteps={2}
                onNext={() => {
                    if (currentStep === 2) {
                        const assessmentData = {
                            assessment_type: 'steering_safety',
                            concern: responses.initial_concern,
                            location: responses.location,
                            decision: 'STOP',
                            reasoning: 'Steering defects are safety critical and require immediate vehicle shutdown',
                            actions_taken: {
                                driver_informed_stop: responses.driver_informed_stop,
                                engineering_contacted: responses.engineering_contacted
                            },
                            additional_notes: responses.additional_notes,
                            safety_compliance: 'DVSA_COMPLIANT',
                            timestamp: new Date().toISOString()
                        };
                        
                        // Use offline-enhanced completion
                        OfflineEnhancedWizard.handleComplete(assessmentData, onComplete);
                    } else {
                        onNext();
                    }
                }}
                onPrevious={onPrevious}
                onHome={() => window.location.href = '/'}
                nextDisabled={currentStep === 1 && !responses.initial_concern}
                nextLabel={currentStep === 2 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the enhanced wizard
window.OfflineSteeringWizard = OfflineSteeringWizard;

export default OfflineSteeringWizard;
