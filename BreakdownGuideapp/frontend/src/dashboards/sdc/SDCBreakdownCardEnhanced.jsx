import React, { useState, memo, useEffect } from 'react';
import { getWizardInfo } from './utils/wizardTypeMapping';
import SimpleLocationMap from './SimpleLocationMap';

// SDC Guide category mappings with icons and sections
const SDC_GUIDE_CATEGORIES = {
  'Steering': { icon: '🚗', section: 'Section 8', critical: true, page: 8 },
  'Brakes': { icon: '🛑', section: 'Section 7', critical: true, page: 7 },
  'ABS Light': { icon: '⚠️', section: 'Section 3', critical: true, page: 14 },
  'Battery Light': { icon: '🔋', section: 'Section 4', critical: false, page: 13 },
  'Non Starter': { icon: '🔑', section: 'Section 19', critical: true, page: 9 },
  'Overheating': { icon: '🌡️', section: 'Section 21', critical: true, page: 11 },
  'Oil Warning Light': { icon: '🛢️', section: 'Section 20', critical: true, page: 22 },
  'Road Traffic Incidents': { icon: '🚨', section: 'Section 2', critical: true, page: 4 },
  'Doors': { icon: '🚪', section: 'Section 10', critical: false, page: 17 },
  'Wipers/Screenwash': { icon: '🌧️', section: 'Section 30', critical: false, page: 12 },
  'Puncture': { icon: '🔧', section: 'Section 22', critical: true, page: 32 },
  'Exterior Lights': { icon: '💡', section: 'Section 11', critical: false, page: 35 },
  'Interior Lights': { icon: '💡', section: 'Section 15', critical: false, page: 33 },
  'Warning Lights': { icon: '⚡', section: 'Section 28', critical: true, page: 25 },
  'Suspension': { icon: '🔩', section: 'Section 27', critical: true, page: 34 },
  'Wing Mirrors': { icon: '🪞', section: 'Section 29', critical: false, page: 27 },
  'Broken Windows': { icon: '🪟', section: 'Section 6', critical: false, page: 6 },
  'Gear Selection': { icon: '⚙️', section: 'Section 13', critical: true, page: 24 },
  'Gearbox': { icon: '⚙️', section: 'Section 14', critical: true, page: 21 },
  'Low Water': { icon: '💧', section: 'Section 18', critical: false, page: 16 },
  'Excessive Smoke': { icon: '💨', section: 'Section 12', critical: false, page: 10 },
  'Cutting Out/Fuel': { icon: '⛽', section: 'Section 8', critical: true, page: 18 },
  'Demisters/Heaters': { icon: '🌬️', section: 'Section 9', critical: false, page: 15 },
  'Ramp': { icon: '♿', section: 'Section 23', critical: false, page: 20 },
  'Repeat Defects': { icon: '🔄', section: 'Section 24', critical: false, page: 23 },
  'Speedo': { icon: '📊', section: 'Section 25', critical: false, page: 31 },
  'Buzzers': { icon: '🔔', section: 'Section 7', critical: false, page: 26 },
  'Interior/Exterior Damage': { icon: '🚧', section: 'Section 17', critical: false, page: 29 },
  'Loose Wheel Nuts': { icon: '⚠️', section: 'Section 17', critical: true, page: 28 }
};

// Helper to extract coordinates from location string
const extractCoordinates = (location) => {
  if (!location) return null;
  
  // Check if it's already coordinates (format: "55.011629, -1.621362")
  const coordMatch = location.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    
    // Validate coordinates are reasonable for UK
    if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      console.log('📍 Coordinates found:', { lat, lng, from: location });
      return { lat, lng };
    }
  }
  
  // For testing - hardcoded coordinates for known locations
  const knownLocations = {
    'Gosforth': { lat: 55.0117, lng: -1.6214 },
    'Washington': { lat: 54.9000, lng: -1.5200 },
    'Newcastle': { lat: 54.9783, lng: -1.6178 },
    'Chester-le-Street': { lat: 54.8543, lng: -1.5740 },
    'Gateshead': { lat: 54.9527, lng: -1.6034 }
  };
  
  // Check if location contains any known place
  for (const [place, coords] of Object.entries(knownLocations)) {
    if (location.includes(place)) {
      console.log('📍 Using known location:', place, coords);
      return coords;
    }
  }
  
  return null;
};

