import React, { useState } from 'react';
import { AlertTriangle, FileText, Users, Calendar, CheckCircle, ArrowRight, ArrowLeft, Home, AlertCircle } from 'lucide-react';

const RepeatDefectsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {

    const handleComplete = () => {
        onComplete({
            wizard: 'repeat-defects',
            responses,
            timestamp: new Date().toISOString(),
            priority: 'warning'
        });
    };

    const Step1 = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-lg p-6">
                <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mr-3" />
                    <h3 className="text-lg font-semibold text-amber-800">Repeat Defects Assessment</h3>
                </div>
                <p className="text-amber-700">
                    Repeat defects indicate potential systematic issues that require immediate escalation to prevent 
                    service disruption and ensure vehicle roadworthiness.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    What type of repeat defect are you dealing with?
                </h4>
                <div className="space-y-3">
                    <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-amber-300 cursor-pointer transition-all">
                        <input
                            type="radio"
                            name="defectType"
                            value="same-day"
                            checked={responses.defectType === 'same-day'}
                            onChange={(e) => updateResponse('defectType', e.target.value)}
                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                        />
                        <div className="ml-3">
                            <div className="text-gray-900 font-medium">Same-Day Repeat Defect</div>
                            <div className="text-sm text-gray-600">
                                Bus taken out of service due to defects, then later reallocated with same unresolved defects
                            </div>
                        </div>
                    </label>
                    <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-amber-300 cursor-pointer transition-all">
                        <input
                            type="radio"
                            name="defectType"
                            value="multi-day"
                            checked={responses.defectType === 'multi-day'}
                            onChange={(e) => updateResponse('defectType', e.target.value)}
                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                        />
                        <div className="ml-3">
                            <div className="text-gray-900 font-medium">Multi-Day Repeat Defect</div>
                            <div className="text-sm text-gray-600">
                                Bus continues to operate over several days with same unresolved reported defects
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-blue-800 text-sm">
                        <strong>Important:</strong> Both types require immediate escalation to Engineering Delivery Director
                    </p>
                </div>
            </div>
        </div>
    );

    const Step2 = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Defect Details and Documentation
                </h4>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe the defect in detail
                        </label>
                        <textarea
                            value={responses.defectDescription || ''}
                            onChange={(e) => updateResponse('defectDescription', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Provide a detailed description of the defect..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle Fleet Number
                        </label>
                        <input
                            type="text"
                            value={responses.fleetNumber || ''}
                            onChange={(e) => updateResponse('fleetNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="e.g., 5432"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            When was this defect first reported?
                        </label>
                        <input
                            type="date"
                            value={responses.firstReportedDate || ''}
                            onChange={(e) => updateResponse('firstReportedDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <h5 className="text-md font-medium text-gray-900 mb-3">
                            Has this defect been entered into Go-Check?
                        </h5>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="goCheckStatus"
                                    value="yes"
                                    checked={responses.goCheckStatus === 'yes'}
                                    onChange={(e) => updateResponse('goCheckStatus', e.target.value)}
                                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-gray-900">Yes, documented in Go-Check</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="goCheckStatus"
                                    value="no"
                                    checked={responses.goCheckStatus === 'no'}
                                    onChange={(e) => updateResponse('goCheckStatus', e.target.value)}
                                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-gray-900">No, not yet documented</span>
                            </label>
                        </div>
                    </div>

                    {responses.goCheckStatus === 'no' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                <p className="text-red-800 text-sm">
                                    <strong>Action Required:</strong> Defect must be documented in Go-Check immediately when bus is stationary and in a safe location
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const Step3 = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Escalation and Reporting
                </h4>
                
                <div className="space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                        <h5 className="text-md font-semibold text-red-800 mb-3">
                            Immediate Escalation Required
                        </h5>
                        <p className="text-red-700 text-sm mb-3">
                            This repeat defect must be reported immediately to prevent service reliability issues and ensure vehicle roadworthiness.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span className="text-red-800 text-sm">Engineering Delivery Director (Primary)</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span className="text-red-800 text-sm">General Manager (Copy)</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span className="text-red-800 text-sm">Engineering Manager (Copy)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Have you notified the Engineering Delivery Director?
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="notificationStatus"
                                    value="yes"
                                    checked={responses.notificationStatus === 'yes'}
                                    onChange={(e) => updateResponse('notificationStatus', e.target.value)}
                                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-gray-900">Yes, notification sent</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="notificationStatus"
                                    value="no"
                                    checked={responses.notificationStatus === 'no'}
                                    onChange={(e) => updateResponse('notificationStatus', e.target.value)}
                                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-gray-900">No, will notify immediately</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional comments for the escalation report
                        </label>
                        <textarea
                            value={responses.escalationComments || ''}
                            onChange={(e) => updateResponse('escalationComments', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Additional context for engineering team..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const Step4 = () => {
        const getRecommendation = () => {
            if (responses.defectType === 'same-day') {
                return {
                    title: "Same-Day Repeat Defect Protocol",
                    priority: "IMMEDIATE",
                    actions: [
                        "Report immediately to Engineering Delivery Director",
                        "Send copies to General Manager and Engineering Manager",
                        "Document in Go-Check with photos if appropriate",
                        "Vehicle must not return to service until defect is resolved",
                        "Investigate why defect was not properly addressed before reallocation"
                    ],
                    severity: "critical"
                };
            } else if (responses.defectType === 'multi-day') {
                return {
                    title: "Multi-Day Repeat Defect Protocol",
                    priority: "IMMEDIATE",
                    actions: [
                        "Report immediately to Engineering Delivery Director",
                        "Send copies to General Manager and Engineering Manager",
                        "Maintain accurate records of all reported defects",
                        "Prioritize addressing defects that compromise safety",
                        "Prevent service reliability issues through proper escalation"
                    ],
                    severity: "critical"
                };
            }
            return {
                title: "General Repeat Defect Protocol",
                priority: "HIGH",
                actions: [
                    "Document defect details thoroughly",
                    "Escalate to appropriate engineering personnel",
                    "Ensure proper communication channels are followed"
                ],
                severity: "warning"
            };
        };

        const recommendation = getRecommendation();

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-lg p-6">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600 mr-3" />
                        <h3 className="text-lg font-semibold text-amber-800">Repeat Defect Assessment Complete</h3>
                    </div>
                    <p className="text-amber-700">
                        Based on your responses, here are the required actions for this repeat defect situation.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{recommendation.title}</h4>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            recommendation.severity === 'critical' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-amber-100 text-amber-800'
                        }`}>
                            Priority: {recommendation.priority}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h5 className="font-medium text-gray-900 mb-3">Required Actions:</h5>
                            <ul className="space-y-2">
                                {recommendation.actions.map((action, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700 text-sm">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-blue-900 mb-2">Safety Reminders:</h5>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Safety is non-negotiable - prioritize defects that compromise safety</li>
                                <li>• Ensure timely communication with engineering and management</li>
                                <li>• Maintain accurate records of all reported defects</li>
                                <li>• Follow proper escalation channels to prevent service disruption</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Assessment Summary:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Defect Type:</span>
                            <span className="ml-2 capitalize">{responses.defectType?.replace('-', ' ')}</span>
                        </div>
                        <div>
                            <span className="font-medium">Fleet Number:</span>
                            <span className="ml-2">{responses.fleetNumber || 'Not specified'}</span>
                        </div>
                        <div>
                            <span className="font-medium">First Reported:</span>
                            <span className="ml-2">{responses.firstReportedDate || 'Not specified'}</span>
                        </div>
                        <div>
                            <span className="font-medium">Go-Check Status:</span>
                            <span className="ml-2 capitalize">{responses.goCheckStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1 />;
            case 2: return <Step2 />;
            case 3: return <Step3 />;
            case 4: return <Step4 />;
            default: return <Step1 />;
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return responses.defectType;
            case 2: return responses.defectDescription && responses.fleetNumber && responses.goCheckStatus;
            case 3: return responses.notificationStatus;
            case 4: return true;
            default: return false;
        }
    };

    return (
        <div className="space-y-6">
            {renderStep()}
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 1}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                        currentStep === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={onNext}
                        disabled={!canProceed()}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                            canProceed()
                                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleComplete}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete Assessment</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default RepeatDefectsWizard;