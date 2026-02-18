import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// GearboxWizard.js - Gearbox Temperature Assessment
function GearboxWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, RotateCcw, Droplet, StopCircle, Mountain, Route, Search, Check, Cog, Eye } = Icons;
  
  const handleCompleteAssessment = () => {
    let finalDecision = 'CONTINUE';
    let notes = 'Gearbox temperature assessment completed per standard operational procedures. ';
    
    const recommendation = getRecommendation();
    
    if (recommendation.action === 'continue') {
      finalDecision = 'CONTINUE';
      notes += 'Vehicle reset resolved gearbox temperature issue. Vehicle may continue in service. Monitor and report any return of temperature warning.';
    } else if (recommendation.action === 'stop') {
      finalDecision = 'STOP';
      if (responses.coolantLeaks === 'yes') {
        notes += 'Coolant leaks detected. Vehicle must stop immediately and await engineering assistance.';
      } else if (responses.coolantLeaks === 'unsure') {
        notes += 'Driver unable to safely check for leaks. Vehicle must stop immediately and await engineering assistance.';
      } else if (responses.changeoverDistance === 'far') {
        notes += 'No recent hilly terrain to explain temperature and changeover point too far. Vehicle must stop and await engineering assistance.';
      } else {
        notes += 'Vehicle must stop immediately and await engineering assistance.';
      }
    } else if (recommendation.action === 'monitor') {
      finalDecision = 'AMBER';
      notes += 'Recent hilly terrain may explain temperature. Continue with monitoring and arrange changeover at next convenient location.';
    } else if (recommendation.action === 'changeover') {
      finalDecision = 'AMBER';
      notes += 'Proceed carefully to changeover point for immediate vehicle change. Stop immediately if situation worsens en route.';
    }
    
    notes += ' Record the defect on their handheld device when stationary and safe.';
    
    onComplete(finalDecision, notes);
  };
  
  const getRecommendation = () => {
    // If reset cleared the issue
    if (responses.resetResult === 'cleared') {
      return {
        action: 'continue',
        title: 'Continue in Service',
        message: 'The vehicle reset has resolved the gearbox temperature issue.',
        icon: <CheckCircle className="w-5 h-5" />,
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        details: 'The vehicle may continue in service. Monitor the situation and ensure the driver reports any return of the temperature warning immediately.'
      };
    }

    // If coolant leaks found or driver can't safely check
    if (responses.coolantLeaks === 'yes' || responses.coolantLeaks === 'unsure') {
      return {
        action: 'stop',
        title: 'STOP IMMEDIATELY',
        message: responses.coolantLeaks === 'yes'
          ? 'Coolant leaks detected. Vehicle must stop and await engineering assistance.'
          : 'Driver unable to safely check for leaks. Vehicle must stop and await engineering assistance.',
        icon: <StopCircle className="w-5 h-5" />,
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        details: 'Do not attempt to continue. Engineering assistance is required immediately.'
      };
    }

    // If operated on hilly terrain recently
    if (responses.hillyTerrain === 'yes') {
      return {
        action: 'monitor',
        title: 'Continue with Monitoring',
        message: 'Recent hilly terrain may explain the temperature.',
        icon: <Eye className="w-5 h-5" />,
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        details: 'Continue in service for a short time to monitor if the issue persists. Arrange changeover at the next convenient location.'
      };
    }

    // If no hilly terrain, assess distance to changeover
    if (responses.changeoverDistance === 'far') {
      return {
        action: 'stop',
        title: 'STOP - Cannot Safely Reach Changeover',
        message: 'No recent hilly terrain to explain temperature and changeover point too far.',
        icon: <StopCircle className="w-5 h-5" />,
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        details: 'Stop and await assistance from engineering. The risk is too high to continue to the distant changeover point.'
      };
    } else {
      return {
        action: 'changeover',
        title: 'Proceed to Changeover Point',
        message: 'Assess if the bus can safely reach the nearest changeover point.',
        icon: <ArrowRight className="w-5 h-5" />,
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        details: 'Proceed carefully to the changeover point for immediate vehicle change. If the situation worsens en route, stop immediately.'
      };
    }
  };
    
    // Determine how many steps we actually need based on responses
    const getMaxSteps = () => {
        if (responses.resetResult === 'cleared') return 2; // End early if reset works
        if (responses.coolantLeaks === 'yes' || responses.coolantLeaks === 'unsure') return 3; // End early if leaks
        return 4; // Full flow needed
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-amber-400 mt-1"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                                <div>
                                    <h3 className="text-amber-400 font-semibold mb-2">Gearbox Temperature Issue Reported</h3>
                                    <p className="text-amber-100 text-sm">
                                        High gearbox temperature can indicate serious mechanical problems. Let's assess the situation systematically.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-semibold flex items-center space-x-2">
                                <span className="text-blue-400"><RotateCcw className="w-5 h-5 text-blue-400" /></span>
                                <span>Step 1: Reset the Vehicle</span>
                            </h3>
                            
                            <p className="text-gray-300 text-sm">
                                First, instruct the driver to switch off the bus and re-set it to see if this clears the gearbox temperature issue.
                            </p>

                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <h4 className="text-blue-400 font-medium mb-2">Reset Procedure:</h4>
                                <ol className="text-blue-100 text-sm space-y-1 list-decimal list-inside">
                                    <li>Switch off the bus completely</li>
                                    <li>Wait a moment</li>
                                    <li>Re-set the vehicle (restart)</li>
                                    <li>Check if the gearbox temperature warning has cleared</li>
                                </ol>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    What happened after attempting the reset?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="resetResult"
                                            value="cleared"
                                            checked={responses.resetResult === 'cleared'}
                                            onChange={(e) => updateResponse('resetResult', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">Reset cleared the gearbox temperature issue</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="resetResult"
                                            value="persists"
                                            checked={responses.resetResult === 'persists'}
                                            onChange={(e) => updateResponse('resetResult', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">Problem persists after reset</span>
                                    </label>
                                </div>
                            </div>

                            {responses.resetResult === 'cleared' && (
                                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-green-400 mt-1"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                                        <div>
                                            <h4 className="text-green-400 font-semibold mb-2">Issue Resolved</h4>
                                            <p className="text-green-100 text-sm">
                                                The reset has cleared the gearbox temperature warning. The vehicle may continue in service.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2:
                // If reset cleared, show final recommendation
                if (responses.resetResult === 'cleared') {
                    return renderFinalStep();
                }
                
                return (
                    <div className="space-y-6">
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-red-400 mt-1"><Droplet className="w-5 h-5 text-red-400" /></div>
                                <div>
                                    <h3 className="text-red-400 font-semibold mb-2">Step 2: Check for Coolant Leaks</h3>
                                    <p className="text-red-100 text-sm">
                                        Since the reset didn't resolve the issue, we need to check for coolant leaks that could cause overheating.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-red-400 mt-1"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                                <div>
                                    <h4 className="text-red-400 font-semibold mb-2">SAFETY WARNING</h4>
                                    <p className="text-red-100 text-sm font-medium">
                                        NEVER ask the driver to step into the highway. Ensure they stay safe at all times.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-semibold flex items-center space-x-2">
                                <span className="text-blue-400"><Search className="w-5 h-5 text-blue-400" /></span>
                                <span>Visual Inspection for Leaks</span>
                            </h3>

                            <p className="text-gray-300 text-sm">
                                Ask the driver to safely check for visible signs of coolant/water leaks around the vehicle from a safe position.
                            </p>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Are there visible coolant/water leaks around the vehicle?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="coolantLeaks"
                                            value="yes"
                                            checked={responses.coolantLeaks === 'yes'}
                                            onChange={(e) => updateResponse('coolantLeaks', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">Yes, coolant leaks are visible</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="coolantLeaks"
                                            value="no"
                                            checked={responses.coolantLeaks === 'no'}
                                            onChange={(e) => updateResponse('coolantLeaks', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">No visible coolant leaks</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="coolantLeaks"
                                            value="unsure"
                                            checked={responses.coolantLeaks === 'unsure'}
                                            onChange={(e) => updateResponse('coolantLeaks', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">Driver is unsure/cannot safely check</span>
                                    </label>
                                </div>
                            </div>

                            {(responses.coolantLeaks === 'yes' || responses.coolantLeaks === 'unsure') && (
                                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-red-400 mt-1"><StopCircle className="w-5 h-5 text-red-400" /></div>
                                        <div>
                                            <h4 className="text-red-400 font-semibold mb-2">STOP IMMEDIATELY</h4>
                                            <p className="text-red-100 text-sm">
                                                {responses.coolantLeaks === 'yes' 
                                                    ? 'Coolant leaks detected. The vehicle must stop immediately and await engineering assistance.'
                                                    : 'Driver cannot safely check for leaks. Stop immediately and await engineering assistance.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                // If leaks found, show final recommendation
                if (responses.coolantLeaks === 'yes' || responses.coolantLeaks === 'unsure') {
                    return renderFinalStep();
                }
                
                return (
                    <div className="space-y-6">
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-amber-400 mt-1"><Mountain className="w-5 h-5 text-amber-400" /></div>
                                <div>
                                    <h3 className="text-amber-400 font-semibold mb-2">Step 3: Assess the Terrain</h3>
                                    <p className="text-amber-100 text-sm">
                                        Gearbox temperature can rise on hilly terrain. Let's assess the recent operating conditions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-semibold flex items-center space-x-2">
                                <span className="text-blue-400"><Route className="w-5 h-5 text-blue-400" /></span>
                                <span>Recent Operating Conditions</span>
                            </h3>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Has the vehicle recently operated on hilly terrain?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="hillyTerrain"
                                            value="yes"
                                            checked={responses.hillyTerrain === 'yes'}
                                            onChange={(e) => updateResponse('hillyTerrain', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">Yes, recently operated on hilly terrain</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="hillyTerrain"
                                            value="no"
                                            checked={responses.hillyTerrain === 'no'}
                                            onChange={(e) => updateResponse('hillyTerrain', e.target.value)}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span className="text-gray-300">No, mostly flat terrain operation</span>
                                    </label>
                                </div>
                            </div>

                            {responses.hillyTerrain === 'no' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300">
                                        What is the distance to the nearest convenient changeover point?
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                name="changeoverDistance"
                                                value="close"
                                                checked={responses.changeoverDistance === 'close'}
                                                onChange={(e) => updateResponse('changeoverDistance', e.target.value)}
                                                className="w-4 h-4 text-blue-500"
                                            />
                                            <span className="text-gray-300">Close (can safely reach changeover point)</span>
                                        </label>
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                name="changeoverDistance"
                                                value="far"
                                                checked={responses.changeoverDistance === 'far'}
                                                onChange={(e) => updateResponse('changeoverDistance', e.target.value)}
                                                className="w-4 h-4 text-blue-500"
                                            />
                                            <span className="text-gray-300">Too far (unsafe to drive that distance)</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 4:
                return renderFinalStep();

            default:
                return <div>Unknown step</div>;
        }
    };

    const renderFinalStep = () => {
        // getRecommendation function is now defined above

        const recommendation = getRecommendation();

        return (
            <div className="space-y-6">
                <div className={`${recommendation.bgColor} border ${recommendation.borderColor} rounded-lg p-4`}>
                    <div className="flex items-start space-x-3">
                        <div className={`${recommendation.textColor} mt-1`}>{recommendation.icon}</div>
                        <div>
                            <h3 className={`${recommendation.textColor} font-semibold mb-2`}>{recommendation.title}</h3>
                            <p className={`${recommendation.textColor.replace('400', '100')} text-sm mb-3`}>
                                {recommendation.message}
                            </p>
                            <p className={`${recommendation.textColor.replace('400', '200')} text-sm`}>
                                {recommendation.details}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-3 flex items-center space-x-2">
                        <span><FileText className="w-5 h-5 text-blue-400" /></span>
                        <span>Required Actions</span>
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1"><Check className="w-5 h-5 text-blue-400" /></span>
                            <span className="text-blue-100 text-sm">Record defect immediately on their reporting device when stationary and safe</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1"><Check className="w-5 h-5 text-blue-400" /></span>
                            <span className="text-blue-100 text-sm">Communicate decision clearly with the driver</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1"><Check className="w-5 h-5 text-blue-400" /></span>
                            <span className="text-blue-100 text-sm">Monitor situation and provide updates as needed</span>
                        </div>
                        {(recommendation.action === 'stop' || recommendation.action === 'monitor') && (
                            <div className="flex items-start space-x-2">
                                <span className="text-blue-400 mt-1"><Check className="w-5 h-5 text-blue-400" /></span>
                                <span className="text-blue-100 text-sm">Escalate to engineering management team if necessary</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-gray-300 font-semibold mb-2">Assessment Summary</h4>
                    <div className="space-y-1 text-sm text-gray-400">
                        <p><span className="font-medium">Reset Result:</span> {responses.resetResult || 'Not assessed'}</p>
                        {responses.resetResult !== 'cleared' && responses.coolantLeaks && (
                            <p><span className="font-medium">Coolant Leaks:</span> {responses.coolantLeaks}</p>
                        )}
                        {responses.resetResult !== 'cleared' && responses.coolantLeaks === 'no' && (
                            <>
                                <p><span className="font-medium">Hilly Terrain:</span> {responses.hillyTerrain || 'Not assessed'}</p>
                                {responses.hillyTerrain === 'no' && (
                                    <p><span className="font-medium">Changeover Distance:</span> {responses.changeoverDistance || 'Not assessed'}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl"><Cog className="w-5 h-5 text-white" /></span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gearbox Temperature</h1>
                        <p className="text-gray-400">Gearbox overheating assessment and response</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
                    <span>Step {currentStep} of {getMaxSteps()}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(currentStep / getMaxSteps()) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {renderStep()}

            <div className="flex justify-between pt-8">
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 1}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <span><ArrowLeft className="w-5 h-5 text-white" /></span>
                    <span>Previous</span>
                </button>
                
                {currentStep === getMaxSteps() ? (
                    <button
                        onClick={() => handleCompleteAssessment()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center space-x-2"
                    >
                        <span>Complete Assessment</span>
                        <span><Check className="w-5 h-5 text-blue-400" /></span>
                    </button>
                ) : (
                    <button
                        onClick={onNext}
                        disabled={
                            (currentStep === 1 && !responses.resetResult) ||
                            (currentStep === 2 && responses.resetResult !== 'cleared' && !responses.coolantLeaks) ||
                            (currentStep === 3 && responses.resetResult !== 'cleared' && responses.coolantLeaks === 'no' && 
                             (!responses.hillyTerrain || (responses.hillyTerrain === 'no' && !responses.changeoverDistance)))
                        }
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <span>Next</span>
                        <span><ArrowRight className="w-5 h-5 text-blue-400" /></span>
                    </button>
                )}
            </div>
        </div>
    );
}

// Export to global scope
window.GearboxWizard = GearboxWizard;

export default GearboxWizard;
