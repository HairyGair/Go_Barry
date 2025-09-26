// Step 3 - Initial Assessment Component
// Common assessment step for breakdown evaluations with passenger status and safety checks
// Integrates with all wizard types for consistent initial evaluation

import React, { useState, useEffect } from 'react';
import * as Icons from './common/icons.jsx';

const Step3InitialAssessment = ({
    responses,
    updateResponse,
    onNext,
    onPrevious,
    vehicle,
    routeInfo,
    wizardType = 'breakdown'
}) => {
    const {
        Users,
        Shield,
        AlertTriangle,
        CheckCircle,
        XCircle,
        ArrowLeft,
        ArrowRight,
        AlertCircle,
        Eye,
        ClipboardList
    } = Icons;

    // State management
    const [passengersOnBoard, setPassengersOnBoard] = useState(
        responses.passengersOnBoard !== undefined ? responses.passengersOnBoard : null
    );
    const [passengerCount, setPassengerCount] = useState(
        responses.passengerCount || ''
    );
    const [safetyChecksComplete, setSafetyChecksComplete] = useState(
        responses.safetyChecksComplete !== undefined ? responses.safetyChecksComplete : null
    );
    const [visualInspectionComplete, setVisualInspectionComplete] = useState(
        responses.visualInspectionComplete !== undefined ? responses.visualInspectionComplete : null
    );
    const [initialObservations, setInitialObservations] = useState(
        responses.initialObservations || ''
    );

    // Update parent responses when state changes
    useEffect(() => {
        if (passengersOnBoard !== null) {
            updateResponse('passengersOnBoard', passengersOnBoard);
        }
    }, [passengersOnBoard, updateResponse]);

    useEffect(() => {
        updateResponse('passengerCount', passengerCount);
    }, [passengerCount, updateResponse]);

    useEffect(() => {
        if (safetyChecksComplete !== null) {
            updateResponse('safetyChecksComplete', safetyChecksComplete);
        }
    }, [safetyChecksComplete, updateResponse]);

    useEffect(() => {
        if (visualInspectionComplete !== null) {
            updateResponse('visualInspectionComplete', visualInspectionComplete);
        }
    }, [visualInspectionComplete, updateResponse]);

    useEffect(() => {
        updateResponse('initialObservations', initialObservations);
    }, [initialObservations, updateResponse]);

    // Check if all required fields are completed
    const isStepComplete = () => {
        return passengersOnBoard !== null &&
               safetyChecksComplete !== null &&
               visualInspectionComplete !== null;
    };

    // Handle next step
    const handleNext = () => {
        if (!isStepComplete()) {
            return; // Prevent proceeding if not all required fields are completed
        }
        onNext();
    };

    // Get wizard-specific context
    const getWizardContext = () => {
        const contexts = {
            'steering': {
                title: 'Steering System Initial Assessment',
                icon: '🚗',
                description: 'Initial safety evaluation before detailed steering system inspection',
                criticalNote: 'Steering defects are safety-critical and may require immediate action'
            },
            'brakes': {
                title: 'Brake System Initial Assessment',
                icon: '🛑',
                description: 'Initial evaluation before detailed brake system inspection',
                criticalNote: 'Brake defects are safety-critical and may require immediate action'
            },
            'doors': {
                title: 'Door System Initial Assessment',
                icon: '🚪',
                description: 'Initial evaluation of door operation and passenger safety',
                criticalNote: 'Door defects may affect passenger boarding and safety'
            },
            'default': {
                title: 'Initial Assessment',
                icon: '🔍',
                description: 'Initial evaluation and safety checks',
                criticalNote: 'Safety-critical issues may require immediate action'
            }
        };

        return contexts[wizardType] || contexts['default'];
    };

    const context = getWizardContext();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{context.icon} {context.title}</h2>
                <p className="text-gray-300">{context.description}</p>
            </div>

            {/* Vehicle and Route Info */}
            {(vehicle || routeInfo) && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600/50">
                    <h3 className="font-semibold text-white mb-3">Assessment Context</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {vehicle && (
                            <div>
                                <span className="text-gray-400">Vehicle:</span>
                                <span className="text-white ml-2">
                                    {vehicle.fleetNumber} ({vehicle.regNo})
                                </span>
                            </div>
                        )}
                        {routeInfo && routeInfo.route && (
                            <div>
                                <span className="text-gray-400">Route:</span>
                                <span className="text-white ml-2">
                                    {routeInfo.route} - {routeInfo.routeName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Critical Safety Notice */}
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-yellow-200 mb-1">Safety First</h4>
                        <p className="text-yellow-200/80 text-sm">{context.criticalNote}</p>
                    </div>
                </div>
            </div>

            {/* Safety Checks Section */}
            <div className="assessment-section bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-600/30">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Safety Checks</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Have you completed initial safety checks (hazard awareness, vehicle stability, immediate dangers)?
                    </p>

                    <div className="radio-group space-y-3">
                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            safetyChecksComplete === true
                                ? 'border-green-500 bg-green-500/10 text-green-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="safetyChecks"
                                value="true"
                                checked={safetyChecksComplete === true}
                                onChange={() => setSafetyChecksComplete(true)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                safetyChecksComplete === true ? 'border-green-500 bg-green-500' : 'border-gray-500'
                            }`}>
                                {safetyChecksComplete === true && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>Safety checks completed</span>
                            </div>
                        </label>

                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            safetyChecksComplete === false
                                ? 'border-red-500 bg-red-500/10 text-red-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="safetyChecks"
                                value="false"
                                checked={safetyChecksComplete === false}
                                onChange={() => setSafetyChecksComplete(false)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                safetyChecksComplete === false ? 'border-red-500 bg-red-500' : 'border-gray-500'
                            }`}>
                                {safetyChecksComplete === false && <XCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span>Safety concerns identified</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Passenger Status Section */}
            <div className="assessment-section bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-600/30">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Passenger Status</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Are there passengers currently on board the vehicle?
                    </p>

                    <div className="radio-group space-y-3">
                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            passengersOnBoard === true
                                ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="passengers"
                                value="yes"
                                checked={passengersOnBoard === true}
                                onChange={() => setPassengersOnBoard(true)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                passengersOnBoard === true ? 'border-orange-500 bg-orange-500' : 'border-gray-500'
                            }`}>
                                {passengersOnBoard === true && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-400" />
                                <span>Passengers on board</span>
                            </div>
                        </label>

                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            passengersOnBoard === false
                                ? 'border-green-500 bg-green-500/10 text-green-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="passengers"
                                value="no"
                                checked={passengersOnBoard === false}
                                onChange={() => setPassengersOnBoard(false)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                passengersOnBoard === false ? 'border-green-500 bg-green-500' : 'border-gray-500'
                            }`}>
                                {passengersOnBoard === false && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>No passengers</span>
                            </div>
                        </label>
                    </div>

                    {/* Passenger Safety Notice */}
                    {passengersOnBoard === true && (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30 mt-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-orange-200 mb-1">Passenger Safety Priority</h4>
                                    <p className="text-orange-200/80 text-sm">
                                        Passengers on board require priority consideration. Ensure passenger safety and comfort
                                        during assessment. Consider evacuation procedures if safety-critical defects are identified.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Passenger Count Input */}
                    {passengersOnBoard === true && (
                        <div className="passenger-count-input fade-in bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-500/30 mt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Users className="w-5 h-5 text-purple-400" />
                                <h4 className="font-semibold text-white">Passenger Count</h4>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm text-gray-300">
                                    Approximate passenger count:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={passengerCount}
                                    onChange={(e) => setPassengerCount(e.target.value)}
                                    placeholder="Enter number"
                                    className="count-input w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <p className="text-gray-500 text-xs">
                                    Optional: Helps prioritize response and evacuation planning if needed.
                                </p>
                                {passengerCount === '' ? (
                                    <div className="flex items-center gap-2 mt-2 text-yellow-400 text-xs">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Consider providing approximate passenger count for better emergency planning</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Passenger count recorded - emergency response can be prioritized accordingly</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Inspection Section */}
            <div className="assessment-section bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-600/30">
                <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Visual Inspection</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Have you completed an initial visual inspection of the affected system/area?
                    </p>

                    <div className="radio-group space-y-3">
                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            visualInspectionComplete === true
                                ? 'border-green-500 bg-green-500/10 text-green-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="visualInspection"
                                value="true"
                                checked={visualInspectionComplete === true}
                                onChange={() => setVisualInspectionComplete(true)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                visualInspectionComplete === true ? 'border-green-500 bg-green-500' : 'border-gray-500'
                            }`}>
                                {visualInspectionComplete === true && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-green-400" />
                                <span>Visual inspection completed</span>
                            </div>
                        </label>

                        <label className={`radio-label flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            visualInspectionComplete === false
                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-200'
                                : 'border-gray-600 hover:border-gray-500 text-gray-300'
                        }`}>
                            <input
                                type="radio"
                                name="visualInspection"
                                value="false"
                                checked={visualInspectionComplete === false}
                                onChange={() => setVisualInspectionComplete(false)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                visualInspectionComplete === false ? 'border-yellow-500 bg-yellow-500' : 'border-gray-500'
                            }`}>
                                {visualInspectionComplete === false && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-400" />
                                <span>Unable to complete inspection</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Initial Observations */}
            <div className="assessment-section bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-600/30">
                <div className="flex items-center gap-3 mb-4">
                    <ClipboardList className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Initial Observations</h3>
                </div>

                <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                        Record any initial observations, concerns, or relevant details about the issue:
                    </p>

                    <textarea
                        value={initialObservations}
                        onChange={(e) => setInitialObservations(e.target.value)}
                        placeholder="Enter initial observations, symptoms noticed, driver reports, environmental conditions, etc..."
                        className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />

                    <p className="text-gray-500 text-xs">
                        Optional: This information will be included in the assessment report.
                    </p>
                </div>
            </div>

            {/* Validation Message */}
            {!isStepComplete() && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/30">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-red-200 mb-1">Required Information Missing</h4>
                            <p className="text-red-200/80 text-sm">
                                Please complete all required sections before continuing to the detailed assessment.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4">
                <button
                    onClick={onPrevious}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isStepComplete()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                        isStepComplete()
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    Continue to Detailed Assessment <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Step3InitialAssessment;