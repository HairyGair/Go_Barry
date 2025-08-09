// Road Traffic Incidents Wizard Component - Critical Incident Management
// Uses icons and constants from common components
// Follows SDC Engineering Issues Guide - Road Traffic Incidents Section (Pages 4-5)

const RoadTrafficIncidentsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete, onWizardSelect }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users, Tool } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚨 Road Traffic Incident Management</h2>
                        <p className="text-gray-300">Critical incident assessment following SDC emergency protocols - ensuring safety of all persons involved.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ EMERGENCY INCIDENT PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Road traffic incidents require immediate assessment of safety, injuries, and legal obligations. Priority is on welfare of all persons involved.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Critical Priorities (in order):</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>1. Driver's immediate wellbeing and fitness to continue</li>
                                <li>2. Assessment of passenger injuries and medical needs</li>
                                <li>3. Police notification and involvement procedures</li>
                                <li>4. Vehicle safety assessment and damage evaluation</li>
                                <li>5. Proper documentation and follow-up actions</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Initial Driver Wellbeing Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the current condition and state of the driver following the incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'fit_and_well')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'fit_and_well'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'fit_and_well' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'fit_and_well' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Driver is fit and well</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver appears calm, uninjured, and able to continue duties</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'distressed_but_functional')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'distressed_but_functional'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'distressed_but_functional' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'distressed_but_functional' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Driver distressed but functional</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver shaken but still capable of handling situation</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'distressed_unfit')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'distressed_unfit'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'distressed_unfit' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'distressed_unfit' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Driver distressed and unfit to continue</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver appears unable to proceed safely</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'injured')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'injured'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'injured' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'injured' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🩹 Driver is injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver has visible injuries or reports being hurt</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Passenger Safety Assessment</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Are there any injured passengers on the bus requiring medical attention?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'no_passengers')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'no_passengers'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'no_passengers' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'no_passengers' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👥 No passengers on board</span>
                                        <p className="text-sm text-gray-300 mt-1">Bus was operating out of service</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'all_unharmed')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'all_unharmed'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'all_unharmed' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'all_unharmed' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ All passengers unharmed</span>
                                        <p className="text-sm text-gray-300 mt-1">No injuries reported by passengers</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'minor_injuries')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'minor_injuries'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'minor_injuries' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'minor_injuries' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🩹 Minor passenger injuries</span>
                                        <p className="text-sm text-gray-300 mt-1">Passengers report minor cuts, bruises, or discomfort</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'serious_injuries')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'serious_injuries'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'serious_injuries' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'serious_injuries' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Serious passenger injuries</span>
                                        <p className="text-sm text-gray-300 mt-1">Passengers require immediate medical attention</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="font-semibold text-yellow-200 mb-3">Police Involvement Status</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">Has the police been notified about the incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('police_notified', 'already_notified')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'already_notified'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'already_notified' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'already_notified' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Police already notified</span>
                                        <p className="text-sm text-gray-300 mt-1">Emergency services have been contacted</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('police_notified', 'not_notified')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'not_notified'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'not_notified' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'not_notified' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Police not yet notified</span>
                                        <p className="text-sm text-gray-300 mt-1">Emergency services need to be contacted</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('police_notified', 'not_required')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'not_required'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'not_required' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'not_required' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">ℹ️ Police notification not required</span>
                                        <p className="text-sm text-gray-300 mt-1">Minor incident, no injuries, no third party involvement</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Safety Warnings */}
                    {(responses.driver_wellbeing === 'distressed_unfit' || responses.driver_wellbeing === 'injured' ||
                      responses.passenger_injuries === 'serious_injuries') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Critical situation detected - Emergency response protocol activated</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Mandatory Emergency Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Call emergency services immediately (999)</li>
                                                <li>Arrange supervisor attendance to scene</li>
                                                <li>Do not move injured persons unless in immediate danger</li>
                                                <li>Provide first aid within competence level</li>
                                                <li>Secure scene and await professional medical help</li>
                                                <li>Document everything for incident reporting</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.driver_wellbeing || !responses.passenger_injuries || !responses.police_notified}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Vehicle Safety & Damage Assessment</h2>
                        <p className="text-gray-300">Comprehensive evaluation of vehicle condition and roadworthiness following incident.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🔍 VEHICLE DAMAGE EVALUATION</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Thorough assessment of all vehicle damage to determine safety implications and operational capability.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Assessment Priorities:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Sharp edges, loose parts, or detached components</li>
                                <li>Damage to safety-critical systems (brakes, steering, lights)</li>
                                <li>Structural integrity and passenger safety</li>
                                <li>Operational capability and roadworthiness</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Damage Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the extent of damage to the vehicle following the incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'no_damage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'no_damage'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'no_damage' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'no_damage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No visible damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle appears unharmed by the incident</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'minor_cosmetic_safe')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'minor_cosmetic_safe'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'minor_cosmetic_safe' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'minor_cosmetic_safe' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Minor cosmetic damage (no hazards)</span>
                                        <p className="text-sm text-gray-300 mt-1">Scratches, paint damage - no sharp edges or loose parts</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'minor_cosmetic_hazards')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'minor_cosmetic_hazards'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'minor_cosmetic_hazards' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'minor_cosmetic_hazards' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Minor damage with hazards</span>
                                        <p className="text-sm text-gray-300 mt-1">Sharp edges, loose panels, or potential hazards present</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'significant_damage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'significant_damage'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'significant_damage' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'significant_damage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Significant structural damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Major body damage, broken windows, or structural issues</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'safety_critical')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'safety_critical'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'safety_critical' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'safety_critical' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Safety-critical damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage to brakes, steering, lights, or other safety systems</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Vehicle Operational Status</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Is the vehicle currently safe to operate on public roads?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('operational_status', 'fully_operational')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'fully_operational'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'fully_operational' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'fully_operational' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Fully operational</span>
                                        <p className="text-sm text-gray-300 mt-1">All systems functioning normally, safe to continue</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operational_status', 'limited_operation')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'limited_operation'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'limited_operation' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'limited_operation' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Limited operation possible</span>
                                        <p className="text-sm text-gray-300 mt-1">Can continue to depot but requires immediate attention</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operational_status', 'unsafe_to_operate')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'unsafe_to_operate'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'unsafe_to_operate' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'unsafe_to_operate' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Unsafe to operate</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle must remain stationary pending engineering assessment</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="font-semibold text-purple-200 mb-3">Go-Check System Status</h3>
                        <p className="text-purple-300/80 text-sm mb-4">Has the incident and any defects been recorded in the Go-Check system?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('go_check_recorded', 'already_recorded')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.go_check_recorded === 'already_recorded'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.go_check_recorded === 'already_recorded' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.go_check_recorded === 'already_recorded' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Already recorded in Go-Check</span>
                                        <p className="text-sm text-gray-300 mt-1">All defects and incidents properly documented</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('go_check_recorded', 'needs_recording')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.go_check_recorded === 'needs_recording'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.go_check_recorded === 'needs_recording' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.go_check_recorded === 'needs_recording' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Needs recording in Go-Check</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver must input defects when stationary and safe</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Vehicle Safety Warnings */}
                    {(responses.vehicle_damage === 'safety_critical' || responses.operational_status === 'unsafe_to_operate') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 VEHICLE SAFETY CRITICAL</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Vehicle is unsafe for operation - Emergency protocol activated</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions Required:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Vehicle must remain stationary</li>
                                                <li>Contact engineering immediately for assessment</li>
                                                <li>Arrange supervisor attendance to scene</li>
                                                <li>Passengers may need alternative transport</li>
                                                <li>Record all defects in Go-Check system</li>
                                                <li>Potential PG9 prohibition notice implications</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.vehicle_damage || !responses.operational_status || !responses.go_check_recorded}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Documentation
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📝 Follow-up Actions & Documentation</h2>
                        <p className="text-gray-300">Essential documentation and follow-up procedures to ensure complete incident management.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">📊 DOCUMENTATION REQUIREMENTS</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Proper documentation is essential for legal compliance, insurance claims, and operational learning.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Mandatory Documentation:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Tracerit report completion within 24 hours</li>
                                <li>Go-Check system defect recording</li>
                                <li>Third-party information exchange (if applicable)</li>
                                <li>Supervisor notification and involvement</li>
                                <li>Engineering consultation and decisions</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Third-Party Involvement</h3>
                        <p className="text-gray-300 text-sm mb-4">Was another vehicle or third party involved in the incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('third_party_involved', 'no_third_party')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.third_party_involved === 'no_third_party'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.third_party_involved === 'no_third_party' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.third_party_involved === 'no_third_party' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No third party involved</span>
                                        <p className="text-sm text-gray-300 mt-1">Single vehicle incident or property damage only</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('third_party_involved', 'third_party_present')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.third_party_involved === 'third_party_present'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.third_party_involved === 'third_party_present' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.third_party_involved === 'third_party_present' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Third party present at scene</span>
                                        <p className="text-sm text-gray-300 mt-1">Other driver/person available for information exchange</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('third_party_involved', 'third_party_absent')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.third_party_involved === 'third_party_absent'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.third_party_involved === 'third_party_absent' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.third_party_involved === 'third_party_absent' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Third party left scene (hit and run)</span>
                                        <p className="text-sm text-gray-300 mt-1">Other driver left scene - police must be notified</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Engineering Consultation</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Has engineering been consulted about the vehicle condition and next steps?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('engineering_consulted', 'already_consulted')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_consulted === 'already_consulted'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.engineering_consulted === 'already_consulted' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.engineering_consulted === 'already_consulted' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Engineering already consulted</span>
                                        <p className="text-sm text-gray-300 mt-1">Decision made on vehicle operation and next steps</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('engineering_consulted', 'needs_consultation')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.engineering_consulted === 'needs_consultation'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.engineering_consulted === 'needs_consultation' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.engineering_consulted === 'needs_consultation' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Needs engineering consultation</span>
                                        <p className="text-sm text-gray-300 mt-1">Engineering assessment required for vehicle decision</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="font-semibold text-purple-200 mb-3">Supervisor Involvement</h3>
                        <p className="text-purple-300/80 text-sm mb-4">Based on the incident severity and driver condition, what level of supervisor involvement is required?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('supervisor_involvement', 'not_required')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.supervisor_involvement === 'not_required'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.supervisor_involvement === 'not_required' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.supervisor_involvement === 'not_required' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No supervisor attendance required</span>
                                        <p className="text-sm text-gray-300 mt-1">Minor incident, driver capable, remote management sufficient</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('supervisor_involvement', 'driver_support')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.supervisor_involvement === 'driver_support'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.supervisor_involvement === 'driver_support' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.supervisor_involvement === 'driver_support' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Required for driver support</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver distressed/shaken, needs support or break</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('supervisor_involvement', 'third_party_management')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.supervisor_involvement === 'third_party_management'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.supervisor_involvement === 'third_party_management' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.supervisor_involvement === 'third_party_management' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Required for third-party management</span>
                                        <p className="text-sm text-gray-300 mt-1">Aggressive third party, driver needs assistance managing situation</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('supervisor_involvement', 'serious_incident')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.supervisor_involvement === 'serious_incident'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.supervisor_involvement === 'serious_incident' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.supervisor_involvement === 'serious_incident' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Required for serious incident</span>
                                        <p className="text-sm text-gray-300 mt-1">Injuries, major damage, or critical incident management</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="font-semibold text-green-200 mb-3">Report Completion Status</h3>
                        <p className="text-green-300/80 text-sm mb-4">Will the driver be able to complete the mandatory Tracerit report within 24 hours?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('report_completion', 'driver_can_complete')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.report_completion === 'driver_can_complete'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.report_completion === 'driver_can_complete' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.report_completion === 'driver_can_complete' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Driver can complete report</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver fit to handle documentation requirements</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('report_completion', 'assistance_required')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.report_completion === 'assistance_required'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.report_completion === 'assistance_required' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.report_completion === 'assistance_required' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Driver needs assistance</span>
                                        <p className="text-sm text-gray-300 mt-1">Support required for report completion</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Third Party Information Collection */}
                    {responses.third_party_involved === 'third_party_present' && (
                        <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-6 border border-blue-400/50">
                            <div className="flex items-start space-x-4">
                                <FileText className="w-8 h-8 text-blue-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-200 mb-3">📋 THIRD-PARTY DATA COLLECTION</h3>
                                    <div className="text-blue-300/90 space-y-2">
                                        <p className="font-semibold">Third party present - TracerIt data collection required</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-blue-200 mb-2">Recommended Action:</h4>
                                            <p className="text-blue-300/90 text-sm mb-3">Use the TracerIt Helper to systematically collect all required third-party information for insurance claims.</p>
                                            <button
                                                onClick={() => {
                                                    if (onWizardSelect) {
                                                        onWizardSelect('tracerit_helper');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                                            >
                                                📋 Launch TracerIt Helper
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Hit and Run Warning */}
                    {responses.third_party_involved === 'third_party_absent' && (
                        <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-6 border border-orange-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-orange-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-200 mb-3">🚨 HIT AND RUN INCIDENT</h3>
                                    <div className="text-orange-300/90 space-y-2">
                                        <p className="font-semibold">Third party left scene without exchanging details</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-orange-200 mb-2">Mandatory Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-orange-300/90 text-sm">
                                                <li>Driver must call police immediately (999 or 101)</li>
                                                <li>Record vehicle registration if visible</li>
                                                <li>Take photos of damage and scene if safe to do so</li>
                                                <li>Note exact location, time, and direction of departure</li>
                                                <li>Pass all details to manager for investigation</li>
                                                <li>Complete incident report with all available information</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Critical Supervisor Warning */}
                    {responses.supervisor_involvement === 'serious_incident' && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 SUPERVISOR ATTENDANCE CRITICAL</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Immediate supervisor response required</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Contact supervisor immediately</li>
                                                <li>Provide exact location and incident details</li>
                                                <li>Remain at scene until supervisor arrives</li>
                                                <li>Continue providing support to driver</li>
                                                <li>Escalate to senior management if required</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.driver_wellbeing || !responses.passenger_injuries || !responses.police_notified || !responses.vehicle_damage || !responses.operational_status || !responses.go_check_recorded || !responses.third_party_involved || !responses.engineering_consulted || !responses.supervisor_involvement || !responses.report_completion}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📊 Incident Assessment Complete</h2>
                        <p className="text-gray-300">Comprehensive summary and recommended actions based on your assessment.</p>
                    </div>
                    
                    {/* Critical Actions Banner */}
                    {(responses.driver_wellbeing === 'injured' || responses.passenger_injuries === 'serious_injuries' || 
                      responses.vehicle_damage === 'safety_critical' || responses.operational_status === 'unsafe_to_operate' ||
                      responses.supervisor_involvement === 'serious_incident') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 CRITICAL ACTIONS REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">This incident requires immediate priority attention</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Immediate Priority Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {(responses.driver_wellbeing === 'injured' || responses.passenger_injuries === 'serious_injuries') && (
                                                    <li>Call emergency services (999) - Medical attention required</li>
                                                )}
                                                {(responses.vehicle_damage === 'safety_critical' || responses.operational_status === 'unsafe_to_operate') && (
                                                    <li>Vehicle must remain stationary - Contact engineering immediately</li>
                                                )}
                                                {responses.supervisor_involvement === 'serious_incident' && (
                                                    <li>Contact supervisor immediately for scene attendance</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Status Overview */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">📊 Incident Status Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Driver Status */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-4 h-4 rounded-full ${
                                        responses.driver_wellbeing === 'fit_and_well' ? 'bg-green-400' :
                                        responses.driver_wellbeing === 'distressed_but_functional' ? 'bg-yellow-400' :
                                        'bg-red-400'
                                    }`}></div>
                                    <h4 className="font-medium text-white">Driver Status</h4>
                                </div>
                                <p className="text-sm text-gray-300">
                                    {responses.driver_wellbeing === 'fit_and_well' ? 'Driver is fit and well' :
                                     responses.driver_wellbeing === 'distressed_but_functional' ? 'Driver distressed but functional' :
                                     responses.driver_wellbeing === 'distressed_unfit' ? 'Driver distressed and unfit to continue' :
                                     'Driver is injured'}
                                </p>
                            </div>
                            
                            {/* Passenger Status */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-4 h-4 rounded-full ${
                                        responses.passenger_injuries === 'no_passengers' || responses.passenger_injuries === 'all_unharmed' ? 'bg-green-400' :
                                        responses.passenger_injuries === 'minor_injuries' ? 'bg-yellow-400' :
                                        'bg-red-400'
                                    }`}></div>
                                    <h4 className="font-medium text-white">Passenger Status</h4>
                                </div>
                                <p className="text-sm text-gray-300">
                                    {responses.passenger_injuries === 'no_passengers' ? 'No passengers on board' :
                                     responses.passenger_injuries === 'all_unharmed' ? 'All passengers unharmed' :
                                     responses.passenger_injuries === 'minor_injuries' ? 'Minor passenger injuries reported' :
                                     'Serious passenger injuries - medical attention required'}
                                </p>
                            </div>
                            
                            {/* Vehicle Status */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-4 h-4 rounded-full ${
                                        responses.vehicle_damage === 'no_damage' && responses.operational_status === 'fully_operational' ? 'bg-green-400' :
                                        responses.vehicle_damage === 'minor_cosmetic' || responses.operational_status === 'limited_operation' ? 'bg-yellow-400' :
                                        'bg-red-400'
                                    }`}></div>
                                    <h4 className="font-medium text-white">Vehicle Status</h4>
                                </div>
                                <p className="text-sm text-gray-300">
                                    {responses.vehicle_damage === 'no_damage' ? 'No visible damage' :
                                     responses.vehicle_damage === 'minor_cosmetic' ? 'Minor cosmetic damage' :
                                     responses.vehicle_damage === 'significant_damage' ? 'Significant structural damage' :
                                     'Safety-critical damage'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {responses.operational_status === 'fully_operational' ? 'Fully operational' :
                                     responses.operational_status === 'limited_operation' ? 'Limited operation possible' :
                                     'Unsafe to operate'}
                                </p>
                            </div>
                            
                            {/* Police Status */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-4 h-4 rounded-full ${
                                        responses.police_notified === 'already_notified' ? 'bg-green-400' :
                                        responses.police_notified === 'not_required' ? 'bg-blue-400' :
                                        'bg-yellow-400'
                                    }`}></div>
                                    <h4 className="font-medium text-white">Police Status</h4>
                                </div>
                                <p className="text-sm text-gray-300">
                                    {responses.police_notified === 'already_notified' ? 'Police already notified' :
                                     responses.police_notified === 'not_required' ? 'Police notification not required' :
                                     'Police not yet notified'}
                                </p>
                            </div>
                            
                        </div>
                    </div>
                    
                    {/* Action Items */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">✅ Required Actions</h3>
                        <div className="space-y-3">
                            
                            {/* Police Actions */}
                            {(responses.police_notified === 'not_notified' || responses.third_party_involved === 'third_party_absent') && (
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">📞 Police Notification</h4>
                                    <p className="text-blue-300/90 text-sm">
                                        {responses.third_party_involved === 'third_party_absent' ? 
                                            'MANDATORY: Call police immediately for hit-and-run incident (999 or 101)' : 
                                            'Contact police immediately to report the incident'
                                        }
                                    </p>
                                </div>
                            )}
                            
                            {/* Engineering Actions */}
                            {responses.engineering_consulted === 'needs_consultation' && (
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">🔧 Engineering Consultation</h4>
                                    <p className="text-blue-300/90 text-sm">Contact engineering for vehicle assessment and operational decision</p>
                                </div>
                            )}
                            
                            {/* Tranzaura Recording */}
                            {responses.go_check_recorded === 'needs_recording' && (
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">📝 Tranzaura Recording</h4>
                                    <p className="text-blue-300/90 text-sm">Record all defects and incident details in Tranzaura system when safe to do so</p>
                                </div>
                            )}
                            
                            {/* Third Party Actions */}
                            {responses.third_party_involved === 'third_party_absent' && (
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">📝 Bump Card Required</h4>
                                    <p className="text-blue-300/90 text-sm">Leave bump card with contact details at scene - third party not present</p>
                                </div>
                            )}
                            
                            {/* Report Completion */}
                            {responses.report_completion === 'assistance_required' && (
                                <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">📊 Report Assistance</h4>
                                    <p className="text-blue-300/90 text-sm">Provide support to driver for Tracerit report completion within 24 hours</p>
                                </div>
                            )}
                            
                            {/* Always Required */}
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-blue-200 mb-2">📊 Mandatory Documentation</h4>
                                <ul className="text-blue-300/90 text-sm space-y-1">
                                    <li>• Complete Tracerit report within 24 hours</li>
                                    <li>• Record all personal injuries to appropriate management</li>
                                    <li>• Document incident for operational learning</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* Vehicle Decision */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">🚗 Vehicle Operation Decision</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                            {(responses.operational_status === 'fully_operational' && (responses.vehicle_damage === 'no_damage' || responses.vehicle_damage === 'minor_cosmetic_safe')) ? (
                                <div>
                                    <h4 className="font-semibold text-green-200 mb-2">✅ Vehicle Can Continue in Service</h4>
                                    <p className="text-green-300/90 text-sm">Vehicle is safe to continue normal operations - engineering must still be notified of any damage</p>
                                </div>
                            ) : responses.operational_status === 'limited_operation' || responses.vehicle_damage === 'minor_cosmetic_hazards' ? (
                                <div>
                                    <h4 className="font-semibold text-yellow-200 mb-2">⚠️ Limited Operation - Changeover Required</h4>
                                    <p className="text-yellow-300/90 text-sm">Vehicle can continue to depot but requires immediate changeover due to safety hazards</p>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-semibold text-red-200 mb-2">🚨 Vehicle Must Remain Stationary</h4>
                                    <p className="text-red-300/90 text-sm">Vehicle is unsafe for operation - await engineering assessment</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Support Information */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">📞 Support & Escalation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-purple-200 mb-2">Driver Support</h4>
                                <p className="text-purple-300/90 text-sm mb-2">Provide reassurance and practical support:</p>
                                <ul className="text-purple-300/90 text-sm space-y-1">
                                    <li>• Remain calm and supportive</li>
                                    <li>• Keep driver informed of next steps</li>
                                    <li>• Arrange relief if driver unfit</li>
                                </ul>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-purple-200 mb-2">Escalation Path</h4>
                                <p className="text-purple-300/90 text-sm mb-2">Escalate to senior management if:</p>
                                <ul className="text-purple-300/90 text-sm space-y-1">
                                    <li>• Serious injuries reported</li>
                                    <li>• Complex legal implications</li>
                                    <li>• Media attention likely</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* Completion Actions */}
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                            ✅ Complete Incident Management
                        </button>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Step {currentStep} - Under construction</div>;
    }
};

// Export to global scope for loading
window.RoadTrafficIncidentsWizard = RoadTrafficIncidentsWizard;