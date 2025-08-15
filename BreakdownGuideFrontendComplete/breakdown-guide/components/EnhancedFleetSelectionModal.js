// Enhanced Fleet Selection Modal Component
// Provides prominent display of vehicle, driver, and depot information
// Integrates with existing fleetDatabase service and breakdown guide system

const EnhancedFleetSelectionModal = function({ isVisible, onClose, onVehicleSelected, wizardType }) {
    const { useState, useEffect, useRef } = React;
    
    const [fleetInput, setFleetInput] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const inputRef = useRef(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isVisible && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isVisible]);

    // Handle fleet number input with auto-lookup
    const handleFleetInput = async (value) => {
        setFleetInput(value);
        setError('');
        
        // Clear vehicle if input is changed
        if (selectedVehicle && selectedVehicle.fleetNumber !== value) {
            setSelectedVehicle(null);
        }

        // Auto-lookup when fleet number looks complete (3+ digits)
        if (value.length >= 3) {
            await handleFleetLookup(value);
        }

        // Show suggestions for partial matches
        if (value.length >= 2 && window.fleetDatabase && window.fleetDatabase.fleetData) {
            const matchingFleets = Object.keys(window.fleetDatabase.fleetData)
                .filter(fleet => fleet.startsWith(value))
                .slice(0, 5);
            setSuggestions(matchingFleets);
        } else {
            setSuggestions([]);
        }
    };

    // Enhanced vehicle lookup with comprehensive information
    const handleFleetLookup = async (fleetNumber) => {
        if (!fleetNumber) return;
        
        setLoading(true);
        try {
            let vehicle = null;
            
            // Try to get vehicle from fleet database
            if (window.fleetDatabase && window.fleetDatabase.fleetData) {
                vehicle = window.fleetDatabase.getByFleetNumber(fleetNumber);
            } else {
                // Fallback to direct database lookup
                console.log('⚠️ Fleet database not loaded, attempting direct lookup...');
                try {
                    const response = await fetch('/gne-fleet-database.json');
                    if (response.ok) {
                        const rawData = await response.json();
                        const fleetVehicle = rawData.fleet?.find(v => v.fleetNumber === fleetNumber);
                        if (fleetVehicle) {
                            vehicle = {
                                fleetNumber: fleetVehicle.fleetNumber,
                                registration: fleetVehicle.regNo || 'Unknown',
                                depot: fleetVehicle.depot || 'Unknown',
                                busType: extractBusType(fleetVehicle.vehicleType || ''),
                                vehicleType: fleetVehicle.vehicleType,
                                capacity: extractCapacity(fleetVehicle.vehicleType || ''),
                                yearOfManufacture: estimateYear(fleetVehicle.regNo)
                            };
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback lookup failed:', fallbackError);
                }
            }
            
            if (vehicle) {
                // Enhance vehicle with computed fields
                const enhancedVehicle = {
                    ...vehicle,
                    age: vehicle.yearOfManufacture ? new Date().getFullYear() - vehicle.yearOfManufacture : null,
                    // Add mock driver information (in real implementation, this would come from duty roster system)
                    driver: await getDriverInformation(fleetNumber),
                    route: await getCurrentRoute(fleetNumber),
                    dutyNumber: await getDutyNumber(fleetNumber),
                    lastInspection: await getLastInspectionDate(fleetNumber)
                };
                
                setSelectedVehicle(enhancedVehicle);
                setSuggestions([]);
                console.log('✅ Vehicle found with enhanced information:', enhancedVehicle);
            } else {
                // Fallback mechanism for unknown fleet numbers
                console.log('⚠️ Fleet number not in database, creating fallback vehicle...');
                const fallbackVehicle = await createFallbackVehicle(fleetNumber);
                
                if (fallbackVehicle) {
                    setSelectedVehicle(fallbackVehicle);
                    setSuggestions([]);
                    console.log('✅ Fallback vehicle created:', fallbackVehicle);
                } else {
                    setError(`Fleet number ${fleetNumber} not found in database`);
                    setSelectedVehicle(null);
                }
            }
        } catch (err) {
            console.error('Fleet lookup error:', err);
            setError('Failed to lookup vehicle information');
            setSelectedVehicle(null);
        } finally {
            setLoading(false);
        }
    };

    // Mock functions for driver/duty information (replace with real API calls)
    const getDriverInformation = async (fleetNumber) => {
        // This would integrate with your duty roster system
        // For demo purposes, using mock data
        const mockDrivers = {
            '6301': 'John Smith',
            '5423': 'Sarah Johnson', 
            '638': 'Mike Wilson'
        };
        return mockDrivers[fleetNumber] || 'Driver TBC';
    };

    const getCurrentRoute = async (fleetNumber) => {
        // This would integrate with your service planning system
        const mockRoutes = {
            '6301': '56',
            '5423': '42',
            '638': 'V9'
        };
        return mockRoutes[fleetNumber] || 'Route TBC';
    };

    const getDutyNumber = async (fleetNumber) => {
        // This would integrate with your duty roster system
        const mockDuties = {
            '6301': 'D123',
            '5423': 'D087',
            '638': 'D045'
        };
        return mockDuties[fleetNumber] || 'Duty TBC';
    };

    const getLastInspectionDate = async (fleetNumber) => {
        // This would integrate with your maintenance system
        return '2025-01-15'; // Mock data
    };

    // Fallback vehicle creation for unknown fleet numbers
    const createFallbackVehicle = async (fleetNumber) => {
        try {
            const estimatedDepot = estimateDepotFromFleetNumber(fleetNumber);
            const estimatedType = estimateVehicleType(fleetNumber);
            
            // Only create fallback if we can reasonably estimate the depot
            if (estimatedDepot === 'Unknown' || estimatedDepot === 'Non-operational') {
                return null; // Don't create fallback for clearly invalid fleet numbers
            }
            
            const fallbackVehicle = {
                fleetNumber: fleetNumber,
                registration: 'TBC', // To Be Confirmed
                depot: estimatedDepot,
                busType: estimatedType.type,
                vehicleType: estimatedType.fullType,
                capacity: estimatedType.capacity,
                yearOfManufacture: estimatedType.estimatedYear,
                age: estimatedType.estimatedYear ? new Date().getFullYear() - estimatedType.estimatedYear : null,
                driver: await getDriverInformation(fleetNumber),
                route: await getCurrentRoute(fleetNumber),
                dutyNumber: await getDutyNumber(fleetNumber),
                lastInspection: await getLastInspectionDate(fleetNumber),
                isFallback: true // Flag to indicate this is estimated data
            };
            
            return fallbackVehicle;
        } catch (error) {
            console.error('Error creating fallback vehicle:', error);
            return null;
        }
    };

    // Estimate vehicle type based on fleet number patterns
    const estimateVehicleType = (fleetNumber) => {
        const num = parseInt(fleetNumber);
        
        // Estimate based on GNE fleet numbering patterns
        if (num >= 600 && num <= 699) {
            return {
                type: 'Solo',
                fullType: 'Optare Solo',
                capacity: 30,
                estimatedYear: 2012 + (num - 600) / 10 // Rough estimation
            };
        }
        
        if (num >= 5000 && num <= 5999) {
            return {
                type: 'Streetlite',
                fullType: 'Wright Streetlite',
                capacity: 43,
                estimatedYear: 2014 + Math.floor((num - 5000) / 100) // Rough estimation
            };
        }
        
        if (num >= 6000 && num <= 6999) {
            return {
                type: 'Streetdeck',
                fullType: 'Wright Streetdeck',
                capacity: 84,
                estimatedYear: 2017 + Math.floor((num - 6000) / 200) // Rough estimation
            };
        }
        
        if (num >= 7000 && num <= 7999) {
            return {
                type: 'Streetdeck EV',
                fullType: 'Wright Streetdeck Electric',
                capacity: 84,
                estimatedYear: 2024
            };
        }
        
        if (num >= 8000 && num <= 8999) {
            return {
                type: 'Electric Bus',
                fullType: 'Electric Double Deck',
                capacity: 84,
                estimatedYear: 2024
            };
        }
        
        if (num >= 9000 && num <= 9999) {
            return {
                type: 'Hydrogen Bus',
                fullType: 'Wright Streetdeck Hydrogen',
                capacity: 84,
                estimatedYear: 2025
            };
        }
        
        // Default fallback
        return {
            type: 'Unknown',
            fullType: 'Unknown Vehicle Type',
            capacity: null,
            estimatedYear: null
        };
    };

    // Enhanced depot estimation function based on REAL GNE fleet data
    const estimateDepotFromFleetNumber = (fleetNumber) => {
        const num = parseInt(fleetNumber);
        
        // Based on actual fleet database patterns
        
        // Solo vehicles and early ranges - mostly Reserve Fleet
        if (num >= 600 && num <= 699) return 'Go North East Reserve Fleet';
        
        // 700s range - Hexham and Gateshead Riverside
        if (num >= 702 && num <= 703) return 'Hexham';
        if (num >= 704 && num <= 749) return 'Hexham'; // Estimate for unknowns
        if (num >= 750 && num <= 799) return 'Gateshead Riverside'; // Estimate
        
        // 3000s range - Percy Main (older double decks)
        if (num >= 3900 && num <= 3999) return 'Percy Main';
        
        // 4000s range - Washington
        if (num >= 4900 && num <= 4999) return 'Washington';
        
        // 5000s range - mixed depots based on actual data
        if (num >= 5200 && num <= 5299) {
            // 5210, 5243-5244 are Gateshead Riverside
            // 5298-5299 are Deptford
            if (num >= 5210 && num <= 5250) return 'Gateshead Riverside';
            if (num >= 5290 && num <= 5299) return 'Deptford';
            return 'Gateshead Riverside'; // Default for this range
        }
        
        if (num >= 5300 && num <= 5399) {
            // 5376-5380 are Gateshead Riverside
            if (num >= 5370 && num <= 5390) return 'Gateshead Riverside';
            return 'Unknown'; // Most of this range seems inactive
        }
        
        if (num >= 5400 && num <= 5499) {
            // 5409-5410 are Deptford
            // 5440-5441, 5466-5467 are Consett
            if (num >= 5409 && num <= 5420) return 'Deptford';
            if (num >= 5440 && num <= 5470) return 'Consett';
            return 'Consett'; // Default for this range
        }
        
        if (num >= 5500 && num <= 5599) {
            // 5501-5502 are Washington
            // 5511-5519 are Percy Main
            if (num >= 5501 && num <= 5510) return 'Washington';
            if (num >= 5511 && num <= 5520) return 'Percy Main';
            return 'Percy Main'; // Default for this range
        }
        
        // 5800s range and beyond - estimate based on patterns
        if (num >= 5800 && num <= 5999) return 'Unknown'; // 5804 not found, so unknown range
        
        // 6000s range - mixed depots based on actual data
        if (num >= 6300 && num <= 6399) {
            // 6301-6302, 6308 are Percy Main
            // 6331-6332 are Consett
            // 6352-6353 are Gateshead Riverside
            // 6377-6384 are Consett
            if (num >= 6301 && num <= 6310) return 'Percy Main';
            if (num >= 6330 && num <= 6340) return 'Consett';
            if (num >= 6350 && num <= 6360) return 'Gateshead Riverside';
            if (num >= 6370 && num <= 6390) return 'Consett';
            return 'Percy Main'; // Default for this range
        }
        
        // 6900s range - Coach vehicles
        if (num >= 6901 && num <= 6999) return 'Go North East Coach';
        
        // 7000s range - Coach vehicles
        if (num >= 7100 && num <= 7199) return 'Go North East Coach';
        
        // 8000s range - mostly Deptford based on actual data
        if (num >= 8200 && num <= 8399) {
            // 8294-8329 are Deptford
            // 8339 is Consett
            if (num >= 8330 && num <= 8350) return 'Consett';
            return 'Deptford';
        }
        
        // 9000s range - Percy Main (articulated)
        if (num >= 9000 && num <= 9099) return 'Percy Main';
        
        // Default for unrecognized ranges
        return 'Unknown';
    };

    // Helper functions
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

    // Handle suggestion click
    const handleSuggestionClick = (fleetNumber) => {
        setFleetInput(fleetNumber);
        handleFleetLookup(fleetNumber);
        setSuggestions([]);
    };

    // Confirm selection and start wizard
    const handleStartWizard = () => {
        if (selectedVehicle) {
            // Pass comprehensive vehicle information to the wizard
            onVehicleSelected({
                fleetNumber: selectedVehicle.fleetNumber,
                registration: selectedVehicle.registration,
                depot: selectedVehicle.depot,
                vehicleType: selectedVehicle.busType,
                vehicleTypeCategory: selectedVehicle.busType?.split(' ').slice(0, 2).join(' ') || 'Bus',
                capacity: selectedVehicle.capacity,
                yearOfManufacture: selectedVehicle.yearOfManufacture,
                age: selectedVehicle.age,
                driver: selectedVehicle.driver,
                route: selectedVehicle.route,
                dutyNumber: selectedVehicle.dutyNumber,
                lastInspection: selectedVehicle.lastInspection,
                fullDetails: selectedVehicle
            });
            handleClose();
        }
    };

    // Close and reset modal
    const handleClose = () => {
        setFleetInput('');
        setSelectedVehicle(null);
        setError('');
        setSuggestions([]);
        onClose();
    };

    // Get depot color based on real GNE depot names
    const getDepotColor = (depot) => {
        const colors = {
            'Deptford': 'bg-blue-500',
            'Percy Main': 'bg-green-500', 
            'Consett': 'bg-purple-500',
            'Washington': 'bg-red-500',
            'Gateshead Riverside': 'bg-yellow-500',
            'Hexham': 'bg-indigo-500',
            'Go North East Reserve Fleet': 'bg-gray-500',
            'Go North East Coach': 'bg-orange-500',
            'Saltmeadows Road Stores': 'bg-pink-500'
        };
        return colors[depot] || 'bg-gray-500';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                🚌 Vehicle Selection
                            </h2>
                            <p className="text-blue-100">
                                Enter fleet number to start {wizardType?.replace('_', ' ')} assessment
                            </p>
                        </div>
                        <button 
                            onClick={handleClose}
                            className="text-white/80 hover:text-white text-3xl font-light transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {/* Fleet Number Input */}
                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-800 mb-4">
                            Fleet Number
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={fleetInput}
                                onChange={(e) => handleFleetInput(e.target.value)}
                                placeholder="e.g. 6301, 5423, 638..."
                                className="w-full px-6 py-4 text-2xl font-bold text-center rounded-2xl shadow-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all bg-white"
                                autoFocus
                            />
                            {loading && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map(fleet => (
                                        <button
                                            key={fleet}
                                            onClick={() => handleSuggestionClick(fleet)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {fleet}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Vehicle Information Display */}
                    {selectedVehicle && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                {selectedVehicle.isFallback ? '🔍 Vehicle Information (Estimated)' : '✅ Vehicle Information Confirmed'}
                            </h3>
                            
                            {/* Fallback Warning */}
                            {selectedVehicle.isFallback && (
                                <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-amber-500 text-xl">⚠️</div>
                                        <div>
                                            <h5 className="font-bold text-amber-800 mb-1">Estimated Information</h5>
                                            <p className="text-amber-700 text-sm">
                                                This vehicle was not found in the main database. Information shown is estimated based on fleet numbering patterns.
                                                Please verify details with driver or engineering if critical decisions depend on this data.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Main Vehicle Card */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-6 transform hover:scale-[1.02] transition-transform">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-green-500 px-6 py-3 rounded-full animate-pulse">
                                            <span className="text-2xl font-bold">Fleet {selectedVehicle.fleetNumber}</span>
                                        </div>
                                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                                            <span className="text-lg font-semibold">
                                                {selectedVehicle.registration === 'TBC' ? (
                                                    <span className="text-yellow-200">REG TBC</span>
                                                ) : (
                                                    selectedVehicle.registration
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`px-6 py-3 rounded-full text-white font-bold ${getDepotColor(selectedVehicle.depot)}`}>
                                        📍 {selectedVehicle.depot} Depot
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🚌</div>
                                        <div className="text-sm opacity-80">Vehicle Type</div>
                                        <div className="text-lg font-bold">{selectedVehicle.busType}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">👥</div>
                                        <div className="text-sm opacity-80">Capacity</div>
                                        <div className="text-lg font-bold">{selectedVehicle.capacity} pax</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">📅</div>
                                        <div className="text-sm opacity-80">Age</div>
                                        <div className="text-lg font-bold">{selectedVehicle.age} years</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🏭</div>
                                        <div className="text-sm opacity-80">Year</div>
                                        <div className="text-lg font-bold">{selectedVehicle.yearOfManufacture}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Driver and Service Information */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Driver Information - HIGHLIGHTED */}
                                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6">
                                    <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                                        👨‍💼 Current Driver & Service Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-green-700 font-medium">Driver:</span>
                                            <span className="text-green-900 font-bold text-lg">{selectedVehicle.driver}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-green-700 font-medium">Duty Number:</span>
                                            <span className="text-green-800 font-semibold">{selectedVehicle.dutyNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-green-700 font-medium">Current Route:</span>
                                            <span className="bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                                                Route {selectedVehicle.route}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Technical Specifications - HIGHLIGHTED */}
                                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
                                    <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                                        🔧 Technical & Depot Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-blue-700 font-medium">Vehicle Type:</span>
                                            <span className="text-blue-900 font-bold">{selectedVehicle.busType}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-blue-700 font-medium">Home Depot:</span>
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">
                                                {selectedVehicle.depot}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white rounded-lg p-3">
                                            <span className="text-blue-700 font-medium">Last Inspection:</span>
                                            <span className="text-blue-800 font-semibold">{selectedVehicle.lastInspection}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Notice */}
                            <div className="mt-6 bg-amber-50 border-2 border-amber-400 rounded-lg p-6">
                                <div className="flex items-start space-x-3">
                                    <div className="text-amber-500 text-2xl">⚠️</div>
                                    <div>
                                        <h5 className="font-bold text-amber-800 mb-2">Breakdown Assessment Notice</h5>
                                        <p className="text-amber-700">
                                            This <strong>{wizardType?.replace('_', ' ')}</strong> assessment will be logged against:
                                        </p>
                                        <div className="mt-3 bg-white rounded p-3">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><strong>Fleet:</strong> {selectedVehicle.fleetNumber}</div>
                                                <div><strong>Driver:</strong> {selectedVehicle.driver}</div>
                                                <div><strong>Depot:</strong> {selectedVehicle.depot}</div>
                                                <div><strong>Route:</strong> {selectedVehicle.route}</div>
                                            </div>
                                        </div>
                                        <p className="text-amber-600 text-sm mt-2">
                                            Ensure you have permission to proceed with this assessment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-t">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartWizard}
                        disabled={!selectedVehicle}
                        className={`px-8 py-3 rounded-xl font-bold transition-all transform ${
                            selectedVehicle 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {selectedVehicle ? `Start ${wizardType?.replace('_', ' ')} Assessment` : 'Enter Fleet Number Above'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Make component globally available
window.EnhancedFleetSelectionModal = EnhancedFleetSelectionModal;