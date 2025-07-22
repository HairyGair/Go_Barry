// Destination Display Wizard Component
// Follows operational best practice for destination display issues

const DestinationDisplayWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Info } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">📟</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Destination Display Assessment</h2>
                        <p className="text-gray-300">Let's identify which destination display is affected</p>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📡 Passenger Information System</h3>
                        <p className="text-blue-300/80 text-sm leading-relaxed">
                            Destination displays help passengers identify the correct service. While not safety-critical, 
                            a faulty front display can cause significant passenger confusion and should be addressed promptly.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Which display is affected?</h3>
                        <p className="text-gray-300 text-sm mb-4">Select the display(s) that are not working correctly</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('affected_display', 'front')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.affected_display === 'front'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.affected_display === 'front' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.affected_display === 'front' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚌 Front Destination Display</span>
                                        <p className="text-sm text-gray-300 mt-1">Main route number and destination at front of bus</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('affected_display', 'other')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.affected_display === 'other'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.affected_display === 'other' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.affected_display === 'other' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📺 Other Displays Only</span>
                                        <p className="text-sm text-gray-300 mt-1">Side, rear, or interior displays (front display working)</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('affected_display', 'front_and_others')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.affected_display === 'front_and_others'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.affected_display === 'front_and_others' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.affected_display === 'front_and_others' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔄 Front Display + Others</span>
                                        <p className="text-sm text-gray-300 mt-1">Front display and other displays affected</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">What is the fault?</h3>
                        <p className="text-gray-300 text-sm mb-4">Briefly describe the display problem</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('fault_type', 'blank')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fault_type === 'blank'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.fault_type === 'blank' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.fault_type === 'blank' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span>⬛ Completely blank/not illuminated</span>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('fault_type', 'wrong_info')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fault_type === 'wrong_info'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.fault_type === 'wrong_info' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.fault_type === 'wrong_info' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span>❌ Showing wrong route/destination</span>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('fault_type', 'partial')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fault_type === 'partial'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.fault_type === 'partial' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.fault_type === 'partial' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span>⚡ Flickering/dim/partially working</span>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('fault_type', 'stuck')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fault_type === 'stuck'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        responses.fault_type === 'stuck' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.fault_type === 'stuck' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span>🔒 Stuck on one setting/won't change</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.affected_display || !responses.fault_type}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            const frontDisplayAffected = responses.affected_display === 'front' || responses.affected_display === 'front_and_others';
            
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className={`mx-auto w-16 h-16 ${frontDisplayAffected ? 'bg-orange-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mb-4`}>
                            {frontDisplayAffected ? <AlertTriangle className="w-8 h-8 text-orange-400" /> : <CheckCircle className="w-8 h-8 text-green-400" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Assessment Decision</h2>
                        <p className="text-gray-300">Based on which display is affected, here's the required action</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-300">Affected Display:</span> 
                                <span className="text-white ml-2">
                                    {responses.affected_display === 'front' && '🚌 Front destination display'}
                                    {responses.affected_display === 'other' && '📺 Other displays only'}
                                    {responses.affected_display === 'front_and_others' && '🔄 Front + other displays'}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-300">Fault Type:</span>
                                <span className="text-white ml-2">
                                    {responses.fault_type === 'blank' && '⬛ Blank/not illuminated'}
                                    {responses.fault_type === 'wrong_info' && '❌ Wrong information'}
                                    {responses.fault_type === 'partial' && '⚡ Partial failure'}
                                    {responses.fault_type === 'stuck' && '🔒 Stuck/won't change'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {frontDisplayAffected ? (
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                                <div className="flex-1 ml-4">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">Front Display Affected - Changeover Required</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">Arrange changeover at next convenient point</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Driver Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Continue in service to next convenient changeover point</li>
                                                <li>Make verbal announcements of route and destination</li>
                                                <li>Consider using paper sign if available</li>
                                                <li>Reassure passengers about correct route</li>
                                                <li>Record defect in Go-Check when safe</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                            <div className="flex items-start">
                                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                                <div className="flex-1 ml-4">
                                    <h3 className="text-xl font-bold text-green-200 mb-3">Other Displays Only - Continue in Service</h3>
                                    <div className="text-green-300/90 space-y-2">
                                        <p className="font-semibold">No changeover required - report for repair</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-200 mb-2">Driver Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-green-300/90 text-sm">
                                                <li>Continue normal service operation</li>
                                                <li>Record defect in Go-Check for engineering attention</li>
                                                <li>No passenger announcements needed</li>
                                                <li>Defect will be repaired during routine maintenance</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">💡 Helpful Tips</h3>
                        <ul className="list-disc list-inside space-y-2 text-yellow-300/90 text-sm">
                            <li>Front display issues cause most passenger confusion - prioritize clear announcements</li>
                            <li>Paper signs can be very effective temporary measures</li>
                            <li>Side and rear displays are less critical for passenger information</li>
                            <li>Interior displays rarely affect service delivery significantly</li>
                        </ul>
                    </div>

                    <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start space-x-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-200">Go-Check Reminder</h4>
                                <p className="text-sm text-blue-300/90 mt-1">
                                    Record this defect in Go-Check system when stationary and safe
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
                            onClick={onComplete}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope
window.DestinationDisplayWizard = DestinationDisplayWizard;
