/**
 * Real-time Enhanced Assessment Wizard
 * Phase 2 Priority 4: Assessment with live collaboration and real-time updates
 * 
 * Features:
 * - Real-time collaboration with other supervisors
 * - Live status updates and conflict resolution
 * - Push notifications for escalations
 * - Activity tracking and broadcasting
 * - Multi-supervisor decision making
 */

const RealTimeEnhancedWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, Shield, Users, Bell } = Icons;
    
    const [breakdownId, setBreakdownId] = React.useState(null);
    const [isConnected, setIsConnected] = React.useState(false);
    const [collaborators, setCollaborators] = React.useState([]);
    const [currentActivity, setCurrentActivity] = React.useState(null);
    const [notifications, setNotifications] = React.useState([]);
    const [conflictData, setConflictData] = React.useState(null);
    const [escalationTriggered, setEscalationTriggered] = React.useState(false);
    
    // Real-time hooks
    const { trackActivity, startViewing, startEditing, startAssessing, startDecisionMaking } = 
        window.useRealTimeActivity?.(breakdownId, 'current_supervisor') || {};
    
    const { updateStatus } = window.useRealTimeStatusSync?.(breakdownId, handleStatusUpdate) || {};
    
    // Initialize breakdown and real-time features
    React.useEffect(() => {
        if (!breakdownId) {
            const newBreakdownId = `breakdown_${Date.now()}`;
            setBreakdownId(newBreakdownId);
        }
        
        // Monitor connection status
        if (window.RealTime) {
            const handleConnectionChange = (status) => {
                setIsConnected(status === 'connected');
            };
            
            window.RealTime.onConnectionChange(handleConnectionChange);
            setIsConnected(window.RealTime.isConnected());
            
            return () => {
                // Cleanup
                if (breakdownId && window.RealTime) {
                    window.RealTime.unsubscribeFromBreakdown(breakdownId);
                }
            };
        }
    }, [breakdownId]);
    
    // Track activity when step changes
    React.useEffect(() => {
        if (trackActivity && breakdownId) {
            switch (currentStep) {
                case 1:
                    startViewing?.();
                    break;
                case 2:
                    startAssessing?.('safety');
                    break;
                case 3:
                    startEditing?.('documentation');
                    break;
                case 4:
                    startDecisionMaking?.();
                    break;
            }
        }
    }, [currentStep, trackActivity, breakdownId]);
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(),
        () => onPrevious()
    );
    
    function handleStatusUpdate(updates, updatedBy) {
        if (updatedBy !== 'current_supervisor') {
            setConflictData({
                updates,
                updatedBy,
                timestamp: Date.now()
            });
            
            // Show notification
            if (window.PushNotifications) {
                window.PushNotificationManager?.handleBreakdownUpdate({
                    breakdownId,
                    updates,
                    updatedBy
                });
            }
        }
    }
    
    const triggerEscalation = (reason) => {
        setEscalationTriggered(true);
        
        // Broadcast escalation
        if (window.RealTime?.isConnected()) {
            window.dispatchEvent(new CustomEvent('breakdown-escalation', {
                detail: {
                    breakdownId,
                    reason,
                    escalatedBy: 'current_supervisor'
                }
            }));
        }
        
        // Show notification
        addNotification({
            type: 'warning',
            title: '⚠️ Escalation Triggered',
            message: `Reason: ${reason}`,
            timestamp: Date.now()
        });
    };
    
    const requestCollaboration = () => {
        if (window.RealTime?.isConnected()) {
            window.RealTime.requestBreakdownCollaboration(breakdownId, 'decision_assistance');
            
            addNotification({
                type: 'info',
                title: '🤝 Collaboration Requested',
                message: 'Requesting assistance from other supervisors',
                timestamp: Date.now()
            });
        }
    };
    
    const addNotification = (notification) => {
        setNotifications(prev => [
            { id: Date.now(), ...notification },
            ...prev.slice(0, 4) // Keep only last 5 notifications
        ]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };
    
    const resolveConflict = (action) => {
        if (action === 'accept' && conflictData) {
            // Accept the changes from other supervisor
            Object.entries(conflictData.updates).forEach(([key, value]) => {
                updateResponse(key, value);
            });
        }
        setConflictData(null);
    };
    
    const renderConnectionStatus = () => (
        React.createElement('div', {
            className: `flex items-center justify-between p-3 rounded-lg border ${
                isConnected 
                    ? 'bg-green-500/10 border-green-400/30' 
                    : 'bg-red-500/10 border-red-400/30'
            }`
        }, [
            React.createElement('div', {
                key: 'status',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('div', {
                    key: 'indicator',
                    className: `w-3 h-3 rounded-full ${
                        isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`
                }),
                React.createElement('span', {
                    key: 'text',
                    className: `text-sm ${isConnected ? 'text-green-200' : 'text-red-200'}`
                }, isConnected ? 'Real-time connected' : 'Connection lost')
            ]),
            
            isConnected && React.createElement('div', {
                key: 'actions',
                className: 'flex space-x-2'
            }, [
                React.createElement('button', {
                    key: 'collaborate',
                    onClick: requestCollaboration,
                    className: 'px-2 py-1 bg-blue-600/20 border border-blue-400/30 rounded text-xs text-blue-200 hover:bg-blue-600/30 transition-all'
                }, '🤝 Get Help'),
                
                currentStep === 4 && React.createElement('button', {
                    key: 'escalate',
                    onClick: () => triggerEscalation('Complex assessment requires senior review'),
                    className: 'px-2 py-1 bg-amber-600/20 border border-amber-400/30 rounded text-xs text-amber-200 hover:bg-amber-600/30 transition-all'
                }, '⚠️ Escalate')
            ])
        ])
    );
    
    const renderNotifications = () => (
        notifications.length > 0 && React.createElement('div', {
            className: 'space-y-2'
        }, notifications.map(notification =>
            React.createElement('div', {
                key: notification.id,
                className: `p-2 rounded border ${
                    notification.type === 'warning' ? 'bg-amber-500/10 border-amber-400/30' :
                    notification.type === 'error' ? 'bg-red-500/10 border-red-400/30' :
                    'bg-blue-500/10 border-blue-400/30'
                }`
            }, [
                React.createElement('div', {
                    key: 'title',
                    className: 'text-sm font-medium text-white'
                }, notification.title),
                React.createElement('div', {
                    key: 'message',
                    className: 'text-xs text-gray-300 mt-1'
                }, notification.message)
            ])
        ))
    );
    
    const renderConflictResolution = () => (
        conflictData && React.createElement('div', {
            className: 'p-4 bg-red-500/20 border border-red-400/30 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'title',
                className: 'text-sm font-medium text-red-200 mb-2'
            }, '⚠️ Conflict Detected'),
            React.createElement('div', {
                key: 'message',
                className: 'text-xs text-red-300 mb-3'
            }, `${conflictData.updatedBy} made changes while you were working`),
            React.createElement('div', {
                key: 'actions',
                className: 'flex space-x-2'
            }, [
                React.createElement('button', {
                    key: 'accept',
                    onClick: () => resolveConflict('accept'),
                    className: 'px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white'
                }, 'Accept Changes'),
                React.createElement('button', {
                    key: 'keep',
                    onClick: () => resolveConflict('keep'),
                    className: 'px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white'
                }, 'Keep Mine')
            ])
        ])
    );
    
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {renderConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={<Users className="w-8 h-8" />}
                            title="⚡ Real-time Assessment"
                            description="Collaborative breakdown evaluation"
                            variant="default"
                        />
                        
                        {renderNotifications()}
                        {renderConflictResolution()}
                        
                        {/* Real-time collaboration panel */}
                        {isConnected && breakdownId && React.createElement(window.RealTimeCollaboration, {
                            breakdownId: breakdownId,
                            currentSupervisor: 'current_supervisor'
                        })}
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">What type of assessment is needed?</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => {
                                        updateResponse('assessment_type', 'safety_critical');
                                        trackActivity?.('assessing', 'safety_critical');
                                    }}
                                    selected={responses.assessment_type === 'safety_critical'}
                                    variant="danger"
                                    icon={<span className="text-xl">🚨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Safety Critical Assessment</div>
                                        <div className="text-sm opacity-80 mt-1">Immediate safety concerns</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => {
                                        updateResponse('assessment_type', 'operational');
                                        trackActivity?.('assessing', 'operational');
                                    }}
                                    selected={responses.assessment_type === 'operational'}
                                    variant="warning"
                                    icon={<span className="text-xl">⚙️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Operational Assessment</div>
                                        <div className="text-sm opacity-80 mt-1">Performance or comfort issues</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => {
                                        updateResponse('assessment_type', 'routine');
                                        trackActivity?.('assessing', 'routine');
                                    }}
                                    selected={responses.assessment_type === 'routine'}
                                    variant="success"
                                    icon={<span className="text-xl">✅</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Routine Assessment</div>
                                        <div className="text-sm opacity-80 mt-1">Standard checks and documentation</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => {
                                updateResponse('location', value);
                                trackActivity?.('editing', 'location');
                            }}
                            placeholder="e.g., Newcastle Central Station, A1"
                            icon={<span>📍</span>}
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {renderConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={<Shield className="w-8 h-8" />}
                            title="🔍 Safety Evaluation"
                            description="Real-time safety assessment"
                            variant={responses.assessment_type === 'safety_critical' ? 'danger' : 'warning'}
                        />
                        
                        {renderNotifications()}
                        {renderConflictResolution()}
                        
                        <MobileAlertCard 
                            type={responses.assessment_type === 'safety_critical' ? 'danger' : 'warning'}
                            title="⚡ Live Assessment"
                            icon={<Shield className="w-6 h-6" />}
                        >
                            <div className="space-y-2">
                                <p>Other supervisors can see your assessment in real-time</p>
                                <div className="text-xs bg-white/10 rounded p-2">
                                    Current activity: {currentActivity?.action?.replace('_', ' ') || 'Assessing safety'}
                                </div>
                            </div>
                        </MobileAlertCard>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Safety Assessment</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => {
                                        updateResponse('immediate_danger', !responses.immediate_danger);
                                        if (!responses.immediate_danger) {
                                            triggerEscalation('Immediate danger identified');
                                        }
                                    }}
                                    selected={responses.immediate_danger}
                                    variant="danger"
                                    icon={<span className="text-xl">🚨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Immediate Danger Present</div>
                                        <div className="text-sm opacity-80 mt-1">Vehicle poses immediate risk</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('system_failure', !responses.system_failure); onNext(); }}
                                    selected={responses.system_failure}
                                    variant="warning"
                                    icon={<span className="text-xl">⚙️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">System Failure</div>
                                        <div className="text-sm opacity-80 mt-1">Critical system not functioning</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('passenger_impact', !responses.passenger_impact); onNext(); }}
                                    selected={responses.passenger_impact}
                                    variant="warning"
                                    icon={<span className="text-xl">👥</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Passenger Impact</div>
                                        <div className="text-sm opacity-80 mt-1">Affects passenger safety or comfort</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        <MobileInput
                            label="📝 Detailed Observations"
                            value={responses.observations || ''}
                            onChange={(value) => {
                                updateResponse('observations', value);
                                trackActivity?.('editing', 'observations');
                            }}
                            placeholder="Describe what you observe..."
                        />
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {renderConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={<Bell className="w-8 h-8" />}
                            title="📋 Documentation"
                            description="Record assessment details"
                            variant="info"
                        />
                        
                        {renderNotifications()}
                        {renderConflictResolution()}
                        
                        {/* Activity tracking */}
                        <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                            <div className="text-sm font-medium text-blue-200 mb-1">
                                📊 Live Activity
                            </div>
                            <div className="text-xs text-blue-300">
                                You are: {currentActivity?.action?.replace('_', ' ') || 'Documenting assessment'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Documentation & Actions</h3>
                            
                            <MobileTouchButton
                                onClick={() => { updateResponse('photos_required', !responses.photos_required); onNext(); }}
                                selected={responses.photos_required}
                                variant="info"
                                icon={<span className="text-xl">📸</span>}
                            >
                                <div>
                                    <div className="font-semibold">Photos Required</div>
                                    <div className="text-sm opacity-80 mt-1">Visual documentation needed</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => { updateResponse('engineering_required', !responses.engineering_required); onNext(); }}
                                selected={responses.engineering_required}
                                variant="warning"
                                icon={<span className="text-xl">🔧</span>}
                            >
                                <div>
                                    <div className="font-semibold">Engineering Required</div>
                                    <div className="text-sm opacity-80 mt-1">Technical assessment needed</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => { updateResponse('passenger_notification', !responses.passenger_notification); onNext(); }}
                                selected={responses.passenger_notification}
                                variant="info"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Passenger Notification</div>
                                    <div className="text-sm opacity-80 mt-1">Inform passengers of delays</div>
                                </div>
                            </MobileTouchButton>
                        </div>

                        <MobileInput
                            label="📝 Additional Notes"
                            value={responses.additional_notes || ''}
                            onChange={(value) => updateResponse('additional_notes', value)}
                            placeholder="Any additional information..."
                        />
                    </div>
                );

            case 4:
                const decision = responses.immediate_danger ? 'STOP' : 
                               (responses.system_failure || responses.passenger_impact) ? 'AMBER' : 'CONTINUE';
                
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {renderConnectionStatus()}
                        
                        <MobileWizardHeader
                            icon={decision === 'STOP' ? <AlertTriangle className="w-8 h-8" /> : 
                                  decision === 'AMBER' ? <AlertTriangle className="w-8 h-8" /> : 
                                  <Shield className="w-8 h-8" />}
                            title={decision === 'STOP' ? "🛑 STOP REQUIRED" : 
                                   decision === 'AMBER' ? "🟡 PROCEED WITH CAUTION" : 
                                   "🟢 CONTINUE IN SERVICE"}
                            description="Real-time assessment complete"
                            variant={decision === 'STOP' ? "danger" : decision === 'AMBER' ? "warning" : "success"}
                            emergency={decision === 'STOP'}
                        />
                        
                        {renderNotifications()}
                        {renderConflictResolution()}
                        
                        {/* Decision summary with real-time updates */}
                        <MobileAlertCard 
                            type={decision === 'STOP' ? 'danger' : decision === 'AMBER' ? 'warning' : 'success'}
                            title="⚡ Real-time Decision"
                            icon={<Shield className="w-6 h-6" />}
                        >
                            <div className="space-y-3">
                                <p className="font-semibold">
                                    {decision === 'STOP' ? 'Safety critical - immediate stop required' :
                                     decision === 'AMBER' ? 'Proceed with caution to nearest changeover' :
                                     'Vehicle safe to continue normal service'}
                                </p>
                                
                                {isConnected && (
                                    <div className="bg-white/10 rounded p-2 text-xs">
                                        📡 Decision broadcasted to all supervisors in real-time
                                    </div>
                                )}
                                
                                {escalationTriggered && (
                                    <div className="bg-amber-500/20 rounded p-2 text-xs">
                                        ⚠️ Escalation triggered - senior staff notified
                                    </div>
                                )}
                            </div>
                        </MobileAlertCard>

                        {/* Collaboration summary */}
                        {isConnected && breakdownId && React.createElement(window.RealTimeCollaboration, {
                            breakdownId: breakdownId,
                            currentSupervisor: 'current_supervisor'
                        })}

                        {/* Final confirmations */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Final Confirmations</h3>
                            
                            <MobileTouchButton
                                onClick={() => { updateResponse('decision_documented', !responses.decision_documented); onNext(); }}
                                selected={responses.decision_documented}
                                variant="warning"
                                icon={<span className="text-xl">📋</span>}
                            >
                                <div>
                                    <div className="font-semibold">Decision documented in system</div>
                                    <div className="text-sm opacity-80 mt-1">Assessment recorded with real-time sync</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => { updateResponse('stakeholders_notified', !responses.stakeholders_notified); onNext(); }}
                                selected={responses.stakeholders_notified}
                                variant="warning"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Stakeholders notified</div>
                                    <div className="text-sm opacity-80 mt-1">Real-time notifications sent</div>
                                </div>
                            </MobileTouchButton>
                        </div>
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
                totalSteps={4}
                onNext={() => {
                    if (currentStep === 4) {
                        const decision = responses.immediate_danger ? 'STOP' : 
                                       (responses.system_failure || responses.passenger_impact) ? 'AMBER' : 'CONTINUE';
                        
                        const assessmentData = {
                            assessment_type: 'realtime_enhanced_assessment',
                            breakdown_id: breakdownId,
                            assessment_type_selected: responses.assessment_type,
                            location: responses.location,
                            safety_evaluation: {
                                immediate_danger: responses.immediate_danger,
                                system_failure: responses.system_failure,
                                passenger_impact: responses.passenger_impact
                            },
                            observations: responses.observations,
                            documentation: {
                                photos_required: responses.photos_required,
                                engineering_required: responses.engineering_required,
                                passenger_notification: responses.passenger_notification
                            },
                            decision: decision,
                            escalation_triggered: escalationTriggered,
                            real_time_features: {
                                collaboration_used: isConnected,
                                conflicts_resolved: conflictData ? 1 : 0,
                                activity_tracked: !!currentActivity
                            },
                            additional_notes: responses.additional_notes,
                            timestamp: new Date().toISOString(),
                            real_time_completed: isConnected
                        };
                        
                        // Broadcast completion
                        if (window.RealTime?.isConnected()) {
                            updateStatus?.(decision, 'Assessment completed with real-time collaboration');
                        }
                        
                        // Use offline-enhanced completion if available
                        if (window.OfflineEnhancedWizard) {
                            window.OfflineEnhancedWizard.handleComplete(assessmentData, onComplete);
                        } else {
                            onComplete(assessmentData);
                        }
                    } else {
                        onNext();
                    }
                }}
                onPrevious={onPrevious}
                onHome={() => window.location.href = '/'}
                nextDisabled={
                    currentStep === 1 && (!responses.assessment_type || !responses.location)
                }
                nextLabel={currentStep === 4 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the component
window.RealTimeEnhancedWizard = RealTimeEnhancedWizard;

export default RealTimeEnhancedWizard;
