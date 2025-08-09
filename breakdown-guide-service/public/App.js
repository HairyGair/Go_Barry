// Main Application Component
// Uses React hooks and all wizard components

const App = function() {
    const { useState, useEffect } = React;
    const { Home } = window.Icons || {};
    
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [supervisorSession, setSupervisorSession] = useState(null);
    
    // Assessment state
    const [currentWizard, setCurrentWizard] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [responses, setResponses] = useState({});
    const [assessmentId, setAssessmentId] = useState(null);

    // Handle successful login
    const handleLoginSuccess = (session) => {
        setSupervisorSession(session);
        setIsAuthenticated(true);
        
        // Initialize the logger with supervisor session
        if (window.SupervisorBreakdownLogger) {
            window.SupervisorBreakdownLogger.setSupervisor(session);
        }
        
        // Also update BreakdownAnalytics for compatibility
        if (window.BreakdownAnalytics) {
            window.BreakdownAnalytics.setSupervisor(session);
        }
        
        console.log(`Supervisor ${session.supervisorId} authenticated successfully`);
    };

    const updateResponse = (key, value) => {
        setResponses(prev => ({ ...prev, [key]: value }));
        
        // Log every response change
        if (window.SupervisorBreakdownLogger && assessmentId) {
            window.SupervisorBreakdownLogger.logAction('RESPONSE_UPDATED', {
                field: key,
                value: value,
                step: currentStep,
                wizard: currentWizard
            });
        }
    }



    const handleNext = () => {
        // Log step completion before moving to next
        if (window.SupervisorBreakdownLogger && assessmentId) {
            window.SupervisorBreakdownLogger.logStepProgression(
                currentStep,
                `Step ${currentStep} of ${currentWizard}`,
                responses
            );
        }
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevious = () => {
        // Log navigation back
        if (window.SupervisorBreakdownLogger && assessmentId) {
            window.SupervisorBreakdownLogger.logAction('NAVIGATION_BACK', {
                fromStep: currentStep,
                toStep: currentStep - 1
            });
        }
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleComplete = async () => {
        // Complete assessment with enhanced logging
        if (window.SupervisorBreakdownLogger && assessmentId) {
            // Determine the decision based on wizard responses
            let decision = 'CONTINUE';
            
            // Check for critical issues based on wizard type
            if (currentWizard === 'brakes') {
                const criticalIssues = responses.brakeToFloor || responses.delayedBraking || 
                                     responses.brakeLeaks || responses.brakesGrabbing || 
                                     responses.redABSLight;
                decision = criticalIssues ? 'STOP' : (responses.otherBrakeConcerns === 'yes' ? 'AMBER' : 'CONTINUE');
            } else if (currentWizard === 'steering') {
                const criticalIssues = responses.excessivePlay === 'yes' || responses.difficultyTurning === 'yes' ||
                                     responses.steeringNoises === 'yes' || responses.vehiclePulling === 'yes';
                decision = criticalIssues ? 'STOP' : 'CONTINUE';
            } else if (currentWizard === 'oil_warning') {
                decision = 'STOP'; // Oil warning is always critical
            } else if (currentWizard === 'loose_wheel_nuts') {
                decision = 'STOP'; // Loose wheel nuts are always critical
            }
            
            // Log the final decision
            window.SupervisorBreakdownLogger.logSafetyDetermination(
                currentWizard,
                decision,
                decision === 'STOP' ? 'Vehicle must not continue' : 
                decision === 'AMBER' ? 'Proceed with caution' : 'Safe to continue'
            );
            
            // Complete the assessment with supervisor details
            const result = await window.SupervisorBreakdownLogger.completeAssessment(
                decision,
                responses
            );
            
            if (result.success) {
                console.log('Assessment completed and synced successfully');
            } else if (result.offline) {
                console.log('Assessment saved offline for later sync');
            }
        }
        
        // Also integrate with existing Breakdown Analytics
        if (window.BreakdownAnalytics && responses.fleetNumber) {
            try {
                // Determine the decision based on wizard responses
                let decision = 'CONTINUE';
                
                // Check for critical issues based on wizard type
                if (currentWizard === 'brakes') {
                    const criticalIssues = responses.brakeToFloor || responses.delayedBraking || 
                                         responses.brakeLeaks || responses.brakesGrabbing || 
                                         responses.redABSLight;
                    decision = criticalIssues ? 'STOP' : (responses.otherBrakeConcerns === 'yes' ? 'AMBER' : 'CONTINUE');
                } else if (currentWizard === 'steering') {
                    const criticalIssues = responses.excessivePlay === 'yes' || responses.difficultyTurning === 'yes' ||
                                         responses.steeringNoises === 'yes' || responses.vehiclePulling === 'yes';
                    decision = criticalIssues ? 'STOP' : 'CONTINUE';
                } else if (currentWizard === 'oil_warning') {
                    decision = 'STOP'; // Oil warning is always critical
                } else if (currentWizard === 'loose_wheel_nuts') {
                    decision = 'STOP'; // Loose wheel nuts are always critical
                }
                
                // Record the breakdown
                const result = await window.BreakdownAnalytics.recordBreakdown(
                    currentWizard,
                    responses,
                    decision
                );
                
                if (result.success) {
                    console.log('Breakdown recorded successfully');
                } else if (result.offline) {
                    console.log('Breakdown stored offline for later sync');
                }
                
                // Check for patterns
                if (responses.fleetNumber && responses.depot) {
                    const patterns = await window.BreakdownAnalytics.checkPatterns(
                        responses.fleetNumber,
                        responses.depot || window.BreakdownAnalytics.detectDepot(responses.fleetNumber)
                    );
                    
                    if (patterns.length > 0) {
                        console.log('Pattern alerts:', patterns);
                        // Could show pattern alerts to supervisor here
                    }
                }
            } catch (error) {
                console.error('Failed to record breakdown:', error);
            }
        }
        
        alert('Assessment completed! Data has been recorded.');
        setCurrentWizard(null);
        setCurrentStep(1);
        setResponses({});
    };

    const handleWizardSelect = (wizardType) => {
        // Start a new assessment with supervisor tracking
        if (window.SupervisorBreakdownLogger && supervisorSession) {
            const fleetNumber = prompt('Enter Fleet Number (e.g., 6301):');
            const depot = prompt('Enter Depot (e.g., Riverside):') || supervisorSession.depot;
            
            if (fleetNumber) {
                const assessmentStarted = window.SupervisorBreakdownLogger.startAssessment(
                    wizardType,
                    fleetNumber,
                    depot
                );
                
                if (assessmentStarted) {
                    setAssessmentId(window.SupervisorBreakdownLogger.currentAssessment.id);
                    setResponses({ fleetNumber, depot });
                }
            } else {
                alert('Fleet number is required to start an assessment');
                return;
            }
        }
        
        setCurrentWizard(wizardType);
        setCurrentStep(1);
    };

    const handleBackToMenu = () => {
        // Log assessment cancellation if active
        if (window.SupervisorBreakdownLogger && assessmentId && currentWizard) {
            window.SupervisorBreakdownLogger.logAction('ASSESSMENT_CANCELLED', {
                wizard: currentWizard,
                atStep: currentStep,
                reason: 'User returned to menu'
            });
        }
        
        setCurrentWizard(null);
        setCurrentStep(1);
        setResponses({});
        setAssessmentId(null);
    };
    
    // If not authenticated, show login screen
    if (!isAuthenticated) {
        return React.createElement(window.SupervisorLogin, {
            onLoginSuccess: handleLoginSuccess
        });
    }

    // Steering Wizard - Safety Critical
    if (currentWizard === 'steering') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <SteeringWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Brakes Wizard - Safety Critical
    if (currentWizard === 'brakes') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <BrakesWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // ABS Light Wizard - Safety Critical
    if (currentWizard === 'abs_light') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - ABS/EBS System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <ABSLightWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Oil Warning Light Wizard - Safety Critical
    if (currentWizard === 'oil_warning') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - CRITICAL ENGINE SYSTEM</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <OilWarningLightWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Road Traffic Incidents Wizard - High Priority
    if (currentWizard === 'road_traffic_incidents') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - CRITICAL INCIDENT</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <RoadTrafficIncidentsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                        onWizardSelect={handleWizardSelect}
                    />
                </div>
            </div>
        );
    }

    // TracerIt Helper Wizard - High Priority
    if (currentWizard === 'tracerit_helper') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - TRACERIT DATA COLLECTION</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <TracerItHelperWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                        onWizardSelect={handleWizardSelect}
                    />
                </div>
            </div>
        );
    }

    // Repeat Defects Wizard - High Priority
    if (currentWizard === 'repeat_defects') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - HIGH PRIORITY</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <RepeatDefectsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Interior Lights Wizard
    if (currentWizard === 'interior_lights') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Operational System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <InteriorLightsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Exterior Lights Wizard
    if (currentWizard === 'exterior_lights') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Operational System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <ExteriorLightsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Wheelchair Ramp Wizard
    if (currentWizard === 'wheelchair_ramp') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Accessibility System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <WheelchairRampWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Destination Display Wizard
    if (currentWizard === 'destination_display') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Operational System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <DestinationDisplayWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Battery Wizard
    if (currentWizard === 'battery') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Operational System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <BatteryWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Cooling System Wizard
    if (currentWizard === 'cooling_system') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Cooling System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <CoolingSystemWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Demisters Heaters Wizard
    if (currentWizard === 'demisters_heaters') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Climate Control</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <DemistersHeatersWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Doors Wizard
    if (currentWizard === 'doors') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Door System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <DoorsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Non Starter Wizard
    if (currentWizard === 'non_starter') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Starting System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <NonStarterWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Gear Selection Wizard
    if (currentWizard === 'gear_selection') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Transmission System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <GearSelectionWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Loose Wheel Nuts Wizard - Safety Critical
    if (currentWizard === 'loose_wheel_nuts') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - CRITICAL WHEEL SAFETY</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <LooseWheelNutsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Puncture Wizard - Safety Critical
    if (currentWizard === 'puncture') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - TIRE SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <PunctureWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Gearbox Wizard
    if (currentWizard === 'gearbox') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Gearbox Temperature</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <GearboxWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Buzzers Wizard
    if (currentWizard === 'buzzers') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Warning Buzzer System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <BuzzersWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Warning Lights Wizard
    if (currentWizard === 'warning_lights') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Dashboard Warning System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <WarningLightsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Excessive Smoke Wizard
    if (currentWizard === 'excessive_smoke') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Excessive Smoke Assessment</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <ExcessiveSmokeWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Suspension Wizard
    if (currentWizard === 'suspension') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Suspension System Assessment</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <SuspensionWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Wipers/Screenwash Wizard
    if (currentWizard === 'wipers_screenwash') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Wipers/Screenwash System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <WipersScreenwashWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Low Water Wizard - Operational System
    if (currentWizard === 'low_water') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Water Management System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <LowWaterWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Broken Windows Wizard - Safety Critical
    if (currentWizard === 'broken_windows') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <BrokenWindowsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Wing Mirrors Wizard - Safety Critical
    if (currentWizard === 'wing_mirrors') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <WingMirrorsWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Cutting Out/Fuel Wizard - Safety Critical
    if (currentWizard === 'cutting_out_fuel') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - SAFETY CRITICAL</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <CuttingOutFuelWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Speedometer Wizard - Operational System
    if (currentWizard === 'speedo') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                
                {/* Header */}
                <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>
                                    <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                    <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide - Speedometer System</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBackToMenu}
                                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <Home className="w-4 h-4 mr-2" />Back to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <SpeedoWizard
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={updateResponse}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        );
    }

    // Main Menu - Default view when no wizard is selected
    // Interior/Exterior Damage Wizard - Operational
    if (currentWizard === 'interior_exterior_damage') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Animated background effect */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-40 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10">
                    <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center h-16">
                                <div className="flex items-center">
                                    <img src="./gobarry-logo.png" alt="Go BARRY" className="h-8 w-auto" />
                                    <span className="ml-4 text-gray-400 text-sm">Breakdown Guide System</span>
                                </div>
                                <button onClick={handleBackToMenu} className="flex items-center px-4 py-2 text-gray-300 hover:text-white transition-colors">
                                    {Home && <Home className="w-4 h-4 mr-2" />}
                                    Back to Menu
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {window.InteriorExteriorDamageWizard && React.createElement(window.InteriorExteriorDamageWizard, {
                            currentStep,
                            responses,
                            updateResponse,
                            onNext: handleNext,
                            onPrevious: handlePrevious,
                            onComplete: handleComplete
                        })}
                    </main>
                </div>
            </div>
        );
    }

    const defectCategories = [
        // Safety Critical - Red
        { id: 'steering', name: 'Steering', icon: '🚗', category: 'safety' },
        { id: 'brakes', name: 'Brakes', icon: '🛑', category: 'safety' },
        { id: 'abs_light', name: 'ABS/EBS Light', icon: '⚠️', category: 'safety' },
        { id: 'oil_warning', name: 'Oil Warning', icon: '🛢️', category: 'safety' },
        { id: 'loose_wheel_nuts', name: 'Loose Wheel Nuts', icon: '🔧', category: 'safety' },
        { id: 'puncture', name: 'Puncture', icon: '🛞', category: 'safety' },
        { id: 'broken_windows', name: 'Broken Windows', icon: '🪟', category: 'safety' },
        { id: 'wing_mirrors', name: 'Wing Mirrors', icon: '🪞', category: 'safety' },
        { id: 'cutting_out_fuel', name: 'Cutting Out/Fuel', icon: '⛽', category: 'safety' },
        
        // High Priority - Amber
        { id: 'repeat_defects', name: 'Repeat Defects', icon: '🔄', category: 'high_priority' },
        { id: 'road_traffic_incidents', name: 'Traffic Incidents', icon: '🚨', category: 'high_priority' },
        { id: 'tracerit_helper', name: 'TracerIt Helper', icon: '📋', category: 'high_priority' },
        
        // Operational Systems - Blue
        { id: 'interior_lights', name: 'Interior Lights', icon: '💡', category: 'operational' },
        { id: 'exterior_lights', name: 'Exterior Lights', icon: '🔆', category: 'operational' },
        { id: 'wheelchair_ramp', name: 'Wheelchair Ramp', icon: '♿', category: 'operational' },
        { id: 'destination_display', name: 'Destination Display', icon: '📺', category: 'operational' },
        { id: 'battery', name: 'Battery', icon: '🔋', category: 'operational' },
        { id: 'cooling_system', name: 'Cooling System', icon: '🌡️', category: 'operational' },
        { id: 'demisters_heaters', name: 'Demisters/Heaters', icon: '❄️', category: 'operational' },
        { id: 'doors', name: 'Doors', icon: '🚺', category: 'operational' },
        { id: 'non_starter', name: 'Non Starter', icon: '🔑', category: 'operational' },
        { id: 'gear_selection', name: 'Gear Selection', icon: '⚙️', category: 'operational' },
        { id: 'gearbox', name: 'Gearbox', icon: '⚙️', category: 'operational' },
        { id: 'buzzers', name: 'Buzzers', icon: '🔊', category: 'operational' },
        { id: 'warning_lights', name: 'Warning Lights', icon: '⚠️', category: 'operational' },
        { id: 'excessive_smoke', name: 'Excessive Smoke', icon: '💨', category: 'operational' },
        { id: 'suspension', name: 'Suspension', icon: '🏗️', category: 'operational' },
        { id: 'wipers_screenwash', name: 'Wipers/Screenwash', icon: '🧽', category: 'operational' },
        { id: 'low_water', name: 'Low Water', icon: '💧', category: 'operational' },
        { id: 'speedo', name: 'Speedometer', icon: '📊', category: 'operational' },
        




        { id: 'interior_exterior_damage', name: 'Interior/Exterior Damage', icon: '🔨', category: 'operational' }
    ];
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Animated background effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
            
            {/* Header */}
            <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <img src="./gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                </div>
                                <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                                <span className="hidden sm:block text-sm font-medium text-white/70">Breakdown Guide System</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Supervisor Info */}
                            <div className="flex items-center space-x-3 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div className="text-sm">
                                    <div className="text-white font-medium">{supervisorSession?.supervisorName || 'Supervisor'}</div>
                                    <div className="text-green-400 text-xs">{supervisorSession?.supervisorId} • {supervisorSession?.depot}</div>
                                </div>
                            </div>
                            
                            <a
                                href="https://goahead.tranzaura.com/Login/UserLogin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Open Tranzaura
                            </a>
                            
                            {/* Logout Button */}
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to logout?')) {
                                        localStorage.removeItem('supervisor_session');
                                        sessionStorage.removeItem('supervisor_session');
                                        setIsAuthenticated(false);
                                        setSupervisorSession(null);
                                    }
                                }}
                                className="flex items-center px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Vehicle Breakdown Assessment</h1>
                    <p className="text-xl text-gray-300 mb-6">Select the type of defect you are experiencing to begin the guided assessment process</p>
                </div>
                
                {/* Safety Critical */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-red-500/30"></div>
                        <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider">Safety Critical</h2>
                        <div className="h-px flex-1 bg-red-500/30"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {defectCategories.filter(d => d.category === 'safety').map(defect => (
                            <button
                                key={defect.id}
                                onClick={() => handleWizardSelect(defect.id)}
                                className="group relative bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 hover:from-red-800/30 hover:to-red-700/30 hover:border-red-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex flex-col items-center gap-3">
                                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{defect.icon}</span>
                                    <span className="text-sm font-semibold text-white/90">{defect.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* High Priority */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-amber-500/30"></div>
                        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider">High Priority</h2>
                        <div className="h-px flex-1 bg-amber-500/30"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {defectCategories.filter(d => d.category === 'high_priority').map(defect => (
                            <button
                                key={defect.id}
                                onClick={() => handleWizardSelect(defect.id)}
                                className="group relative bg-gradient-to-br from-amber-900/20 to-amber-800/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 hover:from-amber-800/30 hover:to-amber-700/30 hover:border-amber-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex flex-col items-center gap-3">
                                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{defect.icon}</span>
                                    <span className="text-sm font-semibold text-white/90">{defect.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Operational Systems */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-blue-500/30"></div>
                        <h2 className="text-xs font-bold text-blue-500 uppercase tracking-wider">Operational Systems</h2>
                        <div className="h-px flex-1 bg-blue-500/30"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {defectCategories.filter(d => d.category === 'operational').map(defect => (
                            <button
                                key={defect.id}
                                onClick={() => handleWizardSelect(defect.id)}
                                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-6 hover:from-blue-800/30 hover:to-blue-700/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex flex-col items-center gap-3">
                                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{defect.icon}</span>
                                    <span className="text-sm font-semibold text-white/90">{defect.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Fleet Analytics Dashboard */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-purple-500/30"></div>
                        <h2 className="text-xs font-bold text-purple-500 uppercase tracking-wider">Fleet Analytics</h2>
                        <div className="h-px flex-1 bg-purple-500/30"></div>
                    </div>
                    <a
                        href="../breakdown-analytics"
                        className="block bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:from-purple-800/30 hover:to-purple-700/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <span className="text-3xl">📊</span>
                                    Fleet Breakdown Analytics Dashboard
                                </h3>
                                <p className="text-purple-300/80">View breakdown patterns, vehicle reliability scores, depot analysis, and operational insights</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                        Pattern Detection
                                    </span>
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                        Vehicle Rankings
                                    </span>
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                        Depot Insights
                                    </span>
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                        Real-time Alerts
                                    </span>
                                </div>
                            </div>
                            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </a>
                </div>
                
                {/* Coming Soon */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-slate-500/30"></div>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coming Soon</h2>
                        <div className="h-px flex-1 bg-slate-500/30"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {defectCategories.filter(d => d.category === 'coming_soon').map(defect => (
                            <button
                                key={defect.id}
                                disabled
                                className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 opacity-50 cursor-not-allowed"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-4xl grayscale opacity-50">{defect.icon}</span>
                                    <span className="text-sm font-semibold text-white/40">{defect.name}</span>
                                </div>
                                <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center">
                                    <span className="text-xs font-medium text-white/40 bg-slate-800/80 px-2 py-1 rounded-full">Soon</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                

                {/* Safety Notice */}
                <div className="mt-8 bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <span className="text-red-400">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-400 mb-2">Safety Declaration</h3>
                            <p className="text-red-300/80 text-sm leading-relaxed">
                                Safety is non-negotiable. Any action that compromises safety is unacceptable. 
                                If a vehicle has a safety-critical defect or risks receiving a PG9 prohibition, 
                                it must not remain in service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export to global scope
window.App = App;
