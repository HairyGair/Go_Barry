import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Interior/Exterior Damage Wizard Component
// Follows SDC Engineering Issues Guide - Section 16 (pages 29-30)

const InteriorExteriorDamageWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Eye, Car, Wrench } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔨 Interior/Exterior Damage Assessment</h2>
                        <p className="text-gray-300">Following SDC guidance for vehicle damage assessment - prioritizing safety and operational requirements.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Safety Priority</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            Any damage that affects vehicle control, passenger safety, or creates risk of detachment must be addressed immediately following SDC procedures.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Type of Damage Reported</h3>
                        <p className="text-gray-300 text-sm mb-4">Select the specific type of damage being reported:</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('damage_type', 'floor_driver_area'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'floor_driver_area'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'floor_driver_area' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'floor_driver_area' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🏗️ Floor Around Driver Insecure/Weakened</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver area flooring compromised or unstable</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'driver_seat'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'driver_seat'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'driver_seat' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'driver_seat' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💺 Driver's Seat Loose</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver seat unstable or insecure</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'rear_view_mirror'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'rear_view_mirror'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'rear_view_mirror' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'rear_view_mirror' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🪞 Rear View Mirror Missing/Insecure/Damaged</span>
                                        <p className="text-sm text-gray-300 mt-1">Internal rear view mirror compromised</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'horn'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'horn'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'horn' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'horn' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📯 Horn Missing/Insecure/Inoperative</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle horn not functioning</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'passenger_seats'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'passenger_seats'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'passenger_seats' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'passenger_seats' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🪑 Passenger Seats Insecure</span>
                                        <p className="text-sm text-gray-300 mt-1">Passenger seating compromised or unsafe</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'body_panels'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'body_panels'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'body_panels' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'body_panels' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Body Panels - Exterior Damaged/Missing/Protruding</span>
                                        <p className="text-sm text-gray-300 mt-1">External bodywork damage or detachment risk</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'interior_panels'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'interior_panels'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'interior_panels' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'interior_panels' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🏠 Interior Side Panel - Damaged/Missing/Protruding</span>
                                        <p className="text-sm text-gray-300 mt-1">Internal panels compromised or dangerous</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'bumper_bar'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'bumper_bar'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'bumper_bar' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'bumper_bar' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🛡️ Bumper Bar Insecure/Damaged</span>
                                        <p className="text-sm text-gray-300 mt-1">Bumper damaged with risk of detachment</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('damage_type', 'registration_plate'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_type === 'registration_plate'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.damage_type === 'registration_plate' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.damage_type === 'registration_plate' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔢 Registration Plate Missing/Incomplete/Insecure</span>
                                        <p className="text-sm text-gray-300 mt-1">Number plate issues - typically non-critical</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.damage_type}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Eye className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Detailed Safety Assessment</h2>
                        <p className="text-gray-300">Evaluate the specific safety implications of the reported damage following SDC criteria.</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Driver and Vehicle Control Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Does this damage affect the driver's ability to safely control the vehicle?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('affects_control', 'yes'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.affects_control === 'yes'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.affects_control === 'yes' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.affects_control === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Yes - Affects driver control or safety</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage compromises vehicle control or driver stability</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('affects_control', 'no'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.affects_control === 'no'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.affects_control === 'no' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.affects_control === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No - Does not affect vehicle control</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver can maintain full control of the vehicle</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Detachment Risk Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Is there a risk of parts becoming detached or causing injury?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('detachment_risk', 'high'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.detachment_risk === 'high'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.detachment_risk === 'high' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.detachment_risk === 'high' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 High Risk - Likely to become detached</span>
                                        <p className="text-sm text-gray-300 mt-1">Parts may fall off and create road hazard</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('detachment_risk', 'injury'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.detachment_risk === 'injury'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.detachment_risk === 'injury' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.detachment_risk === 'injury' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Injury Risk - Sharp edges or projections</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage creates risk of passenger/driver injury</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('detachment_risk', 'low'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.detachment_risk === 'low'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.detachment_risk === 'low' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.detachment_risk === 'low' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Some Risk - Possible displacement</span>
                                        <p className="text-sm text-gray-300 mt-1">Parts may move but not immediately dangerous</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('detachment_risk', 'none'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.detachment_risk === 'none'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.detachment_risk === 'none' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.detachment_risk === 'none' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No Risk - Secure or cosmetic only</span>
                                        <p className="text-sm text-gray-300 mt-1">No risk of detachment or injury</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Securing Capability</h3>
                        <p className="text-gray-300 text-sm mb-4">Can the damaged area be temporarily secured to make it safe?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('can_secure', 'yes'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.can_secure === 'yes'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.can_secure === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.can_secure === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Yes - Can be secured safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage can be made safe temporarily</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('can_secure', 'no'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.can_secure === 'no'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.can_secure === 'no' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.can_secure === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ No - Cannot be secured</span>
                                        <p className="text-sm text-gray-300 mt-1">No way to make damage safe temporarily</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('can_secure', 'not_applicable'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.can_secure === 'not_applicable'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.can_secure === 'not_applicable' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.can_secure === 'not_applicable' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">ℹ️ Not applicable - Already secure</span>
                                        <p className="text-sm text-gray-300 mt-1">No securing needed (e.g. registration plate)</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.affects_control || !responses.detachment_risk || !responses.can_secure}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Decision
                        </button>
                    </div>
                </div>
            );

        case 3:
            // SDC Decision Logic based on page 29-30
            const isRegistrationPlate = responses.damage_type === 'registration_plate';
            const affectsControl = responses.affects_control === 'yes';
            const highRisk = responses.detachment_risk === 'high' || responses.detachment_risk === 'injury';
            const canSecure = responses.can_secure === 'yes';
            
            let decision, decisionClass, instructions, urgency;
            
            if (isRegistrationPlate) {
                decision = "CONTINUE IN SERVICE";
                decisionClass = "text-blue-500";
                urgency = "Non-Critical";
                instructions = "Registration plate issues can be recorded on Go-Check. The vehicle can continue in service, but arrange replacement/repair when possible.";
            } else if (affectsControl) {
                decision = "STOP AND AWAIT ENGINEERING";
                decisionClass = "text-red-500";
                urgency = "Critical";
                instructions = "Damage affects driver's control or safety. Vehicle must not continue in service.";
            } else if (highRisk && !canSecure) {
                decision = "STOP AND AWAIT ENGINEERING";
                decisionClass = "text-red-500";
                urgency = "Critical";
                instructions = "High risk of detachment or injury that cannot be secured. Vehicle must not continue.";
            } else if (highRisk && canSecure) {
                decision = "SECURE AND CONTINUE TO CHANGEOVER";
                decisionClass = "text-orange-500";
                urgency = "High Priority";
                instructions = "Attempt to secure the damaged area if safe to do so. Continue to the next convenient changeover point.";
            } else {
                decision = "CONTINUE TO CHANGEOVER POINT";
                decisionClass = "text-orange-500";
                urgency = "Standard";
                instructions = "Continue to the nearest suitable changeover point and arrange a vehicle change.";
            }

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            {decision.includes('STOP') ? 
                                <XCircle className="w-8 h-8 text-red-400" /> :
                                decision.includes('CONTINUE IN SERVICE') ?
                                <CheckCircle className="w-8 h-8 text-blue-400" /> :
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            }
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 SDC Assessment Decision</h2>
                        <p className="text-gray-300">Based on SDC procedures for interior/exterior damage assessment:</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-300">Damage Type:</span> 
                                <span className="text-white ml-2">{responses.damage_type?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Control Impact:</span> 
                                <span className={`ml-2 ${affectsControl ? 'text-red-400' : 'text-green-400'}`}>
                                    {affectsControl ? '❌ Affects Control' : '✅ No Impact'}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Risk Level:</span> 
                                <span className={`ml-2 ${highRisk ? 'text-red-400' : 'text-green-400'}`}>
                                    {responses.detachment_risk?.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Can Secure:</span>
                                <span className={`ml-2 ${canSecure ? 'text-green-400' : 'text-red-400'}`}>
                                    {responses.can_secure?.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {decision.includes('CONTINUE IN SERVICE') ? (
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-blue-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-200 mb-3">✅ {decision}</h3>
                                    <div className="text-blue-300/90 space-y-2">
                                        <p className="font-semibold">Urgency: {urgency}</p>
                                        <p>{instructions}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-blue-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-blue-300/90 text-sm">
                                                <li>Record issue in Go-Check system</li>
                                                <li>Arrange repair when feasible</li>
                                                <li>Monitor throughout service</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : decision.includes('STOP') ? (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 {decision}</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Urgency: {urgency}</p>
                                        <p>{instructions}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Critical Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop vehicle in safe location immediately</li>
                                                <li>Switch off engine and engage parking brake</li>
                                                <li>Contact engineering for assistance</li>
                                                <li>Do not attempt to move vehicle</li>
                                                <li>Ensure passenger safety</li>
                                                <li>Record in Go-Check with photos if possible</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start">
                                <AlertCircle className="w-8 h-8 text-orange-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">⚠️ {decision}</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">Urgency: {urgency}</p>
                                        <p>{instructions}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                {canSecure && <li>Attempt to secure damage if safe to do so</li>}
                                                <li>Continue to nearest changeover point</li>
                                                <li>Arrange vehicle change</li>
                                                <li>Monitor damage during journey</li>
                                                <li>Stop if situation worsens</li>
                                                <li>Record in Go-Check system</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                        >
                            View Final Summary
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📊 Assessment Complete</h2>
                        <p className="text-gray-300">Interior/exterior damage assessment completed following SDC Engineering Issues Guide procedures.</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Final Assessment Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-300">Damage Type:</span>
                                <span className="text-white">{responses.damage_type?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-300">Affects Control:</span>
                                <span className="text-white">{responses.affects_control}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-300">Risk Level:</span>
                                <span className="text-white">{responses.detachment_risk?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-300">Can Secure:</span>
                                <span className="text-white">{responses.can_secure?.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">Go-Check Documentation Required</h4>
                                <ul className="text-sm text-blue-300/90 space-y-1">
                                    <li>• Record all damage details in Go-Check system</li>
                                    <li>• Include photographs if possible and safe to take</li>
                                    <li>• Note any temporary securing measures taken</li>
                                    <li>• Document safety decision and reasoning</li>
                                    <li>• Report to appropriate management if safety-critical</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <div className="flex items-start space-x-3">
                            <Shield className="w-6 h-6 text-green-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-green-200 mb-2">Assessment Complete</h4>
                                <p className="text-sm text-green-300/90">
                                    Damage assessment has been completed following SDC procedures. Follow the safety decision provided and ensure all required documentation is completed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.InteriorExteriorDamageWizard = InteriorExteriorDamageWizard;
export default InteriorExteriorDamageWizard;
