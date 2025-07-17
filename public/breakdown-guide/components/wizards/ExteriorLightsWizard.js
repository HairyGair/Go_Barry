// Exterior Lights Wizard Component
function ExteriorLightsWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.Lightbulb}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🚦 Exterior Lights Assessment</h2>
              <p className="text-gray-300">Following SDC guidance for exterior lighting systems - ensuring road safety and legal compliance.</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">🌃 Critical Safety Systems</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                Exterior lighting is essential for road safety, visibility to other road users, and legal compliance. Defective lights can lead to accidents and prohibitions.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Operating Conditions Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">First, determine the current lighting conditions and operational requirements.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('lighting_conditions', 'daylight_hours')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.lighting_conditions === 'daylight_hours'
                      ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.lighting_conditions === 'daylight_hours' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                    }`}>
                      {responses.lighting_conditions === 'daylight_hours' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">☀️ Daylight hours</span>
                      <p className="text-sm text-gray-300 mt-1">Good visibility - headlights may not be required</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('lighting_conditions', 'darkness')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.lighting_conditions === 'darkness'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.lighting_conditions === 'darkness' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.lighting_conditions === 'darkness' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🌃 Hours of darkness</span>
                      <p className="text-sm text-gray-300 mt-1">Full lighting required for safe operation</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('lighting_conditions', 'poor_visibility')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.lighting_conditions === 'poor_visibility'
                      ? 'border-gray-400 bg-gray-400/20 text-gray-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-gray-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.lighting_conditions === 'poor_visibility' ? 'border-gray-400 bg-gray-400' : 'border-white/50'
                    }`}>
                      {responses.lighting_conditions === 'poor_visibility' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🌫️ Poor visibility conditions</span>
                      <p className="text-sm text-gray-300 mt-1">Fog, rain, or overcast - lights required regardless of time</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!responses.lighting_conditions}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        );

      case 2:
        const isLightingCritical = responses.lighting_conditions === 'darkness' || responses.lighting_conditions === 'poor_visibility';
        
        const hasHeadlightIssues = responses.headlights && responses.headlights !== 'both_working';
        const hasIndicatorIssues = responses.front_indicators && responses.front_indicators !== 'both_working';
        const hasMajorLightingIssues = hasIndicatorIssues || (isLightingCritical && hasHeadlightIssues);
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                {window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">💡 Lighting System Check</h2>
              <p className="text-gray-300">Assess headlights, indicators, and other lighting systems.</p>
            </div>
            
            <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
              <h3 className="text-lg font-semibold text-orange-200 mb-4">🔍 Systematic Check Required</h3>
              <p className="text-orange-300/80 text-sm leading-relaxed">
                Check each lighting system individually. Even one defective light can result in prohibition if it's safety-critical.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Headlight Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">Check both main beam and dipped beam headlights.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('headlights', 'both_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.headlights === 'both_working'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.headlights === 'both_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.headlights === 'both_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>✅ Both headlights working correctly</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('headlights', 'one_not_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.headlights === 'one_not_working'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.headlights === 'one_not_working' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.headlights === 'one_not_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>⚠️ One headlight not working</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('headlights', 'both_not_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.headlights === 'both_not_working'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.headlights === 'both_not_working' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.headlights === 'both_not_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>❌ Both headlights not working</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Indicator Lights</h3>
              <p className="text-gray-300 text-sm mb-4">Check front and rear indicator operation.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('front_indicators', 'both_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.front_indicators === 'both_working'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.front_indicators === 'both_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.front_indicators === 'both_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>✅ All indicators working</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('front_indicators', 'one_not_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.front_indicators === 'one_not_working'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.front_indicators === 'one_not_working' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.front_indicators === 'one_not_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>❌ One or more indicators not working</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Brake Lights</h3>
              <p className="text-gray-300 text-sm mb-4">Test brake lights - ask driver to press brake pedal.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateResponse('brake_lights', 'all_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brake_lights === 'all_working'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brake_lights === 'all_working' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.brake_lights === 'all_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>✅ All brake lights working</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('brake_lights', 'one_not_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brake_lights === 'one_not_working'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brake_lights === 'one_not_working' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.brake_lights === 'one_not_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>⚠️ One brake light not working</span>
                  </div>
                </button>

                <button
                  onClick={() => updateResponse('brake_lights', 'multiple_not_working')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.brake_lights === 'multiple_not_working'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.brake_lights === 'multiple_not_working' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.brake_lights === 'multiple_not_working' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span>❌ Multiple brake lights not working</span>
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
                disabled={!responses.headlights || !responses.front_indicators || !responses.brake_lights}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        const needsChangeoverASAP = responses.front_indicators !== 'both_working' || 
                                   responses.brake_lights === 'multiple_not_working' ||
                                   (responses.lighting_conditions === 'darkness' && responses.headlights === 'both_not_working');
        const canContinueWithCaution = !needsChangeoverASAP && (responses.headlights !== 'both_working' || responses.brake_lights === 'one_not_working');

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 ${needsChangeoverASAP ? 'bg-red-500/20' : canContinueWithCaution ? 'bg-amber-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                {needsChangeoverASAP ? window.Icons.alertTriangle : canContinueWithCaution ? window.Icons.alertTriangle : window.Icons.checkCircle}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">📋 Exterior Lights Assessment Decision</h2>
              <p className="text-gray-300">Based on your lighting assessment, here is the recommended action</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Lighting Conditions:</span> 
                  <span className="text-white ml-2">{responses.lighting_conditions?.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Headlights:</span> 
                  <span className={`ml-2 ${responses.headlights === 'both_working' ? 'text-green-400' : 'text-red-400'}`}>
                    {responses.headlights === 'both_working' ? '✅ Working' : 
                     responses.headlights === 'one_not_working' ? '⚠️ One faulty' :
                     responses.headlights === 'both_not_working' ? '❌ Both faulty' : '🔧 Partial'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Indicators:</span>
                  <span className={`ml-2 ${responses.front_indicators === 'both_working' ? 'text-green-400' : 'text-red-400'}`}>
                    {responses.front_indicators === 'both_working' ? '✅ All working' : '❌ Some faulty'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Brake Lights:</span>
                  <span className={`ml-2 ${responses.brake_lights === 'all_working' ? 'text-green-400' : 
                                          responses.brake_lights === 'one_not_working' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {responses.brake_lights === 'all_working' ? '✅ All working' : 
                     responses.brake_lights === 'one_not_working' ? '⚠️ One faulty' : '❌ Multiple faulty'}
                  </span>
                </div>
              </div>
            </div>

            {needsChangeoverASAP ? (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  {window.Icons.xCircle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🚫 IMMEDIATE CHANGEOVER REQUIRED</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Vehicle has safety-critical lighting defects</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">Critical Issues Identified:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          {responses.front_indicators !== 'both_working' && <li>Defective indicator lights (safety critical)</li>}
                          {responses.brake_lights === 'multiple_not_working' && <li>Multiple brake light failures</li>}
                          {responses.lighting_conditions === 'darkness' && responses.headlights !== 'both_working' && <li>Headlight issues during hours requiring lights</li>}
                        </ul>
                        <h4 className="font-semibold text-red-200 mb-2 mt-4">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Arrange immediate changeover</li>
                          <li>Do not continue in service</li>
                          <li>Risk of prohibition if found by enforcement</li>
                          <li>Record defects in Go-Check system</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : canContinueWithCaution ? (
              <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                <div className="flex items-start">
                  {window.Icons.alertTriangle}
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-yellow-200 mb-3">⚠️ CONTINUE WITH CAUTION - ARRANGE CHANGEOVER</h3>
                    <div className="text-yellow-300/90 space-y-2">
                      <p className="font-semibold">Vehicle has lighting defects but can continue temporarily</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-yellow-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-yellow-300/90 text-sm">
                          <li>Arrange changeover at next convenient opportunity</li>
                          <li>Avoid operating during hours of darkness if headlights affected</li>
                          <li>Record defects in Go-Check system</li>
                          <li>Monitor remaining lights closely</li>
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
                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                    <div className="text-green-300/90 space-y-2">
                      <p className="font-semibold">All critical lighting systems functional</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                          <li>Continue normal service</li>
                          <li>Report any new lighting issues immediately</li>
                          <li>Include in next routine maintenance check</li>
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
window.ExteriorLightsWizard = ExteriorLightsWizard;
