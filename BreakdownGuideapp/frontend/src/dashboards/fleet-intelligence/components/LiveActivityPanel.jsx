/**
 * LiveActivityPanel Component
 *
 * Real-time activity stream showing recent breakdown events.
 * Features: Auto-refresh, color-coded activity types, relative timestamps.
 */

import React, { useState, useEffect, useRef } from 'react';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

// Activity type configurations
const ACTIVITY_CONFIG = {
  'breakdown_created': { icon: '🚨', color: '#DC2626', label: 'New Breakdown' },
  'breakdown_resolved': { icon: '✅', color: '#10B981', label: 'Resolved' },
  'breakdown_updated': { icon: '📝', color: '#3B82F6', label: 'Updated' },
  'decision_made': { icon: '⚡', color: '#F59E0B', label: 'Decision' },
  'engineer_dispatched': { icon: '🔧', color: '#3B82F6', label: 'Dispatched' },
  'engineer_assigned': { icon: '🔧', color: '#3B82F6', label: 'Assigned' },
  'escalation': { icon: '⚠️', color: '#DC2626', label: 'Escalated' },
  'note_added': { icon: '📝', color: '#8B5CF6', label: 'Note' },
  'login': { icon: '👤', color: '#64748B', label: 'Login' },
  'USER_LOGIN': { icon: '👤', color: '#64748B', label: 'Login' },
  'BREAKDOWN_CREATED': { icon: '🚨', color: '#DC2626', label: 'New Breakdown' },
  'BREAKDOWN_RESOLVED': { icon: '✅', color: '#10B981', label: 'Resolved' },
  'BREAKDOWN_UPDATED': { icon: '📝', color: '#3B82F6', label: 'Updated' },
  'default': { icon: '📋', color: '#64748B', label: 'Activity' },
};

// Demo activities for when API is unavailable
const DEMO_ACTIVITIES = [
  { id: 1, activity_type: 'breakdown_created', action: 'New breakdown reported - Fleet 6377 at Newcastle City Centre', actor_name: 'Anthony Gair', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 2, activity_type: 'decision_made', action: 'AMBER decision made for Fleet 6377 - Continue with caution', actor_name: 'Barry Perryman', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 3, activity_type: 'engineer_dispatched', action: 'Engineer dispatched to Fleet 5421 at Gateshead', actor_name: 'System', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 4, activity_type: 'breakdown_resolved', action: 'Fleet 6102 breakdown resolved - Back in service', actor_name: 'David Thompson', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 5, activity_type: 'login', action: 'Supervisor logged in', actor_name: 'Sarah Wilson', created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 6, activity_type: 'note_added', action: 'Note added to breakdown BRK-20251222-001', actor_name: 'Anthony Gair', created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 7, activity_type: 'breakdown_created', action: 'New breakdown reported - Fleet 5512 at Durham', actor_name: 'Mike Johnson', created_at: new Date(Date.now() - 120 * 60000).toISOString() },
];

// Format relative time
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// Activity item component
const ActivityItem = ({ activity, isNew }) => {
  const activityType = activity.activity_type || activity.type || 'default';
  const config = ACTIVITY_CONFIG[activityType] || ACTIVITY_CONFIG.default;

  return (
    <div className={`activity-item ${isNew ? 'new' : ''}`}>
      <span
        className="activity-icon"
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
        }}
      >
        {activity.icon || config.icon}
      </span>
      <div className="activity-content">
        <p className="activity-message">
          {activity.action || activity.message || activity.description || 'Activity recorded'}
        </p>
        <span className="activity-meta">
          {activity.actor_name || activity.supervisor_name || 'System'}
          <span className="meta-dot">•</span>
          {formatTimeAgo(activity.created_at || activity.timestamp)}
        </span>
      </div>
    </div>
  );
};

const LiveActivityPanel = ({ loading: externalLoading }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const listRef = useRef(null);
  const mountedRef = useRef(true);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/activity?limit=15`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (mountedRef.current) {
        const fetchedActivities = data.activities || data.data || [];
        if (fetchedActivities.length > 0) {
          setActivities(fetchedActivities);
          setUsingDemo(false);
        } else {
          // No activities from API, use demo
          setActivities(DEMO_ACTIVITIES);
          setUsingDemo(true);
        }
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch activities:', err.message);
      if (mountedRef.current) {
        // Use demo data on error
        setActivities(DEMO_ACTIVITIES);
        setUsingDemo(true);
        setError(null); // Clear error since we have demo data
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchActivities();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const isLoading = externalLoading || loading;

  if (isLoading) {
    return (
      <div className="fid-card live-activity-panel">
        <div className="panel-header">
          <h3>📡 Live Activity</h3>
        </div>
        <div className="activity-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="activity-item loading">
              <div className="loading-skeleton activity-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card live-activity-panel">
      <div className="panel-header">
        <h3>📡 Live Activity</h3>
        <span className={`live-indicator ${usingDemo ? 'demo' : ''}`}>
          <span className="pulse-dot"></span>
          {usingDemo ? 'DEMO' : 'LIVE'}
        </span>
      </div>

      <div className="activity-list" ref={listRef}>
        {activities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem
              key={activity.id || index}
              activity={activity}
              isNew={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LiveActivityPanel;
