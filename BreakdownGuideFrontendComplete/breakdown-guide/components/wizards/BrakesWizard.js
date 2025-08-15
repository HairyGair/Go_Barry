// Brakes Wizard Component
function BrakesWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.shield}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Brake System Check</h2>
              <p className="text-gray-300">Critical safety system assessment</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">🛑 Safety Critical</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                Brake defects are safety critical. If any major issues are identified, the vehicle must stop immediately and await engineering assistance.
              </p>
            </div>

            {/* Location Input */}
            <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30 mb-6">
              <h4 className="text-sm font-semibold text-blue-200 mb-3">📍 Current Location</h4>
              <input
                type="text"
                value={responses.location || ''}
                onChange={(e) => updateResponse('location', e.target.value)}
                placeholder="e.g., Newcastle Central Station, A1 Northbound, Team Valley"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 text-sm"
              />
              <p className="text-xs text-blue-300/80 mt-1">Please specify where the vehicle is currently located</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Is the driver experiencing any of these brake issues?</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('brakeToFloor', !responses.brakeToFloor)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brakeToFloor
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brakeToFloor ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.brakeToFloor && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Brake pedal sinks to the floor with little or no resistance</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('delayedBraking', !responses.delayedBraking)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.delayedBraking
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.delayedBraking ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.delayedBraking && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Braking response is delayed or ineffective</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('unusualNoises', !responses.unusualNoises)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.unusualNoises
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.unusualNoises ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.unusualNoises && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Unusual noises during braking (grinding, squealing)</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('brakeLeaks', !responses.brakeLeaks)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brakeLeaks
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brakeLeaks ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.brakeLeaks && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Visible leaks in the brake system (brake fluid)</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('brakesGrabbing', !responses.brakesGrabbing)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brakesGrabbing
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brakesGrabbing ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.brakesGrabbing && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Brakes are grabbing or shuddering</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('redABSLight', !responses.redABSLight)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.redABSLight
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.redABSLight ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.redABSLight && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>Red ABS/EBS light is illuminated</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('noBrakeIssues', !responses.noBrakeIssues)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.noBrakeIssues
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.noBrakeIssues ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.noBrakeIssues && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>None of the above issues</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        );

      case 2:
        const hasCriticalIssue = responses.brakeToFloor || responses.delayedBraking || 
                                responses.unusualNoises || responses.brakeLeaks || 
                                responses.brakesGrabbing || responses.redABSLight;
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${hasCriticalIssue ? 'bg-red-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {hasCriticalIssue ? window.Icons.alertTriangle : window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Initial Assessment</h2>
              <p className="text-gray-300">
                {hasCriticalIssue ? 'Critical brake fault detected' : 'No critical issues detected'}
              </p>
            </div>

            {hasCriticalIssue ? (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <h3 className="text-lg font-semibold text-red-200 mb-4">🛑 CRITICAL BRAKE FAULT DETECTED</h3>
                <div className="space-y-4 text-red-300/90">
                  <p className="font-semibold">
                    The vehicle has a safety-critical brake defect and must stop immediately.
                  </p>
                  <div>
                    <p className="mb-2">Advise the driver to:</p>
                    <ol className="list-decimal ml-6 space-y-2 text-sm">
                      <li>Find a safe location to stop the vehicle</li>
                      <li>Switch off the engine</li>
                      <li>Apply the parking brake</li>
                      <li>Await engineering assistance</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                  <h3 className="text-lg font-semibold text-green-200 mb-4">No Critical Issues Detected</h3>
                  <p className="text-green-300/90">
                    The brake system appears to be functioning normally.
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Is the driver reporting any other brake concerns?</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => updateResponse('otherBrakeConcerns', 'yes')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        responses.otherBrakeConcerns === 'yes'
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          responses.otherBrakeConcerns === 'yes' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                        }`}>
                          {responses.otherBrakeConcerns === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span>Yes - driver has other brake concerns</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => updateResponse('otherBrakeConcerns', 'no')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        responses.otherBrakeConcerns === 'no'
                          ? 'border-green-400 bg-green-400/20 text-green-200'
                          : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          responses.otherBrakeConcerns === 'no' ? 'border-green-400 bg-green-400' : 'border-white/50'
                        }`}>
                          {responses.otherBrakeConcerns === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span>No - brakes are operating normally</span>
                      </div>
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
                disabled={!hasCriticalIssue && !responses.otherBrakeConcerns}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        const needsImmediate = responses.brakeToFloor || responses.delayedBraking || 
                              responses.unusualNoises || responses.brakeLeaks || 
                              responses.brakesGrabbing || responses.redABSLight;
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${needsImmediate ? 'bg-red-500/20' : responses.otherBrakeConcerns === 'yes' ? 'bg-amber-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {needsImmediate ? window.Icons.alertTriangle : responses.otherBrakeConcerns === 'yes' ? window.Icons.wrench : window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Action Required</h2>
              <p className="text-gray-300">Final recommendations and next steps</p>
            </div>

            {needsImmediate ? (
              <div className="space-y-6">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                  <h3 className="text-lg font-semibold text-red-200 mb-4">Immediate Actions:</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-red-300/90 text-sm">
                    <li>Vehicle must remain stationary</li>
                    <li>Contact engineering immediately</li>
                    <li>Arrange passenger transfer if needed</li>
                    <li>Complete incident report in Tranzaura</li>
                  </ol>
                </div>
                
                {(responses.brakeToFloor || responses.delayedBraking) && (
                  <div className="bg-red-600/30 backdrop-blur-sm rounded-lg p-6 border-2 border-red-500/50 animate-pulse">
                    <h3 className="text-lg font-bold text-red-100 mb-4 flex items-center">
                      <span className="mr-2">🚨</span>
                      CRITICAL: Total Brake Failure Protocol
                    </h3>
                    <div className="space-y-3 text-red-200">
                      <p className="font-semibold">
                        If driver reports COMPLETE LOSS OF BRAKES:
                      </p>
                      <div className="bg-red-800/50 rounded p-4 border border-red-400">
                        <p className="font-bold mb-2">EP Morris Notification:</p>
                        <ol className="list-decimal ml-6 space-y-1 text-sm">
                          <li>Send immediately as: <span className="font-mono bg-red-900/50 px-2 py-1 rounded">"URGENT PLEASE READ"</span></li>
                          <li>When complete, change to code: <span className="font-mono bg-red-900/50 px-2 py-1 rounded">BDBR - Brake Issue</span></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                  <h3 className="text-lg font-semibold text-amber-200 mb-4">Engineering Contact</h3>
                  <p className="text-amber-300/90 mb-3">Provide engineering with:</p>
                  <ul className="list-disc ml-6 text-amber-300/90 text-sm space-y-1">
                    <li>Vehicle registration/fleet number</li>
                    <li>Exact location</li>
                    <li>Specific brake symptoms</li>
                    <li>Number of passengers on board</li>
                  </ul>
                  <div className="mt-4 bg-amber-600/20 rounded p-3 border border-amber-400/40">
                    <p className="text-amber-200 text-sm font-semibold">
                      📋 EP Morris: Record as code <span className="font-mono bg-amber-900/50 px-2 py-1 rounded">BDBR - Brake Issue</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : responses.otherBrakeConcerns === 'yes' ? (
              <div className="space-y-6">
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                  <h3 className="text-lg font-semibold text-amber-200 mb-4">Precautionary Changeover</h3>
                  <p className="text-amber-300/90 mb-4">
                    While no critical issues were identified, arrange a vehicle changeover at the next convenient location due to driver concerns.
                  </p>
                  
                  <div className="space-y-3">
                    <p className="font-semibold text-amber-200">Actions:</p>
                    <ul className="list-disc ml-6 space-y-2 text-amber-300/90 text-sm">
                      <li>Vehicle can continue to next changeover point</li>
                      <li>Driver should remain vigilant and stop if conditions worsen</li>
                      <li>Log the concern in Tranzaura</li>
                      <li>Arrange engineering inspection at depot</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 bg-amber-600/20 rounded p-3 border border-amber-400/40">
                    <p className="text-amber-200 text-sm font-semibold">
                      📋 EP Morris: Record as code <span className="font-mono bg-amber-900/50 px-2 py-1 rounded">BDBR - Brake Issue</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <h3 className="text-lg font-semibold text-green-200 mb-4">Continue in Service</h3>
                <div className="space-y-3 text-green-300/90">
                  <p>The brake system is functioning normally. The vehicle can continue in service.</p>
                  <p>Remind the driver to report any changes in brake performance immediately.</p>
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 4:
        const criticalIssues = responses.brakeToFloor || responses.delayedBraking || 
                              responses.unusualNoises || responses.brakeLeaks || 
                              responses.brakesGrabbing || responses.redABSLight;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.fileText}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Summary & Documentation</h2>
              <p className="text-gray-300">Assessment complete</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-blue-200 mb-2">Issues Identified:</p>
                  <ul className="list-disc ml-6 space-y-1 text-gray-300 text-sm">
                    {responses.brakeToFloor && <li>Brake pedal sinking to floor</li>}
                    {responses.delayedBraking && <li>Delayed/ineffective braking</li>}
                    {responses.unusualNoises && <li>Unusual braking noises</li>}
                    {responses.brakeLeaks && <li>Brake system leaks</li>}
                    {responses.brakesGrabbing && <li>Brakes grabbing/shuddering</li>}
                    {responses.redABSLight && <li>Red ABS/EBS light</li>}
                    {responses.noBrakeIssues && <li className="text-green-300">No critical issues</li>}
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-blue-200 mb-2">Action Taken:</p>
                  <p className="text-gray-300 text-sm">
                    {criticalIssues
                      ? "🛑 Vehicle stopped - Awaiting engineering"
                      : responses.otherBrakeConcerns === 'yes'
                      ? "⚠️ Changeover arranged at next convenient location"
                      : "✅ Vehicle continuing in service"}
                  </p>
                </div>
                
                {(responses.brakeToFloor || responses.delayedBraking) && (
                  <div className="bg-red-600/20 rounded p-3 border border-red-400/50 mt-3">
                    <p className="font-semibold text-red-200 text-sm">
                      🚨 EP Morris: Sent as "URGENT PLEASE READ" → Code: BDBR
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                {window.Icons.info}
                <div>
                  <h4 className="font-semibold text-blue-200">Important Reminders</h4>
                  <ul className="list-disc ml-6 space-y-1 text-blue-300/90 text-sm mt-2">
                    <li>Log all defects in Tranzaura immediately</li>
                    <li>Record ALL brake issues in EP Morris as: <span className="font-mono bg-blue-900/50 px-1 rounded">BDBR</span></li>
                    <li>Ensure driver safety briefing is complete</li>
                    <li>Monitor for any repeat brake issues</li>
                    <li>Report persistent brake issues to depot management</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Remember:</strong> Safety is non-negotiable. When in doubt about brake system integrity, always err on the side of caution and seek engineering advice.
              </p>
              <p className="text-sm text-gray-300 mt-2">
                <strong className="text-white">Note:</strong> Report to depot management if a driver persistently reports brake problems that, when investigated by engineering, reveal no fault.
              </p>
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
                  // Log breakdown if critical issues detected
                  if (criticalIssues) {
                    try {
                      await window.logBreakdown({
                        supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                        vehicleReg: window.selectedReg || 'Unknown',
                        fleetNo: window.selectedFleetNo || 'Unknown',
                        breakdownType: 'Brakes',
                        timestamp: new Date().toISOString()
                      });
                      console.log('✅ Brakes breakdown logged successfully');
                    } catch (error) {
                      console.error('Failed to log brakes breakdown:', error);
                      // Don't block completion if logging fails
                    }
                  }
                  onComplete();
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
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
window.BrakesWizard = BrakesWizard;