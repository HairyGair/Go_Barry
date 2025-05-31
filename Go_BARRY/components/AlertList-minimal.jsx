// Go_BARRY/components/AlertList-minimal.jsx
// Minimal version with no external icon dependencies
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import TrafficCard from './TrafficCard';

const AlertList = ({ 
  baseUrl = 'https://go-barry.onrender.com',
  onAlertPress = null,
  style = {}
}) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const fetchAlerts = useCallback(async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log(`🔍 Fetching alerts from: ${baseUrl}/api/alerts`);
      
      const response = await fetch(`${baseUrl}/api/alerts`, {
        timeout: 15000
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Got data:`, data.success, data.alerts?.length);
      
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setMetadata(data.metadata);
        console.log(`✅ Loaded ${data.alerts.length} alerts`);
      } else {
        throw new Error(data.error || 'No alerts in response');
      }

    } catch (err) {
      setError(err.message);
      console.error('❌ AlertList error:', err);
      
      Alert.alert(
        'Connection Error', 
        `Unable to fetch alerts: ${err.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const renderAlert = ({ item }) => (
    <TrafficCard 
      alert={item}
      onPress={onAlertPress ? () => onAlertPress(item) : null}
      style={{ marginHorizontal: 0 }}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🚦 Traffic Alerts</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Text style={styles.errorSubtext}>Pull down to retry</Text>
        </View>
      ) : (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            ✅ Connected • {alerts.length} alerts
          </Text>
          {metadata?.lastUpdated && (
            <Text style={styles.lastUpdatedText}>
              Updated: {new Date(metadata.lastUpdated).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
      )}

      {metadata?.statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{metadata.statistics.activeAlerts || 0}</Text>
            <Text style={styles.statLabel}>🔴 Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{metadata.statistics.upcomingAlerts || 0}</Text>
            <Text style={styles.statLabel}>🟡 Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{metadata.statistics.plannedAlerts || 0}</Text>
            <Text style={styles.statLabel}>🟢 Planned</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚦</Text>
        <Text style={styles.emptyTitle}>
          {error ? 'Connection Error' : 'No Alerts'}
        </Text>
        <Text style={styles.emptyText}>
          {error 
            ? 'Pull down to retry connection'
            : 'All clear! No traffic alerts at the moment.'
          }
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
        <Text style={styles.loadingSubtext}>{baseUrl}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAlerts(true)}
            colors={['#60A5FA']}
            tintColor="#60A5FA"
            title="Updating alerts..."
            titleColor="#9CA3AF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  lastUpdatedText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorSubtext: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
});

export default AlertList;