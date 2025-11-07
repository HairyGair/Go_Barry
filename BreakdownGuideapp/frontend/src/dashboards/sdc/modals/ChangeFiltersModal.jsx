import React, { useState, useEffect } from 'react';
import './ChangeFiltersModal.css';

/**
 * ChangeFiltersModal - Configure which breakdown statuses to show on display
 *
 * Props:
 * - onClose: Function to close modal
 * - onSave: Function(filters) called with selected filter configuration
 * - currentFilters: Current filter string (e.g., "pending,in-progress")
 */
export default function ChangeFiltersModal({ onClose, onSave, currentFilters = '' }) {
  // Parse current filters into checkbox state
  const parseFilters = (filterString) => {
    const filters = filterString.split(',').map(f => f.trim()).filter(Boolean);
    return {
      pending: filters.includes('pending'),
      inProgress: filters.includes('in-progress') || filters.includes('in_progress'),
      resolved: filters.includes('resolved')
    };
  };

  const [filters, setFilters] = useState(parseFilters(currentFilters));

  // Handle checkbox change
  const handleCheckboxChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Handle save
  const handleSave = () => {
    const selectedFilters = [];
    if (filters.pending) selectedFilters.push('pending');
    if (filters.inProgress) selectedFilters.push('in-progress');
    if (filters.resolved) selectedFilters.push('resolved');

    // At least one filter must be selected
    if (selectedFilters.length === 0) {
      alert('Please select at least one status to display');
      return;
    }

    onSave({
      statuses: selectedFilters,
      filterString: selectedFilters.join(',')
    });
  };

  // Handle preset selections
  const handlePreset = (preset) => {
    switch (preset) {
      case 'active':
        setFilters({ pending: true, inProgress: true, resolved: false });
        break;
      case 'all':
        setFilters({ pending: true, inProgress: true, resolved: true });
        break;
      case 'urgent':
        setFilters({ pending: true, inProgress: false, resolved: false });
        break;
      default:
        break;
    }
  };

  const atLeastOneSelected = filters.pending || filters.inProgress || filters.resolved;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content change-filters-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Change Display Filters</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="modal-info">
          <p>Select which breakdown statuses should be shown on the display</p>
        </div>

        {/* Preset buttons */}
        <div className="presets-section">
          <label className="section-label">Quick Presets:</label>
          <div className="preset-buttons">
            <button
              onClick={() => handlePreset('active')}
              className="preset-btn"
              title="Show pending and in-progress only"
            >
              Active Only
            </button>
            <button
              onClick={() => handlePreset('urgent')}
              className="preset-btn"
              title="Show pending only"
            >
              Urgent Only
            </button>
            <button
              onClick={() => handlePreset('all')}
              className="preset-btn"
              title="Show all statuses"
            >
              All Statuses
            </button>
          </div>
        </div>

        {/* Filter checkboxes */}
        <div className="modal-body">
          <div className="filters-section">
            <label className="section-label">Status Filters:</label>

            <div className="filter-options">
              {/* Pending */}
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.pending}
                  onChange={() => handleCheckboxChange('pending')}
                />
                <div className="checkbox-content">
                  <div className="checkbox-header">
                    <span className="status-badge pending">PENDING</span>
                    <span className="checkbox-label">Pending Breakdowns</span>
                  </div>
                  <p className="checkbox-description">
                    Breakdowns awaiting engineer assignment or initial response
                  </p>
                </div>
              </label>

              {/* In Progress */}
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.inProgress}
                  onChange={() => handleCheckboxChange('inProgress')}
                />
                <div className="checkbox-content">
                  <div className="checkbox-header">
                    <span className="status-badge in-progress">IN PROGRESS</span>
                    <span className="checkbox-label">In Progress Breakdowns</span>
                  </div>
                  <p className="checkbox-description">
                    Breakdowns currently being worked on by engineers
                  </p>
                </div>
              </label>

              {/* Resolved */}
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.resolved}
                  onChange={() => handleCheckboxChange('resolved')}
                />
                <div className="checkbox-content">
                  <div className="checkbox-header">
                    <span className="status-badge resolved">RESOLVED</span>
                    <span className="checkbox-label">Resolved Breakdowns</span>
                  </div>
                  <p className="checkbox-description">
                    Completed breakdowns (typically hidden on live displays)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Validation warning */}
          {!atLeastOneSelected && (
            <div className="validation-warning">
              ⚠️ At least one status must be selected
            </div>
          )}
        </div>

        {/* Current selection summary */}
        <div className="selection-summary">
          <strong>Selected:</strong>{' '}
          {[
            filters.pending && 'Pending',
            filters.inProgress && 'In Progress',
            filters.resolved && 'Resolved'
          ]
            .filter(Boolean)
            .join(', ') || 'None'}
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="confirm-btn"
            disabled={!atLeastOneSelected}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
