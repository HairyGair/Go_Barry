// Location Input Component for Breakdown Wizards
// Provides location selection for better breakdown tracking

const LocationInput = ({ value, onChange, label = "Current Location" }) => {
    const { MapPin, Navigation } = window.Icons;
    
    const commonLocations = [
        { value: 'newcastle_central', label: '🚌 Newcastle Central Station', category: 'Major Stops' },
        { value: 'gateshead_interchange', label: '🚌 Gateshead Interchange', category: 'Major Stops' },
        { value: 'metro_centre', label: '🛍️ Metro Centre', category: 'Major Stops' },
        { value: 'eldon_square', label: '🏬 Eldon Square', category: 'Major Stops' },
        { value: 'haymarket', label: '🚌 Haymarket Bus Station', category: 'Major Stops' },
        { value: 'sunderland_interchange', label: '🚌 Sunderland Interchange', category: 'Major Stops' },
        { value: 'durham_bus_station', label: '🚌 Durham Bus Station', category: 'Major Stops' },
        
        { value: 'a1_northbound', label: '🛣️ A1 Northbound', category: 'Major Routes' },
        { value: 'a1_southbound', label: '🛣️ A1 Southbound', category: 'Major Routes' },
        { value: 'a19_northbound', label: '🛣️ A19 Northbound', category: 'Major Routes' },
        { value: 'a19_southbound', label: '🛣️ A19 Southbound', category: 'Major Routes' },
        { value: 'a167_great_north_road', label: '🛣️ A167 Great North Road', category: 'Major Routes' },
        { value: 'a184_felling_bypass', label: '🛣️ A184 Felling Bypass', category: 'Major Routes' },
        { value: 'a690_durham_road', label: '🛣️ A690 Durham Road', category: 'Major Routes' },
        
        { value: 'gateshead_depot', label: '🏢 Gateshead Depot', category: 'Depots' },
        { value: 'percy_main_depot', label: '🏢 Percy Main Depot', category: 'Depots' },
        { value: 'washington_depot', label: '🏢 Washington Depot', category: 'Depots' },
        { value: 'consett_depot', label: '🏢 Consett Depot', category: 'Depots' },
        { value: 'hexham_depot', label: '🏢 Hexham Depot', category: 'Depots' },
        
        { value: 'team_valley', label: '🏭 Team Valley Trading Estate', category: 'Areas' },
        { value: 'newcastle_city_centre', label: '🏙️ Newcastle City Centre', category: 'Areas' },
        { value: 'gateshead_town_centre', label: '🏪 Gateshead Town Centre', category: 'Areas' },
        { value: 'washington_galleries', label: '🛍️ Washington Galleries', category: 'Areas' },
        { value: 'cramlington', label: '🏘️ Cramlington', category: 'Areas' },
        { value: 'blyth', label: '⚓ Blyth', category: 'Areas' },
        { value: 'ashington', label: '🏘️ Ashington', category: 'Areas' },
        { value: 'stanley', label: '🏘️ Stanley', category: 'Areas' },
        { value: 'chester_le_street', label: '🏘️ Chester-le-Street', category: 'Areas' }
    ];
    
    const categories = [...new Set(commonLocations.map(loc => loc.category))];
    
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {label}
                </label>
                
                {/* Quick Location Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const location = `📍 GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                                        onChange(location);
                                    },
                                    () => {
                                        onChange('📍 GPS location unavailable');
                                    }
                                );
                            } else {
                                onChange('📍 GPS not supported');
                            }
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-200 hover:bg-blue-600/30 transition-colors text-sm"
                    >
                        <Navigation className="w-4 h-4 mr-2" />
                        Use Current GPS
                    </button>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Or type custom location..."
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none text-sm"
                    />
                </div>
                
                {/* Common Locations Dropdown */}
                <div className="space-y-2">
                    <select
                        value={value || ''}
                        onChange={(e) => {
                            const selected = commonLocations.find(loc => loc.value === e.target.value);
                            if (selected) {
                                onChange(selected.label);
                            }
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none text-sm"
                    >
                        <option value="" className="bg-gray-800">Select from common locations...</option>
                        {categories.map(category => (
                            <optgroup key={category} label={category} className="bg-gray-800">
                                {commonLocations
                                    .filter(loc => loc.category === category)
                                    .map(location => (
                                        <option 
                                            key={location.value} 
                                            value={location.value}
                                            className="bg-gray-800"
                                        >
                                            {location.label}
                                        </option>
                                    ))
                                }
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Current Selection Display */}
            {value && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-white">
                            <MapPin className="w-4 h-4 mr-2 text-green-400" />
                            <span className="font-medium">Selected Location:</span>
                            <span className="ml-2 text-green-200">{value}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Export to global scope
window.LocationInput = LocationInput;