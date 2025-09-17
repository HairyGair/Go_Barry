import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Loose Wheel Nuts Wizard Component - CRITICAL SAFETY EMERGENCY
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide v1.3 - Loose Wheel Nuts Section (Page 28)
// DVSA Categorisation: DANGEROUS DEFECT - Immediate Prohibition (Category I)

const LooseWheelNutsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-red-500/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <AlertTriangle className="w-12 h-12 text-red-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">🚨 LOOSE WHEEL NUTS - CRITICAL SAFETY EMERGENCY</h2>
                        <p className="text-gray-300 text-lg">Immediate safety protocol for wheel nut security failure - following SDC Engineering Issues Guide v1.3 critical safety procedures.</p>
                        <p className="text-red-300 text-sm mt-2 font-semibold">⚠️ DVSA Classification: DANGEROUS DEFECT requiring immediate prohibition</p>
                    </div>
                    
                    {/* MASSIVE EMERGENCY WARNING */}
                    <div className="bg-red-500/40 backdrop-blur-sm rounded-lg p-8 border-4 border-red-400/60 animate-pulse">
                        <div className="flex items-start space-x-6">
                            <AlertTriangle className="w-16 h-16 text-red-300 mt-2 animate-bounce" />
                            <div className="flex-1">
                                <h3 className="text-3xl font-bold text-red-200 mb-4">⚠️ IMMEDIATE SAFETY EMERGENCY</h3>
                                <div className="text-red-200/90 space-y-4 text-lg">
                                    <p className="font-bold text-xl">Loose wheel nuts pose IMMEDIATE CATASTROPHIC DANGER</p>
                                    <div className="bg-red-600/60 backdrop-blur-sm rounded-lg p-6 mt-6">
                                        <h4 className="font-bold text-2xl text-red-100 mb-4">SDC v1.3 MANDATORY ACTIONS - NO EXCEPTIONS:</h4>
                                        <ul className="list-disc list-inside space-y-3 text-red-200/90 text-lg">
                                            <li className="font-semibold">🛑 STOP IMMEDIATELY - Vehicle must stop safely at the earliest opportunity</li>
                                            <li className="font-semibold">🔧 SEEK ASSISTANCE FROM ENGINEERING - Contact Engineering immediately</li>
                                            <li className="font-semibold">🚫 DO NOT ALLOW VEHICLE TO CONTINUE - Under NO circumstances should the vehicle continue in service</li>
                                            <li className="font-semibold">📞 REPORT TO APPROPRIATE MANAGEMENT - Notify Engineering Manager, General Manager & Engineering Delivery Director</li>
                                            <li className="font-semibold">⚠️ DVSA DANGEROUS DEFECT - Risk of PG9 prohibition if found by authorities</li>
                                        </ul>
                                    </div>
                                    <p className="font-bold text-2xl mt-6 text-red-100">Wheel detachment can cause fatal accidents - SDC ZERO TOLERANCE POLICY</p>
                                    <p className="text-red-200/80 text-sm mt-2">Per DVSA guidance: Loose wheel nuts are classified as an IMMEDIATE PROHIBITION defect</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <h3 className="text-lg font-semibold text-orange-200 mb-4">Initial Wheel Nut Assessment</h3>
                            <p className="text-orange-300/80 text-sm mb-4">How was the loose wheel nut condition discovered?</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('discovery_method', 'visual_inspection'); onNext(); }}
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
                                            <span className="font-medium">👁️ Visual inspection by driver</span>
                                            <p className="text-sm text-gray-300 mt-1">Driver noticed loose nuts during walkround check</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('discovery_method', 'unusual_noise'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.discovery_method === 'unusual_noise'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.discovery_method === 'unusual_noise' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.discovery_method === 'unusual_noise' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🔊 Unusual noise from wheel area</span>
                                            <p className="text-sm text-gray-300 mt-1">Rattling, clicking, or metallic sounds</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('discovery_method', 'wheel_wobble'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.discovery_method === 'wheel_wobble'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.discovery_method === 'wheel_wobble' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.discovery_method === 'wheel_wobble' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🌪️ Wheel wobble or vibration</span>
                                            <p className="text-sm text-gray-300 mt-1">Abnormal wheel movement or steering vibration</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('discovery_method', 'third_party_report'); onNext(); }}
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
                                            <span className="font-medium">📞 Third party report (public/DVSA/police)</span>
                                            <p className="text-sm text-gray-300 mt-1">External observer noticed wheel nut issues</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('discovery_method', 'maintenance_check'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.discovery_method === 'maintenance_check'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.discovery_method === 'maintenance_check' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.discovery_method === 'maintenance_check' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🔧 Maintenance inspection</span>
                                            <p className="text-sm text-gray-300 mt-1">Discovered during scheduled or routine check</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <h3 className="text-lg font-semibold text-blue-200 mb-4">Wheel Location & Severity</h3>
                            <p className="text-blue-300/80 text-sm mb-4">Which wheel(s) are affected and what is the severity?</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('wheel_location', 'front_wheel'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.wheel_location === 'front_wheel'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.wheel_location === 'front_wheel' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.wheel_location === 'front_wheel' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🚗 Front wheel (steering affected)</span>
                                            <p className="text-sm text-gray-300 mt-1">Critical - affects steering control</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('wheel_location', 'rear_wheel'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.wheel_location === 'rear_wheel'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.wheel_location === 'rear_wheel' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.wheel_location === 'rear_wheel' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🚌 Rear wheel (stability affected)</span>
                                            <p className="text-sm text-gray-300 mt-1">Critical - affects vehicle stability</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('wheel_location', 'multiple_wheels'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.wheel_location === 'multiple_wheels'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.wheel_location === 'multiple_wheels' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.wheel_location === 'multiple_wheels' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">⚠️ Multiple wheels affected</span>
                                            <p className="text-sm text-gray-300 mt-1">EXTREME DANGER - Multiple failure points</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('wheel_location', 'unknown_location'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.wheel_location === 'unknown_location'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.wheel_location === 'unknown_location' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.wheel_location === 'unknown_location' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">❓ Location unknown or uncertain</span>
                                            <p className="text-sm text-gray-300 mt-1">Requires immediate professional assessment</p>
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
                                    onClick={() => { updateResponse('vehicle_status', 'in_service_passengers'); onNext(); }}
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
                                            <p className="text-sm text-gray-300 mt-1">HIGHEST PRIORITY - Passenger safety at risk</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('vehicle_status', 'out_of_service'); onNext(); }}
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
                                            <p className="text-sm text-gray-300 mt-1">Driver and public safety at risk</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('vehicle_status', 'stationary_safe'); onNext(); }}
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
                                            <p className="text-sm text-gray-300 mt-1">Vehicle secured, no immediate movement risk</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('vehicle_status', 'moving_unsafe'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.vehicle_status === 'moving_unsafe'
                                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.vehicle_status === 'moving_unsafe' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                        }`}>
                                            {responses.vehicle_status === 'moving_unsafe' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🚨 Still moving (EMERGENCY)</span>
                                            <p className="text-sm text-gray-300 mt-1">CRITICAL - Must stop immediately</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* Critical Safety Warnings for All Cases */}
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-8 border-4 border-red-400/60">
                            <div className="flex items-start space-x-6">
                                <Shield className="w-16 h-16 text-red-300 mt-2 animate-pulse" />
                                <div className="flex-1">
                                    <h3 className="text-3xl font-bold text-red-200 mb-4">🚨 SDC CRITICAL SAFETY PROTOCOL</h3>
                                    <div className="text-red-200/90 space-y-4">
                                        <p className="font-bold text-xl">ALL cases of loose wheel nuts trigger immediate emergency protocol</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6">
                                            <h4 className="font-bold text-red-200 mb-4 text-2xl">Mandatory SDC Actions - NO EXCEPTIONS:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <h5 className="font-semibold text-red-200 text-lg">IMMEDIATE ACTIONS:</h5>
                                                    <ul className="list-disc list-inside space-y-2 text-red-300/90 text-sm">
                                                        <li>🛑 STOP vehicle immediately</li>
                                                        <li>🔒 Switch off engine</li>
                                                        <li>🏢 Secure vehicle area</li>
                                                        <li>👥 Evacuate all passengers</li>
                                                    </ul>
                                                </div>
                                                <div className="space-y-3">
                                                    <h5 className="font-semibold text-red-200 text-lg">MANDATORY REPORTING:</h5>
                                                    <ul className="list-disc list-inside space-y-2 text-red-300/90 text-sm">
                                                        <li>🔧 Engineering Manager</li>
                                                        <li>👨‍💼 General Manager</li>
                                                        <li>📊 Engineering Delivery Director</li>
                                                        <li>📋 Safety incident documentation</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="mt-6 p-4 bg-red-600/40 backdrop-blur-sm rounded">
                                                <p className="font-bold text-red-100 text-lg">🚫 SDC ZERO TOLERANCE: Vehicle must NOT continue under any circumstances</p>
                                                <p className="text-red-200/80 text-sm mt-1">As per SDC Guide v1.3 Page 28: "Under no circumstances should the vehicle continue in service with loose wheel nuts"</p>
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
                            disabled={!responses.discovery_method || !responses.wheel_location || !responses.vehicle_status}
                            className="flex items-center px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            EMERGENCY PROTOCOL <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🚨 IMMEDIATE EMERGENCY ACTIONS</h2>
                        <p className="text-gray-300">Critical safety response protocol - all loose wheel nut incidents require identical emergency response.</p>
                    </div>

                    {/* Emergency Stop Protocol */}
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-xl font-bold text-red-200 mb-4">🛑 Step 1: IMMEDIATE VEHICLE STOP</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-red-200 mb-2">If vehicle is still moving:</h4>
                                <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                    <li>Activate hazard lights immediately</li>
                                    <li>Find safe location to stop (hard shoulder, lay-by, car park)</li>
                                    <li>Apply parking brake firmly</li>
                                    <li>Switch off engine completely</li>
                                    <li>Remove ignition key to prevent restart</li>
                                </ul>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-red-200 mb-2">If vehicle already stopped:</h4>
                                <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                    <li>Ensure parking brake is applied</li>
                                    <li>Confirm engine is switched off</li>
                                    <li>Place warning triangle if safe to do so</li>
                                    <li>Secure area around vehicle</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Evacuation */}
                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-xl font-bold text-orange-200 mb-4">👥 Step 2: PASSENGER EVACUATION</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-orange-200 mb-2">If passengers on board:</h4>
                                <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                    <li>Inform passengers calmly: "For your safety, please exit the vehicle immediately"</li>
                                    <li>Direct passengers to safe location away from traffic</li>
                                    <li>Assist passengers with mobility issues</li>
                                    <li>Ensure all passengers are accounted for</li>
                                    <li>Keep passengers together in safe area</li>
                                </ul>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-orange-200 mb-2">If no passengers:</h4>
                                <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                    <li>Ensure driver is in safe location</li>
                                    <li>Check surrounding area is clear</li>
                                    <li>Prepare for emergency services if needed</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Area Security */}
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-xl font-bold text-yellow-200 mb-4">🏢 Step 3: SECURE VEHICLE AREA</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                                <li>Place warning triangles 50+ meters behind vehicle (if safe)</li>
                                <li>Keep hazard lights on</li>
                                <li>Ensure no one approaches the vehicle</li>
                                <li>Create safe zone around entire vehicle</li>
                                <li>Be prepared for potential wheel detachment</li>
                                <li>Contact police if vehicle obstructs traffic flow</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-bold text-red-200 mb-3">⚠️ Critical Safety Reminder</h3>
                        <p className="text-red-300/90 text-sm">
                            Under NO circumstances should anyone attempt to drive, move, or inspect the vehicle until qualified engineering personnel arrive and assess the situation.
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
                            onClick={onNext}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-lg font-semibold"
                        >
                            MANAGEMENT ESCALATION <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📞 MANDATORY MANAGEMENT REPORTING</h2>
                        <p className="text-gray-300">Critical incident escalation protocol - all loose wheel nut incidents require immediate management notification.</p>
                    </div>
                    
                    {/* Engineering Contact */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-xl font-bold text-blue-200 mb-4">🔧 Step 4: ENGINEERING ASSISTANCE</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-blue-200 mb-2">Immediate Engineering Contact:</h4>
                                <ul className="list-disc list-inside space-y-1 text-blue-300/90 text-sm">
                                    <li>Contact engineering team immediately</li>
                                    <li>Report: "CRITICAL SAFETY INCIDENT - Loose wheel nuts"</li>
                                    <li>Provide exact location and vehicle details</li>
                                    <li>Confirm vehicle is secure and area evacuated</li>
                                    <li>Request immediate attendance</li>
                                    <li>Do NOT attempt any repairs or movement</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Management Notification */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-xl font-bold text-purple-200 mb-4">👨‍💼 Step 5: MANDATORY MANAGEMENT REPORTING</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-purple-200 mb-3">SDC v1.3 requires immediate notification to ALL of:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-purple-600/20 p-3 rounded">
                                        <h5 className="font-semibold text-purple-200 mb-2">🔧 Engineering Manager</h5>
                                        <ul className="list-disc list-inside text-purple-300/90 text-xs space-y-1">
                                            <li>Technical assessment required</li>
                                            <li>Safety investigation</li>
                                            <li>Vehicle inspection</li>
                                        </ul>
                                    </div>
                                    <div className="bg-purple-600/20 p-3 rounded">
                                        <h5 className="font-semibold text-purple-200 mb-2">👔 General Manager</h5>
                                        <ul className="list-disc list-inside text-purple-300/90 text-xs space-y-1">
                                            <li>Operational impact</li>
                                            <li>Customer communication</li>
                                            <li>Service adjustments</li>
                                        </ul>
                                    </div>
                                    <div className="bg-purple-600/20 p-3 rounded">
                                        <h5 className="font-semibold text-purple-200 mb-2">📊 Engineering Delivery Director</h5>
                                        <ul className="list-disc list-inside text-purple-300/90 text-xs space-y-1">
                                            <li>Fleet-wide implications</li>
                                            <li>Policy review</li>
                                            <li>Safety audit</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documentation Requirements */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-xl font-bold text-green-200 mb-4">📋 Step 6: INCIDENT DOCUMENTATION</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-green-200 mb-2">Required Documentation:</h4>
                                <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                    <li>Log incident in Tranzaura as CRITICAL SAFETY INCIDENT</li>
                                    <li>Record exact time of discovery</li>
                                    <li>Document discovery method and circumstances</li>
                                    <li>Note wheel location and severity assessment</li>
                                    <li>Record actions taken and personnel contacted</li>
                                    <li>Complete safety incident report form</li>
                                    <li>Take photographs if safe to do so</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-bold text-red-200 mb-3">🚫 SDC Zero Tolerance Policy (v1.3)</h3>
                        <p className="text-red-300/90 text-sm mb-2">
                            Loose wheel nuts represent the highest level of safety risk. Per SDC Guide v1.3: "Incidents of loose wheel nuts should be reported to the depot engineering manager, general manager and engineering delivery director."
                        </p>
                        <p className="text-red-300/90 text-sm">
                            DVSA Classification: This is a DANGEROUS DEFECT that would result in immediate prohibition (PG9) if discovered during roadside inspection.
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
                            onClick={onNext}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-lg font-semibold"
                        >
                            FINAL REPORT <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 LOOSE WHEEL NUTS - CRITICAL SAFETY INCIDENT REPORT</h2>
                        <p className="text-gray-300">Complete safety incident assessment with full SDC compliance and mandatory reporting.</p>
                    </div>
                    
                    {/* Safety Status Secured */}
                    <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-8 border border-green-400/50">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🛡️</div>
                            <h3 className="text-2xl font-bold text-green-200 mb-2">CRITICAL SAFETY INCIDENT - SECURED</h3>
                            <p className="text-green-300/90 text-lg mb-6">
                                All mandatory SDC safety protocols have been followed
                            </p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                            <h4 className="font-bold text-lg text-green-200 mb-4">✅ Safety Actions Completed:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-2">
                                    <p className="text-green-300/90">✅ Vehicle stopped and secured</p>
                                    <p className="text-green-300/90">✅ Passengers evacuated safely</p>
                                    <p className="text-green-300/90">✅ Engineering assistance requested</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-green-300/90">✅ Management fully notified</p>
                                    <p className="text-green-300/90">✅ Incident documented in Tranzaura</p>
                                    <p className="text-green-300/90">✅ Zero tolerance policy enforced</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Incident Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Incident Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Discovery Method:</span>
                                    <span className="text-white ml-2 capitalize">{responses.discovery_method?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Wheel Location:</span>
                                    <span className="text-white ml-2 capitalize">{responses.wheel_location?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Initial Vehicle Status:</span>
                                    <span className="text-white ml-2 capitalize">{responses.vehicle_status?.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Safety Priority:</span>
                                    <span className="text-red-300 ml-2 font-semibold">CRITICAL EMERGENCY</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Vehicle Status:</span>
                                    <span className="text-green-300 ml-2 font-semibold">SECURED - NO MOVEMENT</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Next Action:</span>
                                    <span className="text-blue-300 ml-2 font-semibold">AWAIT ENGINEERING</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Outcome Notice */}
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-bold text-red-200 mb-4">🚫 VEHICLE PROHIBITION STATUS</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            <p className="text-red-300/90 text-sm font-semibold mb-2">
                                This vehicle is now PROHIBITED from service under SDC Zero Tolerance Policy (v1.3):
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-red-300/80 text-sm">
                                <li>Vehicle must remain stationary until engineering certification</li>
                                <li>No movement permitted without qualified engineer approval</li>
                                <li>Complete wheel nut inspection required across entire fleet</li>
                                <li>Maintenance procedures will be reviewed and enhanced</li>
                                <li>Driver training update may be required</li>
                                <li>DVSA notification may be necessary depending on assessment</li>
                            </ul>
                        </div>
                    </div>

                    {/* Go-Check Documentation */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Tranzaura Critical Incident Documentation</h4>
                                <p className="text-blue-300/80 text-sm mb-2">
                                    This incident has been classified as a CRITICAL SAFETY EMERGENCY and must be recorded in Tranzaura with full details, 
                                    photographs, and all actions taken. This will form part of the safety audit trail.
                                </p>
                                <p className="text-blue-300/80 text-sm font-semibold">
                                    EP Morris Code: BDSF (mark as URGENT - Critical Safety)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Completion Confirmation */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <div className="flex items-center space-x-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <div>
                                <h3 className="text-xl font-bold text-green-200">Critical Safety Incident Successfully Managed</h3>
                                <p className="text-green-300/90 mt-2">
                                    All SDC v1.3 mandatory protocols completed. Vehicle secured and prohibited from service until professional certification. 
                                    Public and passenger safety maintained through immediate emergency response. DVSA dangerous defect classification acknowledged.
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
                                // Always log breakdown for loose wheel nuts - critical safety issue
                                try {
                                    await window.logBreakdown({
                                        supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                                        vehicleReg: window.selectedReg || 'Unknown',
                                        fleetNo: window.selectedFleetNo || 'Unknown',
                                        breakdownType: 'Loose Wheel Nuts',
                                        timestamp: new Date().toISOString()
                                    });
                                    console.log('✅ Loose Wheel Nuts breakdown logged successfully');
                                } catch (error) {
                                    console.error('Failed to log loose wheel nuts breakdown:', error);
                                    // Don't block completion if logging fails
                                }
                                onComplete();
                            }}
                            className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-lg font-semibold"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />COMPLETE SAFETY ASSESSMENT
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.LooseWheelNutsWizard = LooseWheelNutsWizard;

export default LooseWheelNutsWizard;
