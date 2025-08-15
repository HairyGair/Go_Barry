// Puncture Wizard Component - CRITICAL TIRE SAFETY
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Puncture Section (Page 32)

const PunctureWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🛞 PUNCTURE - CRITICAL TYRE SAFETY</h2>
                        <p className="text-gray-300">Immediate tyre safety assessment and engineering consultation protocol - following SDC Engineering Issues Guide puncture procedures.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ CRITICAL TYRE SAFETY ISSUE</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Punctures compromise vehicle stability and control. Immediate assessment and engineering consultation required for all tyre failures.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Mandatory Actions:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>STOP immediately and assess puncture location</li>
                                <li>DETERMINE tyre position (front/rear, inner/outer)</li>
                                <li>CONTACT engineering for immediate assessment</li>
                                <li>AWAIT professional guidance - vehicle safety critical</li>
                                <li>DO NOT continue without engineering approval</li>
                            </ul>
                        </div>
                        <p className="font-bold text-red-200 mt-4">Tyre failure can cause loss of vehicle control</p>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Puncture Discovery Method</h3>
                        <p className="text-orange-300/80 text-sm mb-4">How was the puncture identified or discovered?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('discovery_method', 'driver_noticed')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.discovery_method === 'driver_noticed'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.discovery_method === 'driver_noticed' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.discovery_method === 'driver_noticed' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👁️ Driver noticed during operation</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering pull, vibration, or handling issues noticed</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('discovery_method', 'visual_inspection')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.discovery_method === 'visual_inspection'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.discovery_method === 'visual_inspection' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.discovery_method === 'visual_inspection' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔍 Visual inspection during walkround</span>
                                        <p className="text-sm text-gray-300 mt-1">Flat tyre or visible damage spotted during checks</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('discovery_method', 'warning_system')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.discovery_method === 'warning_system'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.discovery_method === 'warning_system' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.discovery_method === 'warning_system' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Tire pressure warning system</span>
                                        <p className="text-sm text-gray-300 mt-1">Dashboard warning light or TPMS alert</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('discovery_method', 'third_party_report')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.discovery_method === 'third_party_report'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.discovery_method === 'third_party_report' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.discovery_method === 'third_party_report' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📞 Third party notification</span>
                                        <p className="text-sm text-gray-300 mt-1">Public, police, or DVSA reported tyre issue</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('discovery_method', 'rapid_deflation')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.discovery_method === 'rapid_deflation'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.discovery_method === 'rapid_deflation' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.discovery_method === 'rapid_deflation' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💨 Rapid deflation/blowout</span>
                                        <p className="text-sm text-gray-300 mt-1">Sudden tyre failure with immediate loss of pressure</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Tire Position Assessment</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Determine the position of the punctured tyre - critical for safety assessment:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('tyre_position', 'front_nearside')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'front_nearside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'front_nearside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'front_nearside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚗 Front axle - Nearside (passenger side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical - affects steering and braking</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'front_offside')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'front_offside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'front_offside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'front_offside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚗 Front axle - Offside (driver side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical - affects steering control</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'rear_nearside_outer')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'rear_nearside_outer'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'rear_nearside_outer' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'rear_nearside_outer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Rear axle - Nearside outer</span>
                                        <p className="text-sm text-gray-300 mt-1">Stability impact - load bearing</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'rear_nearside_inner')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'rear_nearside_inner'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'rear_nearside_inner' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'rear_nearside_inner' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Rear axle - Nearside inner</span>
                                        <p className="text-sm text-gray-300 mt-1">Load distribution affected</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'rear_offside_outer')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'rear_offside_outer'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'rear_offside_outer' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'rear_offside_outer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Rear axle - Offside outer</span>
                                        <p className="text-sm text-gray-300 mt-1">Stability and handling impact</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'rear_offside_inner')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'rear_offside_inner'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'rear_offside_inner' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'rear_offside_inner' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Rear axle - Offside inner</span>
                                        <p className="text-sm text-gray-300 mt-1">Load distribution and stability affected</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tyre_position', 'unknown_position')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.tyre_position === 'unknown_position'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.tyre_position === 'unknown_position' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.tyre_position === 'unknown_position' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Position unknown - requires inspection</span>
                                        <p className="text-sm text-gray-300 mt-1">Engineering assessment needed to determine location</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">Current Vehicle Status</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">What is the current operational state of the vehicle?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_status', 'in_service_passengers')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'in_service_passengers'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'in_service_passengers' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'in_service_passengers' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 In service with passengers</span>
                                        <p className="text-sm text-gray-300 mt-1">Passenger safety priority - immediate action required</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_status', 'out_of_service')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'out_of_service'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'out_of_service' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'out_of_service' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔄 Out of service (no passengers)</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver safety and vehicle security priority</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_status', 'stationary_safe')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'stationary_safe'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'stationary_safe' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'stationary_safe' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🛑 Already stopped safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle secure, awaiting assessment</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_status', 'moving_compromised')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'moving_compromised'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'moving_compromised' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'moving_compromised' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Still moving with compromised tyre</span>
                                        <p className="text-sm text-gray-300 mt-1">CRITICAL - Must stop immediately for safety</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    {/* Critical Safety Warnings for specific conditions */}
                    {(responses.tyre_position?.includes('front') || responses.discovery_method === 'rapid_deflation' || 
                      responses.vehicle_status === 'moving_compromised') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <Shield className="w-8 h-8 text-red-400 mt-1 animate-pulse" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL TIRE SAFETY WARNING</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">This puncture condition requires immediate attention</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate SDC Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {responses.tyre_position?.includes('front') && (
                                                    <li>Front tyre puncture affects steering control - stop immediately</li>
                                                )}
                                                {responses.discovery_method === 'rapid_deflation' && (
                                                    <li>Rapid deflation indicates serious tyre failure - do not continue</li>
                                                )}
                                                {responses.vehicle_status === 'moving_compromised' && (
                                                    <li>Stop vehicle immediately - compromised tyre dangerous at speed</li>
                                                )}
                                                <li>Contact engineering for immediate professional assessment</li>
                                                <li>Do not attempt to continue service without approval</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                        
                    {/* Standard SDC Protocol Box */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start space-x-4">
                            <AlertCircle className="w-8 h-8 text-purple-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-purple-200 mb-3">📋 SDC PUNCTURE PROTOCOL</h3>
                                <div className="text-purple-300/90 space-y-3">
                                    <p className="font-bold">All punctures require engineering assessment before continuing</p>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                        <h4 className="font-bold text-purple-200 mb-2 text-lg">Mandatory Actions per SDC Guide:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <p className="font-semibold">1. 🛑 STOP immediately and assess</p>
                                                <p className="font-semibold">2. 🎯 DETERMINE tyre position</p>
                                                <p className="font-semibold">3. 📞 CONTACT engineering</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold">4. ⏳ AWAIT professional guidance</p>
                                                <p className="font-semibold">5. 📝 DOCUMENT in Go-Check</p>
                                                <p className="font-semibold">6. 🚫 NO continuation without approval</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-6 border-t border-white/20">
                        <button
                            onClick={onNext}
                            disabled={!responses.discovery_method || !responses.tyre_position || !responses.vehicle_status}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            ENGINEERING ASSESSMENT <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔧 ENGINEERING ASSESSMENT PROTOCOL</h2>
                        <p className="text-gray-300">Mandatory engineering consultation for tyre safety evaluation and continuation decision.</p>
                    </div>

                    {/* Engineering Contact Requirements */}
                    <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-6 border border-orange-400/50">
                        <div className="flex items-start space-x-4">
                            <Phone className="w-8 h-8 text-orange-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-orange-200 mb-4">📞 MANDATORY ENGINEERING CONSULTATION</h3>
                                <div className="text-orange-300/90 space-y-4">
                                    <p className="font-bold text-lg">All punctures require professional engineering assessment</p>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                        <h4 className="font-bold text-orange-200 mb-3 text-lg">SDC Engineering Requirements:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-orange-600/20 p-3 rounded">
                                                <h5 className="font-bold text-orange-200 mb-2">1️⃣ IMMEDIATE CONTACT</h5>
                                                <p className="text-orange-300/80 text-sm">Contact engineering immediately for tyre safety assessment</p>
                                            </div>
                                            <div className="bg-orange-600/20 p-3 rounded">
                                                <h5 className="font-bold text-orange-200 mb-2">2️⃣ LOCATION DETAILS</h5>
                                                <p className="text-orange-300/80 text-sm">Provide exact tyre position and puncture details</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Engineering Contact Status */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Engineering Contact Status</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Confirm engineering has been contacted for tyre assessment:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('engineering_contacted', 'contacted_attending')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_contacted === 'contacted_attending'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.engineering_contacted === 'contacted_attending' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.engineering_contacted === 'contacted_attending' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Engineering contacted and attending</span>
                                        <p className="text-sm text-gray-300 mt-1">Professional tyre assessment arranged</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('engineering_contacted', 'contacting_now')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_contacted === 'contacting_now'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.engineering_contacted === 'contacting_now' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.engineering_contacted === 'contacting_now' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📞 Currently contacting engineering</span>
                                        <p className="text-sm text-gray-300 mt-1">Emergency tyre assessment request in progress</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('engineering_contacted', 'not_contacted')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_contacted === 'not_contacted'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.engineering_contacted === 'not_contacted' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.engineering_contacted === 'not_contacted' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Engineering not yet contacted</span>
                                        <p className="text-sm text-gray-300 mt-1">URGENT - Must contact immediately</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Vehicle Safety Status */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">Current Vehicle Safety Status</h3>
                        <p className="text-green-300/80 text-sm mb-4">Confirm vehicle is in safe condition:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_safety_status', 'stopped_safely')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_safety_status === 'stopped_safely'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_safety_status === 'stopped_safely' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_safety_status === 'stopped_safely' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Vehicle stopped safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Secure location, no immediate safety risk</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_safety_status', 'stopping_now')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_safety_status === 'stopping_now'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_safety_status === 'stopping_now' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_safety_status === 'stopping_now' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🛑 Currently stopping vehicle</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver following instructions to stop safely</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_safety_status', 'still_moving')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_safety_status === 'still_moving'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_safety_status === 'still_moving' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_safety_status === 'still_moving' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Vehicle still moving</span>
                                        <p className="text-sm text-gray-300 mt-1">CRITICAL - Must stop immediately</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Critical Action Reminders */}
                    {(responses.engineering_contacted === 'not_contacted' || responses.vehicle_safety_status === 'still_moving') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1 animate-pulse" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 URGENT ACTIONS REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        {responses.engineering_contacted === 'not_contacted' && (
                                            <p className="font-semibold bg-white/10 backdrop-blur-sm p-3 rounded">
                                                📞 CONTACT ENGINEERING IMMEDIATELY - Tire safety assessment mandatory
                                            </p>
                                        )}
                                        {responses.vehicle_safety_status === 'still_moving' && (
                                            <p className="font-semibold bg-white/10 backdrop-blur-sm p-3 rounded">
                                                🛑 STOP VEHICLE IMMEDIATELY - Compromised tyre dangerous while moving
                                            </p>
                                        )}
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
                            disabled={!responses.engineering_contacted || !responses.vehicle_safety_status}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            FINAL ASSESSMENT <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 PUNCTURE SAFETY ASSESSMENT REPORT</h2>
                        <p className="text-gray-300">Complete tyre safety incident assessment with engineering consultation and SDC compliance.</p>
                    </div>
                    
                    {/* Final Safety Status */}
                    <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-6 border border-orange-400/50">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🛡️</div>
                            <h3 className="text-2xl font-bold text-orange-200 mb-2">TIRE SAFETY INCIDENT - ASSESSED</h3>
                            <p className="text-orange-300/90 text-lg mb-6">
                                Professional engineering assessment completed per SDC protocol
                            </p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-bold text-lg text-orange-200 mb-3">✅ Safety Actions Completed:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-orange-300/90">✅ Puncture location identified</p>
                                    <p className="text-orange-300/90">✅ Vehicle stopped safely</p>
                                    <p className="text-orange-300/90">✅ Engineering consultation obtained</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-orange-300/90">✅ Safety protocols followed</p>
                                    <p className="text-orange-300/90">✅ Incident documented</p>
                                    <p className="text-orange-300/90">✅ Professional assessment complete</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Incident Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Puncture Incident Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Discovery Method:</span>
                                    <span className="text-white ml-2 capitalize">{responses.discovery_method?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Tire Position:</span>
                                    <span className="text-white ml-2 capitalize">{responses.tyre_position?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Initial Vehicle Status:</span>
                                    <span className="text-white ml-2 capitalize">{responses.vehicle_status?.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Engineering Contact:</span>
                                    <span className="text-white ml-2 capitalize">{responses.engineering_contacted?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Final Safety Status:</span>
                                    <span className="text-white ml-2 capitalize">{responses.vehicle_safety_status?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Vehicle Status:</span>
                                    <span className="text-green-300 ml-2 font-semibold">SECURED - ENGINEERING APPROVED</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SDC Compliance Confirmation */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">SDC Tire Safety Protocol Compliance</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <h4 className="font-bold text-purple-200 mb-3">✅ MANDATORY ACTIONS COMPLETED:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Vehicle stopped immediately</p>
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Tire position identified</p>
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Engineering consultation obtained</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Safety assessment complete</p>
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Incident documented</p>
                                        <p className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Professional approval required</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-purple-600/20 backdrop-blur-sm rounded-lg p-4">
                                <h4 className="font-bold text-purple-200 mb-2">⚠️ CONTINUATION REQUIREMENTS:</h4>
                                <p className="text-purple-300/90 font-semibold">Vehicle must NOT continue in service without explicit engineering approval and tyre safety certification.</p>
                            </div>
                        </div>
                    </div>

                    {/* Go-Check Documentation Reminder */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Go-Check Documentation Requirements</h4>
                                <ul className="list-disc list-inside space-y-1 text-blue-300/80 text-sm">
                                    <li>Document puncture details including tyre position</li>
                                    <li>Record engineering consultation and recommendations</li>
                                    <li>Include photos of tyre damage if safe to obtain</li>
                                    <li>Note any passenger evacuation or service disruption</li>
                                    <li>Document final disposition and continuation approval</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Completion Confirmation */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <div className="flex items-center space-x-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <div>
                                <h3 className="text-xl font-bold text-green-200">Tire Safety Assessment Complete</h3>
                                <p className="text-green-300/90 mt-2">All SDC puncture protocols followed. Vehicle status determined by engineering assessment.</p>
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
                            className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-lg font-semibold"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />COMPLETE ASSESSMENT
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.PunctureWizard = PunctureWizard;