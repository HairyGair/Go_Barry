/*
 * Go Barry - Incidents Manager V2
 * Modern redesigned incidents management interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../../hooks/useSupervisorSession';
import { incidentsStyles, colors, spacing } from './styles/incidents.styles';
import StatsCard, { StatCardPresets } from './components/StatsCard';
import IncidentCard from './components/IncidentCard';

const IncidentsManagerV2 = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisor();

  // State management
  const [incidents, setIncidents] = useState([]);
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    affectedRoutes: [],
    searchQuery: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    high: 0,
    routesAffected: 0,
    averageResolutionTime: 0,
    manual: 0,
    traffic: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid', badge: null },
    { id: 'active', label: 'Active', icon: 'alert-circle', badge: stats.active > 0 ? stats.active : null },
    { id: 'timeline', label: 'Timeline', icon: 'time', badge: null },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', badge: null },
    { id: 'templates', label: 'Templates', icon: 'folder', badge: null },
  ];

  // Check if roadwork affects Go North East routes
  const affectsGNERoutes = (incident) => {
    if (!incident.affectsRoutes || !Array.isArray(incident.affectsRoutes)) {
      return false;
    }
    
    // Check if any affected route is a GNE route (starts with route numbers 1-999 or has GNE prefix)
    return incident.affectsRoutes.some(route => {
      const routeStr = String(route).toUpperCase();
      return routeStr.includes('GNE') || /^[1-9][0-9]{0,2}[A-Z]?$/.test(routeStr);
    });
  };

  // Geographic bounds for North East England
  const isInNorthEastRegion = (lat, lng) => {
    if (!lat || !lng) return false;
    const northEastBounds = {
      north: 56.0,  // Scottish border
      south: 54.0,  // Yorkshire border
      east: -0.5,   // North Sea coast
      west: -3.0    // Cumbrian border
    };
    return lat >= northEastBounds.south && 
           lat <= northEastBounds.north && 
           lng >= northEastBounds.west && 
           lng <= northEastBounds.east;
  };

  // Fetch incidents data
  const fetchIncidents = async (showLoading = true) => {
    console.log('🚨 fetchIncidents called with baseUrl:', baseUrl);
    if (showLoading) setLoading(true);
    
    let manualData = { incidents: [] };
    let trafficData = { incidents: [] };
    
    try {
      // Fetch manual incidents
      const manualController = new AbortController();
      const manualTimeout = setTimeout(() => manualController.abort(), 10000);
      
      try {
        const manualUrl = `${baseUrl}/api/incidents`;
        console.log('📡 Fetching manual incidents from:', manualUrl);
        const manualResponse = await fetch(manualUrl, {
          signal: manualController.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId || ''
          }
        });
        clearTimeout(manualTimeout);
        
        console.log('📡 Manual response status:', manualResponse.status);
        if (manualResponse.ok) {
          manualData = await manualResponse.json();
          console.log('📡 Manual data:', manualData);
        } else {
          console.warn('Manual incidents API returned:', manualResponse.status);
        }
      } catch (manualError) {
        console.warn('Manual incidents fetch failed:', manualError.message);
      }
      
      // Fetch traffic incidents
      const trafficController = new AbortController();
      const trafficTimeout = setTimeout(() => trafficController.abort(), 10000);
      
      try {
        const trafficUrl = `${baseUrl}/api/traffic-incidents`;
        console.log('📡 Fetching traffic incidents from:', trafficUrl);
        const trafficResponse = await fetch(trafficUrl, {
          signal: trafficController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(trafficTimeout);
        
        console.log('📡 Traffic response status:', trafficResponse.status);
        if (trafficResponse.ok) {
          trafficData = await trafficResponse.json();
          console.log('📡 Traffic data:', trafficData);
        } else {
          console.warn('Traffic incidents API returned:', trafficResponse.status);
        }
      } catch (trafficError) {
        console.warn('Traffic incidents fetch failed:', trafficError.message);
      }

      // Process and validate data
      const validManualIncidents = Array.isArray(manualData.incidents) ? manualData.incidents : [];
      const validTrafficIncidents = Array.isArray(trafficData.incidents) ? trafficData.incidents : [];
      
      console.log('🔍 API Results Summary:');
      console.log('🔍 Manual incidents count:', validManualIncidents.length);
      console.log('🔍 Traffic incidents count:', validTrafficIncidents.length);
      
      setIncidents(validManualIncidents);
      setTrafficIncidents(validTrafficIncidents);
      
      // Calculate statistics
      calculateStats(validManualIncidents, validTrafficIncidents);
      setLastUpdate(new Date());
      
      // Apply North East filtering to stats calculation  
      const neManualIncidents = validManualIncidents.filter(incident => {
        const hasGNERoutes = affectsGNERoutes(incident);
        const inNorthEast = incident.coordinates && isInNorthEastRegion(incident.coordinates.lat, incident.coordinates.lng);
        return hasGNERoutes || inNorthEast;
      });
      
      const neTrafficIncidents = validTrafficIncidents.filter(incident => {
        const hasGNERoutes = affectsGNERoutes(incident);
        const inNorthEast = incident.coordinates && isInNorthEastRegion(incident.coordinates.lat, incident.coordinates.lng);
        return hasGNERoutes || inNorthEast;
      });
      
      // Force a stats update with immediate values for debugging
      const immediateStats = {
        total: neManualIncidents.length + neTrafficIncidents.length,
        active: neManualIncidents.filter(i => i.status === 'active').length + 
                neTrafficIncidents.filter(i => i.status === 'active').length,
        high: neManualIncidents.filter(i => i.priority === 'high').length + 
              neTrafficIncidents.filter(i => i.priority === 'high').length,
        traffic: neTrafficIncidents.length,
        manual: neManualIncidents.length,
        routesAffected: 0,
        averageResolutionTime: 0
      };
      setStats(immediateStats);
      
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics from incidents data
  const calculateStats = (manual, traffic) => {
    console.log('📊 Calculating stats for:', {
      manual: manual.length,
      traffic: traffic.length
    });
    
    const manualActive = manual.filter(i => i.status === 'active');
    const manualHigh = manual.filter(i => i.priority === 'high');
    
    const trafficActive = traffic.filter(i => i.status === 'active');
    const trafficHigh = traffic.filter(i => i.priority === 'high');
    
    // Count affected routes (deduplicated)
    const allAffectedRoutes = new Set();
    [...manual, ...traffic].forEach(i => {
      if (i.affectsRoutes) {
        i.affectsRoutes.forEach(route => allAffectedRoutes.add(route));
      }
    });
    
    const newStats = {
      total: manual.length + traffic.length,
      active: manualActive.length + trafficActive.length,
      high: manualHigh.length + trafficHigh.length,
      routesAffected: allAffectedRoutes.size,
      traffic: traffic.length,
      manual: manual.length,
      averageResolutionTime: 0 // TODO: Calculate from historical data
    };
    
    console.log('📊 New stats calculated:', newStats);
    setStats(newStats);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncidents(false);
  };

  // Initial load
  useEffect(() => {
    if (isLoggedIn && baseUrl) {
      fetchIncidents();
      
      // Set up auto-refresh
      const interval = setInterval(() => {
        fetchIncidents(false);
      }, 90000); // 90 seconds
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, baseUrl, sessionId]);

  // Filter incidents
  const getFilteredIncidents = () => {
    try {
      let allIncidents = [...incidents, ...trafficIncidents];
      
      // Transform incidents to consistent format
      allIncidents = allIncidents.map(incident => ({
        ...incident,
        id: incident.id || `incident-${Date.now()}-${Math.random()}`,
        type: incident.type || 'other',
        priority: incident.priority || 'medium',
        status: incident.status || 'active',
        title: incident.title || incident.description || 'Untitled Incident',
        location: incident.location || 'Location TBC',
        affectsRoutes: incident.affectsRoutes || [],
        source: incident.source || 'manual'
      }));

      // **PERMANENT FILTER: Only show Go North East relevant incidents**
      const preFilterCount = allIncidents.length;
      allIncidents = allIncidents.filter(incident => {
        // Check if incident affects GNE routes
        const hasGNERoutes = affectsGNERoutes(incident);
        
        // Check if incident is in North East region
        const inNorthEast = incident.coordinates && 
                           isInNorthEastRegion(incident.coordinates.lat, incident.coordinates.lng);
        
        // Include if it affects GNE routes OR is in North East region
        const shouldInclude = hasGNERoutes || inNorthEast;
        
        if (preFilterCount < 10) { // Debug logging for small datasets
          console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Incident "${incident.title}":`, {
            hasGNERoutes,
            inNorthEast, 
            shouldInclude
          });
        }
        
        return shouldInclude;
      });
      
      console.log(`🎯 GNE filtering: ${preFilterCount} → ${allIncidents.length} incidents (${preFilterCount - allIncidents.length} filtered out)`);

      // Filter by active tab
      if (activeTab === 'active') {
        allIncidents = allIncidents.filter(i => i.status === 'active');
      }

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        allIncidents = allIncidents.filter(i => i.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        allIncidents = allIncidents.filter(i => i.priority === filters.priority);
      }
      if (filters.type && filters.type !== 'all') {
        allIncidents = allIncidents.filter(i => i.type === filters.type);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        allIncidents = allIncidents.filter(i => {
          const title = (i.title || '').toLowerCase();
          const location = (i.location || '').toLowerCase();
          const description = (i.description || '').toLowerCase();
          return title.includes(query) || location.includes(query) || description.includes(query);
        });
      }

      console.log('🔍 Final filtered incidents:', allIncidents.length);
      return allIncidents;
    } catch (error) {
      console.error('Error filtering incidents:', error);
      return [];
    }
  };

  // Handle stat card press
  const handleStatPress = (statType) => {
    switch (statType) {
      case 'active':
        setActiveTab('active');
        setViewMode('list');
        break;
      default:
        setViewMode('list');
    }
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={incidentsStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={incidentsStyles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  // Render empty state
  const renderEmptyState = () => (
    <View style={incidentsStyles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} style={incidentsStyles.emptyIcon} />
      <Text style={incidentsStyles.emptyTitle}>No Incidents Found</Text>
      <Text style={incidentsStyles.emptyDescription}>
        No incidents found for the current filters. Try adjusting your search criteria or check back later.
      </Text>
    </View>
  );

  // Render stats cards
  const renderStatsCards = () => (
    <View style={incidentsStyles.statsContainer}>
      <StatsCard
        {...StatCardPresets.total(stats.total, () => handleStatPress('total'))}
        size="large"
      />
      
      <StatsCard
        {...StatCardPresets.active(stats.active, () => handleStatPress('active'))}
        trend={stats.active > 5 ? '+2 from yesterday' : null}
        trendDirection={stats.active > 5 ? 'up' : 'neutral'}
      />
      
      
      <StatsCard
        {...StatCardPresets.routesAffected(stats.routesAffected, () => handleStatPress('routes'))}
      />
      
      <StatsCard
        {...StatCardPresets.averageResolution(stats.averageResolutionTime, () => handleStatPress('resolution'))}
      />
      
      <StatsCard
        {...StatCardPresets.traffic(stats.traffic, () => handleStatPress('traffic'))}
      />
    </View>
  );

  // Render incidents list
  const renderIncidentsList = () => {
    if (filteredIncidents.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={incidentsStyles.section}>
        <View style={[incidentsStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={incidentsStyles.sectionTitle}>
            {activeTab === 'overview' ? 'All Incidents' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Incidents`}
          </Text>
          <Text style={incidentsStyles.textMuted}>
            {filteredIncidents.length} incident{filteredIncidents.length === 1 ? '' : 's'}
          </Text>
        </View>
        
        {filteredIncidents.slice(0, 20).map((incident, index) => (
          <IncidentCard
            key={incident.id || `incident-${index}`}
            incident={incident}
            onPress={(inc) => setSelectedIncident(inc)}
            onEdit={(inc) => console.log('Edit incident:', inc.id)}
            onResolve={(inc) => console.log('Resolve incident:', inc.id)}
            compact={false}
          />
        ))}
        
        {filteredIncidents.length > 20 && (
          <View style={[incidentsStyles.emptyContainer, { padding: spacing.md }]}>
            <Ionicons name="funnel" size={32} color={colors.textMuted} />
            <Text style={incidentsStyles.emptyTitle}>
              {filteredIncidents.length - 20} more incidents available
            </Text>
            <Text style={incidentsStyles.emptyDescription}>
              Use the filters above to narrow down the results and find specific incidents.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const filteredIncidents = getFilteredIncidents();

  return (
    <View style={incidentsStyles.container}>
      {/* Tab Navigation */}
      <View style={incidentsStyles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={incidentsStyles.tabScrollView}
        >
          <View style={incidentsStyles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[
                  incidentsStyles.tab,
                  activeTab === tab.id ? incidentsStyles.tabActive : incidentsStyles.tabInactive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[
                  incidentsStyles.tabText,
                  activeTab === tab.id ? incidentsStyles.tabTextActive : incidentsStyles.tabTextInactive
                ]}>
                  {tab.label}
                </Text>
                {tab.badge && (
                  <View style={incidentsStyles.tabBadge}>
                    <Text style={incidentsStyles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'overview' && (
          <>
            {renderStatsCards()}
            {renderIncidentsList()}
          </>
        )}
        
        {activeTab === 'active' && renderIncidentsList()}

        {['timeline', 'analytics', 'templates'].includes(activeTab) && (
          <View style={incidentsStyles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={colors.textMuted} />
            <Text style={incidentsStyles.emptyTitle}>Coming Soon</Text>
            <Text style={incidentsStyles.emptyDescription}>
              The {activeTab} feature is under development and will be available in a future update.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default IncidentsManagerV2;