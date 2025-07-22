// Oil Warning Light Wizard Component - Safety-Critical Engine Protection System
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Oil Warning Light Section (Page 22)

const OilWarningLightWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🛢️ Oil Warning Light Emergency Assessment</h2>
                        <p className="text-gray-300">Critical engine protection system evaluation following SDC Engineering Issues Guide - immediate action required.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🚨 CRITICAL ENGINE PROTECTION SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            The oil warning light indicates low oil pressure or oil system failure. This can cause catastrophic engine damage within seconds if ignored.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Emergency Protocol:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>IMMEDIATE STOP REQUIRED - Do not delay</li>
                                <li>Engine damage occurs within seconds of oil pressure loss</li>
                                <li>Repair costs escalate rapidly with continued operation</li>
                                <li>Risk of complete engine seizure while driving</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">⚡ IMMEDIATE ACTION REQUIRED</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-orange-300/90 font-semibold mb-2">
                                Instruct the driver to stop the vehicle immediately:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-orange-300/80 text-sm">
                                <li>Find a safe location to stop immediately</li>
                                <li>Do NOT continue driving with oil light on</li>
                                <li>Switch off engine as soon as safely stopped</li>
                                <li>Every second of operation risks engine damage</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Safety Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Has the driver stopped the vehicle safely and switched off the engine?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicleStopped', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'yes'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Yes - Vehicle stopped safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Engine switched off, vehicle secure</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicleStopped', 'stopping')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'stopping'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'stopping' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'stopping' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ In process of stopping</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver is finding safe location to stop</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicleStopped', 'cannot')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'cannot'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'cannot' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'cannot' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Cannot stop immediately</span>
                                        <p className="text-sm text-gray-300 mt-1">On motorway or unsafe location</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    {/* Emergency Protocol for cannot stop */}
                    {responses.vehicleStopped === 'cannot' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 EMERGENCY PROTOCOL ACTIVATED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle cannot stop immediately - Engine damage imminent</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Emergency Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Activate hazard lights immediately</li>
                                                <li>Reduce speed gradually - do NOT rev engine</li>
                                                <li>Exit at next safe opportunity</li>
                                                <li>Prepare for potential engine failure</li>
                                                <li>Monitor for engine seizure symptoms</li>
                                                <li>Do NOT accelerate hard or rev engine</li>
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
                            disabled={!responses.vehicleStopped}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            const canInspect = responses.vehicleStopped === 'yes';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Oil Leak Inspection Protocol</h2>
                        <p className="text-gray-300">Visual inspection for oil leaks following SDC safety procedures.</p>
                    </div>

                    {canInspect ? (
                        <div className="space-y-6">
                            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                                <h3 className="text-lg font-bold text-blue-200 mb-4">📋 Visual Inspection Required</h3>
                                <p className="text-blue-300/80 mb-4">
                                    Ask the driver to check for visible oil leaks when safe to do so.
                                </p>
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <p className="text-sm font-semibold text-blue-200 mb-2">
                                        Safety First Protocol:
                                    </p>
                                    <ul className="list-disc ml-6 space-y-1 text-blue-300/80 text-sm">
                                        <li>Ensure vehicle is on level ground and secure</li>
                                        <li>Apply parking brake firmly</li>
                                        <li>Wait 2-3 minutes for oil to settle after stopping</li>
                                        <li>Check under vehicle for oil puddles/drips</li>
                                        <li>Look for wet patches on engine components</li>
                                        <li>Note any strong oil smells</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="font-semibold text-white mb-4">Oil Leak Assessment</h3>
                                <p className="text-gray-300 text-sm mb-4">Are there any visible oil leaks detected during the inspection?</p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateResponse('oilLeakVisible', 'yes')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'yes'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'yes' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">🚨 Yes - Oil leak visible</span>
                                                <p className="text-sm text-gray-300 mt-1">Oil puddle, drips, or wet patches visible</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => updateResponse('oilLeakVisible', 'no')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'no'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'no' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">✅ No - No visible oil leak</span>
                                                <p className="text-sm text-gray-300 mt-1">No signs of oil leakage found</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => updateResponse('oilLeakVisible', 'cannot_check')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'cannot_check'
                                                ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'cannot_check' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'cannot_check' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">⚠️ Cannot check safely</span>
                                                <p className="text-sm text-gray-300 mt-1">Unable to inspect due to location/conditions</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Oil leak confirmed warning */}
                            {responses.oilLeakVisible === 'yes' && (
                                <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                    <div className="flex items-start space-x-4">
                                        <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-bold text-red-200 mb-3">🛑 Oil Leak Confirmed</h3>
                                            <div className="text-red-300/90 space-y-2">
                                                <p className="font-semibold">Critical hazards identified:</p>
                                                <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                    <li>Do NOT attempt to start engine</li>
                                                    <li>Risk of fire if oil contacts hot surfaces</li>
                                                    <li>Environmental hazard requiring containment</li>
                                                    <li>May require spill kit deployment</li>
                                                    <li>Potential DVSA prohibition (PG9) risk</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                                <h3 className="text-lg font-bold text-amber-200 mb-3">⚠️ Vehicle Still Moving</h3>
                                <p className="text-amber-300/80 mb-3">
                                    Since the vehicle cannot stop immediately, we cannot perform a visual inspection.
                                </p>
                                <p className="text-amber-300/80 font-semibold">
                                    Assume worst case scenario - potential oil leak present.
                                </p>
                            </div>
                            
                            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                <h4 className="text-lg font-bold text-red-200 mb-3">🚨 Continue Emergency Stop Procedure</h4>
                                <ul className="list-disc ml-6 space-y-2 text-red-300/90">
                                    <li>Monitor for engine noises (knocking, grinding, tapping)</li>
                                    <li>Watch temperature gauge for overheating signs</li>
                                    <li>Be prepared for sudden engine seizure</li>
                                    <li>Stop at earliest safe opportunity</li>
                                    <li>Listen for unusual engine sounds</li>
                                    <li>Check for loss of power or rough running</li>
                                </ul>
                            </div>
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
                            disabled={canInspect && !responses.oilLeakVisible}
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Light Status Check <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            const vehicleStopped = responses.vehicleStopped === 'yes';
            const hasOilLeak = responses.oilLeakVisible === 'yes' || responses.oilLeakVisible === 'cannot_check';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">💡 Oil Light Behavior Analysis</h2>
                        <p className="text-gray-300">Understanding when the oil light appears helps determine the severity of the issue.</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <p className="text-gray-300 mb-4">
                            The timing and pattern of the oil warning light provides crucial diagnostic information about the severity of the oil system failure.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="font-semibold text-white mb-4">Oil Warning Light Behavior Pattern</h3>
                        <p className="text-gray-300 text-sm mb-4">Is/was the oil warning light:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('lightStatus', 'constant')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'constant'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'constant' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'constant' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Constantly ON while moving</span>
                                        <p className="text-sm text-gray-300 mt-1">Light stays on continuously - critical oil pressure loss</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('lightStatus', 'intermittent')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'intermittent'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'intermittent' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Intermittent/Flickering</span>
                                        <p className="text-sm text-gray-300 mt-1">Light comes on occasionally - still serious concern</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('lightStatus', 'idle_only')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'idle_only'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'idle_only' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'idle_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💙 Only at idle/stationary</span>
                                        <p className="text-sm text-gray-300 mt-1">Light appears when stopped but goes off when moving</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    {/* Critical oil pressure failure warning */}
                    {(responses.lightStatus === 'constant' || responses.lightStatus === 'intermittent') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 Critical Oil Pressure Failure</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Oil light while moving indicates severe oil system failure:</p>
                                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                            <li>Engine damage may already be occurring</li>
                                            <li>Complete engine failure possible at any moment</li>
                                            <li>Repair costs increase with every second of operation</li>
                                            <li>Risk of engine seizure while driving</li>
                                            <li>Potential bearing damage and internal component failure</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h4 className="text-lg font-bold text-amber-200 mb-3">🔍 Additional Symptoms Check</h4>
                        <p className="text-amber-300/80 mb-2">Ask the driver about these additional symptoms:</p>
                        <ul className="list-disc ml-6 space-y-1 text-amber-300/80 text-sm">
                            <li>Engine noises (knocking, tapping, grinding sounds)</li>
                            <li>Noticeable loss of power during acceleration</li>
                            <li>Engine running rough or misfiring</li>
                            <li>Blue or white smoke from exhaust</li>
                            <li>Burning oil smell in cabin or outside</li>
                            <li>Temperature gauge reading higher than normal</li>
                        </ul>
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
                            disabled={!responses.lightStatus}
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Final Assessment <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            const isStopped = responses.vehicleStopped === 'yes';
            const hasLeak = responses.oilLeakVisible === 'yes';
            const cannotCheckLeak = responses.oilLeakVisible === 'cannot_check';
            const lightConstant = responses.lightStatus === 'constant';
            const lightIntermittent = responses.lightStatus === 'intermittent';
            const idleOnly = responses.lightStatus === 'idle_only';
            
            // Per SDC guide - any oil light on or intermittent while moving = STOP
            const mustStop = hasLeak || lightConstant || lightIntermittent || cannotCheckLeak;
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Oil Warning System Assessment Report</h2>
                        <p className="text-gray-300">Complete engine protection system assessment with SDC-compliant emergency decision.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Vehicle Status:</span>
                                <span className="text-white ml-2">{isStopped ? '✅ Stopped safely' : '⚠️ Still moving'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Oil Leak:</span>
                                <span className="text-white ml-2">{
                                    hasLeak ? '🔴 Visible leak detected' : 
                                    cannotCheckLeak ? '⚠️ Unable to verify' : 
                                    '✅ No visible leak'
                                }</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Warning Light:</span>
                                <span className="text-white ml-2">{
                                    lightConstant ? '🔴 Constantly on' :
                                    lightIntermittent ? '🟡 Intermittent' :
                                    '🟢 Only at idle'
                                }</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Final Decision */}
                    {mustStop ? (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛑</div>
                                <h3 className="text-2xl font-bold text-red-200 mb-2">STOP IMMEDIATELY - AWAIT ENGINEERING</h3>
                                <p className="text-red-300/90 text-sm mb-6">
                                    Vehicle must remain stopped with engine OFF - Critical engine protection required
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-red-200 mb-3">Mandatory Immediate Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-red-300/90 text-sm">
                                        <li>Ensure vehicle is stopped safely (if not already)</li>
                                        <li>Switch off engine immediately and do NOT restart</li>
                                        <li>Do NOT attempt to move vehicle under any circumstances</li>
                                        <li>Arrange passenger transfer if vehicle was in service</li>
                                        <li>Contact engineering team for immediate assistance</li>
                                        <li>Await engineering attendance before any further action</li>
                                        <li>Log as CRITICAL priority in Go-Check system</li>
                                    </ol>
                                </div>
                                
                                {hasLeak && (
                                    <div className="bg-red-400/20 backdrop-blur-sm rounded p-4 mt-4">
                                        <p className="font-semibold text-red-200 mb-2">⚠️ Additional Oil Leak Hazards:</p>
                                        <ul className="list-disc ml-6 text-red-300/90 text-sm space-y-1">
                                            <li>Fire risk if oil contacts hot engine components</li>
                                            <li>Environmental hazard - may require spill containment kit</li>
                                            <li>Slip hazard for passengers and public</li>
                                            <li>Potential DVSA prohibition (PG9) notice</li>
                                            <li>Notify local authorities if spill affects roadway</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-amber-200 mb-2">MONITOR CLOSELY - ENGINEERING REQUIRED</h3>
                                <p className="text-amber-300/90 text-sm mb-6">
                                    Oil light only at idle - possible low oil level or pressure sensor issue
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-amber-200 mb-3">Required Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-amber-300/90 text-sm">
                                        <li>Stop at next safe opportunity for oil level check</li>
                                        <li>Check oil level when engine is cool (if trained to do so)</li>
                                        <li>Do NOT continue if light appears while moving</li>
                                        <li>Arrange engineering inspection at earliest opportunity</li>
                                        <li>Monitor closely for any changes in light behavior</li>
                                        <li>Stop immediately if any symptoms worsen</li>
                                        <li>Log as HIGH PRIORITY in Go-Check system</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Documentation requirements */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Go-Check Documentation Required</h4>
                                <ul className="list-disc ml-6 space-y-1 text-blue-300/80 text-sm">
                                    <li>Log in Go-Check immediately as {mustStop ? 'CRITICAL' : 'HIGH PRIORITY'}</li>
                                    <li>Include all symptoms and observations noted</li>
                                    <li>Record exact time oil light first appeared</li>
                                    <li>Document any unusual engine noises reported</li>
                                    <li>Note oil leak location/severity if present</li>
                                    <li>Include driver observations and vehicle behavior</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* SDC Policy reminder */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h4 className="font-semibold text-purple-200 mb-2">🔔 SDC Safety Policy Reminder</h4>
                        <p className="text-purple-300/80 text-sm">
                            Oil warning lights indicate potential catastrophic engine failure. When in doubt, stop the vehicle immediately. 
                            Engine replacement costs far exceed any service disruption. Safety and asset protection are paramount.
                        </p>
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
window.OilWarningLightWizard = OilWarningLightWizard;