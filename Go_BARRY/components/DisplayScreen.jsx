// Go_BARRY/components/DisplayScreen.jsx
// Professional 24/7 Control Room Display - FIXED with Convex Real-time Sync

import React, { useState, useEffect, useRef } from 'react';
import OptimizedTomTomMap from './OptimizedTomTomMap';
import { useConvexSync, useSupervisorActions } from '../hooks/useConvexSync';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null);
  const [attentionMode, setAttentionMode] = useState(false);
  const [weather, setWeather] = useState({ condition: 'CLEAR', temp: '15°C', icon: '☀️' });

  // FIXED: Use Convex hooks for alerts, supervisors, AND events (real-time sync)
  const { activeAlerts, activeSupervisors, mostSevereEvent } = useConvexSync();
  const supervisorActivity = useSupervisorActions({ limit: 10 });
  
  // Process alerts from Convex to ensure consistent format
  const alerts = React.useMemo(() => {
    if (!activeAlerts) return [];
    return activeAlerts.map(alert => ({
      ...alert,
      id: alert.alertId, // Ensure consistent ID field
      coordinates: alert.coordinates ? 
        (Array.isArray(alert.coordinates) ? alert.coordinates : 
         alert.coordinates.lat && alert.coordinates.lng ? 
         [alert.coordinates.lat, alert.coordinates.lng] : 
         alert.coordinates.latitude && alert.coordinates.longitude ?
         [alert.coordinates.latitude, alert.coordinates.longitude] : null) :
        null
    }));
  }, [activeAlerts]);
  
  // Loading/error states (Convex handles these)
  const loading = !activeAlerts;
  const error = null;
  const lastUpdateTime = new Date();
  const apiResponseTime = 0; // Instant with Convex

  // Convex connection status (always true when using hooks)
  const syncConnected = true;
  const lastSyncTime = new Date(); // Convex is always real-time
  const syncAge = 0; // Always fresh with Convex

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Events now come from Convex real-time sync
  useEffect(() => {
    setActiveEvent(mostSevereEvent);
  }, [mostSevereEvent]);

  // Check for critical/high severity alerts
  useEffect(() => {
    const criticalAlerts = alerts.filter(alert => 
      alert.severity === 'CRITICAL' || alert.severity === 'Critical' ||
      alert.severity === 'HIGH' || alert.severity === 'High'
    );
    setAttentionMode(criticalAlerts.length > 0);
  }, [alerts]);

  // Events are now real-time via Convex - no need for polling

  // Auto-rotate alerts
  useEffect(() => {
    if (alerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [alerts.length]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCurrentAlert = () => {
    if (!alerts.length || currentAlertIndex >= alerts.length) return null;
    return alerts[currentAlertIndex];
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  const getTimeSinceUpdate = () => {
    return 'LIVE'; // Always live with Convex real-time sync
  };

  // Helper function to format activity action
  const formatActivityAction = (action) => {
    switch (action.action) {
      case 'login':
        return `logged in as ${action.role || 'Supervisor'}`;
      case 'logout':
        return `logged out`;
      case 'dismiss_alert':
        return `dismissed alert: ${action.reason || 'No reason provided'}`;
      case 'session_timeout':
        return `session timed out`;
      case 'create_roadwork':
        return `created roadwork at ${action.details?.location || 'unknown location'}`;
      case 'send_email':
        return `sent email to ${action.details?.recipients || 'groups'}`;
      case 'start_duty':
        return `started ${action.details?.dutyName || 'duty'}`;
      case 'end_duty':
        return `ended ${action.details?.dutyName || 'duty'}`;
      default:
        return action.action.replace(/_/g, ' ');
    }
  };

  const getActivityType = (action) => {
    switch (action.action) {
      case 'login':
      case 'logout':
      case 'session_timeout':
        return 'login';
      case 'dismiss_alert':
        return 'acknowledge';
      case 'create_roadwork':
        return 'roadwork';
      case 'send_email':
        return 'email';
      case 'start_duty':
      case 'end_duty':
        return 'duty';
      default:
        return 'system';
    }
  };

  const currentAlert = getCurrentAlert();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f23',
      color: '#ffffff',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header Command Bar */}
      <div style={{
        height: '60px',
        backgroundColor: '#1a1a3e',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Company Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/gobarry-logo.png" 
            alt="Go BARRY Logo" 
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback branding if logo doesn't load */}
          <div style={{ display: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700'
            }}>
              GNE
            </div>
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#ffffff'
            }}>
              GO BARRY INTELLIGENCE
            </h1>
            <p style={{
              margin: 0,
              fontSize: '10px',
              color: '#64748b',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Control Room • Live Operations • Convex Real-time Alerts
            </p>
          </div>
        </div>
        
        {/* Central Time Display */}
        <div style={{ 
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '300',
            fontFamily: "'SF Mono', 'Monaco', monospace",
            color: '#ffffff',
            letterSpacing: '-1px'
          }}>
            {formatTime(currentTime)}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: '500',
            marginTop: '2px'
          }}>
            {formatDate(currentTime)}
          </div>
        </div>
        
        {/* Status Grid */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge 
            icon={loading ? '🔄' : '🟢'} 
            label={loading ? 'SYNCING' : 'LIVE'} 
            color={loading ? '#f59e0b' : '#10b981'}
            pulse={loading}
          />
          <StatusBadge 
            icon="👥" 
            label={`${activeSupervisors?.length || 0} SUPERVISORS`} 
            color="#3b82f6"
          />
          <StatusBadge 
            icon="🚨" 
            label={`${alerts.length} ALERTS`} 
            color={alerts.length > 0 ? '#f59e0b' : '#10b981'}
          />
          <StatusBadge 
            icon="🔄" 
            label="REAL-TIME" 
            color="#10b981"
            pulse={false}
          />
          {attentionMode && (
            <StatusBadge 
              icon="🚨" 
              label="CRITICAL" 
              color="#ef4444"
              pulse={true}
            />
          )}
        </div>
      </div>

      {/* Critical Event Banner */}
      {activeEvent && (
        <div style={{
          backgroundColor: '#ef4444',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>
              MAJOR EVENT: {activeEvent.venue} - {activeEvent.event}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {activeEvent.time} • Expect significant service disruption
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto 1fr',
        gap: '20px',
        padding: '20px',
        height: activeEvent ? 'calc(100vh - 110px)' : 'calc(100vh - 60px)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Live Traffic Map Panel */}
        <div style={{
          gridColumn: '1 / -1',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '50vh',
          minHeight: '400px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f8fafc'
            }}>
              <span style={{
                width: '28px',
                height: '28px',
                backgroundColor: '#3b82f6',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                🗺️
              </span>
              LIVE TRAFFIC INTELLIGENCE
            </h2>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#93c5fd'
            }}>
              {alerts.filter(a => a.coordinates).length} ALERTS MAPPED • REAL-TIME SYNC
            </div>
          </div>
          
          <div style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '300px'
          }}>
            <OptimizedTomTomMap 
              alerts={alerts}
              currentAlert={currentAlert}
              alertIndex={currentAlertIndex}
              mapId="display-screen"
            />
          </div>
        </div>

        {/* Alert Center */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f8fafc'
            }}>
              <span style={{
                width: '28px',
                height: '28px',
                backgroundColor: '#ef4444',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                🚨
              </span>
              ALERT CENTER
              <span style={{
                backgroundColor: alerts.length > 0 ? '#ef4444' : '#10b981',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {alerts.length}
              </span>
            </h2>
            <div style={{
              fontSize: '11px',
              color: '#10b981',
              fontWeight: '600'
            }}>
              {getTimeSinceUpdate()}
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '16px',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {alerts.length > 0 ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {currentAlert && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `2px solid ${getSeverityColor(currentAlert.severity)}`,
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: getSeverityColor(currentAlert.severity),
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {currentAlert.severity || 'UNKNOWN'}
                  </div>

                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    paddingRight: '60px',
                    lineHeight: '1.4'
                  }}>
                    {currentAlert.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                    color: '#cbd5e1',
                    fontSize: '12px'
                  }}>
                    <span>📍</span>
                    {currentAlert.location || 'Location not specified'}
                  </div>

                  {currentAlert.description && (
                    <p style={{
                      margin: '0 0 16px 0',
                      fontSize: '12px',
                      color: '#94a3b8',
                      lineHeight: '1.5'
                    }}>
                      {currentAlert.description}
                    </p>
                  )}

                  {currentAlert.affectsRoutes && currentAlert.affectsRoutes.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '12px'
                    }}>
                      <span style={{ fontSize: '10px', color: '#64748b', marginRight: '4px' }}>Routes:</span>
                      {currentAlert.affectsRoutes.slice(0, 5).map(route => (
                        <span key={route} style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#93c5fd',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          {route}
                        </span>
                      ))}
                      {currentAlert.affectsRoutes.length > 5 && (
                        <span style={{
                          color: '#64748b',
                          fontSize: '10px'
                        }}>
                          +{currentAlert.affectsRoutes.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px'
              }}>
                ✅
              </div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#10b981'
              }}>
                ALL CLEAR
              </h3>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#64748b'
              }}>
                No active traffic alerts detected
              </p>
            </div>
          )}
        </div>

        {/* Operations Panel - FIXED with Convex data */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f8fafc'
          }}>
            <span style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#8b5cf6',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              👮‍♂️
            </span>
            OPERATIONS
          </h3>
          
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              👥 Active Personnel ({activeSupervisors?.length || 0})
              <span style={{
                fontSize: '9px',
                color: '#10b981',
                marginLeft: '8px'
              }}>
                • CONVEX REAL-TIME
              </span>
            </div>
            {activeSupervisors && activeSupervisors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSupervisors.map((supervisor, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#f1f5f9'
                    }}>
                      {supervisor.name}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      padding: '3px 6px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      {supervisor.isAdmin ? 'ADMIN' : 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center',
                padding: '12px',
                fontStyle: 'italic'
              }}>
                No active personnel
              </div>
            )}
          </div>

          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📋 Recent Activity
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {supervisorActivity && supervisorActivity.length > 0 ? (
              supervisorActivity.map((activity, idx) => (
                <div key={activity._id} style={{
                  padding: '10px',
                  backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${
                    getActivityType(activity) === 'login' ? '#10b981' :
                    getActivityType(activity) === 'acknowledge' ? '#f59e0b' :
                    getActivityType(activity) === 'roadwork' ? '#ef4444' :
                    getActivityType(activity) === 'email' ? '#3b82f6' :
                    getActivityType(activity) === 'duty' ? '#8b5cf6' :
                    'rgba(255, 255, 255, 0.1)'
                  }`
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '3px'
                  }}>
                    {activity.supervisorName}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginBottom: '4px'
                  }}>
                    {formatActivityAction(activity)}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {new Date(activity.timestamp).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {idx === 0 && (
                      <span style={{
                        fontSize: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                No recent activity
              </div>
            )}
          </div>

          <div style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#93c5fd',
            fontWeight: '500'
          }}>
            Go BARRY v3.0 • Control Room Operations • FIXED Real-time Sync
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ icon, label, color, pulse = false }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: `${color}20`,
    border: `1px solid ${color}40`,
    color: color,
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '600',
    animation: pulse ? 'pulse 2s infinite' : 'none'
  }}>
    <span>{icon}</span>
    <span>{label}</span>
  </div>
);

export default DisplayScreen;