import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Interior Lights Wizard Component
// Uses icons and constants from common components

const InteriorLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔦 Interior Lights Assessment</h2>
                        <p className="text-gray-300">Following standard operational safety checks guidance for interior lighting issues - 50% illumination rule and step light requirements.</p>
                    </div>
                    
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">🌆 Darkness Operations Priority</h3>
                        <p className="text-yellow-300/80 text-sm leading-relaxed">
                            Interior lighting is especially critical during hours of darkness for passenger safety and emergency egress.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Operating Conditions Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">First, let's determine the current operating conditions and urgency.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('operating_conditions', 'daylight_hours'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_conditions === 'daylight_hours'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_conditions === 'daylight_hours' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_conditions === 'daylight_hours' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">☀️ Daylight hours</span>
                                        <p className="text-sm text-gray-300 mt-1">Currently operating during daylight with good natural visibility</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('operating_conditions', 'approaching_darkness'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_conditions === 'approaching_darkness'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_conditions === 'approaching_darkness' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_conditions === 'approaching_darkness' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌆 Approaching hours of darkness</span>
                                        <p className="text-sm text-gray-300 mt-1">Evening/dawn hours - will be dark soon, changeover needed before darkness</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('operating_conditions', 'hours_of_darkness'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_conditions === 'hours_of_darkness'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_conditions === 'hours_of_darkness' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_conditions === 'hours_of_darkness' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌃 Currently operating in darkness</span>
                                        <p className="text-sm text-gray-300 mt-1">Night time operations - interior lighting critical for passenger safety</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('operating_conditions', 'poor_visibility'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.operating_conditions === 'poor_visibility'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.operating_conditions === 'poor_visibility' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.operating_conditions === 'poor_visibility' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌫️ Poor visibility conditions</span>
                                        <p className="text-sm text-gray-300 mt-1">Fog, heavy rain, or overcast conditions reducing natural light</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Type Information</h3>
                        <p className="text-gray-300 text-sm mb-4">What type of vehicle are we assessing?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('vehicle_type', 'single_deck'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_type === 'single_deck'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_type === 'single_deck' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_type === 'single_deck' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Single deck bus</span>
                                        <p className="text-sm text-gray-300 mt-1">One deck - assess interior lights on single level</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('vehicle_type', 'double_deck'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_type === 'double_deck'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_type === 'double_deck' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_type === 'double_deck' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚍 Double deck bus</span>
                                        <p className="text-sm text-gray-300 mt-1">Two decks - need to assess lighting on both upper and lower deck</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.operating_conditions === 'hours_of_darkness' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🌃 DARKNESS OPERATIONS - URGENT CHANGEOVER</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Operating during hours of darkness with lighting defects requires immediate changeover</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Priority Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Arrange changeover as soon as possible</li>
                                                <li>Assess lighting compliance before proceeding</li>
                                                <li>Passenger safety is paramount in darkness</li>
                                                <li>Emergency egress lighting must be functional</li>
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
                            disabled={!responses.operating_conditions || !responses.vehicle_type}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Lighting Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">💡 50% Illumination Rule Assessment</h2>
                        <p className="text-gray-300">Apply the Operational 50% rule: at least 50% of lights on each deck must be illuminated (at least one side working).</p>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📏 50% Rule Explained</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            For each deck, at least 50% of interior lights must be working. This typically means at least one side (left or right) of the lighting system must be functional.
                        </p>
                    </div>

                    {responses.vehicle_type === 'single_deck' ? (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">Single Deck Lighting Assessment</h3>
                            <p className="text-gray-300 text-sm mb-4">Assess the interior lighting throughout the passenger saloon.</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => { updateResponse('deck_lighting', 'more_than_50_percent'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.deck_lighting === 'more_than_50_percent'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.deck_lighting === 'more_than_50_percent' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.deck_lighting === 'more_than_50_percent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">✅ More than 50% of lights working</span>
                                            <p className="text-sm text-gray-300 mt-1">Majority of interior lights functional - meets minimum requirement</p>
                                        </div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('deck_lighting', 'exactly_50_percent'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.deck_lighting === 'exactly_50_percent'
                                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.deck_lighting === 'exactly_50_percent' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                        }`}>
                                            {responses.deck_lighting === 'exactly_50_percent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">⚠️ Approximately 50% of lights working</span>
                                            <p className="text-sm text-gray-300 mt-1">Just meets minimum requirement - borderline acceptable</p>
                                        </div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('deck_lighting', 'less_than_50_percent'); onNext(); }}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.deck_lighting === 'less_than_50_percent'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.deck_lighting === 'less_than_50_percent' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                        }`}>
                                            {responses.deck_lighting === 'less_than_50_percent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">❌ Less than 50% of lights working</span>
                                            <p className="text-sm text-gray-300 mt-1">Fails minimum requirement - changeover required</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4">Lower Deck Lighting Assessment</h3>
                                <p className="text-gray-300 text-sm mb-4">Assess the interior lighting on the lower deck passenger area.</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { updateResponse('lower_deck_lighting', 'more_than_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lower_deck_lighting === 'more_than_50_percent'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">✅ Lower deck: More than 50% working</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => { updateResponse('lower_deck_lighting', 'exactly_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lower_deck_lighting === 'exactly_50_percent'
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">⚠️ Lower deck: Approximately 50% working</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => { updateResponse('lower_deck_lighting', 'less_than_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lower_deck_lighting === 'less_than_50_percent'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">❌ Lower deck: Less than 50% working</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4">Upper Deck Lighting Assessment</h3>
                                <p className="text-gray-300 text-sm mb-4">Assess the interior lighting on the upper deck passenger area.</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { updateResponse('upper_deck_lighting', 'more_than_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.upper_deck_lighting === 'more_than_50_percent'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">✅ Upper deck: More than 50% working</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => { updateResponse('upper_deck_lighting', 'exactly_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.upper_deck_lighting === 'exactly_50_percent'
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">⚠️ Upper deck: Approximately 50% working</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => { updateResponse('upper_deck_lighting', 'less_than_50_percent'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.upper_deck_lighting === 'less_than_50_percent'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">❌ Upper deck: Less than 50% working</span>
                                    </button>
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
                            disabled={responses.vehicle_type === 'single_deck' ? !responses.deck_lighting : (!responses.lower_deck_lighting || !responses.upper_deck_lighting)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Step Light Check
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
                        <h2 className="text-2xl font-bold text-white mb-2">🚪 Step Light Functionality Check</h2>
                        <p className="text-gray-300">Critical safety requirement: step light must work when doors are open for passenger safety.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Step Light Safety Critical</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            Step light illumination when doors open is essential for passenger safety, especially in darkness or poor visibility.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step Light Operation Test</h3>
                        <p className="text-gray-300 text-sm mb-4">Ask the driver: "Please test the step light by opening and closing the doors. Does the step light illuminate when the doors are open?"</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('step_light_function', 'working_correctly'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_function === 'working_correctly'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_function === 'working_correctly' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_function === 'working_correctly' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Step light working correctly</span>
                                        <p className="text-sm text-gray-300 mt-1">Step light illuminates properly when doors are opened</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('step_light_function', 'not_working'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_function === 'not_working'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_function === 'not_working' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_function === 'not_working' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Step light not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Step light does not illuminate when doors are opened</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('step_light_function', 'intermittent'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_function === 'intermittent'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_function === 'intermittent' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_function === 'intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Step light intermittent</span>
                                        <p className="text-sm text-gray-300 mt-1">Step light works sometimes but not consistently</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => { updateResponse('step_light_function', 'no_step_light'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_function === 'no_step_light'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_function === 'no_step_light' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_function === 'no_step_light' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">ℹ️ Vehicle has no step light fitted</span>
                                        <p className="text-sm text-gray-300 mt-1">This vehicle type/model is not equipped with step lighting</p>
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
                            disabled={!responses.step_light_function}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Decision
                        </button>
                    </div>
                </div>
            );

        case 4:
            const checkFiftyPercentRule = () => {
                if (responses.vehicle_type === 'single_deck') {
                    return responses.deck_lighting === 'more_than_50_percent' || responses.deck_lighting === 'exactly_50_percent';
                } else {
                    const lowerDeckOk = responses.lower_deck_lighting === 'more_than_50_percent' || responses.lower_deck_lighting === 'exactly_50_percent';
                    const upperDeckOk = responses.upper_deck_lighting === 'more_than_50_percent' || responses.upper_deck_lighting === 'exactly_50_percent';
                    return lowerDeckOk && upperDeckOk;
                }
            };

            const fiftyPercentPassed = checkFiftyPercentRule();
            const stepLightOk = responses.step_light_function === 'working_correctly' || responses.step_light_function === 'no_step_light';
            
            const canContinueService = fiftyPercentPassed && stepLightOk;
            const needsChangeover = !fiftyPercentPassed || !stepLightOk || responses.operating_conditions === 'hours_of_darkness';

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Interior Lights Assessment Decision</h2>
                        <p className="text-gray-300">Based on your assessment responses, here is the recommended action:</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-300">Operating Conditions:</span> 
                                <span className="text-white ml-2">{responses.operating_conditions?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Vehicle Type:</span> 
                                <span className="text-white ml-2">{responses.vehicle_type?.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">50% Rule Status:</span> 
                                <span className={`ml-2 ${fiftyPercentPassed ? 'text-green-400' : 'text-red-400'}`}>
                                    {fiftyPercentPassed ? '✅ Passed' : '❌ Failed'}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Step Light Status:</span>
                                <span className={`ml-2 ${stepLightOk ? 'text-green-400' : 'text-red-400'}`}>
                                    {stepLightOk ? '✅ OK' : '❌ Fault'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {canContinueService && responses.operating_conditions !== 'hours_of_darkness' ? (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle meets minimum lighting requirements and can continue in service</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Record defect details in Go-Check system</li>
                                                <li>Monitor lighting functionality throughout shift</li>
                                                <li>Report for workshop attention at next opportunity</li>
                                                <li>Maintain awareness of lighting status</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 CHANGEOVER REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle does not meet minimum lighting requirements</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Reasons for Changeover:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {!fiftyPercentPassed && <li>Less than 50% of interior lights working</li>}
                                                {!stepLightOk && <li>Step light not functioning correctly</li>}
                                                {responses.operating_conditions === 'hours_of_darkness' && <li>Operating during hours of darkness with lighting defects</li>}
                                            </ul>
                                            <h4 className="font-semibold text-red-200 mb-2 mt-4">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Arrange immediate changeover</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Do not continue in service</li>
                                                <li>Ensure passenger safety during changeover</li>
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
                                <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Log this incident in Go-Check system when stationary and in a safe location
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
            return <div>Unknown step</div>;
    }
};

// Export to global scope for use in the main application
window.InteriorLightsWizard = InteriorLightsWizard;

export default InteriorLightsWizard;
