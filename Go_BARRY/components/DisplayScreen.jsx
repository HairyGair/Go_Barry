// Go_BARRY/components/DisplayScreen.jsx
// Revolutionary 24/7 Control Room Display - Professional Grade

import React, { useState, useEffect } from 'react';
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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch supervisor activity
  const fetchSupervisorActivity = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/supervisor/active');
      if (response.ok) {
        const data = await response.json();
        setActiveSupervisors(data.activeSupervisors || []);
        
        // Create activity log from active supervisors
        const activity = data.activeSupervisors.map(sup => ({
          id: `activity_${sup.id}_${Date.now()}`,
          supervisorName: sup.name,
          action: 'Monitoring system',
          timestamp: sup.lastActivity || sup.loginTime,
          type: 'system'
        }));
        setSupervisorActivity(activity.slice(0, 8)); // More activities for better feed
      }
    } catch (err) {
      console.log('Could not fetch supervisor activity');
    }
  };

  // Fetch alerts data
  const fetchAlerts = async () => {
    const startTime = performance.now();
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      setApiResponseTime(responseTime);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
      setLastUpdateTime(new Date());
      
      // Check for critical/high severity alerts for attention mode
      const criticalAlerts = (data.alerts || []).filter(alert => 
        alert.severity === 'CRITICAL' || alert.severity === 'Critical' ||
        alert.severity === 'HIGH' || alert.severity === 'High'
      );
      setAttentionMode(criticalAlerts.length > 0);
      
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      setLastUpdateTime(new Date());
      const endTime = performance.now();
      setApiResponseTime(Math.round(endTime - startTime));
      // Set sample data on error
      setAlerts([
        {
          id: 'sample_001',
          title: 'Sample Traffic Alert - System Offline',
          description: 'Unable to connect to traffic data sources. Displaying sample data.',
          location: 'Newcastle City Centre',
          severity: 'Medium',
          affectsRoutes: ['21', 'X21', '10', '12'],
          timestamp: new Date().toISOString(),
          source: 'system'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAlerts();
    fetchActiveEvents();
    fetchSupervisorActivity();
    const alertInterval = setInterval(fetchAlerts, 20000);
    const eventInterval = setInterval(fetchActiveEvents, 60000);
    const supervisorInterval = setInterval(fetchSupervisorActivity, 30000);
    return () => {
      clearInterval(alertInterval);
      clearInterval(eventInterval);
      clearInterval(supervisorInterval);
    };
  }, []);

  // Auto-rotate alerts
  useEffect(() => {
    if (alerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 15000); // Faster rotation for better dynamics
    
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
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
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
        height: '72px',
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Company Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            GNE
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              GO NORTH EAST
            </h1>
            <p style={{
              margin: 0,
              fontSize: '11px',
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
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '36px',
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
            fontSize: '12px',
            color: '#94a3b8',
            fontWeight: '500',
            marginTop: '4px'
          }}>
            {formatDate(currentTime)}
          </div>
        </div>
        
        {/* Status Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <StatusBadge 
              icon="📡" 
              label={`${apiResponseTime || '---'}ms`} 
              color={apiResponseTime && apiResponseTime < 1000 ? '#10b981' : '#f59e0b'}
              small={true}
            />
            <StatusBadge 
              icon="⏱️" 
              label={getTimeSinceUpdate()} 
              color="#64748b"
              small={true}
            />
            {attentionMode && (
              <StatusBadge 
                icon="🚨" 
                label="ATTENTION" 
                color="#ef4444"
                pulse={true}
                small={true}
              />
            )}
            <StatusBadge 
              icon={weather.icon} 
              label={`${weather.condition} ${weather.temp}`} 
              color="#059669"
              small={true}
            />
          </div>
        </div>
      </div>

      {/* Critical Event Banner */}
      {activeEvent && (
        <div style={{
          background: 'linear-gradient(90deg, #ef4444, #dc2626)',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'alertPulse 2s ease-in-out infinite',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              MAJOR EVENT: {activeEvent.venue} - {activeEvent.event}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '2px' }}>
              {activeEvent.time} • Expect significant service disruption
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {activeEvent.category || 'CRITICAL'}
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 400px 320px',
        gap: '24px',
        padding: '24px',
        height: 'calc(100vh - 72px)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Live Traffic Map Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc'
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🗺️
              </span>
              LIVE TRAFFIC INTELLIGENCE
            </h2>
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#93c5fd'
            }}>
              {alerts.filter(a => a.coordinates).length} ALERTS MAPPED
            </div>
          </div>
          
          <div style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <TomTomTrafficMap 
              alerts={alerts.map(alert => ({
                ...alert,
                coordinates: alert.coordinates ? 
                  (Array.isArray(alert.coordinates) ? alert.coordinates : 
                   alert.coordinates.lat && alert.coordinates.lng ? 
                   [alert.coordinates.lat, alert.coordinates.lng] : null) :
                  null
              }))}
              currentAlert={currentAlert ? {
                ...currentAlert,
                coordinates: currentAlert.coordinates ? 
                  (Array.isArray(currentAlert.coordinates) ? currentAlert.coordinates : 
                   currentAlert.coordinates.lat && currentAlert.coordinates.lng ? 
                   [currentAlert.coordinates.lat, currentAlert.coordinates.lng] : null) :
                  null
              } : null}
              alertIndex={currentAlertIndex}
            />
          </div>
        </div>

        {/* Alert Command Center */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f8fafc'
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🚨
              </span>
              ALERT CENTER
              <span style={{
                background: alerts.length > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {alerts.length}
              </span>
            </h2>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {alerts.length > 0 ? (
            <div style={{ flex: 1 }}>
              {alerts.length > 1 && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#93c5fd',
                  fontWeight: '500'
                }}>
                  🔄 Auto-cycling • Alert {currentAlertIndex + 1} of {alerts.length} • Next in 15s
                </div>
              )}

              {currentAlert && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `2px solid ${getSeverityColor(currentAlert.severity)}`,
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  animation: 'slideIn 0.5s ease-out'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: getSeverityColor(currentAlert.severity),
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {currentAlert.severity || 'UNKNOWN'}
                  </div>

                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    paddingRight: '80px',
                    lineHeight: '1.4'
                  }}>
                    {currentAlert.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: '#cbd5e1',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      📍
                    </span>
                    {currentAlert.location || 'Location not specified'}
                  </div>

                  {currentAlert.description && (
                    <p style={{
                      margin: '0 0 20px 0',
                      fontSize: '13px',
                      color: '#94a3b8',
                      lineHeight: '1.5'
                    }}>
                      {currentAlert.description}
                    </p>
                  )}

                  {currentAlert.affectsRoutes && currentAlert.affectsRoutes.length > 0 && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🚌 Affected Services
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {currentAlert.affectsRoutes.slice(0, 6).map((route, idx) => (
                          <span key={idx} style={{
                            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                            color: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {route}
                          </span>
                        ))}
                        {currentAlert.affectsRoutes.length > 6 && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            +{currentAlert.affectsRoutes.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#64748b',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '12px'
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
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '20px'
              }}>
                ✅
              </div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#10b981'
              }}>
                ALL CLEAR
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#64748b'
              }}>
                No active traffic alerts detected
              </p>
            </div>
          )}
        </div>

        {/* Supervisor Operations Feed */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#f8fafc'
          }}>
            <span style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              👮‍♂️
            </span>
            OPERATIONS
          </h3>
          
          {/* Active Supervisors */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              👥 Active Personnel ({activeSupervisors.length})
            </div>
            {activeSupervisors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSupervisors.map((supervisor, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#f1f5f9'
                    }}>
                      {supervisor.name}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '13px',
                color: '#64748b',
                textAlign: 'center',
                padding: '16px',
                fontStyle: 'italic'
              }}>
                No active personnel
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📋 Activity Feed
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {supervisorActivity.length > 0 ? (
              supervisorActivity.map((activity, idx) => (
                <div key={activity.id} style={{
                  padding: '12px',
                  background: idx === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${idx === 0 ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                  animation: idx === 0 ? 'fadeIn 0.5s ease-out' : 'none'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '4px'
                  }}>
                    {activity.supervisorName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    marginBottom: '6px'
                  }}>
                    {activity.action}
                  </div>
                  <div style={{
                    fontSize: '10px',
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
                fontSize: '13px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                No recent activity
              </div>
            )}
          </div>

          {/* System Status Footer */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '11px',
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
const StatusBadge = ({ icon, label, color, pulse = false, small = false }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: small ? '4px' : '6px',
    background: `${color}20`,
    border: `1px solid ${color}40`,
    color: color,
    padding: small ? '4px 8px' : '6px 12px',
    borderRadius: small ? '8px' : '12px',
    fontSize: small ? '10px' : '11px',
    fontWeight: '600',
    animation: pulse ? 'statusPulse 1.5s ease-in-out infinite' : 'none'
  }}>
    <span>{icon}</span>
    <span>{label}</span>
  </div>
);

export default DisplayScreen;