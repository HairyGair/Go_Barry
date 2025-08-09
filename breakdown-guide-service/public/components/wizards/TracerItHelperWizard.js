// TraceIt Helper Wizard Component - Supervisor Data Collection Tool
// Uses icons and constants from common components
// Helps supervisors collect all necessary information for Tracerit reports and insurance claims

const TracerItHelperWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete, onWizardSelect }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users, Tool, Info } = window.Icons;
    
    // Helper function to update passenger data
    const updatePassengerData = (passengerIndex, field, value) => {
        const passengers = responses.passengers || [];
        const updatedPassengers = [...passengers];
        
        if (!updatedPassengers[passengerIndex]) {
            updatedPassengers[passengerIndex] = {};
        }
        
        updatedPassengers[passengerIndex][field] = value;
        updateResponse('passengers', updatedPassengers);
    };
    
    // Helper function to add new passenger
    const addPassenger = () => {
        const passengers = responses.passengers || [];
        const newPassenger = {
            name: '',
            mobile: '',
            email: '',
            address_line1: '',
            postcode: '',
            injury_nature: '',
            injury_severity: ''
        };
        updateResponse('passengers', [...passengers, newPassenger]);
    };
    
    // Helper function to remove passenger
    const removePassenger = (index) => {
        const passengers = responses.passengers || [];
        const updatedPassengers = passengers.filter((_, i) => i !== index);
        updateResponse('passengers', updatedPassengers);
    };
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Third-Party Vehicle Information</h2>
                        <p className="text-gray-300">Collect detailed information about the other vehicle involved in the incident.</p>
                    </div>
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-semibold text-amber-200 mb-4">📋 VEHICLE DETAILS COLLECTION</h3>
                        <p className="text-amber-300/80 text-sm leading-relaxed mb-4">
                            This information is essential for insurance claims and Tracerit reporting. Collect all details accurately at the scene.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-amber-200 mb-2">Required Information:</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                <li>Complete vehicle registration number</li>
                                <li>Make and model of the vehicle</li>
                                <li>Primary colour of the vehicle</li>
                                <li>Brief description of visible damage</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Registration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Registration Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.vehicle_reg || ''}
                                    onChange={(e) => updateResponse('vehicle_reg', e.target.value.toUpperCase())}
                                    placeholder="e.g. AB12 CDE"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Make <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.vehicle_make || ''}
                                    onChange={(e) => updateResponse('vehicle_make', e.target.value)}
                                    placeholder="e.g. Ford, Toyota, BMW"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Model <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.vehicle_model || ''}
                                    onChange={(e) => updateResponse('vehicle_model', e.target.value)}
                                    placeholder="e.g. Focus, Corolla, X5"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Colour <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.vehicle_colour || ''}
                                    onChange={(e) => updateResponse('vehicle_colour', e.target.value)}
                                    placeholder="e.g. Red, Blue, Silver"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Year (if known)
                                </label>
                                <input
                                    type="text"
                                    value={responses.vehicle_year || ''}
                                    onChange={(e) => updateResponse('vehicle_year', e.target.value)}
                                    placeholder="e.g. 2020"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Damage Description</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Visible Damage to Third-Party Vehicle
                            </label>
                            <textarea
                                value={responses.vehicle_damage_description || ''}
                                onChange={(e) => updateResponse('vehicle_damage_description', e.target.value)}
                                placeholder="Describe the damage you can see on the third-party vehicle..."
                                rows="4"
                                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.vehicle_reg || !responses.vehicle_make || !responses.vehicle_model || !responses.vehicle_colour}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Driver Details
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">👤 Third-Party Driver Information</h2>
                        <p className="text-gray-300">Collect contact details and personal information of the other driver.</p>
                    </div>
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-semibold text-amber-200 mb-4">👥 DRIVER DETAILS COLLECTION</h3>
                        <p className="text-amber-300/80 text-sm leading-relaxed mb-4">
                            Essential contact information for insurance processing and legal requirements.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-amber-200 mb-2">Required Information:</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                <li>Full name of the driver</li>
                                <li>Mobile phone number</li>
                                <li>Email address (if available)</li>
                                <li>First line of address and postcode</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Driver Personal Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.driver_name || ''}
                                    onChange={(e) => updateResponse('driver_name', e.target.value)}
                                    placeholder="e.g. John Smith"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Mobile Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={responses.driver_mobile || ''}
                                    onChange={(e) => updateResponse('driver_mobile', e.target.value)}
                                    placeholder="e.g. 07123 456789"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={responses.driver_email || ''}
                                    onChange={(e) => updateResponse('driver_email', e.target.value)}
                                    placeholder="e.g. john.smith@email.com"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Address Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    First Line of Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.driver_address_line1 || ''}
                                    onChange={(e) => updateResponse('driver_address_line1', e.target.value)}
                                    placeholder="e.g. 123 Main Street"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Postcode <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={responses.driver_postcode || ''}
                                    onChange={(e) => updateResponse('driver_postcode', e.target.value.toUpperCase())}
                                    placeholder="e.g. NE1 4ST"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Driver Injury Status</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('driver_injury_status', 'no_injury')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_injury_status === 'no_injury'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_injury_status === 'no_injury' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_injury_status === 'no_injury' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Driver not injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver reports no injuries</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_injury_status', 'injured')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_injury_status === 'injured'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_injury_status === 'injured' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_injury_status === 'injured' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🩹 Driver injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver reports injuries</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.driver_name || !responses.driver_mobile || !responses.driver_address_line1 || !responses.driver_postcode || !responses.driver_injury_status}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Passenger Details
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">👥 Passenger Information</h2>
                        <p className="text-gray-300">Collect details of any injured passengers from the third-party vehicle.</p>
                    </div>
                    
                    <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-6 border border-amber-400/30">
                        <h3 className="text-lg font-semibold text-amber-200 mb-4">🚑 PASSENGER INJURY DETAILS</h3>
                        <p className="text-amber-300/80 text-sm leading-relaxed mb-4">
                            Only collect details for passengers who report injuries. This information is essential for insurance claims.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-amber-200 mb-2">Information Required Per Injured Passenger:</h4>
                            <ul className="list-disc list-inside space-y-1 text-amber-300/90 text-sm">
                                <li>Full name and contact details</li>
                                <li>Mobile phone and email (if available)</li>
                                <li>First line of address and postcode</li>
                                <li>Nature and severity of injuries</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Injured Passengers</h3>
                        
                        {(!responses.passengers || responses.passengers.length === 0) ? (
                            <div className="text-center py-8">
                                <p className="text-gray-300 mb-4">No injured passengers recorded yet</p>
                                <button
                                    onClick={addPassenger}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                                >
                                    Add Injured Passenger
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {responses.passengers.map((passenger, index) => (
                                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold text-white">Passenger {index + 1}</h4>
                                            <button
                                                onClick={() => removePassenger(index)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Full Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={passenger.name || ''}
                                                    onChange={(e) => updatePassengerData(index, 'name', e.target.value)}
                                                    placeholder="e.g. Jane Doe"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Mobile Number <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={passenger.mobile || ''}
                                                    onChange={(e) => updatePassengerData(index, 'mobile', e.target.value)}
                                                    placeholder="e.g. 07123 456789"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={passenger.email || ''}
                                                    onChange={(e) => updatePassengerData(index, 'email', e.target.value)}
                                                    placeholder="e.g. jane.doe@email.com"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Postcode <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={passenger.postcode || ''}
                                                    onChange={(e) => updatePassengerData(index, 'postcode', e.target.value.toUpperCase())}
                                                    placeholder="e.g. NE1 4ST"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    First Line of Address <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={passenger.address_line1 || ''}
                                                    onChange={(e) => updatePassengerData(index, 'address_line1', e.target.value)}
                                                    placeholder="e.g. 456 Oak Avenue"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Nature of Injury <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={passenger.injury_nature || ''}
                                                    onChange={(e) => updatePassengerData(index, 'injury_nature', e.target.value)}
                                                    placeholder="e.g. Neck pain, Back strain"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Injury Severity <span className="text-red-400">*</span>
                                                </label>
                                                <select
                                                    value={passenger.injury_severity || ''}
                                                    onChange={(e) => updatePassengerData(index, 'injury_severity', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                                >
                                                    <option value="">Select severity...</option>
                                                    <option value="minor">Minor</option>
                                                    <option value="moderate">Moderate</option>
                                                    <option value="serious">Serious</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="text-center">
                                    <button
                                        onClick={addPassenger}
                                        className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                                    >
                                        Add Another Passenger
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">No Injured Passengers</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('no_injured_passengers', true)}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.no_injured_passengers === true
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.no_injured_passengers === true ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.no_injured_passengers === true && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No passengers were injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Confirm that no passengers in the third-party vehicle reported injuries</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.no_injured_passengers && (!responses.passengers || responses.passengers.length === 0)}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Summary
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
                        <h2 className="text-2xl font-bold text-white mb-2">📊 Tracerit Report Summary</h2>
                        <p className="text-gray-300">Complete information package ready for Tracerit submission.</p>
                    </div>
                    
                    {/* Vehicle Information Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">🚗 Vehicle Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Registration</h4>
                                <p className="text-gray-300">{responses.vehicle_reg || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Make & Model</h4>
                                <p className="text-gray-300">{responses.vehicle_make || 'Not provided'} {responses.vehicle_model || ''}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Colour</h4>
                                <p className="text-gray-300">{responses.vehicle_colour || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Year</h4>
                                <p className="text-gray-300">{responses.vehicle_year || 'Not provided'}</p>
                            </div>
                        </div>
                        {responses.vehicle_damage_description && (
                            <div className="mt-4 bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Damage Description</h4>
                                <p className="text-gray-300">{responses.vehicle_damage_description}</p>
                            </div>
                        )}
                    </div>

                    {/* Driver Information Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">👤 Driver Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Name</h4>
                                <p className="text-gray-300">{responses.driver_name || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Mobile</h4>
                                <p className="text-gray-300">{responses.driver_mobile || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Email</h4>
                                <p className="text-gray-300">{responses.driver_email || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2">Injury Status</h4>
                                <p className="text-gray-300">
                                    {responses.driver_injury_status === 'no_injury' ? 'No injuries reported' : 
                                     responses.driver_injury_status === 'injured' ? 'Injured' : 'Not specified'}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 md:col-span-2">
                                <h4 className="font-medium text-white mb-2">Address</h4>
                                <p className="text-gray-300">
                                    {responses.driver_address_line1 || 'Not provided'}
                                    {responses.driver_postcode ? `, ${responses.driver_postcode}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Information Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">👥 Passenger Information</h3>
                        {responses.no_injured_passengers ? (
                            <div className="bg-green-500/20 rounded-lg p-4">
                                <p className="text-green-300">✅ No passengers were injured in the incident</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {responses.passengers && responses.passengers.length > 0 ? (
                                    responses.passengers.map((passenger, index) => (
                                        <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <h4 className="font-medium text-white mb-3">Passenger {index + 1}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-sm text-gray-400">Name:</span>
                                                    <p className="text-white">{passenger.name || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-400">Mobile:</span>
                                                    <p className="text-white">{passenger.mobile || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-400">Email:</span>
                                                    <p className="text-white">{passenger.email || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-400">Postcode:</span>
                                                    <p className="text-white">{passenger.postcode || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-400">Address:</span>
                                                    <p className="text-white">{passenger.address_line1 || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-400">Injury:</span>
                                                    <p className="text-white">{passenger.injury_nature || 'Not specified'} ({passenger.injury_severity || 'Not specified'})</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-yellow-500/20 rounded-lg p-4">
                                        <p className="text-yellow-300">⚠️ No passenger information recorded</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">📋 Next Steps</h3>
                        <div className="space-y-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-green-200 mb-2">✅ Information Collection Complete</h4>
                                <p className="text-green-300/90 text-sm">All necessary third-party information has been collected for the Tracerit report.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-green-200 mb-2">📝 Tracerit Report Submission</h4>
                                <p className="text-green-300/90 text-sm">Use this information to complete the Tracerit report within 24 hours of the incident.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded p-4">
                                <h4 className="font-semibold text-green-200 mb-2">🔄 Follow-up Actions</h4>
                                <p className="text-green-300/90 text-sm">Ensure all injured parties receive appropriate medical attention and follow-up care.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <div className="flex space-x-3">
                            {onWizardSelect && (
                                <button
                                    onClick={() => onWizardSelect('road_traffic_incidents')}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                                >
                                    🚨 Return to Traffic Incidents
                                </button>
                            )}
                            <button
                                onClick={onComplete}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                            >
                                ✅ Complete Tracerit Collection
                            </button>
                        </div>
                    </div>
                </div>
            );

        default:
            return <div className="text-white">Step {currentStep} - Under construction</div>;
    }
};

// Export to global scope for loading
window.TracerItHelperWizard = TracerItHelperWizard;
