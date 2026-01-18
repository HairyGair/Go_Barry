import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Wipers/Screenwash Wizard Component
// Follows operational safety procedures - Section 30

const WipersScreenwashWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Wind, Tool } = Icons;
    
    const handleCompleteAssessment = () => {
        let finalDecision = 'CONTINUE';
        let notes = 'Wipers/Screenwash assessment completed per standard operational procedures. ';
        
        // Critical safety check - vision impairment
        if (responses.vision_impaired === 'yes') {
            finalDecision = 'STOP';
            notes += 'Driver vision impaired by wiper/screenwash defect. Vehicle must stop immediately and await engineering assistance. ';
        } else {
            // Assess urgency level based on conditions
            const isUrgent = responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads';
            
            if (isUrgent) {
                finalDecision = 'AMBER';
                notes += 'Priority changeover required - ';
                
                if (responses.weather_conditions === 'heavy_rain') {
                    notes += 'Heavy rain/snow conditions detected. ';
                }
                if (responses.route_type === 'major_roads') {
                    notes += 'Operating on major roads (A19, A1M). ';
                }
                
                notes += 'Arrange urgent changeover at next convenient location. ';
            } else {
                finalDecision = 'AMBER';
                notes += 'Standard changeover required - continue to next convenient changeover point. ';
            }
            
            // Add specific defect details
            if (responses.blade_missing === 'yes') {
                notes += 'Wiper blade/arm missing. ';
            }
            if (responses.wipers_moving === 'no') {
                notes += 'Wipers not moving. ';
            }
            if (responses.motor_sound === 'no') {
                notes += 'Wiper motor silent. ';
            }
            if (responses.washers_working === 'no' || responses.washers_working === 'inadequate') {
                notes += `Washers ${responses.washers_working}. `;
            }
            
            notes += 'Monitor conditions closely - stop immediately if vision becomes impaired. Record defect on their handheld device.';
        }
        
        onComplete(finalDecision, notes);
    };
    
    const renderStep = () => {
        switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Wind className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Wipers/Screenwash Assessment</h2>
                                <p className="text-slate-300">Step 1 of 4: Initial System Check</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2">System Status Questions</h3>
                                <p className="text-blue-200/80 text-sm">Please answer the following questions about the wiper/screenwash system</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-3">Is the whole blade or arm missing?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.blade_missing === 'yes'
                                                    ? 'bg-red-500/20 border-red-400 text-red-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('blade_missing', 'yes')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <XCircle className="w-5 h-5" />
                                                <span>Yes - Missing</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.blade_missing === 'no'
                                                    ? 'bg-green-500/20 border-green-400 text-green-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('blade_missing', 'no')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>No - Present</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-3">Which side of the windscreen is affected?</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.affected_side === 'driver'
                                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('affected_side', 'driver')}
                                        >
                                            <span>Driver Side</span>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.affected_side === 'passenger'
                                                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('affected_side', 'passenger')}
                                        >
                                            <span>Passenger Side</span>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.affected_side === 'both'
                                                    ? 'bg-red-500/20 border-red-400 text-red-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('affected_side', 'both')}
                                        >
                                            <span>Both Sides</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-3">Are the wipers moving at all?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.wipers_moving === 'yes'
                                                    ? 'bg-green-500/20 border-green-400 text-green-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('wipers_moving', 'yes')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Yes - Moving</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.wipers_moving === 'no'
                                                    ? 'bg-red-500/20 border-red-400 text-red-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('wipers_moving', 'no')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <XCircle className="w-5 h-5" />
                                                <span>No - Not Moving</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-3">Can you hear the wiper motor whirring?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.motor_sound === 'yes'
                                                    ? 'bg-green-500/20 border-green-400 text-green-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('motor_sound', 'yes')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Yes - Motor Sound</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.motor_sound === 'no'
                                                    ? 'bg-red-500/20 border-red-400 text-red-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('motor_sound', 'no')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <XCircle className="w-5 h-5" />
                                                <span>No - Silent</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            disabled={currentStep === 1}
                            className="flex items-center px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.blade_missing || !responses.affected_side || !responses.wipers_moving || !responses.motor_sound}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Vision Impact Assessment</h2>
                                <p className="text-slate-300">Step 2 of 4: Safety Critical Evaluation</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-red-300 mb-2 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Critical Safety Assessment
                                </h3>
                                <p className="text-red-200/80 text-sm">Driver vision is the highest priority for safety</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-3">Is the driver's vision impaired by this issue?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.vision_impaired === 'yes'
                                                    ? 'bg-red-500/20 border-red-400 text-red-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('vision_impaired', 'yes')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span>Yes - Vision Impaired</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`p-4 rounded-lg border transition-all ${
                                                responses.vision_impaired === 'no'
                                                    ? 'bg-green-500/20 border-green-400 text-green-300'
                                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            onClick={() => updateResponse('vision_impaired', 'no')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>No - Vision Clear</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {responses.vision_impaired === 'no' && (
                                    <>
                                        <div>
                                            <label className="block text-white font-medium mb-3">What are the current weather conditions?</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.weather_conditions === 'clear'
                                                            ? 'bg-green-500/20 border-green-400 text-green-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('weather_conditions', 'clear')}
                                                >
                                                    <span>Clear/Dry</span>
                                                </button>
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.weather_conditions === 'light_rain'
                                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('weather_conditions', 'light_rain')}
                                                >
                                                    <span>Light Rain</span>
                                                </button>
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.weather_conditions === 'heavy_rain'
                                                            ? 'bg-red-500/20 border-red-400 text-red-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('weather_conditions', 'heavy_rain')}
                                                >
                                                    <span>Heavy Rain/Snow</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-white font-medium mb-3">What type of route are you operating on?</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.route_type === 'major_roads'
                                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('route_type', 'major_roads')}
                                                >
                                                    <div className="text-center">
                                                        <div className="font-medium">Major Roads</div>
                                                        <div className="text-sm text-slate-400">A19, A1M, etc.</div>
                                                    </div>
                                                </button>
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.route_type === 'local_roads'
                                                            ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('route_type', 'local_roads')}
                                                >
                                                    <div className="text-center">
                                                        <div className="font-medium">Local Roads</div>
                                                        <div className="text-sm text-slate-400">City/town streets</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-white font-medium mb-3">Are the windscreen washers working?</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.washers_working === 'yes'
                                                            ? 'bg-green-500/20 border-green-400 text-green-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('washers_working', 'yes')}
                                                >
                                                    <span>Working</span>
                                                </button>
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.washers_working === 'inadequate'
                                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('washers_working', 'inadequate')}
                                                >
                                                    <span>Inadequate</span>
                                                </button>
                                                <button
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        responses.washers_working === 'no'
                                                            ? 'bg-red-500/20 border-red-400 text-red-300'
                                                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                                                    }`}
                                                    onClick={() => updateResponse('washers_working', 'no')}
                                                >
                                                    <span>Not Working</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {responses.vision_impaired === 'yes' && (
                                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <AlertTriangle className="w-6 h-6 text-red-400" />
                                            <h3 className="text-lg font-bold text-red-300">IMMEDIATE ACTION REQUIRED</h3>
                                        </div>
                                        <p className="text-red-200 mb-4">
                                            Vision impairment is a safety-critical issue. The vehicle must stop immediately.
                                        </p>
                                        <div className="bg-red-800/50 rounded-lg p-4">
                                            <p className="text-red-100 text-sm font-medium">
                                                ⚠️ STOP the vehicle immediately and await engineering assistance
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.vision_impaired || (responses.vision_impaired === 'no' && (!responses.weather_conditions || !responses.route_type || !responses.washers_working))}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <Tool className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Safety Decision & Actions</h2>
                                <p className="text-slate-300">Step 3 of 4: Recommended Actions</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {responses.vision_impaired === 'yes' ? (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle className="w-8 h-8 text-red-400" />
                                        <h3 className="text-xl font-bold text-red-300">CRITICAL: STOP IMMEDIATELY</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-red-200">
                                            Vision impairment detected. Vehicle must not continue in service.
                                        </p>
                                        <div className="bg-red-800/50 rounded-lg p-4">
                                            <h4 className="font-bold text-red-100 mb-2">Immediate Actions:</h4>
                                            <ul className="space-y-1 text-red-200 text-sm">
                                                <li>• Stop the vehicle in a safe location immediately</li>
                                                <li>• Do not continue in service</li>
                                                <li>• Contact engineering for immediate assistance</li>
                                                <li>• Wait for engineering or replacement vehicle</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Urgency Assessment */}
                                    <div className={`border rounded-lg p-6 ${
                                        responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                            ? 'bg-amber-900/20 border-amber-500/30'
                                            : 'bg-blue-900/20 border-blue-500/30'
                                    }`}>
                                        <h3 className={`text-lg font-bold mb-3 ${
                                            responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                                ? 'text-amber-300'
                                                : 'text-blue-300'
                                        }`}>
                                            {responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                                ? 'HIGH PRIORITY CHANGEOVER'
                                                : 'STANDARD CHANGEOVER'}
                                        </h3>
                                        <p className={`mb-4 ${
                                            responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                                ? 'text-amber-200'
                                                : 'text-blue-200'
                                        }`}>
                                            {responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                                ? 'Urgent changeover required due to weather conditions or major road operation'
                                                : 'Standard changeover procedure applies'}
                                        </p>
                                        
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-white">Recommended Actions:</h4>
                                            <ul className="space-y-2 text-sm">
                                                {responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads' ? (
                                                    <>
                                                        <li className="flex items-center gap-2 text-amber-200">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span>Arrange priority changeover at next convenient location</span>
                                                        </li>
                                                        <li className="flex items-center gap-2 text-amber-200">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span>Monitor weather conditions closely</span>
                                                        </li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li className="flex items-center gap-2 text-blue-200">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Continue to next convenient changeover point</span>
                                                        </li>
                                                        <li className="flex items-center gap-2 text-blue-200">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Normal changeover scheduling applies</span>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Temporary Measures */}
                                    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-white mb-3">Temporary Measures (If Safe)</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-medium text-slate-200 mb-2">Windscreen Cleaning:</h4>
                                                <ul className="space-y-1 text-slate-300 text-sm">
                                                    <li>• Clean windscreen manually at a safe location if conditions allow</li>
                                                    <li>• Only attempt if vehicle can be safely stopped</li>
                                                    <li>• Do not exit vehicle in unsafe traffic conditions</li>
                                                </ul>
                                            </div>
                                            {responses.washers_working === 'inadequate' && (
                                                <div>
                                                    <h4 className="font-medium text-slate-200 mb-2">Washer System:</h4>
                                                    <ul className="space-y-1 text-slate-300 text-sm">
                                                        <li>• Arrange washer system top-up at convenient location</li>
                                                        <li>• Check washer reservoir levels when safe</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
                                <p className="text-slate-300">Step 4 of 4: Final Instructions & Documentation</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Assessment Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Blade/Arm Status:</span>
                                        <span className="text-white ml-2">{responses.blade_missing === 'yes' ? 'Missing' : 'Present'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Affected Side:</span>
                                        <span className="text-white ml-2 capitalize">{responses.affected_side?.replace('_', ' ')}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Vision Impact:</span>
                                        <span className={`ml-2 ${responses.vision_impaired === 'yes' ? 'text-red-300' : 'text-green-300'}`}>
                                            {responses.vision_impaired === 'yes' ? 'Impaired' : 'Clear'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Weather:</span>
                                        <span className="text-white ml-2 capitalize">{responses.weather_conditions?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Items */}
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-blue-300 mb-4">Required Actions</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-400 text-xs font-bold">1</span>
                                        </div>
                                        <div>
                                            <p className="text-blue-200 font-medium">Record Defect on their handheld device</p>
                                            <p className="text-blue-300/80 text-sm mt-1">
                                                Log this wiper/screenwash defect when the bus is stationary and in a safe location
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-400 text-xs font-bold">2</span>
                                        </div>
                                        <div>
                                            <p className="text-blue-200 font-medium">Arrange Changeover</p>
                                            <p className="text-blue-300/80 text-sm mt-1">
                                                {responses.vision_impaired === 'yes' 
                                                    ? 'Immediate engineering assistance required - do not continue'
                                                    : responses.weather_conditions === 'heavy_rain' || responses.route_type === 'major_roads'
                                                    ? 'Priority changeover at next convenient location'
                                                    : 'Standard changeover at next convenient point'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-400 text-xs font-bold">3</span>
                                        </div>
                                        <div>
                                            <p className="text-blue-200 font-medium">Monitor Safety</p>
                                            <p className="text-blue-300/80 text-sm mt-1">
                                                Continue to monitor driver vision and stop immediately if conditions worsen
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Safety Reminder */}
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Shield className="w-6 h-6 text-red-400" />
                                    <h3 className="text-lg font-bold text-red-300">Safety Reminder</h3>
                                </div>
                                <p className="text-red-200/80 text-sm">
                                    If at any point the driver's vision becomes impaired or conditions worsen, 
                                    stop the vehicle immediately and seek engineering assistance. Safety is non-negotiable.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={() => handleCompleteAssessment()}
                            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
        }
    };
    
    return (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Step {currentStep} of 4</span>
                    <span className="text-sm text-gray-400">Wipers/Screenwash Assessment</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    ></div>
                </div>
            </div>
            {renderStep()}
        </div>
    );
};

// CRITICAL: Export to global scope
window.WipersScreenwashWizard = WipersScreenwashWizard;

export default WipersScreenwashWizard;
