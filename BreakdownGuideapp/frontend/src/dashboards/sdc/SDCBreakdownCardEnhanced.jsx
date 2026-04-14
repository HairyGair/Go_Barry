import React, { useState, memo, useEffect, useCallback } from 'react';
import { getWizardInfo } from './utils/wizardTypeMapping';
import SimpleLocationMap from './SimpleLocationMap';
import DepotContactBadge from '../../components/DepotContactBadge';
import ShiftEndingBadge from '../../components/ShiftEndingBadge';
import NextTripCountdownBadge from '../../components/NextTripCountdownBadge';
import EngineerEtaCountdown from '../../components/EngineerEtaCountdown';
import QuickDecisionButtons from './QuickDecisionButtons';
import apiClient from '../../services/api-client';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps.js';
import './SDCBreakdownCard-Carousel.css';

// standard procedure category mappings with icons
const SDC_GUIDE_CATEGORIES = {
  'Steering': { icon: '🚗', critical: true },
  'Brakes': { icon: '🛑', critical: true },
  'ABS Light': { icon: '⚠️', critical: true },
  'Battery Light': { icon: '🔋', critical: false },
  'Non Starter': { icon: '🔑', critical: true },
  'Overheating': { icon: '🌡️', critical: true },
  'Oil Warning Light': { icon: '🛢️', critical: true },
  'Road Traffic Incidents': { icon: '🚨', critical: true },
  'Doors': { icon: '🚪', critical: false },
  'Wipers/Screenwash': { icon: '🌧️', critical: false },
  'Puncture': { icon: '🔧', critical: true },
  'Exterior Lights': { icon: '💡', critical: false },
  'Interior Lights': { icon: '💡', critical: false },
  'Warning Lights': { icon: '⚡', critical: true },
  'Suspension': { icon: '🔩', critical: true },
  'Wing Mirrors': { icon: '🪞', critical: false },
  'Broken Windows': { icon: '🪟', critical: false },
  'Gear Selection': { icon: '⚙️', critical: true },
  'Gearbox': { icon: '⚙️', critical: true },
  'Low Water': { icon: '💧', critical: false },
  'Excessive Smoke': { icon: '💨', critical: false },
  'Cutting Out/Fuel': { icon: '⛽', critical: true },
  'Demisters/Heaters': { icon: '🌬️', critical: false },
  'Ramp': { icon: '♿', critical: false },
  'Repeat Defects': { icon: '🔄', critical: false },
  'Speedo': { icon: '📊', critical: false },
  'Buzzers': { icon: '🔔', critical: false },
  'Interior/Exterior Damage': { icon: '🚧', critical: false },
  'Loose Wheel Nuts': { icon: '⚠️', critical: true }
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
  
  // Known locations - VERIFIED from OpenStreetMap (December 2025)
  const knownLocations = {
    // Depots
    'Washington': { lat: 54.9068, lng: -1.5140 },
    'Riverside': { lat: 54.9586, lng: -1.6579 },
    'Consett': { lat: 54.8403, lng: -1.8380 },
    'Deptford': { lat: 54.9142, lng: -1.3976 },
    'Percy Main': { lat: 55.0041, lng: -1.4774 },
    'Hexham': { lat: 54.9756, lng: -2.0960 },
    // Major locations
    'Gosforth': { lat: 55.0117, lng: -1.6214 },
    'Newcastle': { lat: 54.9783, lng: -1.6178 },
    'Chester-le-Street': { lat: 54.8543, lng: -1.5740 },
    'Gateshead': { lat: 54.9527, lng: -1.6034 },
    'Sunderland': { lat: 54.9069, lng: -1.3838 }
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
  onQuickDecision,
  onContact,
  onDispatchReplacement,
  onReturnToService,
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
  const [showMap, setShowMap] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0); // Track which card is active
  const [isExpanded, setIsExpanded] = useState(false); // Track if details are expanded
  const [geocodedLocation, setGeocodedLocation] = useState(null); // Store geocoded street name

  // Journey/Trip editor state
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [linkedTrip, setLinkedTrip] = useState(breakdown.trip_id ? {
    tripId: breakdown.trip_id,
    blockId: breakdown.block_id,
  } : null);
  const [savingTrip, setSavingTrip] = useState(false);

  const fetchTripsForRoute = useCallback(async () => {
    const routeId = breakdown.route_id || breakdown.wizard_assessment_data?.route;
    if (!routeId) return;
    setLoadingTrips(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
      const res = await fetch(`${apiUrl}/api/public/route-trips?route_id=${encodeURIComponent(routeId)}&limit=30`);
      const data = await res.json();
      if (data.success && data.trips) {
        setAvailableTrips(data.trips);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  }, [breakdown.route_id, breakdown.wizard_assessment_data?.route]);

  const handleTripSelect = useCallback(async (trip) => {
    setSavingTrip(true);
    try {
      await apiClient.put(`/api/breakdowns/${breakdown.breakdown_id}`, {
        trip_id: trip.tripId,
        block_id: trip.blockId || null,
      });
      setLinkedTrip(trip);
      setShowTripPicker(false);
    } catch (err) {
      console.error('Failed to save trip link:', err);
    } finally {
      setSavingTrip(false);
    }
  }, [breakdown.breakdown_id]);

  const handleUnlinkTrip = useCallback(async () => {
    setSavingTrip(true);
    try {
      await apiClient.put(`/api/breakdowns/${breakdown.breakdown_id}`, {
        trip_id: null,
        block_id: null,
      });
      setLinkedTrip(null);
    } catch (err) {
      console.error('Failed to unlink trip:', err);
    } finally {
      setSavingTrip(false);
    }
  }, [breakdown.breakdown_id]);

  // Next Trip Countdown: mark trip as covered or cancelled
  // Sends full trip details so the backend can persist them for pattern analysis
  const handleNextTripAction = useCallback(async (action) => {
    try {
      const nextTrip = breakdown.next_trip;
      const body = {
        next_trip_action: action,
      };

      // Include full trip details for lost-trip recording
      if (nextTrip) {
        body.lost_trip_details = {
          trip_id: nextTrip.tripId || null,
          route_id: breakdown.route_id || breakdown.wizard_assessment_data?.route || null,
          direction_id: nextTrip.directionId ?? null,
          departure_time: nextTrip.departureTime || null,
          arrival_time: nextTrip.arrivalTime || null,
          origin_stop: nextTrip.originStop || null,
          dest_stop: nextTrip.destStop || null,
          headsign: nextTrip.headsign || null,
        };
      }

      await apiClient.put(`/api/breakdowns/${breakdown.breakdown_id}`, body);
    } catch (err) {
      console.error('Failed to save next trip action:', err);
    }
  }, [breakdown.breakdown_id, breakdown.next_trip, breakdown.route_id, breakdown.wizard_assessment_data?.route]);

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

  // Helper function to capitalize each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Reverse geocode coordinates to street name (same as Control Room)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];

        // Try to get street name first
        const route = result.address_components.find(
          comp => comp.types.includes('route')
        );

        if (route) {
          setGeocodedLocation(route.long_name);
        } else {
          // Fallback to locality (town/village)
          const locality = result.address_components.find(
            comp => comp.types.includes('locality') || comp.types.includes('postal_town')
          );

          if (locality) {
            setGeocodedLocation(locality.long_name);
          } else {
            // Use first part of formatted address
            setGeocodedLocation(result.formatted_address.split(',')[0]);
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, []);

  // Get standard procedure info based on issue type
  const rawIssueType = breakdown.issue_type || breakdown.wizard_type?.replace('Wizard', '') || 'General';
  const issueType = capitalizeWords(rawIssueType);
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

    // If we have geocoded location, use it instead of raw coordinates
    if (geocodedLocation) {
      return {
        primary: geocodedLocation,
        secondary: breakdown.depot || ''
      };
    }

    // Check if location is just coordinates
    const coords = extractCoordinates(location);
    if (coords && location.match(/^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/)) {
      // Show "Locating..." while geocoding
      return {
        primary: 'Locating...',
        secondary: breakdown.depot || ''
      };
    }

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

  // Trigger geocoding when coordinates are detected
  useEffect(() => {
    const location = breakdown.location || '';
    const coords = extractCoordinates(location);

    // If we have coordinates and no geocoded location yet, geocode them
    if (coords && !geocodedLocation) {
      reverseGeocode(coords.lat, coords.lng);
    }
  }, [breakdown.location, geocodedLocation, reverseGeocode]);
  
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

  // Define card sections for carousel
  const hasRoute = !!(breakdown.route_id || breakdown.wizard_assessment_data?.route);
  const cardSections = [
    { id: 'overview', title: 'Overview', icon: '📊' },
    { id: 'location', title: 'Location', icon: '📍' },
    { id: 'assessment', title: 'Assessment', icon: '🔍' },
    { id: 'details', title: 'Details', icon: '📋' },
    { id: 'timeline', title: 'Timeline', icon: '⏱️' },
    ...(hasRoute ? [{ id: 'journey', title: 'Journey', icon: '🚌' }] : [])
  ];

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : cardSections.length - 1));
  };

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev < cardSections.length - 1 ? prev + 1 : 0));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setActiveCardIndex(0); // Reset to first card when expanding
    }
  };

  return (
    <div
      className={`sdc-card-enhanced ${decisionInfo.class} ${slaStatus} ${isHighlighted ? 'highlighted' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Compact Header - Always Visible */}
      <div className="card-header-compact" onClick={toggleExpanded}>
        <div className="header-left">
          <div className="fleet-number-compact">
            {fleetNumber}
            {simplifiedVehicleType && (
              <span className="vehicle-type-compact"> • {simplifiedVehicleType}</span>
            )}
          </div>
          {breakdown.route_id && (
            <div className="route-badge-compact">
              Route {breakdown.route_id}
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Phase 7.4: Shift Ending Badge */}
          <ShiftEndingBadge compact />
          {/* Next Trip Countdown Badge */}
          <NextTripCountdownBadge
            nextTrip={breakdown.next_trip}
            nextTripAction={breakdown.next_trip_action}
            compact
            onAction={handleNextTripAction}
          />
          {breakdown.engineer_dispatched_at && breakdown.engineer_eta_minutes && !breakdown.engineer_on_site_at && (
            <EngineerEtaCountdown
              dispatchedAt={breakdown.engineer_dispatched_at}
              etaMinutes={breakdown.engineer_eta_minutes}
              onSite={!!breakdown.engineer_on_site_at}
              compact
            />
          )}
          {breakdown.isResolving && (
            <div className="resolving-badge">
              <span className="spinner">⏳</span>
              Resolving...
            </div>
          )}
          <div className={`timer-compact ${slaStatus}`}>
            {formatTime(timeElapsed)} ELAPSED
          </div>
          <button className="expand-toggle" onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Expanded Card Carousel - Only visible when expanded */}
      {isExpanded && (
        <div className="card-carousel">
          {/* Card Navigation */}
          <div className="carousel-navigation">
            <button className="nav-btn prev" onClick={handlePrevCard} aria-label="Previous card">
              ‹
            </button>
            <div className="carousel-dots">
              {cardSections.map((section, index) => (
                <button
                  key={section.id}
                  className={`dot ${index === activeCardIndex ? 'active' : ''}`}
                  onClick={() => setActiveCardIndex(index)}
                  aria-label={`Go to ${section.title}`}
                >
                  <span className="dot-icon">{section.icon}</span>
                  <span className="dot-label">{section.title}</span>
                </button>
              ))}
            </div>
            <button className="nav-btn next" onClick={handleNextCard} aria-label="Next card">
              ›
            </button>
          </div>

          {/* Card Content Container */}
          <div className="carousel-content">
            {/* Card 1: Overview */}
            {activeCardIndex === 0 && (
              <div className="info-card overview-card">
                <h3 className="card-title">
                  <span className="card-icon">📊</span>
                  Breakdown Overview
                </h3>
                <div className="overview-grid">
                  <div className="overview-item fleet-display">
                    <div className="overview-label">Fleet Number</div>
                    <div className="overview-value fleet-large">{fleetNumber}</div>
                    {simplifiedVehicleType && (
                      <div className="overview-subvalue">{simplifiedVehicleType}</div>
                    )}
                  </div>
                  <div className="overview-item">
                    <div className="overview-label">Time Elapsed</div>
                    <div className={`overview-value timer-large ${slaStatus}`}>
                      {formatTime(timeElapsed)}
                    </div>
                    <div className="overview-subvalue">
                      {slaStatus === 'breached' ? 'SLA Breached' :
                       slaStatus === 'warning' ? 'SLA Warning' :
                       'Within SLA'}
                    </div>
                  </div>
                  <div className="overview-item">
                    <div className="overview-label">Status</div>
                    <div className="overview-value">{breakdown.currentStage || 'Received'}</div>
                  </div>
                  <div className="overview-item">
                    <div className="overview-label">Breakdown ID</div>
                    <div className="overview-value breakdown-id">{breakdown.breakdown_id || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Card 2: Location */}
            {activeCardIndex === 1 && (
              <div className="info-card location-card">
                <h3 className="card-title">
                  <span className="card-icon">📍</span>
                  Location Details
                </h3>
                <div className="location-info-detailed">
                  <div className="location-text-large">
                    <div className="location-primary-large">{locationDetails.primary}</div>
                    {locationDetails.secondary && (
                      <div className="location-secondary-large">{locationDetails.secondary}</div>
                    )}
                  </div>
                  <div className="location-meta">
                    <div className="meta-item">
                      <span className="meta-label">Depot:</span>
                      <span className="meta-value">{depot}</span>
                    </div>
                    <div className="meta-item">
                      <DepotContactBadge
                        fleetNumber={fleetNumber}
                        depot={breakdown.depot}
                        size="medium"
                        showDepotName={true}
                        variant="inline"
                      />
                    </div>
                  </div>
                </div>
                {mapData && mapData.type === 'iframe' ? (
                  <div className="map-container-large">
                    <iframe
                      width="100%"
                      height="300"
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
                  <SimpleLocationMap
                    location={breakdown.location || 'Unknown'}
                    fleetNumber={fleetNumber}
                    depot={depot}
                  />
                )}
              </div>
            )}

            {/* Card 3: Assessment */}
            {activeCardIndex === 2 && (
              <div className="info-card assessment-card">
                <h3 className="card-title">
                  <span className="card-icon">🔍</span>
                  Assessment & Decision
                </h3>
                <div className="issue-display-large">
                  <div className="issue-icon-large">{sdcGuideInfo.icon}</div>
                  <div className="issue-info-large">
                    <h2 className="issue-type-large">{issueType}</h2>
                  </div>
                </div>
                <div className={`decision-display-large ${decisionInfo.class}`}>
                  <div className="decision-icon-large">{decisionInfo.icon}</div>
                  <div className="decision-content-large">
                    <span className="decision-text-large">{decisionInfo.text}</span>
                    <span className="decision-description-large">{decisionInfo.description}</span>
                  </div>
                </div>
                {decisionInfo.text !== 'PENDING' && (
                  <div className="recommended-actions">
                    <h4>Recommended Actions:</h4>
                    <div className="actions-list-large">
                      {decisionInfo.actions.map((action, index) => (
                        <div key={index} className="action-item">
                          <span className="action-number">{index + 1}</span>
                          <span className="action-text">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card 4: Details */}
            {activeCardIndex === 3 && (
              <div className="info-card details-card">
                <h3 className="card-title">
                  <span className="card-icon">📋</span>
                  Breakdown Details
                </h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Fleet Number</span>
                    <span className="detail-value">{fleetNumber}</span>
                  </div>
                  {simplifiedVehicleType && (
                    <div className="detail-row">
                      <span className="detail-label">Vehicle Type</span>
                      <span className="detail-value">{simplifiedVehicleType}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Depot</span>
                    <span className="detail-value">{depot}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Supervisor</span>
                    <span className="detail-value">{breakdown.supervisor_name || 'Unassigned'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Issue Type</span>
                    <span className="detail-value">{issueType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Decision</span>
                    <span className={`detail-value decision-badge ${decisionInfo.class}`}>
                      {decisionInfo.text}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Status</span>
                    <span className="detail-value">{breakdown.currentStage || 'Received'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Breakdown ID</span>
                    <span className="detail-value breakdown-id-mono">{breakdown.breakdown_id || 'N/A'}</span>
                  </div>
                  {breakdown.route_id && (
                    <div className="detail-row">
                      <span className="detail-label">Route</span>
                      <span className="detail-value">{breakdown.route_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card 5: Timeline */}
            {activeCardIndex === 4 && (
              <div className="info-card timeline-card">
                <h3 className="card-title">
                  <span className="card-icon">⏱️</span>
                  Progress Timeline
                </h3>
                <div className="timeline-display">
                  <div className="timeline-bar-vertical">
                    {stages.map((stage, index) => (
                      <div
                        key={stage}
                        className={`timeline-step-vertical ${index <= currentStageIndex ? 'completed' : ''} ${stage === breakdown.currentStage ? 'current' : ''}`}
                      >
                        <div className="step-connector" />
                        <div className="step-content">
                          <div className="step-dot-large">
                            {index <= currentStageIndex ? '✓' : index + 1}
                          </div>
                          <div className="step-info">
                            <div className="step-label-large">
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </div>
                            <div className="step-status">
                              {index < currentStageIndex ? 'Completed' :
                               index === currentStageIndex ? 'In Progress' :
                               'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="timeline-progress-bar">
                    <div
                      className="timeline-progress-fill"
                      style={{ height: `${stageProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Card 6: Journey (only if route exists) */}
            {hasRoute && activeCardIndex === cardSections.findIndex(s => s.id === 'journey') && (
              <div className="info-card journey-card">
                <h3 className="card-title">
                  <span className="card-icon">🚌</span>
                  Journey Link
                </h3>

                {/* Next Trip Countdown Alert (full mode) */}
                {breakdown.next_trip && !breakdown.next_trip_action && (
                  <NextTripCountdownBadge
                    nextTrip={breakdown.next_trip}
                    nextTripAction={breakdown.next_trip_action}
                    onAction={handleNextTripAction}
                  />
                )}
                {breakdown.next_trip_action && (
                  <div className="ntb-dismissed">
                    Next trip {breakdown.next_trip_action} &#10003;
                  </div>
                )}

                {linkedTrip && !showTripPicker ? (
                  <div className="journey-linked-display">
                    <div className="journey-linked-info">
                      {linkedTrip.departureTime ? (
                        <div className="journey-route-detail">
                          <span className="journey-time">{linkedTrip.departureTime?.substring(0, 5)}</span>
                          <span className="journey-stop">{linkedTrip.originStop || ''}</span>
                          <span className="journey-arrow">&rarr;</span>
                          <span className="journey-time">{linkedTrip.arrivalTime?.substring(0, 5) || ''}</span>
                          <span className="journey-stop">{linkedTrip.destStop || linkedTrip.headsign || ''}</span>
                        </div>
                      ) : (
                        <div className="journey-trip-id">Trip: {linkedTrip.tripId}</div>
                      )}
                      {linkedTrip.blockId && (
                        <div className="journey-block">Block: {linkedTrip.blockId}</div>
                      )}
                    </div>
                    <div className="journey-linked-actions">
                      <button
                        onClick={() => { setShowTripPicker(true); fetchTripsForRoute(); }}
                        className="btn-journey-action"
                      >
                        Change
                      </button>
                      <button
                        onClick={handleUnlinkTrip}
                        disabled={savingTrip}
                        className="btn-journey-action btn-journey-remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : !showTripPicker ? (
                  <div className="journey-empty">
                    <p>No journey linked to this breakdown yet.</p>
                    <button
                      onClick={() => { setShowTripPicker(true); fetchTripsForRoute(); }}
                      className="btn-journey-link"
                    >
                      + Link Journey
                    </button>
                  </div>
                ) : null}

                {showTripPicker && (
                  <div className="journey-picker">
                    <div className="journey-picker-header">
                      <span>Select Journey for Route {breakdown.route_id || breakdown.wizard_assessment_data?.route}</span>
                      <button onClick={() => setShowTripPicker(false)} className="journey-picker-close">&times;</button>
                    </div>
                    {loadingTrips && <div className="journey-picker-loading">Loading trips...</div>}
                    {!loadingTrips && availableTrips.length === 0 && (
                      <div className="journey-picker-empty">No scheduled trips found for this route</div>
                    )}
                    {!loadingTrips && availableTrips.length > 0 && (
                      <div className="journey-picker-list">
                        {availableTrips.map((trip) => (
                          <button
                            key={trip.tripId}
                            className={`journey-picker-item ${linkedTrip?.tripId === trip.tripId ? 'selected' : ''}`}
                            onClick={() => handleTripSelect(trip)}
                            disabled={savingTrip}
                          >
                            <span className="trip-time">{trip.departureTime?.substring(0, 5)}</span>
                            <span className="trip-route">
                              {trip.originStop || ''} &rarr; {trip.arrivalTime?.substring(0, 5) || ''} {trip.destStop || trip.headsign || ''}
                            </span>
                            <span className="trip-direction">{trip.directionId === 0 ? 'Outbound' : 'Inbound'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons - Always visible at bottom */}
      {isExpanded && (
        <div className="action-buttons-container">
          {/* Quick Decision Buttons - Show for acknowledged or when no decision */}
          {(breakdown.currentStage === 'acknowledged' || !breakdown.wizard_decision) && (
            <div className="quick-decision-section-enhanced">
              <QuickDecisionButtons
                breakdownId={breakdown.breakdown_id}
                currentDecision={breakdown.wizard_decision || breakdown.severity}
                onDecisionMade={(decision, data) => {
                  if (onQuickDecision) {
                    onQuickDecision(breakdown.breakdown_id, decision, data);
                  }
                }}
                compact={false}
              />
            </div>
          )}

          <div className="action-buttons">
            {breakdown.currentStage === 'received' && (
              <button className="btn btn-acknowledge" onClick={() => onAcknowledge(breakdown.breakdown_id)}>
                <span>✓</span> Acknowledge
              </button>
            )}
            {breakdown.currentStage === 'acknowledged' && (
              <button className="btn btn-decision" onClick={() => onMakeDecision(breakdown.breakdown_id)}>
                <span>📋</span> Full Assessment
              </button>
            )}
            {breakdown.currentStage === 'decision' && (
              <button className="btn btn-engineering" onClick={() => onRequestEngineering(breakdown.breakdown_id)}>
                <span>🔧</span> Engineering
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
            {onResolve && breakdown.status !== 'resolved' && (
              <button className="btn btn-resolve" onClick={onResolve}>
                <span>✅</span> Resolve
              </button>
            )}
            <button className="btn btn-contact" onClick={() => onContact ? onContact(breakdown) : null}>
              <span>📞</span> Contact
            </button>
            {/* Dispatch Replacement - show when STOP severity or replacement required, and no replacement dispatched yet */}
            {onDispatchReplacement && !breakdown.replacement_vehicle &&
              (breakdown.severity === 'STOP' || breakdown.wizard_decision === 'STOP' || breakdown.replacement_vehicle_required) && (
              <button className="btn btn-replacement" onClick={() => onDispatchReplacement(breakdown)}>
                <span>🚌</span> Replacement
              </button>
            )}
            {/* Return to Service - show when replacement dispatched but not yet in service */}
            {onReturnToService && breakdown.replacement_vehicle && breakdown.replacement_vehicle.status === 'dispatched' && (
              <button className="btn btn-return-service" onClick={() => onReturnToService(breakdown)}>
                <span>📍</span> Return to Service
              </button>
            )}
          </div>

          {/* Replacement Vehicle Info */}
          {breakdown.replacement_vehicle && (
            <div className="rv-info-section">
              <div className="rv-info-header">Replacement Vehicle</div>
              <div className="rv-info-grid">
                <div className="rv-info-item">
                  <span className="rv-info-label">Fleet</span>
                  <span className="rv-info-value">{breakdown.replacement_vehicle.replacement_fleet_no}</span>
                </div>
                <div className="rv-info-item">
                  <span className="rv-info-label">From</span>
                  <span className="rv-info-value">{breakdown.replacement_vehicle.sending_depot_name}</span>
                </div>
                <div className="rv-info-item">
                  <span className="rv-info-label">Dead mi</span>
                  <span className="rv-info-value">{breakdown.replacement_vehicle.dead_miles ?? 'N/A'}</span>
                </div>
                {breakdown.replacement_vehicle.pickup_miles != null && (
                  <div className="rv-info-item">
                    <span className="rv-info-label">Pickup mi</span>
                    <span className="rv-info-value">{breakdown.replacement_vehicle.pickup_miles}</span>
                  </div>
                )}
                {breakdown.replacement_vehicle.total_dead_miles != null && breakdown.replacement_vehicle.status === 'in_service' && (
                  <div className="rv-info-item rv-info-total">
                    <span className="rv-info-label">Total dead</span>
                    <span className="rv-info-value">{breakdown.replacement_vehicle.total_dead_miles}</span>
                  </div>
                )}
              </div>
              <div className={`rv-status-badge rv-status-${breakdown.replacement_vehicle.status}`}>
                {breakdown.replacement_vehicle.status === 'dispatched' ? 'En Route' : 'In Service'}
              </div>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
});

SDCBreakdownCardEnhanced.displayName = 'SDCBreakdownCardEnhanced';

export default SDCBreakdownCardEnhanced;
