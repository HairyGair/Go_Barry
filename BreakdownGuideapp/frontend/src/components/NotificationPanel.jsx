import React from 'react';

const NotificationPanel = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 1,
      type: 'breakdown',
      title: 'New Breakdown Reported',
      message: 'Fleet #6932 - Washington Depot',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: 2,
      type: 'alert',
      title: 'SLA Breach Warning',
      message: 'Fleet #5847 approaching 15min response time',
      time: '12 minutes ago',
      unread: true
    },
    {
      id: 3,
      type: 'update',
      title: 'Engineer Dispatched',
      message: 'John Smith assigned to Fleet #7234',
      time: '25 minutes ago',
      unread: false
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose}></div>
      <div className="notification-panel">
        <div className="notification-header">
          <h3>Notifications</h3>
          <button className="notification-close" onClick={onClose}>✕</button>
        </div>
        <div className="notification-list">
          {notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
              <div className="notification-icon">
                {notif.type === 'breakdown' && '🚨'}
                {notif.type === 'alert' && '⚠️'}
                {notif.type === 'update' && 'ℹ️'}
              </div>
              <div className="notification-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="notification-time">{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="notification-footer">
          <button className="mark-all-read">Mark all as read</button>
          <a href="/notifications">View all notifications</a>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
