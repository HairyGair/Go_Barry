import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const InteriorLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    switch (currentStep) {
        case 1:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔦 Interior Lights Assessment</h2>
                        <p className="text-gray-600">Following SDC guidance for interior lighting issues - 50% illumination rule and step light requirements.</p>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mb-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">🌆 Darkness Operations Priority</h3>
                                <p className="text-yellow-700">Interior lighting is especially critical during hours of darkness for passenger safety and emergency egress.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3">Operating Conditions Assessment</h3>
                            <p className="text-blue-700 text-sm mb-4">First, let's determine the current operating conditions and urgency.</p>
                            <div className="space-y-3">
                                {[
                                    { value: 'daylight_hours', icon: '☀️', label: 'Daylight hours', desc: 'Currently operating during daylight with good natural visibility', color: 'blue' },
                                    { value: 'approaching_darkness', icon: '🌆', label: 'Approaching hours of darkness', desc: 'Evening/dawn hours - will be dark soon, changeover needed before darkness', color: 'orange' },
                                    { value: 'hours_of_darkness', icon: '🌃', label: 'Currently operating in darkness', desc: 'Night time operations - interior lighting critical for passenger safety', color: 'red' },
                                    { value: 'poor_visibility', icon: '🌫️', label: 'Poor visibility conditions', desc: 'Fog, heavy rain, or overcast conditions reducing natural light', color: 'purple' }
                                ].map((option) => (
                                    <label key={option.value} className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="operating_conditions"
                                            checked={responses.operating_conditions === option.value}
                                            onChange={() => updateResponse('operating_conditions', option.value)}
                                            className={`mt-1 mr-3 h-4 w-4 text-${option.color}-600 border-gray-300 focus:ring-${option.color}-500`}
                                        />
                                        <div>
                                            <span className={`font-medium text-${option.color}-600`}>{option.icon} {option.label}</span>
                                            <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3">Vehicle Type Information</h3>
                            <p className="text-green-700 text-sm mb-4">What type of vehicle are we assessing?</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'single_deck'}
                                        onChange={() => updateResponse('vehicle_type', 'single_deck')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">🚌 Single deck bus</span>
                                        <p className="text-sm text-gray-600 mt-1">One deck - assess interior lights on single level</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'double_deck'}
                                        onChange={() => updateResponse('vehicle_type', 'double_deck')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">🚍 Double deck bus</span>
                                        <p className="text-sm text-gray-600 mt-1">Two decks - need to assess lighting on both upper and lower deck</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onNext}
                            disabled={!responses.operating_conditions || !responses.vehicle_type}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔦 50% Illumination Rule Check</h2>
                        <p className="text-gray-600">SDC Guide requires at least 50% of interior lights to be operational for service.</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-3">Assessment Question</h3>
                        <p className="text-blue-700 mb-4">Are 50% or more of the interior lights working?</p>
                        
                        <div className="space-y-3">
                            <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="fifty_percent"
                                    checked={responses.fifty_percent_rule === 'yes'}
                                    onChange={() => updateResponse('fifty_percent_rule', 'yes')}
                                    className="mt-1 mr-3 h-4 w-4 text-green-600"
                                />
                                <div>
                                    <span className="font-medium text-green-600">✅ Yes - 50% or more working</span>
                                    <p className="text-sm text-gray-600 mt-1">Meets minimum SDC requirement</p>
                                </div>
                            </label>
                            <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="fifty_percent"
                                    checked={responses.fifty_percent_rule === 'no'}
                                    onChange={() => updateResponse('fifty_percent_rule', 'no')}
                                    className="mt-1 mr-3 h-4 w-4 text-red-600"
                                />
                                <div>
                                    <span className="font-medium text-red-600">❌ No - Less than 50% working</span>
                                    <p className="text-sm text-gray-600 mt-1">Below SDC minimum requirement</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.fifty_percent_rule}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🚪 Step Light Functionality</h2>
                        <p className="text-gray-600">Step lights are critical for passenger safety when boarding/alighting.</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-3">Step Light Check</h3>
                        <p className="text-blue-700 mb-4">Is the step light (entrance light) working?</p>
                        
                        <div className="space-y-3">
                            <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="step_light"
                                    checked={responses.step_light_function === 'yes'}
                                    onChange={() => updateResponse('step_light_function', 'yes')}
                                    className="mt-1 mr-3 h-4 w-4 text-green-600"
                                />
                                <div>
                                    <span className="font-medium text-green-600">✅ Yes - Step light working</span>
                                    <p className="text-sm text-gray-600 mt-1">Safe for passenger boarding/alighting</p>
                                </div>
                            </label>
                            <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="step_light"
                                    checked={responses.step_light_function === 'no'}
                                    onChange={() => updateResponse('step_light_function', 'no')}
                                    className="mt-1 mr-3 h-4 w-4 text-red-600"
                                />
                                <div>
                                    <span className="font-medium text-red-600">❌ No - Step light not working</span>
                                    <p className="text-sm text-gray-600 mt-1">Safety risk for passengers in darkness</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onComplete}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return null;
    }
};

export default InteriorLightsWizard;