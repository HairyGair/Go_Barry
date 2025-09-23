// Enhanced Location Display Component with Interactive Map - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import * as Icons from './icons.jsx';

const LocationDisplay = ({ vehicle, location }) => {
    const { MapPin, Building } = Icons;
    const [mapError, setMapError] = useState(false);
    const [address, setAddress] = useState('');
    
    console.log('LocationDisplay component rendered');
    console.log('Vehicle:', vehicle);
    console.log('Location:', location);
    
    // Always show something for debugging
    if (!vehicle) {
        return (
            <div className="bg-red-800 rounded-lg p-4 mb-6 border border-red-700">
                <p className="text-white">LocationDisplay: No vehicle data provided</p>
            </div>
        );
    }
    
    if (!location) {
        return (
            <div className="bg-yellow-800 rounded-lg p-4 mb-6 border border-yellow-700">
                <p className="text-white">LocationDisplay: No location data provided</p>
                <p className="text-sm text-gray-300 mt-2">Vehicle: {vehicle.fleetNumber} - {vehicle.regNo}</p>
            </div>
        );
    }
    
    // Reverse geocode to get address
    useEffect(() => {
        if (location && location.lat && location.lng && location.type === 'ticketer') {
            // Try to get address from coordinates
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.display_name) {
                        setAddress(data.display_name);
                    }
                })
                .catch(err => {
                    console.error('Geocoding error:', err);
                    setAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
                });
        }
    }, [location]);
    
    // Generate Google Maps URL for the location
    const getMapUrl = () => {
        if (location.lat && location.lng) {
            return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        }
        return null;
    };
    
    // Create an OpenStreetMap embed URL without marker (we'll add our own bus icon)
    const getOSMEmbedUrl = () => {
        if (location.lat && location.lng) {
            // Calculate bounding box for the embed - smaller delta = more zoomed in
            const delta = 0.0015; // Much more zoomed in for street-level detail
            const bbox = `${location.lng - delta},${location.lat - delta},${location.lng + delta},${location.lat + delta}`;
            // Removed the marker parameter to use our custom bus icon
            return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
        }
        return null;
    };
    
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-6 border border-gray-700">
            {/* Debug info */}
            <div className="bg-blue-800 p-2 text-xs text-white">
                <p>DEBUG: LocationDisplay is rendering</p>
                <p>Location type: {location.type}</p>
                {location.lat && <p>Lat: {location.lat}, Lng: {location.lng}</p>}
            </div>
            
            {/* Interactive Map Display - Full Width */}
            {location.lat && location.lng && !mapError && (
                <div className="relative w-full h-64 bg-gray-900">
                    {/* OpenStreetMap Embed (No API Key Required) */}
                    <iframe
                        src={getOSMEmbedUrl()}
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                        loading="lazy"
                        title="Vehicle Location Map"
                        onError={() => setMapError(true)}
                    />
                    
                    {/* Bus Icon Marker - Centered on map */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative transform -translate-y-8">
                            {/* Shadow */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black/20 rounded-full blur-md" />
                            {/* Bus Marker - Using emoji as fallback */}
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                                🚌
                            </div>
                        </div>
                    </div>
                    
                    {/* Location Overlay - Top Right */}
                    <div className="absolute top-3 right-3 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-red-400" />
                            <div className="text-white">
                                <div className="font-semibold">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Map Controls - Bottom Right */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <a
                            href={getMapUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg transition-colors inline-flex items-center gap-1"
                        >
                            Open in Google Maps
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                    
                    {/* Zoom controls hint - Bottom Left */}
                    <div className="absolute bottom-3 left-3 bg-gray-900/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-400">
                        Use + / - to zoom
                    </div>
                </div>
            )}
            
            {/* Fallback for map error or no coordinates */}
            {(mapError || !location.lat || !location.lng) && location.type !== 'skip' && (
                <div className="relative w-full h-64 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Map unavailable</p>
                        {location.lat && location.lng && (
                            <p className="text-sm text-gray-500 mt-2">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vehicle</h4>
                        <div className="text-white font-semibold text-lg">
                            {vehicle.fleetNumber} - {vehicle.regNo || 'No Reg'}
                        </div>
                        <div className="text-sm text-gray-400">
                            {vehicle.depot || 'Unknown Depot'} • {vehicle.vehicleType || 'Unknown Type'}
                        </div>
                    </div>
                    
                    {/* Location Info */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                        <div className="flex items-start gap-2">
                            {location.type === 'depot' ? (
                                <Building className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                            ) : (
                                <MapPin className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                {location.type === 'depot' && (
                                    <>
                                        <div className="text-white font-medium">{location.name} Depot</div>
                                        <div className="text-sm text-gray-400">{location.address}</div>
                                    </>
                                )}
                                {location.type === 'ticketer' && (
                                    <>
                                        <div className="text-white font-medium">GPS Location</div>
                                        <div className="text-sm text-gray-400 break-words">
                                            {address || location.address || 'Fetching address...'}
                                        </div>
                                    </>
                                )}
                                {location.type === 'skip' && (
                                    <div className="text-gray-400 italic">Location to be added later</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Assessment Info */}
                {vehicle.assessmentId && (
                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                        Assessment ID: {vehicle.assessmentId}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationDisplay;
