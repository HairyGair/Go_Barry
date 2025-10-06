import React, { useEffect } from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Puncture Wizard Component - SIMPLIFIED PER SDC GUIDE PAGE 32
// Follows exact SDC requirements:
// 1. Determine the Position of the Puncture (inner/outer, front/rear, offside/nearside)
// 2. Driver should stop immediately and seek advice from engineering

const PunctureWizard = ({ currentStep = 1, responses = {}, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, CheckCircle, FileText, Shield, AlertCircle, ArrowLeft } = Icons;
    
    // Debug logging
    console.log('[PunctureWizard] Rendering with step:', currentStep, 'at', new Date().toISOString());
    
    // Monitor currentStep changes
    useEffect(() => {
        console.log('[PunctureWizard] currentStep changed to:', currentStep);
    }, [currentStep]);
    
    // Ensure currentStep is valid
    const step = parseInt(currentStep) || 1;
    
    switch (step) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🛞 PUNCTURE - POSITION IDENTIFICATION</h2>
                        <p className="text-gray-300">SDC Guide Page 32: Stop immediately and identify puncture position</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ IMMEDIATE STOP REQUIRED</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Guide Requirements:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-red-300/90 text-sm">
                                <li><strong>Determine the Position of the Puncture:</strong>
                                    <ul className="list-disc list-inside ml-4 mt-1">
                                        <li>Identify whether it is an inner or outer tyre</li>
                                        <li>Determine whether it is on the rear or front</li>
                                        <li>Determine which side (offside or nearside)</li>
                                    </ul>
                                </li>
                                <li className="mt-2"><strong>Driver Action:</strong>
                                    <ul className="list-disc list-inside ml-4 mt-1">
                                        <li>Stop immediately</li>
                                        <li>Seek advice from engineering after providing position information</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Step 1: Front or Rear Position</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Is the puncture on the front or rear axle?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('axle_position', 'front')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.axle_position === 'front'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.axle_position === 'front' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.axle_position === 'front' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚗 Front axle</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering wheels - single tyre each side</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('axle_position', 'rear')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.axle_position === 'rear'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.axle_position === 'rear' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.axle_position === 'rear' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Rear axle</span>
                                        <p className="text-sm text-gray-300 mt-1">Drive wheels - may have dual tyres</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="flex justify-end pt-6 border-t border-white/20">
                        <button
                            onClick={() => {
                                console.log('[PunctureWizard] Next button clicked');
                                if (responses?.axle_position) {
                                    console.log('[PunctureWizard] Calling onNext()');
                                    onNext();
                                }
                            }}
                            disabled={!responses.axle_position}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            Next: Side Position →
                        </button>
                    </div>
                </div>
            );

        case 2:
            console.log('[PunctureWizard] Rendering step 2');
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🛞 PUNCTURE - SIDE POSITION</h2>
                        <p className="text-gray-300">Identify which side of the vehicle</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Step 2: Offside or Nearside</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Which side of the vehicle is the puncture on?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('side_position', 'nearside')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.side_position === 'nearside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.side_position === 'nearside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.side_position === 'nearside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👈 Nearside (Passenger side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Left side of the vehicle when facing forward</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('side_position', 'offside')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.side_position === 'offside'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.side_position === 'offside' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.side_position === 'offside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👉 Offside (Driver side)</span>
                                        <p className="text-sm text-gray-300 mt-1">Right side of the vehicle when facing forward</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Summary so far */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Position identified so far:</h4>
                        <p className="text-white">
                            {responses.axle_position === 'front' ? '🚗 Front' : '🚌 Rear'} axle
                        </p>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.side_position}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            {responses.axle_position === 'rear' ? 'Next: Inner/Outer →' : 'Contact Engineering →'}
                        </button>
                    </div>
                </div>
            );

        case 3:
            // Only show inner/outer selection for rear wheels
            if (responses.axle_position === 'rear') {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">🛞 PUNCTURE - DUAL WHEEL POSITION</h2>
                            <p className="text-gray-300">Rear wheels may have dual tyres</p>
                        </div>

                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                            <h3 className="text-lg font-semibold text-blue-200 mb-4">Step 3: Inner or Outer Tyre</h3>
                            <p className="text-blue-300/80 text-sm mb-4">For dual wheels, which tyre has the puncture?</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => updateResponse('tyre_position', 'inner')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.tyre_position === 'inner'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.tyre_position === 'inner' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.tyre_position === 'inner' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">🔵 Inner tyre</span>
                                            <p className="text-sm text-gray-300 mt-1">The tyre closest to the vehicle centre</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateResponse('tyre_position', 'outer')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.tyre_position === 'outer'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.tyre_position === 'outer' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.tyre_position === 'outer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">⭕ Outer tyre</span>
                                            <p className="text-sm text-gray-300 mt-1">The tyre furthest from the vehicle centre</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateResponse('tyre_position', 'single_tyre')}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        responses.tyre_position === 'single_tyre'
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            responses.tyre_position === 'single_tyre' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                        }`}>
                                            {responses.tyre_position === 'single_tyre' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div>
                                            <span className="font-medium">1️⃣ Single tyre only</span>
                                            <p className="text-sm text-gray-300 mt-1">This position has a single tyre, not dual</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Summary so far */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Position identified:</h4>
                            <p className="text-white">
                                🚌 Rear axle, {responses.side_position === 'nearside' ? '👈 Nearside' : '👉 Offside'}
                            </p>
                        </div>
                        
                        <div className="flex justify-between pt-6 border-t border-white/20">
                            <button
                                onClick={onPrevious}
                                className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous Step
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses.tyre_position}
                                className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                            >
                                Contact Engineering →
                            </button>
                        </div>
                    </div>
                );
            }
            // If front wheel, skip to engineering contact (step 4)
            else {
                return <PunctureWizardStep4 
                    responses={responses} 
                    updateResponse={updateResponse} 
                    onPrevious={onPrevious} 
                    onComplete={onComplete}
                    Icons={Icons}
                />;
            }

        case 4:
            return <PunctureWizardStep4 
                responses={responses} 
                updateResponse={updateResponse} 
                onPrevious={onPrevious} 
                onComplete={onComplete}
                Icons={Icons}
            />;

        default:
            console.error('PunctureWizard: Invalid step', step);
            return (
                <div className="text-white p-4">
                    <h2>Invalid step: {step}</h2>
                    <button 
                        onClick={() => onNext()} 
                        className="bg-blue-500 px-4 py-2 mt-4"
                    >
                        Reset to Step 1
                    </button>
                </div>
            );
    }
};

// Final step component
const PunctureWizardStep4 = ({ responses, updateResponse, onPrevious, onComplete, Icons }) => {
    const { AlertTriangle, CheckCircle, FileText, Shield, AlertCircle, ArrowLeft } = Icons;
    
    // Build position description
    const getPositionDescription = () => {
        let description = '';
        if (responses.axle_position === 'front') {
            description = `Front ${responses.side_position}`;
        } else {
            description = `Rear ${responses.side_position}`;
            if (responses.tyre_position && responses.tyre_position !== 'single_tyre') {
                description += `, ${responses.tyre_position} tyre`;
            }
        }
        return description;
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">📞 CONTACT ENGINEERING</h2>
                <p className="text-gray-300">SDC Guide: Stop immediately and seek engineering advice</p>
            </div>

            {/* Position Summary */}
            <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-6 border border-orange-400/50">
                <h3 className="text-lg font-semibold text-orange-200 mb-4">📍 Puncture Position Identified</h3>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-2xl font-bold text-orange-200">{getPositionDescription()}</p>
                    <p className="text-orange-300/80 text-sm mt-2">Provide this information to engineering</p>
                </div>
            </div>

            {/* Engineering Contact */}
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                <h3 className="text-lg font-semibold text-blue-200 mb-4">Engineering Contact Status</h3>
                <p className="text-blue-300/80 text-sm mb-4">Have you contacted engineering with the position information?</p>
                <div className="space-y-3">
                    <button
                        onClick={() => updateResponse('engineering_contacted', 'yes')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            responses.engineering_contacted === 'yes'
                                ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                responses.engineering_contacted === 'yes' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                            }`}>
                                {responses.engineering_contacted === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div>
                                <span className="font-medium">✅ Yes - Engineering contacted</span>
                                <p className="text-sm text-gray-300 mt-1">Position information provided, awaiting instructions</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => updateResponse('engineering_contacted', 'no')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            responses.engineering_contacted === 'no'
                                ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                responses.engineering_contacted === 'no' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                            }`}>
                                {responses.engineering_contacted === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div>
                                <span className="font-medium">❌ No - Not yet contacted</span>
                                <p className="text-sm text-gray-300 mt-1">Contact engineering immediately with position details</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* SDC Action Summary */}
            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                <div className="flex items-start space-x-4">
                    <Shield className="w-8 h-8 text-red-400 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-200 mb-3">🛑 SDC MANDATORY ACTIONS</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <ol className="list-decimal list-inside space-y-2 text-red-300/90">
                                <li>Vehicle must STOP immediately - no exceptions</li>
                                <li>Position identified: <strong>{getPositionDescription()}</strong></li>
                                <li>Engineering must be contacted with position information</li>
                                <li>Vehicle cannot continue without engineering approval</li>
                                <li>Document in Tranzaura when safe to do so</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning if engineering not contacted */}
            {responses.engineering_contacted === 'no' && (
                <div className="bg-yellow-500/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/50">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                        <p className="text-yellow-200 font-semibold">
                            ⚠️ You must contact engineering immediately before completing this assessment
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-6 border-t border-white/20">
                <button
                    onClick={onPrevious}
                    className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Step
                </button>
                <button
                    onClick={() => {
                        // Punctures always result in STOP decision per SDC Guide Page 32
                        const positionInfo = getPositionDescription();
                        const notes = `Puncture identified at ${positionInfo}. Engineering contacted and vehicle stopped as per SDC requirements.`;
                        onComplete('STOP', notes);
                    }}
                    disabled={responses.engineering_contacted !== 'yes'}
                    className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                >
                    <CheckCircle className="w-5 h-5 mr-2" />COMPLETE ASSESSMENT
                </button>
            </div>
        </div>
    );
};

// Export to global scope for loading
window.PunctureWizard = PunctureWizard;
export default PunctureWizard;
