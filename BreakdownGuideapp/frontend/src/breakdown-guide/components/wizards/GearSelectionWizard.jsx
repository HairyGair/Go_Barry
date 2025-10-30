// Gear Selection Wizard Component
import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

function GearSelectionWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Gauge, Package, Tool, Wrench, Info } = Icons;
  
  const handleCompleteAssessment = () => {
    let finalDecision = 'CONTINUE';
    let notes = 'Gear selection assessment completed per standard operational procedures. ';
    
    // Check if issue was resolved through troubleshooting
    if (responses.systemReset === 'resolved') {
      finalDecision = 'CONTINUE';
      notes += 'System reset resolved gear selection issue. Vehicle may continue in service. ';
    } else if (responses.rampCheck === 'resolved') {
      finalDecision = 'CONTINUE';
      notes += 'Ramp positioning issue resolved gear selection problem. Vehicle may continue in service. ';
    } else if (responses.suspensionLight === 'reset_resolved') {
      finalDecision = 'CONTINUE';
      notes += 'Suspension light reset resolved gear selection issue. Vehicle may continue in service. ';
    } else if (responses.brakeOperation === 'resolved') {
      finalDecision = 'CONTINUE';
      notes += 'Proper footbrake operation resolved gear selection issue. Vehicle may continue in service. ';
    } else if (responses.brakeOperation === 'not_resolved') {
      finalDecision = 'STOP';
      notes += 'All troubleshooting steps completed without resolution. Vehicle must stop and await engineering assistance. ';
      notes += 'Transmission system requires professional diagnosis. Do not attempt to continue in service.';
    } else {
      finalDecision = 'AMBER';
      notes += 'Gear selection assessment in progress. Follow recommended troubleshooting steps.';
    }
    
    notes += ' Record incident in Tranzaura when stationary and in safe location.';
    
    onComplete(finalDecision, notes);
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Gauge className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Gear Selection Issue</h2>
              <p className="text-gray-300">Let's diagnose the transmission problem systematically</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">System Reset</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Step 1: Vehicle Reset</h4>
                  <p className="text-sm text-gray-300">
                    Instruct the driver to switch the bus off and re-set it, then attempt to start up in the usual manner
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After the system reset, can the driver now select gears?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('systemReset', 'resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.systemReset === 'resolved'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - System reset resolved the issue</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('systemReset', 'not_resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.systemReset === 'not_resolved'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No - Still unable to select gears</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!responses.systemReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        if (responses.systemReset === 'resolved') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Problem Resolved</h2>
                <p className="text-gray-300">System reset fixed the gear selection issue</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Advise driver to continue in service</p>
                  <p>• System reset has resolved the gear selection problem</p>
                  <p>• Monitor for any recurring issues</p>
                  <p>• Vehicle transmission is now functioning normally</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Tranzaura Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Log this incident in Tranzaura system when stationary and in a safe location
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
                  onClick={() => handleCompleteAssessment()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ramp Check</h2>
              <p className="text-gray-300">Check if the ramp is properly secured</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Ramp Inspection</h3>
              <div className="space-y-4">
                <div className="bg-amber-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-200 mb-2">Step 2: Ramp Position</h4>
                  <p className="text-sm text-gray-300">
                    Ask the driver to visually inspect if the ramp is correctly secured in its stowed position
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    The driver should lift the ramp and stow it again to ensure it is correctly secured
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After checking and re-securing the ramp, can gears now be selected?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('rampCheck', 'resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rampCheck === 'resolved'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - Ramp issue was the cause</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('rampCheck', 'not_resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rampCheck === 'not_resolved'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No - Still unable to select gears</span>
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
                disabled={!responses.rampCheck}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 3:
        if (responses.rampCheck === 'resolved') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Problem Resolved</h2>
                <p className="text-gray-300">Ramp positioning was causing the gear selection issue</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Advise driver to continue in service</p>
                  <p>• Ramp was not properly secured, causing transmission lockout</p>
                  <p>• Re-stowing the ramp has resolved the issue</p>
                  <p>• Ensure proper ramp securing procedure in future</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Tranzaura Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Log this incident in Tranzaura system when stationary and in a safe location
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
                  onClick={() => handleCompleteAssessment()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Suspension Light Check</h2>
              <p className="text-gray-300">Check dashboard suspension system</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Suspension System</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Step 3: Suspension Light</h4>
                  <p className="text-sm text-gray-300">
                    Ask the driver if the suspension light on the dashboard has been re-set before attempting to engage gear
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">Was there a suspension light that needed resetting?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('suspensionLight', 'reset_resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.suspensionLight === 'reset_resolved'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - Suspension light reset resolved the issue</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('suspensionLight', 'no_light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.suspensionLight === 'no_light'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <span>No suspension light was present</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('suspensionLight', 'not_resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.suspensionLight === 'not_resolved'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Light was reset but gears still won't select</span>
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
                disabled={!responses.suspensionLight}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 4:
        if (responses.suspensionLight === 'reset_resolved') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Problem Resolved</h2>
                <p className="text-gray-300">Suspension light reset fixed the gear selection issue</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Advise driver to continue in service</p>
                  <p>• Suspension system reset was required before gear engagement</p>
                  <p>• Transmission safety interlock was preventing gear selection</p>
                  <p>• System is now functioning normally</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Tranzaura Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Log this incident in Tranzaura system when stationary and in a safe location
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
                  onClick={() => handleCompleteAssessment()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Tool className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Brake Operation Check</h2>
              <p className="text-gray-300">Verify proper brake and gear selection procedure</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibent text-white mb-4">Brake System Check</h3>
              <div className="space-y-4">
                <div className="bg-amber-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-200 mb-2">Step 4: Footbrake Operation</h4>
                  <p className="text-sm text-gray-300">
                    Ensure the driver is pressing firmly on the footbrake while selecting the appropriate gear
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Many transmission systems require proper brake application before gear engagement
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After ensuring proper footbrake operation, can gears now be selected?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('brakeOperation', 'resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.brakeOperation === 'resolved'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - Proper brake operation resolved the issue</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('brakeOperation', 'not_resolved')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.brakeOperation === 'not_resolved'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No - Still unable to select gears</span>
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
                disabled={!responses.brakeOperation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Final Assessment
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${responses.brakeOperation === 'resolved' ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {responses.brakeOperation === 'resolved' ? <CheckCircle className="w-12 h-12" /> : <Wrench className="w-12 h-12" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {responses.brakeOperation === 'resolved' ? 'Problem Resolved' : 'Engineering Assistance Required'}
              </h2>
              <p className="text-gray-300">Final assessment and recommendations</p>
            </div>

            {responses.brakeOperation === 'resolved' ? (
              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Problem Resolved</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Advise driver to continue in service</p>
                  <p>• Proper footbrake operation was required for gear selection</p>
                  <p>• Transmission safety interlock was preventing gear engagement</p>
                  <p>• System is now functioning normally</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <h3 className="text-lg font-semibold text-red-200 mb-4">🛑 Engineering Assistance Required</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Vehicle must stop and await engineering assistance</p>
                  <p>• All troubleshooting steps have been completed</p>
                  <p>• Transmission system requires professional diagnosis</p>
                  <p>• Do not attempt to continue in service</p>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Summary of Troubleshooting</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>System Reset:</strong> {
                  responses.systemReset === 'resolved' ? 'Resolved the issue' :
                  responses.systemReset === 'not_resolved' ? 'Did not resolve' : 'Unknown'
                }</p>
                {responses.systemReset === 'not_resolved' && (
                  <>
                    <p><strong>Ramp Check:</strong> {
                      responses.rampCheck === 'resolved' ? 'Ramp issue found and fixed' :
                      responses.rampCheck === 'not_resolved' ? 'Ramp was not the issue' : 'Unknown'
                    }</p>
                    {responses.rampCheck === 'not_resolved' && (
                      <>
                        <p><strong>Suspension Light:</strong> {
                          responses.suspensionLight === 'reset_resolved' ? 'Reset resolved the issue' :
                          responses.suspensionLight === 'no_light' ? 'No suspension light present' :
                          responses.suspensionLight === 'not_resolved' ? 'Reset did not resolve' : 'Unknown'
                        }</p>
                        {(responses.suspensionLight === 'no_light' || responses.suspensionLight === 'not_resolved') && (
                          <p><strong>Brake Operation:</strong> {
                            responses.brakeOperation === 'resolved' ? 'Proper brake operation resolved the issue' :
                            responses.brakeOperation === 'not_resolved' ? 'Did not resolve - engineering required' : 'Unknown'
                          }</p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-blue-200">Tranzaura Reminder</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Log this incident in Tranzaura system when stationary and in a safe location
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
                onClick={() => handleCompleteAssessment()}
                className={`px-6 py-3 ${responses.brakeOperation === 'resolved' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white rounded-lg transition-colors`}
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

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Step {currentStep} of 5</span>
          <span className="text-sm text-gray-400">Gear Selection Assessment</span>
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
}

// Export to global scope
window.GearSelectionWizard = GearSelectionWizard;

export default GearSelectionWizard;
