/**
 * Mobile-Optimized Steering Wizard
 * Phase 2: Enhanced for touch-first mobile interaction
 * 
 * Features:
 * - Large touch targets (56px minimum)
 * - Swipe navigation support
 * - Mobile-optimized layouts
 * - Better thumb accessibility
 * - Enhanced visual hierarchy for small screens
 */

const MobileSteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get mobile components
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(), // Swipe left = next
        () => onPrevious() // Swipe right = previous
    );

    // Mobile-optimized step content
    const renderMobileStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        {/* Mobile-optimized header */}
                        <MobileWizardHeader
                            icon={<Shield className="w-8 h-8" />}
                            title="🚗 Steering Safety Check"
                            description="Critical safety evaluation for steering system control"
                            variant="danger"
                            emergency={true}
                        />
                        
                        {/* Critical safety alert */}
                        <MobileAlertCard 
                            type="danger" 
                            title="⚠️ SAFETY CRITICAL SYSTEM"
                            icon={<AlertTriangle className="w-6 h-6" />}
                        >
                            <div className="space-y-3">
                                <p>Steering defects pose immediate danger to vehicle control. ANY compromise requires immediate action.</p>
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="font-semibold mb-2">Operational Requirements:</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Max 75mm play for power steering</li>
                                        <li>• ANY defect = immediate shutdown</li>
                                        <li>• Await engineering - no exceptions</li>
                                    </ul>
                                </div>
                            </div>
                        </MobileAlertCard>

                        {/* Location input */}
                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => updateResponse('location', value)}
                            placeholder="e.g., Newcastle Central Station, A1, Team Valley"
                            icon={<span>📍</span>}
                        />

                        {/* Mobile-optimized concern selection */}
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
                                    onClick={() => { updateResponse('initial_concern', 'stiff_unresponsive'); onNext(); }}
                                    selected={responses.initial_concern === 'stiff_unresponsive'}
                                    variant="danger"
                                    icon={<span className="text-xl">🔒</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Steering stiff or unresponsive</div>
                                        <div className="text-sm opacity-80 mt-1">Wheel difficult to turn or not responding</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'unusual_noises'); onNext(); }}
                                    selected={responses.initial_concern === 'unusual_noises'}
                                    variant="danger"
                                    icon={<span className="text-xl">🔊</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Unusual steering noises</div>
                                        <div className="text-sm opacity-80 mt-1">Knocking, grinding, or squealing sounds</div>
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

                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'visible_damage'); onNext(); }}
                                    selected={responses.initial_concern === 'visible_damage'}
                                    variant="danger"
                                    icon={<span className="text-xl">🔍</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Visible steering system damage</div>
                                        <div className="text-sm opacity-80 mt-1">Damaged column, linkage, or leaks</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('initial_concern', 'warning_lights'); onNext(); }}
                                    selected={responses.initial_concern === 'warning_lights'}
                                    variant="danger"
                                    icon={<span className="text-xl">⚠️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Steering-related warning lights</div>
                                        <div className="text-sm opacity-80 mt-1">Any illuminated steering system warnings</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
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

                                <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3">
                                    <p className="text-amber-200 text-sm">
                                        <strong>Compliance Note:</strong> This decision ensures DVSA safety standards are met and provides complete audit trail for legal protection.
                                    </p>
                                </div>
                            </div>
                        </MobileAlertCard>

                        {/* Driver communication section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Confirm Driver Instructions</h3>
                            
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

                            <MobileTouchButton
                                onClick={() => { updateResponse('passengers_informed', !responses.passengers_informed); onNext(); }}
                                selected={responses.passengers_informed}
                                variant="warning"
                                icon={<span className="text-xl">👥</span>}
                            >
                                <div>
                                    <div className="font-semibold">Passengers kept informed</div>
                                    <div className="text-sm opacity-80 mt-1">Clear communication about safety measures</div>
                                </div>
                            </MobileTouchButton>
                        </div>

                        {/* Additional notes */}
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
            {/* Mobile-optimized content */}
            <div className="px-4 pt-6">
                {renderMobileStep()}
            </div>
            
            {/* Mobile navigation */}
            <MobileNavigation
                currentStep={currentStep}
                totalSteps={2}
                onNext={() => {
                    if (currentStep === 2) {
                        onComplete({
                            assessment_type: 'steering_safety',
                            concern: responses.initial_concern,
                            location: responses.location,
                            decision: 'STOP',
                            reasoning: 'Steering defects are safety critical and require immediate vehicle shutdown',
                            actions_taken: {
                                driver_informed_stop: responses.driver_informed_stop,
                                engineering_contacted: responses.engineering_contacted,
                                passengers_informed: responses.passengers_informed
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
                nextDisabled={currentStep === 1 && !responses.initial_concern}
                nextLabel={currentStep === 2 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the component
window.MobileSteeringWizard = MobileSteeringWizard;

export default MobileSteeringWizard;
