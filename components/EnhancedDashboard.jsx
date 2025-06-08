// components/EnhancedDashboard.jsx
// Enhanced web dashboard with real-time traffic alerts, supervisor tools, and keyboard shortcuts
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const EnhancedDashboard = ({ 
  baseUrl = API_CONFIG.baseURL,
  onAlertPress,
  onViewAllPress,
  autoRefreshInterval = 15000 
}) => {
  // State management
  const [alertsData, setAlertsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [supervisorMode, setSupervisorMode] = useState(false);

  // Enhanced data fetching
  const fetchAlertsData = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/alerts-enhanced`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAlertsData(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    }
  }, [baseUrl]);

  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching health:', err);
    }
  }, [baseUrl]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAlertsData(), fetchHealthData()]);
    setLoading(false);
  }, [fetchAlertsData, fetchHealthData]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, autoRefreshInterval]);

  // Keyboard shortcuts for web
  useEffect(() => {
    if (!isWeb) return;

    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setSelectedFilter('critical');
            break;
          case '2':
            e.preventDefault();
            setSelectedFilter('high');
            break;
          case '3':
            e.preventDefault();
            setSelectedFilter('medium');
            break;
          case '4':
            e.preventDefault();
            setSelectedFilter('all');
            break;
          case 'r':
            e.preventDefault();
            fetchData();
            break;
          case 'f':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fetchData]);

  // Process and filter alerts
  const processedAlerts = useMemo(() => {
    if (!alertsData?.alerts) return { critical: [], high: [], medium: [], low: [], all: [] };

    const alerts = alertsData.alerts.filter(alert => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alert.title?.toLowerCase().includes(query) ||
          alert.description?.toLowerCase().includes(query) ||
          alert.location?.toLowerCase().includes(query) ||
          alert.affectsRoutes?.some(route => route.toLowerCase().includes(query))
        );
      }
      return true;
    });

    const categorized = {
      critical: alerts.filter(a => a.severity?.toLowerCase() === 'high' || a.priority === 'IMMEDIATE'),
      high: alerts.filter(a => a.severity?.toLowerCase() === 'medium' || a.priority === 'URGENT'),
      medium: alerts.filter(a => a.severity?.toLowerCase() === 'low' || a.priority === 'MONITOR'),
      low: alerts.filter(a => !a.severity || a.priority === 'AWARENESS'),
      all: alerts
    };

    return categorized;
  }, [alertsData, searchQuery]);

  // Get filtered alerts based on current filter
  const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'all') return processedAlerts.all;
    return processedAlerts[selectedFilter] || [];
  }, [processedAlerts, selectedFilter]);

  // Handle alert interactions
  const handleAlertClick = useCallback((alert) => {
    if (onAlertPress) {
      onAlertPress(alert);
    } else {
      // Default behavior - show alert details
      if (isWeb) {
        const message = `${alert.description || alert.title}\n\nLocation: ${alert.location || 'Unknown'}\nAffected Routes: ${alert.affectsRoutes?.join(', ') || 'None detected'}\nSource: ${alert.source || 'Unknown'}\nTime: ${alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Unknown'}`;
        alert(alert.title || 'Traffic Alert', message);
      }
    }
  }, [onAlertPress]);

  // Statistics calculations
  const stats = useMemo(() => {
    const alerts = processedAlerts.all;
    return {
      total: alerts.length,
      critical: processedAlerts.critical.length,
      high: processedAlerts.high.length,
      medium: processedAlerts.medium.length,
      routesAffected: new Set(alerts.flatMap(a => a.affectsRoutes || [])).size,
      enhanced: alerts.filter(a => a.enhanced).length
    };
  }, [processedAlerts]);

  // Error handling component
  const ErrorDisplay = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning" size={24} color="#DC2626" />
      <Text style={styles.errorText}>
        Failed to load traffic data: {error}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading component
  const LoadingDisplay = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading traffic intelligence...</Text>
    </View>
  );

  // Statistics header component
  const StatsHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.enhancedStats}>
        <View style={styles.enhancedStatCard}>
          <Text style={styles.enhancedStatLabel}>TOTAL ALERTS</Text>
          <Text style={styles.enhancedStatValue}>{stats.total}</Text>
          <Text style={styles.enhancedStatCount}>Active incidents</Text>
        </View>
        
        <View style={styles.enhancedStatCard}>
          <Text style={styles.enhancedStatLabel}>CRITICAL</Text>
          <Text style={[styles.enhancedStatValue, { color: '#DC2626' }]}>{stats.critical}</Text>
          <Text style={styles.enhancedStatCount}>Immediate attention</Text>
        </View>
        
        <View style={styles.enhancedStatCard}>
          <Text style={styles.enhancedStatLabel}>HIGH PRIORITY</Text>
          <Text style={[styles.enhancedStatValue, { color: '#F59E0B' }]}>{stats.high}</Text>
          <Text style={styles.enhancedStatCount}>Monitor closely</Text>
        </View>
        
        <View style={styles.enhancedStatCard}>
          <Text style={styles.enhancedStatLabel}>ROUTES AFFECTED</Text>
          <Text style={[styles.enhancedStatValue, { color: '#7C3AED' }]}>{stats.routesAffected}</Text>
          <Text style={styles.enhancedStatCount}>Bus services impacted</Text>
        </View>
        
        <View style={styles.enhancedStatCard}>
          <Text style={styles.enhancedStatLabel}>ENHANCED</Text>
          <Text style={[styles.enhancedStatValue, { color: '#059669' }]}>{stats.enhanced}</Text>
          <Text style={styles.enhancedStatCount}>Location verified</Text>
        </View>
      </View>
    </View>
  );

  // Filter tabs component
  const FilterTabs = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All Alerts', count: stats.total },
        { key: 'critical', label: 'Critical', count: stats.critical },
        { key: 'high', label: 'High', count: stats.high },
        { key: 'medium', label: 'Medium', count: stats.medium }
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterTab,
            selectedFilter === filter.key && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter(filter.key)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === filter.key && styles.filterTabTextActive
          ]}>
            {filter.label} ({filter.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Search component
  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
      <TextInput
        id="search-input"
        style={styles.searchInput}
        placeholder="Search alerts, locations, or routes... (Ctrl+F)"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#94A3B8"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Alert card component
  const AlertCard = ({ alert }) => {
    const priorityColor = alert.severity?.toLowerCase() === 'high' ? '#DC2626' :
                         alert.severity?.toLowerCase() === 'medium' ? '#F59E0B' :
                         alert.severity?.toLowerCase() === 'low' ? '#3B82F6' : '#6B7280';

    return (
      <TouchableOpacity
        style={[styles.alertItem, { borderLeftColor: priorityColor }]}
        onPress={() => handleAlertClick(alert)}
      >
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle} numberOfLines={2}>
            {alert.title || 'Traffic Incident'}
          </Text>
          <View style={styles.alertBadges}>
            <Text style={[styles.alertStatus, { color: priorityColor }]}>
              {alert.severity?.toUpperCase() || 'UNKNOWN'}
            </Text>
            {alert.enhanced && (
              <View style={styles.enhancedBadge}>
                <Ionicons name="checkmark" size={12} color="#059669" />
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.alertLocation}>
          📍 {alert.location || 'Location being resolved...'}
        </Text>
        
        {alert.description && (
          <Text style={styles.alertDescription} numberOfLines={2}>
            {alert.description}
          </Text>
        )}
        
        {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
          <Text style={styles.alertRoutes}>
            🚌 Routes: {alert.affectsRoutes.slice(0, 8).join(', ')}
            {alert.affectsRoutes.length > 8 ? ` +${alert.affectsRoutes.length - 8} more` : ''}
          </Text>
        )}
        
        <View style={styles.alertFooter}>
          <Text style={styles.alertSource}>
            Source: {alert.source || 'Unknown'}
          </Text>
          <Text style={styles.alertTime}>
            {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Unknown time'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // System status component
  const SystemStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Status</Text>
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={healthData?.status === 'healthy' ? 'checkmark-circle' : 'warning'} 
            size={16} 
            color={healthData?.status === 'healthy' ? '#10B981' : '#EF4444'} 
          />
          <Text style={styles.statusText}>
            Backend: {healthData?.status || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="server" size={16} color="#3B82F6" />
          <Text style={styles.statusText}>
            GTFS Routes: {healthData?.gtfs?.routes || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="time" size={16} color="#8B5CF6" />
          <Text style={styles.statusText}>
            Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Keyboard shortcuts help
  const KeyboardHelp = () => isWeb && (
    <View style={styles.keyboardHelp}>
      <Text style={styles.keyboardHelpText}>
        Shortcuts: Ctrl+1-4 (filters) • Ctrl+R (refresh) • Ctrl+F (search)
      </Text>
    </View>
  );

  // Main render
  if (loading && !alertsData) {
    return <LoadingDisplay />;
  }

  if (error && !alertsData) {
    return <ErrorDisplay />;
  }

  return (
    <View style={styles.container}>
      <KeyboardHelp />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BARRY Intelligence Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Real-time Traffic Monitoring for Go North East
          </Text>
        </View>

        {/* Statistics */}
        <StatsHeader />

        {/* System Status */}
        <SystemStatus />

        {/* Search */}
        <SearchBar />

        {/* Filter Tabs */}
        <FilterTabs />

        {/* Alerts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'All Traffic Alerts' : 
             selectedFilter === 'critical' ? 'Critical Alerts' :
             selectedFilter === 'high' ? 'High Priority Alerts' :
             'Medium Priority Alerts'} ({filteredAlerts.length})
          </Text>
          
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <AlertCard key={alert.id || alert.title} alert={alert} />
            ))
          ) : (
            <View style={styles.noAlertsContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.noAlertsText}>
                {searchQuery ? 'No alerts match your search' : 'No alerts in this category'}
              </Text>
              <Text style={styles.noAlertsSubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'Traffic conditions are good!'}
              </Text>
            </View>
          )}
        </View>

        {/* Footer spacing */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1F2937',
    padding: 24,
    paddingTop: isWeb ? 24 : 44,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  keyboardHelp: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  keyboardHelpText: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  statsContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enhancedStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginVertical: 4,
  },
  enhancedStatLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '600',
  },
  enhancedStatCount: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
  },
  alertItem: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  alertBadges: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  alertStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enhancedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 2,
  },
  alertLocation: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  alertRoutes: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 4,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  alertSource: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  alertTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default EnhancedDashboard;