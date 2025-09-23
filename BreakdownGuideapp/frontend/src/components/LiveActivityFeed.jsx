import React, { useState, useEffect, useMemo, useRef } from 'react';
import './LiveActivityFeed.css';

const STORAGE_KEY = 'gobarry_activity_feed_cache';

const LiveActivityFeed = ({ isOpen = true, onClose, embedded = false, activities: propActivities = [] }) => {
  // Only cache in standalone mode, not embedded
  const shouldCache = !embedded;
  
  // Use ref to track if we've initialized to prevent re-renders
  const hasInitializedRef = useRef(false);
  const prevActivitiesRef = useRef(propActivities);
  
  // Initialize state with prop activities
  const [activities, setActivities] = useState(propActivities);

  // Update activities only when they actually change
  useEffect(() => {
    // Deep comparison to prevent unnecessary updates
    const activitiesChanged = JSON.stringify(prevActivitiesRef.current) !== JSON.stringify(propActivities);
    
    if (activitiesChanged || !hasInitializedRef.current) {
      setActivities(propActivities);
      prevActivitiesRef.current = propActivities;
      hasInitializedRef.current = true;
      
      // Only cache if in standalone mode
      if (shouldCache && propActivities.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activities: propActivities,
            timestamp: Date.now()
          }));
        } catch (error) {
          // Silently fail
        }
      }
    }
  }, [propActivities, shouldCache]);

  // Memoize the formatted activities to prevent unnecessary re-renders
  const formattedActivities = useMemo(() => {
    return activities.map((activity, index) => ({
      ...activity,
      // Ensure unique keys
      uniqueKey: `${activity.id || Math.random()}-${activity.timestamp || index}`
    }));
  }, [activities]);

  if (!isOpen && !embedded) return null;

  const renderContent = () => (
    <>
      <div className="live-activity-header">
        <h3>Live Activity Feed</h3>
        {!embedded && <button className="close-btn" onClick={onClose}>×</button>}
      </div>
      
      <div className="live-activity-content">
        {formattedActivities.length === 0 ? (
          <div className="no-activity">
            <span className="no-activity-icon">📋</span>
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="activity-list">
            {formattedActivities.map(activity => (
              <div 
                key={activity.uniqueKey} 
                className={`activity-item ${activity.severity || ''}`}
              >
                <span className="activity-icon">{activity.icon || '📄'}</span>
                <div className="activity-details">
                  <p className="activity-message">{activity.message}</p>
                  <div className="activity-meta">
                    <span className="activity-time">{activity.time}</span>
                    {activity.depot && (
                      <span className="activity-depot">• {activity.depot}</span>
                    )}
                    {activity.decision && (
                      <span className={`activity-decision ${activity.decision.toLowerCase()}`}>
                        • {activity.decision}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="live-activity-footer">
        <button 
          className="view-all-btn"
          onClick={() => window.location.href = '/dashboards/breakdown'}
        >
          View All Activity →
        </button>
      </div>
    </>
  );

  // Embedded version - use React.memo to prevent re-renders
  if (embedded) {
    return (
      <div className="live-activity-feed embedded" key="live-feed-embedded">
        {renderContent()}
      </div>
    );
  }

  // Standalone floating version
  return (
    <div className="live-activity-feed-overlay" key="live-feed-overlay">
      <div className="live-activity-feed">
        {renderContent()}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(LiveActivityFeed, (prevProps, nextProps) => {
  // Custom comparison function
  // Only re-render if activities or important props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.embedded === nextProps.embedded &&
    JSON.stringify(prevProps.activities) === JSON.stringify(nextProps.activities)
  );
});
