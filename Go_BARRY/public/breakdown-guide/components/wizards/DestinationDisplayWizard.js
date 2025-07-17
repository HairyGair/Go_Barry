// Destination Display Wizard Component - Dark Theme
function DestinationDisplayWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📟</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">📟 Destination Display Assessment</h2>
              <p className="text-gray-300">Following SDC guidance for destination display systems - ensuring passenger information accuracy and system reliability.</p>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
              <h3 className="text-lg font-semibold text-blue-200 mb-4">📡 Critical Passenger Information System</h3>
              <p className="text-blue-300/80 text-sm leading-relaxed">
                Destination displays provide essential route and service information to passengers. Malfunctioning displays can cause confusion and accessibility issues.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Display Type Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">First, identify what type of destination display system is affected.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('display_type', 'front_destination')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.display_type === 'front_destination'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.display_type === 'front_destination' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.display_type === 'front_destination' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🚌 Front destination display</span>
                      <p className="text-sm text-gray-300 mt-1">Main route number and destination display at front of vehicle</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('display_type', 'side_displays')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.display_type === 'side_displays'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.display_type === 'side_displays' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.display_type === 'side_displays' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">↔️ Side destination displays</span>
                      <p className="text-sm text-gray-300 mt-1">Route information displays on sides of vehicle</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('display_type', 'rear_display')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.display_type === 'rear_display'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.display_type === 'rear_display' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.display_type === 'rear_display' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔙 Rear display</span>
                      <p className="text-sm text-gray-300 mt-1">Rear destination or route display</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('display_type', 'interior_displays')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.display_type === 'interior_displays'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.display_type === 'interior_displays' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.display_type === 'interior_displays' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">📺 Interior passenger displays</span>
                      <p className="text-sm text-gray-300 mt-1">Internal information screens for passengers</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('display_type', 'multiple_displays')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.display_type === 'multiple_displays'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.display_type === 'multiple_displays' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.display_type === 'multiple_displays' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔄 Multiple displays affected</span>
                      <p className="text-sm text-gray-300 mt-1">Issues affecting more than one display system</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Operating Environment</h3>
              <p className="text-gray-300 text-sm mb-4">What are the current service conditions?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('service_conditions', 'passenger_service')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.service_conditions === 'passenger_service'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.service_conditions === 'passenger_service' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.service_conditions === 'passenger_service' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">👥 In passenger service</span>
                      <p className="text-sm text-gray-300 mt-1">Currently carrying passengers on route</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('service_conditions', 'dead_running')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.service_conditions === 'dead_running'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.service_conditions === 'dead_running' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.service_conditions === 'dead_running' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🚌 Dead running</span>
                      <p className="text-sm text-gray-300 mt-1">Operating out of service without passengers</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('service_conditions', 'depot_area')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.service_conditions === 'depot_area'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.service_conditions === 'depot_area' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.service_conditions === 'depot_area' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🏢 In depot area</span>
                      <p className="text-sm text-gray-300 mt-1">At depot or maintenance facility</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {responses.service_conditions === 'passenger_service' && (
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-orange-200 mb-3">👥 PASSENGER SERVICE PRIORITY</h3>
                    <div className="text-orange-300/90 space-y-2">
                      <p className="font-semibold">Display issues while carrying passengers require careful handling</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-orange-200 mb-2">Immediate Considerations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                          <li>Passengers may be confused about route/destination</li>
                          <li>Consider announcement to reassure passengers</li>
                          <li>Changeover may be needed at next convenient stop</li>
                          <li>Document defect for maintenance attention</li>
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
                disabled={!responses.display_type || !responses.service_conditions}
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
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.search}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔍 Display Fault Analysis</h2>
              <p className="text-gray-300">Identify the specific nature of the destination display problem to determine appropriate action.</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">🚨 Fault Type Assessment</h3>
              <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                Check each lighting system individually. Even one defective light can result in prohibition if it's safety-critical.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Fault Type Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">What is the exact nature of the display problem?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('fault_type', 'completely_blank')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'completely_blank'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'completely_blank' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'completely_blank' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">⬛ Display completely blank</span>
                      <p className="text-sm text-gray-300 mt-1">No illumination or text visible at all</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('fault_type', 'incorrect_information')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'incorrect_information'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'incorrect_information' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'incorrect_information' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">❌ Showing incorrect information</span>
                      <p className="text-sm text-gray-300 mt-1">Wrong route number, destination, or service information</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('fault_type', 'dim_unreadable')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'dim_unreadable'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'dim_unreadable' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'dim_unreadable' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">🔅 Too dim or unreadable</span>
                      <p className="text-sm text-gray-300 mt-1">Display working but difficult to read due to brightness/contrast</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('fault_type', 'flickering')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'flickering'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'flickering' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'flickering' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">⚡ Flickering or intermittent</span>
                      <p className="text-sm text-gray-300 mt-1">Display turning on/off or text appearing/disappearing</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('fault_type', 'garbled_text')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'garbled_text'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'garbled_text' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'garbled_text' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">🔀 Garbled or corrupted text</span>
                      <p className="text-sm text-gray-300 mt-1">Strange characters, partial text, or scrambled display</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('fault_type', 'physical_damage')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.fault_type === 'physical_damage'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.fault_type === 'physical_damage' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.fault_type === 'physical_damage' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">💥 Physical damage to display</span>
                      <p className="text-sm text-gray-300 mt-1">Cracked screen, broken housing, or visible impact damage</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">System Response Check</h3>
              <p className="text-gray-300 text-sm mb-4">Does the display respond to driver controls or automatic updates?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('system_response', 'responsive')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.system_response === 'responsive'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.system_response === 'responsive' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.system_response === 'responsive' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>✅ Responds to changes</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Display updates when driver changes route/destination</p>
                </button>

                <button
                  onClick={() => updateResponse('system_response', 'unresponsive')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.system_response === 'unresponsive'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.system_response === 'unresponsive' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.system_response === 'unresponsive' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>❌ No response to controls</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Display doesn't update when driver attempts changes</p>
                </button>

                <button
                  onClick={() => updateResponse('system_response', 'partial_response')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.system_response === 'partial_response'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.system_response === 'partial_response' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.system_response === 'partial_response' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>⚠️ Partial or delayed response</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 ml-8">Some functions work, others don't, or slow to update</p>
                </button>
              </div>
            </div>

            {(responses.fault_type === 'completely_blank' || responses.fault_type === 'physical_damage') && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL DISPLAY FAILURE</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Complete display failure or physical damage requires immediate attention</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">Priority Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Arrange changeover at next safe opportunity</li>
                          <li>Notify passengers of route/destination verbally if needed</li>
                          <li>Report defect for urgent repair</li>
                          <li>If safety-critical, consider removing from service immediately</li>
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
                disabled={!responses.fault_type || !responses.system_response}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        const needsImmediateAction = responses.fault_type === 'completely_blank' || responses.fault_type === 'physical_damage';
        const needsChangeover = needsImmediateAction || (responses.service_conditions === 'passenger_service' && responses.fault_type === 'incorrect_information');

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${needsImmediateAction ? 'bg-red-500/20' : needsChangeover ? 'bg-orange-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {needsImmediateAction ? window.Icons.xCircle : needsChangeover ? window.Icons.alertTriangle : window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">📋 Destination Display Assessment Decision</h2>
              <p className="text-gray-300">Based on your display assessment, here is the recommended action</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Display Type:</span> 
                  <span className="text-white ml-2">
                    {responses.display_type === 'front_destination' && '🚌 Front destination'}
                    {responses.display_type === 'side_displays' && '↔️ Side displays'}
                    {responses.display_type === 'rear_display' && '🔙 Rear display'}
                    {responses.display_type === 'interior_displays' && '📺 Interior displays'}
                    {responses.display_type === 'multiple_displays' && '🔄 Multiple displays'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Service Conditions:</span> 
                  <span className="text-white ml-2">
                    {responses.service_conditions === 'passenger_service' && '👥 Passenger service'}
                    {responses.service_conditions === 'dead_running' && '🚌 Dead running'}
                    {responses.service_conditions === 'depot_area' && '🏢 Depot area'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Fault Type:</span>
                  <span className={`ml-2 ${responses.fault_type === 'completely_blank' || responses.fault_type === 'physical_damage' ? 'text-red-400' : 
                                          responses.fault_type === 'incorrect_information' ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {responses.fault_type === 'completely_blank' && '⬛ Completely blank'}
                    {responses.fault_type === 'incorrect_information' && '❌ Incorrect info'}
                    {responses.fault_type === 'dim_unreadable' && '🔅 Dim/unreadable'}
                    {responses.fault_type === 'flickering' && '⚡ Flickering'}
                    {responses.fault_type === 'garbled_text' && '🔀 Garbled text'}
                    {responses.fault_type === 'physical_damage' && '💥 Physical damage'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">System Response:</span>
                  <span className={`ml-2 ${responses.system_response === 'responsive' ? 'text-green-400' : 
                                          responses.system_response === 'partial_response' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {responses.system_response === 'responsive' && '✅ Responsive'}
                    {responses.system_response === 'unresponsive' && '❌ Unresponsive'}
                    {responses.system_response === 'partial_response' && '⚠️ Partial response'}
                  </span>
                </div>
              </div>
            </div>

            {needsImmediateAction ? (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.xCircle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 IMMEDIATE ACTION REQUIRED</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Critical display failure requires immediate attention</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">Immediate Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Arrange immediate changeover at next safe opportunity</li>
                          <li>Notify passengers verbally of route/destination</li>
                          <li>Report as urgent defect requiring immediate repair</li>
                          <li>Record defects in Go-Check system</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : needsChangeover ? (
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-orange-200 mb-3">🔄 CHANGEOVER RECOMMENDED</h3>
                    <div className="text-orange-300/90 space-y-2">
                      <p className="font-semibold">Display issues affecting passenger information</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-orange-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                          <li>Arrange changeover at next convenient opportunity</li>
                          <li>Monitor display closely for changes</li>
                          <li>Make announcements to assist passengers</li>
                          <li>Record defects in Go-Check system</li>
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
                      <p className="font-semibold">Minor display issue - continue service with monitoring</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                          <li>Continue normal service operation</li>
                          <li>Monitor display functionality regularly</li>
                          <li>Report any worsening conditions</li>
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
window.DestinationDisplayWizard = DestinationDisplayWizard;
