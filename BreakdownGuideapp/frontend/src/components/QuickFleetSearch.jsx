/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import apiClient from '../services/api-client';
import { useAuth } from '../contexts/AuthContext';
import './QuickFleetSearch.css';

const QuickFleetSearch = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [shiftHistory, setShiftHistory] = useState([]); // Phase 7.3: Shift vehicle history
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Get current duty info from sessionStorage
  const currentDuty = useMemo(() => {
    const stored = sessionStorage.getItem('currentDuty');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Get shift start time (user login time or duty start time)
  const shiftStartTime = useMemo(() => {
    // Priority: duty selection time > login time
    if (currentDuty?.selectedAt) {
      return currentDuty.selectedAt;
    }
    if (currentUser?.loginTime) {
      return currentUser.loginTime;
    }
    // Default to 8 hours ago if no session info
    return Date.now() - (8 * 60 * 60 * 1000);
  }, [currentDuty, currentUser]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fleetSearchRecents');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Phase 7.3: Load and filter shift history on mount and when shift changes
  useEffect(() => {
    const stored = localStorage.getItem('fleetShiftHistory');
    if (stored) {
      try {
        const allHistory = JSON.parse(stored);
        // Filter to only show vehicles accessed during current shift
        const currentShiftHistory = allHistory.filter(
          item => item.accessedAt >= shiftStartTime
        );
        setShiftHistory(currentShiftHistory);
      } catch (e) {
        console.error('Failed to parse shift history:', e);
      }
    }
  }, [shiftStartTime]);

  // Keyboard shortcuts: Focus on "/" key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // ESC to close dropdown or modal
      if (e.key === 'Escape') {
        if (isModalOpen) {
          closeModal();
        } else if (isDropdownOpen) {
          setIsDropdownOpen(false);
          setSearchTerm('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isDropdownOpen]);

  // Handle keyboard navigation in dropdown
  const handleKeyNavigation = (e) => {
    const resultsToShow = searchTerm.trim().length >= 2 ? searchResults : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < resultsToShow.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectVehicle(resultsToShow[highlightedIndex]);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
      setHighlightedIndex(-1);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const performSearch = async (term) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/fleet/search/${encodeURIComponent(term)}`);
      // apiClient.get() returns the JSON data directly (not wrapped in response.data)
      const results = Array.isArray(response) ? response : (response.data || []);
      console.log('🔍 Fleet search results:', results);
      setSearchResults(results.slice(0, 5)); // Top 5 matches
      setIsDropdownOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim().length === 0) {
      setIsDropdownOpen(true); // Show recent searches
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  // Phase 7.3: Add vehicle to shift history
  const addToShiftHistory = (vehicle) => {
    const historyItem = {
      ...vehicle,
      accessedAt: Date.now()
    };

    // Load existing history
    let allHistory = [];
    const stored = localStorage.getItem('fleetShiftHistory');
    if (stored) {
      try {
        allHistory = JSON.parse(stored);
      } catch (e) {
        allHistory = [];
      }
    }

    // Add new item at beginning, remove duplicates, keep last 50 entries
    const newHistory = [
      historyItem,
      ...allHistory.filter(v => v.fleet_no !== vehicle.fleet_no)
    ].slice(0, 50);

    localStorage.setItem('fleetShiftHistory', JSON.stringify(newHistory));

    // Update current shift history state
    const currentShiftHistory = newHistory.filter(
      item => item.accessedAt >= shiftStartTime
    );
    setShiftHistory(currentShiftHistory);
  };

  const handleSelectVehicle = async (vehicle) => {
    // Add to recent searches (FIXED: use fleet_no not fleet_number)
    const newRecents = [
      vehicle,
      ...recentSearches.filter(v => v.fleet_no !== vehicle.fleet_no)
    ].slice(0, 5);

    setRecentSearches(newRecents);
    localStorage.setItem('fleetSearchRecents', JSON.stringify(newRecents));

    // Phase 7.3: Add to shift history
    addToShiftHistory(vehicle);

    // Fetch full vehicle details (FIXED: use fleet_no not fleet_number)
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${vehicle.fleet_no}`);
      setSelectedVehicle(response.data);
      setIsModalOpen(true);
      setIsDropdownOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error);
      // Show basic info from search result
      setSelectedVehicle(vehicle);
      setIsModalOpen(true);
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !searchInputRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resultsToShow = searchTerm.trim().length >= 2 ? searchResults : recentSearches;

  // Phase 7.3: Format time since accessed
  const formatTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <div className="quick-fleet-search">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search fleet number or registration... (press /)"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyNavigation}
          />
          {isLoading && <span className="loading-indicator">⏳</span>}
        </div>

        {isDropdownOpen && (
          <div ref={dropdownRef} className="search-dropdown">
            {/* Phase 7.3: Show Shift History when not searching */}
            {searchTerm.trim().length < 2 && shiftHistory.length > 0 && (
              <div className="shift-history-section">
                <div className="shift-history-header">
                  <span className="shift-history-icon">📋</span>
                  <span>Your Shift Vehicles</span>
                  {currentDuty?.code && (
                    <span className="shift-duty-badge">Duty {currentDuty.code}</span>
                  )}
                </div>
                <div className="shift-history-pills">
                  {shiftHistory.slice(0, 8).map((vehicle) => (
                    <button
                      key={`shift-${vehicle.fleet_no}`}
                      className="shift-history-pill"
                      onClick={() => handleSelectVehicle(vehicle)}
                      title={`${vehicle.registration || ''} • ${formatTimeSince(vehicle.accessedAt)}`}
                    >
                      <span className="pill-fleet-no">{vehicle.fleet_no}</span>
                      <span className="pill-time">{formatTimeSince(vehicle.accessedAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {resultsToShow.length === 0 ? (
              <div className="search-dropdown-empty">
                {searchTerm.trim().length >= 2 ? (
                  'No vehicles found'
                ) : searchTerm.trim().length > 0 ? (
                  'Type at least 2 characters...'
                ) : shiftHistory.length === 0 ? (
                  'Start typing to search...'
                ) : null}
              </div>
            ) : (
              <>
                {searchTerm.trim().length < 2 && (
                  <div className="search-dropdown-header">Recent Searches</div>
                )}
                {resultsToShow.map((vehicle, index) => (
                  <div
                    key={vehicle.fleet_no || index}
                    className={`search-result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <div className="result-fleet-number">{vehicle.fleet_no}</div>
                    <div className="result-details">
                      <span className="result-registration">{vehicle.registration}</span>
                      {vehicle.vehicle_type && (
                        <>
                          <span className="result-separator">•</span>
                          <span className="result-type">{vehicle.vehicle_type}</span>
                        </>
                      )}
                      {vehicle.depot && (
                        <>
                          <span className="result-separator">•</span>
                          <span className="result-depot">{vehicle.depot}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Vehicle Details Modal */}
      {isModalOpen && selectedVehicle && (
        <div className="fleet-modal-overlay" onClick={closeModal}>
          <div className="fleet-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>×</button>

            <div className="modal-header">
              <h2>Fleet #{selectedVehicle.fleet_no}</h2>
            </div>

            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <label>Registration</label>
                  <div className="modal-info-value">{selectedVehicle.registration || 'N/A'}</div>
                </div>

                <div className="modal-info-item">
                  <label>Vehicle Type</label>
                  <div className="modal-info-value">{selectedVehicle.vehicle_type || 'N/A'}</div>
                </div>

                <div className="modal-info-item">
                  <label>Depot</label>
                  <div className="modal-info-value">{selectedVehicle.depot || 'N/A'}</div>
                </div>

                {selectedVehicle.make && (
                  <div className="modal-info-item">
                    <label>Make</label>
                    <div className="modal-info-value">{selectedVehicle.make}</div>
                  </div>
                )}

                {selectedVehicle.model && (
                  <div className="modal-info-item">
                    <label>Model</label>
                    <div className="modal-info-value">{selectedVehicle.model}</div>
                  </div>
                )}

                {selectedVehicle.year && (
                  <div className="modal-info-item">
                    <label>Year</label>
                    <div className="modal-info-value">{selectedVehicle.year}</div>
                  </div>
                )}

                {selectedVehicle.capacity && (
                  <div className="modal-info-item">
                    <label>Capacity</label>
                    <div className="modal-info-value">{selectedVehicle.capacity} passengers</div>
                  </div>
                )}

                {selectedVehicle.fuel_type && (
                  <div className="modal-info-item">
                    <label>Fuel Type</label>
                    <div className="modal-info-value">{selectedVehicle.fuel_type}</div>
                  </div>
                )}
              </div>

              {selectedVehicle.current_breakdown && (
                <div className="modal-alert">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <strong>Active Breakdown</strong>
                    <p>{selectedVehicle.current_breakdown.issue || 'In service'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickFleetSearch;
