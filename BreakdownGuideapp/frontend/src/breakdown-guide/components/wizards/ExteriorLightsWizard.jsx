import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Exterior Lights Wizard Component - Following standard operational safety checks Section 35
// Includes specific requirements for headlights, indicators, and brake lights

const ExteriorLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚦 Exterior Lights Assessment</h2>
                        <p className="text-gray-300">Following standard operational safety checks Section 35 - Critical lighting safety systems.</p>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🚨 CRITICAL SAFETY SYSTEMS</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Exterior lighting defects can result in immediate vehicle prohibition and serious safety risks to passengers and other road users.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Operational Standard 35 Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>ANY defective indicator = STOP and await engineering</li>
                                <li>Headlights: Operating in darkness on unrestricted road with defect = STOP</li>
                                <li>Brake lights: Both low-level lights not working = STOP</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Current Operating Conditions</h3>
                        <p className="text-gray-300 text-sm mb-4">What are the current lighting and visibility conditions?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('lighting_conditions', 'daylight'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lighting_conditions === 'daylight'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lighting_conditions === 'daylight' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.lighting_conditions === 'daylight' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">☀️ Daylight hours</span>
                                        <p className="text-sm text-gray-300 mt-1">Good natural light - headlights not required</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('lighting_conditions', 'darkness'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lighting_conditions === 'darkness'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lighting_conditions === 'darkness' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.lighting_conditions === 'darkness' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌃 Hours of darkness</span>
                                        <p className="text-sm text-gray-300 mt-1">Full lighting required - headlights mandatory</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('lighting_conditions', 'poor_visibility'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lighting_conditions === 'poor_visibility'
                                        ? 'border-gray-400 bg-gray-400/20 text-gray-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-gray-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lighting_conditions === 'poor_visibility' ? 'border-gray-400 bg-gray-400' : 'border-white/50'
                                    }`}>
                                        {responses.lighting_conditions === 'poor_visibility' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌫️ Poor visibility</span>
                                        <p className="text-sm text-gray-300 mt-1">Fog, heavy rain, or overcast - lights required</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {(responses.lighting_conditions === 'darkness' || responses.lighting_conditions === 'poor_visibility') && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">Road Type Assessment</h3>
                            <p className="text-gray-300 text-sm mb-4">What type of road is the vehicle currently operating on?</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('road_type', 'unrestricted'); onNext(); }}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        responses.road_type === 'unrestricted'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.road_type === 'unrestricted' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.road_type === 'unrestricted' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🛣️ Unrestricted road (A-roads, dual carriageways)</span>
                                            <p className="text-sm text-gray-300 mt-1">Higher speeds - full lighting critical</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { updateResponse('road_type', 'restricted'); onNext(); }}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        responses.road_type === 'restricted'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            responses.road_type === 'restricted' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.road_type === 'restricted' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🏘️ Restricted road (30mph zones, residential)</span>
                                            <p className="text-sm text-gray-300 mt-1">Lower speeds - some flexibility allowed</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.lighting_conditions || ((responses.lighting_conditions === 'darkness' || responses.lighting_conditions === 'poor_visibility') && !responses.road_type)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        <h2 className="text-2xl font-bold text-white mb-2">💡 Lighting System Inspection</h2>
                        <p className="text-gray-300">Systematic check of all exterior lighting systems per operational requirements.</p>
                    </div>
                    
                    {/* Headlight Assessment */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">🔦 Headlight Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Check both main beam and dipped beam headlights. For LED units, check if less than 50% of elements are illuminated.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('headlights', 'both_working'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.headlights === 'both_working'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.headlights === 'both_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.headlights === 'both_working' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Both headlights working correctly</span>
                                        <p className="text-sm text-gray-300 mt-1">All elements illuminated, no issues detected</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('headlights', 'defective'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.headlights === 'defective'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.headlights === 'defective' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.headlights === 'defective' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Headlight defect detected</span>
                                        <p className="text-sm text-gray-300 mt-1">One or more headlights not working or less than 50% illuminated</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Indicator Assessment */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">🔄 Direction Indicator Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Check ALL indicators including front, rear, and side repeaters. Test both left and right operation.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('indicators', 'all_working'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.indicators === 'all_working'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.indicators === 'all_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.indicators === 'all_working' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ All indicators working correctly</span>
                                        <p className="text-sm text-gray-300 mt-1">Front, rear, and side repeaters all functional</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('indicators', 'defective'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.indicators === 'defective'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.indicators === 'defective' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.indicators === 'defective' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ One or more indicators not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Any defective indicator or side repeater</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Brake Light Assessment */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">🚦 Brake Light Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Test brake lights by asking driver to press brake pedal. Check low-level brake lights specifically.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('brake_lights', 'all_working'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.brake_lights === 'all_working'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.brake_lights === 'all_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.brake_lights === 'all_working' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ All brake lights working normally</span>
                                        <p className="text-sm text-gray-300 mt-1">All brake lights illuminate properly when pedal pressed</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('brake_lights', 'one_not_working'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.brake_lights === 'one_not_working'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.brake_lights === 'one_not_working' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.brake_lights === 'one_not_working' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ One brake light not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Single brake light failure - others still functional</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('brake_lights', 'both_low_level_failed'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.brake_lights === 'both_low_level_failed'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.brake_lights === 'both_low_level_failed' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.brake_lights === 'both_low_level_failed' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Both low-level brake lights not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical failure - main brake light system affected</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { updateResponse('brake_lights', 'constantly_on'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.brake_lights === 'constantly_on'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.brake_lights === 'constantly_on' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.brake_lights === 'constantly_on' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Brake lights constantly illuminated</span>
                                        <p className="text-sm text-gray-300 mt-1">Lights stay on permanently - confusing to other drivers</p>
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
                            disabled={!responses.headlights || !responses.indicators || !responses.brake_lights}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Safety Decision <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            // Operational Standard 35 - Exact decision logic
            const needsImmediateStop = responses.indicators === 'defective' || // ANY indicator defect = STOP
                                     responses.brake_lights === 'both_low_level_failed' || // Both low-level brake lights = STOP
                                     responses.brake_lights === 'constantly_on' || // Constantly on = STOP
                                     (responses.lighting_conditions === 'darkness' && responses.headlights === 'defective' && responses.road_type === 'unrestricted'); // <50% headlights in darkness on unrestricted road = STOP
            
            const needsChangeoverBeforeDarkness = responses.headlights === 'defective' && responses.lighting_conditions === 'daylight';
            const canContinueWithCaution = !needsImmediateStop && !needsChangeoverBeforeDarkness && responses.brake_lights === 'one_not_working';
            const canContinueNormally = !needsImmediateStop && !needsChangeoverBeforeDarkness && !canContinueWithCaution;

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className={`mx-auto w-16 h-16 ${needsImmediateStop ? 'bg-red-500/20' : needsChangeoverBeforeDarkness ? 'bg-orange-500/20' : canContinueWithCaution ? 'bg-yellow-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                            {needsImmediateStop ? <XCircle className="w-8 h-8 text-red-400" /> : 
                             needsChangeoverBeforeDarkness ? <AlertTriangle className="w-8 h-8 text-orange-400" /> :
                             canContinueWithCaution ? <AlertTriangle className="w-8 h-8 text-yellow-400" /> :
                             <CheckCircle className="w-8 h-8 text-green-400" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Exterior Lights Safety Decision</h2>
                        <p className="text-gray-300">Operational safety assessment based on current lighting defects.</p>
                    </div>

                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Lighting Conditions:</span>
                                <span className="text-white ml-2">{responses.lighting_conditions}</span>
                            </div>
                            {responses.road_type && (
                                <div>
                                    <span className="text-gray-400">Road Type:</span>
                                    <span className="text-white ml-2">{responses.road_type}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-400">Headlights:</span>
                                <span className={`ml-2 ${responses.headlights === 'both_working' ? 'text-green-400' : 'text-red-400'}`}>
                                    {responses.headlights === 'both_working' ? '✅ Working' : '❌ Defective'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Indicators:</span>
                                <span className={`ml-2 ${responses.indicators === 'all_working' ? 'text-green-400' : 'text-red-400'}`}>
                                    {responses.indicators === 'all_working' ? '✅ All working' : '❌ Defective'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Brake Lights:</span>
                                <span className={`ml-2 ${responses.brake_lights === 'all_working' ? 'text-green-400' : 
                                                      responses.brake_lights === 'one_not_working' ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {responses.brake_lights === 'all_working' ? '✅ All working' : 
                                     responses.brake_lights === 'one_not_working' ? '⚠️ One faulty' : '❌ Critical failure'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Decision-specific instructions */}
                    {needsImmediateStop && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <XCircle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 STOP IMMEDIATELY - AWAIT ENGINEERING</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Critical lighting system failure detected per Operational Standard 35</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Critical Issues Identified:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {responses.indicators === 'defective' && <li>Defective direction indicators (ANY indicator defect = STOP)</li>}
                                                {responses.brake_lights === 'both_low_level_failed' && <li>Both low-level brake lights not working</li>}
                                                {responses.brake_lights === 'constantly_on' && <li>Brake lights constantly illuminated</li>}
                                                {responses.lighting_conditions === 'darkness' && responses.headlights === 'defective' && responses.road_type === 'unrestricted' && <li>Headlight defect during darkness on unrestricted road</li>}
                                            </ul>
                                            <h4 className="font-semibold text-red-200 mb-2 mt-4">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Driver must stop vehicle safely immediately</li>
                                                <li>Do NOT continue in service under any circumstances</li>
                                                <li>Contact engineering team for immediate attendance</li>
                                                <li>High risk of DVSA prohibition if found operating</li>
                                                <li>Record defects on their handheld device with CRITICAL priority</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {needsChangeoverBeforeDarkness && !needsImmediateStop && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-orange-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">⚠️ CHANGEOVER BEFORE DARKNESS</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">Headlight defect requires changeover before hours of darkness</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Vehicle may continue during daylight hours only</li>
                                                <li>Arrange changeover before darkness falls</li>
                                                <li>Monitor time and plan route accordingly</li>
                                                <li>If darkness approaches before changeover, stop and await assistance</li>
                                                <li>Record the defect on their handheld device</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {canContinueWithCaution && !needsImmediateStop && !needsChangeoverBeforeDarkness && (
                        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-yellow-200 mb-3">⚠️ CONTINUE - ARRANGE CHANGEOVER</h3>
                                    <div className="text-yellow-300/90 space-y-2">
                                        <p className="font-semibold">Minor lighting defect - changeover required but not critical</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-yellow-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                                                <li>Vehicle may continue to next convenient changeover point</li>
                                                <li>Arrange changeover at earliest opportunity</li>
                                                <li>Monitor remaining brake lights closely</li>
                                                <li>If any additional lights fail, stop immediately</li>
                                                <li>Record the defect on their handheld device</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {canContinueNormally && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start space-x-4">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">All critical lighting systems are functional</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Ongoing Monitoring:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue normal service operations</li>
                                                <li>Monitor all lighting systems during operation</li>
                                                <li>Report any new lighting issues immediately</li>
                                                <li>Include lighting check in next routine maintenance</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Important Reminders */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-bold text-blue-200 mb-3">🔔 Important Safety Reminders</h3>
                        <ul className="list-disc ml-6 space-y-1 text-blue-300/90 text-sm">
                            <li>Exterior lighting is essential for road safety and legal compliance</li>
                            <li>DVSA can issue immediate prohibitions for lighting defects</li>
                            <li>Weather conditions can affect lighting requirements</li>
                            <li>Driver must report any new lighting issues immediately</li>
                        </ul>
                    </div>

                    {/* Recording Reminder */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-purple-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-purple-200 mb-2">📱 Defect Documentation Required</h4>
                                <p className="text-purple-300/80 text-sm">
                                    Record this lighting assessment in the reporting device immediately when vehicle is stationary and in a safe location. 
                                    Include details of all lighting systems checked and any defects found.
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
window.ExteriorLightsWizard = ExteriorLightsWizard;
export default ExteriorLightsWizard;
