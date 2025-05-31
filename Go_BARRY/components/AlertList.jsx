// Go_BARRY/components/AlertList.jsx
// Enhanced AlertList with better error handling and debugging
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrafficCard from './TrafficCard';

const { width } = Dimensions.get('window');

const AlertList = ({ 
  baseUrl = 'https://go-barry.onrender.com',
  onAlertPress = null,
  style = {}
}) => {
  // State management
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [metadata, setMetadata] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    severity: [],
    status: [],
    source: [],
    type: []
  });

  // Fetch alerts from backend with enhanced error handling
  const fetchAlerts = useCallback(async (showRefreshSpinner = false, silent = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }
      setError(null);

      console.log(`🔍 Fetching alerts from: ${baseUrl}/api/alerts`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(`${baseUrl}/api/alerts`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`📦 Response length: ${text.length} characters`);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('📦 JSON Parse Error:', parseError);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
      
      console.log(`✅ Parsed data:`, {
        success: data.success,
        alertsCount: data.alerts?.length || 0,
        hasMetadata: !!data.metadata
      });
      
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setMetadata(data.metadata);
        
        // Enhanced debug info
        setDebugInfo({
          lastFetch: new Date().toISOString(),
          alertCount: data.alerts.length,
          sources: data.metadata?.sources || {},
          apiUrl: `${baseUrl}/api/alerts`,
          responseSize: text.length,
          processingTime: data.metadata?.processingTime || 'N/A'
        });
        
        console.log(`🎯 Successfully loaded ${data.alerts.length} alerts`);
        
        // Log first alert for debugging
        if (data.alerts.length > 0) {
          const firstAlert = data.alerts[0];
          console.log(`📍 First alert:`, {
            id: firstAlert.id,
            title: firstAlert.title,
            location: firstAlert.location,
            status: firstAlert.status,
            severity: firstAlert.severity
          });
        }
        
      } else {
        throw new Error(data.error || 'Invalid response format - no alerts array');
      }

    } catch (err) {
      const errorMessage = err.name === 'AbortError' 
        ? 'Request timeout - server may be slow' 
        : err.message;
        
      setError(errorMessage);
      console.error('❌ AlertList fetch error:', err);
      
      // Enhanced debug info for errors
      setDebugInfo({
        lastFetch: new Date().toISOString(),
        error: errorMessage,
        apiUrl: `${baseUrl}/api/alerts`,
        errorType: err.name,
        alertCount: 0
      });
      
      // Show user-friendly error alert (only if not silent)
      if (!silent) {
        Alert.alert(
          'Connection Error',
          `Unable to fetch latest alerts: ${errorMessage}\n\nPlease check your internet connection and try again.`,
          [
            { text: 'OK' },
            { text: 'Show Debug', onPress: () => setShowDebug(true) }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  // Force refresh via backend endpoint
  const forceRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Force refreshing data...');
      
      // Trigger backend refresh first
      await fetch(`${baseUrl}/api/refresh`, { timeout: 10000 });
      
      // Then fetch updated data
      await fetchAlerts(false, false);
      
    } catch (err) {
      console.error('Force refresh error:', err);
      // Fallback to regular fetch
      await fetchAlerts(false, false);
    }
  }, [baseUrl, fetchAlerts]);

  // Filter and search logic
  const processAlerts = useMemo(() => {
    let processed = [...alerts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(alert => 
        alert.title?.toLowerCase().includes(query) ||
        alert.description?.toLowerCase().includes(query) ||
        alert.location?.toLowerCase().includes(query) ||
        alert.affectsRoutes?.some(route => 
          route.toLowerCase().includes(query)
        )
      );
    }

    // Apply category filters
    if (filters.severity.length > 0) {
      processed = processed.filter(alert => 
        filters.severity.includes(alert.severity)
      );
    }

    if (filters.status.length > 0) {
      processed = processed.filter(alert => 
        filters.status.includes(alert.status)
      );
    }

    if (filters.source.length > 0) {
      processed = processed.filter(alert => 
        filters.source.includes(alert.source)
      );
    }

    if (filters.type.length > 0) {
      processed = processed.filter(alert => 
        filters.type.includes(alert.type)
      );
    }

    // Apply sorting
    processed.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const statusPriority = { red: 3, amber: 2, green: 1 };
          const severityPriority = { High: 3, Medium: 2, Low: 1 };
          
          const aStatusScore = statusPriority[a.status] || 0;
          const bStatusScore = statusPriority[b.status] || 0;
          
          if (aStatusScore !== bStatusScore) {
            return bStatusScore - aStatusScore;
          }
          
          const aSeverityScore = severityPriority[a.severity] || 0;
          const bSeverityScore = severityPriority[b.severity] || 0;
          
          return bSeverityScore - aSeverityScore;

        case 'date':
          const aDate = new Date(a.startDate || a.lastUpdated || 0);
          const bDate = new Date(b.startDate || b.lastUpdated || 0);
          return bDate - aDate;

        case 'location':
          return (a.location || '').localeCompare(b.location || '');

        default:
          return 0;
      }
    });

    return processed;
  }, [alerts, searchQuery, filters, sortBy]);

  // Update filtered alerts when processing changes
  useEffect(() => {
    setFilteredAlerts(processAlerts);
  }, [processAlerts]);

  // Initial load
  useEffect(() => {
    fetchAlerts(false, false);
  }, [fetchAlerts]);

  // Filter toggle functions
  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      
      return { ...prev, [category]: updated };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      severity: [],
      status: [],
      source: [],
      type: []
    });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterArray) => 
      count + filterArray.length, 0
    ) + (searchQuery.trim() ? 1 : 0);
  };

  // Render functions
  const renderAlert = ({ item, index }) => (
    <TrafficCard 
      alert={item}
      onPress={onAlertPress ? () => onAlertPress(item) : null}
      style={{ marginHorizontal: 0 }}
    />
  );

  const renderDebugPanel = () => {
    if (!showDebug || !debugInfo) return null;
    
    return (
      <View style={styles.debugPanel}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>🔧 Debug Information</Text>
          <TouchableOpacity onPress={() => setShowDebug(false)}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.debugContent}>
          <Text style={styles.debugText}>API URL: {debugInfo.apiUrl}</Text>
          <Text style={styles.debugText}>Last Fetch: {debugInfo.lastFetch}</Text>
          <Text style={styles.debugText}>Alert Count: {debugInfo.alertCount}</Text>
          <Text style={styles.debugText}>Response Size: {debugInfo.responseSize} bytes</Text>
          <Text style={styles.debugText}>Processing Time: {debugInfo.processingTime}</Text>
          
          {debugInfo.error && (
            <Text style={styles.debugError}>Error: {debugInfo.error}</Text>
          )}
          
          {debugInfo.sources && (
            <View style={styles.debugSection}>
              <Text style={styles.debugSectionTitle}>Data Sources:</Text>
              {Object.entries(debugInfo.sources).map(([source, info]) => (
                <Text key={source} style={styles.debugText}>
                  {source}: {info.success ? '✅' : '❌'} ({info.count || 0} items)
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Debug Panel */}
      {renderDebugPanel()}
      
      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        {error ? (
          <View style={styles.statusRow}>
            <Ionicons name="wifi-off" size={16} color="#EF4444" />
            <Text style={styles.errorStatus}>Connection Error</Text>
            <TouchableOpacity onPress={() => setShowDebug(!showDebug)}>
              <Ionicons name="information-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <Ionicons name="wifi" size={16} color="#10B981" />
            <Text style={styles.onlineStatus}>Connected</Text>
            {debugInfo && (
              <Text style={styles.lastUpdateText}>
                • Updated {new Date(debugInfo.lastFetch).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search alerts, locations, routes..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, getActiveFilterCount() > 0 && styles.activeControlButton]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={16} color={getActiveFilterCount() > 0 ? "#FFFFFF" : "#9CA3AF"} />
          <Text style={[styles.controlButtonText, getActiveFilterCount() > 0 && styles.activeControlButtonText]}>
            Filter {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            const sortOptions = ['priority', 'date', 'location'];
            const currentIndex = sortOptions.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            setSortBy(sortOptions[nextIndex]);
          }}
        >
          <Ionicons name="swap-vertical" size={16} color="#9CA3AF" />
          <Text style={styles.controlButtonText}>
            Sort: {sortBy === 'priority' ? 'Priority' : sortBy === 'date' ? 'Date' : 'Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={forceRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={16} color="#9CA3AF" />
          <Text style={styles.controlButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Summary */}
      {metadata?.statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.statText}>{metadata.statistics.activeAlerts || 0} Active</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{metadata.statistics.upcomingAlerts || 0} Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.statText}>{metadata.statistics.plannedAlerts || 0} Planned</Text>
          </View>
        </View>
      )}

      {/* Results Summary */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          Showing {filteredAlerts.length} of {alerts.length} alerts
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
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning" size={48} color="#6B7280" />
        <Text style={styles.emptyTitle}>
          {error ? 'Connection Error' : 
           filteredAlerts.length === 0 && alerts.length > 0 
            ? 'No matching alerts' 
            : 'No alerts available'
          }
        </Text>
        <Text style={styles.emptyText}>
          {error ? `Unable to connect to server: ${error}` :
           filteredAlerts.length === 0 && alerts.length > 0
            ? 'Try adjusting your search or filter criteria'
            : 'All clear! No traffic alerts at the moment.'
          }
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchAlerts(false, false)}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        )}
        {filteredAlerts.length === 0 && alerts.length > 0 && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#60A5FA" />
      <Text style={styles.loadingText}>Loading traffic alerts...</Text>
      <Text style={styles.loadingSubtext}>Connecting to {baseUrl}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return renderLoading();
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAlerts(true, false)}
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
  },
  connectionStatus: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  errorStatus: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  lastUpdateText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 8,
  },
  debugPanel: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  debugTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  debugContent: {
    padding: 12,
  },
  debugSection: {
    marginTop: 8,
  },
  debugSectionTitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  debugError: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeControlButton: {
    backgroundColor: '#2563EB',
  },
  controlButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  activeControlButtonText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginLeft: 6,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  lastUpdatedText: {
    color: '#6B7280',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  clearFiltersText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 14,
    marginTop: 4,
  },
});

export default AlertList;