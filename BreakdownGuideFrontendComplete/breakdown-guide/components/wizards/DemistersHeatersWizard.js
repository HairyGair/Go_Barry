// Demisters/Heaters Wizard Component
// Follows SDC Guide Section: "Demisters / Heaters Not Working" (Page 15)
// Uses icons and constants from common components

const DemistersHeatersWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Wind, Tool } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <Wind className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">❄️ Demisters / Heaters Assessment</h2>
                        <p className="text-gray-300">Following SDC guidance Step 1: Check if the Demisters are Blowing - driver's vision is THE priority.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">👁️ CRITICAL: Driver's Vision is the Priority</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            SDC Guidance: "The driver's vision is the priority. If it is affected, the vehicle should not continue in service." Visibility safety supersedes all other considerations.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">SDC Step 1: Check if the Demisters are Blowing</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the current status of the demister air flow?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('demister_air_flow', 'not_blowing_at_all')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.demister_air_flow === 'not_blowing_at_all'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.demister_air_flow === 'not_blowing_at_all' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.demister_air_flow === 'not_blowing_at_all' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ Not blowing at all</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Take to nearest changeover point, only if visibility not impaired</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('demister_air_flow', 'blowing_cold_air_only')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.demister_air_flow === 'blowing_cold_air_only'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.demister_air_flow === 'blowing_cold_air_only' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.demister_air_flow === 'blowing_cold_air_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌬️ Blowing cold air only</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Proceed to Step 2 - Check the Saloon Temperature</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('demister_air_flow', 'blowing_but_ineffective')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.demister_air_flow === 'blowing_but_ineffective'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.demister_air_flow === 'blowing_but_ineffective' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.demister_air_flow === 'blowing_but_ineffective' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Blowing but not effectively</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Check for blockages (bags, newspapers, etc.)</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.demister_air_flow === 'blowing_but_ineffective' && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <h3 className="text-lg font-semibold text-white mb-4">Blockage Check</h3>
                            <p className="text-gray-300 text-sm mb-4">SDC Guidance: Check for blockages (e.g., bags, newspapers, etc.) if demisters are blowing but not effectively.</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateResponse('blockage_found', 'blockages_found_cleared')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.blockage_found === 'blockages_found_cleared'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.blockage_found === 'blockages_found_cleared' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.blockage_found === 'blockages_found_cleared' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">✅ Blockages found and cleared</span>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => updateResponse('blockage_found', 'no_blockages_still_ineffective')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.blockage_found === 'no_blockages_still_ineffective'
                                            ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.blockage_found === 'no_blockages_still_ineffective' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                        }`}>
                                            {responses.blockage_found === 'no_blockages_still_ineffective' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-medium">⚠️ No blockages - still ineffective</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Driver Visibility Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">SDC Priority: Is the driver's vision affected by the demister issue?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('driver_visibility_affected', 'vision_not_affected')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_visibility_affected === 'vision_not_affected'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_visibility_affected === 'vision_not_affected' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_visibility_affected === 'vision_not_affected' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Vision not affected</span>
                                        <p className="text-sm text-gray-300 mt-1">Clear visibility - heating comfort is the main issue</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('driver_visibility_affected', 'vision_affected')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_visibility_affected === 'vision_affected'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_visibility_affected === 'vision_affected' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_visibility_affected === 'vision_affected' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚫 Vision affected</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Vehicle should not continue in service</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.driver_visibility_affected === 'vision_affected' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 CRITICAL VISIBILITY HAZARD</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: "The driver's vision is the priority. If it is affected, the vehicle should not continue in service."</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Action Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Vehicle must not continue in service</li>
                                                <li>Stop immediately and arrange changeover</li>
                                                <li>Safety of passengers and other road users at risk</li>
                                                <li>Driver visibility supersedes all other considerations</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={responses.driver_visibility_affected === 'vision_affected' ? onComplete : onNext}
                            disabled={!responses.demister_air_flow || !responses.driver_visibility_affected || (responses.demister_air_flow === 'blowing_but_ineffective' && !responses.blockage_found)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {responses.driver_visibility_affected === 'vision_affected' ? 'Complete Assessment' : 'Next Step'}
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🌡️ SDC Step 2: Check the Saloon Temperature</h2>
                        <p className="text-gray-300">SDC guidance requires saloon temperature of 16 degrees or above for passenger comfort.</p>
                    </div>

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">⏰ Vehicle Warm-Up Requirement</h3>
                        <p className="text-yellow-300/80 text-sm leading-relaxed">
                            SDC Guidance: "Ensure the vehicle has had adequate time to warm up, typically after at least 1 hour in service." Has the vehicle had sufficient warm-up time?
                        </p>
                        
                        <div className="mt-4 space-y-3">
                            <button
                                onClick={() => updateResponse('warmup_time', 'adequate_1_hour_plus')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warmup_time === 'adequate_1_hour_plus'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warmup_time === 'adequate_1_hour_plus' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.warmup_time === 'adequate_1_hour_plus' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="font-medium">✅ 1+ hours in service (adequate warm-up)</span>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('warmup_time', 'insufficient_warmup')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.warmup_time === 'insufficient_warmup'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.warmup_time === 'insufficient_warmup' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.warmup_time === 'insufficient_warmup' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="font-medium">⚠️ Less than 1 hour (insufficient warm-up)</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Saloon Temperature Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">SDC Guidance: What is the current saloon temperature?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('saloon_temperature', '16_degrees_or_above')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.saloon_temperature === '16_degrees_or_above'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.saloon_temperature === '16_degrees_or_above' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.saloon_temperature === '16_degrees_or_above' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ 16 degrees or above</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Continue until replacement available (changeover not urgent)</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('saloon_temperature', 'below_16_degrees')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.saloon_temperature === 'below_16_degrees'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.saloon_temperature === 'below_16_degrees' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.saloon_temperature === 'below_16_degrees' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❄️ Below 16 degrees</span>
                                        <p className="text-sm text-gray-300 mt-1">SDC: Change over as soon as possible</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {responses.saloon_temperature === 'below_16_degrees' && (
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <div className="flex items-start">
                                <XCircle className="w-8 h-8 text-red-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">❄️ BELOW MINIMUM TEMPERATURE</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Below 16 degrees requires immediate changeover</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">SDC Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Change over as soon as possible</li>
                                                <li>If cannot be changed immediately: check with engineering at least once an hour</li>
                                                <li>If situation becomes unreasonable: report to relevant Depot Manager</li>
                                                <li>Passenger comfort below acceptable standards</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {responses.saloon_temperature === '16_degrees_or_above' && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ ACCEPTABLE TEMPERATURE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">SDC Guidance: Continue until replacement becomes available</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">SDC Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue in service until replacement available</li>
                                                <li>Changeover is not urgent</li>
                                                <li>Monitor passenger comfort throughout journey</li>
                                                <li>Record defect in Go-Check system</li>
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
                            disabled={!responses.warmup_time || !responses.saloon_temperature}
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
window.DemistersHeatersWizard = DemistersHeatersWizard;
