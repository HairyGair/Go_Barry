import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Low Water Wizard Component
// Follows the operational procedure reference
// Updated to include Red/Amber warning light guidance

const LowWaterWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Droplet } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Droplet className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">💧 Low Water Assessment</h2>
                        <p className="text-gray-300">Following standard operational safety checks guidance for low water issues - systematic approach to assess safety and continuity.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Safety Priority</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            If the driver has any concerns about continuing, escalate the issue to engineering immediately. Never compromise safety.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step 1: Check Warning Light Color</h3>
                        <p className="text-gray-300 text-sm mb-4">CRITICAL: First, we need to check if there's a low water warning light and what color it is. This determines immediate safety actions.</p>
                        
                        <div className="bg-red-500/20 rounded-lg p-4 border border-red-400/30 mb-4">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-6 h-6 text-red-400 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-red-200">Critical Safety Check</h4>
                                    <p className="text-sm text-red-300/90 mt-1">
                                        A RED low water light means IMMEDIATE STOP - the vehicle cannot continue.
                                        An AMBER light allows continuation to the nearest terminus for repair.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('warning_light', 'no_light'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_light === 'no_light'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_light === 'no_light' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_light === 'no_light' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No warning light illuminated</span>
                                        <p className="text-sm text-gray-300 mt-1">No low water warning light showing on dashboard</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('warning_light', 'amber_light'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_light === 'amber_light'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_light === 'amber_light' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_light === 'amber_light' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🟡 AMBER warning light</span>
                                        <p className="text-sm text-gray-300 mt-1">Amber low water light - can continue to nearest terminus</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('warning_light', 'red_light'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_light === 'red_light'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_light === 'red_light' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_light === 'red_light' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔴 RED warning light</span>
                                        <p className="text-sm text-gray-300 mt-1">Red low water light - MUST STOP IMMEDIATELY</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {responses.warning_light === 'red_light' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <h3 className="text-lg font-semibold text-red-200 mb-4">🚨 IMMEDIATE ACTION REQUIRED</h3>
                            <p className="text-red-300/80 text-sm mb-4">
                                RED low water light indicates a critical safety issue. The vehicle MUST stop immediately.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Instruct driver to stop in a safe location immediately</li>
                                <li>Do NOT continue driving</li>
                                <li>Await engineering assistance</li>
                                <li>Record defect in Go-Check system</li>
                            </ul>
                        </div>
                    )}

                    {responses.warning_light === 'amber_light' && (
                        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                            <h3 className="text-lg font-semibold text-yellow-200 mb-4">⚠️ AMBER Light Guidance</h3>
                            <p className="text-yellow-300/80 text-sm mb-4">
                                AMBER low water light allows continuation to the nearest terminus where engineers can top up the coolant.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                                <li>Vehicle can continue to nearest terminus</li>
                                <li>Arrange for engineer to meet at terminus</li>
                                <li>Top up coolant at terminus</li>
                                <li>Monitor temperature closely during journey</li>
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={responses.warning_light === 'red_light' ? onComplete : onNext}
                            disabled={!responses.warning_light}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.warning_light === 'red_light' ? 'Complete Assessment' : 'Continue Assessment'}
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Droplet className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">💧 Low Water Assessment</h2>
                        <p className="text-gray-300">Step 2: Check for water leaks to determine the severity of the issue.</p>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📋 Previous Assessment</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            Warning Light: {responses.warning_light === 'amber_light' ? '🟡 AMBER - Can continue to terminus' : '✅ No light - Less urgent'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step 2: Check for Leaks</h3>
                        <p className="text-gray-300 text-sm mb-4">First, we need to determine if there are any visible water leaks. Ask the driver to safely inspect for visible signs of water leaks around the vehicle.</p>
                        
                        <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30 mb-4">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-yellow-200">Safety Reminder</h4>
                                    <p className="text-sm text-yellow-300/90 mt-1">
                                        NEVER ask a driver to step into the highway. Ensure they stay safe at all times during inspection.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('leak_check', 'no_leaks'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_check === 'no_leaks'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_check === 'no_leaks' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_check === 'no_leaks' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No leaks present</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver reports no visible water leaks around the vehicle</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('leak_check', 'leak_found'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_check === 'leak_found'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_check === 'leak_found' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_check === 'leak_found' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Leak found</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver reports visible water leaks around the vehicle</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('leak_check', 'uncertain'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_check === 'uncertain'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_check === 'uncertain' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_check === 'uncertain' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Driver uncertain/unable to check safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver cannot safely inspect or is unsure about leak status</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {responses.leak_check === 'leak_found' && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <h3 className="text-lg font-semibold text-orange-200 mb-4">🔍 Leak Assessment</h3>
                            <p className="text-orange-300/80 text-sm mb-4">
                                A leak has been found. We need to assess if the bus can safely reach the next convenient changeover point.
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('leak_severity', 'minor_short_distance'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.leak_severity === 'minor_short_distance'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <span className="font-medium">✅ Minor leak, short distance to changeover point</span>
                                    <p className="text-sm text-gray-300 mt-1">Small leak, changeover point is close and reachable</p>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('leak_severity', 'seek_engineering_advice'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.leak_severity === 'seek_engineering_advice'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <span className="font-medium">⚠️ Significant leak or long distance to changeover</span>
                                    <p className="text-sm text-gray-300 mt-1">Leak is substantial or changeover point is too far away</p>
                                </button>
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
                            disabled={!responses.leak_check}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔊 Water Buzzer Status Check</h2>
                        <p className="text-gray-300">Step 3: Determine if the water buzzer is sounding - this affects the urgency of the situation.</p>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">🔊 Water Buzzer Significance</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            The water buzzer is an important indicator of system status. If it's sounding, it indicates a more urgent situation requiring immediate attention.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Buzzer Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Ask the driver: "Can you hear the water buzzer sounding in the vehicle?"</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('water_buzzer', 'no_buzzer'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer === 'no_buzzer'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer === 'no_buzzer' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer === 'no_buzzer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔇 No buzzer sounding</span>
                                        <p className="text-sm text-gray-300 mt-1">Water buzzer is not active - less urgent situation</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('water_buzzer', 'buzzer_sounding'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer === 'buzzer_sounding'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer === 'buzzer_sounding' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer === 'buzzer_sounding' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔊 Buzzer sounding</span>
                                        <p className="text-sm text-gray-300 mt-1">Water buzzer is active - indicates more urgent situation</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('water_buzzer', 'intermittent'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer === 'intermittent'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer === 'intermittent' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer === 'intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Intermittent buzzer</span>
                                        <p className="text-sm text-gray-300 mt-1">Buzzer sounds on and off - variable urgency</p>
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
                            disabled={!responses.water_buzzer}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Recent Water Top-Up History</h2>
                        <p className="text-gray-300">Step 4: Confirm recent water top-up history to determine next action.</p>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📝 SDC Top-Up Log</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            Use the SDC top-up log to verify recent water fills. This helps determine if the issue is due to normal consumption or a system problem.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Top-Up History Check</h3>
                        <p className="text-gray-300 text-sm mb-4">Check the SDC top-up log and ask the driver about recent water fills.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('recent_topup', 'recently_filled_depot'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.recent_topup === 'recently_filled_depot'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.recent_topup === 'recently_filled_depot' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.recent_topup === 'recently_filled_depot' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🏭 Recently filled at the depot</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle was topped up recently at depot - may need en-route top-up</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('recent_topup', 'filled_long_ago'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.recent_topup === 'filled_long_ago'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.recent_topup === 'filled_long_ago' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.recent_topup === 'filled_long_ago' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⏰ Filled a long time ago</span>
                                        <p className="text-sm text-gray-300 mt-1">No recent top-up recorded - normal consumption expected</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('recent_topup', 'driver_unsure'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.recent_topup === 'driver_unsure'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.recent_topup === 'driver_unsure' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.recent_topup === 'driver_unsure' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Driver unsure</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver doesn't know top-up history - need to check log</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {(responses.recent_topup === 'recently_filled_depot' || responses.recent_topup === 'driver_unsure') && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <h3 className="text-lg font-semibold text-orange-200 mb-4">🚚 En-Route Top-Up Assessment</h3>
                            <p className="text-orange-300/80 text-sm mb-4">
                                Since the vehicle was recently filled or status is uncertain, consider arranging an en-route top-up by authorized staff.
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('topup_feasible', 'topup_arranged'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.topup_feasible === 'topup_arranged'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <span className="font-medium">✅ En-route top-up arranged</span>
                                    <p className="text-sm text-gray-300 mt-1">Authorized staff can top up the water system en-route</p>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('topup_feasible', 'topup_not_feasible'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.topup_feasible === 'topup_not_feasible'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <span className="font-medium">❌ En-route top-up not feasible</span>
                                    <p className="text-sm text-gray-300 mt-1">Cannot arrange authorized staff for en-route top-up</p>
                                </button>
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
                            disabled={!responses.recent_topup}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Decision
                        </button>
                    </div>
                </div>
            );

        case 5:
            // Decision logic based on operational procedures
            const generateDecision = () => {
                // CRITICAL: Check warning light first
                if (responses.warning_light === 'red_light') {
                    return {
                        action: 'stop_immediately',
                        priority: 'critical',
                        message: 'STOP IMMEDIATELY - Red Warning Light',
                        details: 'Red low water light indicates critical safety issue. Vehicle must stop immediately and await engineering assistance.'
                    };
                }
                
                if (responses.warning_light === 'amber_light') {
                    return {
                        action: 'continue_to_terminus',
                        priority: 'medium',
                        message: 'Continue to nearest terminus - Amber Warning Light',
                        details: 'Amber low water light allows continuation to nearest terminus where engineers can top up coolant. Monitor temperature closely.'
                    };
                }
                
                // Step 1: Check for leaks first
                if (responses.leak_check === 'leak_found') {
                    if (responses.leak_severity === 'minor_short_distance') {
                        return {
                            action: 'continue_short_distance',
                            priority: 'medium',
                            message: 'Continue to next convenient changeover point',
                            details: 'Minor leak detected but short distance to changeover point allows safe continuation'
                        };
                    } else {
                        return {
                            action: 'seek_engineering_advice',
                            priority: 'high',
                            message: 'Seek advice from engineering',
                            details: 'Significant leak or long distance requires engineering assessment'
                        };
                    }
                }
                
                if (responses.leak_check === 'uncertain') {
                    return {
                        action: 'stop_for_inspection',
                        priority: 'high',
                        message: 'Stop for proper inspection',
                        details: 'Unable to safely assess leak status - requires engineering attendance'
                    };
                }

                // Step 2: No leaks found - check water buzzer
                if (responses.water_buzzer === 'buzzer_sounding' || responses.water_buzzer === 'intermittent') {
                    // Buzzer sounding - more urgent
                    if (responses.recent_topup === 'recently_filled_depot') {
                        if (responses.topup_feasible === 'topup_arranged') {
                            return {
                                action: 'arrange_topup_and_monitor',
                                priority: 'medium',
                                message: 'Arrange en-route top-up and monitor',
                                details: 'Recent depot fill + buzzer indicates potential issue. Try top-up first, arrange changeover if problem persists'
                            };
                        } else {
                            return {
                                action: 'seek_engineering_advice',
                                priority: 'high',
                                message: 'Seek advice from engineering',
                                details: 'Recent fill + buzzer + no top-up option available requires engineering assessment'
                            };
                        }
                    } else {
                        // Long time ago or driver unsure
                        return {
                            action: 'arrange_topup_and_monitor',
                            priority: 'medium',
                            message: 'Arrange top-up and monitor situation',
                            details: 'Buzzer sounding but normal consumption time frame - try top-up en-route'
                        };
                    }
                } else {
                    // No buzzer sounding - less urgent
                    return {
                        action: 'continue_to_changeover',
                        priority: 'low',
                        message: 'Continue to next convenient changeover point',
                        details: 'No leaks, no buzzer - can continue to next convenient changeover location'
                    };
                }
            };

            const decision = generateDecision();

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Low Water Assessment Decision</h2>
                        <p className="text-gray-300">Based on your assessment responses, here is the recommended action:</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-300">Warning Light:</span> 
                                <span className="text-white ml-2">{responses.warning_light?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Leak Status:</span> 
                                <span className="text-white ml-2">{responses.leak_check?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Water Buzzer:</span> 
                                <span className="text-white ml-2">{responses.water_buzzer?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Recent Top-Up:</span> 
                                <span className="text-white ml-2">{responses.recent_topup?.replace(/_/g, ' ')}</span>
                            </div>
                            {responses.topup_feasible && (
                                <div>
                                    <span className="font-medium text-gray-300">En-Route Top-Up:</span> 
                                    <span className="text-white ml-2">{responses.topup_feasible?.replace(/_/g, ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {decision.priority === 'critical' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 STOP IMMEDIATELY</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Instruct driver to stop in safe location immediately</li>
                                                <li>Vehicle MUST NOT continue</li>
                                                <li>Await engineering assistance</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Ensure passenger safety</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision.priority === 'low' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue to next convenient changeover point</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Monitor water levels during service</li>
                                                <li>Arrange changeover at earliest opportunity</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision.priority === 'medium' && (
                        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-yellow-200 mb-3">⚠️ CAUTION - LIMITED CONTINUATION</h3>
                                    <div className="text-yellow-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-yellow-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                                                {decision.action === 'continue_to_terminus' && (
                                                    <>
                                                        <li>Continue to nearest terminus only</li>
                                                        <li>Arrange for engineer to meet at terminus</li>
                                                        <li>Top up coolant at terminus</li>
                                                        <li>Monitor temperature closely during journey</li>
                                                    </>
                                                )}
                                                {decision.action === 'arrange_topup_and_monitor' && (
                                                    <>
                                                        <li>Arrange en-route water top-up by authorized staff</li>
                                                        <li>Monitor if top-up resolves the issue</li>
                                                        <li>If issue persists after top-up, arrange changeover at earliest opportunity</li>
                                                        <li>In case of second top-up, changeover at earliest opportunity</li>
                                                    </>
                                                )}
                                                <li>Record defect in Go-Check system</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision.priority === 'high' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 SEEK ENGINEERING ASSISTANCE</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Contact engineering immediately for advice</li>
                                                <li>Do not continue until engineering assessment</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Ensure passenger safety during delay</li>
                                                <li>Provide updates to driver as needed</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200">Important Reminders</h4>
                                <ul className="text-sm text-blue-300/90 mt-1 space-y-1">
                                    <li>• Safety is the priority - if driver has concerns, escalate to engineering</li>
                                    <li>• Record defect in Go-Check when stationary and in safe location</li>
                                    <li>• Monitor situation and provide updates as needed</li>
                                    <li>• Ensure all actions are communicated clearly to driver</li>
                                </ul>
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
            return <div>Unknown step</div>;
    }
};

// Export to global scope for use in the main application
window.LowWaterWizard = LowWaterWizard;
export default LowWaterWizard;
