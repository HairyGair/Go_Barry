// Warning Lights Wizard Component - Enhanced Version
// Follows operational safety procedures - Section 28
// Includes supervisor communication scripts, safety verification, and edge case handling

const WarningLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
  const [showUrgentWarning, setShowUrgentWarning] = React.useState(false);
  const [verificationChecks, setVerificationChecks] = React.useState({});

  React.useEffect(() => {
    // Check if we need to show urgent warning based on responses
    if (responses.lightColor === 'red' && responses.lightBehavior === 'continuous') {
      setShowUrgentWarning(true);
    }
  }, [responses.lightColor, responses.lightBehavior]);

  // Communication Script Component
  const CommunicationScript = ({ scenario }) => (
    <div className="bg-blue-900/30 border border-blue-400 rounded-lg p-4 mt-4">
      <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        What to Say to the Driver
      </h4>
      <div className="bg-slate-800/50 rounded p-3 mt-2 italic text-gray-300">
        {scenario === 'red-continuous' && (
          <p>"I need you to stop the vehicle safely as soon as possible. The red warning light indicates a critical system issue. Once stopped, please switch off the engine and do not attempt to restart. Engineering is being notified and will attend shortly. Are you in a safe location to stop?"</p>
        )}
        {scenario === 'red-intermittent' && (
          <p>"I need you to stop in a safe location and switch off the engine. Once stopped, restart the vehicle and check if the red light remains off. If it stays off, you can continue to the next changeover point, but we'll arrange an immediate changeover. If the light returns or persists, remain stopped and we'll send engineering assistance. Can you do this safely?"</p>
        )}
        {scenario === 'amber-continue' && (
          <p>"The amber warning light means you can continue driving, but we need to arrange a vehicle changeover at the next convenient point. Please monitor the situation and let me know immediately if any red lights appear or if you notice any changes in vehicle performance. Can you confirm the vehicle is driving normally otherwise?"</p>
        )}
        {scenario === 'mixed-lights' && (
          <p>"You have both red and amber lights showing. We need to treat this as a red light situation. Please follow the instructions for the red warning light. The priority is your safety and that of your passengers."</p>
        )}
      </div>
    </div>
  );

  // Safety Verification Component
  const SafetyVerification = ({ checks, verificationState, onVerify }) => (
    <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Verify Driver Understanding
      </h4>
      <div className="space-y-2">
        {checks.map((check, index) => (
          <label key={index} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-600/30 p-2 rounded">
            <input 
              type="checkbox" 
              className="w-4 h-4"
              checked={verificationState[`check-${index}`] || false}
              onChange={(e) => onVerify(`check-${index}`, e.target.checked)}
            />
            <span className="text-gray-300">{check}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 text-xs text-amber-400">
        ⚠️ Ensure all items are verified before proceeding
      </div>
    </div>
  );

  // Additional Context Component
  const AdditionalContext = ({ responses, updateResponse }) => (
    <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
      <h4 className="text-white font-medium mb-3">Additional Information</h4>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-2">
            Are there any accompanying symptoms? (Check all that apply)
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-600/30 p-2 rounded">
              <input 
                type="checkbox" 
                checked={responses.symptoms?.includes('unusual-noise') || false}
                onChange={(e) => {
                  const symptoms = responses.symptoms || [];
                  if (e.target.checked) {
                    updateResponse('symptoms', [...symptoms, 'unusual-noise']);
                  } else {
                    updateResponse('symptoms', symptoms.filter(s => s !== 'unusual-noise'));
                  }
                }}
              />
              <span className="text-gray-400">Unusual noises (grinding, squealing, knocking)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-600/30 p-2 rounded">
              <input 
                type="checkbox"
                checked={responses.symptoms?.includes('performance-loss') || false}
                onChange={(e) => {
                  const symptoms = responses.symptoms || [];
                  if (e.target.checked) {
                    updateResponse('symptoms', [...symptoms, 'performance-loss']);
                  } else {
                    updateResponse('symptoms', symptoms.filter(s => s !== 'performance-loss'));
                  }
                }}
              />
              <span className="text-gray-400">Loss of power or performance</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-600/30 p-2 rounded">
              <input 
                type="checkbox"
                checked={responses.symptoms?.includes('smoke-smell') || false}
                onChange={(e) => {
                  const symptoms = responses.symptoms || [];
                  if (e.target.checked) {
                    updateResponse('symptoms', [...symptoms, 'smoke-smell']);
                  } else {
                    updateResponse('symptoms', symptoms.filter(s => s !== 'smoke-smell'));
                  }
                }}
              />
              <span className="text-gray-400">Smoke or unusual smell</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-600/30 p-2 rounded">
              <input 
                type="checkbox"
                checked={responses.symptoms?.includes('vibration') || false}
                onChange={(e) => {
                  const symptoms = responses.symptoms || [];
                  if (e.target.checked) {
                    updateResponse('symptoms', [...symptoms, 'vibration']);
                  } else {
                    updateResponse('symptoms', symptoms.filter(s => s !== 'vibration'));
                  }
                }}
              />
              <span className="text-gray-400">Unusual vibration or shaking</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="text-sm text-gray-300 block mb-2">
            When did the warning light first appear?
          </label>
          <select 
            className="bg-slate-600 text-white rounded px-3 py-2 w-full"
            value={responses.lightTiming || ''}
            onChange={(e) => updateResponse('lightTiming', e.target.value)}
          >
            <option value="">Select timing...</option>
            <option value="just-now">Just now (within last minute)</option>
            <option value="few-minutes">Few minutes ago</option>
            <option value="this-journey">Earlier this journey</option>
            <option value="previous-journey">Previous journey</option>
            <option value="intermittent-days">Intermittently over several days</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-2">
            Has the driver attempted any basic resets?
          </label>
          <select 
            className="bg-slate-600 text-white rounded px-3 py-2 w-full"
            value={responses.resetAttempted || ''}
            onChange={(e) => updateResponse('resetAttempted', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="no">No - not attempted</option>
            <option value="yes-cleared">Yes - light cleared</option>
            <option value="yes-returned">Yes - light returned</option>
            <option value="yes-no-change">Yes - no change</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Edge Case Guidance Component
  const EdgeCaseGuidance = ({ scenario }) => (
    <details className="bg-slate-700/30 rounded-lg p-4 mt-4">
      <summary className="cursor-pointer text-amber-400 font-medium flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Special Considerations & Edge Cases
      </summary>
      <div className="mt-3 space-y-3 text-sm text-gray-300">
        {scenario === 'identification' && (
          <>
            <p>• <strong>Colorblind drivers:</strong> Ask about the position of the light on the dashboard and any symbols/text shown, not just color</p>
            <p>• <strong>Language barriers:</strong> Use simple, clear language and confirm understanding at each step</p>
            <p>• <strong>New drivers:</strong> May not recognize all warning lights - ask them to describe what they see</p>
            <p>• <strong>Poor visibility:</strong> If driver can't clearly see dashboard, ask them to safely stop and check when stationary</p>
          </>
        )}
        {scenario === 'red-lights' && (
          <>
            <p>• <strong>Multiple red lights:</strong> Priority order: Brakes → Engine/Oil → Temperature → Others</p>
            <p>• <strong>Light goes off during call:</strong> Still treat as intermittent red - arrange immediate changeover</p>
            <p>• <strong>Driver disputes severity:</strong> Explain that safety regulations require compliance - it's not optional</p>
            <p>• <strong>No immediate safe stopping place:</strong> Guide driver to continue with hazard lights to nearest safe location (lay-by, bus stop, car park)</p>
            <p>• <strong>Heavy traffic:</strong> Emphasize finding safe location over immediate stop - safety of all road users is priority</p>
          </>
        )}
        {scenario === 'amber-lights' && (
          <>
            <p>• <strong>ABS amber light:</strong> Must follow specific ABS procedures in Section 3 of operational procedures</p>
            <p>• <strong>Multiple amber lights:</strong> May indicate broader electrical issue - arrange prompt changeover</p>
            <p>• <strong>Driver anxious about continuing:</strong> Reassure that amber allows continuation but respect driver's safety concerns</p>
            <p>• <strong>Long distance to changeover:</strong> Consider intermediate check-in points or earlier changeover if feasible</p>
          </>
        )}
        {scenario === 'communication' && (
          <>
            <p>• <strong>Driver panicking:</strong> Use calm, steady voice. Break instructions into small, clear steps</p>
            <p>• <strong>Poor phone connection:</strong> Get driver to safe location first, then attempt to reconnect</p>
            <p>• <strong>Driver refuses to stop (red light):</strong> Clearly state this is a safety requirement, not a request. Document refusal</p>
          </>
        )}
      </div>
    </details>
  );

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

            <h3 className="text-xl font-semibold text-white">Initial Assessment - Warning Lights</h3>
            
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 font-semibold mb-2">First, ensure driver safety:</p>
              <p className="text-sm text-gray-300">
                Ask: "Are you currently in a safe position? If not, when it's safe to do so, can you pull over to check the warning lights clearly?"
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Which warning lights are illuminated?</h4>
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
              <p className="text-sm text-gray-300 mb-2">
                <strong>Ask the driver to describe:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Location of the light(s) on dashboard</li>
                <li>Any symbols or text visible</li>
                <li>Whether lights are steady or flashing</li>
              </ul>
            </div>

            <EdgeCaseGuidance scenario="identification" />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Light Color and Behavior Assessment</h3>
            
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
                    <div className="text-sm text-gray-400">Critical system warning - immediate action required</div>
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
                    <div className="text-sm text-gray-400">Caution required - can continue to changeover</div>
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

            <AdditionalContext responses={responses} updateResponse={updateResponse} />

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 font-semibold mb-2">the reporting device Recording</p>
              <p className="text-sm text-gray-300">
                Instruct driver: "Please take a clear photo of your dashboard showing all warning lights and upload it to the reporting device. This helps our engineers prepare for any repairs needed."
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
            <h3 className="text-xl font-semibold text-white">Required Actions & Communication</h3>
            
            {(isRedContinuous || (isMixedWithRed && responses.lightBehavior === 'continuous')) && (
              <>
                <div className="bg-red-500/30 border-2 border-red-500 rounded-lg p-6 animate-pulse">
                  <div className="flex items-start gap-3">
                    <svg className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-lg font-bold text-red-300 mb-2">STOP IMMEDIATELY - Safety Critical</h4>
                      <p className="text-white font-medium mb-3">
                        Continuous RED warning light indicates a critical system failure.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-200">
                        <li>Driver must stop the vehicle in a safe location immediately</li>
                        <li>Switch off the engine</li>
                        <li>Do NOT attempt to continue driving</li>
                        <li>Await assistance from engineering</li>
                        <li>Record the defect on their handheld device with photo of warning light</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <CommunicationScript scenario="red-continuous" />
                <SafetyVerification 
                  checks={[
                    "Driver confirms they understand the instruction to stop immediately",
                    "Driver confirms they are in or approaching a safe location",
                    "Driver has been told NOT to restart the engine",
                    "Driver acknowledges engineering will attend",
                    "Driver understands they must record on their handheld device"
                  ]}
                  verificationState={verificationChecks}
                  onVerify={(key, value) => setVerificationChecks({...verificationChecks, [key]: value})}
                />
                <EdgeCaseGuidance scenario="red-lights" />
              </>
            )}

            {(isRedIntermittent || (isMixedWithRed && responses.lightBehavior === 'intermittent')) && (
              <>
                <div className="bg-amber-500/30 border-2 border-amber-500 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-lg font-bold text-amber-300 mb-2">Stop and Assess - Intermittent RED</h4>
                      <p className="text-white font-medium mb-3">
                        Intermittent RED warning requires immediate assessment.
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
                        <li>Record on their handheld device with photo</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <CommunicationScript scenario="red-intermittent" />
                <SafetyVerification 
                  checks={[
                    "Driver understands the restart procedure",
                    "Driver will monitor for light returning",
                    "Driver knows to stop immediately if light reappears",
                    "Changeover has been arranged at next safe point",
                    "Driver will record on their handheld device"
                  ]}
                  verificationState={verificationChecks}
                  onVerify={(key, value) => setVerificationChecks({...verificationChecks, [key]: value})}
                />
                <EdgeCaseGuidance scenario="red-lights" />
              </>
            )}

            {isAmberOnly && (
              <>
                <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-lg font-bold text-amber-300 mb-2">Continue with Caution - AMBER</h4>
                      <p className="text-white font-medium mb-3">
                        AMBER warning lights indicate caution required but not immediate danger.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-200">
                        <li>Continue to next convenient changeover point</li>
                        <li>Monitor the situation closely</li>
                        <li>If ABS light, follow specific ABS guidance (Section 3)</li>
                        <li>Arrange changeover at earliest opportunity</li>
                        <li>Record on their handheld device with photo of warning light</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <CommunicationScript scenario="amber-continue" />
                <SafetyVerification 
                  checks={[
                    "Driver confirms vehicle is operating normally",
                    "Driver will monitor for any changes",
                    "Driver understands changeover is required",
                    "Driver knows to report any new symptoms immediately",
                    "Driver will record on their handheld device"
                  ]}
                  verificationState={verificationChecks}
                  onVerify={(key, value) => setVerificationChecks({...verificationChecks, [key]: value})}
                />
                <EdgeCaseGuidance scenario="amber-lights" />
              </>
            )}

            {isMixedWithRed && (
              <CommunicationScript scenario="mixed-lights" />
            )}

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Safety-Critical System Reminder</h4>
              <p className="text-sm text-gray-300">
                If any warning light affects directional control, braking, or vehicle stability, 
                the vehicle must stop and await engineering assistance, regardless of color.
              </p>
            </div>

            <EdgeCaseGuidance scenario="communication" />

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 font-semibold mb-2">Engineering Escalation</p>
              <p className="text-sm text-gray-300">
                If uncertain about any warning light's meaning or severity, always err on the side of caution. 
                Stop and seek immediate engineering advice. Document all decisions on their handheld device.
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
                  {responses.lightTiming && (
                    <li>• First appeared: {responses.lightTiming.replace('-', ' ')}</li>
                  )}
                  {responses.symptoms && responses.symptoms.length > 0 && (
                    <li>• Accompanying symptoms: {responses.symptoms.join(', ').replace(/-/g, ' ')}</li>
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
                  <li>✓ Safety verification completed</li>
                  <li>✓ Defect to be recorded on their handheld device with photo</li>
                  <li>✓ Communication script provided to supervisor</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Verification Status:</h4>
                <div className="text-sm text-gray-400">
                  {Object.keys(verificationChecks).filter(key => verificationChecks[key]).length} of {Object.keys(verificationChecks).length} safety checks verified
                </div>
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
              <h4 className="font-medium text-blue-300 mb-2">Final Recording Reminder</h4>
              <p className="text-sm text-gray-300 mb-2">
                Ensure the driver has completed the following on their handheld device:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Recorded the warning light defect</li>
                <li>Uploaded a clear photo of the dashboard</li>
                <li>Added notes about:
                  <ul className="list-circle list-inside ml-4 mt-1">
                    <li>Light color and behavior (continuous/intermittent)</li>
                    <li>Any accompanying symptoms</li>
                    <li>When the issue first appeared</li>
                    <li>Action taken (stopped/continuing to changeover)</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Troubleshooting complete. All safety protocols have been followed.
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
              Acknowledge Safety Alert
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
              (currentStep === 2 && (responses.lightColor === 'red' || responses.lightColor === 'mixed') && !responses.lightBehavior) ||
              (currentStep === 3 && Object.keys(verificationChecks).filter(key => verificationChecks[key]).length < 5)
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
export default WarningLightsWizard;
