import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

const ExcessiveSmokeWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Info, Clipboard } = Icons;
    
    const handleCompleteAssessment = () => {
        let finalDecision = 'CONTINUE';
        let notes = 'Excessive smoke assessment completed per standard operational procedures. ';
        
        const smokeType = responses[1];
        const visibilityAffected = responses[2];
        const duration = responses[3];
        
        // Decision logic based on smoke assessment
        const shouldStop = smokeType === 'fumes_interior' || 
                          smokeType === 'exhaust_detaching' || 
                          smokeType === 'dense_blue' || 
                          smokeType === 'dense_black' || 
                          visibilityAffected === 'yes_visibility' ||
                          visibilityAffected === 'unsure_visibility';
        
        if (shouldStop) {
            finalDecision = 'STOP';
            notes += 'Vehicle must stop immediately - ';
            
            if (smokeType === 'fumes_interior') {
                notes += 'Fumes entering cabin detected. Passenger safety critical. ';
            } else if (smokeType === 'exhaust_detaching') {
                notes += 'Exhaust system detachment risk. Mechanical failure imminent. ';
            } else if (smokeType === 'dense_blue' || smokeType === 'dense_black') {
                notes += 'Dense smoke detected indicating serious engine issues. ';
            } else if (visibilityAffected === 'yes_visibility' || visibilityAffected === 'unsure_visibility') {
                notes += 'Smoke affecting visibility creating danger for other road users. ';
            }
            
            notes += 'Engineering assistance required immediately.';
        } else {
            finalDecision = 'AMBER';
            notes += 'Continue to next changeover point with caution. ';
            notes += `Smoke type: ${smokeType}. Monitor situation closely and arrange replacement vehicle. `;
            notes += 'Record the defect on their handheld device and report to engineering for depot assessment.';
        }
        
        // Add duration information
        if (duration === 'multiple_trips') {
            notes += ' Note: Issue has persisted over multiple trips.';
        } else if (duration === 'continuous') {
            notes += ' Note: Continuous smoking throughout current journey.';
        }
        
        onComplete(finalDecision, notes);
    };
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Excessive Smoke Report</h2>
                            <p className="text-gray-300">
                                We'll help you assess the smoke situation and determine the safest course of action.
                            </p>
                        </div>

                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <h3 className="text-red-400 font-semibold mb-2 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Safety Priority
                            </h3>
                            <p className="text-red-200 text-sm">
                                Excessive smoke can indicate serious mechanical issues and may pose safety risks to passengers and other road users.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                            <h3 className="text-white font-semibold mb-4">What type of smoke is the driver experiencing?</h3>
                            <div className="space-y-3">
                                {[
                                    { value: 'dense_blue', label: 'Dense blue smoke (continuous stream)' },
                                    { value: 'dense_black', label: 'Dense black smoke (clearly visible)' },
                                    { value: 'white_steam', label: 'White smoke or steam' },
                                    { value: 'light_occasional', label: 'Light or occasional smoke' },
                                    { value: 'fumes_interior', label: 'Fumes entering vehicle interior' },
                                    { value: 'exhaust_detaching', label: 'Exhaust system appears to be detaching' }
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
                            <h2 className="text-2xl font-bold text-white mb-2">Additional Assessment</h2>
                            <p className="text-gray-300">
                                Let's gather more information about the situation.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Is the smoke affecting visibility or creating danger for other road users?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'yes_visibility', label: 'Yes - Smoke is obscuring vision for the driver or other road users' },
                                        { value: 'no_visibility', label: 'No - Visibility is not significantly affected' },
                                        { value: 'unsure_visibility', label: 'Unsure - Difficult to determine' }
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
                                <h3 className="text-white font-semibold">How long has the smoking been occurring?</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'just_started', label: 'Just started within the last few minutes' },
                                        { value: 'intermittent', label: 'On and off for the current journey' },
                                        { value: 'continuous', label: 'Continuous throughout the journey' },
                                        { value: 'multiple_trips', label: 'Has been happening over multiple trips' }
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
                                disabled={!responses[2] || !responses[3]}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Get Guidance
                            </button>
                        </div>
                    </div>
                );

            case 3:
                // Determine action based on responses
                const smokeType = responses[1];
                const visibilityAffected = responses[2];
                const shouldStop = smokeType === 'fumes_interior' || 
                                  smokeType === 'exhaust_detaching' || 
                                  smokeType === 'dense_blue' || 
                                  smokeType === 'dense_black' || 
                                  visibilityAffected === 'yes_visibility' ||
                                  visibilityAffected === 'unsure_visibility';

                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Action Required</h2>
                            <p className="text-gray-300">
                                Based on the assessment, here is the recommended action:
                            </p>
                        </div>

                        {shouldStop ? (
                            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
                                <h3 className="text-red-400 font-bold text-xl mb-4 flex items-center">
                                    <AlertTriangle className="w-6 h-6 mr-2" />
                                    STOP IMMEDIATELY
                                </h3>
                                <div className="space-y-4 text-red-200">
                                    <p className="font-semibold">Advise the driver to stop the vehicle immediately and await engineering assistance.</p>
                                    <div className="space-y-2">
                                        <p className="font-medium">Immediate Actions:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li>Advise the driver to stop the vehicle in a safe location as soon as possible</li>
                                            <li>Turn off the engine</li>
                                            <li>Ensure passenger safety - consider evacuation if fumes are present</li>
                                            <li>Contact the engineering team immediately</li>
                                            <li>Do NOT attempt to continue driving</li>
                                        </ul>
                                    </div>
                                    {smokeType === 'fumes_interior' && (
                                        <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                                            <p className="font-semibold">⚠️ Fumes in cabin detected - Passenger safety is critical</p>
                                        </div>
                                    )}
                                    {smokeType === 'exhaust_detaching' && (
                                        <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                                            <p className="font-semibold">⚠️ Exhaust detachment risk - Mechanical failure imminent</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-6">
                                <h3 className="text-amber-400 font-bold text-xl mb-4 flex items-center">
                                    <AlertCircle className="w-6 h-6 mr-2" />
                                    CONTINUE WITH CAUTION
                                </h3>
                                <div className="space-y-4 text-amber-200">
                                    <p className="font-semibold">The driver may continue to the next convenient changeover point.</p>
                                    <div className="space-y-2">
                                        <p className="font-medium">Instructions:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li>Arrange for a vehicle changeover at the earliest opportunity</li>
                                            <li>Advise the driver to monitor the situation closely - if it worsens, stop immediately</li>
                                            <li>Record the defect on their handheld device when safe to do so</li>
                                            <li>Report to engineering for assessment at depot</li>
                                        </ul>
                                    </div>
                                    <div className="bg-amber-800/30 p-3 rounded border-l-4 border-amber-500">
                                        <p className="font-semibold">📱 Contact engineering if the situation changes or worsens</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                                <Info className="w-5 h-5 mr-2" />
                                Important Safety Notes
                            </h4>
                            <ul className="text-blue-200 text-sm space-y-1">
                                <li>• Excessive smoke can indicate serious engine or exhaust problems</li>
                                <li>• Always prioritise passenger and public safety</li>
                                <li>• Environmental concerns also apply - minimize unnecessary emissions</li>
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

            case 4:
                const smokeType4 = responses[1];
                const shouldStop4 = smokeType4 === 'fumes_interior' || 
                                   smokeType4 === 'exhaust_detaching' || 
                                   smokeType4 === 'dense_blue' || 
                                   smokeType4 === 'dense_black' || 
                                   responses[2] === 'yes_visibility' ||
                                   responses[2] === 'unsure_visibility';

                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete</h2>
                            <p className="text-gray-300">
                                Summary of the excessive smoke assessment and next steps.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                            <h3 className="text-white font-semibold mb-3">Assessment Summary:</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><span className="font-medium">Smoke Type:</span> {
                                    {
                                        'dense_blue': 'Dense blue smoke (continuous stream)',
                                        'dense_black': 'Dense black smoke (clearly visible)',
                                        'white_steam': 'White smoke or steam',
                                        'light_occasional': 'Light or occasional smoke',
                                        'fumes_interior': 'Fumes entering vehicle interior',
                                        'exhaust_detaching': 'Exhaust system appears to be detaching'
                                    }[responses[1]]
                                }</p>
                                <p><span className="font-medium">Visibility Impact:</span> {
                                    {
                                        'yes_visibility': 'Smoke affecting visibility/safety',
                                        'no_visibility': 'No significant visibility impact',
                                        'unsure_visibility': 'Uncertain about visibility impact'
                                    }[responses[2]]
                                }</p>
                                <p><span className="font-medium">Duration:</span> {
                                    {
                                        'just_started': 'Just started within the last few minutes',
                                        'intermittent': 'On and off for the current journey',
                                        'continuous': 'Continuous throughout the journey',
                                        'multiple_trips': 'Has been happening over multiple trips'
                                    }[responses[3]]
                                }</p>
                            </div>
                        </div>

                        <div className={`${shouldStop4 ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'} border rounded-lg p-6`}>
                            <h3 className={`${shouldStop4 ? 'text-red-400' : 'text-amber-400'} font-bold text-lg mb-2`}>
                                Action Required: {shouldStop4 ? 'STOP IMMEDIATELY' : 'CONTINUE WITH CAUTION'}
                            </h3>
                            <p className={`${shouldStop4 ? 'text-red-200' : 'text-amber-200'}`}>
                                {shouldStop4 
                                    ? 'Vehicle must be stopped and engineering contacted immediately due to safety concerns.'
                                    : 'Vehicle may continue to next changeover point with close monitoring.'}
                            </p>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                                <Clipboard className="w-5 h-5 mr-2" />
                                Required Actions
                            </h4>
                            <ul className="text-blue-200 text-sm space-y-1">
                                <li>• Record this assessment on their handheld device when stationary and safe</li>
                                <li>• Include photos of any visible smoke if safely possible</li>
                                <li>• Contact engineering for further guidance</li>
                                <li>• Arrange changeover at earliest opportunity</li>
                                <li>• Report any escalation of the situation immediately</li>
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
                                onClick={() => handleCompleteAssessment()}
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
                    <span className="text-sm text-gray-400">Step {currentStep} of 4</span>
                    <span className="text-sm text-gray-400">Excessive Smoke Assessment</span>
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

// Export to global scope
window.ExcessiveSmokeWizard = ExcessiveSmokeWizard;

export default ExcessiveSmokeWizard;
