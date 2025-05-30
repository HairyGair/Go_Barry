// traffic-watch/components/AlertList.jsx
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
  Dimensions
} from 'react-native';
import { 
  Search, 
  Filter, 
  SortDesc, 
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react-native';
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
  const [sortBy, setSortBy] = useState('priority'); // priority, date, location
  const [metadata, setMetadata] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    severity: [], // ['High', 'Medium', 'Low']
    status: [], // ['red', 'amber', 'green']
    source: [], // ['national_highways', 'streetmanager']
    type: [] // ['incident', 'roadwork']
  });

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${baseUrl}/api/alerts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setMetadata(data.metadata);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (err) {
      setError(err.message);
      console.error('AlertList fetch error:', err);
      
      // Show user-friendly error
      Alert.alert(
        'Connection Error',
        'Unable to fetch latest alerts. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  // Force refresh via backend endpoint
  const forceRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Trigger backend refresh first
      await fetch(`${baseUrl}/api/refresh`);
      
      // Then fetch updated data
      await fetchAlerts(false);
      
    } catch (err) {
      console.error('Force refresh error:', err);
      // Fallback to regular fetch
      await fetchAlerts(false);
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
          // Sort by status (red > amber > green) then severity
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
          // Sort by start date, then last updated
          const aDate = new Date(a.startDate || a.lastUpdated || 0);
          const bDate = new Date(b.startDate || b.lastUpdated || 0);
          return bDate - aDate;

        case 'location':
          // Alphabetical by location
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
    fetchAlerts();
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
      style={{ marginHorizontal: 0 }} // Remove horizontal margin for list
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
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
            <X size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, getActiveFilterCount() > 0 && styles.activeControlButton]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} color={getActiveFilterCount() > 0 ? "#FFFFFF" : "#9CA3AF"} />
          <Text style={[styles.controlButtonText, getActiveFilterCount() > 0 && styles.activeControlButtonText]}>
            Filter {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            const sortOptions = [
              { key: 'priority', label: 'Priority' },
              { key: 'date', label: 'Date' },
              { key: 'location', label: 'Location' }
            ];
            // In a real app, you'd show a picker modal here
            // For now, cycle through options
            const currentIndex = sortOptions.findIndex(opt => opt.key === sortBy);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            setSortBy(sortOptions[nextIndex].key);
          }}
        >
          <SortDesc size={16} color="#9CA3AF" />
          <Text style={styles.controlButtonText}>
            Sort: {sortBy === 'priority' ? 'Priority' : sortBy === 'date' ? 'Date' : 'Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={forceRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} color="#9CA3AF" />
          <Text style={styles.controlButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Summary */}
      {metadata?.statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <AlertTriangle size={16} color="#EF4444" />
            <Text style={styles.statText}>{metadata.statistics.activeAlerts} Active</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.statText}>{metadata.statistics.upcomingAlerts} Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.statText}>{metadata.statistics.plannedAlerts} Planned</Text>
          </View>
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Severity Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Severity</Text>
            <View style={styles.filterOptions}>
              {['High', 'Medium', 'Low'].map(severity => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.filterChip,
                    filters.severity.includes(severity) && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('severity', severity)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.severity.includes(severity) && styles.activeFilterChipText
                  ]}>
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'red', label: 'Active' },
                { key: 'amber', label: 'Upcoming' },
                { key: 'green', label: 'Planned' }
              ].map(status => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.filterChip,
                    filters.status.includes(status.key) && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('status', status.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.status.includes(status.key) && styles.activeFilterChipText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Source Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Source</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'national_highways', label: 'National Highways' },
                { key: 'streetmanager', label: 'Street Manager' }
              ].map(source => (
                <TouchableOpacity
                  key={source.key}
                  style={[
                    styles.filterChip,
                    filters.source.includes(source.key) && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('source', source.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.source.includes(source.key) && styles.activeFilterChipText
                  ]}>
                    {source.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type Filters */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Type</Text>
            <View style={styles.filterOptions}>
              {['incident', 'roadwork'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filters.type.includes(type) && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('type', type)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.type.includes(type) && styles.activeFilterChipText
                  ]}>
                    {type === 'incident' ? 'Incidents' : 'Roadworks'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clear Filters */}
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
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
        <AlertTriangle size={48} color="#6B7280" />
        <Text style={styles.emptyTitle}>
          {filteredAlerts.length === 0 && alerts.length > 0 
            ? 'No matching alerts' 
            : 'No alerts available'
          }
        </Text>
        <Text style={styles.emptyText}>
          {filteredAlerts.length === 0 && alerts.length > 0
            ? 'Try adjusting your search or filter criteria'
            : 'All clear! No traffic alerts at the moment.'
          }
        </Text>
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
            onRefresh={fetchAlerts}
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
  filterPanel: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  activeFilterChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
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
});

export default Aler