/**
 * Activity Feed Filters Component
 * Provides filtering and search controls for the activity feed
 * Features: Depot, Severity, Activity Type, Time Range filters + Fleet Number search
 */

import React, { useState, useEffect } from 'react';
import './ActivityFeedFilters.css';

const DEPOTS = [
  { value: 'all', label: 'All Depots' },
  { value: 'Washington', label: 'Washington' },
  { value: 'Riverside', label: 'Riverside' },
  { value: 'Consett', label: 'Consett' },
  { value: 'Deptford', label: 'Deptford' },
  { value: 'Percy Main', label: 'Percy Main' },
  { value: 'Hexham', label: 'Hexham' }
];

const SEVERITY_LEVELS = [
  { value: 'all', label: 'All Severities', icon: '🔍', color: '#6B7280' },
  { value: 'critical', label: 'Critical', icon: '🚨', color: '#DC2626' },
  { value: 'warning', label: 'Warning', icon: '⚠️', color: '#F59E0B' },
  { value: 'normal', label: 'Normal', icon: '✅', color: '#10B981' },
  { value: 'info', label: 'Info', icon: 'ℹ️', color: '#3B82F6' }
];

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities' },
  { value: 'breakdown_reported', label: 'Breakdowns Reported' },
  { value: 'breakdown_resolved', label: 'Breakdowns Resolved' },
  { value: 'wizard_completed', label: 'Assessments Completed' },
  { value: 'engineer_assigned', label: 'Engineer Assigned' },
  { value: 'engineer_on_site', label: 'Engineer On Site' }
];

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last Hour' },
  { value: '4h', label: 'Last 4 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' }
];

const ActivityFeedFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    depot: initialFilters.depot || 'all',
    severity: initialFilters.severity || 'all',
    activityType: initialFilters.activityType || 'all',
    timeRange: initialFilters.timeRange || 'all',
    searchTerm: initialFilters.searchTerm || ''
  });
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value, index) => {
      const keys = Object.keys(filters);
      return keys[index] !== 'searchTerm' && value !== 'all' && value !== '';
    }
  ).length + (filters.searchTerm ? 1 : 0);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      handleFilterChange('searchTerm', value);
    }, 500); // 500ms debounce

    setSearchDebounceTimer(timer);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      depot: 'all',
      severity: 'all',
      activityType: 'all',
      timeRange: 'all',
      searchTerm: ''
    };
    setFilters(clearedFilters);
    setSearchInput('');
    onFiltersChange(clearedFilters);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  return (
    <div className="activity-feed-filters">
      {/* Filter Header */}
      <div className="filters-header">
        <div className="filters-title">
          <span className="filter-icon">🔍</span>
          <h3>Filters</h3>
          {activeFilterCount > 0 && (
            <span className="active-filter-badge">{activeFilterCount}</span>
          )}
        </div>
        <div className="filters-actions">
          {activeFilterCount > 0 && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear All
            </button>
          )}
          <button
            className={`toggle-filters-btn ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse filters' : 'Expand filters'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Search Bar (Always Visible) */}
      <div className="search-bar-container">
        <div className="search-bar">
          <span className="search-icon">🔎</span>
          <input
            type="text"
            placeholder="Search by fleet number, location, or supervisor..."
            value={searchInput}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchInput && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchInput('');
                handleFilterChange('searchTerm', '');
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filters */}
      {expanded && (
        <div className="filters-content">
          {/* Time Range Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-icon">⏰</span>
              Time Range
            </label>
            <div className="filter-options time-range-options">
              {TIME_RANGES.map(range => (
                <button
                  key={range.value}
                  className={`filter-option-btn ${filters.timeRange === range.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange('timeRange', range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-icon">🚦</span>
              Severity
            </label>
            <div className="filter-options severity-options">
              {SEVERITY_LEVELS.map(severity => (
                <button
                  key={severity.value}
                  className={`filter-option-btn severity-btn ${filters.severity === severity.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange('severity', severity.value)}
                  style={{
                    '--severity-color': severity.color
                  }}
                >
                  <span className="severity-icon">{severity.icon}</span>
                  {severity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Depot Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-icon">🏢</span>
              Depot
            </label>
            <select
              className="filter-select"
              value={filters.depot}
              onChange={(e) => handleFilterChange('depot', e.target.value)}
            >
              {DEPOTS.map(depot => (
                <option key={depot.value} value={depot.value}>
                  {depot.label}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-icon">📋</span>
              Activity Type
            </label>
            <select
              className="filter-select"
              value={filters.activityType}
              onChange={(e) => handleFilterChange('activityType', e.target.value)}
            >
              {ACTIVITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Quick Filter Chips (Visible when filters are active) */}
      {activeFilterCount > 0 && (
        <div className="active-filters-chips">
          {filters.timeRange !== 'all' && (
            <div className="filter-chip">
              <span className="chip-icon">⏰</span>
              {TIME_RANGES.find(r => r.value === filters.timeRange)?.label}
              <button
                className="remove-chip-btn"
                onClick={() => handleFilterChange('timeRange', 'all')}
              >
                ×
              </button>
            </div>
          )}
          {filters.severity !== 'all' && (
            <div className="filter-chip severity-chip">
              <span className="chip-icon">
                {SEVERITY_LEVELS.find(s => s.value === filters.severity)?.icon}
              </span>
              {SEVERITY_LEVELS.find(s => s.value === filters.severity)?.label}
              <button
                className="remove-chip-btn"
                onClick={() => handleFilterChange('severity', 'all')}
              >
                ×
              </button>
            </div>
          )}
          {filters.depot !== 'all' && (
            <div className="filter-chip">
              <span className="chip-icon">🏢</span>
              {DEPOTS.find(d => d.value === filters.depot)?.label}
              <button
                className="remove-chip-btn"
                onClick={() => handleFilterChange('depot', 'all')}
              >
                ×
              </button>
            </div>
          )}
          {filters.activityType !== 'all' && (
            <div className="filter-chip">
              <span className="chip-icon">📋</span>
              {ACTIVITY_TYPES.find(t => t.value === filters.activityType)?.label}
              <button
                className="remove-chip-btn"
                onClick={() => handleFilterChange('activityType', 'all')}
              >
                ×
              </button>
            </div>
          )}
          {filters.searchTerm && (
            <div className="filter-chip search-chip">
              <span className="chip-icon">🔍</span>
              "{filters.searchTerm}"
              <button
                className="remove-chip-btn"
                onClick={() => {
                  setSearchInput('');
                  handleFilterChange('searchTerm', '');
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeedFilters;
