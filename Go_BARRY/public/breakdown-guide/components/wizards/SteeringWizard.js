// Steering Wizard Component - Safety-Critical Steering System Assessment
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Steering Section (Page 8)

const SteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Steering System Safety Assessment</h2>
                        <p className="text-gray-300">Critical safety evaluation following SDC Engineering Issues Guide - ensuring steering system control and directional stability.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ SAFETY-CRITICAL CONTROL SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Steering system defects pose immediate danger to vehicle control and directional stability. ANY compromise requires immediate action.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Critical Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>DVSA expects no more than 75mm play for power steering vehicles</li>
                                <li>ANY steering defect = immediate vehicle shutdown</li>
                                <li>Await engineering attendance - no exceptions</li>
                                <li>Document everything for safety compliance</li>
                            </ul>
                        </div>
                    </div>

                    {/* Location Input */}
                    <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30 mb-6">
                        <h4 className="text-sm font-semibold text-blue-200 mb-3">📍 Current Location</h4>
                        <input
                            type="text"
                            value={responses.location || ''}
                            onChange={(e) => updateResponse('location', e.target.value)}
                            placeholder="e.g., Newcastle Central Station, A1 Northbound, Team Valley"
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 text-sm"
                        />
                        <p className="text-xs text-blue-300/80 mt-1">Please specify where the vehicle is currently located</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Initial Steering System Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What steering system condition requires assessment? (ANY of these = critical stop)</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('initial_concern', 'excessive_play')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'excessive_play'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'excessive_play' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'excessive_play' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🎯 Excessive steering wheel play</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering wheel movement before wheels respond (>75mm limit)</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'difficulty_steering')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'difficulty_steering'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'difficulty_steering' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'difficulty_steering' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💪 Difficulty steering or maintaining control</span>
                                        <p className="text-sm text-gray-300 mt-1">Heavy steering, hard to turn, or control issues</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'stiff_unresponsive')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'stiff_unresponsive'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'stiff_unresponsive' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'stiff_unresponsive' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔒 Steering stiff or unresponsive</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering wheel difficult to turn or not responding properly</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'unusual_noises')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'unusual_noises'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'unusual_noises' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'unusual_noises' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔊 Unusual steering noises</span>
                                        <p className="text-sm text-gray-300 mt-1">Knocking, grinding, or squealing when steering</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'vehicle_pulling')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'vehicle_pulling'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'vehicle_pulling' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'vehicle_pulling' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">↗️ Vehicle pulling to one side</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle drifts left or right during operation</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'visible_damage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'visible_damage'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'visible_damage' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'visible_damage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔧 Visible damage to steering system</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering column, linkage, or component damage</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'power_steering_issues')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'power_steering_issues'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'power_steering_issues' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'power_steering_issues' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚡ Power steering system problems</span>
                                        <p className="text-sm text-gray-300 mt-1">Power assistance failure or fluid leaks</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'warning_light')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'warning_light'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'warning_light' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'warning_light' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Steering warning light illuminated</span>
                                        <p className="text-sm text-gray-300 mt-1">Dashboard warning related to steering system</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('initial_concern', 'no_issues')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'no_issues'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'no_issues' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'no_issues' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Routine check - no issues detected</span>
                                        <p className="text-sm text-gray-300 mt-1">Performing preventive assessment</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Show immediate warning for any critical condition */}
                    {responses.initial_concern && responses.initial_concern !== 'no_issues' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL STEERING DEFECT IDENTIFIED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Per SDC Guide: This condition requires immediate vehicle shutdown</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Advise driver to switch off vehicle immediately</li>
                                                <li>Vehicle must await engineering attendance</li>
                                                <li>No exceptions - safety is non-negotiable</li>
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
                            disabled={!responses.initial_concern || !responses.location}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            // Only show detailed assessment if no critical issues found
            if (responses.initial_concern === 'no_issues') {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">🔍 Detailed Steering Play Assessment</h2>
                            <p className="text-gray-300">Verify steering system is within DVSA safety limits (75mm maximum play).</p>
                        </div>

                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <h3 className="font-semibold text-blue-200 mb-3">Steering Wheel Play Measurement</h3>
                            <p className="text-blue-300/80 text-sm mb-4">Check steering wheel movement before wheels respond (DVSA limit: 75mm for power steering).</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateResponse('steering_play', 'minimal_play')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.steering_play === 'minimal_play'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.steering_play === 'minimal_play' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.steering_play === 'minimal_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">✅ Minimal play (well under 75mm)</span>
                                            <p className="text-sm text-gray-300 mt-1">Steering wheel play well within DVSA acceptable limits</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateResponse('steering_play', 'moderate_play')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.steering_play === 'moderate_play'
                                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.steering_play === 'moderate_play' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                        }`}>
                                            {responses.steering_play === 'moderate_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">⚠️ Moderate play (approaching 75mm)</span>
                                            <p className="text-sm text-gray-300 mt-1">Play noticeable but still within limits - monitor closely</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateResponse('steering_play', 'excessive_play')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.steering_play === 'excessive_play'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.steering_play === 'excessive_play' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                        }`}>
                                            {responses.steering_play === 'excessive_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🚨 CRITICAL: Excessive play (≥75mm)</span>
                                            <p className="text-sm text-gray-300 mt-1">Steering play exceeds DVSA safety limits - STOP immediately</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Warning if excessive play detected */}
                        {responses.steering_play === 'excessive_play' && (
                            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                <div className="flex items-start space-x-4">
                                    <XCircle className="w-8 h-8 text-red-400 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-200 mb-3">🛑 EXCESSIVE PLAY DETECTED</h3>
                                        <div className="text-red-300/90 space-y-2">
                                            <p className="font-semibold">Steering play exceeds DVSA 75mm limit</p>
                                            <p className="text-sm">Vehicle must be switched off immediately and await engineering attendance.</p>
                                        </div>
                                    </div>
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
                                disabled={!responses.steering_play}
                                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Safety Decision <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>
                );
            } else {
                // Skip to safety decision if critical issue already identified
                onNext();
                return null;
            }

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">⚖️ Safety Decision & Action Plan</h2>
                        <p className="text-gray-300">SDC-compliant safety decision based on steering system assessment.</p>
                    </div>
                    
                    {/* Decision Logic */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">SDC Safety Protocol Decision</h3>
                        
                        {/* Critical Condition - Must Stop (any SDC condition) */}
                        {(responses.initial_concern !== 'no_issues' || responses.steering_play === 'excessive_play') && (
                            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                <div className="flex items-start space-x-4">
                                    <XCircle className="w-8 h-8 text-red-400 mt-1" />
                                    <div>
                                        <h4 className="text-xl font-bold text-red-200 mb-3">🛑 IMMEDIATE VEHICLE SHUTDOWN REQUIRED</h4>
                                        <div className="text-red-300/90 space-y-3">
                                            <p className="font-semibold">Critical steering defect detected - SDC safety protocol activated</p>
                                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                                <h5 className="font-semibold text-red-200 mb-2">SDC Mandatory Actions:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Switch off vehicle immediately</li>
                                                    <li>Secure vehicle in safe location</li>
                                                    <li>Contact engineering for attendance</li>
                                                    <li>Do not attempt to move vehicle</li>
                                                    <li>Record defect in Tranzaura system immediately</li>
                                                    <li>Arrange passenger transfer if in service</li>
                                                </ul>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                                <h5 className="font-semibold text-red-200 mb-2">Detected Condition:</h5>
                                                <p className="text-sm">
                                                    {responses.initial_concern === 'excessive_play' && "Excessive steering wheel play (>75mm limit)"}
                                                    {responses.initial_concern === 'difficulty_steering' && "Difficulty steering or maintaining control"}
                                                    {responses.initial_concern === 'stiff_unresponsive' && "Steering stiff or unresponsive"}
                                                    {responses.initial_concern === 'unusual_noises' && "Unusual noises when steering"}
                                                    {responses.initial_concern === 'vehicle_pulling' && "Vehicle pulling to one side"}
                                                    {responses.initial_concern === 'visible_damage' && "Visible damage to steering system"}
                                                    {responses.initial_concern === 'power_steering_issues' && "Power steering system problems/leaks"}
                                                    {responses.initial_concern === 'warning_light' && "Steering warning light illuminated"}
                                                    {responses.steering_play === 'excessive_play' && "Steering play exceeds DVSA 75mm safety limit"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Warning Condition - Monitor closely */}
                        {(responses.initial_concern === 'no_issues' && responses.steering_play === 'moderate_play') && (
                            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                                <div className="flex items-start space-x-4">
                                    <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1" />
                                    <div>
                                        <h4 className="text-xl font-bold text-yellow-200 mb-3">⚠️ MONITOR AND ARRANGE CHANGEOVER</h4>
                                        <div className="text-yellow-300/90 space-y-3">
                                            <p className="font-semibold">Steering approaching limits - requires attention</p>
                                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                                <h5 className="font-semibold text-yellow-200 mb-2">Required Actions:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Continue to next convenient changeover point</li>
                                                    <li>Arrange replacement vehicle at earliest opportunity</li>
                                                    <li>Monitor steering continuously</li>
                                                    <li>Record defect in Tranzaura system</li>
                                                    <li>If ANY deterioration occurs, stop immediately</li>
                                                    <li>Inform engineering of developing issue</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Safe Condition */}
                        {(responses.initial_concern === 'no_issues' && responses.steering_play === 'minimal_play') && (
                            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-8 h-8 text-green-400 mt-1" />
                                    <div>
                                        <h4 className="text-xl font-bold text-green-200 mb-3">✅ SAFE TO CONTINUE</h4>
                                        <div className="text-green-300/90 space-y-3">
                                            <p className="font-semibold">Steering system within acceptable parameters</p>
                                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                                <h5 className="font-semibold text-green-200 mb-2">Recommended Actions:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Vehicle may continue in service</li>
                                                    <li>Continue monitoring steering response</li>
                                                    <li>Log assessment in Tranzaura system</li>
                                                    <li>Report immediately if condition changes</li>
                                                    <li>Follow standard maintenance schedule</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional SDC Guidance */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">📋 SDC Additional Guidance</h3>
                        <ul className="list-disc list-inside space-y-2 text-blue-300/80 text-sm">
                            <li>Report persistent unwarranted steering reports to depot management</li>
                            <li>All defects must be recorded in Go-Check when stationary and safe</li>
                            <li>Vehicles continuing must have planned changeover at earliest opportunity</li>
                            <li>Safety is non-negotiable - when in doubt, stop the vehicle</li>
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
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Final Report <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            const isCritical = responses.initial_concern !== 'no_issues' || responses.steering_play === 'excessive_play';
            const isWarning = responses.initial_concern === 'no_issues' && responses.steering_play === 'moderate_play';
            const isSafe = responses.initial_concern === 'no_issues' && responses.steering_play === 'minimal_play';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Steering System Safety Assessment Report</h2>
                        <p className="text-gray-300">Complete SDC-compliant steering system assessment summary.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Initial Assessment:</span>
                                <span className="text-white ml-2">
                                    {responses.initial_concern === 'excessive_play' && "Excessive steering wheel play"}
                                    {responses.initial_concern === 'difficulty_steering' && "Difficulty steering/control"}
                                    {responses.initial_concern === 'stiff_unresponsive' && "Steering stiff/unresponsive"}
                                    {responses.initial_concern === 'unusual_noises' && "Unusual steering noises"}
                                    {responses.initial_concern === 'vehicle_pulling' && "Vehicle pulling to one side"}
                                    {responses.initial_concern === 'visible_damage' && "Visible steering damage"}
                                    {responses.initial_concern === 'power_steering_issues' && "Power steering problems"}
                                    {responses.initial_concern === 'warning_light' && "Steering warning light on"}
                                    {responses.initial_concern === 'no_issues' && "Routine check - no initial issues"}
                                </span>
                            </div>
                            {responses.steering_play && (
                                <div>
                                    <span className="text-gray-400">Steering Play Check:</span>
                                    <span className="text-white ml-2">
                                        {responses.steering_play === 'minimal_play' && "Minimal play (<75mm)"}
                                        {responses.steering_play === 'moderate_play' && "Moderate play (approaching 75mm)"}
                                        {responses.steering_play === 'excessive_play' && "Excessive play (≥75mm) - CRITICAL"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Final Decision */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border ${
                        isCritical 
                            ? 'bg-red-500/30 border-red-400/50' 
                            : isWarning 
                                ? 'bg-yellow-500/20 border-yellow-400/30'
                                : 'bg-green-500/20 border-green-400/30'
                    }`}>
                        <div className="text-center">
                            <div className={`text-6xl mb-4 ${
                                isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                                {isCritical ? '🛑' : isWarning ? '⚠️' : '✅'}
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${
                                isCritical ? 'text-red-200' : isWarning ? 'text-yellow-200' : 'text-green-200'
                            }`}>
                                {isCritical ? 'CRITICAL - STOP VEHICLE' : isWarning ? 'WARNING - CHANGEOVER REQUIRED' : 'SAFE TO CONTINUE'}
                            </h3>
                            <p className={`text-sm ${
                                isCritical ? 'text-red-300/90' : isWarning ? 'text-yellow-300/90' : 'text-green-300/90'
                            }`}>
                                {isCritical 
                                    ? 'Vehicle must be shut down immediately - steering defect poses immediate safety risk'
                                    : isWarning 
                                        ? 'Steering system requires monitoring - arrange vehicle changeover at earliest opportunity'
                                        : 'Steering system assessed as safe for continued operation'
                                }
                            </p>
                        </div>
                    </div>

                    {/* SDC Compliance Statement */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="font-semibold text-white mb-2">🛡️ SDC Compliance Statement</h3>
                        <p className="text-gray-300 text-sm">
                            This assessment has been conducted in accordance with SDC Engineering Issues Guide Section 26 (Steering). 
                            All critical conditions have been evaluated against DVSA standards including the 75mm steering play limit for power steering vehicles.
                        </p>
                    </div>
                    
                    {/* Go-Check Reminder */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Tranzaura Documentation Required</h4>
                                <p className="text-blue-300/80 text-sm">
                                    Record this steering assessment in the Tranzaura system immediately when vehicle is stationary and in a safe location. 
                                    Include all findings, conditions detected, and actions taken. This is mandatory for all assessments.
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
                            onClick={async () => {
                                // Log breakdown if critical condition
                                if (isCritical) {
                                    try {
                                        await window.logBreakdown({
                                            supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                                            vehicleReg: window.selectedReg || 'Unknown',
                                            fleetNo: window.selectedFleetNo || 'Unknown',
                                            breakdownType: 'Steering',
                                            timestamp: new Date().toISOString()
                                        });
                                        console.log('✅ Steering breakdown logged successfully');
                                    } catch (error) {
                                        console.error('Failed to log steering breakdown:', error);
                                        // Don't block completion if logging fails
                                    }
                                }
                                onComplete();
                            }}
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
window.SteeringWizard = SteeringWizard;