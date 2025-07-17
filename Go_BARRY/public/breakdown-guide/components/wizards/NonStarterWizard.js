// Non-Starter Wizard Component
function NonStarterWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.power}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Non-Starter Issue</h2>
              <p className="text-gray-300">Let's diagnose the starting problem step by step</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Initial Troubleshooting</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Step 1: Basic Checks</h4>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• Ensure the vehicle is out of gear and in neutral</p>
                    <p>• Check if any lights are illuminated or flashing on gear selector</p>
                    <p>• Turn off all instruments, including main switch to reset the bus</p>
                    <p>• Confirm engine bay door is closed and secure</p>
                    <p>• Turn vehicle back on and attempt to start engine</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After completing these checks, did the vehicle start?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('initialStart', 'yes')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialStart === 'yes'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {window.Icons.checkCircle}
                    <span>Yes - Vehicle started successfully</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('initialStart', 'no')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.initialStart === 'no'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {window.Icons.xCircle}
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
        if (responses.initialStart === 'yes') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  {window.Icons.checkCircle}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Problem Resolved</h2>
                <p className="text-gray-300">Vehicle has started successfully</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Recommended Action</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Advise driver to continue in service</p>
                  <p>• Vehicle reset has resolved the starting issue</p>
                  <p>• Monitor for any recurring problems</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  {window.Icons.info}
                  <div>
                    <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
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
                {window.Icons.tool}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Rear Start Attempt</h2>
              <p className="text-gray-300">Try starting from the rear of the vehicle</p>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
              <h3 className="text-lg font-semibold text-amber-200 mb-4">⚠️ Safety First</h3>
              <div className="space-y-3 text-gray-300">
                <p>Before attempting rear start, ensure:</p>
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-400/30">
                  <ul className="space-y-2 text-sm">
                    <li>• It is safe to attempt a rear start</li>
                    <li>• Remove or secure ties and lanyards over shoulder</li>
                    <li>• Prevent entanglement in the belt</li>
                    <li>• Exercise extreme caution</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">After attempting rear start, did the engine start?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => updateResponse('rearStart', 'yes')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rearStart === 'yes'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {window.Icons.checkCircle}
                    <span>Yes - Engine started via rear start</span>
                  </div>
                </button>
                <button
                  onClick={() => updateResponse('rearStart', 'no')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    responses.rearStart === 'no'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {window.Icons.xCircle}
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
        if (responses.rearStart === 'yes') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  {window.Icons.checkCircle}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Engine Started</h2>
                <p className="text-gray-300">Rear start was successful</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Next Actions</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Instruct driver to leave engine running until engineer attends</p>
                  <p>• Arrange changeover if necessary</p>
                  <p>• Do not turn off engine until engineering assistance arrives</p>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  {window.Icons.info}
                  <div>
                    <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                    <p className="text-sm text-gray-300 mt-1">
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
                {window.Icons.search}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Diagnostic Information</h2>
              <p className="text-gray-300">Gather information to assist engineers</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Ask the driver these questions:</h3>
              
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
                      Yes
                    </button>
                    <button
                      onClick={() => updateResponse('oilLight', 'no')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.oilLight === 'no'
                          ? 'border-green-400 bg-green-400/20 text-green-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                      }`}
                    >
                      No
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
                      Yes
                    </button>
                    <button
                      onClick={() => updateResponse('exhaustSmoke', 'no')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        responses.exhaustSmoke === 'no'
                          ? 'border-green-400 bg-green-400/20 text-green-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">Is the engine trying to start, or completely unresponsive?</p>
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
                Final Step
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.wrench}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Engineering Assistance Required</h2>
              <p className="text-gray-300">Vehicle needs professional diagnosis</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">Recommended Actions</h3>
              <div className="space-y-3 text-gray-300">
                <p>• Vehicle has failed to start after all troubleshooting attempts</p>
                <p>• Contact engineering team for professional assistance</p>
                <p>• Provide diagnostic information gathered in previous step</p>
                <p>• Arrange alternative transport if required</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Information for Engineers</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Oil Light:</strong> {responses.oilLight === 'yes' ? 'Illuminated' : 'Not illuminated'}</p>
                <p><strong>Exhaust Smoke:</strong> {responses.exhaustSmoke === 'yes' ? 'Present' : 'None observed'}</p>
                <p><strong>Engine Response:</strong> {
                  responses.engineResponse === 'trying' ? 'Engine trying to start' : 
                  responses.engineResponse === 'unresponsive' ? 'Engine completely unresponsive' : 'Unknown'
                }</p>
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                {window.Icons.info}
                <div>
                  <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                  <p className="text-sm text-gray-300 mt-1">
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