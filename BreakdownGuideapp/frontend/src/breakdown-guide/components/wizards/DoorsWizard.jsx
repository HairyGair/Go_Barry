// Doors Wizard Component
import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

function DoorsWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Door, Package, Tool, Info, Wind, Gauge } = Icons;
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Door className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Door System Issue</h2>
              <p className="text-gray-300">Let's diagnose the door problem systematically</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Initial Checks</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Step 1: Door Control Buttons</h4>
                  <p className="text-sm text-gray-300">
                    Ask the driver to check if any door control buttons are stuck (both inside and outside the bus)
                  </p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Step 2: Obstructions</h4>
                  <p className="text-sm text-gray-300">
                    Confirm there are no obstructions behind or under the doors
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">Are any door control buttons stuck or are there obstructions?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { updateResponse('initialChecks', 'buttons_stuck'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialChecks === 'buttons_stuck'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>Yes - Buttons are stuck</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('initialChecks', 'obstructions'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialChecks === 'obstructions'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-amber-400" />
                    <span>Yes - Obstructions found</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('initialChecks', 'clear'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialChecks === 'clear'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>No - Controls and doors are clear</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!responses.initialChecks}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        if (responses.initialChecks === 'buttons_stuck' || responses.initialChecks === 'obstructions') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Tool className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Issue Identified</h2>
                <p className="text-gray-300">Basic problem found and resolved</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  {responses.initialChecks === 'buttons_stuck' && (
                    <>
                      <p>• Unstick the door control buttons</p>
                      <p>• Test door operation after freeing buttons</p>
                      <p>• Check both interior and exterior controls</p>
                    </>
                  )}
                  {responses.initialChecks === 'obstructions' && (
                    <>
                      <p>• Remove obstructions from behind/under doors</p>
                      <p>• Test door operation after clearing obstructions</p>
                      <p>• Ensure door tracks are clear</p>
                    </>
                  )}
                  <p>• If problem persists, continue with air system checks</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Recording Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Advise the driver to log this incident in their reporting device when stationary and in a safe location
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
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Wind className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Air System Check</h2>
              <p className="text-gray-300">Check the pneumatic door system</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Air System Diagnostics</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Listen for Air Leaks</h4>
                  <p className="text-sm text-gray-300">
                    Instruct the driver to check for air leaks around the door system
                  </p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Check Air Pressure</h4>
                  <p className="text-sm text-gray-300">
                    Ask the driver to monitor air pressure and try to build it up
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">What did the air system check reveal?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { updateResponse('airSystemCheck', 'air_leaks'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.airSystemCheck === 'air_leaks'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>Air leaks detected</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('airSystemCheck', 'low_pressure'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.airSystemCheck === 'low_pressure'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Gauge className="w-5 h-5 text-amber-400" />
                    <span>Low air pressure</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('airSystemCheck', 'pressure_resolved'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.airSystemCheck === 'pressure_resolved'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Building pressure resolved the issue</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('airSystemCheck', 'no_improvement'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.airSystemCheck === 'no_improvement'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No improvement after pressure build-up</span>
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
                disabled={!responses.airSystemCheck}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 3:
        if (responses.airSystemCheck === 'pressure_resolved') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Problem Resolved</h2>
                <p className="text-gray-300">Air pressure build-up fixed the door issue</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Door system is now functioning properly</p>
                  <p>• Advise driver to continue in service</p>
                  <p>• Monitor doors for any recurring issues</p>
                  <p>• Low air pressure was the root cause</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Recording Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Advise the driver to log this incident in their reporting device when stationary and in a safe location
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
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Safety Assessment</h2>
              <p className="text-gray-300">Determine if doors can continue safely</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Safety Critical Defects</h3>
              <p className="text-white mb-4">STOP and seek engineering assistance if ANY of these are present:</p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Doors are jammed closed</p>
                <p>• Doors cannot be retained in the closed position</p>
                <p>• Door hinges, catches, or pillars are loose, insecure, weakened</p>
                <p>• Doors make opening difficult or likely to open inadvertently</p>
                <p>• Doors are stiff and cannot fully open or close</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">Are any of the above safety-critical defects present?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { updateResponse('safetyDefects', 'present'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.safetyDefects === 'present'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Yes - Safety-critical defects are present</span>
                  </div>
                </button>
                <button
                  onClick={() => { updateResponse('safetyDefects', 'none'); onNext(); }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.safetyDefects === 'none'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>No - None of these defects are present</span>
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
                disabled={!responses.safetyDefects}
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
              <div className={`mx-auto w-16 h-16 ${responses.safetyDefects === 'present' ? 'bg-red-500/20' : 'bg-amber-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {responses.safetyDefects === 'present' ? <XCircle className="w-8 h-8 text-red-400" /> : <AlertTriangle className="w-8 h-8 text-amber-400" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {responses.safetyDefects === 'present' ? 'STOP - Engineering Required' : 'Continue with Changeover'}
              </h2>
              <p className="text-gray-300">Final recommendation based on assessment</p>
            </div>

            {responses.safetyDefects === 'present' ? (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <h3 className="text-lg font-semibold text-red-200 mb-4">🛑 STOP Immediately</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Vehicle must STOP and await engineering assistance</p>
                  <p>• Safety-critical door defects present</p>
                  <p>• Do not continue in service under any circumstances</p>
                  <p>• Contact engineering team immediately</p>
                  <p>• Passenger safety is compromised</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                <h3 className="text-lg font-semibold text-amber-200 mb-4">Continue to Changeover</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• No safety-critical defects identified</p>
                  <p>• Advise driver to continue to next convenient changeover point</p>
                  <p>• Arrange bus changeover at earliest opportunity</p>
                  <p>• Monitor door operation during journey</p>
                  <p>• Report any worsening of condition immediately</p>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Summary of Assessment</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Initial Checks:</strong> {
                  responses.initialChecks === 'buttons_stuck' ? 'Door control buttons stuck' :
                  responses.initialChecks === 'obstructions' ? 'Obstructions found' :
                  responses.initialChecks === 'clear' ? 'Controls and doors clear' : 'Unknown'
                }</p>
                {responses.initialChecks === 'clear' && (
                  <p><strong>Air System:</strong> {
                    responses.airSystemCheck === 'air_leaks' ? 'Air leaks detected' :
                    responses.airSystemCheck === 'low_pressure' ? 'Low air pressure' :
                    responses.airSystemCheck === 'pressure_resolved' ? 'Resolved by building pressure' :
                    responses.airSystemCheck === 'no_improvement' ? 'No improvement after pressure build-up' : 'Unknown'
                  }</p>
                )}
                <p><strong>Safety Defects:</strong> {responses.safetyDefects === 'present' ? 'Safety-critical defects present' : 'No safety-critical defects'}</p>
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-blue-200">Recording Reminder</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Advise the driver to log this incident in their reporting device when stationary and in a safe location
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
                  // Log breakdown if safety defects are present
                  if (responses.safetyDefects === 'present') {
                    try {
                      await window.logBreakdown({
                        supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                        vehicleReg: window.selectedReg || 'Unknown',
                        fleetNo: window.selectedFleetNo || 'Unknown',
                        breakdownType: 'Doors',
                        timestamp: new Date().toISOString()
                      });
                      console.log('✅ Doors breakdown logged successfully');
                    } catch (error) {
                      console.error('Failed to log doors breakdown:', error);
                      // Don't block completion if logging fails
                    }
                  }
                  onComplete();
                }}
                className={`px-6 py-3 ${responses.safetyDefects === 'present' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded-lg transition-colors`}
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
window.DoorsWizard = DoorsWizard;

export default DoorsWizard;
