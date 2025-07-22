// Interior Lights Wizard Component
// Follows SDC Engineering Issues Guide - Section 15 (Page 33)

const InteriorLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔦 Interior Lights Assessment</h2>
                        <p className="text-gray-300">Following SDC Section 15 - Two critical checks required for interior lighting safety.</p>
                    </div>
                    
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">⚠️ SDC Requirements</h3>
                        <div className="text-yellow-300/80 text-sm space-y-2">
                            <p>The vehicle may continue ONLY if BOTH conditions are met:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>At least 50% of lights on each deck are illuminated</li>
                                <li>Step light works when doors are open</li>
                            </ul>
                            <p className="mt-3 font-semibold">If either answer is "no" - arrange immediate changeover</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Current Operating Conditions</h3>
                        <p className="text-gray-300 text-sm mb-4">Is the vehicle currently operating during hours of darkness?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('hours_of_darkness', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.hours_of_darkness === 'no'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.hours_of_darkness === 'no' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.hours_of_darkness === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">☀️ No - Daylight hours</span>
                                        <p className="text-sm text-gray-300 mt-1">Operating in daylight conditions</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('hours_of_darkness', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.hours_of_darkness === 'yes'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.hours_of_darkness === 'yes' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.hours_of_darkness === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌃 Yes - Hours of darkness</span>
                                        <p className="text-sm text-gray-300 mt-1">Operating during darkness - changeover especially urgent</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Type</h3>
                        <p className="text-gray-300 text-sm mb-4">What type of vehicle is being assessed?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_type', 'single_deck')}
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
                                        <p className="text-sm text-gray-300 mt-1">One deck to assess</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('vehicle_type', 'double_deck')}
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
                                        <p className="text-sm text-gray-300 mt-1">Both decks must be assessed</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.hours_of_darkness || !responses.vehicle_type}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to 50% Check
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
                        <h2 className="text-2xl font-bold text-white mb-2">💡 Check 1: 50% Rule Assessment</h2>
                        <p className="text-gray-300">Are at least 50% of the lights on each deck illuminated? (i.e., at least one side of the lights working)</p>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📏 What to Check</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            Look at the interior passenger lighting. At least half must be working - typically this means at least one full side (left or right) is functional.
                        </p>
                    </div>

                    {responses.vehicle_type === 'single_deck' ? (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">Single Deck - 50% Check</h3>
                            <p className="text-gray-300 text-sm mb-4">Are at least 50% of the interior lights working?</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateResponse('fifty_percent_met', 'yes')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.fifty_percent_met === 'yes'
                                            ? 'border-green-400 bg-green-400/20 text-green-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.fifty_percent_met === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                        }`}>
                                            {responses.fifty_percent_met === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">✅ Yes - 50% or more working</span>
                                            <p className="text-sm text-gray-300 mt-1">At least half the interior lights are functional</p>
                                        </div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => updateResponse('fifty_percent_met', 'no')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.fifty_percent_met === 'no'
                                            ? 'border-red-400 bg-red-400/20 text-red-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.fifty_percent_met === 'no' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                        }`}>
                                            {responses.fifty_percent_met === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">❌ No - Less than 50% working</span>
                                            <p className="text-sm text-gray-300 mt-1">Less than half the interior lights are functional</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4">Lower Deck - 50% Check</h3>
                                <p className="text-gray-300 text-sm mb-4">Are at least 50% of the lower deck lights working?</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateResponse('lower_deck_fifty', 'yes')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lower_deck_fifty === 'yes'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">✅ Yes - Lower deck meets 50% rule</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => updateResponse('lower_deck_fifty', 'no')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.lower_deck_fifty === 'no'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">❌ No - Lower deck fails 50% rule</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4">Upper Deck - 50% Check</h3>
                                <p className="text-gray-300 text-sm mb-4">Are at least 50% of the upper deck lights working?</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateResponse('upper_deck_fifty', 'yes')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.upper_deck_fifty === 'yes'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">✅ Yes - Upper deck meets 50% rule</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => updateResponse('upper_deck_fifty', 'no')}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.upper_deck_fifty === 'no'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <span className="font-medium">❌ No - Upper deck fails 50% rule</span>
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
                            disabled={responses.vehicle_type === 'single_deck' ? !responses.fifty_percent_met : (!responses.lower_deck_fifty || !responses.upper_deck_fifty)}
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
                        <h2 className="text-2xl font-bold text-white mb-2">🚪 Check 2: Step Light Test</h2>
                        <p className="text-gray-300">Is the step light working when the doors are open?</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Safety Critical</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed">
                            Step light must illuminate when doors open for passenger safety during boarding/alighting.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Step Light Function Test</h3>
                        <p className="text-gray-300 text-sm mb-4">Ask driver to open doors and check if step light illuminates.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('step_light_working', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_working === 'yes'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_working === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_working === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Yes - Step light works</span>
                                        <p className="text-sm text-gray-300 mt-1">Step light illuminates when doors open</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => updateResponse('step_light_working', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.step_light_working === 'no'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.step_light_working === 'no' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.step_light_working === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">❌ No - Step light not working</span>
                                        <p className="text-sm text-gray-300 mt-1">Step light does not illuminate when doors open</p>
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
                            disabled={!responses.step_light_working}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Decision
                        </button>
                    </div>
                </div>
            );

        case 4:
            // Determine if both conditions are met
            const fiftyPercentMet = responses.vehicle_type === 'single_deck' 
                ? responses.fifty_percent_met === 'yes'
                : (responses.lower_deck_fifty === 'yes' && responses.upper_deck_fifty === 'yes');
            
            const stepLightWorking = responses.step_light_working === 'yes';
            const bothConditionsMet = fiftyPercentMet && stepLightWorking;
            const operatingInDarkness = responses.hours_of_darkness === 'yes';

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Interior Lights Decision</h2>
                        <p className="text-gray-300">Based on SDC Section 15 requirements</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Results</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-300">50% Rule Check:</span>
                                <span className={fiftyPercentMet ? 'text-green-400' : 'text-red-400'}>
                                    {fiftyPercentMet ? '✅ Passed' : '❌ Failed'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Step Light Check:</span>
                                <span className={stepLightWorking ? 'text-green-400' : 'text-red-400'}>
                                    {stepLightWorking ? '✅ Working' : '❌ Not Working'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Hours of Darkness:</span>
                                <span className={operatingInDarkness ? 'text-orange-400' : 'text-blue-400'}>
                                    {operatingInDarkness ? '🌃 Yes' : '☀️ No'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {bothConditionsMet ? (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-8 h-8 text-green-400 mt-1 mr-4" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">Both conditions met - vehicle may continue</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Record lighting defects in Go-Check system</li>
                                                <li>Monitor lighting during operations</li>
                                                {operatingInDarkness && <li className="font-semibold">⚠️ Operating in darkness - arrange changeover at earliest opportunity</li>}
                                                <li>Report for workshop attention</li>
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
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 ARRANGE IMMEDIATE CHANGEOVER</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">SDC requirement not met - changeover required</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Failed Requirements:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {!fiftyPercentMet && <li>Less than 50% of lights working on deck(s)</li>}
                                                {!stepLightWorking && <li>Step light not functioning</li>}
                                            </ul>
                                            <h4 className="font-semibold text-red-200 mb-2 mt-4">Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li className="font-semibold">Arrange changeover immediately</li>
                                                {operatingInDarkness && <li className="font-semibold text-red-200">⚠️ ESPECIALLY URGENT - Operating in darkness</li>}
                                                <li>Record defect in Go-Check system</li>
                                                <li>Do not continue beyond necessary changeover point</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <Shield className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200">SDC Compliance</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Per SDC Section 15: If either answer is "no," arrange for immediate changeover
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
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.InteriorLightsWizard = InteriorLightsWizard;
