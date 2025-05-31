// Go_BARRY/components/Dashboard.jsx - Optimized Version
import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useBarryAPI } from './hooks/useBARRYapi';

export default function Dashboard() {
  const {
    alerts,
    activeAlerts,
    criticalAlerts,
    upcomingAlerts,
    stats,
    loading,
    refreshing,
    error,
    lastFetch,
    forceRefresh,
    mostAffectedRoutes
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  const onRefresh = () => {
    forceRefresh();
  };

  if (loading && alerts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading traffic intelligence...</Text>
        </View>
      </View>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>System Offline</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3B82F6"
          colors={['#3B82F6']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* System Status Header */}
      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.systemTitle}>BARRY Control</Text>
          <Text style={styles.systemSubtitle}>Traffic Intelligence Dashboard</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statusText}>LIVE</Text>
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="ACTIVE"
          value={activeAlerts.length}
          total={alerts.length}
          color="#EF4444"
          icon="🚨"
        />
        <MetricCard
          title="CRITICAL"
          value={criticalAlerts.length}
          total={activeAlerts.length}
          color="#F59E0B"
          icon="⚠️"
        />
        <MetricCard
          title="PENDING"
          value={upcomingAlerts.length}
          total={alerts.length}
          color="#3B82F6"
          icon="📅"
        />
        <MetricCard
          title="ROUTES"
          value={mostAffectedRoutes.length}
          total="affected"
          color="#8B5CF6"
          icon="🚌"
        />
      </View>

      {/* Alert Types Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Distribution</Text>
        <View style={styles.breakdownGrid}>
          <BreakdownCard
            label="Roadworks"
            count={stats.totalRoadworks || 0}
            color="#8B5CF6"
          />
          <BreakdownCard
            label="Incidents"
            count={stats.totalIncidents || 0}
            color="#EF4444"
          />
          <BreakdownCard
            label="Congestion"
            count={stats.totalCongestion || 0}
            color="#F59E0B"
          />
        </View>
      </View>

      {/* Most Affected Routes */}
      {mostAffectedRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Impact Analysis</Text>
          <View style={styles.routesContainer}>
            {mostAffectedRoutes.slice(0, 8).map((routeImpact) => (
              <RouteImpactCard key={routeImpact.route} routeImpact={routeImpact} />
            ))}
          </View>
        </View>
      )}

      {/* Recent Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Alerts</Text>
          {criticalAlerts.slice(0, 3).map((alert) => (
            <CriticalAlertCard key={alert.id} alert={alert} />
          ))}
        </View>
      )}

      {/* System Info */}
      <View style={styles.systemInfo}>
        <Text style={styles.systemInfoText}>
          Last updated: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'}
        </Text>
      </View>
    </ScrollView>
  );
}

function MetricCard({ title, value, total, color, icon }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {typeof total === 'number' && (
        <Text style={styles.metricSubtext}>of {total}</Text>
      )}
    </View>
  );
}

function BreakdownCard({ label, count, color }) {
  return (
    <View style={styles.breakdownCard}>
      <View style={[styles.breakdownIndicator, { backgroundColor: color }]} />
      <Text style={styles.breakdownValue}>{count}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
  );
}

function RouteImpactCard({ routeImpact }) {
  const impactLevel = routeImpact.totalAlerts >= 3 ? 'high' : routeImpact.totalAlerts >= 2 ? 'medium' : 'low';
  
  return (
    <View style={[styles.routeCard, styles[`routeCard${impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1)}`]]}>
      <Text style={styles.routeNumber}>{routeImpact.route}</Text>
      <Text style={styles.routeAlerts}>{routeImpact.totalAlerts}</Text>
    </View>
  );
}

function CriticalAlertCard({ alert }) {
  return (
    <TouchableOpacity style={styles.criticalCard}>
      <View style={styles.criticalHeader}>
        <Text style={styles.criticalTitle} numberOfLines={1}>
          {alert.title}
        </Text>
        <Text style={styles.criticalTime}>
          {new Date(alert.lastUpdated).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.criticalLocation} numberOfLines={1}>
        {alert.location}
      </Text>
      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
        <Text style={styles.criticalRoutes}>
          Affects: {alert.affectsRoutes.slice(0, 5).join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  systemTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  systemSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricSubtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  breakdownIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  breakdownValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  breakdownLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 60,
  },
  routeCardHigh: {
    borderColor: '#EF4444',
    backgroundColor: '#1E1B1B',
  },
  routeCardMedium: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E1C1A',
  },
  routeCardLow: {
    borderColor: '#3B82F6',
    backgroundColor: '#1A1E2E',
  },
  routeNumber: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  routeAlerts: {
    color: '#94A3B8',
    fontSize: 10,
  },
  criticalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  criticalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  criticalTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  criticalTime: {
    color: '#64748B',
    fontSize: 11,
  },
  criticalLocation: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  criticalRoutes: {
    color: '#64748B',
    fontSize: 11,
  },
  systemInfo: {
    padding: 20,
    alignItems: 'center',
  },
  systemInfoText: {
    color: '#64748B',
    fontSize: 11,
  },
});