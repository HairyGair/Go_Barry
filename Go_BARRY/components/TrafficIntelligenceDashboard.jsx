// traffic-watch/components/TrafficIntelligenceDashboard.jsx
// Comprehensive traffic intelligence dashboard for BARRY
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { 
  Activity,
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  Navigation,
  Zap,
  Car,
  MapPin,
  BarChart3,
  Route,
  Timer
} from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TrafficIntelligenceDashboard = ({ 
  baseUrl = 'https://go-barry.onrender.com',
  onAlertPress = null,
  onRoutePress = null,
  autoRefreshInterval = 60000, // 1 minute for traffic data
  style = {}
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [trafficIntelligence, setTrafficIntelligence] = useState(null);
  const [routeDelays, setRouteDelays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-refresh for real-time traffic data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrafficIntelligence(true); // Silent refresh
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Fetch comprehensive traffic intelligence
  const fetchTrafficIntelligence = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }
      setError(null);

      // Fetch multiple endpoints in parallel
      const [alertsResponse, trafficResponse, routeDelaysResponse] = await Promise.all([
        fetch(`${baseUrl}/api/alerts`),
        fetch(`${baseUrl}/api/traffic-intelligence`),
        fetch(`${baseUrl}/api/route-delays`)
      ]);

      if (!alertsResponse.ok || !trafficResponse.ok || !routeDelaysResponse.ok) {
        throw new Error('One or more API endpoints failed');
      }

      const [alertsData, trafficData, routeData] = await Promise.all([
        alertsResponse.json(),
        trafficResponse.json(),
        routeDelaysResponse.json()
      ]);

      if (alertsData.success && trafficData.success && routeData.success) {
        setDashboardData(alertsData);
        setTrafficIntelligence(trafficData.trafficIntelligence);
        setRouteDelays(routeData);
        setLastRefresh(new Date());
        setIsOnline(true);
      } else {
        throw new Error('Invalid response from traffic intelligence APIs');
      }

    } catch (err) {
      setError(err.message);
      setIsOnline(false);
      console.error('Traffic Intelligence fetch error:', err);
      
      if (!silent) {
        Alert.alert(
          'Traffic Data Error',
          'Unable to fetch latest traffic intelligence. Please check your connection.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  // Initial load
  useEffect(() => {
    fetchTrafficIntelligence();
  }, [fetchTrafficIntelligence]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading traffic intelligence...</Text>
      </View>
    );
  }

  const stats = dashboardData?.metadata?.statistics || {};
  const intelligence = trafficIntelligence || {};
  const routes = routeDelays?.routeDelays || [];

  return (
    <ScrollView 
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchTrafficIntelligence}
          colors={['#60A5FA']}
          tintColor="#60A5FA"
          title="Updating traffic intelligence..."
          titleColor="#9CA3AF"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Real-time Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🚦 Traffic Intelligence</Text>
          <View style={styles.statusRow}>
            {isOnline ? (
              <Wifi size={16} color="#10B981" />
            ) : (
              <WifiOff size={16} color="#EF4444" />
            )}
            <Text style={[styles.statusText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
              {isOnline ? 'Live Data' : 'Offline'}
            </Text>
            {lastRefresh && (
              <Text style={styles.lastUpdateText}>
                • Updated {lastRefresh.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchTrafficIntelligence(false)}
          disabled={refreshing}
        >
          <RefreshCw 
            size={20} 
            color="#60A5FA"
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Traffic Overview Cards */}
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, styles.incidentCard]}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.overviewNumber}>{intelligence.summary?.incidents || 0}</Text>
          <Text style={styles.overviewLabel}>Active Incidents</Text>
          <Text style={styles.overviewSubtext}>Requiring attention</Text>
        </View>

        <View style={[styles.overviewCard, styles.congestionCard]}>
          <Activity size={24} color="#F59E0B" />
          <Text style={styles.overviewNumber}>{intelligence.summary?.congestion || 0}</Text>
          <Text style={styles.overviewLabel}>Congestion Areas</Text>
          <Text style={styles.overviewSubtext}>Traffic slowdowns</Text>
        </View>

        <View style={[styles.overviewCard, styles.severeCard]}>
          <Zap size={24} color="#DC2626" />
          <Text style={styles.overviewNumber}>{intelligence.summary?.severeTraffic || 0}</Text>
          <Text style={styles.overviewLabel}>Severe Traffic</Text>
          <Text style={styles.overviewSubtext}>Level 8+ congestion</Text>
        </View>

        <View style={[styles.overviewCard, styles.averageCard]}>
          <BarChart3 size={24} color="#8B5CF6" />
          <Text style={styles.overviewNumber}>{intelligence.summary?.averageCongestionLevel || 0}</Text>
          <Text style={styles.overviewLabel}>Avg. Congestion</Text>
          <Text style={styles.overviewSubtext}>0-10 scale</Text>
        </View>
      </View>

      {/* Current Traffic Hotspots */}
      {intelligence.hotspots && intelligence.hotspots.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔴 Traffic Hotspots</Text>
          <Text style={styles.sectionSubtitle}>Areas with significant congestion</Text>
          
          {intelligence.hotspots.slice(0, 6).map((hotspot, index) => (
            <TouchableOpacity
              key={hotspot.id}
              style={styles.hotspotCard}
              onPress={onAlertPress ? () => onAlertPress(hotspot) : null}
              activeOpacity={0.7}
            >
              <View style={styles.hotspotHeader}>
                <View style={styles.hotspotLeft}>
                  <View style={[
                    styles.congestionIndicator, 
                    { backgroundColor: getCongestionColor(hotspot.congestionLevel) }
                  ]}>
                    <Text style={styles.congestionLevel}>{hotspot.congestionLevel}</Text>
                  </View>
                  <View style={styles.hotspotInfo}>
                    <Text style={styles.hotspotTitle} numberOfLines={1}>
                      {hotspot.title}
                    </Text>
                    <Text style={styles.hotspotLocation} numberOfLines={1}>
                      {hotspot.location}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.hotspotRight}>
                  {hotspot.delayMinutes > 0 && (
                    <View style={styles.delayBadge}>
                      <Timer size={12} color="#FFFFFF" />
                      <Text style={styles.delayText}>{hotspot.delayMinutes}m</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {hotspot.affectsRoutes && hotspot.affectsRoutes.length > 0 && (
                <View style={styles.hotspotRoutes}>
                  <Text style={styles.routesLabel}>Routes: </Text>
                  <Text style={styles.routesList}>
                    {hotspot.affectsRoutes.slice(0, 6).join(', ')}
                    {hotspot.affectsRoutes.length > 6 && ` +${hotspot.affectsRoutes.length - 6} more`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Incidents */}
      {intelligence.incidents && intelligence.incidents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Active Incidents</Text>
          <Text style={styles.sectionSubtitle}>High priority traffic incidents</Text>
          
          {intelligence.incidents.slice(0, 5).map((incident, index) => (
            <TouchableOpacity
              key={incident.id}
              style={styles.incidentCard}
              onPress={onAlertPress ? () => onAlertPress(incident) : null}
              activeOpacity={0.7}
            >
              <View style={styles.incidentHeader}>
                <AlertTriangle size={16} color="#EF4444" />
                <Text style={styles.incidentTitle} numberOfLines={1}>
                  {incident.title}
                </Text>
                <Text style={styles.incidentTime}>
                  {incident.lastUpdated ? 
                    new Date(incident.lastUpdated).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Active'
                  }
                </Text>
              </View>
              
              <View style={styles.incidentBody}>
                <MapPin size={12} color="#9CA3AF" />
                <Text style={styles.incidentLocation} numberOfLines={1}>
                  {incident.location}
                </Text>
              </View>
              
              {incident.roadClosed && (
                <View style={styles.roadClosedBadge}>
                  <Text style={styles.roadClosedText}>ROAD CLOSED</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Route Delay Analysis */}
      {routes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🚌 Route Delays</Text>
            {routeDelays?.analysis?.summary && (
              <TouchableOpacity onPress={onRoutePress}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>Bus routes with current delays</Text>
          
          {/* Summary Stats */}
          {routeDelays?.analysis?.summary && (
            <View style={styles.routeSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {routeDelays.analysis.summary.routesWithDelays}
                </Text>
                <Text style={styles.summaryLabel}>Routes Delayed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {routeDelays.analysis.summary.averageDelay}m
                </Text>
                <Text style={styles.summaryLabel}>Avg Delay</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {Math.round(routeDelays.analysis.summary.totalDelayMinutes / 60)}h
                </Text>
                <Text style={styles.summaryLabel}>Total Lost</Text>
              </View>
            </View>
          )}
          
          {/* Top Delayed Routes */}
          {routeDelays?.analysis?.worstAffected?.slice(0, 8).map((route, index) => (
            <TouchableOpacity
              key={route.route}
              style={styles.routeCard}
              onPress={onRoutePress ? () => onRoutePress(route) : null}
              activeOpacity={0.7}
            >
              <View style={styles.routeCardHeader}>
                <View style={styles.routeNumberContainer}>
                  <Text style={styles.routeNumber}>{route.route}</Text>
                </View>
                
                <View style={styles.routeInfo}>
                  <Text style={styles.routeDelayText}>
                    {route.averageDelay}min avg delay
                  </Text>
                  <Text style={styles.routeCauseText}>
                    {route.incidents > 0 ? `${route.incidents} incident${route.incidents > 1 ? 's' : ''}` :
                     route.congestion > 0 ? `${route.congestion} congestion area${route.congestion > 1 ? 's' : ''}` :
                     route.roadworks > 0 ? `${route.roadworks} roadwork${route.roadworks > 1 ? 's' : ''}` :
                     'Multiple causes'}
                  </Text>
                </View>
                
                <View style={styles.routeMetrics}>
                  <Text style={styles.totalDelayText}>
                    {route.totalDelayMinutes}m total
                  </Text>
                  <Text style={styles.alertCountText}>
                    {route.alertCount} alert{route.alertCount > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Data Sources Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Data Sources</Text>
        <View style={styles.sourcesGrid}>
          {intelligence.dataQuality && (
            <>
              <View style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <Activity size={20} color="#60A5FA" />
                  <Text style={styles.sourceTitle}>HERE Traffic</Text>
                </View>
                <Text style={styles.sourceStatus}>
                  {intelligence.dataQuality.sources > 0 ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.sourceDescription}>
                  Real-time flow & jam factor
                </Text>
              </View>

              <View style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <MapPin size={20} color="#10B981" />
                  <Text style={styles.sourceTitle}>MapQuest</Text>
                </View>
                <Text style={styles.sourceStatus}>
                  {intelligence.dataQuality.sources > 1 ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.sourceDescription}>
                  Incident details & events
                </Text>
              </View>

              <View style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <Route size={20} color="#8B5CF6" />
                  <Text style={styles.sourceTitle}>National Highways</Text>
                </View>
                <Text style={styles.sourceStatus}>
                  {intelligence.dataQuality.sources > 2 ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.sourceDescription}>
                  Major road incidents
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* System Performance */}
      {intelligence.dataQuality && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ System Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.performanceLabel}>Data Sources</Text>
              <Text style={styles.performanceValue}>
                {intelligence.dataQuality.successfulSources}/{intelligence.dataQuality.sources}
              </Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Clock size={16} color="#60A5FA" />
              <Text style={styles.performanceLabel}>Update Rate</Text>
              <Text style={styles.performanceValue}>1-2 min</Text>
            </View>
            
            {intelligence.dataQuality.apiCalls && (
              <>
                <View style={styles.performanceItem}>
                  <BarChart3 size={16} color="#F59E0B" />
                  <Text style={styles.performanceLabel}>HERE Usage</Text>
                  <Text style={styles.performanceValue}>
                    {intelligence.dataQuality.apiCalls.here?.used || 0}/1000
                  </Text>
                </View>
                
                <View style={styles.performanceItem}>
                  <Navigation size={16} color="#8B5CF6" />
                  <Text style={styles.performanceLabel}>MapQuest Usage</Text>
                  <Text style={styles.performanceValue}>
                    {intelligence.dataQuality.apiCalls.mapquest?.used || 0}/15000
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.errorTitle}>Data Connection Issue</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchTrafficIntelligence(false)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// Helper function to get congestion level color
const getCongestionColor = (level) => {
  if (level >= 8) return '#DC2626'; // Red
  if (level >= 6) return '#D97706'; // Amber  
  if (level >= 4) return '#F59E0B'; // Yellow
  return '#10B981'; // Green
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  lastUpdateText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  incidentCard: {
    borderLeftColor: '#EF4444',
  },
  congestionCard: {
    borderLeftColor: '#F59E0B',
  },
  severeCard: {
    borderLeftColor: '#DC2626',
  },
  averageCard: {
    borderLeftColor: '#8B5CF6',
  },
  overviewNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  overviewLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  overviewSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  viewAllText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  hotspotCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  hotspotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hotspotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  congestionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  congestionLevel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hotspotLocation: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  hotspotRight: {
    alignItems: 'flex-end',
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  hotspotRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routesLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  routesList: {
    color: '#60A5FA',
    fontSize: 12,
    flex: 1,
  },
  incidentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  incidentTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  incidentTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  incidentBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentLocation: {
    color: '#D1D5DB',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  roadClosedBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roadClosedText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  routeSummary: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  routeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumberContainer: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeInfo: {
    flex: 1,
  },
  routeDelayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  routeCauseText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  routeMetrics: {
    alignItems: 'flex-end',
  },
  totalDelayText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  alertCountText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  sourcesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sourceStatus: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceDescription: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceItem: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  performanceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  performanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
  },
  errorTitle: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TrafficIntelligenceDashboard;