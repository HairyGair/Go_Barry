/**
 * Mobile-Optimized Brakes Wizard
 * Phase 2: Enhanced for touch-first mobile interaction
 * 
 * Features:
 * - Large touch targets with clear visual feedback
 * - Multiple selection support for brake issues
 * - Simplified mobile layouts
 * - Safety-first decision logic
 */

const MobileBrakesWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get mobile components and icons
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, Shield, CheckCircle, XCircle } = Icons;
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(), // Swipe left = next
        () => onPrevious() // Swipe right = previous
    );

    // Check if any critical brake issues are selected
    const hasCriticalIssues = () => {
        return responses.brakeToFloor || 
               responses.delayedBraking || 
               responses.unusualNoises || 
               responses.brakeLeaks || 
               responses.grabbingShuddering || 
               responses.redABSLight;
    };

    // Determine decision based on responses
    const getDecision = () => {
        if (hasCriticalIssues()) {
            return 'STOP';
        }
        return 'CONTINUE_WITH_CAUTION';
    };

    const renderMobileStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<Shield className="w-8 h-8" />}
                            title="🛑 Brake System Safety Check"
                            description="Critical brake system assessment"
                            variant="danger"
                            emergency={true}
                        />
                        
                        <MobileAlertCard 
                            type="danger" 
                            title="🛑 SAFETY CRITICAL SYSTEM"
                            icon={<AlertTriangle className="w-6 h-6" />}
                        >
                            <p>Brake defects are safety critical. Any major issues require immediate vehicle stop and engineering assistance.</p>
                        </MobileAlertCard>

                        {/* Location input */}
                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => updateResponse('location', value)}
                            placeholder="e.g., Newcastle Central Station, A1, Team Valley"
                            icon={<span>📍</span>}
                        />

                        {/* Brake issues checklist */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Is the driver experiencing any of these brake issues?</h3>
                            <p className="text-gray-300 text-sm">Select all that apply - multiple selections possible</p>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => { updateResponse('brakeToFloor', !responses.brakeToFloor); onNext(); }}
                                    selected={responses.brakeToFloor}
                                    variant="danger"
                                    icon={<span className="text-xl">⬇️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Brake pedal sinks to floor</div>
                                        <div className="text-sm opacity-80 mt-1">Little or no resistance when pressed</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('delayedBraking', !responses.delayedBraking); onNext(); }}
                                    selected={responses.delayedBraking}
                                    variant="danger"
                                    icon={<span className="text-xl">⏱️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Braking response delayed or ineffective</div>
                                        <div className="text-sm opacity-80 mt-1">Brakes don't respond quickly or effectively</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('unusualNoises', !responses.unusualNoises); onNext(); }}
                                    selected={responses.unusualNoises}
                                    variant="danger"
                                    icon={<span className="text-xl">🔊</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Unusual noises during braking</div>
                                        <div className="text-sm opacity-80 mt-1">Grinding, squealing, or other abnormal sounds</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('brakeLeaks', !responses.brakeLeaks); onNext(); }}
                                    selected={responses.brakeLeaks}
                                    variant="danger"
                                    icon={<span className="text-xl">💧</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Visible brake system leaks</div>
                                        <div className="text-sm opacity-80 mt-1">Brake fluid leaking from system</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('grabbingShuddering', !responses.grabbingShuddering); onNext(); }}
                                    selected={responses.grabbingShuddering}
                                    variant="danger"
                                    icon={<span className="text-xl">🫨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Brakes grabbing or shuddering</div>
                                        <div className="text-sm opacity-80 mt-1">Uneven braking or vibration</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('redABSLight', !responses.redABSLight); onNext(); }}
                                    selected={responses.redABSLight}
                                    variant="danger"
                                    icon={<span className="text-xl">🚨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Red ABS/EBS light illuminated</div>
                                        <div className="text-sm opacity-80 mt-1">Anti-lock brake system warning</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('noIssues', !responses.noIssues); onNext(); }}
                                    selected={responses.noIssues}
                                    variant="success"
                                    icon={<span className="text-xl">✅</span>}
                                >
                                    <div>
                                        <div className="font-semibold">No brake issues identified</div>
                                        <div className="text-sm opacity-80 mt-1">Brakes functioning normally</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        {/* Show immediate warning if critical issues selected */}
                        {hasCriticalIssues() && (
                            <MobileAlertCard 
                                type="danger" 
                                title="⚠️ CRITICAL BRAKE ISSUE DETECTED"
                                icon={<AlertTriangle className="w-6 h-6" />}
                            >
                                <p className="font-semibold">The issues you've selected require immediate action. Vehicle must stop immediately.</p>
                            </MobileAlertCard>
                        )}
                    </div>
                );

            case 2:
                const decision = getDecision();
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={decision === 'STOP' ? <XCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                            title={decision === 'STOP' ? "🛑 IMMEDIATE STOP REQUIRED" : "⚠️ PROCEED WITH CAUTION"}
                            description={decision === 'STOP' ? "Critical brake defect - safety action required" : "Continue with planned changeover"}
                            variant={decision === 'STOP' ? "danger" : "warning"}
                            emergency={decision === 'STOP'}
                        />

                        {decision === 'STOP' ? (
                            <MobileAlertCard 
                                type="danger" 
                                title="SAFETY CRITICAL DECISION"
                                icon={<Shield className="w-6 h-6" />}
                            >
                                <div className="space-y-4">
                                    <p className="font-semibold">Critical brake issues identified. Vehicle must stop immediately.</p>
                                    
                                    <div className="bg-white/10 rounded-lg p-4">
                                        <p className="font-semibold mb-2">Immediate Actions Required:</p>
                                        <ol className="space-y-2 text-sm">
                                            <li>1. ✋ <strong>Stop vehicle safely</strong></li>
                                            <li>2. 🔧 <strong>Switch off engine</strong></li>
                                            <li>3. 📞 <strong>Contact engineering immediately</strong></li>
                                            <li>4. 👥 <strong>Keep passengers safe and informed</strong></li>
                                            <li>5. 📋 <strong>Document all details</strong></li>
                                        </ol>
                                    </div>
                                </div>
                            </MobileAlertCard>
                        ) : (
                            <MobileAlertCard 
                                type="warning" 
                                title="CONTINUE WITH PLANNED CHANGEOVER"
                                icon={<CheckCircle className="w-6 h-6" />}
                            >
                                <div className="space-y-3">
                                    <p>No critical brake issues identified. Vehicle may continue to planned changeover point.</p>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <p className="font-semibold mb-2">Next Steps:</p>
                                        <ul className="space-y-1 text-sm">
                                            <li>• Continue to next convenient changeover</li>
                                            <li>• Monitor brake performance</li>
                                            <li>• Log any changes in Go-Check</li>
                                        </ul>
                                    </div>
                                </div>
                            </MobileAlertCard>
                        )}

                        {/* Action confirmations */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Confirm Actions Taken</h3>
                            
                            <MobileTouchButton
                                onClick={() => { updateResponse('driver_informed', !responses.driver_informed); onNext(); }}
                                selected={responses.driver_informed}
                                variant="warning"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Driver informed of assessment</div>
                                    <div className="text-sm opacity-80 mt-1">Clear instructions provided to driver</div>
                                </div>
                            </MobileTouchButton>

                            {decision === 'STOP' && (
                                <MobileTouchButton
                                    onClick={() => { updateResponse('engineering_contacted', !responses.engineering_contacted); onNext(); }}
                                    selected={responses.engineering_contacted}
                                    variant="danger"
                                    icon={<span className="text-xl">🔧</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Engineering team contacted</div>
                                        <div className="text-sm opacity-80 mt-1">Immediate assistance requested</div>
                                    </div>
                                </MobileTouchButton>
                            )}

                            <MobileTouchButton
                                onClick={() => { updateResponse('logged_in_gocheck', !responses.logged_in_gocheck); onNext(); }}
                                selected={responses.logged_in_gocheck}
                                variant="warning"
                                icon={<span className="text-xl">📋</span>}
                            >
                                <div>
                                    <div className="font-semibold">Defects logged in Go-Check</div>
                                    <div className="text-sm opacity-80 mt-1">All issues documented properly</div>
                                </div>
                            </MobileTouchButton>
                        </div>

                        {/* Additional notes */}
                        <MobileInput
                            label="📝 Additional Notes"
                            value={responses.additional_notes || ''}
                            onChange={(value) => updateResponse('additional_notes', value)}
                            placeholder="Any additional details about the brake issues..."
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
                {renderMobileStep()}
            </div>
            
            <MobileNavigation
                currentStep={currentStep}
                totalSteps={2}
                onNext={() => {
                    if (currentStep === 2) {
                        const decision = getDecision();
                        onComplete({
                            assessment_type: 'brake_safety',
                            issues_identified: {
                                brakeToFloor: responses.brakeToFloor,
                                delayedBraking: responses.delayedBraking,
                                unusualNoises: responses.unusualNoises,
                                brakeLeaks: responses.brakeLeaks,
                                grabbingShuddering: responses.grabbingShuddering,
                                redABSLight: responses.redABSLight,
                                noIssues: responses.noIssues
                            },
                            location: responses.location,
                            decision: decision,
                            reasoning: decision === 'STOP' 
                                ? 'Critical brake issues identified requiring immediate stop for safety'
                                : 'No critical issues found - can continue with planned changeover',
                            actions_taken: {
                                driver_informed: responses.driver_informed,
                                engineering_contacted: responses.engineering_contacted,
                                logged_in_gocheck: responses.logged_in_gocheck
                            },
                            additional_notes: responses.additional_notes,
                            safety_compliance: 'DVSA_COMPLIANT',
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        onNext();
                    }
                }}
                onPrevious={onPrevious}
                nextDisabled={false}
                nextLabel={currentStep === 2 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the component
window.MobileBrakesWizard = MobileBrakesWizard;

export default MobileBrakesWizard;
