const WarningLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
  const [showUrgentWarning, setShowUrgentWarning] = React.useState(false);

  React.useEffect(() => {
    // Check if we need to show urgent warning based on responses
    if (responses.lightColor === 'red' && responses.lightBehavior === 'continuous') {
      setShowUrgentWarning(true);
    }
  }, [responses.lightColor, responses.lightBehavior]);

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-300 font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Safety Critical System
              </p>
            </div>

            <h3 className="text-xl font-semibold text-white">Which warning lights are illuminated?</h3>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                <input
                  type="radio"
                  name="warningType"
                  value="single"
                  checked={responses.warningType === 'single'}
                  onChange={(e) => updateResponse('warningType', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-white">Single Warning Light</div>
                  <div className="text-sm text-gray-400">One specific warning light is on</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                <input
                  type="radio"
                  name="warningType"
                  value="multiple"
                  checked={responses.warningType === 'multiple'}
                  onChange={(e) => updateResponse('warningType', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-white">Multiple Warning Lights</div>
                  <div className="text-sm text-gray-400">Several warning lights are illuminated</div>
                </div>
              </label>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Action Required:</strong> Driver should note all illuminated lights and be ready to describe their location, color, and what they refer to.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Light Color and Behavior</h3>
            
            <div>
              <h4 className="font-medium text-white mb-3">What color are the warning light(s)?</h4>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <input
                    type="radio"
                    name="lightColor"
                    value="red"
                    checked={responses.lightColor === 'red'}
                    onChange={(e) => updateResponse('lightColor', e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-red-400">RED Warning Light(s)</div>
                    <div className="text-sm text-gray-400">Critical system warning</div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <input
                    type="radio"
                    name="lightColor"
                    value="amber"
                    checked={responses.lightColor === 'amber'}
                    onChange={(e) => updateResponse('lightColor', e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-amber-400">AMBER Warning Light(s)</div>
                    <div className="text-sm text-gray-400">Caution required</div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                  <input
                    type="radio"
                    name="lightColor"
                    value="mixed"
                    checked={responses.lightColor === 'mixed'}
                    onChange={(e) => updateResponse('lightColor', e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-white">Both RED and AMBER</div>
                    <div className="text-sm text-gray-400">Multiple warning lights of different colors</div>
                  </div>
                </label>
              </div>
            </div>

            {(responses.lightColor === 'red' || responses.lightColor === 'mixed') && (
              <div>
                <h4 className="font-medium text-white mb-3">Is the RED light continuous or intermittent?</h4>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="radio"
                      name="lightBehavior"
                      value="continuous"
                      checked={responses.lightBehavior === 'continuous'}
                      onChange={(e) => updateResponse('lightBehavior', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white">Continuous (Always On)</div>
                      <div className="text-sm text-gray-400">Light stays on constantly</div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="radio"
                      name="lightBehavior"
                      value="intermittent"
                      checked={responses.lightBehavior === 'intermittent'}
                      onChange={(e) => updateResponse('lightBehavior', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white">Intermittent (Flashing)</div>
                      <div className="text-sm text-gray-400">Light flashes on and off</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 font-semibold mb-2">Go-Check Recording</p>
              <p className="text-sm text-gray-300">
                Ensure driver uploads an image of the dashboard showing all warning lights to Go-Check for proper documentation.
              </p>
            </div>
          </div>
        );

      case 3:
        const isRedContinuous = responses.lightColor === 'red' && responses.lightBehavior === 'continuous';
        const isRedIntermittent = responses.lightColor === 'red' && responses.lightBehavior === 'intermittent';
        const isMixedWithRed = responses.lightColor === 'mixed';
        const isAmberOnly = responses.lightColor === 'amber';

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Required Actions</h3>
            
            {(isRedContinuous || (isMixedWithRed && responses.lightBehavior === 'continuous')) && (
              <div className="bg-red-500/30 border-2 border-red-500 rounded-lg p-6 animate-pulse">
                <div className="flex items-start gap-3">
                  <svg className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-bold text-red-300 mb-2">STOP IMMEDIATELY</h4>
                    <p className="text-white font-medium mb-3">
                      Continuous RED warning light indicates a critical system failure.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-200">
                      <li>Driver must stop the vehicle in a safe location immediately</li>
                      <li>Switch off the engine</li>
                      <li>Do NOT attempt to continue driving</li>
                      <li>Await assistance from engineering</li>
                      <li>Record defect in Go-Check with photo of warning light</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {(isRedIntermittent || (isMixedWithRed && responses.lightBehavior === 'intermittent')) && (
              <div className="bg-amber-500/30 border-2 border-amber-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-bold text-amber-300 mb-2">Stop and Assess</h4>
                    <p className="text-white font-medium mb-3">
                      Intermittent RED warning light requires immediate assessment.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-200">
                      <li>Stop in a safe location</li>
                      <li>Switch off engine and restart</li>
                      <li>If light remains off after restart:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Continue to next safe changeover point</li>
                          <li>Arrange immediate changeover</li>
                          <li>Monitor closely - if light returns, stop immediately</li>
                        </ul>
                      </li>
                      <li>If light persists or reappears:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Stop and await engineering assistance</li>
                        </ul>
                      </li>
                      <li>Record in Go-Check with photo</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {isAmberOnly && (
              <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-bold text-amber-300 mb-2">Continue with Caution</h4>
                    <p className="text-white font-medium mb-3">
                      AMBER warning lights indicate caution required but not immediate danger.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-200">
                      <li>Continue to next convenient changeover point</li>
                      <li>Monitor the situation closely</li>
                      <li>If ABS light, follow specific ABS guidance (Section 3)</li>
                      <li>Arrange changeover at earliest opportunity</li>
                      <li>Record in Go-Check with photo of warning light</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Safety-Critical System Check</h4>
              <p className="text-sm text-gray-300">
                If any warning light affects directional control, braking, or vehicle stability (even if amber), 
                the vehicle must stop and await engineering assistance.
              </p>
            </div>

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 font-semibold mb-2">Engineering Escalation</p>
              <p className="text-sm text-gray-300">
                If uncertain about any warning light's meaning or severity, always err on the side of caution. 
                Stop and seek immediate engineering advice.
              </p>
            </div>
          </div>
        );

      case 4:
        const needsImmediateStop = responses.lightColor === 'red' && responses.lightBehavior === 'continuous';
        const needsChangeover = responses.lightColor === 'amber' || 
                               (responses.lightColor === 'red' && responses.lightBehavior === 'intermittent') ||
                               responses.lightColor === 'mixed';

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Summary & Next Steps</h3>
            
            <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">Reported Issue:</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• Warning Type: {responses.warningType === 'single' ? 'Single warning light' : 'Multiple warning lights'}</li>
                  <li>• Light Color: <span className={responses.lightColor === 'red' ? 'text-red-400' : responses.lightColor === 'amber' ? 'text-amber-400' : 'text-white'}>
                    {responses.lightColor?.toUpperCase()}
                  </span></li>
                  {(responses.lightColor === 'red' || responses.lightColor === 'mixed') && (
                    <li>• Behavior: {responses.lightBehavior === 'continuous' ? 'Continuous (Always On)' : 'Intermittent (Flashing)'}</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Actions Taken:</h4>
                <ul className="space-y-1 text-gray-300">
                  {needsImmediateStop && (
                    <>
                      <li>✓ Driver instructed to STOP IMMEDIATELY</li>
                      <li>✓ Engineering assistance requested</li>
                      <li>✓ Vehicle must not continue in service</li>
                    </>
                  )}
                  {!needsImmediateStop && needsChangeover && (
                    <>
                      <li>✓ Driver can continue to changeover point</li>
                      <li>✓ Changeover must be arranged immediately</li>
                      <li>✓ Situation to be monitored closely</li>
                    </>
                  )}
                  <li>✓ Defect to be recorded in Go-Check with photo</li>
                </ul>
              </div>
            </div>

            {needsImmediateStop && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-300 font-semibold">
                  ⚠️ Vehicle is NOT safe to continue - Engineering attendance required
                </p>
              </div>
            )}

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <h4 className="font-medium text-blue-300 mb-2">Go-Check Reminder</h4>
              <p className="text-sm text-gray-300">
                Ensure the driver has:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 mt-2">
                <li>Recorded the warning light defect in Go-Check</li>
                <li>Uploaded a clear photo of the dashboard showing the warning light(s)</li>
                <li>Added notes about light color, location, and behavior</li>
              </ul>
            </div>

            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300">
                Troubleshooting complete. Follow all safety protocols and maintain communication with the driver.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {showUrgentWarning && currentStep === 3 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-red-900/90 border-2 border-red-500 rounded-lg p-6 max-w-md animate-pulse">
            <h3 className="text-xl font-bold text-red-300 mb-3">⚠️ CRITICAL SAFETY ALERT</h3>
            <p className="text-white mb-4">
              Continuous RED warning light detected. Vehicle must STOP IMMEDIATELY and await engineering assistance.
            </p>
            <button
              onClick={() => setShowUrgentWarning(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
      
      {renderStep()}
      
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        {currentStep < 4 ? (
          <button
            onClick={onNext}
            disabled={
              (currentStep === 1 && !responses.warningType) ||
              (currentStep === 2 && !responses.lightColor) ||
              (currentStep === 2 && (responses.lightColor === 'red' || responses.lightColor === 'mixed') && !responses.lightBehavior)
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Complete
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Export to global scope
window.WarningLightsWizard = WarningLightsWizard;