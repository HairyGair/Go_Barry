// Common Breakdown Information Component with Fleet Database Integration
// Collects essential data for all breakdown assessments with auto-lookup

const BreakdownInfoStep = ({ responses, updateResponse, onNext }) => {
    const { FileText, MapPin, User, Truck, Building, Search, CheckCircle } = window.Icons || {};
    const [isLookingUp, setIsLookingUp] = React.useState(false);
    const [vehicleInfo, setVehicleInfo] = React.useState(null);
    const [lookupError, setLookupError] = React.useState(null);
    
    const depots = ['Washington', 'Consett', 'Hexham', 'Riverside', 'Gateshead Riverside', 'Percy Main', 'Deptford', 'Chester-le-Street', 'Stanley'];
    
    // Fleet database lookup function
    const lookupFleetNumber = async (fleetNumber) => {
        if (!fleetNumber || fleetNumber.length < 3) {
            setVehicleInfo(null);
            return;
        }
        
        setIsLookingUp(true);
        setLookupError(null);
        
        try {
            // Use the correct backend URL
            const backendUrl = window.BACKEND_URL || 'https://go-barry.onrender.com';
            const response = await fetch(`${backendUrl}/api/fleet-database/${fleetNumber}`);
            
            if (response.ok) {
                const data = await response.json();
                setVehicleInfo(data);
                
                // Auto-populate registration
                if (data.registration) {
                    updateResponse('registration', data.registration);
                }
                
                // Auto-populate depot if vehicle has one and none selected
                if (data.depot && !responses.depot) {
                    updateResponse('depot', data.depot);
                }
                
                // Store vehicle info in responses for logging
                updateResponse('vehicleInfo', {
                    busType: data.busType,
                    capacity: data.capacity,
                    yearOfManufacture: data.yearOfManufacture,
                    depot: data.depot
                });
                
                console.log('Vehicle found:', data);
            } else if (response.status === 404) {
                setVehicleInfo(null);
                setLookupError('Vehicle not found in database');
            } else {
                throw new Error('Failed to lookup vehicle');
            }
        } catch (error) {
            console.error('Fleet lookup error:', error);
            setLookupError('Unable to connect to fleet database');
        } finally {
            setIsLookingUp(false);
        }
    };
    
    // Handle fleet number changes
    React.useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (responses.fleetNumber) {
                lookupFleetNumber(responses.fleetNumber);
            }
        }, 500); // Debounce API calls
        
        return () => clearTimeout(delayDebounce);
    }, [responses.fleetNumber]);
    
    const isComplete = () => {
        return responses.fleetNumber && 
               responses.registration &&
               responses.depot && 
               responses.driverName && 
               responses.location;
    };
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Breakdown Information</h2>
                <p className="text-gray-300">Please provide essential details about this breakdown</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 space-y-4">
                {/* Fleet Number with lookup indicator */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Truck className="inline w-4 h-4 mr-2" />
                        Fleet Number
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={responses.fleetNumber || ''}
                            onChange={(e) => updateResponse('fleetNumber', e.target.value)}
                            placeholder="e.g., 5301"
                            className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                        />
                        {isLookingUp && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                        {vehicleInfo && !isLookingUp && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                        )}
                    </div>
                    {lookupError && (
                        <p className="text-amber-400 text-sm mt-1">{lookupError}</p>
                    )}
                </div>
                
                {/* Registration - Auto-populated */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Registration Number
                    </label>
                    <input
                        type="text"
                        value={responses.registration || ''}
                        onChange={(e) => updateResponse('registration', e.target.value)}
                        placeholder={vehicleInfo ? 'Auto-filled' : 'e.g., NX70ABC'}
                        className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 ${
                            vehicleInfo ? 'border-green-400/50' : 'border-white/30'
                        }`}
                    />
                </div>
                
                {/* Vehicle Info Display */}
                {vehicleInfo && (
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                        <p className="text-sm text-blue-200 font-medium mb-1">Vehicle Details</p>
                        <div className="text-xs text-gray-300 space-y-1">
                            <p>Type: {vehicleInfo.busType}</p>
                            <p>Capacity: {vehicleInfo.capacity} seats</p>
                            <p>Year: {vehicleInfo.yearOfManufacture}</p>
                            <p>Home Depot: {vehicleInfo.depot}</p>
                        </div>
                    </div>
                )}
                
                {/* Depot */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Building className="inline w-4 h-4 mr-2" />
                        Current Depot
                    </label>
                    <select
                        value={responses.depot || ''}
                        onChange={(e) => updateResponse('depot', e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    >
                        <option value="">Select depot...</option>
                        {depots.map(depot => (
                            <option key={depot} value={depot} className="bg-gray-800">{depot}</option>
                        ))}
                    </select>
                </div>
                
                {/* Driver Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <User className="inline w-4 h-4 mr-2" />
                        Driver Name
                    </label>
                    <input
                        type="text"
                        value={responses.driverName || ''}
                        onChange={(e) => updateResponse('driverName', e.target.value)}
                        placeholder="Driver's name"
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                </div>
                
                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <MapPin className="inline w-4 h-4 mr-2" />
                        Current Location
                    </label>
                    <input
                        type="text"
                        value={responses.location || ''}
                        onChange={(e) => updateResponse('location', e.target.value)}
                        placeholder="e.g., Station Road, Newcastle"
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                </div>
                
                {/* Route (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Route (Optional)
                    </label>
                    <input
                        type="text"
                        value={responses.route || ''}
                        onChange={(e) => updateResponse('route', e.target.value)}
                        placeholder="e.g., X1, 21, 56"
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                </div>
                
                {/* Driver Wellbeing */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Driver Wellbeing
                    </label>
                    <div className="space-y-2">
                        <button
                            onClick={() => updateResponse('driverWellbeing', 'fit_and_well')}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                responses.driverWellbeing === 'fit_and_well'
                                    ? 'border-green-400 bg-green-400/20 text-green-200'
                                    : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                            }`}
                        >
                            ✅ Fit and well - able to continue
                        </button>
                        <button
                            onClick={() => updateResponse('driverWellbeing', 'shaken_but_ok')}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                responses.driverWellbeing === 'shaken_but_ok'
                                    ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                    : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                            }`}
                        >
                            ⚠️ Shaken but able to continue
                        </button>
                        <button
                            onClick={() => updateResponse('driverWellbeing', 'needs_relief')}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                responses.driverWellbeing === 'needs_relief'
                                    ? 'border-red-400 bg-red-400/20 text-red-200'
                                    : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                            }`}
                        >
                            🚨 Needs relief driver
                        </button>
                    </div>
                </div>
                
                {/* GO-Check Reported */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Has this been reported on GO-Check?
                    </label>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => updateResponse('goCheckReported', true)}
                            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                responses.goCheckReported === true
                                    ? 'border-green-400 bg-green-400/20 text-green-200'
                                    : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                            }`}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => updateResponse('goCheckReported', false)}
                            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                responses.goCheckReported === false
                                    ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                                    : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50'
                            }`}
                        >
                            No
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!isComplete()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                        isComplete()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <span>Continue to Assessment</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
};

// Export to global scope
window.BreakdownInfoStep = BreakdownInfoStep;