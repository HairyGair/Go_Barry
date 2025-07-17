const DemistersHeatersWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    switch (currentStep) {
        case 1:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🌡️ Demisters/Heaters Assessment</h2>
                        <p className="text-gray-600">Following SDC guidance for demister and heater issues - prioritizing driver vision and passenger comfort.</p>
                    </div>
                    
                    <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-800 mb-2">👁️ Driver Vision is Priority</h3>
                                <p className="text-red-700">If the driver's vision is affected by demisting issues, the vehicle must not continue in service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3">Initial Assessment</h3>
                            <p className="text-blue-700 text-sm mb-4">First, let's understand the nature of the problem and its impact on operations.</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="primary_issue"
                                        checked={responses.primary_issue === 'vision_affected'}
                                        onChange={() => updateResponse('primary_issue', 'vision_affected')}
                                        className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-red-600">🚨 Driver's vision is affected</span>
                                        <p className="text-sm text-gray-600 mt-1">Windscreen misting/fogging is impairing the driver's ability to see clearly</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="primary_issue"
                                        checked={responses.primary_issue === 'passenger_comfort'}
                                        onChange={() => updateResponse('primary_issue', 'passenger_comfort')}
                                        className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-600">❄️ Passenger comfort issue (cold bus)</span>
                                        <p className="text-sm text-gray-600 mt-1">Vision is clear but passengers are experiencing cold conditions</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="primary_issue"
                                        checked={responses.primary_issue === 'both_issues'}
                                        onChange={() => updateResponse('primary_issue', 'both_issues')}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <span className="font-medium text-orange-600">⚠️ Both vision and comfort affected</span>
                                        <p className="text-sm text-gray-600 mt-1">Driver experiencing vision problems AND passengers are cold</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3">Vehicle Warm-Up Status</h3>
                            <p className="text-green-700 text-sm mb-4">Has the vehicle been in service long enough to warm up properly?</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="warm_up_time"
                                        checked={responses.warm_up_time === 'more_than_hour'}
                                        onChange={() => updateResponse('warm_up_time', 'more_than_hour')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">✅ More than 1 hour in service</span>
                                        <p className="text-sm text-gray-600 mt-1">Vehicle has had adequate time to warm up</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="warm_up_time"
                                        checked={responses.warm_up_time === 'less_than_hour'}
                                        onChange={() => updateResponse('warm_up_time', 'less_than_hour')}
                                        className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-600">⏱️ Less than 1 hour in service</span>
                                        <p className="text-sm text-gray-600 mt-1">Vehicle may still be warming up - normal for cold conditions initially</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="warm_up_time"
                                        checked={responses.warm_up_time === 'just_started'}
                                        onChange={() => updateResponse('warm_up_time', 'just_started')}
                                        className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-blue-600">🚌 Just started service</span>
                                        <p className="text-sm text-gray-600 mt-1">Vehicle has just left depot - still in initial warm-up phase</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h3 className="font-semibold text-purple-900 mb-3">Current Weather Conditions</h3>
                            <p className="text-purple-700 text-sm mb-4">What are the current weather conditions?</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="weather_conditions"
                                        checked={responses.weather_conditions === 'cold_wet'}
                                        onChange={() => updateResponse('weather_conditions', 'cold_wet')}
                                        className="mt-1 mr-3 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="font-medium text-purple-600">🌧️ Cold and wet conditions</span>
                                        <p className="text-sm text-gray-600 mt-1">Rain/snow causing increased demisting demand</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="weather_conditions"
                                        checked={responses.weather_conditions === 'cold_dry'}
                                        onChange={() => updateResponse('weather_conditions', 'cold_dry')}
                                        className="mt-1 mr-3 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="font-medium text-purple-600">❄️ Cold but dry conditions</span>
                                        <p className="text-sm text-gray-600 mt-1">Low temperature but minimal moisture</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="weather_conditions"
                                        checked={responses.weather_conditions === 'mild'}
                                        onChange={() => updateResponse('weather_conditions', 'mild')}
                                        className="mt-1 mr-3 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="font-medium text-purple-600">☁️ Mild conditions</span>
                                        <p className="text-sm text-gray-600 mt-1">Temperature above 10°C, normal conditions</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {responses.primary_issue === 'vision_affected' && (
                            <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-800 mb-3">🚨 VISION AFFECTED - SAFETY CRITICAL</h3>
                                        <div className="text-red-700 space-y-2">
                                            <p className="font-semibold">Driver's vision is compromised - this is a safety-critical issue</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-red-800 mb-2">Immediate Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    <li>Vehicle must not continue if vision remains impaired</li>
                                                    <li>Attempt to clear windscreen at safe location</li>
                                                    <li>If unable to resolve, arrange immediate changeover</li>
                                                    <li>Do not compromise on safety</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <div></div>
                        <button
                            onClick={onNext}
                            disabled={!responses.primary_issue || !responses.warm_up_time || !responses.weather_conditions}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Continue to Demister Check<ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">💨 Demister Functionality Check</h2>
                        <p className="text-gray-600">Let's check the demister system operation to identify the specific issue.</p>
                    </div>
                    
                    {responses.primary_issue === 'vision_affected' && (
                        <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">🚨 Vision Safety Check in Progress</h3>
                                    <p className="text-red-700">Remember: If vision cannot be restored, the vehicle must not continue.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3">Demister Air Flow Check</h3>
                            <p className="text-blue-700 text-sm mb-4">Ask the driver: "Are the demisters blowing any air at all?"</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="demister_blowing"
                                        checked={responses.demister_blowing === 'blowing_normally'}
                                        onChange={() => updateResponse('demister_blowing', 'blowing_normally')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">✅ Yes - Blowing air normally</span>
                                        <p className="text-sm text-gray-600 mt-1">Air flow is present from demister vents</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="demister_blowing"
                                        checked={responses.demister_blowing === 'weak_flow'}
                                        onChange={() => updateResponse('demister_blowing', 'weak_flow')}
                                        className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-600">⚠️ Weak air flow</span>
                                        <p className="text-sm text-gray-600 mt-1">Some air coming through but noticeably weak</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="demister_blowing"
                                        checked={responses.demister_blowing === 'not_blowing'}
                                        onChange={() => updateResponse('demister_blowing', 'not_blowing')}
                                        className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-red-600">❌ No - Not blowing at all</span>
                                        <p className="text-sm text-gray-600 mt-1">No air flow from demister vents</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {(responses.demister_blowing === 'not_blowing' || responses.demister_blowing === 'weak_flow') && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-900 mb-3">Blockage Check</h3>
                                <p className="text-yellow-700 text-sm mb-4">Ask the driver to check for blockages (bags, newspapers, etc.) near the demister vents.</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="blockage_check"
                                            checked={responses.blockage_check === 'blockage_found'}
                                            onChange={() => updateResponse('blockage_check', 'blockage_found')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">🛍️ Blockage found and cleared</span>
                                            <p className="text-sm text-gray-600 mt-1">Obstruction removed, demisters now working</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="blockage_check"
                                            checked={responses.blockage_check === 'no_blockage'}
                                            onChange={() => updateResponse('blockage_check', 'no_blockage')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">✖️ No blockage found</span>
                                            <p className="text-sm text-gray-600 mt-1">System fault - not a simple obstruction</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {responses.demister_blowing === 'blowing_normally' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h3 className="font-semibold text-orange-900 mb-3">Air Temperature Check</h3>
                                <p className="text-orange-700 text-sm mb-4">Is the air coming from the demisters warm or cold?</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="air_temperature"
                                            checked={responses.air_temperature === 'warm_air'}
                                            onChange={() => updateResponse('air_temperature', 'warm_air')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">🔥 Warm/hot air</span>
                                            <p className="text-sm text-gray-600 mt-1">Heating system working correctly</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="air_temperature"
                                            checked={responses.air_temperature === 'cold_air_only'}
                                            onChange={() => updateResponse('air_temperature', 'cold_air_only')}
                                            className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="font-medium text-blue-600">❄️ Cold air only</span>
                                            <p className="text-sm text-gray-600 mt-1">No heating - blowing ambient temperature air</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6">
                        <div className="bg-gray-100 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">💡 Troubleshooting Tips</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Fan speed selector working? Try different speeds</li>
                                <li>• Temperature control responding? Adjust to maximum heat</li>
                                <li>• Recirculation mode? Try fresh air mode for better demisting</li>
                                <li>• A/C button on? This can help with demisting in some vehicles</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-4 h-4 mr-1" />Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.demister_blowing || 
                                    (responses.demister_blowing !== 'blowing_normally' && !responses.blockage_check) ||
                                    (responses.demister_blowing === 'blowing_normally' && !responses.air_temperature)}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {responses.air_temperature === 'cold_air_only' ? 'Continue to Temperature Check' : 'Continue to Decision'}<ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            // Temperature check step - only shown if cold air only
            if (responses.air_temperature === 'cold_air_only') {
                return (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">🌡️ Saloon Temperature Assessment</h2>
                            <p className="text-gray-600">SDC guidance: 16°C is the threshold for passenger comfort requirements.</p>
                        </div>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-800 mb-2">📏 16°C Temperature Rule</h3>
                                    <p className="text-blue-700">Below 16°C requires changeover as soon as possible. Above 16°C can continue until replacement available.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h3 className="font-semibold text-orange-900 mb-3">Current Saloon Temperature</h3>
                                <p className="text-orange-700 text-sm mb-4">Ask the driver to check the saloon temperature gauge or use a thermometer if available.</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="saloon_temperature"
                                            checked={responses.saloon_temperature === 'above_16'}
                                            onChange={() => updateResponse('saloon_temperature', 'above_16')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ 16°C or above</span>
                                            <p className="text-sm text-gray-600 mt-1">Temperature meets minimum comfort requirement</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="saloon_temperature"
                                            checked={responses.saloon_temperature === 'below_16'}
                                            onChange={() => updateResponse('saloon_temperature', 'below_16')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">❄️ Below 16°C</span>
                                            <p className="text-sm text-gray-600 mt-1">Temperature below minimum requirement - changeover needed ASAP</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="saloon_temperature"
                                            checked={responses.saloon_temperature === 'no_gauge'}
                                            onChange={() => updateResponse('saloon_temperature', 'no_gauge')}
                                            className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                        />
                                        <div>
                                            <span className="font-medium text-yellow-600">🤷 Unable to determine temperature</span>
                                            <p className="text-sm text-gray-600 mt-1">No gauge available - assess based on driver/passenger feedback</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            {responses.saloon_temperature === 'below_16' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-900 mb-3">Engineering Check Frequency</h3>
                                    <p className="text-red-700 text-sm mb-4">If immediate changeover isn't possible, engineering must be checked hourly for vehicle availability.</p>
                                    <div className="bg-white rounded p-3 mt-3">
                                        <p className="text-sm text-red-700">
                                            <strong>Important:</strong> Check with engineering at least once per hour to ascertain when the vehicle can be changed. Keep the driver informed of expected changeover time.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {responses.warm_up_time === 'less_than_hour' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-yellow-900 mb-2">⏱️ Consider Warm-Up Time</h3>
                                    <p className="text-yellow-700 text-sm">
                                        Vehicle has been in service less than 1 hour. Temperature may improve as the engine warms up fully. 
                                        Monitor the situation but prepare for changeover if temperature doesn't improve.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                                <ArrowLeft className="w-4 h-4 mr-1" />Previous
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses.saloon_temperature}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue to Decision<ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                );
            } else {
                // Skip to step 4 if not cold air only
                return <DemistersHeatersWizard {...{ currentStep: 4, responses, updateResponse, onNext, onPrevious, onComplete }} />;
            }

        case 4:
            // Decision step
            const getDecision = () => {
                // Vision affected - immediate action
                if (responses.primary_issue === 'vision_affected' || responses.primary_issue === 'both_issues') {
                    if (responses.demister_blowing === 'not_blowing' && responses.blockage_check === 'no_blockage') {
                        return 'stop_vision';
                    }
                    if (responses.demister_blowing === 'blowing_normally' && responses.air_temperature === 'warm_air') {
                        return 'continue_monitor_vision';
                    }
                    return 'changeover_urgent_vision';
                }
                
                // Comfort only issues
                if (responses.demister_blowing === 'not_blowing' && responses.blockage_check === 'no_blockage') {
                    return 'changeover_convenient';
                }
                
                if (responses.air_temperature === 'cold_air_only') {
                    if (responses.saloon_temperature === 'below_16') {
                        return 'changeover_asap';
                    } else {
                        return 'continue_until_replacement';
                    }
                }
                
                if (responses.blockage_check === 'blockage_found') {
                    return 'resolved_continue';
                }
                
                return 'continue_monitor';
            };

            const decision = getDecision();

            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📋 Decision & Actions</h2>
                        <p className="text-gray-600">Based on the assessment, here's the recommended course of action.</p>
                    </div>

                    {decision === 'stop_vision' && (
                        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-800 mb-3">🛑 STOP - Vision Compromised</h3>
                                    <div className="text-red-700 space-y-2">
                                        <p className="font-semibold">Demisters not working and driver's vision is affected.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-700">
                                                <li>Vehicle must not continue in service</li>
                                                <li>Pull over at next safe location</li>
                                                <li>Arrange immediate replacement vehicle</li>
                                                <li>Contact engineering for attendance</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'changeover_urgent_vision' && (
                        <div className="border-2 border-orange-500 bg-orange-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-orange-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-800 mb-3">⚠️ URGENT CHANGEOVER - Vision Issues</h3>
                                    <div className="text-orange-700 space-y-2">
                                        <p className="font-semibold">Driver's vision affected but partially manageable.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-orange-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-700">
                                                <li>Proceed to nearest changeover point only</li>
                                                <li>Driver to use manual clearing methods if safe</li>
                                                <li>No passenger pick-ups if vision compromised</li>
                                                <li>Arrange immediate changeover</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'changeover_asap' && (
                        <div className="border-2 border-yellow-500 bg-yellow-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-yellow-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-yellow-800 mb-3">❄️ CHANGEOVER ASAP - Below 16°C</h3>
                                    <div className="text-yellow-700 space-y-2">
                                        <p className="font-semibold">Saloon temperature below minimum requirement.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-yellow-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                <li>Continue in service temporarily</li>
                                                <li>Arrange changeover as soon as possible</li>
                                                <li>Check with engineering hourly for vehicle availability</li>
                                                <li>Keep driver informed of changeover timing</li>
                                                <li>Record defect on Go-Check immediately</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'changeover_convenient' && (
                        <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-800 mb-3">🔄 CHANGEOVER AT CONVENIENCE</h3>
                                    <div className="text-blue-700 space-y-2">
                                        <p className="font-semibold">Demisters not working but vision not affected.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-blue-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                                <li>Continue to nearest changeover point</li>
                                                <li>Monitor for any vision issues developing</li>
                                                <li>Arrange replacement when available</li>
                                                <li>Record defect on Go-Check</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'continue_until_replacement' && (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-800 mb-3">✅ CONTINUE - Non-Urgent Changeover</h3>
                                    <div className="text-green-700 space-y-2">
                                        <p className="font-semibold">Temperature above 16°C - meets minimum requirement.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-green-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-700">
                                                <li>Continue in service</li>
                                                <li>Changeover when replacement available</li>
                                                <li>No urgency but plan for repair</li>
                                                <li>Record defect on Go-Check</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'resolved_continue' && (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-800 mb-3">✅ RESOLVED - Continue Service</h3>
                                    <div className="text-green-700 space-y-2">
                                        <p className="font-semibold">Blockage cleared - demisters now working.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-green-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-700">
                                                <li>Continue normal service</li>
                                                <li>Monitor demister operation</li>
                                                <li>Note incident in daily report</li>
                                                <li>No further action required</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision === 'continue_monitor_vision' && (
                        <div className="border-2 border-yellow-500 bg-yellow-50 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-yellow-600 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-yellow-800 mb-3">👁️ CONTINUE WITH CAUTION</h3>
                                    <div className="text-yellow-700 space-y-2">
                                        <p className="font-semibold">Demisters working but vision was affected - monitor closely.</p>
                                        <div className="bg-white rounded p-4 mt-4">
                                            <h4 className="font-semibold text-yellow-800 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                <li>Continue if vision now clear</li>
                                                <li>Stop immediately if vision deteriorates</li>
                                                <li>Keep demisters on maximum</li>
                                                <li>Plan precautionary changeover</li>
                                                <li>Record issue on Go-Check</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-100 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-2">📝 Summary of Key Points</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• <strong>Vision affected:</strong> {responses.primary_issue === 'vision_affected' || responses.primary_issue === 'both_issues' ? 'Yes' : 'No'}</li>
                            <li>• <strong>Demisters status:</strong> {
                                responses.demister_blowing === 'not_blowing' ? 'Not working' :
                                responses.demister_blowing === 'weak_flow' ? 'Weak flow' : 'Working'
                            }</li>
                            {responses.air_temperature && (
                                <li>• <strong>Air temperature:</strong> {responses.air_temperature === 'cold_air_only' ? 'Cold only' : 'Warm/hot'}</li>
                            )}
                            {responses.saloon_temperature && (
                                <li>• <strong>Saloon temperature:</strong> {
                                    responses.saloon_temperature === 'above_16' ? 'Above 16°C' :
                                    responses.saloon_temperature === 'below_16' ? 'Below 16°C' : 'Unknown'
                                }</li>
                            )}
                            <li>• <strong>Time in service:</strong> {
                                responses.warm_up_time === 'more_than_hour' ? 'More than 1 hour' :
                                responses.warm_up_time === 'less_than_hour' ? 'Less than 1 hour' : 'Just started'
                            }</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">💾 Record Keeping</h4>
                        <p className="text-blue-700 text-sm">
                            Ensure all defects are recorded immediately on the Go-Check System when the bus is stationary and in a safe location. 
                            If the situation seems unreasonable or persists, report to the relevant Depot Manager for further investigation.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-4 h-4 mr-1" />Previous
                        </button>
                        <button
                            onClick={() => onComplete({
                                decision: decision,
                                ...responses
                            })}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Complete Assessment<CheckCircle className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        default:
            return null;
    }
};
