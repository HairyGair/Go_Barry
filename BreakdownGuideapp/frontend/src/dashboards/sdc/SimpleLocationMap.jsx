// Simple static map component that always works
// This shows a map even without exact coordinates

import React from 'react';

const SimpleLocationMap = ({ location, fleetNumber, depot }) => {
  // Default center points - VERIFIED from OpenStreetMap (December 2025)
  const depotCoordinates = {
    'Washington': { lat: 54.9068, lng: -1.5140, zoom: 12 },
    'Riverside': { lat: 54.9586, lng: -1.6579, zoom: 13 },
    'Percy Main': { lat: 55.0041, lng: -1.4774, zoom: 12 },
    'Deptford': { lat: 54.9142, lng: -1.3976, zoom: 12 },
    'Chester-le-Street': { lat: 54.8543, lng: -1.5740, zoom: 12 },
    'Consett': { lat: 54.8403, lng: -1.8380, zoom: 12 },
    'Hexham': { lat: 54.9756, lng: -2.0960, zoom: 12 },
    'Gateshead': { lat: 54.9527, lng: -1.6034, zoom: 13 },
    'Newcastle': { lat: 54.9783, lng: -1.6178, zoom: 13 }
  };

  // Try to extract coordinates from location string
  const extractCoords = (locationStr) => {
    if (!locationStr) return null;
    
    const match = locationStr.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
        return { lat, lng, zoom: 15 };
      }
    }
    return null;
  };

  // Get coordinates - either from location string or depot
  const coords = extractCoords(location) || 
                 depotCoordinates[depot] || 
                 depotCoordinates['Newcastle']; // Default to Newcastle

  // Generate OpenStreetMap URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.02},${coords.lat-0.02},${coords.lng+0.02},${coords.lat+0.02}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  // Generate static image alternative (using StaticMapLite or similar)
  const staticImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.02},${coords.lat-0.02},${coords.lng+0.02},${coords.lat+0.02}&layer=mapnik`;

  return (
    <div className="simple-map-container">
      <div className="map-header">
        <span className="map-title">📍 Breakdown Location</span>
        <span className="map-fleet">Fleet {fleetNumber}</span>
      </div>
      
      <div className="map-frame">
        <iframe
          width="100%"
          height="150"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          style={{ borderRadius: '6px' }}
          title={`Location map for ${location}`}
          loading="lazy"
        />
      </div>
      
      <div className="map-details">
        <div className="location-text">
          {location && !location.match(/^\d/) ? location : `${depot} Area`}
        </div>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="map-google-link"
        >
          Open in Google Maps
        </a>
      </div>

      <style jsx>{`
        .simple-map-container {
          background: #f8fafc;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          margin-top: 8px;
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .map-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .map-fleet {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .map-frame {
          position: relative;
          width: 100%;
          background: #e5e7eb;
        }

        .map-details {
          padding: 8px 12px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .location-text {
          font-size: 12px;
          color: #374151;
          margin-bottom: 6px;
        }

        .map-google-link {
          font-size: 11px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .map-google-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default SimpleLocationMap;
