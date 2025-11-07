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

/**
 * Engineering Display - Yardman's Office Display
 * Large screen display for engineering staff to monitor active breakdowns
 *
 * Features:
 * - Large card grid layout (3-4 cards per row)
 * - Real-time WebSocket updates
 * - Auto-refresh every 30 seconds
 * - Color-coded severity indicators (STOP/AMBER/CONTINUE)
 * - Time elapsed auto-updating
 * - Remote control via WebSocket (highlight, filter)
 * - URL parameters for depot filtering
 * - Auto-hide cursor after inactivity
 * - Dark theme for always-on displays
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/api-client';
import websocketService from '../../services/websocket';
import GairWareLogo from '../../components/GairWareLogo';
import './EngineeringDisplay.css';

const EngineeringDisplay = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [highlightedBreakdownId, setHighlightedBreakdownId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, in-progress, resolved
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const cursorTimerRef = useRef(null);

  // Get URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      depot: params.get('depot') || null,
      displayId: params.get('displayId') || 'engineering-display-1'
    };
  };

  const { depot: depotFilter, displayId } = getUrlParams();

  // Auto-hide cursor after 5 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      document.body.style.cursor = 'default';

      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }

      cursorTimerRef.current = setTimeout(() => {
        document.body.style.cursor = 'none';
      }, 5000);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Initial hide after 5 seconds
    cursorTimerRef.current = setTimeout(() => {
      document.body.style.cursor = 'none';
    }, 5000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      document.body.style.cursor = 'default';
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate time elapsed since reported
  const getTimeElapsed = useCallback((createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  }, []);

  // Fetch breakdowns from API
  const fetchBreakdowns = useCallback(async () => {
    try {
      const endpoint = depotFilter
        ? `/api/breakdowns?depot=${encodeURIComponent(depotFilter)}`
        : '/api/breakdowns';

      const response = await apiClient.get(endpoint);

      if (response.success && Array.isArray(response.breakdowns)) {
        // Filter by status based on filterStatus
        let filtered = response.breakdowns;

        if (filterStatus === 'pending') {
          filtered = filtered.filter(b =>
            b.status === 'pending' || b.status === 'active'
          );
        } else if (filterStatus === 'in-progress') {
          filtered = filtered.filter(b =>
            b.status === 'dispatched' || b.status === 'on_site' || b.status === 'fixing'
          );
        } else if (filterStatus === 'resolved') {
          // Only show resolved from last 30 minutes
          const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
          filtered = filtered.filter(b =>
            b.status === 'resolved' && new Date(b.resolved_at) > thirtyMinsAgo
          );
        }

        // Sort by severity (STOP first) and creation time
        filtered.sort((a, b) => {
          const severityOrder = { 'STOP': 0, 'AMBER': 1, 'CONTINUE': 2 };
          const aSeverity = severityOrder[a.severity] ?? 999;
          const bSeverity = severityOrder[b.severity] ?? 999;

          if (aSeverity !== bSeverity) return aSeverity - bSeverity;
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setBreakdowns(filtered);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
    }
  }, [depotFilter, filterStatus]);

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchBreakdowns();
    const refreshInterval = setInterval(fetchBreakdowns, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchBreakdowns]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsEndpoint = `/ws?channel=engineering-display&displayId=${displayId}`;

    websocketService.connect(wsEndpoint, {
      onMessage: (data) => {
        console.log('Engineering Display received WebSocket message:', data);

        // Handle different event types
        switch (data.type) {
          case 'breakdown_created':
          case 'breakdown_updated':
          case 'breakdowns_updated':
          case 'engineer_assigned':
          case 'engineering_dispatched':
            // Refresh breakdown data
            fetchBreakdowns();
            break;

          case 'highlight_breakdown':
            // Remote control: highlight specific breakdown
            if (data.breakdown_id) {
              setHighlightedBreakdownId(data.breakdown_id);
              // Auto-remove highlight after 10 seconds
              setTimeout(() => {
                setHighlightedBreakdownId(null);
              }, 10000);
            }
            break;

          case 'set_filter':
            // Remote control: change filter
            if (data.filter) {
              setFilterStatus(data.filter);
            }
            break;

          default:
            break;
        }
      },
      onOpen: () => {
        console.log('Engineering Display WebSocket connected');
        setConnectionStatus('connected');
      },
      onClose: () => {
        console.log('Engineering Display WebSocket disconnected');
        setConnectionStatus('disconnected');
      },
      onError: (error) => {
        console.error('Engineering Display WebSocket error:', error);
        setConnectionStatus('error');
      },
      autoReconnect: true,
      heartbeat: true,
      requireAuth: false // Public display, no auth required
    });

    return () => {
      websocketService.disconnect(wsEndpoint);
    };
  }, [displayId, fetchBreakdowns]);

  // Get severity styling
  const getSeverityClass = (severity) => {
    const classes = {
      'STOP': 'severity-stop',
      'AMBER': 'severity-amber',
      'CONTINUE': 'severity-continue'
    };
    return classes[severity] || 'severity-unknown';
  };

  // Get status label
  const getStatusLabel = (breakdown) => {
    if (breakdown.status === 'resolved') return 'Resolved';
    if (breakdown.status === 'on_site') return 'On Site';
    if (breakdown.status === 'dispatched') return 'Dispatched';
    if (breakdown.status === 'fixing') return 'Being Fixed';
    if (breakdown.engineer_name) return `Assigned: ${breakdown.engineer_name}`;
    return 'Awaiting Dispatch';
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="engineering-display">
      {/* Header */}
      <div className="engineering-header">
        <div className="header-left">
          <h1 className="header-title">
            Engineering Dashboard
            {depotFilter && <span className="depot-filter"> - {depotFilter}</span>}
          </h1>
          <div className="header-subtitle">
            {breakdowns.length} Active Breakdown{breakdowns.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="header-center">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>

        <div className="header-right">
          <div className="connection-indicator">
            <div className={`connection-dot ${connectionStatus}`}></div>
            <span className="connection-label">
              {connectionStatus === 'connected' ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
          <div className="last-updated">
            Updated: {formatTime(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div className="breakdowns-grid">
        {breakdowns.length === 0 ? (
          <div className="no-breakdowns">
            <div className="no-breakdowns-icon">✓</div>
            <div className="no-breakdowns-title">No Active Breakdowns</div>
            <div className="no-breakdowns-subtitle">All systems operational</div>
          </div>
        ) : (
          breakdowns.map((breakdown) => (
            <div
              key={breakdown.id || breakdown.breakdown_id}
              className={`breakdown-card ${getSeverityClass(breakdown.severity)} ${
                highlightedBreakdownId === (breakdown.id || breakdown.breakdown_id) ? 'highlighted' : ''
              } ${breakdown.status === 'resolved' ? 'resolved' : ''}`}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="fleet-number">
                  {breakdown.fleet_no || breakdown.fleet_number || 'Unknown'}
                </div>
                <div className={`severity-badge ${getSeverityClass(breakdown.severity)}`}>
                  {breakdown.severity || 'Unknown'}
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="card-row">
                  <div className="card-label">Location:</div>
                  <div className="card-value location-value">
                    {breakdown.location || breakdown.location_description || 'Not recorded'}
                  </div>
                </div>

                <div className="card-row">
                  <div className="card-label">Issue:</div>
                  <div className="card-value issue-value">
                    {breakdown.issue_category || breakdown.issue_type || 'Unknown'}
                    {breakdown.issue_description && (
                      <div className="issue-description">
                        {breakdown.issue_description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-row">
                  <div className="card-label">Time Elapsed:</div>
                  <div className="card-value time-value">
                    {getTimeElapsed(breakdown.created_at)}
                  </div>
                </div>

                {breakdown.engineer_name && (
                  <div className="card-row engineer-row">
                    <div className="card-label">Engineer:</div>
                    <div className="card-value engineer-value">
                      {breakdown.engineer_name}
                    </div>
                  </div>
                )}

                <div className="card-row status-row">
                  <div className="status-label">
                    {getStatusLabel(breakdown)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="engineering-footer">
        <div className="footer-info">
          <div className="footer-left">
            Display ID: {displayId} | Auto-refresh: 30s
          </div>
          <div className="footer-watermark">
            <GairWareLogo size={16} variant="minimal" color="rgba(255,255,255,0.15)" />
            <span className="watermark-text">GairWare</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineeringDisplay;
