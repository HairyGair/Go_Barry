// Non-Starter Wizard Component
// Aligned with operational safety procedures v1.3 and DVSA Standards
import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

function NonStarterWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Power, Tool, Search, Wrench, Info } = Icons;
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Power className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Non-Starter Assessment</h2>
              <p className="text-gray-300">Follow standard operational procedures to diagnose starting problems</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Step 1: Initial Troubleshooting</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-3">Instruct the driver to complete the following checks:</h4>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>1. Ensure the vehicle is out of gear and in neutral</p>
                    <p>2. Are any lights illuminated or flashing on the gear selector</p>
                    <p>3. Turn off all instruments, including the main switch, to reset the bus</p>
                    <p>4. Confirm the engine bay door is closed and secure</p>
                    <p>5. Turn the vehicle back on and attempt to start the engine</p>
                  </div>
                </div>

                <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-400/30">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">
                      Per DVSA standards, electrical system failures affecting engine starting can be classified as dangerous defects. Proper diagnosis is critical.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After completing these checks, did the vehicle start?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { updateResponse('initialStart', 'yes'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialStart === 'yes'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - Vehicle started successfully</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('initialStart', 'no'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialStart === 'no'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No - Vehicle still won't start</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!responses.initialStart}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        // Vehicle started after initial troubleshooting
        if (responses.initialStart === 'yes') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Vehicle Started Successfully</h2>
                <p className="text-gray-300">Initial troubleshooting resolved the issue</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action - CONTINUE</h3>
                <div className="space-y-3 text-gray-300">
                  <p className="font-medium">• Advise the driver to continue in service</p>
                  <p>• The vehicle reset has resolved the starting issue</p>
                  <p>• Monitor for any recurring problems</p>
                  <p>• Ensure vehicles permitted to continue have a planned changeover organised promptly</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Reporting Device Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Record this incident in the reporting device (EP Morris code) when the bus is stationary and in a safe location
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-400/30">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Escalate persistent, unwarranted non-starter reports to the depot management team to address any unnecessary service disruptions effectively.
                  </p>
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
                  onClick={() => onComplete('CONTINUE', 'Vehicle started after initial troubleshooting. Driver advised to continue in service.')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        // Vehicle didn't start - proceed to rear start attempt
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Tool className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Rear Start Attempt</h2>
              <p className="text-gray-300">Attempt to start the vehicle from the rear</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ CRITICAL SAFETY INSTRUCTIONS</h3>
              <div className="space-y-3 text-gray-300">
                <p className="font-medium">Before attempting rear start:</p>
                <ol className="space-y-2 text-sm ml-4">
                  <li>1. Confirm it is safe to attempt a rear start</li>
                  <li>2. Advise the driver to exercise caution when attempting a rear start</li>
                  <li className="text-red-200 font-medium">3. Ensure that items such as ties and lanyards are either removed or securely placed over the shoulder to prevent entanglement in the belt</li>
                </ol>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Rear Start Procedure</h3>
              <div className="space-y-3 text-gray-300">
                <p>Have the driver attempt to start the engine from the rear start position following proper safety procedures.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After attempting rear start, did the engine start?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { updateResponse('rearStart', 'yes'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rearStart === 'yes'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Yes - Engine started via rear start</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('rearStart', 'no'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rearStart === 'no'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No - Vehicle still won't start</span>
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
                disabled={!responses.rearStart}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 3:
        // Vehicle started with rear start
        if (responses.rearStart === 'yes') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Engine Started - Changeover Required</h2>
                <p className="text-gray-300">Rear start was successful but vehicle needs attention</p>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                <h3 className="text-lg font-semibold text-amber-200 mb-4">Required Actions - AMBER</h3>
                <div className="space-y-3 text-gray-300">
                  <p className="font-medium text-amber-200">• Instruct the driver to leave it running until an engineer attends</p>
                  <p className="font-medium text-amber-200">• Arrange a changeover if necessary</p>
                  <p>• Do NOT turn off engine until engineering assistance arrives</p>
                  <p>• Vehicle requires engineering inspection at earliest opportunity</p>
                </div>
              </div>

              <div className="bg-red-500/20 rounded-lg p-4 border border-red-400/30">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-200">⚠️ Critical Instruction</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Engine MUST remain running. Turning off the engine may result in complete failure to restart.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Reporting Device Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Record this incident in the reporting device (EP Morris code) when the bus is stationary and in a safe location
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
                  onClick={() => onComplete('AMBER', 'Vehicle started via rear start. Engine must remain running until engineer attends. Changeover required.')}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        // Vehicle failed all start attempts - gather diagnostic info
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Step 3: Gather Diagnostic Information</h2>
              <p className="text-gray-300">Collect information to assist engineers in diagnosing the issue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Ask the driver the following questions:</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-white font-medium mb-3">Is the oil light illuminated?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateResponse('oilLight', 'yes')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.oilLight === 'yes'
                          ? 'border-red-400 bg-red-400/20 text-red-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                      }`}
                    >
                      Yes - Oil light ON
                    </button>
                    <button
                      onClick={() => updateResponse('oilLight', 'no')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.oilLight === 'no'
                          ? 'border-green-400 bg-green-400/20 text-green-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                      }`}
                    >
                      No - Oil light OFF
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">Was there smoke coming from the exhaust?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateResponse('exhaustSmoke', 'yes')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.exhaustSmoke === 'yes'
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                      }`}
                    >
                      Yes - Smoke present
                    </button>
                    <button
                      onClick={() => updateResponse('exhaustSmoke', 'no')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.exhaustSmoke === 'no'
                          ? 'border-green-400 bg-green-400/20 text-green-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                      }`}
                    >
                      No - No smoke
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">Is the engine trying to start, or is it completely unresponsive?</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => updateResponse('engineResponse', 'trying')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.engineResponse === 'trying'
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                      }`}
                    >
                      Engine is trying to start (turning over)
                    </button>
                    <button
                      onClick={() => updateResponse('engineResponse', 'unresponsive')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.engineResponse === 'unresponsive'
                          ? 'border-red-400 bg-red-400/20 text-red-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                      }`}
                    >
                      Engine is completely unresponsive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-400/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  This diagnostic information will help engineers prepare the correct tools and parts before attending the vehicle.
                </p>
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
                disabled={!responses.oilLight || !responses.exhaustSmoke || !responses.engineResponse}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Final Assessment
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">STOP - Engineering Assistance Required</h2>
              <p className="text-gray-300">Vehicle cannot be started - await engineering</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">Immediate Actions - STOP</h3>
              <div className="space-y-3 text-gray-300">
                <p className="font-medium text-red-200">• Vehicle has failed to start after all troubleshooting attempts</p>
                <p className="font-medium text-red-200">• Instruct driver to stop and await engineering assistance</p>
                <p>• Provide diagnostic information to engineering team</p>
                <p>• Arrange alternative transport if required</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Diagnostic Information for Engineers</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Initial troubleshooting:</strong> Failed</p>
                <p><strong>Rear start attempt:</strong> Failed</p>
                <p><strong>Oil Light:</strong> {responses.oilLight === 'yes' ? 'Illuminated ⚠️' : 'Not illuminated'}</p>
                <p><strong>Exhaust Smoke:</strong> {responses.exhaustSmoke === 'yes' ? 'Present ⚠️' : 'None observed'}</p>
                <p><strong>Engine Response:</strong> {
                  responses.engineResponse === 'trying' ? 'Engine trying to start (turning over)' : 
                  responses.engineResponse === 'unresponsive' ? 'Engine completely unresponsive ⚠️' : 'Unknown'
                }</p>
              </div>
            </div>

            <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-400/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-200">DVSA Compliance Note</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Per DVSA's "Categorisation of Vehicle Defects", complete failure of starting system may constitute a dangerous defect requiring immediate prohibition (PG9). Vehicle must not be moved until repaired.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-200">Reporting Device Reminder</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Record this incident immediately in the reporting device (EP Morris code) with all diagnostic information
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
                onClick={async () => {
                  const diagnosticInfo = `Oil light: ${responses.oilLight || 'unknown'}, Exhaust smoke: ${responses.exhaustSmoke || 'unknown'}, Engine response: ${responses.engineResponse || 'unknown'}`;
                  const decision = 'STOP';
                  const notes = `Non-starter - all troubleshooting failed. ${diagnosticInfo}. Engineering assistance required immediately.`;
                  
                  // Log breakdown for non-starter incident
                  try {
                    await window.logBreakdown({
                      supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                      vehicleReg: window.selectedReg || 'Unknown',
                      fleetNo: window.selectedFleetNo || 'Unknown',
                      breakdownType: 'Non-Starter',
                      decision: decision,
                      timestamp: new Date().toISOString()
                    });
                    console.log('✅ Non-Starter breakdown logged successfully');
                  } catch (error) {
                    console.error('Failed to log non-starter breakdown:', error);
                    // Don't block completion if logging fails
                  }
                  onComplete(decision, notes);
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
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
    <div className="max-w-4xl mx-auto">
      {renderStep()}
    </div>
  );
}

// Export to global scope
window.NonStarterWizard = NonStarterWizard;

export default NonStarterWizard;
