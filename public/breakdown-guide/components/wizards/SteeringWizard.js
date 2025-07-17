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
                            Steering system defects pose immediate danger to vehicle control and directional stability. Any compromise requires immediate action.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Critical Limit: Maximum 75mm play at steering wheel rim</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>DVSA expects no more than 75mm play for power steering vehicles</li>
                                <li>Any steering system failure requires immediate vehicle shutdown</li>
                                <li>Await engineering attendance - no exceptions</li>
                                <li>Document everything for safety compliance</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Initial Steering System Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the current steering system condition that requires assessment?</p>
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
                                        <p className="text-sm text-gray-300 mt-1">Steering wheel movement before wheels respond</p>
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
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Current Operating Status</h3>
                        <p className="text-blue-300/80 text-sm mb-4">What is the current state of vehicle operation?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('operating_status', 'in_service')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_status === 'in_service'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_status === 'in_service' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_status === 'in_service' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Currently in passenger service</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle operating with passengers on board</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operating_status', 'out_of_service')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_status === 'out_of_service'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_status === 'out_of_service' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_status === 'out_of_service' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔄 Running out of service</span>
                                        <p className="text-sm text-gray-300 mt-1">No passengers, returning to depot or changeover</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operating_status', 'stationary')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_status === 'stationary'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_status === 'stationary' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_status === 'stationary' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🛑 Vehicle stationary</span>
                                        <p className="text-sm text-gray-300 mt-1">Currently stopped for safety assessment</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="font-semibold text-yellow-200 mb-3">Immediate Control Assessment</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">How is the current vehicle control and steering response?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('control_status', 'full_control')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.control_status === 'full_control'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.control_status === 'full_control' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.control_status === 'full_control' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Full steering control maintained</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle responds normally to steering inputs</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('control_status', 'reduced_control')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.control_status === 'reduced_control'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.control_status === 'reduced_control' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.control_status === 'reduced_control' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Reduced steering control</span>
                                        <p className="text-sm text-gray-300 mt-1">Some difficulty maintaining desired direction</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('control_status', 'loss_of_control')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.control_status === 'loss_of_control'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.control_status === 'loss_of_control' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.control_status === 'loss_of_control' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Significant loss of control</span>
                                        <p className="text-sm text-gray-300 mt-1">Major difficulty controlling vehicle direction</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Safety Warnings */}
                    {(responses.initial_concern === 'excessive_play' || responses.initial_concern === 'difficulty_steering' || 
                      responses.initial_concern === 'visible_damage' || responses.control_status === 'loss_of_control') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL STEERING SAFETY WARNING</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">This condition triggers immediate SDC safety protocol</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Mandatory Actions per SDC:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Switch off vehicle immediately</li>
                                                <li>Await engineering attendance</li>
                                                <li>Do not attempt to continue service</li>
                                                <li>Steering failure poses immediate danger to public safety</li>
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
                            disabled={!responses.initial_concern || !responses.operating_status || !responses.control_status}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Detailed Steering System Evaluation</h2>
                        <p className="text-gray-300">Comprehensive assessment following SDC critical safety criteria - including DVSA 75mm play limit.</p>
                    </div>

                    {/* SDC Critical Conditions Check */}
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <div className="flex items-start space-x-4">
                            <AlertCircle className="w-8 h-8 text-red-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-3">🛑 SDC CRITICAL CONDITIONS CHECK</h3>
                                <div className="text-red-300/90 space-y-2">
                                    <p className="font-semibold">If ANY of these conditions are present, vehicle must be switched off immediately</p>
                                    <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                        <h4 className="font-semibold text-red-200 mb-2">SDC Steering Failure Criteria:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                            <li>Excessive play in steering wheel (&gt; 75mm at rim for power steering)</li>
                                            <li>Difficulty steering or maintaining control of vehicle</li>
                                            <li>Unusual noises when steering (knocking, grinding, squealing)</li>
                                            <li>Vehicle pulling to one side during operation</li>
                                            <li>Visible damage to steering system (column, linkage)</li>
                                            <li>Power steering system leaks or failures</li>
                                            <li>Any steering-related warning light illuminated</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Steering Play Assessment */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Step 1: Steering Wheel Play Assessment</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Evaluate steering wheel movement before wheels respond (DVSA limit: 75mm for power steering).</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('steering_play', 'minimal_play')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.steering_play === 'minimal_play'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.steering_play === 'minimal_play' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.steering_play === 'minimal_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Minimal play (&lt; 75mm)</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering wheel play within DVSA acceptable limits</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('steering_play', 'moderate_play')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.steering_play === 'moderate_play'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.steering_play === 'moderate_play' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.steering_play === 'moderate_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Moderate play (approaching 75mm)</span>
                                        <p className="text-sm text-gray-300 mt-1">Play noticeable but still within limits</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('steering_play', 'excessive_play')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.steering_play === 'excessive_play'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.steering_play === 'excessive_play' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.steering_play === 'excessive_play' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 CRITICAL: Excessive play (&gt; 75mm)</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering play exceeds DVSA safety limits</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('steering_play', 'unable_to_assess')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.steering_play === 'unable_to_assess'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.steering_play === 'unable_to_assess' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.steering_play === 'unable_to_assess' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Unable to assess safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Conditions prevent safe play measurement</p>
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
                            disabled={!responses.steering_play}
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Safety Decision <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">⚖️ Safety Decision & Action Plan</h2>
                        <p className="text-gray-300">Determine safety-critical actions based on steering system assessment findings.</p>
                    </div>
                    
                    {/* Decision Logic */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">SDC Safety Protocol Decision</h3>
                        
                        {/* Critical Condition - Must Stop */}
                        {(responses.steering_play === 'excessive_play' || 
                          responses.initial_concern === 'difficulty_steering' ||
                          responses.initial_concern === 'visible_damage' ||
                          responses.control_status === 'loss_of_control') && (
                            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                <div className="flex items-start space-x-4">
                                    <XCircle className="w-8 h-8 text-red-400 mt-1" />
                                    <div>
                                        <h4 className="text-xl font-bold text-red-200 mb-3">🛑 IMMEDIATE VEHICLE SHUTDOWN REQUIRED</h4>
                                        <div className="text-red-300/90 space-y-3">
                                            <p className="font-semibold">Critical steering defect detected - SDC safety protocol activated</p>
                                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                                <h5 className="font-semibold text-red-200 mb-2">Mandatory Immediate Actions:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Switch off vehicle immediately</li>
                                                    <li>Secure vehicle in safe location</li>
                                                    <li>Contact engineering for attendance</li>
                                                    <li>Do not attempt to move vehicle</li>
                                                    <li>Record defect in Go-Check system</li>
                                                    <li>Arrange passenger transfer if in service</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Warning Condition - Monitor and Change Over */}
                        {(responses.steering_play === 'moderate_play' && 
                          responses.control_status === 'full_control' &&
                          !['difficulty_steering', 'visible_damage'].includes(responses.initial_concern)) && (
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
                                                    <li>Record defect in Go-Check system</li>
                                                    <li>If condition worsens, stop immediately</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Safe Condition */}
                        {(responses.steering_play === 'minimal_play' && 
                          responses.control_status === 'full_control' &&
                          !['difficulty_steering', 'visible_damage', 'excessive_play'].includes(responses.initial_concern)) && (
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
                                                    <li>Log assessment in Go-Check system</li>
                                                    <li>Report if condition changes</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
            const isCritical = responses.steering_play === 'excessive_play' || 
                              responses.initial_concern === 'difficulty_steering' ||
                              responses.initial_concern === 'visible_damage' ||
                              responses.control_status === 'loss_of_control';
            
            const isWarning = responses.steering_play === 'moderate_play' && 
                             responses.control_status === 'full_control' &&
                             !['difficulty_steering', 'visible_damage'].includes(responses.initial_concern);
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Steering System Safety Assessment Report</h2>
                        <p className="text-gray-300">Complete safety-critical steering system assessment with SDC-compliant actions.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Initial Concern:</span>
                                <span className="text-white ml-2">{responses.initial_concern?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Operating Status:</span>
                                <span className="text-white ml-2">{responses.operating_status?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Control Status:</span>
                                <span className="text-white ml-2">{responses.control_status?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Steering Play:</span>
                                <span className="text-white ml-2">{responses.steering_play?.replace('_', ' ')}</span>
                            </div>
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
                                    ? 'Vehicle must be shut down immediately due to safety-critical steering defect'
                                    : isWarning 
                                        ? 'Steering system requires monitoring and vehicle changeover at earliest opportunity'
                                        : 'Steering system assessed as safe for continued operation'
                                }
                            </p>
                        </div>
                    </div>
                    
                    {/* Go-Check Reminder */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Go-Check Documentation Required</h4>
                                <p className="text-blue-300/80 text-sm">
                                    Record this steering assessment in the Go-Check system immediately when vehicle is stationary and in a safe location. 
                                    Include all assessment details and actions taken.
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
window.SteeringWizard = SteeringWizard;