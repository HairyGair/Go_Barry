import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api-client';
import './HighlightBreakdownModal.css';

/**
 * HighlightBreakdownModal - Select a breakdown to highlight on engineering displays
 *
 * Props:
 * - onClose: Function to close modal
 * - onHighlight: Function(breakdownId) called when breakdown selected
 * - displayId: Target display ID (or null for bulk)
 * - depot: Target depot (for filtering)
 * - bulk: Boolean - true if highlighting on all displays in depot
 */
export default function HighlightBreakdownModal({
  onClose,
  onHighlight,
  displayId,
  depot,
  bulk = false
}) {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch current breakdowns
  useEffect(() => {
    const fetchBreakdowns = async () => {
      try {
        const response = await apiClient.get('/breakdowns/live');
        let data = response.data || [];

        // Filter by depot if specified
        if (depot) {
          data = data.filter(b => b.depot === depot);
        }

        // Sort by severity and time
        data.sort((a, b) => {
          const severityOrder = { STOP: 0, AMBER: 1, CONTINUE: 2 };
          const severityDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
          if (severityDiff !== 0) return severityDiff;
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setBreakdowns(data);
      } catch (err) {
        console.error('Error fetching breakdowns:', err);
        setError('Failed to load breakdowns');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdowns();
  }, [depot]);

  // Filter breakdowns by search term
  const filteredBreakdowns = breakdowns.filter(b =>
    b.breakdown_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.fleet_no?.toString().includes(searchTerm) ||
    b.location_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.issue_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedBreakdown) {
      onHighlight(selectedBreakdown.breakdown_id);
    }
  };

  // Severity badge component
  const SeverityBadge = ({ severity }) => {
    const severityClass = severity?.toLowerCase() || 'unknown';
    return (
      <span className={`severity-badge ${severityClass}`}>
        {severity || 'UNKNOWN'}
      </span>
    );
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content highlight-breakdown-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            {bulk ? `Highlight on All ${depot} Displays` : `Highlight Breakdown on Display`}
          </h2>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Display info */}
        {!bulk && displayId && (
          <div className="modal-info">
            <p>Select a breakdown to highlight on display <strong>{displayId}</strong></p>
          </div>
        )}

        {bulk && (
          <div className="modal-info bulk-warning">
            <span className="warning-icon">⚠️</span>
            <p>This will highlight the selected breakdown on all online displays in {depot}</p>
          </div>
        )}

        {/* Search bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by ID, fleet number, location, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        {/* Breakdown list */}
        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading breakdowns...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : filteredBreakdowns.length === 0 ? (
            <div className="empty-state">
              <p>
                {searchTerm
                  ? 'No breakdowns match your search'
                  : depot
                  ? `No active breakdowns in ${depot}`
                  : 'No active breakdowns'}
              </p>
            </div>
          ) : (
            <div className="breakdowns-list">
              {filteredBreakdowns.map(breakdown => (
                <div
                  key={breakdown.id}
                  className={`breakdown-item ${
                    selectedBreakdown?.id === breakdown.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedBreakdown(breakdown)}
                >
                  {/* Selection indicator */}
                  <div className="selection-radio">
                    <input
                      type="radio"
                      name="breakdown"
                      checked={selectedBreakdown?.id === breakdown.id}
                      onChange={() => setSelectedBreakdown(breakdown)}
                    />
                  </div>

                  {/* Breakdown info */}
                  <div className="breakdown-details">
                    <div className="breakdown-header">
                      <span className="breakdown-id">{breakdown.breakdown_id}</span>
                      <span className="fleet-no">Fleet {breakdown.fleet_no}</span>
                      <SeverityBadge severity={breakdown.severity} />
                    </div>

                    <div className="breakdown-info">
                      <p className="location">
                        📍 {breakdown.location_description || 'Location not specified'}
                      </p>
                      {breakdown.issue_category && (
                        <p className="category">
                          🔧 {breakdown.issue_category}
                        </p>
                      )}
                      <p className="time">
                        🕐 {formatTimeAgo(breakdown.created_at)}
                      </p>
                    </div>

                    {breakdown.wizard_decision && (
                      <div className="wizard-decision">
                        Decision: {breakdown.wizard_decision}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="confirm-btn"
            disabled={!selectedBreakdown}
          >
            {bulk ? 'Highlight on All Displays' : 'Highlight on Display'}
          </button>
        </div>
      </div>
    </div>
  );
}
