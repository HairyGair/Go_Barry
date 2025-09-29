/**
 * Go North East - Breakdown Assessment Guide
 * Location Modal Component
 *
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useRecentLocations } from '../../hooks/useStorage';

const LocationModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialLocation = '',
  selectedVehicle,
  selectedRoute,
  routeName
}) => {
  // Storage hooks
  const { recentLocations, saveLocation } = useRecentLocations();

  // State management
  const [locationDescription, setLocationDescription] = useState(initialLocation);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [useGPS, setUseGPS] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Common locations for quick selection
  const commonLocations = [
    { value: 'gateshead_interchange', label: 'Gateshead Interchange' },
    { value: 'newcastle_central', label: 'Newcastle Central Station' },
    { value: 'haymarket', label: 'Haymarket Bus Station' },
    { value: 'eldon_square', label: 'Eldon Square' },
    { value: 'metro_centre', label: 'Metro Centre' },
    { value: 'sunderland_interchange', label: 'Sunderland Interchange' },
    { value: 'durham_bus_station', label: 'Durham Bus Station' },
    { value: 'a1_northbound', label: 'A1 Northbound' },
    { value: 'a1_southbound', label: 'A1 Southbound' },
    { value: 'a19_northbound', label: 'A19 Northbound' },
    { value: 'a19_southbound', label: 'A19 Southbound' },
    { value: 'low_fell', label: 'Low Fell' },
    { value: 'team_valley', label: 'Team Valley' },
    { value: 'washington_galleries', label: 'Washington Galleries' }
  ];

  // Reset state when modal opens (but preserve coordinates to prevent clearing user input)
  useEffect(() => {
    if (isOpen) {
      // Only set initial location if it's different and not empty
      if (initialLocation && initialLocation !== locationDescription) {
        setLocationDescription(initialLocation);
      }
      // Don't reset coordinates automatically - let user manage them
      setUseGPS(false);
      setGpsLoading(false);
      setValidationError('');
    }
  }, [isOpen, initialLocation]); // Keep initialLocation but with better logic

  // Clean up state when modal is actually closed (not just refreshing)
  useEffect(() => {
    if (!isOpen) {
      // Reset coordinates only when modal is truly closed
      setCoordinates({ lat: null, lng: null });
      setUseGPS(false);
      setGpsLoading(false);
      setValidationError('');
    }
  }, [isOpen]);

  // Handle GPS location
  const handleGetGPS = async () => {
    if (!navigator.geolocation) {
      setValidationError('GPS is not supported by this browser');
      return;
    }

    setGpsLoading(true);
    setValidationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      setCoordinates({ lat, lng });
      setUseGPS(true);

      // Update description with GPS info
      if (!locationDescription.trim()) {
        setLocationDescription(`GPS Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('GPS Error:', error);
      setValidationError('Unable to get GPS location. Please enter location manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Handle location selection from recent or common locations
  const handleLocationSelect = (location) => {
    setLocationDescription(location);
    setValidationError('');
  };

  // Handle confirmation
  const handleConfirm = () => {
    const trimmedDescription = locationDescription.trim();

    if (!trimmedDescription) {
      setValidationError('Please enter a location description');
      return;
    }

    // Save location to recent locations
    const locationData = {
      description: trimmedDescription,
      coordinates: useGPS ? coordinates : null,
      timestamp: new Date().toISOString(),
      vehicle: selectedVehicle,
      route: selectedRoute
    };

    saveLocation(locationData);

    // Call the onConfirm callback
    onConfirm({
      description: trimmedDescription,
      coordinates: useGPS ? coordinates : null,
      useGPS
    });
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content location-modal">
        <div className="modal-header">
          <h3>📍 Breakdown Location</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Vehicle and Route Info Display */}
        {(selectedVehicle || selectedRoute) && (
          <div className="vehicle-info-display">
            {selectedVehicle && (
              <div className="info-row">
                <span className="info-label">Vehicle:</span>
                <span className="info-value">{selectedVehicle}</span>
              </div>
            )}
            {selectedRoute && (
              <div className="info-row">
                <span className="info-label">Route:</span>
                <span className="info-value">
                  <span className="route-badge">{selectedRoute}</span>
                  {routeName && <span className="route-name">{routeName}</span>}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="modal-body">
          {/* Location Description Input */}
          <div className="form-group">
            <label htmlFor="location-description" className="form-label required">
              Location Description:
            </label>
            <input
              type="text"
              id="location-description"
              className="form-input"
              value={locationDescription}
              onChange={(e) => {
                setLocationDescription(e.target.value);
                setValidationError('');
              }}
              placeholder="e.g., Gateshead Interchange, A1 Northbound, Low Fell"
              required
            />
            <small className="form-hint">
              Provide a clear description of where the breakdown occurred
            </small>
          </div>

          {/* GPS Location Button */}
          <div className="form-group">
            <div className="gps-section">
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={gpsLoading}
                className={`gps-btn ${gpsLoading ? 'loading' : ''} ${useGPS ? 'active' : ''}`}
              >
                {gpsLoading ? (
                  <>🔄 Getting GPS Location...</>
                ) : useGPS ? (
                  <>✅ GPS Location Captured</>
                ) : (
                  <>📍 Use Current GPS Location</>
                )}
              </button>

              {useGPS && coordinates.lat && coordinates.lng && (
                <div className="gps-info">
                  <small>
                    📍 GPS: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Recent Locations */}
          {recentLocations.length > 0 && (
            <div className="form-group">
              <label className="form-label">Recent Locations:</label>
              <div className="recent-locations-grid">
                {recentLocations.slice(0, 6).map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(location.description)}
                    className="recent-location-btn"
                    title={`Used: ${new Date(location.timestamp).toLocaleDateString()}`}
                  >
                    📍 {location.description}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Common Locations */}
          <div className="form-group">
            <label className="form-label">Common Locations:</label>
            <div className="common-locations-grid">
              {commonLocations.map((location) => (
                <button
                  key={location.value}
                  type="button"
                  onClick={() => handleLocationSelect(location.label)}
                  className="common-location-btn"
                >
                  {location.label}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="validation-error">
              ❌ {validationError}
            </div>
          )}

          {/* Location Summary */}
          {locationDescription.trim() && (
            <div className="location-summary">
              <h4>Location Summary:</h4>
              <div className="summary-content">
                <div className="summary-row">
                  <strong>Description:</strong>
                  <span>{locationDescription}</span>
                </div>
                {useGPS && coordinates.lat && coordinates.lng && (
                  <div className="summary-row">
                    <strong>GPS Coordinates:</strong>
                    <span>{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <strong>Positioning:</strong>
                  <span>{useGPS ? '🎯 GPS Enhanced' : '📝 Manual Description'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn btn-primary ${!locationDescription.trim() ? 'btn-disabled' : ''}`}
            disabled={!locationDescription.trim()}
          >
            Confirm Location
          </button>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <h4>Location Guidelines:</h4>
          <ul>
            <li><strong>Be specific:</strong> Include landmarks, street names, or bus stops</li>
            <li><strong>GPS recommended:</strong> Use GPS for precise location tracking</li>
            <li><strong>Recent locations:</strong> Select from previously used locations</li>
            <li><strong>Common areas:</strong> Quick-select major stops and routes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;