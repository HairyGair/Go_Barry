// Vehicle Location Display Wrapper
// Ensures vehicle info is always shown, with optional map when location is available
import React from 'react';
import LocationDisplay from './LocationDisplay.jsx';
import * as Icons from './icons.jsx';

const VehicleLocationWrapper = ({ vehicle, location, assessmentId }) => {
    const { MapPin, Truck, Building } = Icons;
    
    // Always show vehicle info, even if location is missing
    if (!vehicle) return null;
    
    console.log('VehicleLocationWrapper:', { vehicle, location, assessmentId });
    
    // If we have proper location data, use the full LocationDisplay
    if (location && (location.lat || location.name || location.type === 'skip')) {
        return <LocationDisplay vehicle={{ ...vehicle, assessmentId }} location={location} />;
    }
    
    // Otherwise, show a simplified version with just vehicle info
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-6 border border-gray-700">
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Truck className="w-3 h-3" />
                            Vehicle
                        </h4>
                        <div className="text-white font-semibold text-lg">
                            {vehicle.fleetNumber} - {vehicle.regNo || vehicle.registration}
                        </div>
                        <div className="text-sm text-gray-400">
                            {vehicle.depot} • {vehicle.vehicleType}
                        </div>
                    </div>
                    
                    {/* Location Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            Location
                        </h4>
                        <div className="text-gray-400 italic">
                            Location not captured - add manually if needed
                        </div>
                    </div>
                </div>
                
                {/* Assessment Info */}
                {assessmentId && (
                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                        Assessment ID: {assessmentId}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleLocationWrapper;
