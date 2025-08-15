// Suspension Wizard Component
// Follows SDC Guide Section 34 - Suspension

const SuspensionWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Tool } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🏗️ Suspension System Assessment</h2>
                        <p className="text-gray-300">Following SDC guidance for suspension issues - we'll start with the required reset procedure.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Safety Priority</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            If the driver has any concerns about continuing, escalate the issue to engineering immediately. Suspension problems can affect vehicle stability and passenger safety.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step 1: Vehicle Reset Procedure</h3>
                        <p className="text-gray-300 text-sm mb-4">According to SDC guidance, the first step is to perform a complete vehicle reset to see if this clears the suspension fault.</p>
                        
                        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30 mb-4">
                            <h4 className="font-semibold text-blue-200 mb-2">Reset Instructions for Driver:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-blue-300/90 text-sm">
                                <li>Switch off the ignition completely</li>
                                <li>Wait 30 seconds</li>
                                <li>Re-start the vehicle normally</li>
                                <li>Check if suspension warning lights have cleared</li>
                                <li>Test suspension operation if applicable</li>
                            </ol>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('reset_result', 'cleared')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.reset_result === 'cleared'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.reset_result === 'cleared' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.reset_result === 'cleared' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Reset successful - issue cleared</span>
                                        <p className="text-sm text-gray-300 mt-1">Warning lights cleared and suspension working normally</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('reset_result', 'persists')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.reset_result === 'persists'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.reset_result === 'persists' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.reset_result === 'persists' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Problem persists after reset</span>
                                        <p className="text-sm text-gray-300 mt-1">Warning lights still present or suspension still faulty</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('reset_result', 'unable')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.reset_result === 'unable'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.reset_result === 'unable' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.reset_result === 'unable' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Unable to perform reset safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver cannot safely restart or location inappropriate</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.reset_result}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            // If reset cleared the issue, go to success. If not, continue with detailed assessment
            if (responses.reset_result === 'cleared') {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">✅ Reset Successful</h2>
                            <p className="text-gray-300">The vehicle reset has cleared the suspension issue. You may continue in service.</p>
                        </div>
                        
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">CONTINUE IN SERVICE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle reset has cleared the suspension fault</p>
                                        <p className="text-sm">The suspension system appears to be functioning normally after the reset procedure.</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue in service normally</li>
                                                <li>Record the incident in Go-Check system when stationary and safe</li>
                                                <li>Monitor suspension performance during continued operation</li>
                                                <li>Arrange engineering assessment at depot if issue recurs</li>
                                                <li>If any suspension problems return, follow this assessment again</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-6 h-6 text-blue-400 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-blue-200">Important Reminders</h4>
                                    <ul className="text-sm text-blue-300/90 mt-1 space-y-1">
                                        <li>• Record this reset and outcome in Go-Check system</li>
                                        <li>• Continue monitoring suspension performance</li>
                                        <li>• If symptoms return, stop and seek engineering assistance</li>
                                        <li>• Ensure passenger comfort and safety at all times</li>
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
            }

            // If reset didn't work or unable to reset, continue with detailed assessment
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Detailed Suspension Assessment</h2>
                        <p className="text-gray-300">Since the reset didn't resolve the issue, we need to assess the severity and determine next steps.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Suspension Warning Lights Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Are there any warning lights relating to suspension on the dashboard? Are they red or amber?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('warning_lights', 'red')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_lights === 'red'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_lights === 'red' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_lights === 'red' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔴 RED warning lights visible</span>
                                        <p className="text-sm text-gray-300 mt-1">Critical suspension system warning present</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('warning_lights', 'amber')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_lights === 'amber'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_lights === 'amber' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_lights === 'amber' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🟡 AMBER warning lights visible</span>
                                        <p className="text-sm text-gray-300 mt-1">Non-critical suspension system warning</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('warning_lights', 'none')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_lights === 'none'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_lights === 'none' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_lights === 'none' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚫ No warning lights visible</span>
                                        <p className="text-sm text-gray-300 mt-1">No dashboard warnings relating to suspension</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('warning_lights', 'unsure')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warning_lights === 'unsure'
                                        ? 'border-gray-400 bg-gray-400/20 text-gray-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-gray-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warning_lights === 'unsure' ? 'border-gray-400 bg-gray-400' : 'border-white/50'
                                    }`}>
                                        {responses.warning_lights === 'unsure' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Unsure about warning lights</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver cannot identify or understand warning lights</p>
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
                            disabled={!responses.warning_lights}
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
                        <h2 className="text-2xl font-bold text-white mb-2">📐 Physical Vehicle Assessment</h2>
                        <p className="text-gray-300">Let's check the physical condition and stability of the vehicle.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Stability Check</h3>
                        <p className="text-gray-300 text-sm mb-4">Does the bus lean to one side or another, or is one corner of the bus riding low or high?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_lean', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_lean === 'yes'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium">❌ Yes - Bus is visibly leaning or one corner riding abnormally</span>
                                <p className="text-sm text-gray-300 mt-1">Vehicle not level, clear lean to one side or corner problems</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('vehicle_lean', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_lean === 'no'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ No - Bus appears level and stable</span>
                                <p className="text-sm text-gray-300 mt-1">Vehicle sitting normally with no visible lean or corner issues</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('vehicle_lean', 'unsure')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_lean === 'unsure'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">⚠️ Unsure - Difficult to assess visually</span>
                                <p className="text-sm text-gray-300 mt-1">Cannot clearly determine if vehicle is level</p>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Prior Incident Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Prior to the issue, was there an audible bang or loud escape of air?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('audible_bang', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.audible_bang === 'yes'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium">❌ Yes - Heard loud bang or sudden air escape</span>
                                <p className="text-sm text-gray-300 mt-1">Indicates possible suspension component failure</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('audible_bang', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.audible_bang === 'no'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ No - No unusual sounds noticed</span>
                                <p className="text-sm text-gray-300 mt-1">No evidence of sudden component failure</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('audible_bang', 'unsure')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.audible_bang === 'unsure'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">⚠️ Unsure - May have heard something</span>
                                <p className="text-sm text-gray-300 mt-1">Driver uncertain about sounds heard</p>
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
                            disabled={!responses.vehicle_lean || !responses.audible_bang}
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
                            <AlertTriangle className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔧 Air System & Ride Quality</h2>
                        <p className="text-gray-300">Final assessment of air pressure and ride characteristics.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Air Pressure Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Is the air pressure within normal parameters or does the vehicle fail to build or hold air pressure?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('air_pressure', 'normal')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.air_pressure === 'normal'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ Air pressure within normal parameters</span>
                                <p className="text-sm text-gray-300 mt-1">System building and holding pressure correctly</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('air_pressure', 'low')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.air_pressure === 'low'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">⚠️ Air pressure lower than normal</span>
                                <p className="text-sm text-gray-300 mt-1">System building pressure but below normal levels</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('air_pressure', 'failing')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.air_pressure === 'failing'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium">❌ Vehicle fails to build or hold air pressure</span>
                                <p className="text-sm text-gray-300 mt-1">Air system not functioning properly</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('air_pressure', 'unsure')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.air_pressure === 'unsure'
                                        ? 'border-gray-400 bg-gray-400/20 text-gray-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-gray-400/50'
                                }`}
                            >
                                <span className="font-medium">❓ Unsure about air pressure status</span>
                                <p className="text-sm text-gray-300 mt-1">Driver cannot assess air pressure parameters</p>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Ride Quality Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">Is the ride quality acceptable or has the driver reported an excessively hard or soft ride?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('ride_quality', 'acceptable')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ride_quality === 'acceptable'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ Ride quality is acceptable</span>
                                <p className="text-sm text-gray-300 mt-1">Normal suspension operation and comfort</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('ride_quality', 'hard')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ride_quality === 'hard'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">⚠️ Excessively hard or bumpy ride</span>
                                <p className="text-sm text-gray-300 mt-1">Suspension too firm, poor comfort</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('ride_quality', 'soft')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ride_quality === 'soft'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">⚠️ Excessively soft or bouncy ride</span>
                                <p className="text-sm text-gray-300 mt-1">Suspension too soft, poor stability</p>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('ride_quality', 'unstable')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.ride_quality === 'unstable'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium">❌ Vehicle feels unstable or difficult to control</span>
                                <p className="text-sm text-gray-300 mt-1">Safety concern - handling compromised</p>
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
                            disabled={!responses.air_pressure || !responses.ride_quality}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Get Decision
                        </button>
                    </div>
                </div>
            );

        case 5:
            // Decision logic based on SDC guide and responses
            const generateDecision = () => {
                // Critical conditions requiring immediate stop
                if (responses.warning_lights === 'red' ||
                    responses.vehicle_lean === 'yes' ||
                    responses.audible_bang === 'yes' ||
                    responses.air_pressure === 'failing' ||
                    responses.ride_quality === 'unstable') {
                    return {
                        action: 'stop',
                        priority: 'critical',
                        message: 'Stop immediately and await engineering assistance',
                        details: 'Critical suspension safety issues detected that require immediate attention'
                    };
                }

                // Unable to reset initially
                if (responses.reset_result === 'unable') {
                    return {
                        action: 'stop',
                        priority: 'high',
                        message: 'Stop and await engineering assistance',
                        details: 'Unable to perform required reset procedure - engineering assessment needed'
                    };
                }

                // Less critical issues - may continue with monitoring
                if (responses.warning_lights === 'amber' ||
                    responses.air_pressure === 'low' ||
                    responses.ride_quality === 'hard' ||
                    responses.ride_quality === 'soft') {
                    return {
                        action: 'continue_monitor',
                        priority: 'medium',
                        message: 'Continue with close monitoring',
                        details: 'Non-critical suspension issues detected - continue to changeover point'
                    };
                }

                // All assessments appear normal after failed reset
                return {
                    action: 'continue_assess',
                    priority: 'low',
                    message: 'Continue with engineering assessment at depot',
                    details: 'Reset failed but no critical issues found - depot assessment recommended'
                };
            };

            const decision = generateDecision();

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Suspension Assessment Decision</h2>
                        <p className="text-gray-300">Based on your assessment responses, here is the recommended action:</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-300">Reset Result:</span> 
                                <span className="text-white ml-2">{responses.reset_result?.replace(/_/g, ' ')}</span>
                            </div>
                            {responses.warning_lights && (
                                <div>
                                    <span className="font-medium text-gray-300">Warning Lights:</span> 
                                    <span className="text-white ml-2">{responses.warning_lights?.replace(/_/g, ' ')}</span>
                                </div>
                            )}
                            {responses.vehicle_lean && (
                                <div>
                                    <span className="font-medium text-gray-300">Vehicle Lean:</span> 
                                    <span className="text-white ml-2">{responses.vehicle_lean === 'yes' ? 'Yes - leaning' : responses.vehicle_lean === 'no' ? 'No - level' : responses.vehicle_lean}</span>
                                </div>
                            )}
                            {responses.air_pressure && (
                                <div>
                                    <span className="font-medium text-gray-300">Air Pressure:</span> 
                                    <span className="text-white ml-2">{responses.air_pressure?.replace(/_/g, ' ')}</span>
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
                                            <h4 className="font-semibold text-red-200 mb-2">Critical Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop vehicle immediately in safe location</li>
                                                <li>Switch off ignition</li>
                                                <li>Contact engineering immediately</li>
                                                <li>Do NOT attempt to continue driving</li>
                                                <li>Record details in Go-Check system</li>
                                                <li>Report to depot management team immediately</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision.priority === 'high' && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-orange-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">⚠️ STOP AND AWAIT ASSISTANCE</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Stop vehicle and await engineering assistance</li>
                                                <li>Contact engineering for guidance</li>
                                                <li>Record issue in Go-Check system</li>
                                                <li>Ensure passenger safety during delay</li>
                                                <li>Do not attempt to continue until cleared by engineering</li>
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
                                    <h3 className="text-xl font-bold text-yellow-200 mb-3">⚠️ CONTINUE WITH MONITORING</h3>
                                    <div className="text-yellow-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-yellow-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                                                <li>Continue to next convenient changeover point</li>
                                                <li>Monitor suspension performance closely</li>
                                                <li>Record issue in Go-Check system</li>
                                                <li>Arrange changeover at earliest opportunity</li>
                                                <li>If condition worsens, stop immediately</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {decision.priority === 'low' && (
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <div className="flex items-start">
                                <AlertCircle className="w-8 h-8 text-blue-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-200 mb-3">ℹ️ CONTINUE WITH ASSESSMENT</h3>
                                    <div className="text-blue-300/90 space-y-2">
                                        <p className="font-semibold">{decision.message}</p>
                                        <p className="text-sm">{decision.details}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-blue-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-blue-300/90 text-sm">
                                                <li>Continue in service to depot</li>
                                                <li>Record reset attempt and symptoms in Go-Check</li>
                                                <li>Arrange engineering assessment at depot</li>
                                                <li>Monitor for any changes in suspension performance</li>
                                                <li>Report any worsening symptoms immediately</li>
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
                                    <li>• Safety is the priority - if driver has any concerns, escalate to engineering</li>
                                    <li>• Record all defects in Go-Check when stationary and in safe location</li>
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
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.SuspensionWizard = SuspensionWizard;
