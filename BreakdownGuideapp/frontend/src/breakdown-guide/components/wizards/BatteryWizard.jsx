// Battery Light Wizard Component - operational safety procedures Compliant
// Aligned with DVSA's "Categorisation of Vehicle Defects" guidelines
import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

function BatteryWizard({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) {
  const { AlertTriangle, Search, XCircle, Wrench, CheckCircle, Info } = Icons;
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔋</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔋 Battery Light Assessment</h2>
              <p className="text-gray-300">Following standard operational safety checks v1.3 - Battery Light section</p>
              <p className="text-sm text-gray-400 mt-1">In compliance with DVSA's "Categorisation of Vehicle Defects"</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ Critical Electrical System Warning</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                The battery charging system is essential for vehicle operation. Battery light warnings indicate potential 
                alternator failure which can lead to complete electrical failure, loss of transmission drive, and vehicle shutdown.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Initial Assessment</h3>
              <p className="text-gray-300 text-sm mb-4">Is the battery warning light currently illuminated?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('battery_light_on', true); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.battery_light_on === true
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.battery_light_on === true ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.battery_light_on === true && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">🔴 Yes - Battery light is ON</span>
                      <p className="text-sm text-gray-300 mt-1">Warning light is illuminated on dashboard</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('battery_light_on', false); updateResponse('false_alarm', true); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.battery_light_on === false
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses.battery_light_on === false ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.battery_light_on === false && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-medium">✅ No - Battery light is OFF</span>
                      <p className="text-sm text-gray-300 mt-1">No battery warning light visible (false alarm)</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="text-sm text-orange-300">
                  <p className="font-semibold">Driver Safety Notice:</p>
                  <p>Under DVSA regulations, electrical system defects can be categorized as "Dangerous" if they affect vehicle control or safety systems.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={responses.battery_light_on === undefined}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        );

      case 2:
        // Skip to completion if battery light is off
        if (responses.battery_light_on === false) {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">✅ No Battery System Fault</h2>
                <p className="text-gray-300">Battery light is not illuminated - no immediate action required</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <div className="flex items-start">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ CONTINUE IN SERVICE</h3>
                    <div className="text-green-300/90 space-y-2">
                      <p className="font-semibold">No battery system fault detected</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-200 mb-2">Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                          <li>Continue normal service operation</li>
                          <li>No defect recording required at this time</li>
                          <li>Advise driver to monitor dashboard for any changes</li>
                          <li>Report persistent false alarms to depot management</li>
                        </ul>
                      </div>
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
                  onClick={() => onComplete('CONTINUE', 'Battery light false alarm - no defect found')}
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
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🛑 SAFETY CRITICAL - Engine OFF Required</h2>
              <p className="text-gray-300">Operational mandates engine MUST be switched OFF before any belt inspection</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <div className="flex items-start">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div className="flex-1 ml-4">
                  <h3 className="text-xl font-bold text-red-200 mb-3">🛑 MANDATORY SAFETY PROTOCOL</h3>
                  <div className="text-red-300/90 space-y-2">
                    <p className="font-semibold text-lg">Operational Guidance: "ALWAYS advise the driver to steer clear of moving belts and turn the engine off before inspection"</p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-red-200 mb-2">Before proceeding:</h4>
                      <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                        <li>Ensure vehicle is safely stopped</li>
                        <li>ENGINE MUST BE SWITCHED OFF</li>
                        <li>Ignition key removed if possible</li>
                        <li>NEVER inspect belts with engine running - risk of serious injury</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Step 1: Check Belts (Engine OFF)</h3>
              <p className="text-gray-300 text-sm mb-4">With the engine OFF and safety confirmed, what is the condition of the alternator drive belt(s)?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('belt_condition', 'in_place'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'in_place'
                      ? 'border-green-400 bg-green-400/20 text-green-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'in_place' ? 'border-green-400 bg-green-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'in_place' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">✅ Belts in place</span>
                      <p className="text-sm text-gray-300 mt-1">All drive belts are present and appear properly seated</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('belt_condition', 'come_off'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'come_off'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'come_off' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'come_off' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">❌ Belt(s) come off</span>
                      <p className="text-sm text-gray-300 mt-1">One or more belts have come off or are broken</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('belt_condition', 'cannot_check'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.belt_condition === 'cannot_check'
                      ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.belt_condition === 'cannot_check' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                    }`}>
                      {responses.belt_condition === 'cannot_check' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">❓ Cannot safely check</span>
                      <p className="text-sm text-gray-300 mt-1">Unable to access or view belt system safely</p>
                    </div>
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
                disabled={!responses.belt_condition}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        // If belt has come off, skip to decision
        if (responses.belt_condition === 'come_off') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">❌ Belt Failure Detected</h2>
                <p className="text-gray-300">Drive belt has come off - engineering assistance required</p>
              </div>

              <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                <div className="flex items-start">
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 STOP - AWAIT ENGINEERING</h3>
                    <div className="text-red-300/90 space-y-2">
                      <p className="font-semibold">Belt(s) have come off - Do not continue in service</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-200 mb-2">Operational Protocol for Belt Failure:</h4>
                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                          <li>Wait for engineering assistance</li>
                          <li>If no other warning lights (e.g., temperature), vehicle may be moved a short distance if needed for safety</li>
                          <li>Do NOT attempt to drive in normal service</li>
                          <li>Record defect in Tranzaura System immediately</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Tranzaura Recording Required</h4>
                    <p className="text-sm text-blue-300/90 mt-1">
                      Record this belt failure in the Tranzaura System when stationary and safe. 
                      EP Morris code likely "BDBA" (Battery/Alternator) - mark as URGENT.
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
                  onClick={() => onComplete('STOP', 'Belt(s) come off - await engineering assistance')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        // If cannot check belts
        if (responses.belt_condition === 'cannot_check') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">⚠️ Unable to Complete Inspection</h2>
                <p className="text-gray-300">Belt inspection cannot be completed safely</p>
              </div>

              <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                <div className="flex items-start">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-orange-200 mb-3">⚠️ CHANGEOVER REQUIRED</h3>
                    <div className="text-orange-300/90 space-y-2">
                      <p className="font-semibold">Unable to verify belt condition - arrange changeover</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-orange-200 mb-2">Actions Required:</h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                          <li>Arrange changeover at earliest opportunity</li>
                          <li>Do not continue beyond next convenient changeover point</li>
                          <li>Monitor battery light and vehicle performance</li>
                          <li>Record issue in Tranzaura System</li>
                        </ul>
                      </div>
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
                  onClick={() => onComplete('AMBER', 'Unable to inspect belts - changeover at earliest opportunity')}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        // Belts in place - check master switch
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">🔍 Step 2: Check Master Switch</h2>
              <p className="text-gray-300">Belts are in place - now check the electrical master switch</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Master Switch Status</h3>
              <p className="text-gray-300 text-sm mb-4">What is the status of the electrical master switch?</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { updateResponse('master_switch', 'not_engaged'); onNext(); }}
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
                    <div>
                      <span className="font-medium">🔄 Master switch NOT engaged</span>
                      <p className="text-sm text-gray-300 mt-1">Switch is in the OFF or disengaged position</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { updateResponse('master_switch', 'engaged'); onNext(); }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    responses.master_switch === 'engaged'
                      ? 'border-red-400 bg-red-400/20 text-red-200'
                      : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      responses.master_switch === 'engaged' ? 'border-red-400 bg-red-400' : 'border-white/50'
                    }`}>
                      {responses.master_switch === 'engaged' && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <span className="font-medium">✅ Master switch IS engaged</span>
                      <p className="text-sm text-gray-300 mt-1">Switch is already in the ON/engaged position</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold">Operational Guidance Note:</p>
                  <p>Master switch engagement status determines whether the issue can be resolved immediately or requires engineering assistance.</p>
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
                disabled={!responses.master_switch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 4:
        // Final decision based on master switch status
        if (responses.master_switch === 'not_engaged') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Wrench className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">🔄 Simple Fix Available</h2>
                <p className="text-gray-300">Master switch issue can be resolved immediately</p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                <div className="flex items-start">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div className="flex-1 ml-4">
                    <h3 className="text-xl font-bold text-green-200 mb-3">✅ ENGAGE SWITCH & CONTINUE</h3>
                    <div className="text-green-300/90 space-y-2">
                      <p className="font-semibold">Master switch not engaged - simple corrective action</p>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-200 mb-2">Operational Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                          <li>Engage the master switch</li>
                          <li>Restart the vehicle</li>
                          <li>Verify battery light has extinguished</li>
                          <li>Continue in service if light goes out</li>
                          <li>Record incident in Tranzaura System</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-blue-200">Monitor After Fix</h4>
                    <p className="text-sm text-blue-300/90 mt-1">
                      If battery light remains on after engaging master switch and restarting, arrange changeover at earliest opportunity.
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
                  onClick={() => onComplete('CONTINUE', 'Master switch not engaged - engage and continue')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          );
        }

        // Master switch engaged - engineering required
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">❌ Engineering Assistance Required</h2>
              <p className="text-gray-300">Master switch engaged but battery light on - potential alternator failure</p>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
              <div className="flex items-start">
                <XCircle className="w-8 h-8 text-red-400" />
                <div className="flex-1 ml-4">
                  <h3 className="text-xl font-bold text-red-200 mb-3">🛑 STOP - AWAIT ENGINEERING</h3>
                  <div className="text-red-300/90 space-y-2">
                    <p className="font-semibold">Critical electrical fault - do not continue</p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-red-200 mb-2">Operational Critical Warning:</h4>
                      <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                        <li>Wait for engineering assistance</li>
                        <li>Risk of transmission drive loss</li>
                        <li>Risk of complete electrical component failure</li>
                        <li>Do NOT attempt to continue in service</li>
                        <li>Record defect in Tranzaura System as URGENT</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="text-sm text-orange-300">
                  <p className="font-semibold">DVSA Warning:</p>
                  <p>Under DVSA categorisation, this constitutes a "Dangerous" defect if electrical failure affects safety-critical systems. 
                     Vehicle must not be moved except under engineering supervision.</p>
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
                onClick={() => onComplete('STOP', 'Master switch engaged but battery light on - transmission drive loss risk')}
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
window.BatteryWizard = BatteryWizard;

export default BatteryWizard;
