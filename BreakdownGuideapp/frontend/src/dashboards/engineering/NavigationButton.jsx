/**
 * Navigation Button Component
 * Opens Google Maps with breakdown location for navigation
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';

const NavigationButton = ({ breakdown, variant = 'button' }) => {
  // Extract location data
  const getLocationData = () => {
    // Priority 1: GPS coordinates from wizard_assessment_data
    if (breakdown.wizard_assessment_data?.location_coords) {
      const coords = breakdown.wizard_assessment_data.location_coords;
      if (coords.latitude && coords.longitude) {
        return {
          type: 'coords',
          lat: coords.latitude,
          lng: coords.longitude
        };
      }
    }

    // Priority 2: Direct lat/lng fields
    if (breakdown.latitude && breakdown.longitude) {
      return {
        type: 'coords',
        lat: breakdown.latitude,
        lng: breakdown.longitude
      };
    }

    // Priority 3: Location description text
    const locationText = breakdown.location_description ||
                        breakdown.location ||
                        breakdown.wizard_assessment_data?.location ||
                        breakdown.wizard_assessment_data?.location_description;

    if (locationText) {
      return {
        type: 'address',
        address: locationText
      };
    }

    // Priority 4: Depot location as fallback
    const depot = breakdown.depot || breakdown.supervisor_depot;
    if (depot) {
      return {
        type: 'address',
        address: `${depot} Depot, the operator`
      };
    }

    return null;
  };

  const locationData = getLocationData();

  if (!locationData) {
    return null; // No location data available
  }

  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    if (locationData.type === 'coords') {
      // Use coordinates for precise navigation
      return `https://www.google.com/maps/dir/?api=1&destination=${locationData.lat},${locationData.lng}&travelmode=driving`;
    } else {
      // Use address search
      const encodedAddress = encodeURIComponent(locationData.address);
      return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    }
  };

  const handleNavigate = () => {
    const url = getGoogleMapsUrl();
    window.open(url, '_blank');
  };

  // Get display text
  const getLocationDisplay = () => {
    if (locationData.type === 'coords') {
      return `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`;
    }
    return locationData.address;
  };

  if (variant === 'inline') {
    return (
      <div className="navigation-inline">
        <div className="location-text">
          <span className="location-icon">📍</span>
          <span className="location-value">{getLocationDisplay()}</span>
        </div>
        <button onClick={handleNavigate} className="nav-btn-inline">
          🧭 Navigate
        </button>

        <style>{`
          .navigation-inline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 12px;
            background: rgba(59, 130, 246, 0.08);
            border-radius: 6px;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .location-text {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
          }

          .location-icon {
            font-size: 16px;
            flex-shrink: 0;
          }

          .location-value {
            color: #e0e0e0;
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .nav-btn-inline {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .nav-btn-inline:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }

          .nav-btn-inline:active {
            transform: translateY(0);
          }

          @media (max-width: 600px) {
            .navigation-inline {
              flex-direction: column;
              align-items: stretch;
            }

            .nav-btn-inline {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    );
  }

  // Button variant
  return (
    <button onClick={handleNavigate} className="navigation-button">
      🧭 Navigate to Location

      <style>{`
        .navigation-button {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .navigation-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }

        .navigation-button:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
};

export default NavigationButton;
