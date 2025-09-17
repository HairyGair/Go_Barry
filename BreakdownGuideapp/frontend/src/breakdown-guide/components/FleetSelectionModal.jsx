// Fleet Selection Modal - Enhanced Version with Location Capture
import React, { useState, useEffect } from 'react';
import * as Icons from './common/icons.jsx';

const FleetSelectionModal = ({ isOpen, onClose, onSelectVehicle, wizardType }) => {
    const { Search, MapPin, Building, CheckCircle, XCircle, AlertCircle } = Icons;
    
    const [currentStep, setCurrentStep] = useState('fleet');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [ticketerCoords, setTicketerCoords] = useState('');
    const [error, setError] = useState('');
    const [showTicketerModal, setShowTicketerModal] = useState(false);
    
    // Fleet database
    const [fleetData, setFleetData] = useState(null);
    const [fleetLoading, setFleetLoading] = useState(true);
    
    // Depot locations with colors and icons
    const depotLocations = {
        'Consett': { 
            lat: 54.8543, lng: -1.8321, 
            color: '#10b981', icon: '🏢',
            address: 'Consett Bus Station, Front Street, Consett DH8 5AU'
        },
        'Deptford': { 
            lat: 54.8903, lng: -1.3842, 
            color: '#3b82f6', icon: '🏭',
            address: 'Deptford Depot, St Marks Road, Sunderland SR4 7BW'
        },
        'Gateshead': { 
            lat: 54.9593, lng: -1.6030, 
            color: '#8b5cf6', icon: '🚉',
            address: 'Gateshead Interchange, West Street, Gateshead NE8 1BH'
        },
        'Percy Main': { 
            lat: 55.0179, lng: -1.4463, 
            color: '#ec4899', icon: '⚓',
            address: 'Percy Main Depot, Norham Road, North Shields NE29 8SD'
        },
        'Washington': { 
            lat: 54.9003, lng: -1.5197, 
            color: '#f59e0b', icon: '🏗️',
            address: 'Washington Depot, Parsons Road, Washington NE37 1EZ'
        },
        'Hexham': { 
            lat: 54.9739, lng: -2.1014, 
            color: '#14b8a6', icon: '🏰',
            address: 'Hexham Bus Station, Loosing Hill, Hexham NE46 1BU'
        },
        'Riverside': { 
            lat: 54.9666, lng: -1.5875, 
            color: '#ef4444', icon: '🌊',
            address: 'Riverside Depot, Pottery Lane, Newcastle NE4 6SL'
        }
    };
    
    // Load fleet database
    useEffect(() => {
        const loadFleetDatabase = async () => {
            try {
                const response = await fetch('/gne-fleet-database.json');
                if (!response.ok) {
                    throw new Error('Failed to load fleet database');
                }
                const data = await response.json();
                setFleetData(data);
            } catch (err) {
                console.error('Failed to load fleet database:', err);
                // Use fallback mock data if needed
                setFleetData({
                    fleet: [
                        { fleetNumber: '6301', regNo: 'NK68FVG', depot: 'Washington', vehicleType: 'Wrightbus Streetlite' },
                        { fleetNumber: '6308', regNo: 'NK68FVP', depot: 'Deptford', vehicleType: 'Wrightbus Streetlite' }
                    ]
                });
            } finally {
                setFleetLoading(false);
            }
        };
        
        if (isOpen) {
            loadFleetDatabase();
        }
    }, [isOpen]);
    
    // Reset modal when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep('fleet');
            setSelectedVehicle(null);
            setSelectedLocation(null);
            setSearchQuery('');
            setTicketerCoords('');
            setError('');
        }
    }, [isOpen]);
    
    // Search fleet
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        
        const searchTimeout = setTimeout(() => {
            if (!fleetData || !fleetData.fleet) return;
            
            const query = searchQuery.toLowerCase().replace(/\s+/g, '');
            const results = fleetData.fleet.filter(vehicle => {
                const fleetNum = vehicle.fleetNumber.toLowerCase();
                const regNo = vehicle.regNo.toLowerCase().replace(/\s+/g, '');
                const depot = (vehicle.depot || '').toLowerCase();
                
                return fleetNum.includes(query) || 
                       regNo.includes(query) ||
                       depot.includes(query);
            }).slice(0, 10);
            
            setSearchResults(results);
        }, 300);
        
        return () => clearTimeout(searchTimeout);
    }, [searchQuery, fleetData]);
    
    // Get simplified vehicle type
    const getSimplifiedVehicleType = (vehicleType) => {
        if (!vehicleType) return 'Unknown';
        if (vehicleType.toLowerCase().includes('streetdeck')) return 'StreetDeck';
        if (vehicleType.toLowerCase().includes('streetlite')) return 'Streetlite';
        if (vehicleType.toLowerCase().includes('enviro')) return 'Enviro';
        if (vehicleType.toLowerCase().includes('versa')) return 'Versa';
        return vehicleType.split(' ')[0] || 'Unknown';
    };
    
    // Handle vehicle selection
    const handleVehicleSelect = (vehicle) => {
        setSelectedVehicle(vehicle);
        setCurrentStep('location');
    };
    
    // Handle location methods
    const handleTicketerClick = () => {
        setShowTicketerModal(true);
    };
    
    const handleTicketerSubmit = async () => {
        let lat, lng;
        
        // First try to match the format: LAT:XX LONG:YY
        const formatRegex = /LAT[:\s]*([-\d.]+)[,\s]+LONG[:\s]*([-\d.]+)/i;
        const formatMatch = ticketerCoords.match(formatRegex);
        
        if (formatMatch) {
            lat = parseFloat(formatMatch[1]);
            lng = parseFloat(formatMatch[2]);
        } else {
            // Try to match simple comma-separated format: lat, lng
            const simpleRegex = /^\s*([-\d.]+)\s*,\s*([-\d.]+)\s*$/;
            const simpleMatch = ticketerCoords.match(simpleRegex);
            
            if (simpleMatch) {
                lat = parseFloat(simpleMatch[1]);
                lng = parseFloat(simpleMatch[2]);
            }
        }
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            setSelectedLocation({
                type: 'ticketer',
                lat,
                lng,
                description: `Ticketer Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
            });
            
            // Complete the selection
            onSelectVehicle({
                ...selectedVehicle,
                location: {
                    type: 'ticketer',
                    lat,
                    lng,
                    coordinates: ticketerCoords
                }
            });
            
            setShowTicketerModal(false);
            onClose();
        } else {
            alert('Invalid coordinates format.\n\nAccepted formats:\n• 54.969564, -1.609568\n• LAT:54.939770 LONG:-1.533906');
        }
    };
    
    const handleDepotSelect = (depotName) => {
        const depot = depotLocations[depotName];
        
        setSelectedLocation({
            type: 'depot',
            name: depotName,
            ...depot
        });
        
        onSelectVehicle({
            ...selectedVehicle,
            location: {
                type: 'depot',
                name: depotName,
                ...depot
            }
        });
        
        onClose();
    };
    
    const handleSkipLocation = () => {
        onSelectVehicle({
            ...selectedVehicle,
            location: {
                type: 'skip',
                description: 'Location to be added later'
            }
        });
        
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-white">
                            {currentStep === 'fleet' ? 'Select Vehicle' : 
                             currentStep === 'location' ? 'Vehicle Location' :
                             currentStep === 'depot' ? 'Select Depot' : 'Select Vehicle'}
                        </h2>
                        
                        <p className="text-blue-100 mt-2">
                            {wizardType ? `${wizardType.replace(/-/g, ' ').toUpperCase()} Assessment` : 'Breakdown Assessment'}
                        </p>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {/* Fleet Selection Step */}
                        {currentStep === 'fleet' && (
                            <>
                                {/* Search Box */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by fleet number, registration, or depot..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                                        autoFocus
                                    />
                                </div>
                                
                                {/* Loading State */}
                                {fleetLoading && (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="w-8 h-8 animate-spin mx-auto mb-2 rounded-full border-2 border-gray-600 border-t-white"></div>
                                        Loading fleet database...
                                    </div>
                                )}
                                
                                {/* Results */}
                                {!fleetLoading && searchQuery.length >= 2 && (
                                    <div className="space-y-3">
                                        {searchResults.length > 0 ? (
                                            <>
                                                <p className="text-sm text-gray-400 mb-2">
                                                    Search Results ({searchResults.length})
                                                </p>
                                                {searchResults.map((vehicle) => (
                                                    <button
                                                        key={vehicle.fleetNumber}
                                                        onClick={() => handleVehicleSelect(vehicle)}
                                                        className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 text-left group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-semibold text-white text-lg">
                                                                    {vehicle.fleetNumber}
                                                                </div>
                                                                <div className="text-sm text-gray-400">
                                                                    {vehicle.regNo} • {vehicle.depot}
                                                                </div>
                                                                <div className="text-sm text-gray-500 mt-1">
                                                                    {getSimplifiedVehicleType(vehicle.vehicleType)}
                                                                </div>
                                                            </div>
                                                            <div className="text-gray-400 group-hover:text-white transition-colors">
                                                                →
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No vehicles found for "{searchQuery}"</p>
                                                <p className="text-sm mt-2">Try searching by fleet number or registration</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Quick Select */}
                                {searchQuery.length < 2 && !fleetLoading && (
                                    <div className="text-center text-gray-400 py-8">
                                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Enter at least 2 characters to search</p>
                                        <p className="text-sm mt-2">Search by fleet number (e.g. "6301") or registration (e.g. "NK68")</p>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Location Selection Step */}
                        {currentStep === 'location' && selectedVehicle && (
                            <div className="space-y-4">
                                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                                    <div className="font-semibold text-white">Selected Vehicle</div>
                                    <div className="text-gray-300 mt-1">
                                        {selectedVehicle.fleetNumber} - {selectedVehicle.regNo}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {selectedVehicle.depot} • {getSimplifiedVehicleType(selectedVehicle.vehicleType)}
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-white mb-4">Where is the vehicle?</h3>
                                
                                {/* Location Options */}
                                <div className="space-y-3">
                                    {/* Ticketer Coordinates */}
                                    <button
                                        onClick={handleTicketerClick}
                                        className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 text-left flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">
                                            📍
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-white group-hover:text-green-400 transition-colors">
                                                Ticketer Coordinates
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Paste LAT/LONG from ticketer machine
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Depot Location */}
                                    <button
                                        onClick={() => setCurrentStep('depot')}
                                        className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 text-left flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">
                                            🏢
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                At a Depot
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Vehicle is at a depot location
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Skip Location */}
                                    <button
                                        onClick={handleSkipLocation}
                                        className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 text-left flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center text-2xl opacity-60">
                                            ✏️
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-white opacity-80 group-hover:opacity-100 transition-opacity">
                                                Skip Location
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Add location details later
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Depot Selection Step */}
                        {currentStep === 'depot' && (
                            <>
                                <h3 className="text-lg font-semibold text-white mb-6">Select Depot Location</h3>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(depotLocations).map(([name, depot]) => (
                                        <button
                                            key={name}
                                            onClick={() => handleDepotSelect(name)}
                                            className="p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${depot.color}22, ${depot.color}11)`,
                                                borderColor: `${depot.color}44`
                                            }}
                                        >
                                            <div className="text-3xl mb-2">{depot.icon}</div>
                                            <div className="font-semibold text-white">{name}</div>
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentStep('location')}
                                    className="mt-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    ← Back
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Ticketer Modal */}
            {showTicketerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Paste Ticketer Coordinates</h3>
                        
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                            <div className="text-green-400 text-sm space-y-1">
                                <div>Accepted formats:</div>
                                <code className="block ml-2">• 54.969564, -1.609568</code>
                                <code className="block ml-2">• LAT:54.939770 LONG:-1.533906</code>
                            </div>
                        </div>
                        
                        <textarea
                            value={ticketerCoords}
                            onChange={(e) => setTicketerCoords(e.target.value)}
                            placeholder="Paste coordinates here..."
                            className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors font-mono text-sm"
                        />
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowTicketerModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTicketerSubmit}
                                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
                            >
                                Use Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FleetSelectionModal;
