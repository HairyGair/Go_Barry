/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Live Map Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { useConvexSync } from '../../hooks/useConvexSync';
import darkTheme from './styles/darkTheme';
import SectionHeader from './components/SectionHeader';
import TomTomTrafficMap from '../../components/TomTomTrafficMap';

export default function LiveMap() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const { activeAlerts, activeEvents, activeSupervisors } = useConvexSync();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Map state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [mapFilters, setMapFilters] = useState({
    showRoadworks: true,
    showClustering: false,
    showAffectedRoutes: true,
    severityFilter: 'all'
  });
  const [overlayRoutes, setOverlayRoutes] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      router.replace('/');
    }
  }, [supervisorSession, isAdmin, router]);

  // Filter alerts based on severity
  const filteredAlerts = activeAlerts.filter(alert => {
    if (mapFilters.severityFilter === 'all') return true;
    return alert.severity?.toLowerCase() === mapFilters.severityFilter;
  });

  // Calculate statistics
  const stats = {
    total: activeAlerts.length,
    critical: activeAlerts.filter(a => a.severity?.toLowerCase() === 'critical').length,
    high: activeAlerts.filter(a => a.severity?.toLowerCase() === 'high').length,
    medium: activeAlerts.filter(a => a.severity?.toLowerCase() === 'medium').length,
    affectedRoutes: [...new Set(activeAlerts.flatMap(a => a.affectsRoutes || []))].length
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkerClick = (alert) => {
    setSelectedAlert(alert);
    // Show affected routes on map
    if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
      setOverlayRoutes(alert.affectsRoutes);
    }
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return darkTheme.error;
      case 'high':
        return darkTheme.warning;
      case 'medium':
        return darkTheme.primary;
      default:
        return darkTheme.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbc2eb" />
        <Text style={styles.loadingText}>Loading Live Map...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Live Map',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fbc2eb"
            />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="map-marker-radius" size={32} color="#fbc2eb" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Live Map</Text>
              <Text style={styles.pageSubtitle}>Real-time traffic intelligence</Text>
            </View>
          </View>

          {/* Alert Statistics */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: darkTheme.surface }]}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Alerts</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: darkTheme.errorDim }]}>
              <Text style={[styles.statValue, { color: darkTheme.error }]}>{stats.critical}</Text>
              <Text style={[styles.statLabel, { color: darkTheme.error }]}>Critical</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: darkTheme.warningDim }]}>
              <Text style={[styles.statValue, { color: darkTheme.warning }]}>{stats.high}</Text>
              <Text style={[styles.statLabel, { color: darkTheme.warning }]}>High</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: darkTheme.primaryDim }]}>
              <Text style={[styles.statValue, { color: darkTheme.primary }]}>{stats.medium}</Text>
              <Text style={[styles.statLabel, { color: darkTheme.primary }]}>Medium</Text>
            </View>
          </View>

          {/* Map Filters */}
          <SectionHeader title="Map Controls" />
          <View style={styles.filtersContainer}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Severity Filter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {['all', 'critical', 'high', 'medium'].map(severity => (
                  <TouchableOpacity
                    key={severity}
                    style={[styles.filterChip, mapFilters.severityFilter === severity && styles.filterChipActive]}
                    onPress={() => setMapFilters({ ...mapFilters, severityFilter: severity })}
                  >
                    <Text style={[styles.filterChipText, mapFilters.severityFilter === severity && styles.filterChipTextActive]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.togglesRow}>
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setMapFilters({ ...mapFilters, showRoadworks: !mapFilters.showRoadworks })}
              >
                <MaterialCommunityIcons 
                  name={mapFilters.showRoadworks ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={20} 
                  color={mapFilters.showRoadworks ? darkTheme.primary : darkTheme.textSecondary} 
                />
                <Text style={styles.toggleLabel}>Roadwork Zones</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setMapFilters({ ...mapFilters, showClustering: !mapFilters.showClustering })}
              >
                <MaterialCommunityIcons 
                  name={mapFilters.showClustering ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={20} 
                  color={mapFilters.showClustering ? darkTheme.primary : darkTheme.textSecondary} 
                />
                <Text style={styles.toggleLabel}>Clustering</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setMapFilters({ ...mapFilters, showAffectedRoutes: !mapFilters.showAffectedRoutes })}
              >
                <MaterialCommunityIcons 
                  name={mapFilters.showAffectedRoutes ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={20} 
                  color={mapFilters.showAffectedRoutes ? darkTheme.primary : darkTheme.textSecondary} 
                />
                <Text style={styles.toggleLabel}>Affected Routes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Traffic Map */}
          <SectionHeader title="Traffic Map" />
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <TomTomTrafficMap
                alerts={filteredAlerts}
                currentAlert={selectedAlert}
                showRoadworks={mapFilters.showRoadworks}
                showAffectedRoutes={mapFilters.showAffectedRoutes}
                showClustering={mapFilters.showClustering}
                showRouteOverlays={overlayRoutes.length > 0}
                overlayRoutes={overlayRoutes}
                onMarkerClick={handleMarkerClick}
                style={{ height: 500 }}
              />
            ) : (
              <View style={styles.mapFallback}>
                <MaterialCommunityIcons name="map" size={48} color={darkTheme.textSecondary} />
                <Text style={styles.mapFallbackText}>Map view available on web only</Text>
              </View>
            )}
          </View>

          {/* Selected Alert Details */}
          {selectedAlert && (
            <View style={styles.selectedAlertContainer}>
              <View style={styles.selectedAlertHeader}>
                <Text style={styles.selectedAlertTitle}>Selected Alert</Text>
                <TouchableOpacity onPress={() => { setSelectedAlert(null); setOverlayRoutes([]); }}>
                  <MaterialCommunityIcons name="close" size={24} color={darkTheme.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.selectedAlertContent}>
                <Text style={styles.alertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.alertLocation}>{selectedAlert.location}</Text>
                <View style={styles.alertMeta}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedAlert.severity) }]}>
                    <Text style={styles.severityText}>{selectedAlert.severity?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.alertSource}>{selectedAlert.source}</Text>
                </View>
                {selectedAlert.affectsRoutes && selectedAlert.affectsRoutes.length > 0 && (
                  <View style={styles.affectedRoutes}>
                    <Text style={styles.affectedRoutesLabel}>Affected Routes:</Text>
                    <View style={styles.routeChips}>
                      {selectedAlert.affectsRoutes.map(route => (
                        <View key={route} style={styles.routeChip}>
                          <Text style={styles.routeChipText}>{route}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Active Events */}
          {activeEvents.length > 0 && (
            <>
              <SectionHeader title="Active Events" />
              <View style={styles.eventsContainer}>
                {activeEvents.map(event => (
                  <View key={event._id} style={styles.eventCard}>
                    <MaterialCommunityIcons 
                      name={event.severity === 'critical' ? 'alert-circle' : 'calendar-clock'} 
                      size={24} 
                      color={getSeverityColor(event.severity)} 
                    />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventName}>{event.event}</Text>
                      <Text style={styles.eventVenue}>{event.venue}</Text>
                      <Text style={styles.eventTime}>{new Date(event.startTime).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Active Supervisors */}
          <SectionHeader title="Active Personnel" />
          <View style={styles.supervisorsContainer}>
            {activeSupervisors.map(supervisor => (
              <View key={supervisor._id} style={styles.supervisorChip}>
                <MaterialCommunityIcons name="account-circle" size={20} color={darkTheme.success} />
                <Text style={styles.supervisorName}>{supervisor.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 194, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
  },
  statLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: darkTheme.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterChipActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: darkTheme.background,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 14,
    color: darkTheme.text,
  },
  mapContainer: {
    height: 500,
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.surface,
  },
  mapFallbackText: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  selectedAlertContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  selectedAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedAlertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
  },
  selectedAlertContent: {
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: darkTheme.text,
  },
  alertLocation: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: darkTheme.background,
    fontSize: 12,
    fontWeight: '600',
  },
  alertSource: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  affectedRoutes: {
    marginTop: 8,
  },
  affectedRoutesLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  routeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeChip: {
    backgroundColor: darkTheme.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeChipText: {
    fontSize: 12,
    color: darkTheme.primary,
  },
  eventsContainer: {
    marginBottom: 24,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  eventVenue: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  eventTime: {
    fontSize: 11,
    color: darkTheme.textTertiary,
  },
  supervisorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  supervisorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: darkTheme.successDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  supervisorName: {
    fontSize: 12,
    color: darkTheme.success,
    fontWeight: '500',
  },
});
