import React, { useState, useEffect } from 'react';
import notificationService, { NotificationPriority, formatNotification } from '../../services/notificationService';
import './EnhancedNotifications.css';

const EnhancedNotifications = ({ 
  isOpen, 
  onClose, 
  supervisorData,
  onActionClick 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Start simulation for demo
    if (supervisorData) {
      notificationService.startRealTimeSimulation(supervisorData);
    }

    return unsubscribe;
  }, [supervisorData]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.fetchNotifications(supervisorData?.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Use mock data
      setNotifications(notificationService.generateNotifications(supervisorData));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (notification, action) => {
    console.log('Notification action:', action, notification);
    
    // Handle different action types
    switch (action.action) {
      case 'assign_self':
        console.log('Assigning breakdown to self:', notification.busNumber);
        break;
      case 'dispatch':
        console.log('Dispatching recovery for:', notification.busNumber);
        break;
      case 'start_assessment':
        console.log('Starting assessment for:', notification.busNumber);
        break;
      case 'view_map':
        console.log('Viewing map for:', notification.location);
        break;
      case 'dashboard':
        console.log('Opening dashboard');
        break;
      default:
        console.log('Unknown action:', action);
    }

    // Mark as read
    notificationService.markAsRead(notification.id);
    
    // Call parent handler if provided
    if (onActionClick) {
      onActionClick(notification, action);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClear = (notificationId) => {
    notificationService.clearNotification(notificationId);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'critical':
        return notifications.filter(n => n.priority === NotificationPriority.CRITICAL);
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'today':
        return notifications.filter(n => {
          // Filter for today's notifications
          return !n.time.includes('hour') && !n.time.includes('day');
        });
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === NotificationPriority.CRITICAL).length;

  if (!isOpen) return null;

  return (
    <div className="enhanced-notifications-panel">
      <div className="notifications-header-enhanced">
        <div className="header-main">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} new</span>
          )}
          {criticalCount > 0 && (
            <span className="critical-badge">🚨 {criticalCount}</span>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Critical ({criticalCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
          onClick={() => setFilter('today')}
        >
          Today
        </button>
      </div>

      <div className="notifications-actions">
        <button 
          className="action-link"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
        <button 
          className="action-link danger"
          onClick={handleClearAll}
          disabled={notifications.length === 0}
        >
          Clear all
        </button>
      </div>

      <div className="notifications-list-enhanced">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No notifications</p>
            <span className="empty-subtitle">You're all caught up!</span>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item-enhanced ${notification.priority} ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="notification-icon">
                {notification.icon}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <span className="notification-time">{notification.time}</span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                {notification.busNumber && (
                  <div className="notification-meta">
                    <span className="meta-item">
                      <span className="meta-label">Bus:</span> {notification.busNumber}
                    </span>
                    {notification.route && (
                      <span className="meta-item">
                        <span className="meta-label">Route:</span> {notification.route}
                      </span>
                    )}
                    {notification.location && (
                      <span className="meta-item">
                        <span className="meta-label">Location:</span> {notification.location}
                      </span>
                    )}
                  </div>
                )}
                
                {notification.requiresAction && notification.actions && (
                  <div className="notification-actions">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        className={`notification-action-btn ${index === 0 ? 'primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(notification, action);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="notification-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(notification.id);
                }}
                title="Clear notification"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="notifications-footer-enhanced">
        <a href="/notifications" className="view-all-link">
          View all notifications →
        </a>
      </div>
    </div>
  );
};

export default EnhancedNotifications;