// Generate static map URL (using OpenStreetMap)
const getStaticMapUrl = (location) => {
  const coords = extractCoordinates(location);
  
  if (coords) {
    // Using OpenStreetMap static image
    const zoom = 15;
    const width = 300;
    const height = 200;
    
    // Alternative 1: Using static map service (if available)
    // return `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=${zoom}&size=${width}x${height}&markers=${coords.lat},${coords.lng},red`;
    
    // Alternative 2: Using iframe-based map (more reliable)
    return {
      type: 'iframe',
      lat: coords.lat,
      lng: coords.lng,
      zoom: zoom
    };
  }
  
  return null;
};

const SDCBreakdownCardEnhanced = memo(({
  breakdown,
  onAcknowledge,
  onMakeDecision,
  onRequestEngineering,
  onEditAssessment,
  onResolve,
  onViewGuide,
  onAddNote,
  animationDelay = 0,
  isHighlighted = false,
  engineeringTimer = null,
  recentlyCompleted = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [slaStatus, setSlaStatus] = useState('ok');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');
  const [showMap, setShowMap] = useState(true); // Show map by default

  // Validate fleet number - should be 3-5 digits typically
  const isValidFleetNumber = (value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    // Fleet numbers should be 3-5 digits (like 6301, 5401, etc.)
    return /^\d{3,5}$/.test(trimmed);
  };

  // Get the correct fleet number and vehicle data with validation
  const candidateFleetNumbers = [
    breakdown.fleet_no,
    breakdown.fleet_number,
    breakdown.vehicle?.fleet_number,
    breakdown.vehicle?.fleetNumber,
    breakdown.fleetNumber
  ];

  const validFleetNumber = candidateFleetNumbers.find(isValidFleetNumber);
  const fleetNumber = validFleetNumber || 'Unknown';

  // Debug fleet number extraction
  console.log('🔍 Fleet number extraction for breakdown:', breakdown.breakdown_id, {
    candidateFleetNumbers: candidateFleetNumbers,
    validationResults: candidateFleetNumbers.map(num => ({
      value: num,
      isValid: isValidFleetNumber(num)
    })),
    validFleetNumber: validFleetNumber,
    finalFleetNumber: fleetNumber,
    allBreakdownFields: Object.keys(breakdown),
    suspiciousNumbers: {
      coordinates: breakdown.coordinates,
      latitude: breakdown.latitude,
      longitude: breakdown.longitude,
      location_coords: breakdown.location_coords,
      daily_id: breakdown.daily_id
    }
  });

  // Get vehicle type
  const vehicleType = breakdown.vehicle_type ||
                     breakdown.vehicleType ||
                     breakdown.vehicle?.vehicleType ||
                     breakdown.vehicle?.type ||
                     breakdown.type ||
                     null;

  // Get depot - try multiple possible field names
  const depot = breakdown.depot ||
               breakdown.depot_id ||
               breakdown.vehicle?.depot ||
               breakdown.depot_name ||
               'Unknown';

  // Simplify vehicle type for display
  const getSimplifiedVehicleType = (vehicleType) => {
    if (!vehicleType) return null;
    if (vehicleType.toLowerCase().includes('streetdeck')) return 'StreetDeck';
    if (vehicleType.toLowerCase().includes('streetlite')) return 'Streetlite';
    if (vehicleType.toLowerCase().includes('enviro')) return 'Enviro';
    if (vehicleType.toLowerCase().includes('versa')) return 'Versa';
    if (vehicleType.toLowerCase().includes('solo')) return 'Solo';
    if (vehicleType.toLowerCase().includes('omnidekka')) return 'Omnidekka';
    return vehicleType.split(' ')[0] || vehicleType;
  };

  const simplifiedVehicleType = getSimplifiedVehicleType(vehicleType);

  // Get SDC Guide info based on issue type
  const issueType = breakdown.issue_type || breakdown.wizard_type?.replace('Wizard', '') || 'General';
  const sdcGuideInfo = SDC_GUIDE_CATEGORIES[issueType] || { icon: '❔', section: 'N/A', critical: false };
  
  // Get map data - try multiple sources
  const locationString = breakdown.location || 
                         breakdown.coordinates || 
                         breakdown.location_coords || 
                         `${breakdown.latitude || ''}, ${breakdown.longitude || ''}`;
  
  const mapData = getStaticMapUrl(locationString);
  const hasCoordinates = mapData !== null;
  
  // Debug map data
  if (!hasCoordinates && breakdown.location) {
    console.log('🗺️ No map data for:', breakdown.location, '- coordinates not found');
  }
  
  // Format location for display
  const formatLocation = (location) => {
    if (!location) return 'Unknown Location';
    
    // If it's coordinates, return as is for now
    const coords = extractCoordinates(location);
    if (coords && location.match(/^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/)) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    // Otherwise return the location string
    return location;
  };
  
  // Get more specific location details
  const getLocationDetails = () => {
    const location = breakdown.location || '';
    const parts = location.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
      return {
        primary: parts[0], // Street or specific location
        secondary: parts.slice(1).join(', ') // Area/City
      };
    }
    
    return {
      primary: location,
      secondary: ''
    };
  };
  
  const locationDetails = getLocationDetails();
  
  // Calculate SLA status (30 min warning, 45 min breach for critical)
  useEffect(() => {
    const elapsed = breakdown.elapsed || 0;
    setTimeElapsed(elapsed);
    
    if (sdcGuideInfo.critical) {
      if (elapsed >= 45) setSlaStatus('breached');
      else if (elapsed >= 30) setSlaStatus('warning');
      else setSlaStatus('ok');
    } else {
      if (elapsed >= 90) setSlaStatus('breached');
      else if (elapsed >= 60) setSlaStatus('warning');
      else setSlaStatus('ok');
    }
  }, [breakdown.elapsed, sdcGuideInfo.critical]);

  // Format time display
  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Get decision class and info
  const getDecisionInfo = () => {
    const decision = (breakdown.decision || breakdown.severity || breakdown.wizard_decision || '').toUpperCase();
    switch (decision) {
      case 'STOP':
        return {
          class: 'decision-stop',
          icon: '🛑',
          text: 'STOP',
          description: 'Vehicle must not continue - Engineering required immediately',
          actions: ['Dispatch Engineer', 'Arrange Recovery', 'Notify Depot']
        };
      case 'AMBER':
        return {
          class: 'decision-amber',
          icon: '⚠️',
          text: 'AMBER',
          description: 'Changeover at earliest convenience',
          actions: ['Schedule Changeover', 'Monitor Vehicle', 'Update Driver']
        };
      case 'CONTINUE':
        return {
          class: 'decision-continue',
          icon: '✅',
          text: 'CONTINUE',
          description: 'Vehicle can continue in service',
          actions: ['Log Defect', 'Schedule Inspection', 'Continue Service']
        };
      default:
        return {
          class: 'decision-pending',
          icon: '❓',
          text: 'PENDING',
          description: 'Assessment required',
          actions: ['Start Assessment', 'Contact Driver', 'Request Info']
        };
    }
  };

  const decisionInfo = getDecisionInfo();

  // Get current stage progress
  const stages = ['received', 'acknowledged', 'decision', 'engineering'];
  const currentStageIndex = stages.indexOf(breakdown.currentStage || 'received');
  const stageProgress = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <div 
      className={`sdc-card-enhanced ${decisionInfo.class} ${slaStatus} ${isHighlighted ? 'highlighted' : ''}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Header Section */}
      <div className="card-header">
        <div className="header-left">
          <div className="fleet-section">
            <div className="fleet-label">FLEET</div>
            <div className="fleet-number">
              {fleetNumber}
              {simplifiedVehicleType && (
                <span 
                  className="vehicle-type"
                  style={{
                    fontSize: '0.85em',
                    opacity: 0.8,
                    fontWeight: 'normal',
                    color: '#94a3b8'
                  }}
                > • {simplifiedVehicleType}</span>
              )}
            </div>
          </div>
          {breakdown.route_id && (
            <div className="route-badge">
              <span className="route-label">Route</span>
              <span className="route-number">{breakdown.route_id}</span>
            </div>
          )}
          {breakdown.isPriority && (
            <span className="priority-indicator">PRIORITY</span>
          )}
        </div>
        
        <div className="header-right">
          <div className="sla-timer">
            <div className={`timer-display ${slaStatus}`}>
              <span className="timer-value">{formatTime(timeElapsed)}</span>
              <span className="timer-label">
                {slaStatus === 'breached' ? 'OVERDUE' : 
                 slaStatus === 'warning' ? 'SLA WARNING' : 
                 'ELAPSED'}
              </span>
            </div>
            {sdcGuideInfo.critical && (
              <div className="sla-bar">
                <div 
                  className="sla-progress"
                  style={{ width: `${Math.min(100, (timeElapsed / 45) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Section with Map */}
      <div className="location-section">
        <div className="location-info">
          <div className="location-header">
            <span className="location-icon">📍</span>
            <div className="location-text">
              <div className="location-primary">{locationDetails.primary}</div>
              {locationDetails.secondary && (
                <div className="location-secondary">{locationDetails.secondary}</div>
              )}
            </div>
          </div>
          {hasCoordinates && (
            <button 
              className="map-toggle"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
            </button>
          )}
        </div>
        
        {showMap && (mapData && mapData.type === 'iframe' ? (
          <div className="map-container">
            <iframe
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapData.lng-0.01},${mapData.lat-0.01},${mapData.lng+0.01},${mapData.lat+0.01}&layer=mapnik&marker=${mapData.lat},${mapData.lng}`}
              style={{ borderRadius: '8px' }}
              title="Breakdown Location Map"
            />
            <div className="map-coordinates">
              📍 {mapData.lat.toFixed(6)}, {mapData.lng.toFixed(6)}
            </div>
            <a 
              href={`https://www.openstreetmap.org/?mlat=${mapData.lat}&mlon=${mapData.lng}#map=16/${mapData.lat}/${mapData.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-link"
            >
              Open in full map →
            </a>
          </div>
        ) : (
          // Fallback to simple map when no coordinates found
          <SimpleLocationMap 
            location={breakdown.location || 'Unknown'}
            fleetNumber={fleetNumber}
            depot={depot}
          />
        ))}
      </div>

      {/* Issue Type Section */}
      <div className="issue-section">
        <div className="issue-header">
          <div className="issue-icon">{sdcGuideInfo.icon}</div>
          <div className="issue-info">
            <h3 className="issue-type">{issueType}</h3>
            <div className="sdc-reference">
              <span className="sdc-label">SDC Guide:</span>
              <button 
                className="sdc-link"
                onClick={() => onViewGuide && onViewGuide(sdcGuideInfo.section, sdcGuideInfo.page)}
              >
                {sdcGuideInfo.section} (Page {sdcGuideInfo.page})
              </button>
            </div>
          </div>
        </div>
        
        {/* Decision Display */}
        <div className={`decision-display ${decisionInfo.class}`}>
          <div className="decision-icon">{decisionInfo.icon}</div>
          <div className="decision-content">
            <span className="decision-text">{decisionInfo.text}</span>
            <span className="decision-description">{decisionInfo.description}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Timeline */}
      <div className="timeline-section">
        <div className="timeline-bar">
          <div className="timeline-progress" style={{ width: `${stageProgress}%` }} />
          {stages.map((stage, index) => (
            <div 
              key={stage}
              className={`timeline-step ${index <= currentStageIndex ? 'completed' : ''} ${stage === breakdown.currentStage ? 'current' : ''}`}
            >
              <div className="step-dot">
                {index <= currentStageIndex ? '✓' : index + 1}
              </div>
              <span className="step-label">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Depot</span>
          <span className="info-value">{depot}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{breakdown.supervisor_name || 'Unassigned'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className="info-value status">{breakdown.currentStage || 'Received'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Breakdown ID</span>
          <span className="info-value">{breakdown.breakdown_id || 'N/A'}</span>
        </div>
      </div>

      {/* Quick Actions Based on Decision */}
      {decisionInfo.text !== 'PENDING' && (
        <div className="quick-actions">
          <h4>Recommended Actions</h4>
          <div className="actions-list">
            {decisionInfo.actions.map((action, index) => (
              <button key={index} className="quick-action-btn">
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {breakdown.currentStage === 'received' && (
          <button className="btn btn-acknowledge" onClick={() => onAcknowledge(breakdown.breakdown_id)}>
            <span>✓</span> Acknowledge
          </button>
        )}
        {breakdown.currentStage === 'acknowledged' && (
          <button className="btn btn-decision" onClick={() => onMakeDecision(breakdown.breakdown_id)}>
            <span>📋</span> Make Decision
          </button>
        )}
        {breakdown.currentStage === 'decision' && (
          <button className="btn btn-engineering" onClick={() => onRequestEngineering(breakdown.breakdown_id)}>
            <span>🔧</span> Request Engineering
          </button>
        )}
        <button className="btn btn-notes" onClick={() => setShowNotes(!showNotes)}>
          <span>📝</span> Notes
        </button>
        {breakdown.wizard_decision && onEditAssessment && (
          <button className="btn btn-edit" onClick={() => onEditAssessment(breakdown.breakdown_id)}>
            <span>✏️</span> Edit
          </button>
        )}
        {onResolve && (
          <button className="btn btn-resolve" onClick={onResolve}>
            <span>✅</span> Mark as Resolved
          </button>
        )}
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="notes-section">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this breakdown..."
            className="notes-input"
          />
          <button 
            className="btn-save-note"
            onClick={() => {
              onAddNote && onAddNote(breakdown.breakdown_id, note);
              setNote('');
              setShowNotes(false);
            }}
          >
            Save Note
          </button>
        </div>
      )}

      <style jsx>{`
        .sdc-card-enhanced {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin-bottom: 12px;
          transition: box-shadow 0.2s ease;
          border-left: 3px solid #e5e7eb;
        }

        /* Decision color coding - simplified */
        .sdc-card-enhanced.decision-stop {
          border-left-color: #dc2626;
        }

        .sdc-card-enhanced.decision-amber {
          border-left-color: #f59e0b;
        }

        .sdc-card-enhanced.decision-continue {
          border-left-color: #10b981;
        }

        /* SLA Status - removed animations */
        .sdc-card-enhanced.breached {
          border-left-color: #dc2626;
        }

        .sdc-card-enhanced.warning {
          border-left-color: #f59e0b;
        }

        /* Header Section */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fleet-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f9fafb;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }

        .fleet-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
        }

        .fleet-number {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          line-height: 1;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .route-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 12px;
          background: #dbeafe;
          border-radius: 8px;
        }

        .route-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }

        .route-number {
          font-size: 18px;
          font-weight: 700;
          color: #3b82f6;
        }

        .priority-indicator {
          background: #fef2f2;
          color: #b91c1c;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          border: 1px solid #fca5a5;
        }

        /* Location Section */
        .location-section {
          background: #fafafa;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
        }

        .location-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .location-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .location-icon {
          font-size: 18px;
          margin-top: 2px;
        }

        .location-text {
          display: flex;
          flex-direction: column;
        }

        .location-primary {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .location-secondary {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .map-toggle {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .map-toggle:hover {
          background: #2563eb;
        }

        .map-container {
          margin-top: 12px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .map-coordinates {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          font-size: 11px;
          font-family: monospace;
          text-align: center;
        }

        .map-link {
          display: block;
          text-align: center;
          padding: 6px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .map-link:hover {
          background: #2563eb;
        }

        /* SLA Timer */
        .sla-timer {
          text-align: right;
        }

        .timer-display {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .timer-value {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
        }

        .timer-display.warning .timer-value {
          color: #d97706;
        }

        .timer-display.breached .timer-value {
          color: #dc2626;
        }

        .timer-label {
          font-size: 12px;
          font-weight: 400;
          text-transform: none;
          color: #6b7280;
        }

        /* Issue Section */
        .issue-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .issue-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .issue-icon {
          font-size: 32px;
          line-height: 1;
        }

        .issue-info {
          flex: 1;
        }

        .issue-type {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .sdc-reference {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sdc-label {
          font-size: 12px;
          color: #64748b;
        }

        .sdc-link {
          font-size: 12px;
          color: #3b82f6;
          text-decoration: underline;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-weight: 500;
        }

        .sdc-link:hover {
          color: #2563eb;
        }

        /* Decision Display */
        .decision-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .decision-display.decision-stop {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .decision-display.decision-amber {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .decision-display.decision-continue {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .decision-display.decision-pending {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .decision-icon {
          font-size: 18px;
        }

        .decision-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .decision-text {
          font-size: 14px;
          font-weight: 600;
          text-transform: none;
        }

        .decision-display.decision-stop .decision-text {
          color: #b91c1c;
        }

        .decision-display.decision-amber .decision-text {
          color: #b45309;
        }

        .decision-display.decision-continue .decision-text {
          color: #047857;
        }

        .decision-display.decision-pending .decision-text {
          color: #475569;
        }

        .decision-description {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Timeline Section */
        .timeline-section {
          margin: 16px 0;
        }

        .timeline-bar {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }

        .timeline-bar::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: #e5e7eb;
          transform: translateY(-50%);
        }

        .timeline-progress {
          position: absolute;
          top: 50%;
          left: 0;
          height: 2px;
          background: #3b82f6;
          transform: translateY(-50%);
          transition: width 0.3s ease;
        }

        .timeline-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          z-index: 1;
        }

        .step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 2px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 500;
          color: #6b7280;
        }

        .timeline-step.completed .step-dot {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .timeline-step.current .step-dot {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .step-label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 400;
        }

        .timeline-step.completed .step-label,
        .timeline-step.current .step-label {
          color: #374151;
          font-weight: 500;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 20px 0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
          margin-top: 2px;
        }

        .info-value.status {
          text-transform: capitalize;
        }

        /* Quick Actions */
        .quick-actions {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
        }

        .quick-actions h4 {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }

        .actions-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quick-action-btn {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          transform: translateY(-1px);
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          flex: 1;
          min-width: 100px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn span {
          font-size: 14px;
        }

        .btn-acknowledge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .btn-decision {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .btn-engineering {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-notes {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }

        .btn-edit {
          background: linear-gradient(135deg, #64748b, #475569);
          color: white;
        }

        .btn-resolve {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .btn-resolve:hover {
          background: linear-gradient(135deg, #059669, #047857);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Notes Section */
        .notes-section {
          margin-top: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .notes-input {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          resize: vertical;
        }

        .btn-save-note {
          margin-top: 8px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-save-note:hover {
          background: #2563eb;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
});

SDCBreakdownCardEnhanced.displayName = 'SDCBreakdownCardEnhanced';

export default SDCBreakdownCardEnhanced;
