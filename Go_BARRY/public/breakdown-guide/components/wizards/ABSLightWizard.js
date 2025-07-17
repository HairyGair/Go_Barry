// ABS Light Wizard Component - Safety-Critical ABS System Assessment
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - ABS Light Section (Page 14)

const ABSLightWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">⚠️ ABS Light System Assessment</h2>
                        <p className="text-gray-300">Critical safety evaluation following SDC Engineering Issues Guide - Anti-lock Braking System diagnostics.</p>
                    </div>
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-semibold text-amber-200 mb-4">🚨 ANTI-LOCK BRAKING SYSTEM ALERT</h3>
                        <p className="text-amber-300/80 text-sm leading-relaxed mb-4">
                            ABS lights indicate issues with the anti-lock braking system. The color and behavior of the light determines the severity and required response.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-amber-200 mb-2">SDC ABS Light Protocol:</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                <li>RED ABS: Critical system failure - immediate stop required</li>
                                <li>AMBER ABS: System warning - reduced functionality</li>
                                <li>Both require reset procedure and assessment</li>
                                <li>Engineering inspection mandatory for all ABS faults</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">ABS Light Color Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What color is the ABS warning light that is illuminated?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('absColor', 'amber')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.absColor === 'amber'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.absColor === 'amber' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.absColor === 'amber' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🟡 AMBER ABS Light</span>
                                        <p className="text-sm text-gray-300 mt-1">Standard ABS warning - system may have reduced functionality</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('absColor', 'red')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.absColor === 'red'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.absColor === 'red' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.absColor === 'red' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔴 RED ABS Light</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical ABS/EBS failure - immediate attention required</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Light Behavior Pattern</h3>
                        <p className="text-blue-300/80 text-sm mb-4">How is the ABS light behaving on the dashboard?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('lightBehavior', 'constant')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.lightBehavior === 'constant'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightBehavior === 'constant' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightBehavior === 'constant' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💡 Constantly illuminated</span>
                                        <p className="text-sm text-gray-300 mt-1">Light remains continuously on</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('lightBehavior', 'intermittent')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.lightBehavior === 'intermittent'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightBehavior === 'intermittent' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightBehavior === 'intermittent' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚡ Intermittent/Flashing</span>
                                        <p className="text-sm text-gray-300 mt-1">Light flashing or appearing intermittently</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Safety Warning for Red ABS */}
                    {responses.absColor === 'red' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL ABS SYSTEM ALERT</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Red ABS light indicates serious braking system fault</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate SDC Requirements:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Reset procedure must be attempted immediately</li>
                                                <li>If reset fails, vehicle must stop immediately</li>
                                                <li>Engineering attendance required</li>
                                                <li>Braking performance may be compromised</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.absColor || !responses.lightBehavior}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Begin Reset Procedure
                        </button>
                    </div>
                </div>
            );

        case 2:
            const isRedABS = responses.absColor === 'red';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔄 SDC Reset Procedure</h2>
                        <p className="text-gray-300">Mandatory reset procedure for {isRedABS ? 'RED' : 'AMBER'} ABS light following SDC protocol.</p>
                    </div>

                    {/* Color-specific warning */}
                    {isRedABS ? (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🔴 RED ABS Light - Critical System Alert</h3>
                                    <p className="text-red-300/90">
                                        A red ABS light indicates a serious braking system fault. The reset procedure must be completed immediately to determine if the fault persists.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                            <h3 className="text-lg font-bold text-amber-200 mb-3">🟡 AMBER ABS Light - System Warning</h3>
                            <p className="text-amber-300/80">
                                An amber ABS light indicates the ABS system may not be fully functional. The vehicle can brake normally but without ABS assistance during emergency stops.
                            </p>
                        </div>
                    )}
                    
                    {/* Reset procedure instructions */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-bold text-blue-200 mb-4">📋 Step 1: Mandatory Reset Procedure</h3>
                        <ol className="list-decimal ml-6 space-y-3 text-blue-300/90">
                            <li>Find a safe location to stop the vehicle</li>
                            <li>Apply parking brake and ensure vehicle is secure</li>
                            <li>Switch off the engine completely</li>
                            <li>Wait 30 seconds for all systems to fully shut down</li>
                            <li>Restart the vehicle and allow engine to stabilize</li>
                            <li>Drive the vehicle to reach 10mph to complete system check</li>
                        </ol>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                            <p className="text-blue-300/80 text-sm">
                                <strong>Note:</strong> The ABS system performs self-diagnostics once the vehicle reaches 10mph. This is when you can assess if the reset was successful.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="font-semibold text-white mb-4">Reset Procedure Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Has the driver completed the full reset procedure (including reaching 10mph)?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('resetCompleted', 'yes')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.resetCompleted === 'yes'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.resetCompleted === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.resetCompleted === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Yes - Reset procedure completed successfully</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle has been shut down, restarted, and reached 10mph</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('resetCompleted', 'no')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.resetCompleted === 'no'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.resetCompleted === 'no' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.resetCompleted === 'no' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ No - Unable to complete reset procedure</span>
                                        <p className="text-sm text-gray-300 mt-1">Safety concerns or operational issues prevent reset</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.resetCompleted}
                            className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Check Results <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            const isRed = responses.absColor === 'red';
            const resetDone = responses.resetCompleted === 'yes';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Post-Reset Assessment</h2>
                        <p className="text-gray-300">Evaluate ABS light status after reset procedure to determine next actions.</p>
                    </div>
                    
                    {resetDone ? (
                        <div className="space-y-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <p className="text-gray-300 mb-4">
                                    After completing the reset procedure and reaching 10mph, the ABS system has performed its self-diagnostic check.
                                </p>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="font-semibold text-white mb-4">ABS Light Status After Reset</h3>
                                <p className="text-gray-300 text-sm mb-4">Is the {isRed ? 'RED' : 'AMBER'} ABS light still illuminated after the reset procedure?</p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateResponse('lightStillOn', 'no')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lightStillOn === 'no'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.lightStillOn === 'no' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                            }`}>
                                                {responses.lightStillOn === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">✅ Light is OFF - Reset Successful</span>
                                                <p className="text-sm text-gray-300 mt-1">ABS system has cleared the fault successfully</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => updateResponse('lightStillOn', 'yes')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lightStillOn === 'yes'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.lightStillOn === 'yes' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                            }`}>
                                                {responses.lightStillOn === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">🚨 Light remains ON - Fault Persists</span>
                                                <p className="text-sm text-gray-300 mt-1">ABS system fault continues after reset</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Critical warning for persistent red ABS */}
                            {responses.lightStillOn === 'yes' && isRed && (
                                <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                    <div className="flex items-start space-x-4">
                                        <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-bold text-red-200 mb-3">🛑 Critical Fault Persists</h3>
                                            <p className="text-red-300/90">
                                                Red ABS light remaining on after reset indicates a serious braking system fault that requires immediate engineering attention.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                            <h3 className="text-lg font-bold text-amber-200 mb-3">⚠️ Unable to Complete Reset</h3>
                            <p className="text-amber-300/80">
                                If the reset procedure cannot be completed safely, immediate engineering assistance is required to assess the ABS system.
                            </p>
                        </div>
                    )}
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={resetDone && !responses.lightStillOn}
                            className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Final Decision <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            const redLight = responses.absColor === 'red';
            const wasReset = responses.resetCompleted === 'yes';
            const stillOn = responses.lightStillOn === 'yes';
            
            // Determine action based on SDC guide logic
            let action = '';
            let severity = '';
            let bgColor = '';
            let borderColor = '';
            let textColor = '';
            let icon = '';
            
            if (redLight) {
                if (!wasReset || stillOn) {
                    action = 'stop_await_engineering';
                    severity = 'CRITICAL - STOP VEHICLE';
                    bgColor = 'bg-red-500/30';
                    borderColor = 'border-red-400/50';
                    textColor = 'text-red-200';
                    icon = '🛑';
                } else {
                    action = 'changeover_earliest';
                    severity = 'HIGH PRIORITY - CHANGEOVER REQUIRED';
                    bgColor = 'bg-orange-500/20';
                    borderColor = 'border-orange-400/30';
                    textColor = 'text-orange-200';
                    icon = '⚠️';
                }
            } else { // Amber
                if (!wasReset || stillOn) {
                    action = 'changeover_earliest';
                    severity = 'CHANGEOVER REQUIRED';
                    bgColor = 'bg-amber-500/20';
                    borderColor = 'border-amber-400/30';
                    textColor = 'text-amber-200';
                    icon = '⚠️';
                } else {
                    action = 'continue_log_defect';
                    severity = 'CONTINUE - MONITOR SYSTEM';
                    bgColor = 'bg-green-500/20';
                    borderColor = 'border-green-400/30';
                    textColor = 'text-green-200';
                    icon = '✅';
                }
            }
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 ABS System Assessment Report</h2>
                        <p className="text-gray-300">Complete ABS light assessment with SDC-compliant safety decision.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">ABS Light Color:</span>
                                <span className="text-white ml-2">{redLight ? '🔴 Red' : '🟡 Amber'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Light Behavior:</span>
                                <span className="text-white ml-2">{responses.lightBehavior}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Reset Completed:</span>
                                <span className="text-white ml-2">{wasReset ? 'Yes' : 'No'}</span>
                            </div>
                            {wasReset && (
                                <div>
                                    <span className="text-gray-400">Light After Reset:</span>
                                    <span className="text-white ml-2">{stillOn ? 'Still On' : 'Cleared'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Final Decision */}
                    <div className={`${bgColor} backdrop-blur-sm rounded-lg p-6 border ${borderColor}`}>
                        <div className="text-center">
                            <div className="text-6xl mb-4">{icon}</div>
                            <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>{severity}</h3>
                            
                            {/* Action-specific instructions */}
                            {action === 'stop_await_engineering' && (
                                <div className="text-left mt-6">
                                    <h4 className="font-semibold text-red-200 mb-3">Immediate Actions Required:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-red-300/90 text-sm">
                                        <li>Driver must stop the vehicle safely immediately</li>
                                        <li>Do not continue in service under any circumstances</li>
                                        <li>Contact engineering team for immediate attendance</li>
                                        <li>Await engineering inspection before moving vehicle</li>
                                        <li>Log defect in Go-Check with "CRITICAL" priority status</li>
                                        <li>Arrange passenger transfer if vehicle was in service</li>
                                    </ol>
                                </div>
                            )}
                            
                            {action === 'changeover_earliest' && (
                                <div className="text-left mt-6">
                                    <h4 className={`font-semibold mb-3 ${redLight ? 'text-orange-200' : 'text-amber-200'}`}>Required Actions:</h4>
                                    <ol className={`list-decimal ml-6 space-y-2 text-sm ${redLight ? 'text-orange-300/90' : 'text-amber-300/90'}`}>
                                        <li>Vehicle may continue temporarily to safe changeover point</li>
                                        <li>Arrange replacement vehicle at earliest opportunity</li>
                                        <li>Monitor brake performance continuously</li>
                                        <li>Log defect in Go-Check system immediately</li>
                                        <li>Inform engineering of ABS system fault</li>
                                        <li>If any brake performance issues occur, stop immediately</li>
                                    </ol>
                                </div>
                            )}
                            
                            {action === 'continue_log_defect' && (
                                <div className="text-left mt-6">
                                    <h4 className="font-semibold text-green-200 mb-3">Monitoring Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-green-300/90 text-sm">
                                        <li>Vehicle may remain in service safely</li>
                                        <li>Log the ABS incident in Go-Check system</li>
                                        <li>Monitor for ABS light reoccurrence</li>
                                        <li>If light returns, arrange changeover immediately</li>
                                        <li>Include ABS check in next routine maintenance</li>
                                        <li>Normal braking available (without ABS assistance)</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Important Reminders */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-bold text-blue-200 mb-3">🔔 Important Safety Reminders</h3>
                        <ul className="list-disc ml-6 space-y-1 text-blue-300/90 text-sm">
                            <li>ABS faults must always be checked by a qualified engineer</li>
                            <li>Regular brakes still function without ABS, but stopping distances may increase</li>
                            <li>Safety is the priority - any doubts about brake performance, stop immediately</li>
                            <li>Document all ABS warnings in Go-Check for maintenance tracking</li>
                        </ul>
                    </div>
                    
                    {/* Go-Check Reminder */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-purple-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-purple-200 mb-2">📱 Go-Check Documentation Required</h4>
                                <p className="text-purple-300/80 text-sm">
                                    Record this ABS assessment in the Go-Check system immediately when vehicle is stationary and in a safe location. 
                                    Include ABS light color, reset attempt results, and final safety decision.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onComplete}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.ABSLightWizard = ABSLightWizard;