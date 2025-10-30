import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Enhanced Steering Wizard Component with Comprehensive Logging
// Logs every supervisor decision and action for complete audit trail
// Follows operational safety procedures - Steering Section (Page 8)

const EnhancedSteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    // Enhanced update response with logging
    const loggedUpdateResponse = (key, value, isStaCritical = false) => {
        // Log the decision immediately
        if (window.SupervisorBreakdownLogger) {
            window.SupervisorBreakdownLogger.logDecision(
                key,
                value,
                isCritical ? 'Safety-critical steering issue' : 'Steering assessment response'
            );
            
            // Log specific safety determinations
            if (isCritical) {
                window.SupervisorBreakdownLogger.logSafetyDetermination(
                    'steering',
                    'CRITICAL',
                    `${key}: ${value} - Vehicle must stop immediately`
                );
            }
        }
        
        // Update the response
        updateResponse(key, value);
    };
    
    // Enhanced next handler with step logging
    const handleNextWithLogging = () => {
        // Log step completion with all responses for this step
        if (window.SupervisorBreakdownLogger) {
            const stepResponses = {};
            switch(currentStep) {
                case 1:
                    stepResponses.initial_concern = responses.initial_concern;
                    break;
                case 2:
                    stepResponses.excessive_play = responses.excessive_play;
                    stepResponses.play_measurement = responses.play_measurement;
                    break;
                case 3:
                    stepResponses.difficulty_turning = responses.difficulty_turning;
                    stepResponses.turning_symptoms = responses.turning_symptoms;
                    break;
                case 4:
                    stepResponses.steering_noises = responses.steering_noises;
                    stepResponses.noise_type = responses.noise_type;
                    break;
                case 5:
                    stepResponses.vehicle_pulling = responses.vehicle_pulling;
                    stepResponses.pulling_direction = responses.pulling_direction;
                    break;
            }
            
            window.SupervisorBreakdownLogger.logStepProgression(
                currentStep,
                `Steering Assessment Step ${currentStep}`,
                stepResponses
            );
        }
        onNext();
    };
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Steering System Safety Assessment</h2>
                        <p className="text-gray-300">Critical safety evaluation following operational safety procedures - ensuring steering system control and directional stability.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ SAFETY-CRITICAL CONTROL SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Steering system defects pose immediate danger to vehicle control and directional stability. ANY compromise requires immediate action.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Critical operational requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>DVSA expects no more than 75mm play for power steering vehicles</li>
                                <li>ANY steering defect = immediate vehicle shutdown</li>
                                <li>Await engineering attendance - no exceptions</li>
                                <li>Document everything for safety compliance</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Initial Steering System Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What steering system condition requires assessment? (ANY of these = critical stop)</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    loggedUpdateResponse('initial_concern', 'excessive_play', true);
                                    // Log the critical nature immediately
                                    if (window.SupervisorBreakdownLogger) {
                                        window.SupervisorBreakdownLogger.logAction('CRITICAL_ISSUE_IDENTIFIED', {
                                            system: 'steering',
                                            issue: 'excessive_play',
                                            severity: 'STOP_VEHICLE',
                                            regulation: 'DVSA 75mm limit exceeded'
                                        });
                                    }
                                }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'excessive_play'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'excessive_play' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'excessive_play' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🎯 Excessive steering wheel play</span>
                                        <p className="text-sm text-gray-300 mt-1">Steering wheel movement before wheels respond (>75mm limit)</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => {
                                    loggedUpdateResponse('initial_concern', 'difficulty_steering', true);
                                    if (window.SupervisorBreakdownLogger) {
                                        window.SupervisorBreakdownLogger.logAction('CRITICAL_ISSUE_IDENTIFIED', {
                                            system: 'steering',
                                            issue: 'difficulty_steering',
                                            severity: 'STOP_VEHICLE',
                                            safety_impact: 'Loss of vehicle control risk'
                                        });
                                    }
                                }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'difficulty_steering'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'difficulty_steering' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'difficulty_steering' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💪 Difficulty steering or maintaining control</span>
                                        <p className="text-sm text-gray-300 mt-1">Heavy steering, hard to turn, or control issues</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => {
                                    loggedUpdateResponse('initial_concern', 'other_symptoms', false);
                                    if (window.SupervisorBreakdownLogger) {
                                        window.SupervisorBreakdownLogger.logAction('ASSESSMENT_CONTINUE', {
                                            system: 'steering',
                                            reason: 'Other symptoms require further investigation'
                                        });
                                    }
                                }}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.initial_concern === 'other_symptoms'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.initial_concern === 'other_symptoms' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.initial_concern === 'other_symptoms' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔍 Other steering symptoms</span>
                                        <p className="text-sm text-gray-300 mt-1">Noises, vibration, or other concerns</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            disabled
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={handleNextWithLogging}
                            disabled={!responses.initial_concern}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );
            
        case 2:
            // Step 2: Detailed assessment based on initial concern
            if (responses.initial_concern === 'excessive_play') {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">🎯 Excessive Play Assessment</h2>
                            <p className="text-gray-300">Measuring steering wheel play against DVSA standards</p>
                        </div>

                        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                            <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ DVSA Compliance Check</h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-lg p-4">
                                    <p className="text-red-300 mb-3">Is the steering wheel play MORE than 75mm (3 inches)?</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                loggedUpdateResponse('excessive_play', 'yes', true);
                                                loggedUpdateResponse('play_measurement', '>75mm', true);
                                                if (window.SupervisorBreakdownLogger) {
                                                    window.SupervisorBreakdownLogger.logAction('DVSA_VIOLATION', {
                                                        regulation: 'DVSA steering play limit',
                                                        limit: '75mm',
                                                        status: 'EXCEEDED',
                                                        action: 'IMMEDIATE_STOP_REQUIRED'
                                                    });
                                                }
                                            }}
                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                responses.excessive_play === 'yes'
                                                    ? 'border-red-400 bg-red-400/20 text-red-200'
                                                    : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                            }`}
                                        >
                                            <span className="font-medium">YES - Exceeds 75mm limit (STOP VEHICLE)</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                loggedUpdateResponse('excessive_play', 'no', false);
                                                loggedUpdateResponse('play_measurement', '<75mm', false);
                                                if (window.SupervisorBreakdownLogger) {
                                                    window.SupervisorBreakdownLogger.logAction('DVSA_COMPLIANCE', {
                                                        regulation: 'DVSA steering play limit',
                                                        limit: '75mm',
                                                        status: 'WITHIN_LIMIT',
                                                        action: 'Monitor and report'
                                                    });
                                                }
                                            }}
                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                responses.excessive_play === 'no'
                                                    ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                                    : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                            }`}
                                        >
                                            <span className="font-medium">NO - Within 75mm limit (Report for monitoring)</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {responses.excessive_play === 'yes' && (
                                    <div className="bg-red-900/30 rounded-lg p-4 border border-red-500">
                                        <h4 className="font-bold text-red-200 mb-2">🛑 IMMEDIATE ACTION REQUIRED</h4>
                                        <ul className="list-disc list-inside space-y-1 text-red-300 text-sm">
                                            <li>Vehicle MUST NOT continue in service</li>
                                            <li>Contact engineering immediately</li>
                                            <li>Document exact play measurement if possible</li>
                                            <li>Ensure driver and passengers are safe</li>
                                        </ul>
                                    </div>
                                )
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={onPrevious}
                                className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Previous
                            </button>
                            <button
                                onClick={handleNextWithLogging}
                                disabled={!responses.excessive_play}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </div>
                );
            }
            
            // Continue with other assessment paths...
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Further Assessment Required</h2>
                        <p className="text-gray-300">Continue with detailed steering system checks</p>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={handleNextWithLogging}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Next
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );
            
        case 3:
            // Final summary and decision
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete</h2>
                        <p className="text-gray-300">Review and confirm final determination</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Initial Concern:</span>
                                <span className="text-white">{responses.initial_concern}</span>
                            </div>
                            {responses.excessive_play && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Excessive Play:</span>
                                    <span className={responses.excessive_play === 'yes' ? 'text-red-400' : 'text-amber-400'}>
                                        {responses.excessive_play === 'yes' ? 'YES - STOP VEHICLE' : 'No - Monitor'}
                                    </span>
                                </div>
                            )
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                // Log final decision
                                if (window.SupervisorBreakdownLogger) {
                                    const decision = responses.excessive_play === 'yes' ? 'STOP' : 'AMBER';
                                    window.SupervisorBreakdownLogger.logAction('FINAL_DECISION', {
                                        wizard: 'steering',
                                        decision: decision,
                                        criticalIssues: responses.excessive_play === 'yes' ? ['Excessive steering play >75mm'] : [],
                                        supervisorAction: decision === 'STOP' ? 'Vehicle removed from service' : 'Scheduled for inspection'
                                    });
                                }
                                onComplete();
                            }}
                            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Complete Assessment
                            <CheckCircle className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );
            
        default:
            return null;
    }
};

// Export for use
window.EnhancedSteeringWizard = EnhancedSteeringWizard;

export default EnhancedSteeringWizard;
