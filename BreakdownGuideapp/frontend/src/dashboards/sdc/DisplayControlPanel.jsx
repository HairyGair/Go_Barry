import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api-client';
import HighlightBreakdownModal from './modals/HighlightBreakdownModal';
import ChangeFiltersModal from './modals/ChangeFiltersModal';
import ChangeDepotModal from './modals/ChangeDepotModal';
import './DisplayControlPanel.css';

/**
 * DisplayControlPanel - Remote control interface for engineering displays
 *
 * Features:
 * - Real-time display status monitoring
 * - Remote control actions (highlight, refresh, filter, depot change)
 * - Bulk operations for depot-wide control
 * - Display URL management and sharing
 * - Auto-refresh every 10 seconds
 *
 * Usage: Integrated into SDC Dashboard as toggleable panel
 */
export default function DisplayControlPanel() {
  // State management
  const [displays, setDisplays] = useState([]);
  const [filteredDisplays, setFilteredDisplays] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Modal states
  const [highlightModal, setHighlightModal] = useState({ open: false, displayId: null, bulk: false });
  const [filtersModal, setFiltersModal] = useState({ open: false, displayId: null });
  const [depotModal, setDepotModal] = useState({ open: false, displayId: null });

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch active displays
  const fetchDisplays = useCallback(async () => {
    try {
      const response = await apiClient.get('/displays/active');
      setDisplays(response.data || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching displays:', err);
      setError('Failed to load displays');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh every 10 seconds
  useEffect(() => {
    fetchDisplays();
    const interval = setInterval(fetchDisplays, 10000);
    return () => clearInterval(interval);
  }, [fetchDisplays]);

  // Filter displays by depot
  useEffect(() => {
    if (selectedDepot === 'all') {
      setFilteredDisplays(displays);
    } else {
      setFilteredDisplays(displays.filter(d => d.depot === selectedDepot));
    }
  }, [displays, selectedDepot]);

  // Get unique depots
  const depots = ['all', ...new Set(displays.map(d => d.depot))];

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Action handlers
  const handleRefreshDisplay = async (displayId) => {
    try {
      await apiClient.post(`/displays/${displayId}/refresh`);
      showToast('Display refreshed successfully');
    } catch (err) {
      console.error('Error refreshing display:', err);
      showToast('Failed to refresh display', 'error');
    }
  };

  const handleRefreshAllInDepot = async (depot) => {
    try {
      const displayIds = displays
        .filter(d => d.depot === depot)
        .map(d => d.display_id);

      await Promise.all(
        displayIds.map(id => apiClient.post(`/displays/${id}/refresh`))
      );
      showToast(`Refreshed all displays in ${depot}`);
    } catch (err) {
      console.error('Error refreshing displays:', err);
      showToast('Failed to refresh displays', 'error');
    }
  };

  const handleHighlightBreakdown = (displayId, breakdownId) => {
    apiClient.post(`/displays/${displayId}/highlight`, { breakdownId })
      .then(() => {
        showToast('Breakdown highlighted on display');
        setHighlightModal({ open: false, displayId: null, bulk: false });
      })
      .catch(err => {
        console.error('Error highlighting breakdown:', err);
        showToast('Failed to highlight breakdown', 'error');
      });
  };

  const handleHighlightAllInDepot = (depot, breakdownId) => {
    const displayIds = displays
      .filter(d => d.depot === depot)
      .map(d => d.display_id);

    Promise.all(
      displayIds.map(id =>
        apiClient.post(`/displays/${id}/highlight`, { breakdownId })
      )
    )
      .then(() => {
        showToast(`Breakdown highlighted on all ${depot} displays`);
        setHighlightModal({ open: false, displayId: null, bulk: false });
      })
      .catch(err => {
        console.error('Error highlighting breakdown:', err);
        showToast('Failed to highlight breakdown', 'error');
      });
  };

  const handleChangeFilters = (displayId, filters) => {
    apiClient.post(`/displays/${displayId}/filters`, filters)
      .then(() => {
        showToast('Display filters updated');
        setFiltersModal({ open: false, displayId: null });
      })
      .catch(err => {
        console.error('Error updating filters:', err);
        showToast('Failed to update filters', 'error');
      });
  };

  const handleChangeDepot = (displayId, newDepot) => {
    apiClient.post(`/displays/${displayId}/depot`, { depot: newDepot })
      .then(() => {
        showToast('Display depot changed');
        setDepotModal({ open: false, displayId: null });
        fetchDisplays(); // Refresh list
      })
      .catch(err => {
        console.error('Error changing depot:', err);
        showToast('Failed to change depot', 'error');
      });
  };

  const copyDisplayUrl = (depot, displayId) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/dashboards/engineering/display?depot=${encodeURIComponent(depot)}&displayId=${displayId}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast('Display URL copied to clipboard'))
      .catch(() => showToast('Failed to copy URL', 'error'));
  };

  // Status indicator component
  const StatusIndicator = ({ status }) => {
    const isOnline = status === 'online';
    return (
      <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        <span className="status-dot"></span>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    );
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
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

  if (loading) {
    return (
      <div className="display-control-panel loading">
        <div className="loading-spinner"></div>
        <p>Loading displays...</p>
      </div>
    );
  }

  return (
    <div className="display-control-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-left">
          <h2>Display Control Panel</h2>
          <span className="display-count">
            {filteredDisplays.length} display{filteredDisplays.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="header-right">
          {lastUpdate && (
            <span className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchDisplays}
            className="refresh-btn"
            aria-label="Refresh display list"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Depot Filter */}
      <div className="filter-bar">
        <label htmlFor="depot-filter">Filter by Depot:</label>
        <select
          id="depot-filter"
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="depot-filter"
        >
          {depots.map(depot => (
            <option key={depot} value={depot}>
              {depot === 'all' ? 'All Depots' : depot}
            </option>
          ))}
        </select>

        {/* Bulk actions for selected depot */}
        {selectedDepot !== 'all' && filteredDisplays.length > 0 && (
          <div className="bulk-actions">
            <button
              onClick={() => handleRefreshAllInDepot(selectedDepot)}
              className="bulk-btn refresh-all"
            >
              🔄 Refresh All in {selectedDepot}
            </button>
            <button
              onClick={() => setHighlightModal({
                open: true,
                displayId: null,
                bulk: true,
                depot: selectedDepot
              })}
              className="bulk-btn highlight-all"
            >
              ⭐ Highlight on All {selectedDepot} Displays
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Display cards */}
      <div className="displays-grid">
        {filteredDisplays.length === 0 ? (
          <div className="no-displays">
            <p>No displays found {selectedDepot !== 'all' ? `in ${selectedDepot}` : ''}</p>
          </div>
        ) : (
          filteredDisplays.map(display => (
            <div key={display.display_id} className="display-card">
              {/* Card header */}
              <div className="card-header">
                <div className="display-info">
                  <h3>{display.display_id}</h3>
                  <span className="depot-badge">{display.depot}</span>
                </div>
                <StatusIndicator status={display.status} />
              </div>

              {/* Display metadata */}
              <div className="display-meta">
                <div className="meta-item">
                  <span className="meta-label">Last Seen:</span>
                  <span className="meta-value">{formatLastSeen(display.last_seen)}</span>
                </div>
                {display.current_filter && (
                  <div className="meta-item">
                    <span className="meta-label">Filters:</span>
                    <span className="meta-value">{display.current_filter}</span>
                  </div>
                )}
              </div>

              {/* Control actions */}
              <div className="card-actions">
                <button
                  onClick={() => setHighlightModal({
                    open: true,
                    displayId: display.display_id,
                    bulk: false
                  })}
                  className="action-btn highlight"
                  disabled={display.status !== 'online'}
                  title="Highlight a breakdown on this display"
                >
                  ⭐ Highlight
                </button>

                <button
                  onClick={() => handleRefreshDisplay(display.display_id)}
                  className="action-btn refresh"
                  disabled={display.status !== 'online'}
                  title="Force display to reload data"
                >
                  🔄 Refresh
                </button>

                <button
                  onClick={() => setFiltersModal({
                    open: true,
                    displayId: display.display_id,
                    currentFilters: display.current_filter
                  })}
                  className="action-btn filters"
                  disabled={display.status !== 'online'}
                  title="Change breakdown filters"
                >
                  🔍 Filters
                </button>

                <button
                  onClick={() => setDepotModal({
                    open: true,
                    displayId: display.display_id,
                    currentDepot: display.depot
                  })}
                  className="action-btn depot"
                  disabled={display.status !== 'online'}
                  title="Change depot shown on display"
                >
                  📍 Depot
                </button>
              </div>

              {/* Display URL */}
              <div className="display-url">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/dashboards/engineering/display?depot=${encodeURIComponent(display.depot)}&displayId=${display.display_id}`}
                  className="url-input"
                />
                <button
                  onClick={() => copyDisplayUrl(display.depot, display.display_id)}
                  className="copy-url-btn"
                  title="Copy display URL"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {highlightModal.open && (
        <HighlightBreakdownModal
          onClose={() => setHighlightModal({ open: false, displayId: null, bulk: false })}
          onHighlight={(breakdownId) => {
            if (highlightModal.bulk) {
              handleHighlightAllInDepot(highlightModal.depot, breakdownId);
            } else {
              handleHighlightBreakdown(highlightModal.displayId, breakdownId);
            }
          }}
          displayId={highlightModal.displayId}
          depot={highlightModal.depot}
          bulk={highlightModal.bulk}
        />
      )}

      {filtersModal.open && (
        <ChangeFiltersModal
          onClose={() => setFiltersModal({ open: false, displayId: null })}
          onSave={(filters) => handleChangeFilters(filtersModal.displayId, filters)}
          currentFilters={filtersModal.currentFilters}
        />
      )}

      {depotModal.open && (
        <ChangeDepotModal
          onClose={() => setDepotModal({ open: false, displayId: null })}
          onSave={(depot) => handleChangeDepot(depotModal.displayId, depot)}
          currentDepot={depotModal.currentDepot}
          availableDepots={depots.filter(d => d !== 'all')}
        />
      )}

      {/* Toast notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}
    </div>
  );
}
