import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Speedo Wizard Component
// Follows operational safety procedures - Section 25

const SpeedoWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Gauge } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                        <div className="flex items-center mb-4">
                            {Gauge && <Gauge className="w-8 h-8 text-blue-400 mr-3" />}
                            <h2 className="text-2xl font-bold text-white">Speedometer Assessment</h2>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Let's assess the speedometer issue to determine the appropriate course of action.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-orange-300 mb-2">Speedometer Not Working</h3>
                                <p className="text-orange-200 text-sm">
                                    Per Guide v6: A changeover must be arranged at the earliest reasonable time. We need to check whether the vehicle has a tachograph to determine interim speed monitoring.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {ArrowLeft && <ArrowLeft className="w-4 h-4 mr-2" />}
                            Back
                        </button>
                        
                        <button
                            onClick={onNext}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Check Tachograph
                            {ArrowRight && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                        <div className="flex items-center mb-4">
                            {Gauge && <Gauge className="w-8 h-8 text-blue-400 mr-3" />}
                            <h2 className="text-2xl font-bold text-white">Tachograph Check</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-3">Is the vehicle fitted with a tachograph?</h3>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => { updateResponse('has_tachograph', 'yes'); onNext(); }}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        responses.has_tachograph === 'yes'
                                            ? 'border-blue-500 bg-blue-500/20 text-white'
                                            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {CheckCircle && <CheckCircle className="w-5 h-5 mr-3 text-blue-400" />}
                                        <span>Yes - Vehicle has a tachograph</span>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => { updateResponse('has_tachograph', 'no'); onNext(); }}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        responses.has_tachograph === 'no'
                                            ? 'border-orange-500 bg-orange-500/20 text-white'
                                            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-orange-400'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {XCircle && <XCircle className="w-5 h-5 mr-3 text-orange-400" />}
                                        <span>No - Vehicle does not have a tachograph</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {responses.has_tachograph === 'yes' && (
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-3">Is the tachograph head closed and functioning?</h3>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => { updateResponse('tacho_working', 'yes'); onNext(); }}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            responses.tacho_working === 'yes'
                                                ? 'border-green-500 bg-green-500/20 text-white'
                                                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-green-400'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            {CheckCircle && <CheckCircle className="w-5 h-5 mr-3 text-green-400" />}
                                            <span>Yes - Tachograph is closed and working</span>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => { updateResponse('tacho_working', 'no'); onNext(); }}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            responses.tacho_working === 'no'
                                                ? 'border-red-500 bg-red-500/20 text-white'
                                                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-red-400'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            {XCircle && <XCircle className="w-5 h-5 mr-3 text-red-400" />}
                                            <span>No - Tachograph head is not closed or not working</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {ArrowLeft && <ArrowLeft className="w-4 h-4 mr-2" />}
                            Back
                        </button>
                        
                        <button
                            onClick={onNext}
                            disabled={!responses.has_tachograph || (responses.has_tachograph === 'yes' && !responses.tacho_working)}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            {ArrowRight && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>
                </div>
            );

        case 3:
            // Guide v6: Speedo not working = ALWAYS arrange changeover
            // Tachograph only provides interim speed reference, does NOT exempt from changeover
            const hasTachoReference = responses.has_tachograph === 'yes' && responses.tacho_working === 'yes';

            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                        <div className="flex items-center mb-4">
                            {Shield && <Shield className="w-8 h-8 text-orange-400 mr-3" />}
                            <h2 className="text-2xl font-bold text-white">Safety Decision</h2>
                        </div>

                        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center mb-3">
                                {AlertTriangle && <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />}
                                <h3 className="text-lg font-bold text-orange-400">Changeover Required</h3>
                            </div>
                            <p className="text-orange-200 mb-4">
                                {hasTachoReference
                                    ? 'The speedometer is not working. The tachograph can provide interim speed reference while driving to the changeover point, but a changeover must still be arranged.'
                                    : 'The speedometer is not working and there is no functioning tachograph. A changeover must be arranged at the earliest opportunity.'}
                            </p>
                            <div className="space-y-3 text-orange-200">
                                <p><strong>• Arrange changeover:</strong> At the next convenient location and time within a reasonable timeframe</p>
                                <p><strong>• Driver instruction:</strong> Drive with extreme caution and do not exceed any speed limits</p>
                                {hasTachoReference && (
                                    <p><strong>• Tachograph:</strong> Use tachograph for interim speed reference while driving to changeover</p>
                                )}
                                <p><strong>• If considerable distance:</strong> Plan to change at a convenient point en-route</p>
                                <p><strong>• Priority:</strong> Avoid unnecessary delay or loss of mileage</p>
                            </div>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-2">Key Safety Points:</h4>
                            <ul className="space-y-1 text-gray-300">
                                <li>• Speed limit compliance is mandatory at all times</li>
                                <li>• Driver comfort and safety takes priority</li>
                                <li>• If driver has concerns about continuing, stop and seek engineering advice</li>
                                <li>• Extreme caution required when driving without functioning speedometer</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {ArrowLeft && <ArrowLeft className="w-4 h-4 mr-2" />}
                            Back
                        </button>
                        
                        <button
                            onClick={onNext}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Complete Assessment
                            {ArrowRight && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>
                </div>
            );

        case 4:
            // Guide v6: ALL speedo-not-working cases require changeover
            const decision = 'CHANGEOVER_REQUIRED';
            const tachoAvailable = responses.has_tachograph === 'yes' && responses.tacho_working === 'yes';

            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                        <div className="flex items-center mb-4">
                            {FileText && <FileText className="w-8 h-8 text-green-400 mr-3" />}
                            <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-3">Assessment Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Speedometer Working:</span>
                                        <span className={responses.speedo_not_working === 'no' ? 'text-green-400' : 'text-red-400'}>
                                            {responses.speedo_not_working === 'no' ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Has Tachograph:</span>
                                        <span className={responses.has_tachograph === 'yes' ? 'text-green-400' : 'text-orange-400'}>
                                            {responses.has_tachograph === 'yes' ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    {responses.has_tachograph === 'yes' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Tachograph Working:</span>
                                            <span className={responses.tacho_working === 'yes' ? 'text-green-400' : 'text-red-400'}>
                                                {responses.tacho_working === 'yes' ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="font-semibold text-white mb-3">Decision</h3>
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
                                    Changeover Required{tachoAvailable ? ' (Tacho available for interim reference)' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                {AlertCircle && <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />}
                                <h4 className="font-semibold text-blue-400">Required Actions</h4>
                            </div>
                            <div className="space-y-2 text-blue-200 text-sm">
                                <p>• Record this defect immediately on their handheld device</p>
                                <p>• Communicate decision clearly to the driver</p>
                                <p>• Arrange changeover at earliest reasonable opportunity</p>
                                <p>• Driver must drive with extreme caution and not exceed speed limits</p>
                                {tachoAvailable && (
                                    <p>• Use tachograph for interim speed reference while driving to changeover</p>
                                )}
                                <p>• If considerable distance to changeover, plan to change at convenient point en-route</p>
                                <p>• Monitor situation and provide updates as needed</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {ArrowLeft && <ArrowLeft className="w-4 h-4 mr-2" />}
                            Back
                        </button>
                        
                        <button
                            onClick={onComplete}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            {Home && <Home className="w-4 h-4 mr-2" />}
                            Complete & Return to Menu
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.SpeedoWizard = SpeedoWizard;
export default SpeedoWizard;
