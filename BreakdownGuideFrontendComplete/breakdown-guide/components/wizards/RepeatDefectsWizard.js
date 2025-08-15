// Repeat Defects Wizard Component - HIGH PRIORITY Quality Control Escalation
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Repeat Defects Section (Page 23)

const RepeatDefectsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔄 Repeat Defects Quality Control Assessment</h2>
                        <p className="text-gray-300">High Priority escalation protocol for persistent vehicle defects - ensuring accountability and preventing service reliability issues.</p>
                    </div>
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-semibold text-amber-200 mb-4">⚠️ QUALITY CONTROL PROTOCOL</h3>
                        <p className="text-amber-300/80 text-sm leading-relaxed mb-4">
                            Repeat defects require immediate escalation to Engineering Delivery Director with copies to General Manager and Engineering Manager.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-amber-200 mb-2">SDC Escalation Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                <li>Same-day repeats require immediate management notification</li>
                                <li>Multi-day persistence indicates systemic maintenance failure</li>
                                <li>All repeat defects compromise service reliability</li>
                                <li>Engineering accountability and process review mandatory</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Repeat Defect Type Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What type of repeat defect are you reporting?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('defectType', 'same-day')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.defectType === 'same-day'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.defectType === 'same-day' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.defectType === 'same-day' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔄 Same-Day Repeat</span>
                                        <p className="text-sm text-gray-300 mt-1">Bus taken out of service and reallocated with same unresolved defects</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('defectType', 'multi-day')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.defectType === 'multi-day'
                                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.defectType === 'multi-day' ? 'border-amber-400 bg-amber-400' : 'border-white/50'
                                    }`}>
                                        {responses.defectType === 'multi-day' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📅 Multi-Day Repeat</span>
                                        <p className="text-sm text-gray-300 mt-1">Bus operating over several days with same unresolved reported defects</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Quality Impact Assessment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-orange-200 mb-2">Same-Day Impact:</h4>
                                <ul className="list-disc list-inside space-y-1 text-orange-300/80 text-sm">
                                    <li>Immediate service reliability failure</li>
                                    <li>Driver frustration and confidence loss</li>
                                    <li>Passenger service disruption</li>
                                    <li>Engineering process breakdown</li>
                                </ul>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-orange-200 mb-2">Multi-Day Impact:</h4>
                                <ul className="list-disc list-inside space-y-1 text-orange-300/80 text-sm">
                                    <li>Systematic maintenance failure</li>
                                    <li>Continuous safety risk exposure</li>
                                    <li>Fleet reliability degradation</li>
                                    <li>Regulatory compliance concerns</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-6 border-t border-white/20">
                        <button
                            onClick={onNext}
                            disabled={!responses.defectType}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📝 Defect Documentation Details</h2>
                        <p className="text-gray-300">Comprehensive defect information required for management escalation and engineering accountability.</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Vehicle Identification</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Vehicle Registration/Fleet Number *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                    value={responses.vehicleNumber || ''}
                                    onChange={(e) => updateResponse('vehicleNumber', e.target.value)}
                                    placeholder="Enter vehicle number (e.g., BUS001, NK55ABC)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">Defect Description</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-2">
                                    Original Defect Description *
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                    rows={3}
                                    value={responses.defectDescription || ''}
                                    onChange={(e) => updateResponse('defectDescription', e.target.value)}
                                    placeholder="Describe the original reported defect in detail..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">Persistence Tracking</h3>
                        <div className="space-y-4">
                            {responses.defectType === 'same-day' ? (
                                <div>
                                    <label className="block text-sm font-medium text-green-200 mb-2">
                                        Times Reported Today *
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                                        value={responses.reportCount || ''}
                                        onChange={(e) => updateResponse('reportCount', e.target.value)}
                                    >
                                        <option value="" className="bg-slate-800">Select number of reports</option>
                                        <option value="2" className="bg-slate-800">2 times</option>
                                        <option value="3" className="bg-slate-800">3 times</option>
                                        <option value="4" className="bg-slate-800">4 times</option>
                                        <option value="5+" className="bg-slate-800">5 or more times</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-green-200 mb-2">
                                        Days Defect Has Persisted *
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                                        value={responses.daysPersisted || ''}
                                        onChange={(e) => updateResponse('daysPersisted', e.target.value)}
                                    >
                                        <option value="" className="bg-slate-800">Select number of days</option>
                                        <option value="2" className="bg-slate-800">2 days</option>
                                        <option value="3" className="bg-slate-800">3 days</option>
                                        <option value="4" className="bg-slate-800">4 days</option>
                                        <option value="5" className="bg-slate-800">5 days</option>
                                        <option value="6+" className="bg-slate-800">6 or more days</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">Go-Check Documentation</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-yellow-200 mb-2">
                                    Go-Check Reference Numbers
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                                    value={responses.goCheckRefs || ''}
                                    onChange={(e) => updateResponse('goCheckRefs', e.target.value)}
                                    placeholder="Enter Go-Check reference numbers (comma separated)"
                                />
                                <p className="text-yellow-300/80 text-sm mt-2">
                                    Include all relevant Go-Check references for tracking and audit trail
                                </p>
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
                            disabled={!responses.vehicleNumber || !responses.defectDescription || 
                                     (responses.defectType === 'same-day' ? !responses.reportCount : !responses.daysPersisted)}
                            className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Management Escalation <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📞 Management Escalation Actions</h2>
                        <p className="text-gray-300">Mandatory management notification and accountability protocol for repeat defects.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <div className="flex items-start space-x-4">
                            <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-3">🚨 IMMEDIATE ESCALATION REQUIRED</h3>
                                <div className="text-red-300/90 space-y-3">
                                    <p className="font-semibold">This repeat defect must be reported immediately to:</p>
                                    <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                        <ol className="list-decimal ml-6 space-y-2 text-red-300/90">
                                            <li><strong>Engineering Delivery Director</strong> (Primary recipient)</li>
                                            <li><strong>General Manager</strong> (Copy for operational awareness)</li>
                                            <li><strong>Engineering Manager</strong> (Copy for technical accountability)</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-bold text-blue-200 mb-4">📋 Escalation Report Summary</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p><strong className="text-blue-200">Type:</strong> <span className="text-white">{responses.defectType === 'same-day' ? 'Same-Day' : 'Multi-Day'} Repeat Defect</span></p>
                                    <p><strong className="text-blue-200">Vehicle:</strong> <span className="text-white">{responses.vehicleNumber}</span></p>
                                    <p><strong className="text-blue-200">Defect:</strong> <span className="text-white">{responses.defectDescription}</span></p>
                                </div>
                                <div className="space-y-2">
                                    {responses.defectType === 'same-day' ? (
                                        <p><strong className="text-blue-200">Reports Today:</strong> <span className="text-white">{responses.reportCount}</span></p>
                                    ) : (
                                        <p><strong className="text-blue-200">Days Persisted:</strong> <span className="text-white">{responses.daysPersisted}</span></p>
                                    )}
                                    {responses.goCheckRefs && (
                                        <p><strong className="text-blue-200">Go-Check Refs:</strong> <span className="text-white">{responses.goCheckRefs}</span></p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                        
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">✅ Escalation Completion Checklist</h3>
                        <p className="text-green-300/80 text-sm mb-4">Confirm you have completed the following mandatory actions:</p>
                        <div className="space-y-4">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={responses.reportedToDirector || false}
                                    onChange={(e) => updateResponse('reportedToDirector', e.target.checked)}
                                    className="mt-1 h-4 w-4 text-green-600 bg-white/10 border-white/30 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <div>
                                    <span className="font-medium text-green-200">Reported to Engineering Delivery Director</span>
                                    <p className="text-green-300/80 text-sm mt-1">Primary escalation for engineering accountability</p>
                                </div>
                            </label>
                            
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={responses.copiedManagers || false}
                                    onChange={(e) => updateResponse('copiedManagers', e.target.checked)}
                                    className="mt-1 h-4 w-4 text-green-600 bg-white/10 border-white/30 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <div>
                                    <span className="font-medium text-green-200">Copied General Manager and Engineering Manager</span>
                                    <p className="text-green-300/80 text-sm mt-1">Ensuring full management awareness and oversight</p>
                                </div>
                            </label>
                            
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={responses.documentedGoCheck || false}
                                    onChange={(e) => updateResponse('documentedGoCheck', e.target.checked)}
                                    className="mt-1 h-4 w-4 text-green-600 bg-white/10 border-white/30 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <div>
                                    <span className="font-medium text-green-200">Documented in Go-Check with photos if applicable</span>
                                    <p className="text-green-300/80 text-sm mt-1">Complete audit trail for investigation and accountability</p>
                                </div>
                            </label>
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
                            disabled={!responses.reportedToDirector || !responses.copiedManagers || !responses.documentedGoCheck}
                            className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Complete Escalation <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">✅ Repeat Defect Escalation Complete</h2>
                        <p className="text-gray-300">Quality control escalation successfully completed - management accountability activated.</p>
                    </div>
                    
                    <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-6 border border-green-400/50">
                        <div className="text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-200 mb-2">REPEAT DEFECT ESCALATED</h3>
                            <p className="text-green-300/90 text-lg mb-6">
                                The repeat defect has been properly escalated to management for immediate action
                            </p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-bold text-green-200 mb-3">✅ Escalation Actions Completed:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-green-300/90">✅ Engineering Delivery Director notified</p>
                                    <p className="text-green-300/90">✅ General Manager copied</p>
                                    <p className="text-green-300/90">✅ Engineering Manager copied</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-green-300/90">✅ Complete defect documentation</p>
                                    <p className="text-green-300/90">✅ Tranzaura audit trail established</p>
                                    <p className="text-green-300/90">✅ Management accountability activated</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📋 Next Steps in Process</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            <ul className="list-disc ml-6 space-y-2 text-blue-300/90">
                                <li>Engineering Delivery Director will investigate why defect persisted</li>
                                <li>Root cause analysis will be conducted on maintenance processes</li>
                                <li>Process improvements will be implemented to prevent recurrence</li>
                                <li>Vehicle will be prioritised for immediate and proper repair</li>
                                <li>Engineering team accountability measures will be reviewed</li>
                                <li>Driver feedback will be gathered to understand impact</li>
                            </ul>
                        </div>
                    </div>
                        
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-bold text-amber-200 mb-4">⚠️ Important Ongoing Requirements</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            <ul className="list-disc ml-6 space-y-2 text-amber-300/90">
                                <li>Continue monitoring for any safety-critical developments</li>
                                <li>Document any additional occurrences immediately</li>
                                <li>Ensure driver welfare if they're frustrated by repeat issues</li>
                                <li>Follow up if no management response within 2 hours</li>
                                <li>Escalate further if defect persists after management intervention</li>
                                <li>Maintain detailed timeline for investigation support</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-purple-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-purple-200 mb-2">📱 Tranzaura Documentation Complete</h4>
                                <p className="text-purple-300/80 text-sm">
                                    This escalation has created a complete audit trail in Tranzaura for management review, 
                                    engineering accountability, and process improvement initiatives.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h4 className="font-semibold text-white mb-3">📋 SDC Policy Reminder</h4>
                        <p className="text-gray-300 text-sm">
                            <strong>Quality Standards:</strong> Repeat defects compromise service reliability and 
                            vehicle roadworthiness. This escalation ensures accountability and prevents 
                            future occurrences through systematic process review and improvement.
                        </p>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-white/20">
                        <button
                            onClick={onPrevious}
                            className="flex items-center px-6 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />Previous Step
                        </button>
                        <button
                            onClick={onComplete}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.RepeatDefectsWizard = RepeatDefectsWizard;