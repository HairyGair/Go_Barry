// Battery System Wizard Component - Dark Theme
function BatteryWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔋</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔋 Battery System Assessment</h2>
              <p className="text-gray-300">Following SDC guidance for battery charging system issues - ensuring electrical system reliability and preventing breakdown.</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Critical Electrical System</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                The battery charging system is essential for vehicle operation. Battery light warnings can lead to complete electrical failure and transmission loss.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Current Situation Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">What is the current status of the battery warning light?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('light_status', 'continuously_on')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.light_status === 'continuously_on'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.light_status === 'continuously_on' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.light_status === 'continuously_on' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔴 Battery light continuously on</span>
                      <p className="text-sm text-gray-300 mt-1">Warning light is constantly illuminated while engine running</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('light_status', 'intermittent')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.light_status === 'intermittent'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.light_status === 'intermittent' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.light_status === 'intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">⚡ Battery light intermittent</span>
                      <p className="text-sm text-gray-300 mt-1">Light comes on and off while driving</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('light_status', 'just_appeared')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.light_status === 'just_appeared'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.light_status === 'just_appeared' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.light_status === 'just_appeared' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🆕 Light just appeared</span>
                      <p className="text-sm text-gray-300 mt-1">Battery light recently came on during current journey</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('light_status', 'after_startup')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.light_status === 'after_startup'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.light_status === 'after_startup' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.light_status === 'after_startup' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔄 Light on after startup</span>
                      <p className="text-sm text-gray-300 mt-1">Battery light remained on after engine start</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Current Operating Status</h3>
              <p className="text-gray-300 text-sm mb-4">What is the current state of vehicle operation?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('operating_status', 'running_normally')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.operating_status === 'running_normally'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.operating_status === 'running_normally' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.operating_status === 'running_normally' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">✅ Running normally</span>
                      <p className="text-sm text-gray-300 mt-1">Engine running smoothly, no performance issues</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('operating_status', 'reduced_performance')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.operating_status === 'reduced_performance'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.operating_status === 'reduced_performance' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.operating_status === 'reduced_performance' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">⚠️ Reduced performance</span>
                      <p className="text-sm text-gray-300 mt-1">Noticing some reduction in power or electrical function</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('operating_status', 'stationary')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.operating_status === 'stationary'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.operating_status === 'stationary' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.operating_status === 'stationary' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🛑 Vehicle stationary</span>
                      <p className="text-sm text-gray-300 mt-1">Currently stopped, assessing before proceeding</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {responses.light_status === 'continuously_on' && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL BATTERY WARNING</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Continuous battery light requires immediate attention to prevent electrical failure</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">SDC Priority Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Stop safely and turn off engine before any inspection</li>
                          <li>Check drive belts - NEVER inspect with engine running</li>
                          <li>Verify master switch engagement</li>
                          <li>Risk of transmission drive loss and electrical component failure</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!responses.light_status || !responses.operating_status}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.search}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔍 Physical System Inspection</h2>
              <p className="text-gray-300">Following SDC safety protocols for belt and master switch inspection - engine must be OFF during all checks.</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <div className="flex items-start">
                {window.Icons.alertTriangle}
                <div className="flex-1 ml-4">
                  <h3 className="text-xl font-bold text-red-200 mb-3">🛑 SAFETY PROTOCOL</h3>
                  <div className="text-red-300/90 space-y-2">
                    <p className="font-semibold">ALWAYS advise driver to turn engine OFF before any belt inspection</p>
                    <p className="text-sm">SDC Guidance: "ALWAYS advise the driver to steer clear of moving belts and turn the engine off before inspection"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Step 1: Drive Belt Inspection</h3>
              <p className="text-gray-300 text-sm mb-4">With engine OFF and safety confirmed, inspect the drive belts for the alternator system.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('belt_condition', 'belts_in_place')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'belts_in_place'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'belts_in_place' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'belts_in_place' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">✅ All belts in place and secure</span>
                      <p className="text-sm text-gray-300 mt-1">Drive belts appear properly seated and tensioned</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('belt_condition', 'belt_loose')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'belt_loose'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'belt_loose' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'belt_loose' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">⚠️ Belt appears loose or worn</span>
                      <p className="text-sm text-gray-300 mt-1">Belt is present but appears to have incorrect tension or wear</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('belt_condition', 'belt_missing')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'belt_missing'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'belt_missing' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'belt_missing' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">❌ Belt completely missing or broken</span>
                      <p className="text-sm text-gray-300 mt-1">Drive belt has come off or snapped completely</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('belt_condition', 'unable_to_inspect')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'unable_to_inspect'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'unable_to_inspect' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'unable_to_inspect' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">❓ Unable to safely inspect</span>
                      <p className="text-sm text-gray-300 mt-1">Cannot access or view belt system safely</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Step 2: Master Switch Check</h3>
              <p className="text-gray-300 text-sm mb-4">Verify the electrical master switch status as per SDC guidance.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('master_switch', 'engaged')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.master_switch === 'engaged'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.master_switch === 'engaged' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.master_switch === 'engaged' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>✅ Master switch engaged</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Switch is in the correct engaged position</p>
                </button>

                <button
                  onClick={() => updateResponse('master_switch', 'not_engaged')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.master_switch === 'not_engaged'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.master_switch === 'not_engaged' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.master_switch === 'not_engaged' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>🔄 Master switch not engaged</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Switch needs to be properly engaged</p>
                </button>

                <button
                  onClick={() => updateResponse('master_switch', 'faulty')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.master_switch === 'faulty'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.master_switch === 'faulty' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.master_switch === 'faulty' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>⚠️ Master switch appears faulty</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Switch damaged or not functioning correctly</p>
                </button>
              </div>
            </div>

            {responses.belt_condition === 'belt_missing' && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">⚠️ BELT FAILURE DETECTED</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Missing or broken drive belt requires immediate engineering assistance</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">SDC Protocol for Belt Failure:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Wait for engineering assistance - do not attempt restart</li>
                          <li>Vehicle may be moved short distance if no other warnings present</li>
                          <li>Risk of further system failures if operated</li>
                          <li>Document exact belt condition for engineering team</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {responses.master_switch === 'not_engaged' && (
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-orange-200 mb-3">🔄 MASTER SWITCH RESOLUTION</h3>
                    <div className="text-orange-300/90 space-y-2">
                      <p className="font-semibold">Master switch not engaged - can be corrected immediately</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-orange-200 mb-2">SDC Corrective Action:</h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                          <li>Engage the master switch and continue in service</li>
                          <li>Monitor battery light - should extinguish after restart</li>
                          <li>If light persists after switch engagement, seek engineering advice</li>
                        </ul>
                      </div>
                    </div>
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
                disabled={!responses.belt_condition || !responses.master_switch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        const needsEngineering = responses.belt_condition === 'belt_missing' || 
                               (responses.master_switch === 'faulty') ||
                               (responses.belt_condition === 'belts_in_place' && responses.master_switch === 'engaged' && responses.light_status === 'continuously_on');
        const canBeFixed = responses.master_switch === 'not_engaged';

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${needsEngineering ? 'bg-red-500/20' : canBeFixed ? 'bg-orange-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {needsEngineering ? window.Icons.xCircle : canBeFixed ? window.Icons.wrench : window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">📋 Battery System Assessment Decision</h2>
              <p className="text-gray-300">Based on your inspection results, here is the recommended action</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Battery Light Status:</span> 
                  <span className={`ml-2 ${responses.light_status === 'continuously_on' ? 'text-red-400' : 'text-orange-400'}`}>
                    {responses.light_status === 'continuously_on' && '🔴 Continuously on'}
                    {responses.light_status === 'intermittent' && '⚡ Intermittent'}
                    {responses.light_status === 'just_appeared' && '🆕 Just appeared'}
                    {responses.light_status === 'after_startup' && '🔄 On after startup'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Operating Status:</span> 
                  <span className={`ml-2 ${responses.operating_status === 'running_normally' ? 'text-green-400' : 
                                          responses.operating_status === 'reduced_performance' ? 'text-yellow-400' : 'text-purple-400'}`}>
                    {responses.operating_status === 'running_normally' && '✅ Running normally'}
                    {responses.operating_status === 'reduced_performance' && '⚠️ Reduced performance'}
                    {responses.operating_status === 'stationary' && '🛑 Vehicle stationary'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Belt Condition:</span>
                  <span className={`ml-2 ${responses.belt_condition === 'belts_in_place' ? 'text-green-400' : 
                                          responses.belt_condition === 'belt_loose' ? 'text-orange-400' : 
                                          responses.belt_condition === 'belt_missing' ? 'text-red-400' : 'text-purple-400'}`}>
                    {responses.belt_condition === 'belts_in_place' && '✅ All belts in place'}
                    {responses.belt_condition === 'belt_loose' && '⚠️ Belt loose/worn'}
                    {responses.belt_condition === 'belt_missing' && '❌ Belt missing/broken'}
                    {responses.belt_condition === 'unable_to_inspect' && '❓ Unable to inspect'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Master Switch:</span>
                  <span className={`ml-2 ${responses.master_switch === 'engaged' ? 'text-green-400' : 
                                          responses.master_switch === 'not_engaged' ? 'text-orange-400' : 'text-red-400'}`}>
                    {responses.master_switch === 'engaged' && '✅ Properly engaged'}
                    {responses.master_switch === 'not_engaged' && '🔄 Not engaged'}
                    {responses.master_switch === 'faulty' && '⚠️ Appears faulty'}
                  </span>
                </div>
              </div>
            </div>

            {needsEngineering ? (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.xCircle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 AWAIT ENGINEERING ASSISTANCE</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Critical battery system fault requires engineering intervention</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">SDC Mandatory Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Do not continue in service - stop safely</li>
                          <li>Engine off, await qualified engineering assistance</li>
                          <li>Risk of transmission drive loss and electrical failure</li>
                          <li>Record defects in Go-Check system</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : canBeFixed ? (
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <div className="flex items-start">
                  {window.Icons.wrench}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-orange-200 mb-3">🔄 CORRECTIVE ACTION AVAILABLE</h3>
                    <div className="text-orange-300/90 space-y-2">
                      <p className="font-semibold">Master switch issue can be resolved immediately</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-orange-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                          <li>Engage the master switch and restart vehicle</li>
                          <li>Monitor battery light - should extinguish</li>
                          <li>Continue in service if light goes out</li>
                          <li>Record incident in Go-Check system</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <div className="flex items-start">
                  {window.Icons.checkCircle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE WITH MONITORING</h3>
                    <div className="text-green-300/90 space-y-2">
                      <p className="font-semibold">System appears functional but requires monitoring</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                          <li>Continue normal service operation</li>
                          <li>Monitor battery light closely for changes</li>
                          <li>Arrange changeover if condition worsens</li>
                          <li>Include in routine maintenance check</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                {window.Icons.info}
                <div>
                  <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                  <p className="text-sm text-blue-300/90 mt-1">
                    Log this battery system assessment in Go-Check when stationary and in a safe location
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
                  // Log breakdown if engineering assistance is required
                  if (needsEngineering) {
                    try {
                      await window.logBreakdown({
                        supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                        vehicleReg: window.selectedReg || 'Unknown',
                        fleetNo: window.selectedFleetNo || 'Unknown',
                        breakdownType: 'Battery',
                        timestamp: new Date().toISOString()
                      });
                      console.log('✅ Battery breakdown logged successfully');
                    } catch (error) {
                      console.error('Failed to log battery breakdown:', error);
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
window.BatteryWizard = BatteryWizard;
