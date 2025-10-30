import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Oil Warning Light Wizard Component - Safety-Critical Engine Protection System
// Uses icons and constants from common components
// Follows operational safety procedures - Oil Warning Light Section
// Complies with DVSA Categorisation of Vehicle Defects (IM 44 - Oil and waste leaks)

const OilWarningLightWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🛢️ Oil Warning Light Emergency Assessment</h2>
                        <p className="text-gray-300">Critical engine protection system evaluation following operational safety procedures - immediate action required.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🚨 CRITICAL ENGINE PROTECTION SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            The oil warning light indicates low oil pressure or oil system failure. This can cause catastrophic engine damage within seconds if ignored.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Standard operational protocol - Step 1:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Instruct the driver to stop immediately</li>
                                <li>Ensure the vehicle is stopped in a safe location</li>
                                <li>Engine damage occurs within seconds of oil pressure loss</li>
                                <li>Risk of complete engine seizure while driving</li>
                                <li>DVSA categorisation: Immediate prohibition (PG9) risk</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">⚡ IMMEDIATE ACTION REQUIRED - STANDARD PROCEDURE</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-orange-300/90 font-semibold mb-2">
                                In line with standard control-room procedure - Step 1: Instruct the Driver to Stop Immediately:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-orange-300/80 text-sm">
                                <li>Find a safe location to stop immediately</li>
                                <li>Do NOT continue driving with oil light on</li>
                                <li>Switch off engine as soon as safely stopped</li>
                                <li>Every second of operation risks engine damage</li>
                                <li>Potential DVSA "dangerous defect" classification</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Safety Status</h3>
                        <p className="text-gray-300 text-sm mb-4">Has the driver stopped the vehicle safely and switched off the engine?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('vehicleStopped', 'yes'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'yes'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'yes' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Yes - Vehicle stopped safely</span>
                                        <p className="text-sm text-gray-300 mt-1">Engine switched off, vehicle secure</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('vehicleStopped', 'stopping'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'stopping'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'stopping' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'stopping' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ In process of stopping</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver is finding safe location to stop</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('vehicleStopped', 'cannot'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicleStopped === 'cannot'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicleStopped === 'cannot' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicleStopped === 'cannot' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Cannot stop immediately</span>
                                        <p className="text-sm text-gray-300 mt-1">On motorway or unsafe location</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    {/* Emergency Protocol for cannot stop */}
                    {responses.vehicleStopped === 'cannot' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 EMERGENCY PROTOCOL ACTIVATED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle cannot stop immediately - Engine damage imminent</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Emergency Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Activate hazard lights immediately</li>
                                                <li>Reduce speed gradually - do NOT rev engine</li>
                                                <li>Exit at next safe opportunity</li>
                                                <li>Prepare for potential engine failure</li>
                                                <li>Monitor for engine seizure symptoms</li>
                                                <li>Do NOT accelerate hard or rev engine</li>
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
                            disabled={!responses.vehicleStopped}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            const canInspect = responses.vehicleStopped === 'yes';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🔍 Oil Leak Inspection Protocol</h2>
                        <p className="text-gray-300">Visual inspection for oil leaks following recognised safety standards.</p>
                    </div>

                    {canInspect ? (
                        <div className="space-y-6">
                            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                                <h3 className="text-lg font-bold text-blue-200 mb-4">📋 Operational procedure reference - Step 2: Check for Oil Leaks</h3>
                                <p className="text-blue-300/80 mb-4">
                                    Ask the driver to inspect for visible oil leaks when safe to do so.
                                </p>
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <p className="text-sm font-semibold text-blue-200 mb-2">
                                        Safety First Protocol:
                                    </p>
                                    <ul className="list-disc ml-6 space-y-1 text-blue-300/80 text-sm">
                                        <li>Ensure vehicle is on level ground and secure</li>
                                        <li>Apply parking brake firmly</li>
                                        <li>Wait 2-3 minutes for oil to settle after stopping</li>
                                        <li>Check under vehicle for oil puddles/drips</li>
                                        <li>Look for wet patches on engine components</li>
                                        <li>Note any strong oil smells</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                                <h3 className="font-semibold text-white mb-4">Oil Leak Assessment</h3>
                                <p className="text-gray-300 text-sm mb-4">Are there any visible oil leaks detected during the inspection?</p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { updateResponse('oilLeakVisible', 'yes'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'yes'
                                                ? 'border-red-400 bg-red-400/20 text-red-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'yes' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">🚨 Yes - Oil leak visible</span>
                                                <p className="text-sm text-gray-300 mt-1">Oil puddle, drips, or wet patches visible</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { updateResponse('oilLeakVisible', 'no'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'no'
                                                ? 'border-green-400 bg-green-400/20 text-green-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'no' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">✅ No - No visible oil leak</span>
                                                <p className="text-sm text-gray-300 mt-1">No signs of oil leakage found</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { updateResponse('oilLeakVisible', 'cannot_check'); onNext(); }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                            responses.oilLeakVisible === 'cannot_check'
                                                ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                                : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                responses.oilLeakVisible === 'cannot_check' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                            }`}>
                                                {responses.oilLeakVisible === 'cannot_check' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-medium">⚠️ Cannot check safely</span>
                                                <p className="text-sm text-gray-300 mt-1">Unable to inspect due to location/conditions</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Oil leak confirmed warning */}
                            {responses.oilLeakVisible === 'yes' && (
                                <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                    <div className="flex items-start space-x-4">
                                        <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-bold text-red-200 mb-3">🛑 Oil Leak Confirmed</h3>
                                            <div className="text-red-300/90 space-y-2">
                                            <p className="font-semibold">In line with standard control-room procedure - Vehicle must remain STOPPED:</p>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                            <li>Vehicle must remain STOPPED with engine switched off</li>
                                            <li>Await assistance from engineering</li>
                                            <li>Risk of fire if oil contacts hot surfaces</li>
                                            <li>Environmental hazard - potential road contamination</li>
                                            <li>DVSA Category: Immediate prohibition (PG9) if poses fire/hazard risk</li>
                                            </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                                <h3 className="text-lg font-bold text-amber-200 mb-3">⚠️ Vehicle Still Moving</h3>
                                <p className="text-amber-300/80 mb-3">
                                    Since the vehicle cannot stop immediately, we cannot perform a visual inspection.
                                </p>
                                <p className="text-amber-300/80 font-semibold">
                                    Assume worst case scenario - potential oil leak present.
                                </p>
                            </div>
                            
                            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                                <h4 className="text-lg font-bold text-red-200 mb-3">🚨 Continue Emergency Stop Procedure</h4>
                                <ul className="list-disc ml-6 space-y-2 text-red-300/90">
                                    <li>Monitor for engine noises (knocking, grinding, tapping)</li>
                                    <li>Watch temperature gauge for overheating signs</li>
                                    <li>Be prepared for sudden engine seizure</li>
                                    <li>Stop at earliest safe opportunity</li>
                                    <li>Listen for unusual engine sounds</li>
                                    <li>Check for loss of power or rough running</li>
                                </ul>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={canInspect && !responses.oilLeakVisible}
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Light Status Check <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            const vehicleStopped = responses.vehicleStopped === 'yes';
            const hasOilLeak = responses.oilLeakVisible === 'yes' || responses.oilLeakVisible === 'cannot_check';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">💡 Operational procedure reference - Step 3: Light Status While Moving</h2>
                        <p className="text-gray-300">Understanding when the oil light appears helps determine the severity of the issue.</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <p className="text-gray-300 mb-4">
                            The timing and pattern of the oil warning light provides crucial diagnostic information about the severity of the oil system failure.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="font-semibold text-white mb-4">Oil Warning Light Behavior Pattern</h3>
                        <p className="text-gray-300 text-sm mb-4">Is/was the oil warning light:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { updateResponse('lightStatus', 'constant'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'constant'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'constant' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'constant' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Constantly ON while moving</span>
                                        <p className="text-sm text-gray-300 mt-1">Light stays on continuously - critical oil pressure loss</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('lightStatus', 'intermittent'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'intermittent'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'intermittent' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'intermittent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Intermittent/Flickering</span>
                                        <p className="text-sm text-gray-300 mt-1">Light comes on occasionally - still serious concern</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => { updateResponse('lightStatus', 'idle_only'); onNext(); }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.lightStatus === 'idle_only'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.lightStatus === 'idle_only' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.lightStatus === 'idle_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💙 Only at idle/stationary</span>
                                        <p className="text-sm text-gray-300 mt-1">Light appears when stopped but goes off when moving</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    {/* Critical oil pressure failure warning */}
                    {(responses.lightStatus === 'constant' || responses.lightStatus === 'intermittent') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🛑 Critical Oil Pressure Failure</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Oil light while moving indicates severe oil system failure:</p>
                                        <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                            <li>In line with standard control-room procedure: STOP immediately and seek assistance from engineering</li>
                                            <li>Engine damage may already be occurring</li>
                                            <li>Complete engine failure possible at any moment</li>
                                            <li>Risk of engine seizure while driving</li>
                                            <li>DVSA dangerous defect - potential immediate prohibition</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h4 className="text-lg font-bold text-amber-200 mb-3">🔍 Additional Symptoms Check</h4>
                        <p className="text-amber-300/80 mb-2">Ask the driver about these additional symptoms:</p>
                        <ul className="list-disc ml-6 space-y-1 text-amber-300/80 text-sm">
                            <li>Engine noises (knocking, tapping, grinding sounds)</li>
                            <li>Noticeable loss of power during acceleration</li>
                            <li>Engine running rough or misfiring</li>
                            <li>Blue or white smoke from exhaust</li>
                            <li>Burning oil smell in cabin or outside</li>
                            <li>Temperature gauge reading higher than normal</li>
                        </ul>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h4 className="text-lg font-bold text-blue-200 mb-3">📦 DVSA Defect Categories - Oil System</h4>
                        <div className="space-y-3">
                            <div className="bg-white/10 rounded p-3">
                                <p className="text-blue-300/90 font-semibold text-sm mb-1">Immediate Prohibition (I) - STOP Required:</p>
                                <ul className="list-disc ml-6 text-blue-300/80 text-xs space-y-1">
                                    <li>Oil leak likely to deposit on road</li>
                                    <li>Oil leak obscuring driver's vision</li>
                                    <li>Oil contamination causing danger</li>
                                    <li>Fire risk from oil on hot surfaces</li>
                                </ul>
                            </div>
                            <div className="bg-white/10 rounded p-3">
                                <p className="text-blue-300/90 font-semibold text-sm mb-1">Delayed Prohibition (D) - Can Continue Short Distance:</p>
                                <ul className="list-disc ml-6 text-blue-300/80 text-xs space-y-1">
                                    <li>Excessive oil contamination on vehicle</li>
                                    <li>Minor oil leak not posing immediate danger</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.lightStatus}
                            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Final Assessment <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            const isStopped = responses.vehicleStopped === 'yes';
            const hasLeak = responses.oilLeakVisible === 'yes';
            const cannotCheckLeak = responses.oilLeakVisible === 'cannot_check';
            const lightConstant = responses.lightStatus === 'constant';
            const lightIntermittent = responses.lightStatus === 'intermittent';
            const idleOnly = responses.lightStatus === 'idle_only';
            
            // In line with standard control-room procedure page 22 - any oil light on or intermittent while moving = STOP
            // DVSA categorisation: Oil leak likely to deposit on road or cause danger = Immediate prohibition
            const mustStop = hasLeak || lightConstant || lightIntermittent || cannotCheckLeak;
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Oil Warning System Assessment Report</h2>
                        <p className="text-gray-300">Complete assessment following operational procedure reference and DVSA defect categorisation standards.</p>
                    </div>
                    
                    {/* Assessment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Vehicle Status:</span>
                                <span className="text-white ml-2">{isStopped ? '✅ Stopped safely' : '⚠️ Still moving'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Oil Leak:</span>
                                <span className="text-white ml-2">{
                                    hasLeak ? '🔴 Visible leak detected' : 
                                    cannotCheckLeak ? '⚠️ Unable to verify' : 
                                    '✅ No visible leak'
                                }</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Warning Light:</span>
                                <span className="text-white ml-2">{
                                    lightConstant ? '🔴 Constantly on' :
                                    lightIntermittent ? '🟡 Intermittent' :
                                    '🟢 Only at idle'
                                }</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Final Decision */}
                    {mustStop ? (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛑</div>
                                <h3 className="text-2xl font-bold text-red-200 mb-2">STOP IMMEDIATELY - AWAIT ENGINEERING</h3>
                                <p className="text-red-300/90 text-sm mb-6">
                                    In line with standard control-room procedure: Vehicle must remain stopped with engine OFF - Await engineering assistance
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-red-200 mb-3">Standard procedure mandatory actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-red-300/90 text-sm">
                                        <li>Ensure vehicle is stopped safely (if not already)</li>
                                        <li>Switch off engine immediately and do NOT restart</li>
                                        <li>Do NOT attempt to move vehicle under any circumstances</li>
                                        <li>Await assistance from engineering</li>
                                        <li>Record defect immediately in Tranzaura system</li>
                                        <li>If oil poses fire/hazard risk - escalate as potential PG9 issue</li>
                                        <li>Coordinate replacement vehicle to minimise service disruption</li>
                                    </ol>
                                </div>
                                
                                {hasLeak && (
                                    <div className="bg-red-400/20 backdrop-blur-sm rounded p-4 mt-4">
                                        <p className="font-semibold text-red-200 mb-2">⚠️ Fire or Hazard Risk (per operational safety procedures):</p>
                                        <ul className="list-disc ml-6 text-red-300/90 text-sm space-y-1">
                                            <li>Fire risk if oil contacts hot engine components</li>
                                            <li>Hazard to other road users from oil on road</li>
                                            <li>Environmental hazard requiring containment</li>
                                            <li>DVSA immediate prohibition (PG9) may be issued</li>
                                            <li>Escalate immediately if poses fire/hazard risk</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-amber-200 mb-2">MONITOR CLOSELY - ENGINEERING REQUIRED</h3>
                                <p className="text-amber-300/90 text-sm mb-6">
                                    Oil light only at idle - not currently covered by Step 3 criteria
                                </p>
                            </div>
                            
                            <div className="text-left">
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-amber-200 mb-3">Precautionary Actions:</h4>
                                    <ol className="list-decimal ml-6 space-y-2 text-amber-300/90 text-sm">
                                        <li>Stop at next safe opportunity for oil level check</li>
                                        <li>Check oil level when engine is cool (if trained to do so)</li>
                                        <li>Do NOT continue if light appears while moving</li>
                                        <li>If light becomes constant/intermittent while moving - STOP immediately</li>
                                        <li>Arrange engineering inspection at earliest opportunity</li>
                                        <li>Record in Tranzaura system for tracking</li>
                                        <li>Monitor for any change that triggers Step 3 criteria</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Documentation requirements */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Tranzaura Documentation Required</h4>
                                <ul className="list-disc ml-6 space-y-1 text-blue-300/80 text-sm">
                                    <li>Record defect immediately in Tranzaura when stationary and safe</li>
                                    <li>Mark as {mustStop ? 'CRITICAL - Vehicle stopped' : 'Engineering required'}</li>
                                    <li>Include all operational step outcomes</li>
                                    <li>Note if fire/hazard risk escalation required</li>
                                    <li>Document oil leak presence/absence</li>
                                    <li>Record light behavior (constant/intermittent/idle only)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* SDC Policy reminder */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h4 className="font-semibold text-purple-200 mb-2">🔔 Operational safety policy & DVSA Compliance</h4>
                        <p className="text-purple-300/80 text-sm mb-3">
                            Safety First: Stop immediately if any doubt exists. In line with standard control-room procedure, oil warning lights require immediate stop and engineering assistance. 
                            DVSA may issue immediate prohibition (PG9) for oil leaks posing fire/hazard risks. Service continuity is secondary to safety.
                        </p>
                        <div className="bg-white/10 rounded p-3">
                            <p className="text-purple-300/90 font-semibold text-xs mb-1">Reference Documents:</p>
                            <ul className="list-disc ml-6 text-purple-300/80 text-xs space-y-1">
                                <li>Operational safety procedures v1.3 - Page 22</li>
                                <li>DVSA Categorisation of Vehicle Defects - IM 44 (Oil and waste leaks)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={async () => {
                                // Determine final decision based on assessment
                                const finalDecision = mustStop ? 'STOP' : 'AMBER';

                                // Build assessment notes
                                const assessmentNotes = mustStop
                                    ? `STOP REQUIRED - Oil warning assessment: ${
                                        hasLeak ? 'Visible oil leak detected. ' : ''
                                      }${lightConstant ? 'Oil light constantly on while moving. ' : ''}${
                                        lightIntermittent ? 'Oil light intermittent while moving. ' : ''
                                      }${cannotCheckLeak ? 'Unable to verify oil leak status. ' : ''}In line with standard control-room procedure Page 22 - Vehicle must remain stopped, engine OFF, await engineering assistance.`
                                    : `AMBER - Monitor closely. Oil light only at idle. In line with standard control-room procedure - not currently covered by Step 3 criteria. Stop at next safe opportunity for oil level check. Arrange engineering inspection ASAP.`;

                                console.log('🛢️ Oil Warning Assessment Complete:', {
                                    decision: finalDecision,
                                    mustStop,
                                    hasLeak,
                                    lightConstant,
                                    lightIntermittent,
                                    cannotCheckLeak,
                                    notes: assessmentNotes
                                });

                                // Log breakdown if must stop (critical condition)
                                if (mustStop) {
                                    try {
                                        await window.logBreakdown({
                                            supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
                                            vehicleReg: window.selectedReg || 'Unknown',
                                            fleetNo: window.selectedFleetNo || 'Unknown',
                                            breakdownType: 'Oil Warning Light',
                                            timestamp: new Date().toISOString()
                                        });
                                        console.log('✅ Oil Warning Light breakdown logged successfully');
                                    } catch (error) {
                                        console.error('Failed to log oil warning breakdown:', error);
                                        // Don't block completion if logging fails
                                    }
                                }

                                // Pass decision and notes to onComplete
                                onComplete(finalDecision, assessmentNotes);
                            }}
                            className={`flex items-center px-6 py-2 text-white rounded-lg transition-colors ${
                                mustStop
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />Complete Assessment - {mustStop ? 'STOP' : 'AMBER'}
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.OilWarningLightWizard = OilWarningLightWizard;

export default OilWarningLightWizard;
