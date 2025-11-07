import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Wing Mirrors Wizard Component - SAFETY CRITICAL VISION
// Uses icons and constants from common components
// Follows operational safety procedures - Wing Mirrors Section (Page 27)

const WingMirrorsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from imported Icons
    const { 
        AlertTriangle, 
        ArrowLeft, 
        ArrowRight, 
        Home, 
        CheckCircle, 
        XCircle, 
        FileText, 
        Shield, 
        AlertCircle, 
        Eye, 
        Search,
        Tool
    } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🪞 WING MIRRORS - SAFETY ASSESSMENT</h2>
                        <p className="text-gray-300">Following standard operational safety checks procedure for wing mirror damage evaluation.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Operational WING MIRROR PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Wing mirrors are critical for safe vehicle operation. Assessment must evaluate damage extent and driver capability to operate safely.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Operational Assessment Priority:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Step 1: Assess extent of damage (glass vs glass and arm)</li>
                                <li>Step 2: Determine which side of vehicle affected</li>
                                <li>Step 3: Check for additional vehicle damage</li>
                                <li>Step 4: Driver capability assessment and safety decision</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Step 1: Damage Assessment</h3>
                        <p className="text-orange-300/80 text-sm mb-4 font-bold">Is it only the glass, or both the glass and arm damaged?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('damage_type', 'glass_only'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'glass_only'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'glass_only' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'glass_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🪞 Glass only damaged</span>
                                        <p className="text-sm text-gray-300 mt-1">Mirror glass cracked/broken but arm/housing intact</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('damage_type', 'glass_and_arm'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'glass_and_arm'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'glass_and_arm' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'glass_and_arm' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔧 Both glass and arm damaged</span>
                                        <p className="text-sm text-gray-300 mt-1">Mirror glass and arm/housing both damaged</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('damage_type', 'completely_missing'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'completely_missing'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'completely_missing' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'completely_missing' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Mirror completely missing</span>
                                        <p className="text-sm text-gray-300 mt-1">Entire mirror assembly detached or missing</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Step 2: Vehicle Side Assessment</h3>
                        <p className="text-blue-300/80 text-sm mb-4 font-bold">Which side of the vehicle is affected?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('vehicle_side', 'nearside'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_side === 'nearside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_side === 'nearside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_side === 'nearside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👥 Nearside (passenger side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Left side mirror (UK) - may be less critical</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('vehicle_side', 'offside'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_side === 'offside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_side === 'offside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_side === 'offside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚗 Offside (driver side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Right side mirror (UK) - higher safety risk</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('vehicle_side', 'both_sides'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_side === 'both_sides'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_side === 'both_sides' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_side === 'both_sides' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Both sides affected</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical - multiple mirror damage</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">Step 3: Additional Vehicle Damage</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">Is there any other damage to the bus?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('additional_damage', 'none'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.additional_damage === 'none'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.additional_damage === 'none' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.additional_damage === 'none' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No other damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage isolated to mirror only</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('additional_damage', 'minor_cosmetic'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.additional_damage === 'minor_cosmetic'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.additional_damage === 'minor_cosmetic' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.additional_damage === 'minor_cosmetic' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🎨 Minor cosmetic damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Scratches or dents not affecting safety</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('additional_damage', 'safety_affecting'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.additional_damage === 'safety_affecting'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.additional_damage === 'safety_affecting' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.additional_damage === 'safety_affecting' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Safety-affecting damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Additional damage that impacts vehicle safety or operation</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Critical Warnings for High-Risk Scenarios */}
                    {(responses.damage_type === 'completely_missing' || 
                      responses.vehicle_side === 'both_sides' || 
                      responses.vehicle_side === 'offside' ||
                      responses.additional_damage === 'safety_affecting') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <Shield className="w-8 h-8 text-red-400 mt-1 animate-pulse" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 HIGH SAFETY RISK DETECTED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Critical mirror damage scenario requiring careful evaluation</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">High Risk Factors:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {responses.damage_type === 'completely_missing' && (
                                                    <li>Complete mirror loss severely impacts visibility</li>
                                                )}
                                                {responses.vehicle_side === 'both_sides' && (
                                                    <li>Multiple mirror damage creates major blind spots</li>
                                                )}
                                                {responses.vehicle_side === 'offside' && (
                                                    <li>Driver side mirror critical for safe lane changes</li>
                                                )}
                                                {responses.additional_damage === 'safety_affecting' && (
                                                    <li>Combined damage may affect overall vehicle safety</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-6 border-t border-white/20">
                        <button
                            onClick={onNext}
                            disabled={!responses.damage_type || !responses.vehicle_side || !responses.additional_damage}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            DRIVER CAPABILITY <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">👁️ DRIVER CAPABILITY ASSESSMENT</h2>
                        <p className="text-gray-300">Critical evaluation: Can the driver use the mirror satisfactorily for safe operation?</p>
                    </div>

                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <div className="flex items-start space-x-4">
                            <Eye className="w-8 h-8 text-red-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-4">🚨 Operational DRIVER CAPABILITY CHECK</h3>
                                <p className="font-bold text-lg text-red-300/90">Can the driver continue using the mirror satisfactorily?</p>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                    <h4 className="font-bold text-red-200 mb-3">Consider these factors:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-red-300/90">• Remaining mirror functionality</p>
                                            <p className="text-red-300/90">• Driver visibility and safety</p>
                                            <p className="text-red-300/90">• Alternative vision methods</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-red-300/90">• Route and traffic conditions</p>
                                            <p className="text-red-300/90">• Distance to changeover point</p>
                                            <p className="text-red-300/90">• Driver confidence and comfort</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Driver Capability Decision</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('driver_capability', 'satisfactory'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_capability === 'satisfactory'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_capability === 'satisfactory' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_capability === 'satisfactory' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ YES - Driver can continue using mirror satisfactorily</span>
                                        <p className="text-sm text-gray-300 mt-1">Sufficient visibility and driver comfort for safe operation</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('driver_capability', 'cannot_use'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_capability === 'cannot_use'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_capability === 'cannot_use' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_capability === 'cannot_use' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 NO - Driver cannot use mirror satisfactorily</span>
                                        <p className="text-sm text-gray-300 mt-1">Insufficient visibility or driver confidence compromised</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Engineering Consultation for Complex Cases */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Engineering Consultation</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Do you need engineering consultation for this mirror damage?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('engineering_needed', 'yes'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_needed === 'yes'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <span className="font-medium">🔧 Engineering consultation required</span>
                            </button>
                            <button
                                onClick={() => { updateResponse('engineering_needed', 'no'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_needed === 'no'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ Clear assessment - no engineering needed</span>
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
                            disabled={!responses.driver_capability || !responses.engineering_needed}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            FINAL DECISION <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            // Determine final decision based on Operational logic
            const mustStopEngineering = responses.driver_capability === 'cannot_use' ||
                                       responses.damage_type === 'completely_missing' ||
                                       responses.vehicle_side === 'both_sides' ||
                                       responses.additional_damage === 'safety_affecting' ||
                                       responses.engineering_needed === 'yes';

            const canContinueToChangeover = responses.driver_capability === 'satisfactory' &&
                                          responses.damage_type !== 'completely_missing' &&
                                          responses.vehicle_side !== 'both_sides' &&
                                          responses.additional_damage !== 'safety_affecting' &&
                                          responses.engineering_needed === 'no';

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 WING MIRRORS - FINAL DECISION</h2>
                        <p className="text-gray-300">compliant safety decision based on mirror damage assessment.</p>
                    </div>
                    
                    {mustStopEngineering ? (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛑</div>
                                <h3 className="text-2xl font-bold text-red-200 mb-2">STOP AND SEEK ENGINEERING ASSISTANCE</h3>
                                <p className="text-red-300/90 text-lg mb-6">
                                    Mirror damage affects safety - professional assessment required
                                </p>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <h4 className="font-bold text-lg text-red-200 mb-3">🚨 Required Actions:</h4>
                                <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                    {responses.driver_capability === 'cannot_use' && (
                                        <li>Driver cannot use mirror safely - stop and seek engineering assistance</li>
                                    )}
                                    {responses.damage_type === 'completely_missing' && (
                                        <li>Complete mirror loss requires immediate attention</li>
                                    )}
                                    {responses.vehicle_side === 'both_sides' && (
                                        <li>Multiple mirror damage creates dangerous blind spots</li>
                                    )}
                                    {responses.additional_damage === 'safety_affecting' && (
                                        <li>Combined damage affects overall vehicle safety</li>
                                    )}
                                    {responses.engineering_needed === 'yes' && (
                                        <li>Professional engineering assessment required</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : canContinueToChangeover ? (
                        <div className="bg-amber-500/30 backdrop-blur-sm rounded-lg p-6 border border-amber-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-amber-200 mb-2">CONTINUE TO NEAREST CHANGEOVER POINT</h3>
                                <p className="text-amber-300/90 text-lg mb-6">
                                    Driver can continue safely but changeover should be arranged
                                </p>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <h4 className="font-bold text-lg text-amber-200 mb-3">⚠️ Continuation Requirements:</h4>
                                <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                    <li>Continue to nearest suitable changeover point</li>
                                    <li>Driver must exercise additional caution</li>
                                    <li>Avoid high-risk maneuvers where possible</li>
                                    <li>Arrange changeover as soon as feasible</li>
                                    <li>Record defects in Go-Check when stationary and safe</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-6 border border-blue-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🔧</div>
                                <h3 className="text-2xl font-bold text-blue-200 mb-2">COMPLEX ASSESSMENT REQUIRED</h3>
                                <p className="text-blue-300/90 text-lg mb-6">
                                    Situation requires additional evaluation
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Damage Type:</span>
                                    <span className="text-white ml-2 capitalize">
                                        {responses.damage_type === 'glass_only' ? 'Glass Only' :
                                         responses.damage_type === 'glass_and_arm' ? 'Glass and Arm' :
                                         'Completely Missing'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Vehicle Side:</span>
                                    <span className="text-white ml-2 capitalize">
                                        {responses.vehicle_side === 'nearside' ? 'Nearside (Passenger)' :
                                         responses.vehicle_side === 'offside' ? 'Offside (Driver)' :
                                         'Both Sides'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Additional Damage:</span>
                                    <span className="text-white ml-2 capitalize">
                                        {responses.additional_damage === 'none' ? 'None' :
                                         responses.additional_damage === 'minor_cosmetic' ? 'Minor Cosmetic' :
                                         'Safety Affecting'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Driver Capability:</span>
                                    <span className="text-white ml-2">
                                        {responses.driver_capability === 'satisfactory' ? 'Can Use Satisfactorily' : 'Cannot Use Satisfactorily'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Engineering:</span>
                                    <span className="text-white ml-2">
                                        {responses.engineering_needed === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Final Decision:</span>
                                    <span className={`ml-2 font-semibold ${
                                        mustStopEngineering ? 'text-red-300' : 
                                        canContinueToChangeover ? 'text-amber-300' : 'text-blue-300'
                                    }`}>
                                        {mustStopEngineering ? 'STOP - ENGINEERING REQUIRED' : 
                                         canContinueToChangeover ? 'CONTINUE TO CHANGEOVER' : 'COMPLEX ASSESSMENT'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Go-Check Documentation Requirements</h4>
                                <ul className="list-disc list-inside space-y-1 text-blue-300/80 text-sm">
                                    <li>Record defects immediately when bus is stationary and in safe location</li>
                                    <li>Document extent of mirror damage (glass vs full assembly)</li>
                                    <li>Note which side(s) of vehicle affected</li>
                                    <li>Include photos if safe to obtain</li>
                                    <li>Record driver capability assessment and final decision</li>
                                    <li>Document any additional vehicle damage</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <div className="flex items-center space-x-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <div>
                                <h3 className="text-xl font-bold text-green-200">Wing Mirrors Assessment Complete</h3>
                                <p className="text-green-300/90 mt-2">Operational procedure followed. Safety decision based on driver capability and damage assessment.</p>
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
window.WingMirrorsWizard = WingMirrorsWizard;
export default WingMirrorsWizard;
