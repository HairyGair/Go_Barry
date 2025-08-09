// Broken Windows Wizard Component - SAFETY CRITICAL VISION
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Broken Windows Section (Page 6)

const BrokenWindowsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope - safely handle undefined icons
    const icons = window.Icons || {};
    const { 
        AlertTriangle = () => '⚠️', 
        ArrowLeft = () => '←', 
        ArrowRight = () => '→', 
        Home = () => '🏠', 
        CheckCircle = () => '✅', 
        XCircle = () => '❌', 
        FileText = () => '📄', 
        Shield = () => '🛡️', 
        AlertCircle = () => '⚠️', 
        Eye = () => '👁️', 
        Users = () => '👥', 
        Phone = () => '📞' 
    } = icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🪟 BROKEN WINDOWS - SAFETY ASSESSMENT</h2>
                        <p className="text-gray-300">Following SDC Engineering Issues Guide procedure for broken windows evaluation.</p>
                    </div>
                    
                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ SDC BROKEN WINDOWS PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Safety assessment must follow the exact SDC procedure: Driver → Passengers → Vehicle safety evaluation.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">SDC Assessment Order:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Step 1: Is the driver fit and well to continue?</li>
                                <li>Step 2: Are all passengers unharmed?</li>
                                <li>Step 3: Vehicle safety assessment (vision/danger)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Step 1: Driver Assessment</h3>
                        <p className="text-orange-300/80 text-sm mb-4 font-bold">Is this driver fit and well and able to continue in service?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('driver_fit', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_fit === 'yes'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_fit === 'yes' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_fit === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ YES - Driver is fit and well</span>
                                        <p className="text-sm text-gray-300 mt-1">Continue to next question</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_fit', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_fit === 'no'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_fit === 'no' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_fit === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 NO - Driver injured or unfit</span>
                                        <p className="text-sm text-gray-300 mt-1">Seek medical attention and organize replacement driver</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Step 2: Passenger Assessment</h3>
                        <p className="text-blue-300/80 text-sm mb-4 font-bold">Are all passengers unharmed?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('passengers_unharmed', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.passengers_unharmed === 'yes'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.passengers_unharmed === 'yes' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passengers_unharmed === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ YES - All passengers unharmed</span>
                                        <p className="text-sm text-gray-300 mt-1">Continue to next question</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passengers_unharmed', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.passengers_unharmed === 'no'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.passengers_unharmed === 'no' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passengers_unharmed === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 NO - Passengers injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Seek medical attention immediately</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passengers_unharmed', 'no_passengers')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.passengers_unharmed === 'no_passengers'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.passengers_unharmed === 'no_passengers' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passengers_unharmed === 'no_passengers' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">📭 N/A - No passengers on board</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle operating out of service</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Critical Action Required Warnings */}
                    {(responses.driver_fit === 'no' || responses.passengers_unharmed === 'no') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <Shield className="w-8 h-8 text-red-400 mt-1 animate-pulse" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 IMMEDIATE ACTION REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Critical safety situation - follow SDC procedures immediately</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Mandatory SDC Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {responses.driver_fit === 'no' && (
                                                    <>
                                                        <li>Seek medical attention for driver immediately</li>
                                                        <li>Organize replacement driver - vehicle cannot continue</li>
                                                    </>
                                                )}
                                                {responses.passengers_unharmed === 'no' && (
                                                    <>
                                                        <li>Seek medical attention for injured passengers</li>
                                                        <li>Secure scene and provide assistance as appropriate</li>
                                                    </>
                                                )}
                                                <li>Record all incidents immediately in Go-Check</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-6 border-t border-white/20">
                        <button
                            onClick={onNext}
                            disabled={!responses.driver_fit || !responses.passengers_unharmed}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            VEHICLE ASSESSMENT <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 VEHICLE SAFETY ASSESSMENT</h2>
                        <p className="text-gray-300">Critical SDC evaluation: driver vision and occupant danger assessment.</p>
                    </div>

                    <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                        <div className="flex items-start space-x-4">
                            <Eye className="w-8 h-8 text-red-400 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-4">🚨 SDC CRITICAL ASSESSMENT</h3>
                                <p className="font-bold text-lg text-red-300/90">Is the driver's view seriously impaired, or does it present a danger to occupants? Is detachment of loose articles likely?</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">Vehicle Safety Decision</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_unsafe', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_unsafe === 'yes'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_unsafe === 'yes' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_unsafe === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 YES - Driver view impaired OR danger to occupants OR loose articles</span>
                                        <p className="text-sm text-gray-300 mt-1">Stop immediately and seek assistance from engineering</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_unsafe', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_unsafe === 'no'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_unsafe === 'no' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_unsafe === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ NO - Driver view clear AND no danger to occupants AND no loose articles</span>
                                        <p className="text-sm text-gray-300 mt-1">Continue to next changeover point with vigilance</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">Additional Damage Check</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">Assess the extent of damage beyond windows:</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('damage_extent', 'windows_only')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_extent === 'windows_only'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">🪟 Windows only - no other damage</span>
                            </button>
                            <button
                                onClick={() => updateResponse('damage_extent', 'lights_damaged')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_extent === 'lights_damaged'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">💡 Sharp edges, loose parts, or damaged lights</span>
                            </button>
                            <button
                                onClick={() => updateResponse('damage_extent', 'critical_systems')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.damage_extent === 'critical_systems'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <span className="font-medium">🚨 Vandalism affecting brakes, steering, or control systems</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Engineering Consultation</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Consult engineering if you don\'t believe the vehicle can continue safely.</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('engineering_needed', 'yes')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_needed === 'yes'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <span className="font-medium">🔧 Engineering consultation required</span>
                            </button>
                            <button
                                onClick={() => updateResponse('engineering_needed', 'no')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_needed === 'no'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <span className="font-medium">✅ Clear assessment - no engineering needed</span>
                            </button>
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
                            disabled={!responses.vehicle_unsafe || !responses.damage_extent || !responses.engineering_needed}
                            className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold"
                        >
                            FINAL DECISION <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            const mustStop = responses.driver_fit === 'no' || 
                           responses.passengers_unharmed === 'no' ||
                           responses.vehicle_unsafe === 'yes' ||
                           responses.damage_extent === 'critical_systems' ||
                           responses.engineering_needed === 'yes';

            const canContinueWithVigilance = responses.driver_fit === 'yes' && 
                                           (responses.passengers_unharmed === 'yes' || responses.passengers_unharmed === 'no_passengers') &&
                                           responses.vehicle_unsafe === 'no' &&
                                           responses.damage_extent !== 'critical_systems' &&
                                           responses.engineering_needed === 'no';

            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">📋 BROKEN WINDOWS - FINAL DECISION</h2>
                        <p className="text-gray-300">SDC-compliant safety decision and action plan.</p>
                    </div>
                    
                    {mustStop ? (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛑</div>
                                <h3 className="text-2xl font-bold text-red-200 mb-2">STOP IMMEDIATELY</h3>
                                <p className="text-red-300/90 text-lg mb-6">
                                    Vehicle cannot continue - SDC safety requirements not met
                                </p>
                            </div>
                        </div>
                    ) : canContinueWithVigilance ? (
                        <div className="bg-amber-500/30 backdrop-blur-sm rounded-lg p-6 border border-amber-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-amber-200 mb-2">CONTINUE TO CHANGEOVER POINT</h3>
                                <p className="text-amber-300/90 text-lg mb-6">
                                    Vehicle may continue with driver vigilance - monitor for changes
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-6 border border-blue-400/50">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🔧</div>
                                <h3 className="text-2xl font-bold text-blue-200 mb-2">ENGINEERING ASSESSMENT REQUIRED</h3>
                                <p className="text-blue-300/90 text-lg mb-6">
                                    Complex situation requires professional evaluation
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Driver Fit:</span>
                                    <span className="text-white ml-2">{responses.driver_fit === 'yes' ? 'Fit and Well' : 'Injured/Unfit'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Passengers:</span>
                                    <span className="text-white ml-2">
                                        {responses.passengers_unharmed === 'yes' ? 'All Unharmed' : 
                                         responses.passengers_unharmed === 'no' ? 'Injured' : 'No Passengers'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Vehicle Safety:</span>
                                    <span className="text-white ml-2">
                                        {responses.vehicle_unsafe === 'yes' ? 'Unsafe Conditions Present' : 'No Safety Issues'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400">Final Decision:</span>
                                    <span className={`ml-2 font-semibold ${
                                        mustStop ? 'text-red-300' : 
                                        canContinueWithVigilance ? 'text-amber-300' : 'text-blue-300'
                                    }`}>
                                        {mustStop ? 'STOP IMMEDIATELY' : 
                                         canContinueWithVigilance ? 'CONTINUE WITH VIGILANCE' : 'ENGINEERING REQUIRED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <div className="flex items-start space-x-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-200 mb-2">📱 Go-Check Documentation Requirements</h4>
                                <ul className="list-disc list-inside space-y-1 text-blue-300/80 text-sm">
                                    <li>Record defects immediately when bus is stationary and in safe location</li>
                                    <li>Document extent of window damage and any additional damage</li>
                                    <li>Include photos if safe to obtain</li>
                                    <li>Record final safety decision and actions taken</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <div className="flex items-center space-x-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <div>
                                <h3 className="text-xl font-bold text-green-200">Broken Windows Assessment Complete</h3>
                                <p className="text-green-300/90 mt-2">SDC procedure followed. Safety decision implemented per engineering guidance.</p>
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
                            onClick={onComplete}
                            className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-lg font-semibold"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />COMPLETE ASSESSMENT
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Invalid step</div>;
    }
};

// Export to global scope for loading
window.BrokenWindowsWizard = BrokenWindowsWizard;