// Cooling System (Overheating) Wizard Component
// Follows SDC Guide Section: "Overheating" (Page 11-12)
// Uses icons and constants from common components

const CoolingSystemWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Gauge, Tool } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Gauge className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🌡️ Overheating Assessment</h2>
                        <p className="text-gray-300">Following SDC guidance Step 1: Check the Temperature Gauge - ensuring engine protection and safe operation.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🔥 Critical Engine Protection System</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            Overheating can cause catastrophic engine damage. SDC guidance provides specific temperature thresholds and actions to prevent engine failure.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">SDC Step 1: Check the Temperature Gauge</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the current engine temperature reading?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('temperature_reading', '80_100_continue')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === '80_100_continue'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === '80_100_continue' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === '80_100_continue' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ 80–100°C (Normal Range)</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Continue to convenient changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('temperature_reading', 'over_100_assess')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === 'over_100_assess'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === 'over_100_assess' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === 'over_100_assess' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌡️ Over 100°C</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Proceed to Step 2 - Identify the Cause</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('temperature_reading', 'gauge_faulty')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.temperature_reading === 'gauge_faulty'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.temperature_reading === 'gauge_faulty' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.temperature_reading === 'gauge_faulty' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❓ Temperature gauge not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Unable to get accurate temperature reading</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.temperature_reading === '80_100_continue' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ NORMAL TEMPERATURE RANGE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Temperature within acceptable range (80-100°C)</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">SDC Action:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue to convenient changeover point</li>
                                                <li>Monitor temperature throughout journey</li>
                                                <li>Record any concerns in Go-Check system</li>
                                                <li>No immediate engine risk at current temperature</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {responses.temperature_reading === 'over_100_assess' && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-orange-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">🌡️ ELEVATED TEMPERATURE</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Over 100°C requires cause identification</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Next Step Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Proceed to SDC Step 2: Identify the Cause</li>
                                                <li>Determine if issue is Low Water or Overheating</li>
                                                <li>Follow systematic assessment process</li>
                                                <li>Engine damage risk increases with temperature</li>
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
                            disabled={!responses.temperature_reading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.temperature_reading === '80_100_continue' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 SDC Step 2: Identify the Cause</h2>
                        <p className="text-gray-300">Determining whether the issue is Low Water or Overheating to guide appropriate response.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Cause Identification</h3>
                        <p className="text-gray-300 text-sm mb-4">What appears to be the primary cause of the elevated temperature?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('cause_identification', 'low_water')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.cause_identification === 'low_water'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.cause_identification === 'low_water' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.cause_identification === 'low_water' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💧 Low Water</span>
                                        <p className="text-sm text-gray-300 mt-1">Coolant level appears insufficient</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('cause_identification', 'overheating')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.cause_identification === 'overheating'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.cause_identification === 'overheating' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.cause_identification === 'overheating' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔥 Overheating</span>
                                        <p className="text-sm text-gray-300 mt-1">System overheating despite adequate coolant</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.cause_identification === 'low_water' && (
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <h3 className="text-lg font-semibold text-white mb-4">Low Water Assessment</h3>
                            <p className="text-gray-300 text-sm mb-4">SDC Guidance: Can the driver safely reach the next location to top up the water?</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateResponse('water_topup_feasible', 'can_reach_topup')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.water_topup_feasible === 'can_reach_topup'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.water_topup_feasible === 'can_reach_topup' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.water_topup_feasible === 'can_reach_topup' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">✅ Can safely reach water top-up location</span>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => updateResponse('water_topup_feasible', 'cannot_reach_safely')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.water_topup_feasible === 'cannot_reach_safely'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.water_topup_feasible === 'cannot_reach_safely' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                        }`}>
                                            {responses.water_topup_feasible === 'cannot_reach_safely' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">❌ Cannot safely reach top-up location</span>
                                    </div>
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
                            disabled={!responses.cause_identification || (responses.cause_identification === 'low_water' && !responses.water_topup_feasible)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next Step
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔊 SDC Step 3: Water Buzzer Check</h2>
                        <p className="text-gray-300">Determining if the water buzzer is sounding to guide next actions.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Buzzer Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Is the water buzzer currently sounding?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('water_buzzer_status', 'no_buzzer')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer_status === 'no_buzzer'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer_status === 'no_buzzer' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer_status === 'no_buzzer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔇 No buzzer sounding</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Continue to next changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('water_buzzer_status', 'buzzer_sounding')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.water_buzzer_status === 'buzzer_sounding'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.water_buzzer_status === 'buzzer_sounding' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.water_buzzer_status === 'buzzer_sounding' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔊 Buzzer sounding</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Proceed to Step 4 - Inspect for water leaks</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.water_buzzer_status === 'no_buzzer' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ NO WATER BUZZER</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Continue to next changeover point</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">SDC Action:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Proceed to next convenient changeover point</li>
                                                <li>Continue monitoring temperature</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Arrange engineering inspection at depot</li>
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
                            onClick={responses.water_buzzer_status === 'no_buzzer' ? onComplete : onNext}
                            disabled={!responses.water_buzzer_status}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.water_buzzer_status === 'no_buzzer' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 SDC Step 4: Inspect for Water Leaks</h2>
                        <p className="text-gray-300">Safe visual inspection for coolant leaks - NEVER step into highway.</p>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ CRITICAL SAFETY PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            SDC Guidance: "NEVER ask a driver to step into the highway, ensure they stay safe at all times." Only inspect areas safely accessible from the kerb.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Water Leak Inspection (Safe Areas Only)</h3>
                        <p className="text-gray-300 text-sm mb-4">Are there visible signs of water leaks from safe viewing positions?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('leak_inspection', 'leaks_present')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_inspection === 'leaks_present'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_inspection === 'leaks_present' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_inspection === 'leaks_present' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💦 Leaks present</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Stop immediately and await engineering assistance</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('leak_inspection', 'no_leaks')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.leak_inspection === 'no_leaks'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.leak_inspection === 'no_leaks' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.leak_inspection === 'no_leaks' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No leaks visible</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Proceed to Step 5 - Heat mitigation</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.leak_inspection === 'leaks_present' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 COOLANT LEAK DETECTED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Stop immediately and await engineering assistance</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop the vehicle immediately in a safe location</li>
                                                <li>Await qualified engineering assistance</li>
                                                <li>Do not attempt to continue - risk of engine damage</li>
                                                <li>Document leak location and severity for engineers</li>
                                                <li>Monitor temperature if engine still running</li>
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
                            onClick={responses.leak_inspection === 'leaks_present' ? onComplete : onNext}
                            disabled={!responses.leak_inspection}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.leak_inspection === 'leaks_present' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 5:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔥 SDC Step 5: Heat Mitigation</h2>
                        <p className="text-gray-300">Using heaters and demisters to disperse heat in the cooling system.</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">🌡️ Heat Distribution Strategy</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            SDC Guidance: "Instruct the driver to turn on the heaters and demisters to disperse heat in the system." This helps reduce engine temperature by using the cabin heating system as an additional radiator.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Heat Mitigation Results</h3>
                        <p className="text-gray-300 text-sm mb-4">After turning on heaters and demisters to disperse heat, has this resolved the overheating issue?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('heat_mitigation_result', 'issue_resolved')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.heat_mitigation_result === 'issue_resolved'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.heat_mitigation_result === 'issue_resolved' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.heat_mitigation_result === 'issue_resolved' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Issue resolved</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Continue to next convenient changeover point</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('heat_mitigation_result', 'problem_persists')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.heat_mitigation_result === 'problem_persists'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.heat_mitigation_result === 'problem_persists' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.heat_mitigation_result === 'problem_persists' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Problem persists</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC Action: Stop and await engineering assistance</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {responses.heat_mitigation_result === 'issue_resolved' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ HEAT MITIGATION SUCCESSFUL</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Continue to next convenient changeover point</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue to next convenient changeover point</li>
                                                <li>Keep heaters/demisters running to maintain heat dispersion</li>
                                                <li>Monitor temperature gauge continuously</li>
                                                <li>Record defect in Go-Check system</li>
                                                <li>Arrange engineering inspection at depot</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {responses.heat_mitigation_result === 'problem_persists' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 HEAT MITIGATION FAILED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Stop and await engineering assistance</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop the vehicle in a safe location</li>
                                                <li>Await qualified engineering assistance</li>
                                                <li>Do not attempt to continue - risk of engine damage</li>
                                                <li>Keep heaters/demisters running if engine still running</li>
                                                <li>Monitor temperature and be prepared to shut off engine</li>
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
                                <h4 className="font-semibold text-blue-200">Go-Check Documentation</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Record: Overheating - {responses.cause_identification} - Heat mitigation: {responses.heat_mitigation_result}
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
                            disabled={!responses.heat_mitigation_result}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
window.CoolingSystemWizard = CoolingSystemWizard;
