import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Cutting Out/Fuel Wizard Component - Following SDC Engineering Issues Guide Section 18
// Critical fuel system safety assessment with fire prevention protocols

const CuttingOutFuelWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from imported Icons
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Flame } = Icons;
    
    // If icons aren't loaded yet, show loading
    if (!Icons) {
        return (
            <div className="text-center text-white p-8">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p>Loading wizard components...</p>
            </div>
        );
    }
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <Flame className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">⛽ Cut Out / Fuel Problem Assessment</h2>
                        <p className="text-gray-300">Following SDC Engineering Issues Guide Section 18 - Critical fuel system safety evaluation with fire prevention protocols.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🔥 CRITICAL FIRE SAFETY SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Fuel system issues pose immediate fire and explosion risks. SDC guidance prioritises detection of fuel leaks and prevention of ignition sources.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Fuel Safety Protocol:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>ANY fuel leak = immediate stop and engine shutdown</li>
                                <li>Fire services may be required for severe spills</li>
                                <li>Environmental hazard requiring containment</li>
                                <li>Potential DVSA prohibition if fuel system compromised</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">SDC Step 1: Check the Ignition</h3>
                        <p className="text-gray-300 text-sm mb-4">First step per SDC guidance: Confirm that the ignition is turned on.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('ignition_status', 'ignition_on'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ignition_status === 'ignition_on'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.ignition_status === 'ignition_on' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.ignition_status === 'ignition_on' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Ignition is turned on</span>
                                        <p className="text-sm text-gray-300 mt-1">Electrical systems active - proceed to fuel leak inspection</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('ignition_status', 'ignition_off'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ignition_status === 'ignition_off'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.ignition_status === 'ignition_off' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.ignition_status === 'ignition_off' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔑 Ignition was turned off</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver may have shut down due to cutting out - assess restart capability</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('ignition_status', 'ignition_intermittent'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ignition_status === 'ignition_intermittent'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.ignition_status === 'ignition_intermittent' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.ignition_status === 'ignition_intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚡ Ignition cutting out intermittently</span>
                                        <p className="text-sm text-gray-300 mt-1">Electrical system fault - may cause fuel pump issues</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Vehicle Current Status</h3>
                        <p className="text-blue-300/80 text-sm mb-4">What is the current operational state of the vehicle?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('vehicle_status', 'engine_running'); onNext(); }}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'engine_running'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'engine_running' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'engine_running' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚛 Engine currently running</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle operational but experiencing issues</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('vehicle_status', 'engine_stopped'); onNext(); }}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'engine_stopped'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'engine_stopped' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'engine_stopped' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🛑 Engine has stopped</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle cut out and engine not running</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('vehicle_status', 'engine_cutting_out'); onNext(); }}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_status === 'engine_cutting_out'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_status === 'engine_cutting_out' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_status === 'engine_cutting_out' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚡ Engine cutting out repeatedly</span>
                                        <p className="text-sm text-gray-300 mt-1">Intermittent operation - losing power periodically</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.ignition_status || !responses.vehicle_status}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Fuel Inspection
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 SDC Step 2: Fuel Leak Inspection</h2>
                        <p className="text-gray-300">Critical visual inspection for fuel leaks following SDC safety procedures - fire prevention priority.</p>
                    </div>

                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <div className="flex items-start space-x-4">
                            <Flame className="w-8 h-8 text-red-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-3">🔥 CRITICAL FIRE PREVENTION PROTOCOL</h3>
                                <div className="text-red-300/90 space-y-2">
                                    <p className="font-semibold">SDC Guidance: If driver suspects fuel leak, visual inspection required when safe</p>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                        <h4 className="font-semibold text-red-200 mb-2">SDC Inspection Areas:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                            <li>Fuel tanks, hoses, and under the vehicle</li>
                                            <li>Strong smell of diesel</li>
                                            <li>Wet patches or visible drips</li>
                                            <li>Never inspect near ignition sources</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Fuel System Inspection Results</h3>
                        <p className="text-gray-300 text-sm mb-4">Has the driver inspected for fuel leaks and what were the findings?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('fuel_leak_status', 'no_leak_detected'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fuel_leak_status === 'no_leak_detected'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fuel_leak_status === 'no_leak_detected' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.fuel_leak_status === 'no_leak_detected' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No fuel leak detected</span>
                                        <p className="text-sm text-gray-300 mt-1">No visible fuel, wet patches, or strong diesel smell</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('fuel_leak_status', 'fuel_leak_identified'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fuel_leak_status === 'fuel_leak_identified'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fuel_leak_status === 'fuel_leak_identified' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.fuel_leak_status === 'fuel_leak_identified' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 FUEL LEAK IDENTIFIED</span>
                                        <p className="text-sm text-gray-300 mt-1">Visible fuel drips, wet patches, or strong diesel smell detected</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('fuel_leak_status', 'unable_to_inspect'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fuel_leak_status === 'unable_to_inspect'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fuel_leak_status === 'unable_to_inspect' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.fuel_leak_status === 'unable_to_inspect' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Unable to inspect safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Location or conditions prevent safe fuel system inspection</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Critical Fuel Leak Response */}
                    {responses.fuel_leak_status === 'fuel_leak_identified' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <XCircle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 EMERGENCY FUEL LEAK PROTOCOL</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC Mandatory Actions for Fuel Leak:</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ol className="list-decimal list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop the bus as soon as it is safe</li>
                                                <li>Turn off the engine to reduce fire risk</li>
                                                <li>Do not start or drive the bus again</li>
                                                <li>Off-board passengers immediately</li>
                                                <li>Await engineering assistance</li>
                                                <li>Use spill kits (if available) or sand to prevent spreading</li>
                                            </ol>
                                            <h4 className="font-semibold text-red-200 mb-2 mt-4">Additional Hazard Management:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>If fuel is pooling, contain with available materials</li>
                                                <li>If leak is severe, fire services may be required</li>
                                                <li>If bus stop or roadway affected, notify local authorities</li>
                                                <li>Environmental hazard requiring proper clean-up</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No leak - proceed to assessment */}
                    {responses.fuel_leak_status === 'no_leak_detected' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start space-x-4">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ No Fuel Leak Detected</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Proceed to Step 3 - Assess the Situation</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Next Assessment Phase:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Evaluate if this is first-time occurrence or persistent problem</li>
                                                <li>Determine appropriate response based on frequency</li>
                                                <li>Consider fuel system integrity without visible leaks</li>
                                            </ul>
                                        </div>
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
                            onClick={responses.fuel_leak_status === 'fuel_leak_identified' ? onComplete : onNext}
                            disabled={!responses.fuel_leak_status}
                            className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.fuel_leak_status === 'fuel_leak_identified' ? 'Complete Emergency Assessment' : 'Assess Situation'} 
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📊 SDC Step 3: Assess the Situation</h2>
                        <p className="text-gray-300">Determine if this is first-time occurrence or persistent problem to guide response.</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📈 Occurrence Pattern Assessment</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            SDC Guidance: First-time occurrence vs persistent problem determines the appropriate response level and urgency.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Cutting Out History</h3>
                        <p className="text-gray-300 text-sm mb-4">Is this the first time the vehicle has experienced cutting out/fuel problems, or has this happened before?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('occurrence_pattern', 'first_time'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.occurrence_pattern === 'first_time'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.occurrence_pattern === 'first_time' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.occurrence_pattern === 'first_time' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🆕 First-time occurrence</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Continue to convenient changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('occurrence_pattern', 'persistent_problem'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.occurrence_pattern === 'persistent_problem'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.occurrence_pattern === 'persistent_problem' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.occurrence_pattern === 'persistent_problem' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔄 Persistent problem</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: If continues to cut out, STOP and await engineering</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('occurrence_pattern', 'worsening_condition'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.occurrence_pattern === 'worsening_condition'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.occurrence_pattern === 'worsening_condition' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.occurrence_pattern === 'worsening_condition' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📈 Worsening condition</span>
                                        <p className="text-sm text-gray-300 mt-1">Multiple cut-outs during current shift - immediate attention needed</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('occurrence_pattern', 'unknown_history'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.occurrence_pattern === 'unknown_history'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.occurrence_pattern === 'unknown_history' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.occurrence_pattern === 'unknown_history' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Unknown history</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver unsure if this has happened before</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Current status check for persistent problems */}
                    {(responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <h3 className="text-lg font-semibold text-orange-200 mb-4">Current Cutting Out Status</h3>
                            <p className="text-orange-300/80 text-sm mb-4">Since initial contact, has the vehicle continued to cut out?</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('current_cutting_status', 'no_further_issues'); onNext(); }}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        responses.current_cutting_status === 'no_further_issues'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.current_cutting_status === 'no_further_issues' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.current_cutting_status === 'no_further_issues' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">✅ No further cutting out</span>
                                            <p className="text-sm text-gray-300 mt-1">Vehicle running normally since initial report</p>
                                        </div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('current_cutting_status', 'continued_cutting_out'); onNext(); }}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        responses.current_cutting_status === 'continued_cutting_out'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.current_cutting_status === 'continued_cutting_out' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.current_cutting_status === 'continued_cutting_out' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🚨 Vehicle continues to cut out</span>
                                            <p className="text-sm text-gray-300 mt-1">SDC: STOP in safe location and await engineering</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SDC Decision Logic Display */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">📋 SDC Assessment Summary</h3>
                        {responses.occurrence_pattern === 'first_time' && (
                            <div className="text-purple-300/90">
                                <p className="font-semibold text-green-300">✅ First-time Occurrence:</p>
                                <p className="text-sm">SDC Action: Advise driver to continue to convenient changeover point</p>
                            </div>
                        )}
                        {(responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && responses.current_cutting_status === 'no_further_issues' && (
                            <div className="text-purple-300/90">
                                <p className="font-semibold text-yellow-300">⚠️ Persistent Problem - Currently Stable:</p>
                                <p className="text-sm">SDC Action: Continue with caution, arrange changeover, monitor closely</p>
                            </div>
                        )}
                        {(responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && responses.current_cutting_status === 'continued_cutting_out' && (
                            <div className="text-purple-300/90">
                                <p className="font-semibold text-red-300">🛑 Persistent Problem - Still Cutting Out:</p>
                                <p className="text-sm">SDC Action: Driver must STOP in safe location and await engineering assistance</p>
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
                            disabled={!responses.occurrence_pattern || ((responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && !responses.current_cutting_status)}
                            className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Final Assessment <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            const hasOilLeak = responses.fuel_leak_status === 'fuel_leak_identified';
            const isPersistentAndContinuing = (responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && responses.current_cutting_status === 'continued_cutting_out';
            const isFirstTime = responses.occurrence_pattern === 'first_time';
            const isPersistentButStable = (responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && responses.current_cutting_status === 'no_further_issues';
            
            const needsImmediateStop = hasOilLeak || isPersistentAndContinuing;
            const needsChangeover = isPersistentButStable || responses.occurrence_pattern === 'unknown_history';
            const canContinueWithMonitoring = isFirstTime;

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Cutting Out/Fuel System Assessment Report</h2>
                        <p className="text-gray-300">Complete fuel system safety assessment with SDC-compliant decision and actions.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Ignition Status:</span>
                                <span className="text-white ml-2">{responses.ignition_status?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Vehicle Status:</span>
                                <span className="text-white ml-2">{responses.vehicle_status?.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Fuel Leak Check:</span>
                                <span className={`ml-2 ${hasOilLeak ? 'text-red-400' : 'text-green-400'}`}>
                                    {hasOilLeak ? '🚨 LEAK DETECTED' : '✅ No leak detected'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Occurrence Pattern:</span>
                                <span className="text-white ml-2">{responses.occurrence_pattern?.replace('_', ' ')}</span>
                            </div>
                            {(responses.occurrence_pattern === 'persistent_problem' || responses.occurrence_pattern === 'worsening_condition') && (
                                <div>
                                    <span className="text-gray-400">Current Status:</span>
                                    <span className="text-white ml-2">{responses.current_cutting_status?.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Final Decision */}
                    {needsImmediateStop && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛑</div>
                                <h3 className="text-2xl font-bold text-red-200 mb-2">STOP IMMEDIATELY - AWAIT ENGINEERING</h3>
                                <p className="text-red-300/90 text-sm mb-6">
                                    {hasOilLeak ? 'Fuel leak detected - immediate fire hazard' : 'Persistent cutting out continues - reliability failure'}
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-red-200 mb-3">Mandatory Immediate Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-red-300/90 text-sm">
                                        {hasOilLeak ? (
                                            <>
                                                <li>Stop the bus as soon as it is safe</li>
                                                <li>Turn off the engine to reduce fire risk</li>
                                                <li>Do NOT start or drive the bus again</li>
                                                <li>Off-board passengers immediately</li>
                                                <li>Use spill kits (if available) or sand to prevent spreading</li>
                                                <li>If fuel pooling, fire services may be required</li>
                                                <li>Notify local authorities if spill affects roadway</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>Stop the vehicle in a safe location immediately</li>
                                                <li>Do not attempt to continue service</li>
                                                <li>Contact engineering team for immediate assistance</li>
                                                <li>Arrange passenger transfer if vehicle was in service</li>
                                                <li>Vehicle reliability compromised - unsafe to continue</li>
                                                <li>Document all cutting out incidents for engineers</li>
                                            </>
                                        )}
                                        <li>Log as CRITICAL priority in Go-Check system</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {needsChangeover && !needsImmediateStop && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-orange-200 mb-2">ARRANGE CHANGEOVER AT EARLIEST OPPORTUNITY</h3>
                                <p className="text-orange-300/90 text-sm mb-6">
                                    Persistent fuel system issues require engineering attention
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-orange-200 mb-3">Required Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-orange-300/90 text-sm">
                                        <li>Vehicle may continue to next convenient changeover point</li>
                                        <li>Arrange replacement vehicle at earliest opportunity</li>
                                        <li>Monitor engine performance continuously</li>
                                        <li>If any further cutting out occurs, stop immediately</li>
                                        <li>Log defect in Go-Check with priority status</li>
                                        <li>Inform engineering of persistent fuel system issues</li>
                                        <li>Driver should not accept this vehicle again until repaired</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {canContinueWithMonitoring && !needsImmediateStop && !needsChangeover && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="text-center">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-green-200 mb-2">CONTINUE TO CHANGEOVER POINT</h3>
                                <p className="text-green-300/90 text-sm mb-6">
                                    First-time occurrence - continue with monitoring
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-green-200 mb-3">Monitoring Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-green-300/90 text-sm">
                                        <li>Continue to convenient changeover point</li>
                                        <li>Monitor engine performance closely</li>
                                        <li>If vehicle cuts out again, arrange immediate changeover</li>
                                        <li>Log the initial incident in Go-Check system</li>
                                        <li>Report for routine maintenance attention</li>
                                        <li>Driver should report any recurrence immediately</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Important Safety Reminders */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-bold text-blue-200 mb-3">🔔 Important Safety Reminders</h3>
                        <ul className="list-disc ml-6 space-y-1 text-blue-300/90 text-sm">
                            <li>Fuel system issues can develop rapidly from minor to critical</li>
                            <li>Any fuel leak poses immediate fire and explosion risk</li>
                            <li>Environmental contamination requires proper cleanup procedures</li>
                            <li>Persistent cutting out affects vehicle reliability and passenger safety</li>
                            <li>Always prioritise safety over service continuity</li>
                        </ul>
                    </div>

                    {/* Go-Check Reminder */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-purple-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-purple-200 mb-2">📱 Go-Check Documentation Required</h4>
                                <p className="text-purple-300/80 text-sm">
                                    Record this fuel system assessment in the Go-Check system immediately when vehicle is stationary and in a safe location. 
                                    Include details of any fuel leaks, cutting out frequency, and all safety actions taken.
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
window.CuttingOutFuelWizard = CuttingOutFuelWizard;

export default CuttingOutFuelWizard;