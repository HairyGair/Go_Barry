/**
 * Activity Details Modal Component
 * Shows comprehensive breakdown details with timeline, photos, location, and actions
 * Features: Full breakdown info, event timeline, photo gallery, map integration, action buttons
 */

import React, { useState, useEffect, useMemo } from 'react';
import './ActivityDetailsModal.css';

const ActivityDetailsModal = ({ activity, isOpen, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fetch timeline when modal opens
  useEffect(() => {
    if (isOpen && activity?.breakdown_id) {
      fetchTimeline(activity.breakdown_id);
    }
  }, [isOpen, activity]);

  // Fetch timeline events for this breakdown
  const fetchTimeline = async (breakdownId) => {
    try {
      setLoading(true);
      // In production, this would fetch from /api/breakdowns/:id/timeline
      // For now, create mock timeline from activity data
      const mockTimeline = [
        {
          id: 1,
          type: 'breakdown_reported',
          timestamp: activity.timestamp || activity.created_at,
          actor: activity.supervisor || activity.actor_name,
          message: `Breakdown reported`,
          icon: '📝',
          severity: activity.severity
        }
      ];

      setTimelineEvents(mockTimeline);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get severity badge styling
  const getSeverityBadge = (severity) => {
    const severityConfig = {
      critical: { label: '🚨 CRITICAL', color: '#DC2626', bg: '#FEE2E2' },
      warning: { label: '⚠️ WARNING', color: '#F59E0B', bg: '#FEF3C7' },
      normal: { label: '✅ NORMAL', color: '#10B981', bg: '#D1FAE5' },
      info: { label: 'ℹ️ INFO', color: '#3B82F6', bg: '#DBEAFE' },
      STOP: { label: '🛑 STOP', color: '#DC2626', bg: '#FEE2E2' },
      AMBER: { label: '⚡ AMBER', color: '#F59E0B', bg: '#FEF3C7' },
      CONTINUE: { label: '✅ CONTINUE', color: '#10B981', bg: '#D1FAE5' }
    };

    const config = severityConfig[severity] || severityConfig.info;
    return (
      <span
        className="severity-badge"
        style={{ color: config.color, background: config.bg }}
      >
        {config.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '⏳ Pending', color: '#F59E0B' },
      in_progress: { label: '🔧 In Progress', color: '#3B82F6' },
      resolved: { label: '✅ Resolved', color: '#10B981' },
      cancelled: { label: '❌ Cancelled', color: '#6B7280' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="status-badge" style={{ color: config.color }}>
        {config.label}
      </span>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';

    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Handle location button click
  const handleViewLocation = () => {
    const lat = activity.latitude || activity.lat || activity.entity_details?.latitude;
    const lng = activity.longitude || activity.lng || activity.entity_details?.longitude;
    const location = activity.location || activity.location_description || activity.entity_details?.location;

    if (lat && lng) {
      // Open Google Maps with coordinates
      const mapsUrl = `https://www.google.com/maps/@${lat},${lng},17z`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else if (location) {
      // Search for location text
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No location data available for this activity');
    }
  };

  // Handle action buttons
  const handleAction = (action) => {
    if (onAction) {
      onAction(action, activity);
    }
  };

  if (!isOpen || !activity) return null;

  const fleetNumber = activity.fleet_no || activity.fleet_number || activity.entity_details?.fleetNo || 'N/A';
  const location = activity.location || activity.location_description || activity.entity_details?.location || 'Location not available';
  const depot = activity.depot || 'Unknown';
  const supervisor = activity.supervisor || activity.actor_name || activity.supervisor_name || 'Unknown';
  const issueType = activity.issue_type || activity.issue_category || activity.entity_details?.issueCategory || 'Not specified';

  return (
    <div className="activity-details-modal-overlay" onClick={onClose}>
      <div className="activity-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="header-title">
              <h2>Activity Details</h2>
              <span className="activity-id">
                {activity.breakdown_id || activity.entity_id || `#${activity.id}`}
              </span>
            </div>
            <div className="header-badges">
              {getSeverityBadge(activity.severity || activity.decision)}
              {activity.status && getStatusBadge(activity.status)}
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Details
          </button>
          <button
            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            🕐 Timeline
          </button>
          <button
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            📷 Photos
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="details-tab">
              {/* Vehicle Info Card */}
              <div className="info-card">
                <h3>🚌 Vehicle Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Fleet Number</span>
                    <span className="info-value fleet-number">{fleetNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Depot</span>
                    <span className="info-value">{depot}</span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">Issue Type</span>
                    <span className="info-value">{issueType}</span>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="info-card">
                <h3>📍 Location</h3>
                <div className="location-content">
                  <p className="location-text">{location}</p>
                  <button className="view-map-btn" onClick={handleViewLocation}>
                    🗺️ View on Map
                  </button>
                </div>
              </div>

              {/* Activity Info Card */}
              <div className="info-card">
                <h3>ℹ️ Activity Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Reported By</span>
                    <span className="info-value">{supervisor}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Badge Number</span>
                    <span className="info-value">
                      {activity.supervisor_badge || activity.actor_id || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Reported At</span>
                    <span className="info-value">{formatTimestamp(activity.timestamp || activity.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Time Ago</span>
                    <span className="info-value">{getTimeAgo(activity.timestamp || activity.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Data (if available) */}
              {activity.wizard_type && (
                <div className="info-card">
                  <h3>🔍 Assessment Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Assessment Type</span>
                      <span className="info-value">{activity.wizard_type}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Decision</span>
                      <span className="info-value">
                        {activity.wizard_decision || activity.decision || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message/Notes */}
              {activity.message && (
                <div className="info-card">
                  <h3>💬 Details</h3>
                  <p className="activity-message">{activity.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="timeline-tab">
              {loading ? (
                <div className="timeline-loading">
                  <div className="spinner"></div>
                  <p>Loading timeline...</p>
                </div>
              ) : timelineEvents.length > 0 ? (
                <div className="timeline-list">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="timeline-event">
                      <div className="event-icon">{event.icon}</div>
                      <div className="event-content">
                        <div className="event-header">
                          <span className="event-type">{event.type.replace(/_/g, ' ')}</span>
                          <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                        </div>
                        <p className="event-message">{event.message}</p>
                        {event.actor && (
                          <span className="event-actor">by {event.actor}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline-empty">
                  <span className="empty-icon">📋</span>
                  <p>No timeline events available</p>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="photos-tab">
              <div className="photos-empty">
                <span className="empty-icon">📷</span>
                <p>No photos available for this activity</p>
                <small>Photos will appear here when uploaded</small>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="modal-footer">
          <button className="footer-btn secondary" onClick={onClose}>
            Close
          </button>
          {activity.breakdown_id && (
            <>
              <button
                className="footer-btn primary"
                onClick={() => handleAction('view_breakdown')}
              >
                View Full Breakdown
              </button>
              {activity.status !== 'resolved' && (
                <button
                  className="footer-btn success"
                  onClick={() => handleAction('resolve')}
                >
                  ✅ Mark Resolved
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailsModal;
