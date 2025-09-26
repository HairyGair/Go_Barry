/**
 * Example Integration: Storage Service with Fleet Selection Modal
 * This shows how to use the storage service in your components
 */

import React, { useState, useEffect } from 'react';
import { useFrequentRoutes, useRecentFleetNumbers, useBreakdownDraft } from '../../hooks/useStorage';
import storageService from '../../services/storageService';
import './FleetSelectionModal.css';

// Example of updated Fleet Selection Modal with route selection
const FleetSelectionModalExample = ({ isOpen, onClose, onConfirm }) => {
  const [fleetNumber, setFleetNumber] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [showRouteSearch, setShowRouteSearch] = useState(false);
  
  // Use storage hooks
  const { topRoutes, updateRoute } = useFrequentRoutes();
  const { recentFleetNumbers, saveFleetNumber } = useRecentFleetNumbers();
  const { saveDraft } = useBreakdownDraft();
  
  // Example route list (this would come from your GTFS data)
  const allRoutes = [
    { id: 'X10', name: 'Newcastle to Middlesbrough' },
    { id: '21', name: 'Newcastle to Durham' },
    { id: '56', name: 'Sunderland to Newcastle' },
    { id: 'X1', name: 'Newcastle to Washington' },
    { id: '309', name: 'Newcastle to Blyth' },
    { id: '310', name: 'Newcastle to North Shields' },
    { id: '57', name: 'Newcastle to Ashington' },
    { id: 'X9', name: 'Newcastle to Middlesbrough Express' },
    { id: 'Q3', name: 'Great Park to City Centre' },
    { id: '1', name: 'Whitley Bay to North Shields' }
  ];

  // Filter routes based on search
  const filteredRoutes = allRoutes.filter(route =>
    route.id.toLowerCase().includes(routeSearch.toLowerCase()) ||
    route.name.toLowerCase().includes(routeSearch.toLowerCase())
  );

  // Handle fleet number input with autocomplete from recent
  const handleFleetNumberChange = (e) => {
    const value = e.target.value;
    setFleetNumber(value);
    
    // Save draft as user types
    saveDraft({
      fleetNumber: value,
      route: selectedRoute,
      timestamp: new Date().toISOString()
    });
  };

  // Handle route selection
  const handleRouteSelect = (routeId) => {
    const route = allRoutes.find(r => r.id === routeId);
    setSelectedRoute(routeId);
    setShowRouteSearch(false);
    setRouteSearch('');
    
    // Update draft
    saveDraft({
      fleetNumber: fleetNumber,
      route: routeId,
      routeName: route?.name,
      timestamp: new Date().toISOString()
    });
  };

  // Handle form submission
  const handleConfirm = () => {
    if (fleetNumber && selectedRoute) {
      // Save to recent/frequent lists
      saveFleetNumber(fleetNumber);
      const route = allRoutes.find(r => r.id === selectedRoute);
      updateRoute(selectedRoute, route?.name);
      
      // Pass data to parent
      onConfirm({
        fleetNumber,
        route: selectedRoute,
        routeName: route?.name
      });
      
      // Clear draft since we're submitting
      storageService.clearDraft();
      
      // Clear form
      setFleetNumber('');
      setSelectedRoute('');
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content fleet-selection-modal">
        <h2>Select Bus and Route</h2>
        
        {/* Fleet Number Input with Recent Suggestions */}
        <div className="form-group">
          <label>Fleet Number</label>
          <input
            type="text"
            placeholder="Enter fleet number (e.g., 5801)"
            value={fleetNumber}
            onChange={handleFleetNumberChange}
            className="fleet-input"
            autoFocus
            list="recent-fleet"
          />
          <datalist id="recent-fleet">
            {recentFleetNumbers.slice(0, 10).map(num => (
              <option key={num} value={num} />
            ))}
          </datalist>
        </div>

        {/* Route Selection Section */}
        <div className="form-group">
          <label>Route</label>
          
          {/* Quick Select Buttons for Top Routes */}
          {topRoutes.length > 0 && (
            <div className="quick-routes">
              <span className="quick-label">Quick Select:</span>
              <div className="route-buttons">
                {topRoutes.map(routeId => {
                  const route = allRoutes.find(r => r.id === routeId);
                  return (
                    <button
                      key={routeId}
                      className={`route-btn ${selectedRoute === routeId ? 'selected' : ''}`}
                      onClick={() => handleRouteSelect(routeId)}
                      type="button"
                    >
                      {routeId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Search for Other Routes */}
          <div className="route-search-section">
            {!showRouteSearch ? (
              <button 
                className="search-toggle"
                onClick={() => setShowRouteSearch(true)}
                type="button"
              >
                🔍 Search other routes...
              </button>
            ) : (
              <div className="route-search-box">
                <input
                  type="text"
                  placeholder="Type route number or name..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="route-search-input"
                />
                {routeSearch && (
                  <div className="route-suggestions">
                    {filteredRoutes.slice(0, 5).map(route => (
                      <button
                        key={route.id}
                        className="route-suggestion"
                        onClick={() => handleRouteSelect(route.id)}
                        type="button"
                      >
                        <span className="route-id">{route.id}</span>
                        <span className="route-name">{route.name}</span>
                      </button>
                    ))}
                    {filteredRoutes.length === 0 && (
                      <div className="no-results">No routes found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Selected Route Display */}
          {selectedRoute && (
            <div className="selected-route">
              <span className="selected-label">Selected:</span>
              <span className="selected-value">
                {selectedRoute} - {allRoutes.find(r => r.id === selectedRoute)?.name}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button 
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!fleetNumber || !selectedRoute}
            type="button"
          >
            Continue
          </button>
        </div>

        {/* Draft Indicator */}
        <div className="draft-indicator">
          <small>✓ Auto-saving draft...</small>
        </div>
      </div>
    </div>
  );
};

// =========================================
// Example of Activity Feed using storage
// =========================================

const ActivityFeedExample = () => {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    // Load from storage on mount
    const cached = storageService.getActivityFeed();
    setActivities(cached);
    
    // Listen for new breakdowns
    const handleBreakdownReported = (event) => {
      const newActivity = {
        id: event.detail.id,
        busNumber: event.detail.fleetNumber,
        route: event.detail.route,
        location: event.detail.location,
        issue: event.detail.issue,
        passengersOnBoard: event.detail.passengersOnBoard,
        timestamp: new Date().toISOString(),
        status: 'active',
        reportedBy: event.detail.supervisorName
      };
      
      // Add to storage and update state
      const updatedFeed = storageService.addActivityItem(newActivity);
      setActivities(updatedFeed);
    };
    
    window.addEventListener('breakdownReported', handleBreakdownReported);
    return () => window.removeEventListener('breakdownReported', handleBreakdownReported);
  }, []);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'amber';
      case 'critical': return 'stop';
      case 'resolved': return 'continue';
      default: return 'amber';
    }
  };
  
  const formatActivityText = (activity) => {
    const status = getStatusColor(activity.status);
    
    if (status === 'amber') {
      // Show route and location
      return `Route ${activity.route} • ${activity.location}`;
    } else if (status === 'stop') {
      // Show issue and passenger status
      const passengerText = activity.passengersOnBoard ? 'Passengers on board' : 'No passengers';
      return `${activity.issue} • ${passengerText}`;
    } else {
      // Show resolution status
      const engineerStatus = activity.engineerAssigned ? 'Engineer assigned' : 'Awaiting engineer';
      return `${engineerStatus} • Route ${activity.route}`;
    }
  };
  
  return (
    <div className="activity-feed">
      <h3>Live Activity Feed</h3>
      <div className="activity-list">
        {activities.map(activity => (
          <div key={activity.id} className={`activity-item ${getStatusColor(activity.status)}`}>
            <div className="activity-icon">
              {activity.status === 'critical' ? '🔴' : 
               activity.status === 'resolved' ? '🟢' : '🟡'}
            </div>
            <div className="activity-content">
              <div className="activity-header">
                {activity.reportedBy} reported breakdown on {activity.busNumber}
              </div>
              <div className="activity-details">
                {formatActivityText(activity)}
              </div>
              <div className="activity-time">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { FleetSelectionModalExample, ActivityFeedExample };