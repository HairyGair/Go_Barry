// Steering Wizard Component - Safety-Critical Steering System Assessment
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide v1.3 - Steering Section (Page 8)
// DVSA Compliance: Categorisation of Vehicle Defects

import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

const SteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Steering System Safety Assessment</h2>
                        <p className="text-gray-300">Critical safety evaluation following SDC Engineering Issues Guide - ensuring steering system control and directional stability.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ SAFETY-CRITICAL CONTROL SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Steering system defects pose immediate danger to vehicle control and directional stability. ANY compromise requires immediate action.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Critical Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>DVSA expects no more than 75mm play at rim for power steering vehicles</li>
                                <li>ANY steering defect = immediate vehicle shutdown</li>
                                <li>NO exceptions for "continuing to next changeover"</li>
                                <li>Record all defects in Tranzaura System when stationary</li>
                            </ul>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onNext}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
                    >
                        Begin Critical Assessment <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            );
            
        case 2:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Driver Reporting - Steering Assessment</h2>
                    
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-200 text-sm">
                                Has the driver reported ANY steering issues, unusual noises, or control problems? All reports must be treated as critical.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                updateResponse(currentStep, 'no');
                                onNext();
                            }}
                            className="w-full bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 text-white font-medium py-4 px-6 rounded-lg border border-gray-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <span className="block">No Steering Issues Reported</span>
                                    <span className="text-sm text-gray-400">Driver reports steering operates normally</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                        
                        <button 
                            onClick={() => {
                                updateResponse(currentStep, 'yes');
                                onNext();
                            }}
                            className="w-full bg-red-900/30 backdrop-blur-sm hover:bg-red-900/50 text-white font-medium py-4 px-6 rounded-lg border border-red-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-400" />
                                <div>
                                    <span className="block">Steering Issue Reported</span>
                                    <span className="text-sm text-red-300">ANY steering complaint is safety-critical</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={onPrevious}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            );
            
        case 3:
            if (responses[2] === 'yes') {
                // IMMEDIATE STOP DECISION
                return (
                    <div className="space-y-6">
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-red-500">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                                <h2 className="text-2xl font-bold text-red-200">IMMEDIATE STOP REQUIRED</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-black/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-200 mb-2">SDC Mandate - STEERING DEFECTS:</h3>
                                    <p className="text-red-300 text-sm leading-relaxed">
                                        "If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance"
                                    </p>
                                </div>
                                
                                <div className="bg-red-950/50 backdrop-blur-sm rounded-lg p-4 border border-red-600/30">
                                    <h4 className="font-semibold text-red-200 mb-3">⚡ Required Actions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-red-300 text-sm">
                                        <li>Instruct driver to STOP IMMEDIATELY in safe location</li>
                                        <li>SWITCH OFF engine completely</li>
                                        <li>DO NOT attempt to move vehicle</li>
                                        <li>Await engineering attendance</li>
                                        <li>Log as SAFETY-CRITICAL STOP decision</li>
                                        <li>Record defect in Tranzaura System when stationary</li>
                                    </ol>
                                </div>
                                
                                <div className="bg-yellow-900/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-600/30">
                                    <h4 className="font-semibold text-yellow-200 mb-2">⚠️ DVSA Warning:</h4>
                                    <p className="text-yellow-300/90 text-sm">
                                        Operating with known steering defects risks immediate PG9 prohibition and severe penalties. 
                                        Steering defects are classified as "Dangerous" under DVSA categorisation.
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onComplete('stop', 'Steering issue reported - SDC mandatory STOP')}
                                className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                CONFIRM SAFETY STOP DECISION
                            </button>
                        </div>
                    </div>
                );
            } else {
                // Continue to physical assessment
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Physical Steering Assessment</h2>
                        
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                            <p className="text-blue-200 text-sm">
                                Driver reports no issues. Proceed with SDC mandatory physical checks for any of these conditions:
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-600/50">
                            <h3 className="font-semibold text-white mb-4">Check for ANY of these conditions:</h3>
                            <ul className="space-y-3 text-gray-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Excessive play in steering wheel (DVSA limit: &gt;75mm at rim for power steering)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Difficulty steering or maintaining control</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Unusual noises when steering (knocking, grinding, squealing)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Vehicle pulling to one side during operation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Visible damage to steering system (column, linkage)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Leaks from power steering system</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Steering becomes stiff or unresponsive</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>ANY steering-related warning light illuminated</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => { updateResponse(currentStep, 'pass'); onNext(); }}
                                className="w-full bg-green-900/30 backdrop-blur-sm hover:bg-green-900/50 text-white font-medium py-4 px-6 rounded-lg border border-green-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <div>
                                        <span className="block">All Checks PASS</span>
                                        <span className="text-sm text-green-300">NO defects found in any category</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                            
                            <button 
                                onClick={() => { updateResponse(currentStep, 'fail'); onNext(); }}
                                className="w-full bg-red-900/30 backdrop-blur-sm hover:bg-red-900/50 text-white font-medium py-4 px-6 rounded-lg border border-red-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                    <div>
                                        <span className="block">Defect Found</span>
                                        <span className="text-sm text-red-300">ANY condition above is present</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={onPrevious}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>
                );
            }
            
        case 4:
            if (responses[3] === 'fail') {
                // IMMEDIATE STOP for any physical defect
                return (
                    <div className="space-y-6">
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-red-500">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                                <h2 className="text-2xl font-bold text-red-200">IMMEDIATE STOP REQUIRED</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-black/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-200 mb-2">SDC Engineering Guide - Section 8:</h3>
                                    <p className="text-red-300 text-sm leading-relaxed">
                                        "If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance"
                                    </p>
                                </div>
                                
                                <div className="bg-red-950/50 backdrop-blur-sm rounded-lg p-4 border border-red-600/30">
                                    <h4 className="font-semibold text-red-200 mb-3">🛑 Critical Safety Actions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-red-300 text-sm">
                                        <li>Vehicle must STOP immediately</li>
                                        <li>Engine OFF - no exceptions</li>
                                        <li>NO movement until repaired</li>
                                        <li>Engineering attendance required</li>
                                        <li>Document specific defect found in Tranzaura</li>
                                        <li>Report to depot management</li>
                                        <li>Note: Persistent false reports should be escalated</li>
                                    </ol>
                                </div>
                                
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-200 mb-2">Additional SDC Guidance:</h4>
                                    <p className="text-gray-300 text-sm">
                                        "Record any defects immediately on the Tranzaura System when the bus is stationary and in a safe location."
                                        <span className="block mt-2 text-red-300 font-semibold">
                                            ⚠️ Steering defects = NO continuation allowed - immediate stop required
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onComplete('stop', 'Physical steering defect identified - SDC mandatory STOP')}
                                className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                CONFIRM SAFETY STOP DECISION
                            </button>
                        </div>
                    </div>
                );
            } else {
                // All clear - can continue
                return (
                    <div className="space-y-6">
                        <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-green-500">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                                <h2 className="text-2xl font-bold text-green-200">Steering System SAFE</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-green-950/50 backdrop-blur-sm rounded-lg p-4">
                                    <h3 className="font-semibold text-green-200 mb-2">Assessment Complete:</h3>
                                    <ul className="space-y-2 text-green-300 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>No steering issues reported by driver</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Physical inspection passed all criteria</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Steering system meets SDC safety requirements</span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-200 mb-2">Recommended Actions:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                        <li>Continue normal operation</li>
                                        <li>Monitor for any changes during shift</li>
                                        <li>Report any new symptoms immediately</li>
                                        <li>Document check completion in vehicle log</li>
                                        <li>If persistent false reports occur, notify depot management</li>
                                    </ul>
                                </div>
                                
                                <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-4 border border-blue-600/30">
                                    <p className="text-blue-300 text-sm flex items-start gap-2">
                                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>
                                            This assessment has been logged with timestamp and supervisor details for compliance records. 
                                            SDC Guidance: "Report to the depot management team if you feel a particular individual is persistently 
                                            reporting steering problems that, when investigated by engineering, reveal no fault."
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onComplete('continue', 'Steering system checked - all safety requirements met')}
                                className="mt-6 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                CONFIRM CONTINUE DECISION
                            </button>
                        </div>
                    </div>
                );
            }
            
        default:
            return null;
    }
};

export default SteeringWizard;
