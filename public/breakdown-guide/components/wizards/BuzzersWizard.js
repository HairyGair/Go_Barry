// Buzzers Wizard Component - Various Buzzers Sounding
function BuzzersWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔊</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔊 BUZZERS SOUNDING</h2>
              <p className="text-gray-300">Warning buzzer system diagnostic - following SDC Engineering Issues Guide buzzer procedures.</p>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
              <h3 className="text-lg font-semibold text-amber-200 mb-4">⚠️ BUZZER SYSTEM ALERT</h3>
              <p className="text-amber-300/80 text-sm leading-relaxed">
                Buzzers indicate system warnings that require immediate assessment. Some vehicles will not drive with certain buzzers sounding.
              </p>
              <div className="mt-4">
                <h4 className="font-semibold text-amber-200 mb-2">SDC Mandatory Actions:</h4>
                <ul className="text-amber-300/80 text-sm space-y-1">
                  <li>• IDENTIFY which specific buzzer is sounding</li>
                  <li>• CHECK for corresponding warning lights</li>
                  <li>• REFER to SDC guide or dashboard manual</li>
                  <li>• ASSESS whether vehicle can continue safely</li>
                  <li>• SEEK engineering assistance if uncertain</li>
                </ul>
              </div>
              <p className="text-amber-300/80 text-xs mt-3">
                Safety critical buzzer warnings must be addressed immediately
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Buzzer Type Identification</h3>
              <p className="text-gray-300 mb-4">What type of buzzer sound is being reported?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('buzzerType', 'water_warning')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'water_warning'
                      ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💧</span>
                      <div>
                        <div className="font-medium">Water Warning Buzzer</div>
                        <div className="text-sm opacity-80">Cooling system low water alert</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerType === 'water_warning' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'water_warning' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerType', 'reversing_alarm')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'reversing_alarm'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔄</span>
                      <div>
                        <div className="font-medium">Reversing Alarm</div>
                        <div className="text-sm opacity-80">Continuous beeping when reversing</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerType === 'reversing_alarm' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'reversing_alarm' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerType', 'air_pressure')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'air_pressure'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💨</span>
                      <div>
                        <div className="font-medium">Air Pressure Warning</div>
                        <div className="text-sm opacity-80">Low air pressure system alert</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerType === 'air_pressure' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'air_pressure' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerType', 'door_warning')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'door_warning'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚪</span>
                      <div>
                        <div className="font-medium">Door Warning Buzzer</div>
                        <div className="text-sm opacity-80">Door not properly closed or secured</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerType === 'door_warning' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'door_warning' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerType', 'unknown_buzzer')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'unknown_buzzer'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">❓</span>
                      <div>
                        <div className="font-medium">Unknown/Unidentified Buzzer</div>
                        <div className="text-sm opacity-80">Need to identify source and meaning</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerType === 'unknown_buzzer' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'unknown_buzzer' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Warning Light Check</h2>
              <p className="text-gray-300">Checking for corresponding dashboard warning indicators</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Dashboard Warning Lights</h3>
              <p className="text-gray-300 mb-4">Are any warning lights illuminated on the dashboard that correspond with the buzzer?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('warningLights', 'red_lights')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'red_lights'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <div className="font-medium">RED Warning Light(s)</div>
                        <div className="text-sm opacity-80">Critical system warning - requires immediate attention</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.warningLights === 'red_lights' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'red_lights' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('warningLights', 'amber_lights')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'amber_lights'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🟡</span>
                      <div>
                        <div className="font-medium">AMBER Warning Light(s)</div>
                        <div className="text-sm opacity-80">Caution warning - monitor and assess</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.warningLights === 'amber_lights' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'amber_lights' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('warningLights', 'no_lights')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'no_lights'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">⚫</span>
                      <div>
                        <div className="font-medium">No Warning Lights</div>
                        <div className="text-sm opacity-80">Only buzzer sounding, no visual warnings</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.warningLights === 'no_lights' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'no_lights' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('warningLights', 'multiple_lights')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'multiple_lights'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚨</span>
                      <div>
                        <div className="font-medium">Multiple Warning Lights</div>
                        <div className="text-sm opacity-80">Several dashboard warnings illuminated</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.warningLights === 'multiple_lights' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'multiple_lights' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-2">📝 Documentation Required</h4>
                <p className="text-gray-300 text-sm">
                  If warning lights are present, ensure an image is uploaded to Go-Check for engineering review.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Buzzer Pattern Assessment</h2>
              <p className="text-gray-300">Understanding the buzzer behavior for proper diagnosis</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Buzzer Sound Pattern</h3>
              <p className="text-gray-300 mb-4">How would you describe the buzzer's pattern or behavior?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('buzzerPattern', 'continuous')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerPattern === 'continuous'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📢</span>
                      <div>
                        <div className="font-medium">Continuous/Constant Buzzing</div>
                        <div className="text-sm opacity-80">Non-stop alarm sound</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerPattern === 'continuous' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerPattern === 'continuous' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerPattern', 'intermittent')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerPattern === 'intermittent'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <div className="font-medium">Intermittent/Periodic Beeping</div>
                        <div className="text-sm opacity-80">Regular intervals or patterns</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerPattern === 'intermittent' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerPattern === 'intermittent' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerPattern', 'rapid_beeping')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerPattern === 'rapid_beeping'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <div className="font-medium">Rapid/Fast Beeping</div>
                        <div className="text-sm opacity-80">Quick succession beeps</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerPattern === 'rapid_beeping' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerPattern === 'rapid_beeping' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('buzzerPattern', 'single_tone')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerPattern === 'single_tone'
                      ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎵</span>
                      <div>
                        <div className="font-medium">Single Tone/Note</div>
                        <div className="text-sm opacity-80">One consistent pitch/frequency</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.buzzerPattern === 'single_tone' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerPattern === 'single_tone' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Vehicle Drivability</h3>
              <p className="text-gray-300 mb-4">Is the vehicle still able to move/drive with the buzzer sounding?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('vehicleDrivable', 'yes_can_drive')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.vehicleDrivable === 'yes_can_drive'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <div className="font-medium">Yes - Vehicle Can Drive</div>
                        <div className="text-sm opacity-80">Normal operation despite buzzer</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.vehicleDrivable === 'yes_can_drive' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.vehicleDrivable === 'yes_can_drive' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('vehicleDrivable', 'no_cannot_drive')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.vehicleDrivable === 'no_cannot_drive'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚫</span>
                      <div>
                        <div className="font-medium">No - Vehicle Cannot Drive</div>
                        <div className="text-sm opacity-80">System prevents operation</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.vehicleDrivable === 'no_cannot_drive' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.vehicleDrivable === 'no_cannot_drive' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('vehicleDrivable', 'limited_function')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.vehicleDrivable === 'limited_function'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="font-medium">Limited Function</div>
                        <div className="text-sm opacity-80">Reduced performance or capabilities</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      responses.vehicleDrivable === 'limited_function' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                    }`}>
                      {responses.vehicleDrivable === 'limited_function' && <span className="block w-full h-full rounded-full bg-white scale-50"></span>}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        // Generate assessment result based on responses
        const getAssessmentResult = () => {
          const { buzzerType, warningLights, buzzerPattern, vehicleDrivable } = responses;
          
          // Safety critical cases
          if (buzzerType === 'air_pressure' || warningLights === 'red_lights' || vehicleDrivable === 'no_cannot_drive') {
            return {
              action: 'STOP_IMMEDIATELY',
              priority: 'CRITICAL',
              color: 'red',
              icon: '🛑',
              title: 'STOP IMMEDIATELY - ENGINEERING REQUIRED',
              message: 'Safety critical buzzer warning detected. Vehicle must not continue.',
              instructions: [
                'STOP the vehicle in a safe location immediately',
                'DO NOT attempt to continue driving',
                'AWAIT engineering assistance at the scene',
                'RECORD all warning details in Go-Check',
                'ENSURE passenger and driver safety'
              ]
            };
          }
          
          // Water warning case
          if (buzzerType === 'water_warning') {
            return {
              action: 'WATER_PROTOCOL',
              priority: 'HIGH',
              color: 'blue',
              icon: '💧',
              title: 'WATER SYSTEM WARNING - FOLLOW SDC PROCEDURE',
              message: 'Water buzzer indicates cooling system issue. Follow low water protocol.',
              instructions: [
                'CHECK water temperature gauge immediately',
                'REFER to Low Water SDC protocol',
                'ASSESS if water leaks are present',
                'CONTINUE to changeover if safe to do so',
                'SEEK engineering assistance if uncertain'
              ]
            };
          }
          
          // Door warning
          if (buzzerType === 'door_warning') {
            return {
              action: 'DOOR_CHECK',
              priority: 'MEDIUM',
              color: 'yellow',
              icon: '🚪',
              title: 'DOOR SYSTEM CHECK REQUIRED',
              message: 'Door warning buzzer requires immediate verification.',
              instructions: [
                'CHECK all doors are properly closed',
                'VERIFY door seals and catches',
                'TEST door operation if safe to do so',
                'CONTINUE if doors secure properly',
                'SEEK assistance if doors malfunction'
              ]
            };
          }
          
          // Reversing alarm - normal operation
          if (buzzerType === 'reversing_alarm') {
            return {
              action: 'NORMAL_OPERATION',
              priority: 'LOW',
              color: 'green',
              icon: '✅',
              title: 'NORMAL REVERSING ALARM OPERATION',
              message: 'Reversing alarm is functioning correctly during reverse operation.',
              instructions: [
                'REVERSING alarm should only sound when in reverse',
                'CHECK if buzzer stops when out of reverse gear',
                'ENSURE alarm volume is adequate for safety',
                'CONTINUE normal operation if functioning correctly',
                'REPORT if alarm malfunctions or stays on'
              ]
            };
          }
          
          // Unknown buzzer requires investigation
          if (buzzerType === 'unknown_buzzer' || buzzerPattern === 'continuous') {
            return {
              action: 'INVESTIGATION_REQUIRED',
              priority: 'MEDIUM',
              color: 'purple',
              icon: '🔍',
              title: 'INVESTIGATION REQUIRED - CONSULT MANUAL',
              message: 'Unknown buzzer requires identification and assessment.',
              instructions: [
                'CONSULT dashboard manual if available',
                'CHECK all dashboard warning lights',
                'PHOTOGRAPH dashboard for Go-Check record',
                'CONTACT engineering for guidance',
                'PROCEED cautiously to changeover point'
              ]
            };
          }
          
          // Default case for amber lights or drivable vehicle
          return {
            action: 'MONITOR_AND_CONTINUE',
            priority: 'MEDIUM',
            color: 'amber',
            icon: '⚠️',
            title: 'MONITOR SYSTEM - CHANGEOVER REQUIRED',
            message: 'Non-critical buzzer warning requires monitoring and planned changeover.',
            instructions: [
              'MONITOR buzzer pattern for changes',
              'ARRANGE changeover at next convenient point',
              'RECORD details in Go-Check system',
              'SEEK engineering advice if condition worsens',
              'ENSURE driver remains alert to system status'
            ]
          };
        };

        const result = getAssessmentResult();

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 bg-${result.color}-500/20 rounded-full flex items-center justify-center mb-4`}>
                <span className="text-3xl">{result.icon}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{result.title}</h2>
              <p className="text-gray-300">{result.message}</p>
            </div>

            <div className={`bg-${result.color}-500/20 backdrop-blur-sm rounded-lg p-6 border border-${result.color}-400/30`}>
              <h3 className={`text-lg font-semibold text-${result.color}-200 mb-4`}>📋 REQUIRED ACTIONS</h3>
              <ul className={`text-${result.color}-300/90 space-y-2`}>
                {result.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-xs mt-1">•</span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">📝 Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Buzzer Type:</span>
                  <div className="text-white font-medium">{responses.buzzerType?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Warning Lights:</span>
                  <div className="text-white font-medium">{responses.warningLights?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Buzzer Pattern:</span>
                  <div className="text-white font-medium">{responses.buzzerPattern?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Vehicle Status:</span>
                  <div className="text-white font-medium">{responses.vehicleDrivable?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <span className="text-amber-400">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-400 mb-2">Go-Check Integration</h3>
                  <p className="text-amber-300/80 text-sm leading-relaxed">
                    Record this buzzer incident in the Go-Check system with:
                  </p>
                  <ul className="text-amber-300/80 text-sm mt-2 space-y-1">
                    <li>• Buzzer type and pattern description</li>
                    <li>• Photos of any warning lights</li>
                    <li>• Action taken and engineering consultation</li>
                    <li>• Vehicle drivability status</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return responses.buzzerType;
      case 2:
        return responses.warningLights;
      case 3:
        return responses.buzzerPattern && responses.vehicleDrivable;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === 4;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Progress</span>
          <span className="text-sm font-medium text-gray-300">{currentStep} / 4</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrevious}
          disabled={currentStep === 1}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors flex items-center space-x-2"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        {isLastStep ? (
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center space-x-2"
          >
            <span>Complete Assessment</span>
            <span>✓</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canProceed()}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500 transition-colors flex items-center space-x-2"
          >
            <span>Next Step</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Export to global scope
window.BuzzersWizard = BuzzersWizard;