// components/TrafficFlowDashboard.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveFlows, useCriticalFlows } from '../hooks/useTrafficFlow';
// TrafficFlowIndicator removed during cleanup

const TrafficFlowDashboard = () => {
  const { activeFlows, count: activeCount, isLoading: loadingActive } = useActiveFlows();
  const { criticalFlows, highFlows, totalCritical, isLoading: loadingCritical } = useCriticalFlows();

  if (loadingActive || loadingCritical) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ee7203" />
        <Text style={styles.loadingText}>Loading traffic flow data...</Text>
      </View>
    );
  }

  const getStatusColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#991b1b';
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Monitors</Text>
          <View style={[styles.indicator, { backgroundColor: '#10b981' }]} />
        </View>
        
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {criticalFlows.length}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
          <View style={[styles.indicator, { backgroundColor: '#ef4444' }]} />
        </View>
        
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {highFlows.length}
          </Text>
          <Text style={styles.statLabel}>High Severity</Text>
          <View style={[styles.indicator, { backgroundColor: '#f59e0b' }]} />
        </View>
      </View>

      {/* Critical Incidents */}
      {criticalFlows.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text style={styles.sectionTitle}>Critical Traffic Flow</Text>
          </View>
          
          {criticalFlows.map((flow) => (
            <View key={flow.alertId} style={[styles.flowCard, styles.criticalCard]}>
              <View style={styles.flowHeader}>
                <Text style={styles.alertId}>{flow.alertId}</Text>
                <Text style={styles.timestamp}>
                  {formatTime(flow.lastChecked)}
                </Text>
              </View>
              
              <View style={styles.speedInfo}>
                <View style={styles.speedBox}>
                  <Text style={styles.speedValue}>
                    {Math.round(flow.currentSpeed)} MPH
                  </Text>
                  <Text style={styles.speedLabel}>Current</Text>
                </View>
                
                <View style={styles.speedArrow}>
                  <Text style={styles.arrowText}>{flow.trendArrow}</Text>
                </View>
                
                <View style={styles.speedBox}>
                  <Text style={styles.speedValue}>
                    {Math.round(flow.freeFlowSpeed)} MPH
                  </Text>
                  <Text style={styles.speedLabel}>Normal</Text>
                </View>
                
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getStatusColor(flow.severity) }
                ]}>
                  <Text style={styles.severityText}>
                    {flow.speedRatio}%
                  </Text>
                </View>
              </View>
              
              {flow.roadClosure && (
                <View style={styles.warningBanner}>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.warningText}>Road Closure Detected</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Active Flow Monitoring */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse" size={24} color="#ee7203" />
          <Text style={styles.sectionTitle}>Live Traffic Flow</Text>
        </View>
        
        {activeFlows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.emptyText}>All traffic flowing normally</Text>
          </View>
        ) : (
          activeFlows.map((flow) => (
            <View key={flow.alertId} style={styles.flowCard}>
              <View style={styles.flowHeader}>
                <Text style={styles.alertId}>{flow.alertId}</Text>
                <Text style={styles.timestamp}>
                  {formatTime(flow.lastChecked)}
                </Text>
              </View>
              
              <View style={styles.flowIndicator}>
                <View style={[styles.flowBar, { 
                  backgroundColor: getStatusColor(flow.severity),
                  width: '100%',
                  height: 4
                }]} />
                <Text style={styles.flowSpeed}>
                  {flow.speed || '--'} mph
                </Text>
              </View>
              
              {flow.shouldAutoClear && (
                <View style={styles.autoClearBanner}>
                  <Ionicons name="time" size={16} color="#10b981" />
                  <Text style={styles.autoClearText}>
                    Auto-clear pending - traffic normalizing
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Flow History Chart */}
      {activeFlows.length > 0 && activeFlows[0].history && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#ee7203" />
            <Text style={styles.sectionTitle}>Speed Trends (Last Hour)</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {/* Simple bar chart showing speed trends */}
            <View style={styles.chart}>
              {activeFlows[0].history.map((point, index) => {
                const maxSpeed = 70;
                const height = (point.speed / maxSpeed) * 100;
                const color = getStatusColor(point.severity);
                
                return (
                  <View key={index} style={styles.chartColumn}>
                    <View 
                      style={[
                        styles.chartBar,
                        { 
                          height: `${height}%`,
                          backgroundColor: color
                        }
                      ]}
                    />
                    <Text style={styles.chartLabel}>
                      {new Date(point.timestamp).getMinutes()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  flowCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criticalCard: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
  },
  speedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedBox: {
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  speedLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  speedArrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 24,
    color: '#6b7280',
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  severityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    color: '#fff',
    fontWeight: '500',
  },
  autoClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b98120',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  autoClearText: {
    color: '#10b981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    height: 200,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  flowIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  flowBar: {
    borderRadius: 2,
    marginBottom: 4,
  },
  flowSpeed: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});

export default TrafficFlowDashboard;