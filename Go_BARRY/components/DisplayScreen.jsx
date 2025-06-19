// Go_BARRY/components/DisplayScreen.jsx
// Professional 24/7 Control Room Display - Fixed and Enhanced

import React, { useState, useEffect, useRef } from 'react';
import TomTomTrafficMap from './TomTomTrafficMap';

const DisplayScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [error, setError] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [supervisorActivity, setSupervisorActivity] = useState([]);
  const [activeSupervisors, setActiveSupervisors] = useState([]);
  const [apiResponseTime, setApiResponseTime] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [attentionMode, setAttentionMode] = useState(false);
  const [weather, setWeather] = useState({ condition: 'CLEAR', temp: '15°C', icon: '☀️' });
  const [syncConnected, setSyncConnected] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch supervisor activity via polling
  const fetchSupervisorActivity = async () => {
    try {
      // Fetch active supervisors
      const response = await fetch('https://go-barry.onrender.com/api/supervisor/active');
      if (response.ok) {
        const activeData = await response.json();
        if (activeData.activeSupervisors) {
          setActiveSupervisors(activeData.activeSupervisors);
        }
      }
      
      const activityResponse = await fetch('https://go-barry.onrender.com/api/supervisor/activity/recent?limit=10');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.activities) {
          // Transform activities to match expected format
          const formattedActivities = activityData.activities.map(activity => ({
            id: activity.id,
            supervisorName: activity.details?.supervisor_name || 'Unknown Supervisor',
            action: formatActivityAction(activity.action, activity.details),
            type: getActivityType(activity.action),
            timestamp: activity.timestamp || activity.created_at
          }));
          setSupervisorActivity(formattedActivities);
        }
      }
      
      setSyncConnected(true);
    } catch (err) {
      console.log('Could not fetch supervisor activity');
      setSyncConnected(false);
    }
  };
  
  // Helper functions for activity formatting
  const formatActivityAction = (action, details) => {
    switch (action) {
      case 'LOGIN':
        return `logged in at ${details?.login_time || 'unknown time'}`;
      case 'LOGOUT':
        return `logged out at ${details?.logout_time || 'unknown time'}`;
      case 'DISMISS_ALERT':
        return `dismissed alert: ${details?.reason || 'No reason'} (${details?.location || 'Unknown location'})`;
      case 'CREATE_ROADWORK':
        return `created roadwork at ${details?.location || 'unknown location'} (Priority: ${details?.severity || 'unknown'})`;
      case 'EMAIL_REPORT':
        return `sent ${details?.report_type || 'report'} to ${details?.recipients || 'unknown recipients'}`;
      default:
        return action.toLowerCase().replace(/_/g, ' ');
    }
  };
  
  const getActivityType = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return 'login';
      case 'DISMISS_ALERT':
        return 'acknowledge';
      case 'CREATE_ROADWORK':
        return 'roadwork';
      case 'EMAIL_REPORT':
        return 'email';
      default:
        return 'system';
    }
  };

  // Polling for supervisor activity
  useEffect(() => {
    fetchSupervisorActivity();
    const interval = setInterval(fetchSupervisorActivity, 15000); // 15s intervals for real-time activity
    return () => clearInterval(interval);
  }, []);

  // Activity feed is now managed via backend polling

  // Fetch active events
  const fetchActiveEvents = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/events/active');
      if (response.ok) {
        const data = await response.json();
        if (data.mostSevere) {
          setActiveEvent(data.mostSevere);
        } else {
          setActiveEvent(null);
        }
      }
    } catch (err) {
      console.log('Could not fetch events');
    }
  };

  // Fetch alerts data
  const fetchAlerts = async () => {
    const startTime = performance.now();
    try {
      setLoading(true);
      console.log('🔄 Fetching alerts...');
      
      const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      setApiResponseTime(responseTime);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Alerts received:', data.alerts?.length || 0);
      
      // Process alerts to ensure coordinates are in correct format
      const processedAlerts = (data.alerts || []).map(alert => ({
        ...alert,
        coordinates: alert.coordinates ? 
          (Array.isArray(alert.coordinates) ? alert.coordinates : 
           alert.coordinates.lat && alert.coordinates.lng ? 
           [alert.coordinates.lat, alert.coordinates.lng] : 
           alert.coordinates.latitude && alert.coordinates.longitude ?
           [alert.coordinates.latitude, alert.coordinates.longitude] : null) :
          null
      }));
      
      setAlerts(processedAlerts);
      setError(null);
      setLastUpdateTime(new Date());
      
      // Check for critical/high severity alerts
      const criticalAlerts = processedAlerts.filter(alert => 
        alert.severity === 'CRITICAL' || alert.severity === 'Critical' ||
        alert.severity === 'HIGH' || alert.severity === 'High'
      );
      setAttentionMode(criticalAlerts.length > 0);
      
    } catch (err) {
      console.error('❌ Error fetching alerts:', err);
      setError(err.message);
      setLastUpdateTime(new Date());
      setApiResponseTime(Math.round(performance.now() - startTime));
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAlerts();
    fetchActiveEvents();
    const alertInterval = setInterval(fetchAlerts, 20000);
    const eventInterval = setInterval(fetchActiveEvents, 60000);
    return () => {
      clearInterval(alertInterval);
      clearInterval(eventInterval);
    };
  }, []);

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
    if (!lastUpdateTime) return 'Never';
    const seconds = Math.floor((new Date() - lastUpdateTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const currentAlert = getCurrentAlert();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d2d5f 100%)',
      color: '#ffffff',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
        `,
        animation: 'backgroundShift 20s ease-in-out infinite alternate'
      }} />

      {/* Header Command Bar */}
      <div style={{
        height: '60px',
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(20px)',
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
              // Fallback if logo fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback branding if logo doesn't load */}
          <div style={{ display: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
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
              background: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
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
              Control Room • Live Operations
            </p>
          </div>
        </div>
        
        {/* Central Time Display */}
        <div style={{ 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '300',
            fontFamily: "'SF Mono', 'Monaco', monospace",
            background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
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
            label={`${activeSupervisors.length} SUPERVISORS`} 
            color="#3b82f6"
          />
          <StatusBadge 
            icon="📡" 
            label={`${apiResponseTime || '---'}ms`} 
            color={apiResponseTime && apiResponseTime < 1000 ? '#10b981' : '#f59e0b'}
          />
          <StatusBadge 
            icon="🔌" 
            label={syncConnected ? 'SYNC' : 'OFFLINE'} 
            color={syncConnected ? '#10b981' : '#ef4444'}
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
          background: 'linear-gradient(90deg, #ef4444, #dc2626)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'alertPulse 2s ease-in-out infinite',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.2)',
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

      {/* Main Dashboard Grid - Better Layout */}
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
        {/* Live Traffic Map Panel - Full Width Top */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
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
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
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
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#93c5fd'
            }}>
              {alerts.filter(a => a.coordinates).length} ALERTS MAPPED
            </div>
          </div>
          
          <div style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '300px'
          }}>
            <TomTomTrafficMap 
              alerts={alerts}
              currentAlert={currentAlert}
              alertIndex={currentAlertIndex}
            />
          </div>
        </div>

        {/* Alert Center - Bottom Left */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
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
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
                background: alerts.length > 0 ? '#ef4444' : '#10b981',
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
              color: '#64748b'
            }}>
              Updated {getTimeSinceUpdate()}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
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
              {alerts.length > 1 && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '10px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#93c5fd',
                  fontWeight: '500'
                }}>
                  🔄 Alert {currentAlertIndex + 1} of {alerts.length} • Auto-cycling every 15s
                </div>
              )}

              {currentAlert && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `2px solid ${getSeverityColor(currentAlert.severity)}`,
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  animation: 'slideIn 0.5s ease-out'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: getSeverityColor(currentAlert.severity),
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
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#64748b',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🚌 Affected Services
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {currentAlert.affectsRoutes.slice(0, 8).map((route, idx) => (
                          <span key={idx} style={{
                            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {route}
                          </span>
                        ))}
                        {currentAlert.affectsRoutes.length > 8 && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            +{currentAlert.affectsRoutes.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#64748b',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '10px'
                  }}>
                    <span>{currentAlert.source || 'Traffic API'}</span>
                    <span>
                      {currentAlert.timestamp ? 
                        new Date(currentAlert.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Unknown time'
                      }
                    </span>
                  </div>
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
                background: 'linear-gradient(135deg, #10b981, #059669)',
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

        {/* Operations Panel - Bottom Right */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
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
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
          
          {/* Active Supervisors */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
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
              👥 Active Personnel ({activeSupervisors.length})
            </div>
            {activeSupervisors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSupervisors.map((supervisor, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
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
                      background: 'rgba(16, 185, 129, 0.2)',
                      padding: '3px 6px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      {supervisor.role === 'admin' ? 'ADMIN' : 'ACTIVE'}
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

          {/* Activity Feed */}
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
            {supervisorActivity.length > 0 ? (
              supervisorActivity.map((activity, idx) => (
                <div key={activity.id} style={{
                  padding: '10px',
                  background: idx === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${
                    activity.type === 'login' ? '#10b981' :
                    activity.type === 'acknowledge' ? '#f59e0b' :
                    activity.type === 'roadwork' ? '#ef4444' :
                    activity.type === 'email' ? '#3b82f6' :
                    'rgba(255, 255, 255, 0.1)'
                  }`,
                  animation: idx === 0 ? 'fadeIn 0.5s ease-out' : 'none'
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
                    {activity.action}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#64748b'
                  }}>
                    {new Date(activity.timestamp).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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

          {/* System Status Footer */}
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#93c5fd',
            fontWeight: '500'
          }}>
            Go BARRY v3.0 • Control Room Operations
          </div>
        </div>
      </div>

      {/* Global Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes backgroundShift {
            0% { opacity: 1; }
            100% { opacity: 0.7; }
          }
          
          @keyframes alertPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          @keyframes slideIn {
            from { 
              transform: translateY(20px); 
              opacity: 0; 
            }
            to { 
              transform: translateY(0); 
              opacity: 1; 
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes statusPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.8; 
            }
          }
        `
      }} />
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ icon, label, color, pulse = false }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: `${color}20`,
    border: `1px solid ${color}40`,
    color: color,
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '600',
    animation: pulse ? 'statusPulse 1.5s ease-in-out infinite' : 'none'
  }}>
    <span>{icon}</span>
    <span>{label}</span>
  </div>
);

export default DisplayScreen;