import React, { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket.js';

const STORAGE_KEY = 'gobarry_notifications';
const MAX_NOTIFICATIONS = 50;

// Map WebSocket event types to notification display config
const EVENT_CONFIG = {
  new_breakdown: { type: 'breakdown', icon: '🚨', priority: 'high' },
  breakdown_new: { type: 'breakdown', icon: '🚨', priority: 'high' },
  breakdown_created: { type: 'breakdown', icon: '🚨', priority: 'high' },
  breakdown_updated: { type: 'update', icon: 'ℹ️', priority: 'medium' },
  breakdown_resolved: { type: 'update', icon: '✅', priority: 'low' },
  engineer_assigned: { type: 'assignment', icon: '🔧', priority: 'medium' },
  engineering_dispatched: { type: 'assignment', icon: '🔧', priority: 'medium' },
  assessment_started: { type: 'update', icon: '📋', priority: 'low' },
  assessment_completed: { type: 'update', icon: '📋', priority: 'medium' },
  status_updated: { type: 'update', icon: 'ℹ️', priority: 'low' },
};

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch { /* quota exceeded — ignore */ }
}

const NotificationPanel = ({ isOpen, onClose, onUnreadCount }) => {
  const [notifications, setNotifications] = useState(loadNotifications);

  // Report unread count to parent
  const unreadCount = notifications.filter(n => n.unread).length;
  useEffect(() => {
    onUnreadCount?.(unreadCount);
  }, [unreadCount, onUnreadCount]);

  // Subscribe to WebSocket events for real-time notifications
  useEffect(() => {
    const endpoints = [
      '?channel=sdc-dashboard',
      '?channel=breakdowns',
      '?channel=assessments',
    ];

    const unsubscribes = endpoints.map(endpoint => {
      // Connect if not already connected
      websocketService.connect(endpoint, { autoReconnect: true });

      return websocketService.subscribe(endpoint, (data) => {
        const eventType = data.type || data.event_type;
        const config = EVENT_CONFIG[eventType];
        if (!config) return; // Ignore unknown events (heartbeat, pong, etc.)

        const notification = {
          id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: config.type,
          icon: config.icon,
          priority: config.priority,
          title: buildTitle(eventType, data),
          message: buildMessage(eventType, data),
          timestamp: new Date().toISOString(),
          unread: true,
        };

        setNotifications(prev => {
          const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
          saveNotifications(updated);
          return updated;
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, unread: false }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose} role="presentation"></div>
      <div className="notification-panel" role="dialog" aria-modal="true" aria-labelledby="notif-title">
        <div className="notification-header">
          <h3 id="notif-title">
            Notifications
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </h3>
          <button className="notification-close" onClick={onClose} aria-label="Close notifications">✕</button>
        </div>
        <div className="notification-list" aria-live="polite" role="list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications yet</p>
              <span>Events will appear here as they happen</span>
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`} role="listitem">
                <div className="notification-icon" aria-hidden="true">
                  {notif.icon || getIconForType(notif.type)}
                </div>
                <div className="notification-content">
                  <h4>
                    {notif.unread && <span className="sr-only">Unread: </span>}
                    {notif.title}
                  </h4>
                  <p>{notif.message}</p>
                  <span className="notification-time">{formatTimeAgo(notif.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="notification-footer">
          {notifications.length > 0 && (
            <>
              <button className="mark-all-read" onClick={handleMarkAllRead}>Mark all as read</button>
              <button className="clear-all-notifs" onClick={handleClearAll}>Clear all</button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

function getIconForType(type) {
  switch (type) {
    case 'breakdown': return '🚨';
    case 'alert': return '⚠️';
    case 'assignment': return '🔧';
    case 'update': return 'ℹ️';
    default: return '📌';
  }
}

function buildTitle(eventType, data) {
  switch (eventType) {
    case 'new_breakdown':
    case 'breakdown_new':
    case 'breakdown_created':
      return `New Breakdown: Fleet ${data.fleet_number || data.breakdown?.fleet_number || 'Unknown'}`;
    case 'breakdown_updated':
      return `Breakdown Updated: ${data.breakdown_id || ''}`;
    case 'breakdown_resolved':
      return `Breakdown Resolved: Fleet ${data.fleet_number || data.breakdown?.fleet_number || ''}`;
    case 'engineer_assigned':
    case 'engineering_dispatched':
      return `Engineer Dispatched: ${data.engineer_name || 'Engineer'}`;
    case 'assessment_started':
      return `Assessment Started: Fleet ${data.fleet_number || ''}`;
    case 'assessment_completed':
      return `Assessment Complete: ${data.decision || 'Decision made'}`;
    case 'status_updated':
      return `Status Update: ${data.status || ''}`;
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

function buildMessage(eventType, data) {
  const parts = [];
  if (data.location_description || data.breakdown?.location_description) {
    parts.push(data.location_description || data.breakdown?.location_description);
  }
  if (data.depot || data.breakdown?.depot) {
    parts.push(data.depot || data.breakdown?.depot);
  }
  if (data.issue_category || data.breakdown?.issue_category) {
    parts.push(data.issue_category || data.breakdown?.issue_category);
  }
  if (data.severity) {
    parts.push(`Severity: ${data.severity}`);
  }
  return parts.length > 0 ? parts.join(' — ') : eventType.replace(/_/g, ' ');
}

export default NotificationPanel;
