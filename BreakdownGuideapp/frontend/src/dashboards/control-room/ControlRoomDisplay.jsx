/**
 * Control Room Display
 * Large screen display for monitoring active breakdowns in real-time
 *
 * Features:
 * - Auto-scrolling breakdown cards (20-second intervals)
 * - Most affected routes
 * - Real-time stats
 * - Priority alerts
 * - WebSocket live updates
 * - Full-screen optimized
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/api-client';
import useConnectionManager from '../../hooks/useConnectionManager';
import './ControlRoomDisplay.css';

const ControlRoomDisplay = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    activeEngineers: 0,
    totalEngineers: 0
  });
  const [affectedRoutes, setAffectedRoutes] = useState([]);
  const [priorityAlerts, setPriorityAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const scrollIntervalRef = useRef(null);

  // WebSocket connection for real-time updates (using public channel, no auth required)
  const connectionManager = useConnectionManager({
    endpoint: '/ws?channel=control-room',
    autoConnect: true,
    primary: 'websocket',
    fallback: 'polling',
    pollingInterval: 30000
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Fetch active breakdowns
  const fetchBreakdowns = useCallback(async () => {
    try {
      // Use public endpoint - no authentication required for Control Room Display
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com'}/api/public/breakdowns/live`)
        .then(res => res.json());

      if (response.success && Array.isArray(response.breakdowns)) {
        const activeBreakdowns = response.breakdowns
          .sort((a, b) => {
            // Sort by priority: STOP first, then by creation time
            if (a.severity === 'STOP' && b.severity !== 'STOP') return -1;
            if (b.severity === 'STOP' && a.severity !== 'STOP') return 1;
            if (a.is_priority && !b.is_priority) return -1;
            if (b.is_priority && !a.is_priority) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });

        setBreakdowns(activeBreakdowns);
        setLastUpdated(new Date());

        // Calculate stats
        const critical = activeBreakdowns.filter(b => b.severity === 'STOP' || b.requires_immediate_action).length;
        const engineersActive = activeBreakdowns.filter(b => b.dispatched_at).length;

        setStats({
          total: activeBreakdowns.length,
          critical,
          activeEngineers: engineersActive,
          totalEngineers: engineersActive // Can be enhanced with total engineer count
        });

        // Calculate affected routes
        const routeCounts = {};
        activeBreakdowns.forEach(b => {
          const route = b.route_id || 'Unknown';
          routeCounts[route] = (routeCounts[route] || 0) + 1;
        });

        const sortedRoutes = Object.entries(routeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([route, count]) => ({ route, count }));

        setAffectedRoutes(sortedRoutes);

        // Extract priority alerts
        const alerts = activeBreakdowns
          .filter(b => b.severity === 'STOP' || b.is_priority)
          .slice(0, 3);

        setPriorityAlerts(alerts);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchBreakdowns();
    const pollInterval = setInterval(fetchBreakdowns, 30000); // Refresh every 30s
    return () => clearInterval(pollInterval);
  }, [fetchBreakdowns]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'breakdown_created' ||
            data.type === 'breakdown_updated' ||
            data.type === 'breakdowns_updated') {
          fetchBreakdowns();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    if (connectionManager.ws) {
      connectionManager.ws.addEventListener('message', handleMessage);
      return () => {
        connectionManager.ws.removeEventListener('message', handleMessage);
      };
    }
  }, [connectionManager.ws, fetchBreakdowns]);

  // Auto-scroll through breakdowns every 20 seconds
  useEffect(() => {
    if (breakdowns.length === 0) return;

    scrollIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakdowns.length);
    }, 20000); // 20 seconds

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [breakdowns.length]);

  // Get current breakdown to display
  const currentBreakdown = breakdowns[currentIndex];

  // Get severity badge styling
  const getSeverityBadge = (severity) => {
    const badges = {
      'STOP': { label: 'STOP', class: 'severity-critical' },
      'AMBER': { label: 'AMBER', class: 'severity-high' },
      'CONTINUE': { label: 'CONTINUE', class: 'severity-low' },
      critical: { label: 'CRITICAL', class: 'severity-critical' },
      high: { label: 'HIGH', class: 'severity-high' },
      medium: { label: 'MEDIUM', class: 'severity-medium' },
      low: { label: 'LOW', class: 'severity-low' }
    };
    return badges[severity] || badges[severity?.toLowerCase()] || badges.medium;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'ACTIVE', class: 'status-active' },
      dispatched: { label: 'DISPATCHED', class: 'status-dispatched' },
      on_site: { label: 'ON SITE', class: 'status-onsite' },
      fixing: { label: 'FIXING', class: 'status-fixing' }
    };
    return badges[status?.toLowerCase()] || badges.active;
  };

  return (
    <div className="control-room-display">
      {/* Header */}
      <div className="control-room-header">
        <div className="header-left">
          <h1 className="control-room-title">
            <span className="title-icon">🚌</span>
            CONTROL ROOM - ACTIVE BREAKDOWNS
          </h1>
          <div className="header-time">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="separator">|</span>
            <span className="last-updated">Updated: {getTimeAgo(lastUpdated)}</span>
          </div>
        </div>
        <div className="header-right">
          <div className={`live-indicator ${connectionManager.isConnected ? 'connected' : 'disconnected'}`}>
            <span className="live-dot"></span>
            {connectionManager.isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">ACTIVE</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item critical">
          <span className="stat-label">CRITICAL</span>
          <span className="stat-value">{stats.critical}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">ENGINEERS</span>
          <span className="stat-value">{stats.activeEngineers}/{stats.totalEngineers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">VIEWING</span>
          <span className="stat-value">{currentIndex + 1} / {breakdowns.length}</span>
        </div>
      </div>

      {/* Priority Alerts Banner */}
      {priorityAlerts.length > 0 && (
        <div className="priority-alerts-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <span className="alert-label">PRIORITY ALERTS:</span>
            {priorityAlerts.map((alert, idx) => (
              <span key={idx} className="alert-item">
                {alert.route_id || 'Unknown'} - Fleet {alert.fleet_no || alert.fleet_number}
                {idx < priorityAlerts.length - 1 && ' | '}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="control-room-content">
        {currentBreakdown ? (
          <div className="breakdown-card-large">
            {/* Card Header */}
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="fleet-number">FLEET {currentBreakdown.fleet_no || currentBreakdown.fleet_number}</h2>
                <div className="card-badges">
                  <span className={`severity-badge ${getSeverityBadge(currentBreakdown.severity).class}`}>
                    {getSeverityBadge(currentBreakdown.severity).label}
                  </span>
                  <span className={`status-badge ${getStatusBadge(currentBreakdown.status).class}`}>
                    {getStatusBadge(currentBreakdown.status).label}
                  </span>
                </div>
              </div>
              <div className="card-header-right">
                <div className="breakdown-time">
                  {currentBreakdown.duration_text || getTimeAgo(currentBreakdown.created_at)}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">SERVICE</div>
                  <div className="info-value">{currentBreakdown.route_id || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">LOCATION</div>
                  <div className="info-value">{currentBreakdown.location || 'Unknown'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">ISSUE</div>
                  <div className="info-value">
                    {currentBreakdown.issue_type || 'Unknown'} - {currentBreakdown.issue_description || 'Assessment Required'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">SUPERVISOR</div>
                  <div className="info-value">
                    {currentBreakdown.supervisor_name || 'Unknown'} ({currentBreakdown.supervisor_badge || 'N/A'})
                  </div>
                </div>
                {currentBreakdown.dispatched_at && (
                  <>
                    <div className="info-item">
                      <div className="info-label">ENGINEER</div>
                      <div className="info-value">{currentBreakdown.engineer_name || 'Dispatched'}</div>
                    </div>
                    {currentBreakdown.on_site_at && (
                      <div className="info-item">
                        <div className="info-label">STATUS</div>
                        <div className="info-value">On Site</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="progress-dots">
                {breakdowns.map((_, idx) => (
                  <div
                    key={idx}
                    className={`progress-dot ${idx === currentIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-breakdowns">
            <div className="no-breakdowns-icon">✅</div>
            <h2>No Active Breakdowns</h2>
            <p>All systems operational</p>
          </div>
        )}
      </div>

      {/* Most Affected Routes */}
      <div className="affected-routes-section">
        <h3 className="section-title">🚌 MOST AFFECTED ROUTES</h3>
        <div className="routes-grid">
          {affectedRoutes.length > 0 ? (
            affectedRoutes.map((route, idx) => (
              <div key={idx} className="route-item">
                <span className="route-number">{route.route}</span>
                <span className="route-count">{route.count} breakdown{route.count !== 1 ? 's' : ''}</span>
              </div>
            ))
          ) : (
            <div className="no-routes">No affected routes</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="control-room-footer">
        <div className="footer-info">
          Go North East - Breakdown Management System
        </div>
        <div className="footer-refresh">
          Auto-refresh: 30s | Card rotation: 20s
        </div>
      </div>
    </div>
  );
};

export default ControlRoomDisplay;
