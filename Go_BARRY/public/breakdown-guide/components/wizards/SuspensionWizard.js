const SuspensionWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                                <window.Icons.AlertTriangle className="w-8 h-8 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Suspension System Assessment</h2>
                            <p className="text-gray-300">
                                We'll help you assess the suspension issue and determine if it's safe to continue driving.
                            </p>
                        </div>

                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                            <h3 className="text-amber-400 font-semibold mb-2 flex items-center">
                                <window.Icons.AlertTriangle className="w-5 h-5 mr-2" />
                                Vehicle Stability
                            </h3>
                            <p className="text-amber-200 text-sm">
                                Suspension problems can affect vehicle stability, ride quality, and passenger safety. Let's assess the situation carefully.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                            <h3 className="text-white font-semibold mb-4">Are there any warning lights relating to suspension on the dashboard?</h3>
                            <div className="space-y-3">
                                {[
                                    { value: 'red_warning', label: 'Yes - RED warning light(s)' },
                                    { value: 'amber_warning', label: 'Yes - AMBER warning light(s)' },
                                    { value: 'no_warning', label: 'No warning lights visible' },
                                    { value: 'unsure_warning', label: 'Unsure what the lights mean' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => updateResponse(1, option.value)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                                            responses[1] === option.value
                                                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className="font-medium">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={onNext}
                                disabled={!responses[1]}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                            <h2 className="text-2xl font-bold text-white mb-2">Physical Assessment</h2>
                            <p className="text-gray-300">
                                Let's check the physical condition of the vehicle.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Does the bus lean to one side or is one corner riding low or high?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'yes_lean', label: 'Yes - Bus is visibly leaning or uneven' },
                                        { value: 'no_lean', label: 'No - Bus appears level and normal' },
                                        { value: 'unsure_lean', label: 'Unsure - Difficult to tell' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateResponse(2, option.value)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                responses[2] === option.value
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                    : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Prior to the issue, was there an audible bang or loud escape of air?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'yes_bang', label: 'Yes - Heard a loud bang or air escape' },
                                        { value: 'no_bang', label: 'No - No unusual sounds noticed' },
                                        { value: 'unsure_bang', label: 'Unsure - May have heard something' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateResponse(3, option.value)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                responses[3] === option.value
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                    : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Is the air pressure within normal parameters?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'normal_pressure', label: 'Yes - Air pressure is normal' },
                                        { value: 'low_pressure', label: 'No - Air pressure is low' },
                                        { value: 'fails_build', label: 'Vehicle fails to build or hold air pressure' },
                                        { value: 'unsure_pressure', label: 'Unsure how to check air pressure' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateResponse(4, option.value)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                responses[4] === option.value
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                    : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={onPrevious}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses[2] || !responses[3] || !responses[4]}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                            <h2 className="text-2xl font-bold text-white mb-2">Ride Quality Assessment</h2>
                            <p className="text-gray-300">
                                Final questions about the vehicle's performance.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Is the ride quality acceptable or has the driver reported an excessively hard or soft ride?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'acceptable_ride', label: 'Ride quality is acceptable' },
                                        { value: 'hard_ride', label: 'Excessively hard/bumpy ride' },
                                        { value: 'soft_ride', label: 'Excessively soft/bouncy ride' },
                                        { value: 'unstable_ride', label: 'Vehicle feels unstable or difficult to control' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateResponse(5, option.value)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                responses[5] === option.value
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                    : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Any additional concerns about vehicle stability or handling?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'no_concerns', label: 'No additional concerns' },
                                        { value: 'steering_heavy', label: 'Steering feels heavy or unresponsive' },
                                        { value: 'vehicle_pulls', label: 'Vehicle pulls to one side' },
                                        { value: 'unusual_noises', label: 'Unusual noises when driving' },
                                        { value: 'multiple_issues', label: 'Multiple handling issues' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateResponse(6, option.value)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                responses[6] === option.value
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                                    : 'border-gray-600 bg-slate-800/30 text-gray-300 hover:border-gray-500 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={onPrevious}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses[5] || !responses[6]}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Get Guidance
                            </button>
                        </div>
                    </div>
                );

            case 4:
                // Determine action based on responses
                const warningLights = responses[1];
                const physicalLean = responses[2];
                const airLoss = responses[3];
                const airPressure = responses[4];
                const rideQuality = responses[5];
                const additionalConcerns = responses[6];

                // Determine if vehicle should stop immediately
                const shouldStop = warningLights === 'red_warning' ||
                                  physicalLean === 'yes_lean' ||
                                  airLoss === 'yes_bang' ||
                                  airPressure === 'fails_build' ||
                                  rideQuality === 'unstable_ride' ||
                                  additionalConcerns === 'multiple_issues';

                // Reset attempt recommended for certain conditions
                const resetRecommended = warningLights === 'amber_warning' ||
                                       airPressure === 'low_pressure' ||
                                       (rideQuality === 'hard_ride' || rideQuality === 'soft_ride');

                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Action Required</h2>
                            <p className="text-gray-300">
                                Based on your responses, here's what you need to do:
                            </p>
                        </div>

                        {shouldStop ? (
                            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
                                <h3 className="text-red-400 font-bold text-xl mb-4 flex items-center">
                                    <window.Icons.AlertTriangle className="w-6 h-6 mr-2" />
                                    STOP IMMEDIATELY
                                </h3>
                                <div className="space-y-4 text-red-200">
                                    <p className="font-semibold">You must stop the vehicle and await engineering assistance.</p>
                                    <div className="space-y-2">
                                        <p className="font-medium">Immediate Actions:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li>Stop the vehicle in a safe location as soon as possible</li>
                                            <li>Turn off the ignition</li>
                                            <li>Contact engineering immediately</li>
                                            <li>Do NOT attempt to continue driving</li>
                                            <li>Ensure passenger safety</li>
                                        </ul>
                                    </div>
                                    {physicalLean === 'yes_lean' && (
                                        <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                                            <p className="font-semibold">⚠️ Vehicle instability detected - Critical safety concern</p>
                                        </div>
                                    )}
                                    {airPressure === 'fails_build' && (
                                        <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                                            <p className="font-semibold">⚠️ Air system failure - Multiple systems affected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : resetRecommended ? (
                            <div className="space-y-4">
                                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
                                    <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center">
                                        <window.Icons.Settings className="w-6 h-6 mr-2" />
                                        TRY VEHICLE RESET FIRST
                                    </h3>
                                    <div className="space-y-4 text-blue-200">
                                        <p className="font-semibold">First, attempt a system reset:</p>
                                        <div className="space-y-2">
                                            <p className="font-medium">Reset Procedure:</p>
                                            <ol className="list-decimal list-inside space-y-1 ml-4">
                                                <li>Switch off the ignition completely</li>
                                                <li>Wait 30 seconds</li>
                                                <li>Restart the vehicle</li>
                                                <li>Check if warning lights clear</li>
                                                <li>Test the suspension system function</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4">
                                    <h4 className="text-amber-400 font-semibold mb-2">If Reset Clears the Issue:</h4>
                                    <p className="text-amber-200 text-sm">
                                        You may continue in service but record the incident in Go-Check and arrange for engineering assessment at depot.
                                    </p>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                    <h4 className="text-red-400 font-semibold mb-2">If Problem Persists:</h4>
                                    <p className="text-red-200 text-sm">
                                        Stop immediately and await engineering assistance.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6">
                                <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center">
                                    <window.Icons.CheckCircle className="w-6 h-6 mr-2" />
                                    CONTINUE WITH MONITORING
                                </h3>
                                <div className="space-y-4 text-green-200">
                                    <p className="font-semibold">Based on your assessment, you may continue in service.</p>
                                    <div className="space-y-2">
                                        <p className="font-medium">Instructions:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li>Continue to monitor suspension performance</li>
                                            <li>Record the issue in Go-Check when safe to do so</li>
                                            <li>Report to engineering for assessment at depot</li>
                                            <li>If any symptoms worsen, stop immediately and contact engineering</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                                <window.Icons.Info className="w-5 h-5 mr-2" />
                                Important Safety Notes
                            </h4>
                            <ul className="text-blue-200 text-sm space-y-1">
                                <li>• Suspension problems can affect vehicle stability and passenger safety</li>
                                <li>• Always prioritize safety over service continuity</li>
                                <li>• Air suspension systems are critical for proper vehicle operation</li>
                                <li>• If in doubt about safety, always choose to stop and seek assistance</li>
                            </ul>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={onPrevious}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={onNext}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Continue to Summary
                            </button>
                        </div>
                    </div>
                );

            case 5:
                const warningLights5 = responses[1];
                const shouldStop5 = warningLights5 === 'red_warning' ||
                                   responses[2] === 'yes_lean' ||
                                   responses[3] === 'yes_bang' ||
                                   responses[4] === 'fails_build' ||
                                   responses[5] === 'unstable_ride' ||
                                   responses[6] === 'multiple_issues';

                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <window.Icons.CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete</h2>
                            <p className="text-gray-300">
                                Summary of your suspension system assessment and next steps.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                            <h3 className="text-white font-semibold mb-3">Assessment Summary:</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><span className="font-medium">Warning Lights:</span> {
                                    {
                                        'red_warning': 'RED warning light(s) present',
                                        'amber_warning': 'AMBER warning light(s) present',
                                        'no_warning': 'No warning lights visible',
                                        'unsure_warning': 'Uncertain about warning lights'
                                    }[responses[1]]
                                }</p>
                                <p><span className="font-medium">Physical Condition:</span> {
                                    {
                                        'yes_lean': 'Vehicle is leaning or uneven',
                                        'no_lean': 'Vehicle appears level and normal',
                                        'unsure_lean': 'Uncertain about vehicle level'
                                    }[responses[2]]
                                }</p>
                                <p><span className="font-medium">Air System:</span> {
                                    {
                                        'normal_pressure': 'Air pressure normal',
                                        'low_pressure': 'Air pressure low',
                                        'fails_build': 'Fails to build/hold pressure',
                                        'unsure_pressure': 'Uncertain about air pressure'
                                    }[responses[4]]
                                }</p>
                                <p><span className="font-medium">Ride Quality:</span> {
                                    {
                                        'acceptable_ride': 'Acceptable ride quality',
                                        'hard_ride': 'Excessively hard/bumpy ride',
                                        'soft_ride': 'Excessively soft/bouncy ride',
                                        'unstable_ride': 'Vehicle feels unstable'
                                    }[responses[5]]
                                }</p>
                            </div>
                        </div>

                        <div className={`${shouldStop5 ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'} border rounded-lg p-6`}>
                            <h3 className={`${shouldStop5 ? 'text-red-400' : 'text-green-400'} font-bold text-lg mb-2`}>
                                Action Required: {shouldStop5 ? 'STOP IMMEDIATELY' : 'CONTINUE WITH MONITORING'}
                            </h3>
                            <p className={`${shouldStop5 ? 'text-red-200' : 'text-green-200'}`}>
                                {shouldStop5 
                                    ? 'Vehicle must be stopped and engineering contacted immediately due to suspension safety concerns.'
                                    : 'Vehicle may continue in service with monitoring and engineering assessment at depot.'}
                            </p>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                                <window.Icons.Clipboard className="w-5 h-5 mr-2" />
                                Required Actions
                            </h4>
                            <ul className="text-blue-200 text-sm space-y-1">
                                <li>• Record this assessment in Go-Check when stationary and safe</li>
                                <li>• Include details of any warning lights or physical observations</li>
                                <li>• Contact engineering for further guidance if needed</li>
                                <li>• Monitor vehicle behavior closely during continued operation</li>
                                <li>• Report any deterioration of symptoms immediately</li>
                            </ul>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={onPrevious}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={onComplete}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

    return (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Step {currentStep} of 5</span>
                    <span className="text-sm text-gray-400">Suspension Assessment</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>
            </div>
            {renderStep()}
        </div>
    );
};

// Export to global scope
window.SuspensionWizard = SuspensionWizard;