import React from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';

// Wheelchair Ramp Wizard Component
// Follows SDC Engineering Issues Guide - Section 23 (Ramp Stuck Out)
// Enhanced to include manual retraction risk assessment requirements

const WheelchairRampWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle } = Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">♿ Wheelchair Ramp Assessment</h2>
                        <p className="text-gray-600">Following SDC guidance for wheelchair ramp systems - ensuring safe operation and compliance with disability access requirements.</p>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">♿ Accessibility Legal Requirement</h3>
                                <p className="text-blue-700">Wheelchair ramp systems are legally required under the Equality Act. A defective ramp requires immediate attention to ensure compliance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-semibold text-red-900 mb-3">What is the current issue?</h3>
                            <p className="text-red-700 text-sm mb-4">Select the primary problem with the wheelchair ramp.</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="issue_type"
                                        checked={responses.issue_type === 'ramp_stuck_out'}
                                        onChange={() => updateResponse('issue_type', 'ramp_stuck_out')}
                                        className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-red-600">🚨 Ramp stuck in deployed position</span>
                                        <p className="text-sm text-gray-600 mt-1">Cannot retract ramp to stowed position</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="issue_type"
                                        checked={responses.issue_type === 'wont_deploy'}
                                        onChange={() => updateResponse('issue_type', 'wont_deploy')}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <span className="font-medium text-orange-600">❌ Ramp won\'t deploy</span>
                                        <p className="text-sm text-gray-600 mt-1">Cannot extend ramp from stowed position</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="issue_type"
                                        checked={responses.issue_type === 'operational_issues'}
                                        onChange={() => updateResponse('issue_type', 'operational_issues')}
                                        className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-600">⚠️ Other operational issues</span>
                                        <p className="text-sm text-gray-600 mt-1">Slow operation, jerky movement, or safety concerns</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="issue_type"
                                        checked={responses.issue_type === 'routine_check'}
                                        onChange={() => updateResponse('issue_type', 'routine_check')}
                                        className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-blue-600">🔍 Routine functionality check</span>
                                        <p className="text-sm text-gray-600 mt-1">Preventive assessment - no current issues</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {responses.issue_type && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-900 mb-3">Current Service Context</h3>
                                <p className="text-yellow-700 text-sm mb-4">Is there an immediate accessibility need?</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="wheelchair_user_waiting"
                                            checked={responses.wheelchair_user_waiting === 'yes'}
                                            onChange={() => updateResponse('wheelchair_user_waiting', 'yes')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">♿ YES - Wheelchair user present/waiting</span>
                                            <p className="text-sm text-gray-600 mt-1">Immediate accessibility requirement</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="wheelchair_user_waiting"
                                            checked={responses.wheelchair_user_waiting === 'no'}
                                            onChange={() => updateResponse('wheelchair_user_waiting', 'no')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ NO - No immediate wheelchair access needed</span>
                                            <p className="text-sm text-gray-600 mt-1">Standard operational assessment</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {responses.wheelchair_user_waiting === 'yes' && (
                            <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-800 mb-3">♿ URGENT - WHEELCHAIR USER WAITING</h3>
                                        <div className="text-red-700 space-y-2">
                                            <p className="font-semibold">Legal duty to provide access under Equality Act</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-red-800 mb-2">Priority Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    <li>Cannot refuse wheelchair user due to ramp defect</li>
                                                    <li>Must provide accessibility or arrange immediate alternative</li>
                                                    <li>Contact engineering immediately if ramp not functional</li>
                                                    <li>Consider alternative accessible vehicle if available</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <div></div>
                        <button
                            onClick={onNext}
                            disabled={!responses.issue_type || !responses.wheelchair_user_waiting}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Continue to Troubleshooting
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            // Step 2: Vehicle Reset and Manual Retraction Assessment (following SDC guide)
            if (responses.issue_type === 'ramp_stuck_out') {
                return (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">🔧 Ramp Stuck Out - Initial Troubleshooting</h2>
                            <p className="text-gray-600">Following SDC procedures for stuck ramp resolution.</p>
                        </div>
                        
                        <div className="bg-orange-50 border-l-4 border-orange-600 p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-orange-800 mb-2">⚠️ Safety Warning</h3>
                                    <p className="text-orange-700">A ramp stuck in deployed position creates a safety hazard and must be resolved before continuing service.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-3">Step 1: Reset the Vehicle</h3>
                                <p className="text-blue-700 text-sm mb-4">First, attempt a system reset as per SDC guidance.</p>
                                <div className="bg-white rounded p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Reset Procedure:</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                                        <li>Switch off the ignition completely</li>
                                        <li>Wait 30 seconds</li>
                                        <li>Re-start the vehicle</li>
                                        <li>Attempt to retract the ramp using normal controls</li>
                                    </ol>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reset_result"
                                            checked={responses.reset_result === 'resolved'}
                                            onChange={() => updateResponse('reset_result', 'resolved')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ Reset successful - ramp retracted</span>
                                            <p className="text-sm text-gray-600 mt-1">System reset cleared the issue</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reset_result"
                                            checked={responses.reset_result === 'still_stuck'}
                                            onChange={() => updateResponse('reset_result', 'still_stuck')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">❌ Ramp still stuck out</span>
                                            <p className="text-sm text-gray-600 mt-1">Reset did not resolve the issue</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            {responses.reset_result === 'still_stuck' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-900 mb-3">Step 2: Manual Retraction Assessment</h3>
                                    <p className="text-red-700 text-sm mb-4">Critical safety assessment required before manual intervention.</p>
                                    
                                    <div className="bg-white border-2 border-red-500 rounded p-4 mb-4">
                                        <div className="flex items-start">
                                            <Shield className="w-6 h-6 text-red-600 mt-1 mr-3" />
                                            <div>
                                                <h4 className="font-bold text-red-800 mb-2">⚠️ CRITICAL DISTINCTION</h4>
                                                <p className="text-red-700 font-semibold">Being trained to USE manual ramps is NOT the same as being risk assessed to manually RETRACT a stuck ramp.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="risk_assessed"
                                                checked={responses.risk_assessed === 'yes'}
                                                onChange={() => updateResponse('risk_assessed', 'yes')}
                                                className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            />
                                            <div>
                                                <span className="font-medium text-green-600">✅ Driver IS risk assessed for manual retraction</span>
                                                <p className="text-sm text-gray-600 mt-1">Specifically trained and assessed for stuck ramp procedures</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="risk_assessed"
                                                checked={responses.risk_assessed === 'no'}
                                                onChange={() => updateResponse('risk_assessed', 'no')}
                                                className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                            />
                                            <div>
                                                <span className="font-medium text-red-600">❌ Driver is NOT risk assessed for manual retraction</span>
                                                <p className="text-sm text-gray-600 mt-1">Only trained for normal ramp operation</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="risk_assessed"
                                                checked={responses.risk_assessed === 'unsure'}
                                                onChange={() => updateResponse('risk_assessed', 'unsure')}
                                                className="mt-1 mr-3 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                            />
                                            <div>
                                                <span className="font-medium text-orange-600">❓ Unsure of risk assessment status</span>
                                                <p className="text-sm text-gray-600 mt-1">Cannot confirm specific training</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                            
                            {responses.risk_assessed === 'yes' && responses.reset_result === 'still_stuck' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-yellow-900 mb-3">Manual Retraction Attempt</h3>
                                    <p className="text-yellow-700 text-sm mb-4">Driver may attempt manual retraction using trained method.</p>
                                    <div className="space-y-3">
                                        <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="manual_attempt"
                                                checked={responses.manual_attempt === 'successful'}
                                                onChange={() => updateResponse('manual_attempt', 'successful')}
                                                className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            />
                                            <div>
                                                <span className="font-medium text-green-600">✅ Manual retraction successful</span>
                                                <p className="text-sm text-gray-600 mt-1">Ramp now properly stowed</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="manual_attempt"
                                                checked={responses.manual_attempt === 'failed'}
                                                onChange={() => updateResponse('manual_attempt', 'failed')}
                                                className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                            />
                                            <div>
                                                <span className="font-medium text-red-600">❌ Manual retraction failed</span>
                                                <p className="text-sm text-gray-600 mt-1">Unable to retract manually</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                                <ArrowLeft className="w-4 h-4 mr-1" />Previous
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses.reset_result || 
                                         (responses.reset_result === 'still_stuck' && !responses.risk_assessed) ||
                                         (responses.risk_assessed === 'yes' && !responses.manual_attempt)}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue to Decision<ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                );
            } else {
                // For other issues, continue with operational testing
                return (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">🔧 Ramp Operation Test</h2>
                            <p className="text-gray-600">Test the wheelchair ramp operation through its full cycle.</p>
                        </div>
                        
                        <div className="bg-orange-50 border-l-4 border-orange-600 p-6 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-orange-800 mb-2">⚠️ Safety During Testing</h3>
                                    <p className="text-orange-700">Ensure area is clear before testing. Follow safe operating procedures.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-3">Ramp Functionality Test</h3>
                                <p className="text-blue-700 text-sm mb-4">Test the complete operation cycle of the ramp.</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="functionality"
                                            checked={responses.functionality === 'fully_operational'}
                                            onChange={() => updateResponse('functionality', 'fully_operational')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ Fully operational</span>
                                            <p className="text-sm text-gray-600 mt-1">Ramp deploys and retracts normally</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="functionality"
                                            checked={responses.functionality === 'partial_function'}
                                            onChange={() => updateResponse('functionality', 'partial_function')}
                                            className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                        />
                                        <div>
                                            <span className="font-medium text-yellow-600">⚠️ Partially functional</span>
                                            <p className="text-sm text-gray-600 mt-1">Slow, jerky, or requires assistance</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="functionality"
                                            checked={responses.functionality === 'not_functional'}
                                            onChange={() => updateResponse('functionality', 'not_functional')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">❌ Not functional</span>
                                            <p className="text-sm text-gray-600 mt-1">Ramp failure - cannot provide access</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            {(responses.functionality === 'fully_operational' || responses.functionality === 'partial_function') && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-purple-900 mb-3">Safety Features Check</h3>
                                    <p className="text-purple-700 text-sm mb-4">Test safety features and edge barriers.</p>
                                    <div className="space-y-3">
                                        <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="safety_features"
                                                checked={responses.safety_features === 'all_working'}
                                                onChange={() => updateResponse('safety_features', 'all_working')}
                                                className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            />
                                            <div>
                                                <span className="font-medium text-green-600">✅ All safety features working</span>
                                                <p className="text-sm text-gray-600 mt-1">Edge barriers and safety interlocks functional</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="safety_features"
                                                checked={responses.safety_features === 'compromised'}
                                                onChange={() => updateResponse('safety_features', 'compromised')}
                                                className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                            />
                                            <div>
                                                <span className="font-medium text-red-600">❌ Safety features compromised</span>
                                                <p className="text-sm text-gray-600 mt-1">Edge barriers or interlocks not working</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                                <ArrowLeft className="w-4 h-4 mr-1" />Previous
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!responses.functionality || 
                                         ((responses.functionality === 'fully_operational' || responses.functionality === 'partial_function') && !responses.safety_features)}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue to Decision<ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                );
            }

        case 3:
            // Decision based on SDC guide logic
            const needsImmediateStop = 
                (responses.issue_type === 'ramp_stuck_out' && responses.risk_assessed !== 'yes') ||
                (responses.issue_type === 'ramp_stuck_out' && responses.manual_attempt === 'failed') ||
                (responses.wheelchair_user_waiting === 'yes' && responses.functionality !== 'fully_operational') ||
                (responses.functionality === 'not_functional') ||
                (responses.safety_features === 'compromised');

            const canContinueInService = 
                (responses.issue_type === 'ramp_stuck_out' && responses.reset_result === 'resolved') ||
                (responses.issue_type === 'ramp_stuck_out' && responses.manual_attempt === 'successful') ||
                (responses.functionality === 'fully_operational' && responses.safety_features === 'all_working');

            const needsChangeover = 
                !needsImmediateStop && !canContinueInService;

            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📋 Wheelchair Ramp Decision</h2>
                        <p className="text-gray-600">Based on SDC guidance, here is the required action:</p>
                    </div>

                    <div className="space-y-6">
                        {/* Assessment Summary */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Assessment Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Issue Type:</span> {
                                        responses.issue_type === 'ramp_stuck_out' ? '🚨 Ramp stuck out' :
                                        responses.issue_type === 'wont_deploy' ? '❌ Won\'t deploy' :
                                        responses.issue_type === 'operational_issues' ? '⚠️ Operational issues' :
                                        '🔍 Routine check'
                                    }
                                </div>
                                <div>
                                    <span className="font-medium">Wheelchair User Waiting:</span> 
                                    <span className={responses.wheelchair_user_waiting === 'yes' ? 'text-red-600 font-bold ml-1' : 'text-green-600 ml-1'}>
                                        {responses.wheelchair_user_waiting === 'yes' ? '♿ YES' : '✅ NO'}
                                    </span>
                                </div>
                                {responses.reset_result && (
                                    <div>
                                        <span className="font-medium">Reset Attempt:</span> 
                                        <span className={responses.reset_result === 'resolved' ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                            {responses.reset_result === 'resolved' ? '✅ Successful' : '❌ Failed'}
                                        </span>
                                    </div>
                                )}
                                {responses.risk_assessed && (
                                    <div>
                                        <span className="font-medium">Manual Retraction Trained:</span> 
                                        <span className={responses.risk_assessed === 'yes' ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                            {responses.risk_assessed === 'yes' ? '✅ Yes' : 
                                             responses.risk_assessed === 'no' ? '❌ No' : '❓ Unsure'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Decision Display */}
                        {needsImmediateStop ? (
                            <div className="bg-red-50 border-l-4 border-red-600 p-6">
                                <div className="flex items-start">
                                    <XCircle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-800 mb-3">🛑 STOP - AWAIT ENGINEERING</h3>
                                        <div className="text-red-700 space-y-2">
                                            <p className="font-semibold">Vehicle must stop immediately and await engineering assistance</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-red-800 mb-2">Reason for Stop:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    {responses.risk_assessed !== 'yes' && responses.issue_type === 'ramp_stuck_out' && 
                                                        <li>Driver not risk assessed for manual ramp retraction</li>}
                                                    {responses.manual_attempt === 'failed' && 
                                                        <li>Manual retraction attempt failed</li>}
                                                    {responses.wheelchair_user_waiting === 'yes' && responses.functionality !== 'fully_operational' && 
                                                        <li>Wheelchair user waiting - legal duty to provide access</li>}
                                                    {responses.functionality === 'not_functional' && 
                                                        <li>Ramp completely non-functional</li>}
                                                    {responses.safety_features === 'compromised' && 
                                                        <li>Safety features compromised - unsafe for use</li>}
                                                </ul>
                                                <h4 className="font-semibold text-red-800 mb-2 mt-4">Required Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    <li>Do NOT attempt unauthorised manual intervention</li>
                                                    <li>Remain stationary and await engineering</li>
                                                    <li>If wheelchair user waiting, arrange alternative accessible vehicle</li>
                                                    <li>Record defect in Go-Check immediately</li>
                                                    <li>Inform control of vehicle status</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : canContinueInService ? (
                            <div className="bg-green-50 border-l-4 border-green-600 p-6">
                                <div className="flex items-start">
                                    <CheckCircle className="w-8 h-8 text-green-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-green-800 mb-3">✅ CONTINUE IN SERVICE</h3>
                                        <div className="text-green-700 space-y-2">
                                            <p className="font-semibold">Issue resolved - vehicle can continue normal service</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-green-800 mb-2">Resolution:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                                    {responses.reset_result === 'resolved' && 
                                                        <li>Vehicle reset successfully cleared the ramp issue</li>}
                                                    {responses.manual_attempt === 'successful' && 
                                                        <li>Manual retraction completed successfully</li>}
                                                    {responses.functionality === 'fully_operational' && 
                                                        <li>Ramp tested and fully operational</li>}
                                                </ul>
                                                <h4 className="font-semibold text-green-800 mb-2 mt-4">Follow-up Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                                    <li>Continue normal service</li>
                                                    <li>Record incident in Go-Check for tracking</li>
                                                    <li>Monitor ramp for any recurrence</li>
                                                    <li>Report to engineering for preventive maintenance</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-8 h-8 text-yellow-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-yellow-800 mb-3">⚠️ CHANGEOVER REQUIRED</h3>
                                        <div className="text-yellow-700 space-y-2">
                                            <p className="font-semibold">Continue to convenient changeover point</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-yellow-800 mb-2">Issues Identified:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                    {responses.functionality === 'partial_function' && 
                                                        <li>Ramp partially functional - may deteriorate</li>}
                                                    <li>Wheelchair ramp requires engineering attention</li>
                                                </ul>
                                                <h4 className="font-semibold text-yellow-800 mb-2 mt-4">Required Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                    <li>Continue to next convenient changeover point</li>
                                                    <li>Avoid picking up wheelchair users if possible</li>
                                                    <li>If wheelchair user boards, test ramp first</li>
                                                    <li>Record defect in Go-Check</li>
                                                    <li>Arrange changeover at earliest opportunity</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Go-Check Reminder */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <FileText className="w-6 h-6 text-blue-600 mt-1 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Record in Go-Check</h3>
                                    <p className="text-blue-700">All wheelchair ramp defects must be recorded in the Go-Check system immediately, including:</p>
                                    <ul className="list-disc list-inside mt-2 text-blue-700">
                                        <li>Nature of the defect</li>
                                        <li>Actions taken (reset attempts, manual intervention)</li>
                                        <li>Current status of the ramp</li>
                                        <li>Any wheelchair passenger impacts</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-4 h-4 mr-1" />Previous
                        </button>
                        <button onClick={onComplete} className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Complete Assessment<CheckCircle className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.WheelchairRampWizard = WheelchairRampWizard;

export default WheelchairRampWizard;
