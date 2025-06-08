import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';

const EnhancedDisplayScreen = () => {
  const [currentAlerts, setCurrentAlerts] = useState([]);
  const [activeSupervisors, setActiveSupervisors] = useState([]);
  const [alertIndex, setAlertIndex] = useState(0);
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [seriouslyAffectedAreas, setSeriouslyAffectedAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const API_BASE_URL = Platform.OS === 'web' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://go-barry.onrender.com';

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle through alerts every 20 seconds
  useEffect(() => {
    if (currentAlerts.length <= 1) return;
    
    const cycleTimer = setInterval(() => {
      setAlertIndex(prev => (prev + 1) % currentAlerts.length);
    }, 20000);
    
    return () => clearInterval(cycleTimer);
  }, [currentAlerts.length]);

  // Fetch alerts from API
  const fetchAlerts = async () => {
    try {
      setConnectionError(false);
      const response = await fetch(`${API_BASE_URL}/api/alerts-enhanced?t=${Date.now()}&no_cache=true`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success && data.alerts) {
        // Filter out sample alerts for display
        const filteredAlerts = data.alerts.filter(alert => 
          !alert.id?.includes('barry_v3') && 
          !alert.id?.includes('sample') && 
          alert.source !== 'go_barry_v3' && 
          !alert.enhanced
        );
        
        setCurrentAlerts(filteredAlerts);
        setLastDataUpdate(new Date());
        updateAffectedAreas(filteredAlerts);
        setIsLoading(false);
        
        console.log(`Display alerts updated: ${data.alerts.length} to ${filteredAlerts.length} (filtered ${data.alerts.length - filteredAlerts.length} samples)`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setConnectionError(true);
      setIsLoading(false);
    }
  };

  // Fetch supervisors from API
  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supervisor/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveSupervisors(data.activeSupervisors || []);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      setActiveSupervisors([]);
    }
  };

  // Update affected areas analysis
  const updateAffectedAreas = (alerts) => {
    const areaMap = new Map();
    
    alerts.forEach(alert => {
      if (!alert.location) return;
      
      let area = alert.location;
      if (area.includes('A1')) area = 'A1 Corridor';
      else if (area.includes('Newcastle') || area.includes('Gateshead')) area = 'Newcastle City Centre';
      else if (area.includes('Sunderland')) area = 'Sunderland Area';
      else if (area.includes('Durham')) area = 'Durham Area';
      else area = area.split(',')[0];
      
      if (!areaMap.has(area)) areaMap.set(area, []);
      areaMap.get(area).push(alert);
    });
    
    const affected = [];
    areaMap.forEach((alerts, area) => {
      if (alerts.length >= 2) {
        affected.push({ area, count: alerts.length });
      }
    });
    
    setSeriouslyAffectedAreas(affected);
  };

  // Initialize data fetching
  useEffect(() => {
    fetchAlerts();
    fetchSupervisors();
    
    // Set up intervals
    const alertInterval = setInterval(fetchAlerts, 30000); // Every 30 seconds
    const supervisorInterval = setInterval(fetchSupervisors, 15000); // Every 15 seconds
    
    return () => {
      clearInterval(alertInterval);
      clearInterval(supervisorInterval);
    };
  }, []);

  // Format time display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Get alert age text
  const getAlertAge = (startDate) => {
    if (!startDate) return 'Unknown age';
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just reported';
    if (diffMins < 60) return `Reported ${diffMins} minutes ago`;
    if (diffHours < 24) return `Reported ${diffHours} hours ago`;
    return `Reported ${Math.floor(diffHours / 24)} days ago`;
  };

  // Calculate data freshness
  const getDataFreshness = () => {
    if (!lastDataUpdate) return { status: 'fresh', text: 'Live', details: 'Data current' };
    
    const ageSeconds = Math.floor((new Date() - lastDataUpdate) / 1000);
    const ageMinutes = Math.floor(ageSeconds / 60);
    
    if (ageSeconds < 30) return { status: 'fresh', text: 'Live', details: 'Data current' };
    if (ageSeconds < 120) return { status: 'stale', text: `${ageSeconds}s old`, details: 'Data slightly stale' };
    return { status: 'old', text: `${ageMinutes}m old`, details: 'Data needs refresh' };
  };

  // Calculate metrics
  const currentAlert = currentAlerts[alertIndex];
  const criticalCount = currentAlerts.filter(a => a.severity === 'High').length;
  const affectedRoutesCount = new Set(currentAlerts.flatMap(a => a.affectsRoutes || [])).size;
  const mapAlertsCount = currentAlerts.filter(a => a.coordinates?.length === 2).length;
  const activeCount = activeSupervisors.filter(s => s.status === 'active').length;
  const awayCount = activeSupervisors.filter(s => s.status === 'away').length;
  const freshness = getDataFreshness();

  // Severity badge style helper
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'High': return { backgroundColor: '#ef4444', color: '#fff' };
      case 'Medium': return { backgroundColor: '#f59e0b', color: '#fff' };
      default: return { backgroundColor: '#10b981', color: '#fff' };
    }
  };

  // Freshness dot style helper
  const getFreshnessStyle = (status) => {
    switch (status) {
      case 'fresh': return { backgroundColor: '#10b981' };
      case 'stale': return { backgroundColor: '#f59e0b' };
      default: return { backgroundColor: '#ef4444' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>GO</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>BARRY Control</Text>
            <Text style={styles.logoSubtitle}>24/7 Traffic Monitoring</Text>
          </View>
        </View>

        <View style={styles.systemHealth}>
          <View style={styles.healthIndicator}>
            <Text style={styles.healthText}>OPERATIONAL</Text>
          </View>
          <View style={styles.systemMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{currentAlerts.length}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{criticalCount}</Text>
              <Text style={styles.metricLabel}>Critical</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{affectedRoutesCount}</Text>
              <Text style={styles.metricLabel}>Routes</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{mapAlertsCount}</Text>
              <Text style={styles.metricLabel}>On Map</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{activeSupervisors.length}</Text>
              <Text style={styles.metricLabel}>Supervisors</Text>
            </View>
          </View>
        </View>

        <View style={styles.dataFreshness}>
          <View style={styles.freshnessIndicator}>
            <View style={[styles.freshnessDot, getFreshnessStyle(freshness.status)]} />
            <Text style={styles.freshnessText}>{freshness.text}</Text>
          </View>
          <Text style={styles.freshnessDetails}>{freshness.details}</Text>
        </View>

        <View style={styles.supervisorsSection}>
          <Text style={styles.supervisorsTitle}>Supervisors</Text>
          <View style={styles.supervisorsSummary}>
            <View style={styles.statusIndicator} />
            <Text style={styles.supervisorsCount}>{activeCount} Active, {awayCount} Away</Text>
          </View>
          <Text style={styles.lastActivity}>No recent activity</Text>
        </View>

        <View style={styles.clockSection}>
          <Text style={styles.clock}>{formatTime(currentTime)}</Text>
          <Text style={styles.lastUpdate}>
            Last Update: {lastDataUpdate ? formatTime(lastDataUpdate) : '--:--'}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Alert Display Section */}
        <View style={styles.alertDisplaySection}>
          <View style={styles.alertHeader}>
            <View style={styles.alertTitleContainer}>
              <Text style={styles.alertIcon}>📡</Text>
              <Text style={styles.alertTitle}>Live Traffic Intelligence</Text>
            </View>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{currentAlerts.length}</Text>
            </View>
          </View>

          <View style={styles.currentAlert}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingIcon}>⏳</Text>
                <Text style={styles.loadingText}>Initializing traffic intelligence...</Text>
              </View>
            ) : connectionError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorText}>Unable to connect to traffic data services</Text>
              </View>
            ) : currentAlerts.length === 0 ? (
              <View style={styles.noAlertsContainer}>
                <Text style={styles.noAlertsIcon}>🛡️</Text>
                <Text style={styles.noAlertsTitle}>All Systems Clear</Text>
                <Text style={styles.noAlertsText}>No active traffic alerts detected</Text>
              </View>
            ) : currentAlert ? (
              <View style={styles.alertCard}>
                <Text style={styles.alertCounter}>
                  Alert {alertIndex + 1} of {currentAlerts.length}
                </Text>
                
                <View style={[styles.severityBadge, getSeverityStyle(currentAlert.severity)]}>
                  <Text style={styles.severityText}>
                    {(currentAlert.severity || 'UNKNOWN').toUpperCase()} PRIORITY
                  </Text>
                </View>

                <Text style={styles.alertCardTitle}>
                  {currentAlert.title || 'Traffic Alert'}
                </Text>

                <View style={styles.alertLocation}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>
                    {currentAlert.location || 'Location not specified'}
                  </Text>
                </View>

                <Text style={styles.alertDescription}>
                  {currentAlert.description || 'Traffic incident reported'}
                </Text>

                {currentAlert.affectsRoutes?.length > 0 && (
                  <View style={styles.routeImpact}>
                    <View style={styles.routeImpactHeader}>
                      <Text style={styles.routeIcon}>🚌</Text>
                      <Text style={styles.routeTitle}>
                        Affected Routes ({currentAlert.affectsRoutes.length})
                      </Text>
                    </View>
                    <View style={styles.routeBadges}>
                      {currentAlert.affectsRoutes.slice(0, 8).map((route, idx) => (
                        <View key={idx} style={styles.routeBadge}>
                          <Text style={styles.routeBadgeText}>{route}</Text>
                        </View>
                      ))}
                      {currentAlert.affectsRoutes.length > 8 && (
                        <Text style={styles.moreRoutesText}>
                          +{currentAlert.affectsRoutes.length - 8} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.alertMetadata}>
                  <View style={styles.alertAgeContainer}>
                    <Text style={styles.clockIcon}>🕐</Text>
                    <Text style={styles.alertAge}>{getAlertAge(currentAlert.startDate)}</Text>
                  </View>
                  <Text style={styles.alertSource}>
                    Source: {(currentAlert.source || 'SYSTEM').toUpperCase()}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Supervisors Panel */}
        <View style={styles.supervisorsPanel}>
          <View style={styles.supervisorsPanelHeader}>
            <Text style={styles.supervisorsIcon}>👥</Text>
            <Text style={styles.supervisorsPanelTitle}>Supervisors Online</Text>
          </View>

          <ScrollView style={styles.supervisorsList}>
            {activeSupervisors.length === 0 ? (
              <View style={styles.noSupervisorsContainer}>
                <Text style={styles.noSupervisorsIcon}>👤</Text>
                <Text style={styles.noSupervisorsTitle}>No Supervisors Online</Text>
                <Text style={styles.noSupervisorsText}>Waiting for supervisors to log in...</Text>
              </View>
            ) : (
              activeSupervisors.map((supervisor, idx) => (
                <View key={idx} style={styles.supervisorCard}>
                  <Text style={styles.supervisorName}>
                    {supervisor.name || 'Unknown Supervisor'}
                  </Text>
                  <Text style={styles.supervisorRole}>
                    {supervisor.role || 'Supervisor'}
                  </Text>
                  <View style={styles.supervisorActivity}>
                    <View style={[
                      styles.supervisorStatus,
                      supervisor.status === 'active' ? styles.statusActive :
                      supervisor.status === 'away' ? styles.statusAway : styles.statusOffline
                    ]} />
                    <Text style={styles.supervisorStatusText}>
                      {(supervisor.status || 'offline').charAt(0).toUpperCase() + 
                       (supervisor.status || 'offline').slice(1)} • Last: {
                        supervisor.lastActivity ? 
                        new Date(supervisor.lastActivity).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', minute: '2-digit' 
                        }) : 'Unknown'
                      }
                    </Text>
                  </View>
                </View>
              ))
            )}

            <View style={styles.shiftInfo}>
              <View style={styles.shiftHeader}>
                <Text style={styles.shiftIcon}>🕐</Text>
                <Text style={styles.shiftTitle}>Next Shift Change</Text>
              </View>
              <Text style={styles.shiftTime}>2h 15m</Text>
            </View>
          </ScrollView>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapTitle}>Live Traffic Map</Text>
          </View>
          
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            <Text style={styles.mapPlaceholderTitle}>Interactive Map</Text>
            <Text style={styles.mapPlaceholderSubtitle}>North East England Coverage</Text>
            <Text style={styles.mapPlaceholderNote}>
              {mapAlertsCount} alerts with coordinates shown on map
            </Text>
          </View>
        </View>
      </View>

      {/* Affected Areas Ticker */}
      <View style={styles.affectedAreasTicker}>
        <View style={styles.tickerContent}>
          {seriouslyAffectedAreas.length === 0 ? (
            <View style={styles.tickerItem}>
              <Text style={styles.tickerIcon}>🛡️</Text>
              <Text style={styles.tickerText}>
                No Seriously Affected Areas • All Routes Operating Normally
              </Text>
            </View>
          ) : (
            <View style={styles.tickerItem}>
              <Text style={styles.tickerIcon}>⚠️</Text>
              <Text style={styles.tickerText}>
                Seriously Affected Areas: {
                  seriouslyAffectedAreas.map(area => 
                    `${area.area} (${area.count} alerts)`
                  ).join(' • ')
                }
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#E31E24',
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#FF5252',
    shadowColor: '#E31E24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  logoTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  
  systemHealth: {
    alignItems: 'center',
    gap: 8,
  },
  healthIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  healthText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  systemMetrics: {
    flexDirection: 'row',
    gap: 32,
  },
  metric: {
    alignItems: 'center',
    minWidth: 90,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  dataFreshness: {
    alignItems: 'center',
    gap: 4,
  },
  freshnessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshnessDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  freshnessText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  freshnessDetails: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  
  supervisorsSection: {
    alignItems: 'center',
    gap: 8,
  },
  supervisorsTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  supervisorsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  supervisorsCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  lastActivity: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    textAlign: 'center',
  },
  
  clockSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  clock: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  lastUpdate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    padding: 32,
  },
  
  // Alert Display Section
  alertDisplaySection: {
    flex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    fontSize: 22,
  },
  alertTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  alertCount: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertCountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  currentAlert: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Loading/Error/No Alerts States
  loadingContainer: {
    alignItems: 'center',
    padding: 80,
  },
  loadingIcon: {
    fontSize: 40,
    marginBottom: 20,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
  },
  
  errorContainer: {
    alignItems: 'center',
    padding: 100,
  },
  errorIcon: {
    fontSize: 100,
    marginBottom: 40,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 20,
  },
  
  noAlertsContainer: {
    alignItems: 'center',
    padding: 100,
  },
  noAlertsIcon: {
    fontSize: 100,
    marginBottom: 40,
  },
  noAlertsTitle: {
    color: '#10b981',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  noAlertsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
  },
  
  // Alert Card
  alertCard: {
    backgroundColor: 'rgba(24, 35, 54, 0.85)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 12,
    borderLeftColor: '#ef4444',
    padding: 48,
  },
  alertCounter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertCardTitle: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 44,
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  alertDescription: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 28,
  },
  
  // Route Impact
  routeImpact: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  routeImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeIcon: {
    fontSize: 16,
  },
  routeTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  routeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  moreRoutesText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    alignSelf: 'center',
  },
  
  // Alert Metadata
  alertMetadata: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clockIcon: {
    fontSize: 16,
  },
  alertAge: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  alertSource: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  
  // Supervisors Panel
  supervisorsPanel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
  },
  supervisorsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  supervisorsIcon: {
    fontSize: 20,
  },
  supervisorsPanelTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  
  supervisorsList: {
    flex: 1,
  },
  noSupervisorsContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  noSupervisorsIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  noSupervisorsTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  noSupervisorsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
  
  supervisorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    marginBottom: 16,
  },
  supervisorName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  supervisorRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 10,
  },
  supervisorActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supervisorStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusAway: {
    backgroundColor: '#f59e0b',
  },
  statusOffline: {
    backgroundColor: '#6b7280',
  },
  supervisorStatusText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  
  shiftInfo: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    padding: 16,
    marginTop: 20,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  shiftIcon: {
    fontSize: 16,
  },
  shiftTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
  },
  shiftTime: {
    color: 'rgba(251, 191, 36, 0.8)',
    fontSize: 14,
  },
  
  // Map Container
  mapContainer: {
    flex: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  mapIcon: {
    fontSize: 20,
  },
  mapTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  mapPlaceholderTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapPlaceholderSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 16,
  },
  mapPlaceholderNote: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Affected Areas Ticker
  affectedAreasTicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E31E24',
    paddingVertical: 16,
    overflow: 'hidden',
  },
  tickerContent: {
    flexDirection: 'row',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  tickerIcon: {
    fontSize: 18,
  },
  tickerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EnhancedDisplayScreen;