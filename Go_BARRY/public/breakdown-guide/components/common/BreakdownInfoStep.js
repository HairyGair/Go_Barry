// Common Breakdown Information Component
// Collects essential data for all breakdown assessments

const BreakdownInfoStep = ({ responses, updateResponse, onNext }) => {
    const { FileText, MapPin, User, Truck, Building } = window.Icons || {};
    
    const depots = ['Washington', 'Consett', 'Hexham', 'Riverside', 'Gateshead Riverside'];
    
    const isComplete = () => {
        return responses.fleetNumber && 
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
                {/* Fleet Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Truck className="inline w-4 h-4 mr-2" />
                        Fleet Number
                    </label>
                    <input
                        type="text"
                        value={responses.fleetNumber || ''}
                        onChange={(e) => updateResponse('fleetNumber', e.target.value)}
                        placeholder="e.g., 5301"
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                </div>
                
                {/* Depot */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Building className="inline w-4 h-4 mr-2" />
                        Depot
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