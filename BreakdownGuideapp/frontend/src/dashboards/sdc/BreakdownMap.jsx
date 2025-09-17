import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different criticality levels
const createCustomIcon = (criticality) => {
  const colors = {
    critical: '#dc2626',
    warning: '#f59e0b',
    normal: '#3b82f6'
  };
  
  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M20 0C12 0 5 7 5 15c0 11 15 25 15 25s15-14 15-25C35 7 28 0 20 0z" 
              fill="${colors[criticality] || colors.normal}" 
              stroke="#fff" 
              stroke-width="2"/>
        <circle cx="20" cy="15" r="6" fill="#fff" opacity="0.9"/>
      </g>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: `breakdown-marker ${criticality}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
  });
};

const BreakdownMap = ({ breakdowns }) => {
  // Newcastle city center coordinates
  const center = [54.9783, -1.6178];
  const zoom = 11;

  // Location coordinates for known locations
  const locationCoordinates = {
    'Newcastle City Centre': [54.9783, -1.6178],
    'Gateshead Interchange': [54.9614, -1.6010],
    'Team Valley': [54.9225, -1.5745],
    'Eldon Square': [54.9766, -1.6147],
    'Great Park': [55.0367, -1.6462],
    'Gosforth': [55.0072, -1.6087],
    'Quayside': [54.9675, -1.6028],
    'MetroCentre': [54.9588, -1.6658],
    'Airport': [55.0375, -1.6917],
    'Heaton': [54.9947, -1.5810]
  };

  // Get coordinates for a location
  const getCoordinates = (location) => {
    // If we have predefined coordinates, use them
    if (locationCoordinates[location]) {
      return locationCoordinates[location];
    }
    
    // Otherwise, generate random coordinates around Newcastle
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    return [center[0] + latOffset, center[1] + lngOffset];
  };

  useEffect(() => {
    // Fix for Leaflet icon loading
    const intervalId = setInterval(() => {
      const mapElements = document.querySelectorAll('.leaflet-marker-icon');
      if (mapElements.length > 0) {
        clearInterval(intervalId);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="breakdown-map-container">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        className="breakdown-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Add a subtle overlay for priority routes area */}
        <Circle
          center={center}
          radius={5000}
          pathOptions={{
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.2,
            dashArray: '5, 10'
          }}
        />
        
        {/* Add markers for each breakdown */}
        {breakdowns.map((breakdown) => {
          const position = getCoordinates(breakdown.location);
          
          return (
            <Marker
              key={breakdown.breakdown_id}
              position={position}
              icon={createCustomIcon(breakdown.criticality)}
            >
              <Popup className="breakdown-popup">
                <div style={{ padding: '8px', minWidth: '200px' }}>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '16px', 
                    color: '#1e293b',
                    marginBottom: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '4px'
                  }}>
                    Fleet {breakdown.fleet_no}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    <strong>Route:</strong> <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      marginLeft: '4px'
                    }}>{breakdown.route_id}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    <strong>Location:</strong> {breakdown.location}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    <strong>Depot:</strong> {breakdown.depot_display}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    <strong>Duration:</strong> <span style={{ color: '#dc2626', fontWeight: '600' }}>{breakdown.elapsed} mins</span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontWeight: '600',
                    background: breakdown.criticality === 'critical' ? '#fee2e2' : 
                               breakdown.criticality === 'warning' ? '#fef3c7' : '#dbeafe',
                    color: breakdown.criticality === 'critical' ? '#dc2626' : 
                           breakdown.criticality === 'warning' ? '#d97706' : '#2563eb'
                  }}>
                    {breakdown.currentStage.toUpperCase()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style jsx>{`
        .breakdown-map-container {
          height: 100%;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        
        :global(.breakdown-map) {
          z-index: 1;
        }
        
        :global(.leaflet-control-container) {
          position: absolute;
          z-index: 800;
        }
        
        :global(.leaflet-popup-content-wrapper) {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          border: 1px solid rgba(226,232,240,0.8);
        }
        
        :global(.leaflet-popup-tip) {
          background: white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        
        :global(.breakdown-marker) {
          animation: dropIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        
        :global(.breakdown-marker.critical) {
          animation: dropIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both, 
                      criticalPulse 2s infinite;
        }
        
        @keyframes dropIn {
          0% {
            transform: translateY(-200px) scale(0.5);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes criticalPulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(220, 38, 38, 0.6));
          }
        }
        
        :global(.leaflet-control-zoom) {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        
        :global(.leaflet-control-zoom a) {
          background: white !important;
          color: #1e293b !important;
          border: none !important;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        :global(.leaflet-control-zoom a:hover) {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        
        :global(.leaflet-control-attribution) {
          background: rgba(255,255,255,0.8) !important;
          backdrop-filter: blur(4px);
          font-size: 10px;
          padding: 2px 5px;
          border-radius: 4px;
          margin: 4px !important;
        }
      `}</style>
    </div>
  );
};

export default BreakdownMap;
