// Fleet Selection Modal Component
// Integrates with fleetLookupComponent.js for vehicle search and selection

const FleetSelectionModal = function({ isVisible, onClose, onVehicleSelected, wizardType }) {
    const { useState, useEffect } = React;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    
    // Search for vehicles as user types
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        
        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            setError('');
            
            try {
                // Use the local fleet database that's already loaded
                if (window.fleetDatabase && window.fleetDatabase.fleetData) {
                    const results = window.fleetDatabase.searchVehicles(searchQuery);
                    setSearchResults(results.slice(0, 10)); // Limit to 10 results
                } else {
                    // If fleet database isn't loaded yet, try to load it from correct location
                    console.log('⚠️ FleetSelectionModal: Fleet database not available, loading directly...');
                    const response = await fetch('/gne-fleet-database.json');
                    const rawData = await response.json();
                    
                    // Search through the real fleet data (with actual depot assignments!)
                    const searchTerm = searchQuery.toLowerCase();
                    const results = [];
                    
                    if (rawData.fleet && Array.isArray(rawData.fleet)) {
                        rawData.fleet.forEach(vehicle => {
                            const fleetNumber = vehicle.fleetNumber;
                            const registration = vehicle.regNo || '';
                            const realDepot = vehicle.depot; // REAL depot from Excel!
                            
                            if (fleetNumber.includes(searchTerm) ||
                                registration.toLowerCase().includes(searchTerm)) {
                                
                                // Transform to expected format with REAL depot
                                results.push({
                                    fleetNumber: fleetNumber,
                                    registration: registration,
                                    depot: realDepot, // REAL depot assignment!
                                    busType: extractBusType(vehicle.vehicleType || ''),
                                    capacity: extractCapacity(vehicle.vehicleType || ''),
                                    yearOfManufacture: estimateYear(registration),
                                    vehicleType: vehicle.vehicleType
                                });
                            }
                        });
                    }
                    
                    setSearchResults(results.slice(0, 10));
                }
            } catch (err) {
                console.error('Fleet search error:', err);
                setError('Failed to load fleet database');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        
        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);
    
    // Handle vehicle selection
    const handleVehicleSelect = (vehicle) => {
        // Vehicle already has full details from the search
        setSelectedVehicle(vehicle);
    };
    
    // Confirm selection and close modal
    const handleConfirm = () => {
        if (selectedVehicle) {
            onVehicleSelected({
                fleetNumber: selectedVehicle.fleetNumber,
                registration: selectedVehicle.registration,
                depot: selectedVehicle.depot,
                vehicleType: selectedVehicle.busType,
                vehicleTypeCategory: selectedVehicle.busType?.split(' ').slice(0, 2).join(' ') || 'Bus',
                capacity: selectedVehicle.capacity,
                yearOfManufacture: selectedVehicle.yearOfManufacture,
                age: selectedVehicle.yearOfManufacture ? new Date().getFullYear() - selectedVehicle.yearOfManufacture : null,
                fullDetails: selectedVehicle
            });
            handleClose();
        }
    };
    
    // Close modal and reset state
    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedVehicle(null);
        setError('');
        onClose();
    };
    
    // Helper functions for data transformation (used in fallback)
    const estimateDepot = (fleetNumber) => {
        const num = parseInt(fleetNumber);
        
        // Solo vehicles (600s range) - likely Consett
        if (num >= 638 && num <= 699) return 'Consett';
        
        // Additional low number ranges
        if (num >= 700 && num <= 999) return 'Consett';
        if (num >= 1000 && num <= 3940) return 'Consett';
        
        // Existing operational depot ranges
        if (num >= 3941 && num <= 3965) return 'Consett';
        if (num >= 5210 && num <= 5229) return 'Deptford';
        if (num >= 5230 && num <= 5249) return 'Percy Main';
        if (num >= 5250 && num <= 5274) return 'Deptford';
        if (num >= 5275 && num <= 5284) return 'Percy Main';
        if (num >= 5285 && num <= 5309) return 'Riverside';
        if (num >= 5310 && num <= 5337) return 'Washington';
        if (num >= 5338 && num <= 5376) return 'Consett';
        if (num >= 5377 && num <= 5409) return 'Deptford';
        if (num >= 5410 && num <= 5419) return 'Hexham';
        if (num >= 5420 && num <= 5437) return 'Percy Main';
        if (num >= 5438 && num <= 5452) return 'Riverside';
        if (num >= 5453 && num <= 5479) return 'Washington';
        if (num >= 5480 && num <= 5499) return 'Consett';
        
        // Extended 6000s ranges
        if (num >= 6001 && num <= 6007) return 'Deptford';
        if (num >= 6008 && num <= 6014) return 'Hexham';
        if (num >= 6015 && num <= 6042) return 'Hexham';
        if (num >= 6043 && num <= 6048) return 'Percy Main';
        if (num >= 6049 && num <= 6055) return 'Riverside';
        if (num >= 6056 && num <= 6070) return 'Washington';
        if (num >= 6071 && num <= 6084) return 'Consett';
        if (num >= 6085 && num <= 6098) return 'Washington';
        if (num >= 6099 && num <= 6117) return 'Riverside';
        if (num >= 6118 && num <= 6146) return 'Percy Main';
        if (num >= 6147 && num <= 6161) return 'Consett';
        if (num >= 6162 && num <= 6175) return 'Hexham';
        if (num >= 6176 && num <= 6307) return 'Washington';
        if (num >= 6308 && num <= 6332) return 'Consett';
        if (num >= 6333 && num <= 6337) return 'Washington';
        if (num >= 6338 && num <= 6355) return 'Percy Main';
        if (num >= 6356 && num <= 6376) return 'Riverside';
        if (num >= 6377 && num <= 6916) return 'Deptford';
        if (num >= 6917 && num <= 6923) return 'Percy Main';
        if (num >= 6924 && num <= 6931) return 'Riverside';
        if (num >= 6932 && num <= 6949) return 'Percy Main';
        if (num >= 6950 && num <= 6964) return 'Washington';
        if (num >= 6965 && num <= 6970) return 'Percy Main';
        if (num >= 6971 && num <= 6999) return 'Riverside';
        if (num >= 7000 && num <= 7999) return 'Percy Main';
        if (num >= 8000 && num <= 8305) return 'Washington';
        
        return 'Non-operational';
    };
    
    const extractBusType = (vehicleTypeStr) => {
        if (!vehicleTypeStr) return 'Unknown';
        const lower = vehicleTypeStr.toLowerCase();
        if (lower.includes('solo')) return 'Solo';
        if (lower.includes('streetlite')) return 'Streetlite';
        if (lower.includes('streetdeck')) return 'Streetdeck';
        if (lower.includes('enviro 400')) return 'Enviro 400';
        if (lower.includes('versa')) return 'Versa';
        if (lower.includes('b9tl')) return 'Volvo B9TL';
        return vehicleTypeStr.split(' ').slice(0, 2).join(' ');
    };
    
    const extractCapacity = (vehicleTypeStr) => {
        if (!vehicleTypeStr) return null;
        const lower = vehicleTypeStr.toLowerCase();
        if (lower.includes('solo')) return 30;
        if (lower.includes('streetlite')) return 43;
        if (lower.includes('streetdeck')) return 84;
        if (lower.includes('enviro 400')) return 84;
        if (lower.includes('versa')) return 39;
        if (lower.includes('b9tl')) return 84;
        return null;
    };
    
    const estimateYear = (registration) => {
        if (!registration) return null;
        const match = registration.match(/([0-9]{2})/g);
        if (match && match.length > 0) {
            const ageId = parseInt(match[0]);
            if (ageId >= 51) return 2000 + ageId - 50;
            if (ageId <= 20) return 2000 + ageId;
        }
        return null;
    };
    
    if (!isVisible) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Vehicle</h2>
                        <p className="text-blue-100 text-sm">
                            Choose a vehicle for the {wizardType?.replace('_', ' ')} assessment
                        </p>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="text-white/80 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Search Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search by Fleet Number or Registration
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="e.g. 6301 or NK18 HKJ"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                autoFocus
                            />
                            {loading && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                        {error && (
                            <p className="text-red-600 text-sm mt-2">{error}</p>
                        )}
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                {searchResults.map((vehicle) => (
                                    <button
                                        key={vehicle.fleetNumber}
                                        onClick={() => handleVehicleSelect(vehicle)}
                                        className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                            selectedVehicle?.fleetNumber === vehicle.fleetNumber ? 'bg-blue-100' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold text-gray-900">
                                                    Fleet {vehicle.fleetNumber}
                                                </span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span className="text-gray-700">{vehicle.registration}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {vehicle.depot}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {vehicle.busType?.split(' ').slice(0, 4).join(' ') || 'Unknown Type'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Selected Vehicle Details */}
                    {selectedVehicle && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Vehicle</h3>
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                            {selectedVehicle.fleetNumber}
                                        </div>
                                        <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-700">
                                            {selectedVehicle.registration}
                                        </div>
                                        <div className="bg-blue-100 px-3 py-1 rounded text-sm font-medium text-blue-700">
                                            {selectedVehicle.depot}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Type:</span>
                                        <span className="ml-2 font-medium">{selectedVehicle.busType || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Capacity:</span>
                                        <span className="ml-2 font-medium">{selectedVehicle.capacity || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Year:</span>
                                        <span className="ml-2 font-medium">{selectedVehicle.yearOfManufacture || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Age:</span>
                                        <span className="ml-2 font-medium">{selectedVehicle.yearOfManufacture ? `${new Date().getFullYear() - selectedVehicle.yearOfManufacture} years` : 'Unknown'}</span>
                                    </div>
                                </div>
                                
                                {selectedVehicle.busType && (
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                        <span className="text-gray-600 text-xs">Full Type:</span>
                                        <div className="text-sm font-medium text-gray-800 mt-1">
                                            {selectedVehicle.busType}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedVehicle}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            selectedVehicle 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Start Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};

// Make component globally available
window.FleetSelectionModal = FleetSelectionModal;