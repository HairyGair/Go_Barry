// Vehicle Location Map Insert Component
// Shows single vehicle location for breakdown assessment

import React, { useEffect, useRef, useState } from 'react';
import * as Icons from '../common/icons.jsx';

const VehicleLocationMap = ({ 
  vehicleInfo, 
  location, 
  onLocationUpdate,
  className = '' 
}) => {
  const { MapPin, Navigation, AlertCircle } = Icons;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [geocodedLocation, setGeocodedLocation] = useState(null);

  // the operator depot locations - VERIFIED from OpenStreetMap (December 2025)
  const depots = {
    'Washington': { lat: 54.9068, lng: -1.5140 },
    'Riverside': { lat: 54.9586, lng: -1.6579 },
    'Percy Main': { lat: 55.0041, lng: -1.4774 },
    'Consett': { lat: 54.8403, lng: -1.8380 },
    'Deptford': { lat: 54.9142, lng: -1.3976 },
    'Hexham': { lat: 54.9756, lng: -2.0960 },
    'Chester-le-Street': { lat: 54.8543, lng: -1.5740 },
    'Stanley': { lat: 54.8677, lng: -1.6980 },
    'Gateshead Riverside': { lat: 54.9586, lng: -1.6579 }
  };

  // Initialize map with OpenStreetMap/Leaflet (free alternative)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Use Leaflet for free maps
      if (window.L) {
        initializeLeafletMap();
      } else {
        // Load Leaflet if not available
        loadLeaflet();
      }
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Unable to load map');
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => console.log('Location access denied:', error)
      );
    }
  }, []);

  // Load Leaflet library
  const loadLeaflet = () => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      initializeLeafletMap();
    };
    
    script.onerror = () => {
      setMapError('Failed to load mapping library');
    };
    
    document.body.appendChild(script);
  };

  // Initialize Leaflet map
  const initializeLeafletMap = () => {
    if (!mapContainerRef.current || !window.L) return;

    try {
      // Create map centered on Newcastle
      mapRef.current = window.L.map(mapContainerRef.current, {
        center: [54.9783, -1.6178],
        zoom: 11,
        zoomControl: true
      });

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(mapRef.current);

      setMapLoaded(true);

      // Add depot markers
      Object.entries(depots).forEach(([name, coords]) => {
        const depotIcon = window.L.divIcon({
          html: `<div style="
            background: #28a745;
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">D</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = window.L.marker([coords.lat, coords.lng], { 
          icon: depotIcon,
          title: `${name} Depot` 
        }).addTo(mapRef.current);

        marker.bindPopup(`<strong>${name} Depot</strong><br>the operator`);
      });

      // Geocode location if provided
      if (location) {
        geocodeLocation(location);
      }
    } catch (error) {
      console.error('Leaflet initialization error:', error);
      setMapError('Map initialization failed');
    }
  };

  // Geocode location string to coordinates
  const geocodeLocation = async (locationString) => {
    if (!locationString || !mapRef.current) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString + ', Newcastle, UK')}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          setGeocodedLocation(coords);
          addVehicleMarker(coords);
          
          // Update location with geocoded address
          if (onLocationUpdate && data[0].display_name) {
            onLocationUpdate(data[0].display_name);
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Add vehicle marker to map
  const addVehicleMarker = (coords) => {
    if (!mapRef.current || !window.L) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create custom vehicle icon
    const vehicleIcon = window.L.divIcon({
      html: `<div style="
        background: #dc3545;
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        box-shadow: 0 3px 6px rgba(0,0,0,0.5);
        animation: pulse 2s infinite;
      ">${vehicleInfo?.fleetNo || 'V'}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Add marker
    markerRef.current = window.L.marker([coords.lat, coords.lng], {
      icon: vehicleIcon,
      title: `Vehicle ${vehicleInfo?.fleetNo || 'Unknown'}`
    }).addTo(mapRef.current);

    // Add popup
    const popupContent = `
      <div style="min-width: 200px;">
        <strong>Vehicle ${vehicleInfo?.fleetNo || 'Unknown'}</strong><br>
        ${vehicleInfo?.regNo ? `Reg: ${vehicleInfo.regNo}<br>` : ''}
        ${vehicleInfo?.vehicleType ? `Type: ${vehicleInfo.vehicleType}<br>` : ''}
        <hr style="margin: 5px 0;">
        <strong>Location:</strong><br>
        ${location || 'Location being determined...'}
      </div>
    `;
    markerRef.current.bindPopup(popupContent).openPopup();

    // Center map on vehicle
    mapRef.current.setView([coords.lat, coords.lng], 15);
  };

  // Handle location input change
  useEffect(() => {
    if (location && location.length > 3) {
      // Debounce geocoding
      const timer = setTimeout(() => {
        geocodeLocation(location);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Center on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current && window.L) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      
      // Add user location marker
      const userIcon = window.L.divIcon({
        html: `<div style="
          background: #4285F4;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      window.L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        title: 'Your Location'
      }).addTo(mapRef.current).bindPopup('Your Location');
    }
  };

  // Handle clicking on map to update location
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const handleMapClick = (e) => {
      const coords = e.latlng;
      addVehicleMarker(coords);
      
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name && onLocationUpdate) {
            onLocationUpdate(data.display_name);
          }
        })
        .catch(err => console.error('Reverse geocoding error:', err));
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      mapRef.current.off('click', handleMapClick);
    };
  }, [mapLoaded, onLocationUpdate]);

  // Render fallback if map fails to load
  if (mapError) {
    return (
      <div className={`map-insert-fallback ${className}`}>
        <div className="bg-red-900/20 backdrop-blur-sm rounded-lg p-4 border border-red-600/30">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{mapError}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Continue with manual location entry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`vehicle-location-map ${className}`}>
      <div className="map-header mb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Vehicle Location
          </h3>
          {userLocation && (
            <button
              onClick={centerOnUserLocation}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              title="Center on my location"
            >
              <Navigation className="w-3 h-3" />
              My Location
            </button>
          )}
        </div>
      </div>
      
      <div className="map-container relative">
        <div 
          ref={mapContainerRef}
          className="map-canvas rounded-lg overflow-hidden border border-gray-600"
          style={{ height: '300px', width: '100%' }}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="map-instructions mt-2">
          <p className="text-xs text-gray-400">
            Click on the map to update vehicle location, or type the address above
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 3px 6px rgba(220, 53, 69, 0.5);
          }
          50% {
            box-shadow: 0 3px 12px rgba(220, 53, 69, 0.8);
          }
          100% {
            box-shadow: 0 3px 6px rgba(220, 53, 69, 0.5);
          }
        }

        .map-container :global(.leaflet-control-attribution) {
          background: rgba(0, 0, 0, 0.7);
          color: #888;
          font-size: 10px;
        }

        .map-container :global(.leaflet-popup-content-wrapper) {
          background: rgba(30, 30, 30, 0.95);
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }

        .map-container :global(.leaflet-popup-tip) {
          background: rgba(30, 30, 30, 0.95);
        }

        .map-container :global(.leaflet-control-zoom) {
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .map-container :global(.leaflet-control-zoom a) {
          background: rgba(40, 40, 40, 0.9);
          color: white;
          border: none;
        }

        .map-container :global(.leaflet-control-zoom a:hover) {
          background: rgba(60, 60, 60, 0.9);
        }
      `}</style>
    </div>
  );
};

export default VehicleLocationMap;
