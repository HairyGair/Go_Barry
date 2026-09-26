// Simple static map component that always works
// This shows a map even without exact coordinates

import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import DarkPinMap from './DarkPinMap';
import { isDemoSession, DEMO_DEPOTS } from '../../config/demoDepots';

const SimpleLocationMap = ({ location, fleetNumber, depot }) => {
  // Default center points - VERIFIED from OpenStreetMap (December 2025)
  const realDepotCoordinates = {
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

  // Fictional depot coordinates for demo sessions, keyed by name (+ a
  // neutral fallback in place of "Newcastle").
  const demoDepotCoordinates = DEMO_DEPOTS.reduce((acc, d) => {
    acc[d.name] = { lat: d.lat, lng: d.lng, zoom: 12 };
    return acc;
  }, { 'Newcastle': { lat: 54.9783, lng: -1.6178, zoom: 11 } });

  const depotCoordinates = isDemoSession() ? demoDepotCoordinates : realDepotCoordinates;

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

  return (
    <div className="slm">
      <div className="slm-header">
        <span className="slm-title"><MapPin size={13} style={{ verticalAlign: '-2px' }} /> Breakdown Location</span>
        <span className="slm-fleet">Fleet {fleetNumber}</span>
      </div>
      
      <div className="slm-frame">
        <DarkPinMap lat={coords.lat} lng={coords.lng} zoom={coords.zoom} height={200} title={`Location map for ${location}`} />
      </div>
      
      <div className="slm-details">
        <div className="slm-location">
          {location && !location.match(/^\d/) ? location : `${depot} Area`}
        </div>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="slm-link"
        >
          Open in Google Maps <ExternalLink size={11} style={{ verticalAlign: '-1px' }} />
        </a>
      </div>

      <style jsx>{`
        .slm {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 8px;
        }

        .slm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .slm-title {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .slm-fleet {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .slm-frame {
          position: relative;
          width: 100%;
          padding: 8px;
        }

        .slm-details {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .slm-location {
          font-size: 12px;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .slm-link {
          font-size: 11px;
          color: #22d3ee;
          text-decoration: none;
          font-weight: 500;
        }

        .slm-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default SimpleLocationMap;
