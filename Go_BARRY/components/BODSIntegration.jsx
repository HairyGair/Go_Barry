/*
 * Go BARRY - BODS Integration Component
 * Displays Bus Open Data Service information with timetables, vehicle locations, and fares
 * 
 * Features:
 * - Real-time vehicle positions from SIRI-VM
 * - Scheduled vs actual comparison
 * - Timetable data from TransXChange
 * - Fare information display
 * - Route performance analysis
 * 
 * Created: July 1, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../config/api';

const BODSIntegration = ({ 
  supervisorSession = null,
  onToggle = null,
  compact = false 
}) => {
  // State management
  const [bodsData, setBODSData] = useState({
    vehicleLocations: { success: false, data: [], loading: true },
    timetables: { success: false, data: [], loading: true },
    fares: { success: false, data: [], loading: true }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTab, setSelectedTab] = useState('vehicles');
  const [healthStatus, setHealthStatus] = useState(null);

  // Fetch BODS data
  const fetchBODSData = async (dataType = 'all', forceRefresh = false) => {
    try {
      const params = forceRefresh ? '?force_refresh=true' : '';
      
      if (dataType === 'all') {
        setLoading(true);
        setError(null);
        
        // Fetch all BODS data types in parallel
        const [vehiclesRes, timetablesRes, faresRes, healthRes] = await Promise.all([
          fetch(`${API_CONFIG.baseURL}/api/bods/vehicle-locations${params}`),
          fetch(`${API_CONFIG.baseURL}/api/bods/timetables${params}`),
          fetch(`${API_CONFIG.baseURL}/api/bods/fares${params}`),
          fetch(`${API_CONFIG.baseURL}/api/bods/health`)
        ]);

        const [vehicles, timetables, fares, health] = await Promise.all([
          vehiclesRes.json(),
          timetablesRes.json(),
          faresRes.json(),
          healthRes.json()
        ]);

        setBODSData({
          vehicleLocations: vehicles,
          timetables: timetables,
          fares: fares
        });
        
        setHealthStatus(health);
        setLastUpdated(new Date());
        setLoading(false);
        
      } else {
        // Fetch specific data type
        const response = await fetch(`${API_CONFIG.baseURL}/api/bods/${dataType}${params}`);
        const data = await response.json();
        
        setBODSData(prev => ({
          ...prev,
          [dataType]: data
        }));
      }
      
    } catch (err) {
      console.error('❌ BODS fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBODSData();
  }, []);

  // Auto-refresh every 30 seconds for vehicle locations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBODSData('vehicle-locations');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Process vehicle location data for display
  const processedVehicles = useMemo(() => {
    if (!bodsData.vehicleLocations.success || !bodsData.vehicleLocations.data) {
      return [];
    }

    return bodsData.vehicleLocations.data
      .filter(vehicle => vehicle.coordinates && vehicle.routeId)
      .map(vehicle => ({
        ...vehicle,
        displayName: `Route ${vehicle.routeId}`,
        statusColor: vehicle.delay > 300 ? '#EF4444' : vehicle.delay > 120 ? '#F59E0B' : '#10B981',
        statusText: vehicle.delay > 300 ? 'Delayed' : vehicle.delay > 120 ? 'Running Late' : 'On Time'
      }))
      .sort((a, b) => (a.routeId || '').localeCompare(b.routeId || ''));
  }, [bodsData.vehicleLocations]);

  // Get summary statistics
  const stats = useMemo(() => {
    const vehicles = processedVehicles;
    const onTime = vehicles.filter(v => v.delay <= 120).length;
    const delayed = vehicles.filter(v => v.delay > 120).length;
    const routes = new Set(vehicles.map(v => v.routeId)).size;

    return {
      totalVehicles: vehicles.length,
      onTimeVehicles: onTime,
      delayedVehicles: delayed,
      uniqueRoutes: routes,
      onTimePercentage: vehicles.length > 0 ? Math.round((onTime / vehicles.length) * 100) : 0
    };
  }, [processedVehicles]);

  // Render vehicle locations tab
  const VehicleLocationsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalVehicles}</Text>
          <Text style={styles.statLabel}>Total Vehicles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.onTimeVehicles}</Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.delayedVehicles}</Text>
          <Text style={styles.statLabel}>Delayed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.uniqueRoutes}</Text>
          <Text style={styles.statLabel}>Routes</Text>
        </View>
      </View>

      <View style={styles.performanceIndicator}>
        <Text style={styles.performanceLabel}>System Performance</Text>
        <View style={styles.performanceBar}>
          <View 
            style={[
              styles.performanceBarFill, 
              { 
                width: `${stats.onTimePercentage}%`,
                backgroundColor: stats.onTimePercentage >= 80 ? '#10B981' : 
                                stats.onTimePercentage >= 60 ? '#F59E0B' : '#EF4444'
              }
            ]} 
          />
        </View>
        <Text style={styles.performanceText}>{stats.onTimePercentage}% On Time</Text>
      </View>

      {processedVehicles.length > 0 ? (
        <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
          {processedVehicles.slice(0, compact ? 5 : 20).map(vehicle => (
            <View key={vehicle.id || vehicle.vehicleRef} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <Text style={styles.vehicleRoute}>🚌 {vehicle.displayName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: vehicle.statusColor }]}>
                  <Text style={styles.statusText}>{vehicle.statusText}</Text>
                </View>
              </View>
              
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleDetail}>
                  📍 Lat: {vehicle.coordinates[0].toFixed(4)}, Lng: {vehicle.coordinates[1].toFixed(4)}
                </Text>
                {vehicle.delay && (
                  <Text style={styles.vehicleDetail}>
                    ⏱️ Delay: {Math.round(vehicle.delay / 60)} minutes
                  </Text>
                )}
                {vehicle.timestamp && (
                  <Text style={styles.vehicleDetail}>
                    🕐 Updated: {new Date(vehicle.timestamp).toLocaleTimeString()}
                  </Text>
                )}
                <Text style={styles.vehicleDetail}>
                  📡 Source: {vehicle.format || 'BODS'}
                </Text>
              </View>
            </View>
          ))}
          
          {processedVehicles.length > (compact ? 5 : 20) && (
            <Text style={styles.showMoreText}>
              ... and {processedVehicles.length - (compact ? 5 : 20)} more vehicles
            </Text>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🚌</Text>
          <Text style={styles.emptyStateText}>No vehicle locations available</Text>
          <Text style={styles.emptyStateSubtext}>
            {bodsData.vehicleLocations.loading ? 'Loading...' : 'Check BODS connectivity'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render timetables tab
  const TimetablesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.timetableHeader}>
        <Text style={styles.timetableTitle}>📅 Schedule Information</Text>
        <Text style={styles.timetableSubtitle}>
          {bodsData.timetables.data?.length || 0} timetable entries from TransXChange
        </Text>
      </View>

      {bodsData.timetables.success && bodsData.timetables.data?.length > 0 ? (
        <ScrollView style={styles.timetableList} showsVerticalScrollIndicator={false}>
          {bodsData.timetables.data.slice(0, compact ? 3 : 10).map((timetable, index) => (
            <View key={timetable.datasetId || index} style={styles.timetableCard}>
              <Text style={styles.timetableRoute}>
                🚌 {timetable.serviceName || timetable.routeId}
              </Text>
              <Text style={styles.timetableDetail}>
                📋 Dataset: {timetable.datasetId}
              </Text>
              <Text style={styles.timetableDetail}>
                🏢 Operator: {timetable.operatorRef || 'Go North East'}
              </Text>
              <Text style={styles.timetableDetail}>
                🕐 Last Modified: {timetable.lastModified ? 
                  new Date(timetable.lastModified).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📅</Text>
          <Text style={styles.emptyStateText}>No timetable data available</Text>
          <Text style={styles.emptyStateSubtext}>
            {bodsData.timetables.loading ? 'Loading...' : 'Check TransXChange feeds'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render fares tab
  const FaresTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.faresHeader}>
        <Text style={styles.faresTitle}>💷 Fare Information</Text>
        <Text style={styles.faresSubtitle}>
          {bodsData.fares.data?.length || 0} fare entries from NeTEx
        </Text>
      </View>

      {bodsData.fares.success && bodsData.fares.data?.length > 0 ? (
        <ScrollView style={styles.faresList} showsVerticalScrollIndicator={false}>
          {bodsData.fares.data.slice(0, compact ? 3 : 10).map((fare, index) => (
            <View key={fare.datasetId || index} style={styles.fareCard}>
              <Text style={styles.fareRoute}>
                🚌 {fare.routeId || 'General Fares'}
              </Text>
              <Text style={styles.fareDetail}>
                📋 Dataset: {fare.datasetId}
              </Text>
              <Text style={styles.fareDetail}>
                💷 Products: {fare.fareProducts?.length || 0}
              </Text>
              <Text style={styles.fareDetail}>
                🗺️ Zones: {fare.tariffZones?.length || 0}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💷</Text>
          <Text style={styles.emptyStateText}>No fare data available</Text>
          <Text style={styles.emptyStateSubtext}>
            {bodsData.fares.loading ? 'Loading...' : 'Check NeTEx feeds'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render comparison feature (scheduled vs actual)
  const ComparisonTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comparisonHeader}>
        <Text style={styles.comparisonTitle}>⚖️ Scheduled vs Actual</Text>
        <Text style={styles.comparisonSubtitle}>
          Performance analysis combining GTFS and live BODS data
        </Text>
      </View>

      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonText}>
          🚧 Advanced comparison features coming soon
        </Text>
        <Text style={styles.comparisonDetail}>
          This will compare GTFS scheduled times with live SIRI-VM data to show:
        </Text>
        <Text style={styles.comparisonItem}>• Route punctuality analysis</Text>
        <Text style={styles.comparisonItem}>• Service delay patterns</Text>
        <Text style={styles.comparisonItem}>• Stop-level performance</Text>
        <Text style={styles.comparisonItem}>• Historical trending</Text>
      </View>
    </View>
  );

  // Render health status
  const HealthStatus = () => {
    if (!healthStatus) return null;

    const isHealthy = healthStatus.status === 'healthy';
    const isDegraded = healthStatus.status === 'degraded';

    return (
      <View style={styles.healthContainer}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthIcon}>
            {isHealthy ? '🟢' : isDegraded ? '🟡' : '🔴'}
          </Text>
          <Text style={styles.healthTitle}>BODS Service Health</Text>
          <Text style={[
            styles.healthStatus,
            { 
              color: isHealthy ? '#10B981' : isDegraded ? '#F59E0B' : '#EF4444' 
            }
          ]}>
            {healthStatus.status?.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.healthStats}>
          <Text style={styles.healthStat}>
            📊 Success Rate: {healthStatus.metrics?.requests?.successRate || '0%'}
          </Text>
          <Text style={styles.healthStat}>
            ⚡ Avg Response: {healthStatus.metrics?.performance?.avgResponseTime || 'Unknown'}
          </Text>
          <Text style={styles.healthStat}>
            🔄 API Calls: {healthStatus.metrics?.requests?.total || 0}
          </Text>
        </View>
      </View>
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBODSData('all', true);
  };

  // Compact view for dashboard
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>🚌 BODS Integration</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        <HealthStatus />
        
        <View style={styles.compactStats}>
          <Text style={styles.compactStat}>
            🚌 {stats.totalVehicles} vehicles • {stats.onTimePercentage}% on time
          </Text>
          <Text style={styles.compactStat}>
            📅 {bodsData.timetables.data?.length || 0} timetables • 💷 {bodsData.fares.data?.length || 0} fares
          </Text>
        </View>

        {lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  }

  // Full view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚌 Bus Open Data Service (BODS)</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <HealthStatus />

      {loading && !lastUpdated ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading BODS data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error: {error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            {[
              { key: 'vehicles', label: 'Live Vehicles', icon: '🚌' },
              { key: 'timetables', label: 'Timetables', icon: '📅' },
              { key: 'fares', label: 'Fares', icon: '💷' },
              { key: 'comparison', label: 'Analysis', icon: '⚖️' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  selectedTab === tab.key && styles.tabButtonActive
                ]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[
                  styles.tabLabel,
                  selectedTab === tab.key && styles.tabLabelActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {selectedTab === 'vehicles' && <VehicleLocationsTab />}
          {selectedTab === 'timetables' && <TimetablesTab />}
          {selectedTab === 'fares' && <FaresTab />}
          {selectedTab === 'comparison' && <ComparisonTab />}

          {lastUpdated && (
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  compactContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  healthContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  healthIcon: {
    fontSize: 16,
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  healthStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthStat: {
    fontSize: 10,
    color: '#64748B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1E293B',
  },
  tabContent: {
    minHeight: 200,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  compactStats: {
    gap: 4,
    marginBottom: 8,
  },
  compactStat: {
    fontSize: 11,
    color: '#64748B',
  },
  performanceIndicator: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  performanceText: {
    fontSize: 10,
    color: '#6B7280',
  },
  vehicleList: {
    maxHeight: 300,
  },
  vehicleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleRoute: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  vehicleDetails: {
    gap: 2,
  },
  vehicleDetail: {
    fontSize: 10,
    color: '#64748B',
  },
  timetableHeader: {
    marginBottom: 12,
  },
  timetableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  timetableSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  timetableList: {
    maxHeight: 250,
  },
  timetableCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  timetableRoute: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  timetableDetail: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  faresHeader: {
    marginBottom: 12,
  },
  faresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  faresSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  faresList: {
    maxHeight: 250,
  },
  fareCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  fareRoute: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  fareDetail: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  comparisonSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  comparisonCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 12,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  comparisonDetail: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  comparisonItem: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  showMoreText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default BODSIntegration;