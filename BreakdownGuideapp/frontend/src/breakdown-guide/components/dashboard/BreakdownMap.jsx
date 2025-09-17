import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const BreakdownMap = ({ breakdowns, onBreakdownSelect, selectedBreakdown }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Go North East depot locations
  const depots = [
    { name: 'Washington', lat: 54.9000, lng: -1.5333, color: '#28a745' },
    { name: 'Riverside', lat: 54.9669, lng: -1.6255, color: '#28a745' },
    { name: 'Percy Main', lat: 55.0333, lng: -1.4667, color: '#28a745' },
    { name: 'Consett', lat: 54.8540, lng: -1.8322, color: '#28a745' },
    { name: 'Deptford', lat: 54.8842, lng: -1.3775, color: '#28a745' },
    { name: 'Hexham', lat: 54.9719, lng: -2.1038, color: '#28a745' }
  ];

  // Initialize map
  useEffect(() => {
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps && !mapRef.current) {
      initializeMap();
    } else {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI();
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
        error => console.log('Error getting location:', error)
      );
    }
  }, []);

  // Load Google Maps API
  const loadGoogleMapsAPI = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      initializeMap();
    };
    
    document.head.appendChild(script);
  };

  // Initialize the map
  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const mapOptions = {
      center: { lat: 54.9783, lng: -1.6178 }, // Newcastle city center
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, mapOptions);
    setMapLoaded(true);

    // Add depot markers
    depots.forEach(depot => {
      const marker = new window.google.maps.Marker({
        position: { lat: depot.lat, lng: depot.lng },
        map: mapRef.current,
        title: `${depot.name} Depot`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: depot.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 5px;">${depot.name} Depot</h4>
            <p style="margin: 0; color: #666;">Go North East</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current, marker);
      });
    });
  };

  // Update breakdown markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Clear existing breakdown markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Create info window instance
    const infoWindow = new window.google.maps.InfoWindow();

    // Add breakdown markers
    breakdowns.forEach(breakdown => {
      if (breakdown.location_coords) {
        const severityColors = {
          'STOP': '#dc3545',
          'AMBER': '#ffc107',
          'CONTINUE': '#28a745'
        };

        // Create custom marker
        const marker = new window.google.maps.Marker({
          position: breakdown.location_coords,
          map: mapRef.current,
          title: `Vehicle ${breakdown.fleet_no}`,
          animation: breakdown.severity === 'STOP' ? window.google.maps.Animation.BOUNCE : null,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: severityColors[breakdown.severity] || '#007bff',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 24)
          }
        });

        // Info window content
        const content = `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 10px;">Vehicle ${breakdown.fleet_no}</h4>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${breakdown.location_display || breakdown.location}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${breakdown.minutes_elapsed}m ago</p>
            <p style="margin: 5px 0;"><strong>Route:</strong> ${breakdown.route_id || 'Not specified'}</p>
            <p style="margin: 5px 0;">
              <strong>Decision:</strong> 
              <span style="
                background: ${severityColors[breakdown.severity] || '#666'};
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
              ">
                ${breakdown.severity || 'PENDING'}
              </span>
            </p>
            ${breakdown.diagnosis ? `<p style="margin: 5px 0;"><strong>Issue:</strong> ${breakdown.diagnosis}</p>` : ''}
          </div>
        `;

        marker.addListener('click', () => {
          infoWindow.setContent(content);
          infoWindow.open(mapRef.current, marker);
          onBreakdownSelect(breakdown);
        });

        // Highlight selected breakdown
        if (selectedBreakdown && selectedBreakdown.breakdown_id === breakdown.breakdown_id) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            marker.setAnimation(null);
          }, 2000);
        }

        markersRef.current.push(marker);
      }
    });

    // Auto-fit bounds if there are markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      // Include depots in bounds
      depots.forEach(depot => {
        bounds.extend(new window.google.maps.LatLng(depot.lat, depot.lng));
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [breakdowns, selectedBreakdown, mapLoaded, onBreakdownSelect]);

  // Center on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(13);
      
      // Add user location marker if not exists
      new window.google.maps.Marker({
        position: userLocation,
        map: mapRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });
    }
  };

  // Fallback map display if Google Maps fails to load
  const renderFallbackMap = () => (
    <div className="map-fallback">
      <MapPin className="map-icon" />
      <h3>Map View</h3>
      <div className="breakdown-list">
        {breakdowns.map(breakdown => (
          <div 
            key={breakdown.breakdown_id} 
            className={`breakdown-item ${breakdown.severity?.toLowerCase()}`}
            onClick={() => onBreakdownSelect(breakdown)}
          >
            <div className="breakdown-header">
              <span className="vehicle">Vehicle {breakdown.fleet_no}</span>
              <span className="time">{breakdown.minutes_elapsed}m ago</span>
            </div>
            <div className="breakdown-location">
              📍 {breakdown.location_display || breakdown.location || 'Location unknown'}
            </div>
            {breakdown.severity && (
              <div className="breakdown-severity">
                Decision: <strong>{breakdown.severity}</strong>
              </div>
            )}
          </div>
        ))}
      </div>
      {breakdowns.length === 0 && (
        <p className="no-breakdowns">No active breakdowns to display</p>
      )}
    </div>
  );

  return (
    <div className="breakdown-map-container">
      <div className="map-controls">
        {userLocation && (
          <button 
            className="location-button"
            onClick={centerOnUserLocation}
            title="Center on my location"
          >
            <Navigation />
          </button>
        )}
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-color stop"></span>
            <span>STOP</span>
          </div>
          <div className="legend-item">
            <span className="legend-color amber"></span>
            <span>AMBER</span>
          </div>
          <div className="legend-item">
            <span className="legend-color continue"></span>
            <span>CONTINUE</span>
          </div>
          <div className="legend-item">
            <span className="legend-color depot"></span>
            <span>Depot</span>
          </div>
        </div>
      </div>
      <div 
        ref={mapContainerRef} 
        className="breakdown-map"
        style={{ height: '500px', width: '100%' }}
      >
        {!mapLoaded && renderFallbackMap()}
      </div>
    </div>
  );
};

export default BreakdownMap;