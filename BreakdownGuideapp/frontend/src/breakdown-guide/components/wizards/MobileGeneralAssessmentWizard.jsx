/**
 * Mobile-Optimized General Assessment Wizard
 * Phase 2: For non-critical vehicle issues
 * 
 * Features:
 * - Flexible assessment for various non-critical issues
 * - Mobile-first design with large touch targets
 * - Photo capture integration (placeholder for camera feature)
 * - Multi-step decision logic
 */

const MobileGeneralAssessmentWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get mobile components and icons
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, Shield, CheckCircle, XCircle, Camera, FileText } = Icons;
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(),
        () => onPrevious()
    );

    // Determine severity and decision
    const getSeverity = () => {
        if (responses.safety_critical) return 'CRITICAL';
        if (responses.affects_operation) return 'MODERATE';
        return 'MINOR';
    };

    const getDecision = () => {
        const severity = getSeverity();
        if (severity === 'CRITICAL') return 'STOP';
        if (severity === 'MODERATE') return 'AMBER';
        return 'CONTINUE';
    };

    const renderMobileStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<FileText className="w-8 h-8" />}
                            title="📋 General Assessment"
                            description="Comprehensive vehicle issue evaluation"
                            variant="default"
                        />

                        {/* Location input */}
                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => updateResponse('location', value)}
                            placeholder="e.g., Newcastle Central Station, A1, Team Valley"
                            icon={<span>📍</span>}
                        />

                        {/* Issue type selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">What type of issue needs assessment?</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => { updateResponse('issue_type', 'mechanical'); onNext(); }}
                                    selected={responses.issue_type === 'mechanical'}
                                    variant="default"
                                    icon={<span className="text-xl">🔧</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Mechanical Issue</div>
                                        <div className="text-sm opacity-80 mt-1">Engine, transmission, or mechanical component</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('issue_type', 'electrical'); onNext(); }}
                                    selected={responses.issue_type === 'electrical'}
                                    variant="default"
                                    icon={<span className="text-xl">⚡</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Electrical Issue</div>
                                        <div className="text-sm opacity-80 mt-1">Lights, electronics, or electrical systems</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('issue_type', 'comfort'); onNext(); }}
                                    selected={responses.issue_type === 'comfort'}
                                    variant="default"
                                    icon={<span className="text-xl">🌡️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Comfort System</div>
                                        <div className="text-sm opacity-80 mt-1">Heating, air conditioning, or passenger comfort</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('issue_type', 'cosmetic'); onNext(); }}
                                    selected={responses.issue_type === 'cosmetic'}
                                    variant="default"
                                    icon={<span className="text-xl">🎨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Cosmetic/Body</div>
                                        <div className="text-sm opacity-80 mt-1">Paint, panels, or interior damage</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('issue_type', 'other'); onNext(); }}
                                    selected={responses.issue_type === 'other'}
                                    variant="default"
                                    icon={<span className="text-xl">❓</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Other Issue</div>
                                        <div className="text-sm opacity-80 mt-1">Something not covered above</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        {/* Issue description */}
                        <MobileInput
                            label="📝 Describe the Issue"
                            value={responses.issue_description || ''}
                            onChange={(value) => updateResponse('issue_description', value)}
                            placeholder="Detailed description of what's wrong..."
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<AlertTriangle className="w-8 h-8" />}
                            title="⚖️ Impact Assessment"
                            description="Evaluate safety and operational impact"
                            variant="warning"
                        />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Assess the impact of this issue</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => { updateResponse('safety_critical', !responses.safety_critical); onNext(); }}
                                    selected={responses.safety_critical}
                                    variant="danger"
                                    icon={<span className="text-xl">🚨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Safety Critical</div>
                                        <div className="text-sm opacity-80 mt-1">Could pose immediate danger to passengers or public</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('affects_operation', !responses.affects_operation); onNext(); }}
                                    selected={responses.affects_operation}
                                    variant="warning"
                                    icon={<span className="text-xl">⚠️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Affects Operation</div>
                                        <div className="text-sm opacity-80 mt-1">Impacts vehicle performance or passenger comfort</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('driver_concern', !responses.driver_concern); onNext(); }}
                                    selected={responses.driver_concern}
                                    variant="warning"
                                    icon={<span className="text-xl">👨‍💼</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Driver Expressed Concern</div>
                                        <div className="text-sm opacity-80 mt-1">Driver feels unsafe or uncomfortable continuing</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('getting_worse', !responses.getting_worse); onNext(); }}
                                    selected={responses.getting_worse}
                                    variant="warning"
                                    icon={<span className="text-xl">📈</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Getting Progressively Worse</div>
                                        <div className="text-sm opacity-80 mt-1">Issue is deteriorating over time</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('previous_defect', !responses.previous_defect); onNext(); }}
                                    selected={responses.previous_defect}
                                    variant="warning"
                                    icon={<span className="text-xl">🔄</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Repeat/Previous Defect</div>
                                        <div className="text-sm opacity-80 mt-1">Same issue reported before</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => { updateResponse('minor_cosmetic', !responses.minor_cosmetic); onNext(); }}
                                    selected={responses.minor_cosmetic}
                                    variant="success"
                                    icon={<span className="text-xl">✅</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Minor/Cosmetic Only</div>
                                        <div className="text-sm opacity-80 mt-1">No safety or operational impact</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        {/* Photo capture placeholder */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">📸 Documentation</h3>
                            
                            <MobileTouchButton
                                onClick={() => {
                                    // Placeholder for camera integration
                                    alert('Camera integration coming in next update!');
                                    updateResponse('photo_taken', true);
                                }}
                                selected={responses.photo_taken}
                                variant="default"
                                icon={<Camera className="w-6 h-6" />}
                            >
                                <div>
                                    <div className="font-semibold">Take Photo of Issue</div>
                                    <div className="text-sm opacity-80 mt-1">Document the problem visually</div>
                                </div>
                            </MobileTouchButton>
                        </div>
                    </div>
                );

            case 3:
                const decision = getDecision();
                const severity = getSeverity();
                
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={decision === 'STOP' ? <XCircle className="w-8 h-8" /> : 
                                  decision === 'AMBER' ? <AlertTriangle className="w-8 h-8" /> : 
                                  <CheckCircle className="w-8 h-8" />}
                            title={decision === 'STOP' ? "🛑 STOP IMMEDIATELY" : 
                                   decision === 'AMBER' ? "🟡 PROCEED WITH CAUTION" : 
                                   "🟢 CONTINUE IN SERVICE"}
                            description={`Assessment complete - ${severity.toLowerCase()} severity issue`}
                            variant={decision === 'STOP' ? "danger" : decision === 'AMBER' ? "warning" : "success"}
                            emergency={decision === 'STOP'}
                        />

                        {decision === 'STOP' && (
                            <MobileAlertCard 
                                type="danger" 
                                title="IMMEDIATE STOP REQUIRED"
                                icon={<Shield className="w-6 h-6" />}
                            >
                                <div className="space-y-3">
                                    <p className="font-semibold">Safety critical issue identified. Vehicle must stop immediately.</p>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <p className="font-semibold mb-2">Immediate Actions:</p>
                                        <ol className="space-y-1 text-sm">
                                            <li>1. Stop vehicle safely</li>
                                            <li>2. Contact engineering</li>
                                            <li>3. Keep passengers informed</li>
                                            <li>4. Document everything</li>
                                        </ol>
                                    </div>
                                </div>
                            </MobileAlertCard>
                        )}

                        {decision === 'AMBER' && (
                            <MobileAlertCard 
                                type="warning" 
                                title="PROCEED WITH CAUTION"
                                icon={<AlertTriangle className="w-6 h-6" />}
                            >
                                <div className="space-y-3">
                                    <p>Issue affects operation but can continue to planned changeover point.</p>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <p className="font-semibold mb-2">Next Steps:</p>
                                        <ul className="space-y-1 text-sm">
                                            <li>• Continue to next changeover point</li>
                                            <li>• Monitor issue closely</li>
                                            <li>• Stop if condition worsens</li>
                                            <li>• Arrange changeover at earliest opportunity</li>
                                        </ul>
                                    </div>
                                </div>
                            </MobileAlertCard>
                        )}

                        {decision === 'CONTINUE' && (
                            <MobileAlertCard 
                                type="success" 
                                title="CONTINUE IN SERVICE"
                                icon={<CheckCircle className="w-6 h-6" />}
                            >
                                <div className="space-y-3">
                                    <p>Minor issue identified. Vehicle can continue normal service.</p>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <p className="font-semibold mb-2">Next Steps:</p>
                                        <ul className="space-y-1 text-sm">
                                            <li>• Log defect in Go-Check</li>
                                            <li>• Continue normal service</li>
                                            <li>• Repair at next maintenance</li>
                                        </ul>
                                    </div>
                                </div>
                            </MobileAlertCard>
                        )}

                        {/* Action confirmations */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Confirm Actions</h3>
                            
                            <MobileTouchButton
                                onClick={() => { updateResponse('driver_informed', !responses.driver_informed); onNext(); }}
                                selected={responses.driver_informed}
                                variant="warning"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Driver informed of decision</div>
                                    <div className="text-sm opacity-80 mt-1">Clear instructions provided</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => { updateResponse('logged_in_system', !responses.logged_in_system); onNext(); }}
                                selected={responses.logged_in_system}
                                variant="warning"
                                icon={<span className="text-xl">📋</span>}
                            >
                                <div>
                                    <div className="font-semibold">Logged in Go-Check system</div>
                                    <div className="text-sm opacity-80 mt-1">Defect properly documented</div>
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
                                        <div className="font-semibold">Engineering contacted</div>
                                        <div className="text-sm opacity-80 mt-1">Immediate assistance requested</div>
                                    </div>
                                </MobileTouchButton>
                            )}
                        </div>

                        {/* Additional notes */}
                        <MobileInput
                            label="📝 Final Notes"
                            value={responses.final_notes || ''}
                            onChange={(value) => updateResponse('final_notes', value)}
                            placeholder="Any additional information or observations..."
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
                totalSteps={3}
                onNext={() => {
                    if (currentStep === 3) {
                        const decision = getDecision();
                        const severity = getSeverity();
                        
                        onComplete({
                            assessment_type: 'general_assessment',
                            issue_type: responses.issue_type,
                            issue_description: responses.issue_description,
                            location: responses.location,
                            severity: severity,
                            decision: decision,
                            impact_factors: {
                                safety_critical: responses.safety_critical,
                                affects_operation: responses.affects_operation,
                                driver_concern: responses.driver_concern,
                                getting_worse: responses.getting_worse,
                                previous_defect: responses.previous_defect,
                                minor_cosmetic: responses.minor_cosmetic
                            },
                            documentation: {
                                photo_taken: responses.photo_taken
                            },
                            actions_taken: {
                                driver_informed: responses.driver_informed,
                                logged_in_system: responses.logged_in_system,
                                engineering_contacted: responses.engineering_contacted
                            },
                            final_notes: responses.final_notes,
                            safety_compliance: 'DVSA_COMPLIANT',
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        onNext();
                    }
                }}
                onPrevious={onPrevious}
                nextDisabled={
                    currentStep === 1 && (!responses.issue_type || !responses.issue_description) ||
                    currentStep === 2 && !(responses.safety_critical || responses.affects_operation || responses.driver_concern || responses.getting_worse || responses.previous_defect || responses.minor_cosmetic)
                }
                nextLabel={currentStep === 3 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the component
window.MobileGeneralAssessmentWizard = MobileGeneralAssessmentWizard;

export default MobileGeneralAssessmentWizard;
