// Go_BARRY/components/DisplayScreen.jsx
// Web-compatible Display Screen for 24/7 control room monitoring

import React, { useState, useEffect } from 'react';
import TomTomTrafficMap from './TomTomTrafficMap';

const DisplayScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [error, setError] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);

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

  // Fetch alerts data
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
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
    const alertInterval = setInterval(fetchAlerts, 20000); // 20 second refresh for alerts
    const eventInterval = setInterval(fetchActiveEvents, 60000); // 60 second refresh for events
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
    }, 20000); // 20 second rotation
    
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
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const currentAlert = getCurrentAlert();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '0 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827'
          }}>GO NORTH EAST</h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#DC2626',
            fontWeight: '800',
            letterSpacing: '1px'
          }}>CONTROL ROOM</p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            fontFamily: 'monospace'
          }}>{formatTime(currentTime)}</div>
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            fontWeight: '600'
          }}>{formatDate(currentTime)}</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: loading ? '#F59E0B' : '#10B981',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            <span>{loading ? '🔄' : '🟢'}</span>
            {loading ? 'UPDATING' : 'LIVE'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#6B7280',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            <span>👥</span>
            DISPLAY MODE
          </div>
        </div>
      </div>

      {/* Event Alert Banner */}
      {activeEvent && (
        <div style={{
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 2s infinite',
          borderBottom: '2px solid #B91C1C'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '16px' }}>
              {activeEvent.venue} - {activeEvent.event}
            </strong>
            <span style={{ marginLeft: '12px', opacity: 0.9 }}>
              {activeEvent.time} - EXPECT SIGNIFICANT DISRUPTION
            </span>
          </div>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>
            {activeEvent.category || 'Major Event'}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '20px',
        gap: '20px'
      }}>
        {/* Map Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🗺️ LIVE TRAFFIC MAP
          </h2>
          <div style={{ flex: 1, minHeight: '400px' }}>
            <TomTomTrafficMap 
              alerts={alerts.map(alert => ({
                ...alert,
                coordinates: alert.location?.coordinates ? 
                  [alert.location.coordinates.lat, alert.location.coordinates.lng] : 
                  null
              }))}
              currentAlert={currentAlert ? {
                ...currentAlert,
                coordinates: currentAlert.location?.coordinates ? 
                  [currentAlert.location.coordinates.lat, currentAlert.location.coordinates.lng] : 
                  null
              } : null}
              alertIndex={currentAlertIndex}
            />
          </div>
        </div>

        {/* Alerts Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🚨 LIVE ALERTS
              <span style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '700'
              }}>{alerts.length}</span>
            </h2>
            <button onClick={fetchAlerts} style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: loading ? '#F3F4F6' : 'transparent'
            }}>
              {loading ? '🔄' : '🔄'}
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#DC2626',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {alerts.length > 0 ? (
            <div>
              {alerts.length > 1 && (
                <div style={{
                  backgroundColor: '#EFF6FF',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#3B82F6',
                  fontWeight: '600'
                }}>
                  🔄 Auto-rotating every 20 seconds • Alert {currentAlertIndex + 1} of {alerts.length}
                </div>
              )}

              {currentAlert && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: `3px solid ${getSeverityColor(currentAlert.severity)}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#111827',
                      flex: 1,
                      marginRight: '16px'
                    }}>
                      {currentAlert.title}
                    </h3>
                    <span style={{
                      backgroundColor: getSeverityColor(currentAlert.severity) + '20',
                      color: getSeverityColor(currentAlert.severity),
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '800',
                      border: `2px solid ${getSeverityColor(currentAlert.severity)}`
                    }}>
                      {(currentAlert.severity || 'UNKNOWN').toUpperCase()}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '16px',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    <span>📍</span>
                    {currentAlert.location || 'Location not specified'}
                  </div>

                  {currentAlert.description && (
                    <p style={{
                      margin: '0 0 16px 0',
                      fontSize: '14px',
                      color: '#6B7280',
                      lineHeight: '1.5'
                    }}>
                      {currentAlert.description}
                    </p>
                  )}

                  {currentAlert.affectsRoutes && currentAlert.affectsRoutes.length > 0 && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🚌 AFFECTED SERVICES
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {currentAlert.affectsRoutes.map((route, idx) => (
                          <span key={idx} style={{
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            Route {route}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#9CA3AF'
                  }}>
                    <span>Source: {currentAlert.source || 'Traffic API'}</span>
                    <span>
                      {currentAlert.timestamp ? 
                        new Date(currentAlert.timestamp).toLocaleTimeString() : 
                        'Unknown time'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#10B981'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>ALL CLEAR</h3>
              <p style={{ margin: 0, fontSize: '16px' }}>No active traffic alerts</p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div style={{
          width: '300px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#111827'
          }}>System Status</h3>
          
          <div style={{
            backgroundColor: '#F8FAFC',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Backend Status:</span>
              <span style={{
                color: error ? '#DC2626' : '#10B981',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {error ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Total Alerts:</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                {alerts.length}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Refresh Rate:</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>20s</span>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Go BARRY v3.0</strong>
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              Real-time Traffic Intelligence Platform
            </p>
            <p style={{ margin: 0 }}>
              Display Screen Mode - Auto-refreshing every 20 seconds
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        height: '50px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        fontSize: '14px',
        color: '#4B5563',
        fontWeight: '600'
      }}>
        Go BARRY v3.0 • Real-time Traffic Intelligence • Newcastle Control Room
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
          }
        `
      }} />
    </div>
  );
};

export default DisplayScreen;