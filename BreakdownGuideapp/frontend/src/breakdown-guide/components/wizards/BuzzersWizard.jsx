// Buzzers Wizard Component - Various Buzzers Sounding
import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

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
              <p className="text-gray-300">Warning buzzer system diagnostic - following operational safety procedures buzzer procedures.</p>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
              <h3 className="text-lg font-semibold text-amber-200 mb-4">⚠️ BUZZER SYSTEM ALERT</h3>
              <p className="text-amber-300/80 text-sm leading-relaxed">
                Buzzers indicate system warnings that require immediate assessment. Some vehicles will not drive with certain buzzers sounding.
              </p>
              <div className="mt-4">
                <h4 className="font-semibold text-amber-200 mb-2">Mandatory operational actions:</h4>
                <ul className="text-amber-300/80 text-sm space-y-1">
                  <li>• IDENTIFY which specific buzzer is sounding</li>
                  <li>• CHECK for corresponding warning lights</li>
                  <li>• REFER to operational procedures or dashboard manual</li>
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
                  onClick={() => { updateResponse('buzzerType', 'water_warning'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'water_warning'
                      ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerType === 'water_warning' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'water_warning' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">💧 Water Buzzer</span>
                      <p className="text-sm text-gray-300 mt-1">Low water or temperature warning</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('buzzerType', 'air_pressure'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'air_pressure'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerType === 'air_pressure' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'air_pressure' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🌬️ Air Pressure Buzzer</span>
                      <p className="text-sm text-gray-300 mt-1">Low air pressure warning</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('buzzerType', 'door_system'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'door_system'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerType === 'door_system' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'door_system' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🚪 Door System Buzzer</span>
                      <p className="text-sm text-gray-300 mt-1">Door safety or operation warning</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('buzzerType', 'other'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerType === 'other'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerType === 'other' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerType === 'other' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔔 Other/Unknown Buzzer</span>
                      <p className="text-sm text-gray-300 mt-1">Unidentified buzzer sound</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Step 1: Identify the Buzzer</h2>
              <p className="text-gray-300">Following standard operational safety checks - accurately identify which buzzer is sounding and its pattern.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Buzzer Identification</h3>
              <p className="text-gray-300 mb-4">Has the driver successfully identified which specific buzzer is sounding?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('buzzerIdentified', 'identified'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerIdentified === 'identified'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerIdentified === 'identified' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerIdentified === 'identified' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">✅ Buzzer Identified</span>
                      <p className="text-sm text-gray-300 mt-1">Driver knows which buzzer is sounding</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('buzzerIdentified', 'unidentified'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.buzzerIdentified === 'unidentified'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.buzzerIdentified === 'unidentified' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.buzzerIdentified === 'unidentified' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">❌ Cannot Identify</span>
                      <p className="text-sm text-gray-300 mt-1">Unable to determine which buzzer</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {responses.buzzerIdentified === 'unidentified' && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🛑</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-200 mb-3">STOP - SEEK ENGINEERING ASSISTANCE</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Operational procedure: If buzzer cannot be identified:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Stop the vehicle immediately</li>
                        <li>Some vehicles will not drive with buzzers sounding</li>
                        <li>Await assistance from qualified engineering team</li>
                        <li>Do not attempt to continue without identification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Check for Warning Lights</h2>
              <p className="text-gray-300">Following standard operational safety checks - check if any warning lights are illuminated that correspond with the buzzer sound.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Warning Light Check</h3>
              <p className="text-gray-300 mb-4">Are any warning lights illuminated on the dashboard?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('warningLights', 'yes_matching'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'yes_matching'
                      ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.warningLights === 'yes_matching' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'yes_matching' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">⚠️ Yes - Matching Light</span>
                      <p className="text-sm text-gray-300 mt-1">Warning light corresponds to buzzer</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('warningLights', 'yes_unrelated'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'yes_unrelated'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.warningLights === 'yes_unrelated' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'yes_unrelated' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔸 Yes - Different Light</span>
                      <p className="text-sm text-gray-300 mt-1">Warning light unrelated to buzzer</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('warningLights', 'no_lights'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.warningLights === 'no_lights'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.warningLights === 'no_lights' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                    }`}>
                      {responses.warningLights === 'no_lights' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔇 No Warning Lights</span>
                      <p className="text-sm text-gray-300 mt-1">Buzzer with no visible warning light</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {responses.warningLights === 'yes_matching' && (
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <h3 className="text-lg font-semibold text-orange-200 mb-4">⚠️ Matching Warning Light Identified</h3>
                <p className="text-orange-300/80 text-sm leading-relaxed mb-4">
                  Operational procedure: With corresponding warning light and buzzer, refer to specific operational guidance or dashboard manual for that warning.
                </p>
                <div className="text-orange-300/80 text-sm">
                  <h4 className="font-semibold mb-2">Common Examples:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Water buzzer + temperature light → See "Low Water" section</li>
                    <li>Air buzzer + pressure light → See air pressure protocols</li>
                    <li>Door buzzer + door light → Check door system operation</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Step 3: Take Action</h2>
              <p className="text-gray-300">Following standard operational safety checks - determine whether it is safe to continue to the next convenient changeover point.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Safety Assessment</h3>
              <p className="text-gray-300 mb-4">Based on the buzzer type and warning lights, what is the appropriate action?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('action', 'continue_monitoring'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.action === 'continue_monitoring'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.action === 'continue_monitoring' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.action === 'continue_monitoring' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">✅ CONTINUE - With Monitoring</span>
                      <p className="text-sm text-gray-300 mt-1">Safe to continue to changeover point</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('action', 'changeover_amber'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.action === 'changeover_amber'
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.action === 'changeover_amber' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                    }`}>
                      {responses.action === 'changeover_amber' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🟨 AMBER - Changeover Required</span>
                      <p className="text-sm text-gray-300 mt-1">Continue but arrange prompt changeover</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => { updateResponse('action', 'stop_immediately'); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.action === 'stop_immediately'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.action === 'stop_immediately' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.action === 'stop_immediately' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🛑 STOP - Seek Engineering</span>
                      <p className="text-sm text-gray-300 mt-1">Vehicle not safe to drive</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {responses.action === 'stop_immediately' && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🛑</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-200 mb-3">IMMEDIATE STOP REQUIRED</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Operational Note: Some vehicles will not drive with a buzzer sounding</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Stop immediately and seek assistance from engineering</li>
                        <li>Do not attempt to continue without engineering clearance</li>
                        <li>Record defect on their handheld device</li>
                        <li>Follow safety protocols for stopped vehicle</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
              <h3 className="text-lg font-semibold text-blue-200 mb-4">🔧 Final Operational Guidance</h3>
              <div className="text-blue-300/80 text-sm space-y-3">
                <p className="font-semibold">operational safety procedures states:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Some vehicles will not drive with a buzzer sounding</li>
                  <li>If issue cannot be resolved, stop and await assistance from engineering</li>
                  <li>When in doubt about safety, always choose the more cautious option</li>
                  <li>Record all defects on their handheld device immediately</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Invalid step</div>;
    }
  };
  
  // Helper function to check if can proceed
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!responses.buzzerType;
      case 2:
        return !!responses.buzzerIdentified;
      case 3:
        return !!responses.warningLights;
      case 4:
        return !!responses.action;
      default:
        return false;
    }
  };
  
  const isLastStep = currentStep === 4;
  
  // Main component render
  return (
    <div className="min-h-screen bg-gray-900 p-4">
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
            onClick={() => {
              let decision = 'CONTINUE';
              let notes = 'Buzzer assessment completed. ';
              
              if (responses.action === 'stop_immediately' || responses.buzzerIdentified === 'unidentified') {
                decision = 'STOP';
                notes += 'Vehicle not safe to drive with current buzzer warning. Engineering assistance required.';
              } else if (responses.action === 'changeover_amber') {
                decision = 'AMBER';
                notes += 'Vehicle may continue but requires changeover at earliest opportunity.';
              } else {
                decision = 'CONTINUE';
                notes += 'Buzzer identified and assessed. Vehicle may continue with monitoring.';
              }
              
              onComplete(decision, notes);
            }}
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

export default BuzzersWizard;
