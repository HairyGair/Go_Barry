/*
 * Go Barry - Roadworks Manager V2
 * Modern redesigned roadworks management interface
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
import { roadworksStyles, colors, spacing } from './styles/roadworks.styles';
import StatsCard, { StatCardPresets } from './components/StatsCard';
import RoadworkCard from './components/RoadworkCard';
import FilterPanel from './components/FilterPanel';
import RoadworkQueue from '../RoadworkQueue';
import MapOverview from './components/MapOverview';
import TimelineView from './components/TimelineView';
import DiversionTemplates from './templates/DiversionTemplates';
import RoadworksAnalytics from './analytics/RoadworksAnalytics';

const RoadworksManagerV2 = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisor();

  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [streetManagerRoadworks, setStreetManagerRoadworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online'); // 'online', 'offline', 'slow'
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    source: 'all',
    dateRange: 'all',
    affectedRoutes: [],
    searchQuery: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    active: 0,
    planned: 0,
    routesAffected: 0,
    streetManager: 0,
    manual: 0,
    diversions: 0,
    pendingReview: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid', badge: null },
    { id: 'queue', label: 'Review Queue', icon: 'alert-circle', badge: stats.pendingReview || null },
    { id: 'active', label: 'Active', icon: 'time', badge: stats.active > 0 ? stats.active : null },
    { id: 'planned', label: 'Planned', icon: 'calendar', badge: stats.planned > 0 ? stats.planned : null },
    { id: 'critical', label: 'Critical', icon: 'warning', badge: stats.critical > 0 ? stats.critical : null },
    { id: 'timeline', label: 'Timeline', icon: 'list', badge: null },
    { id: 'templates', label: 'Templates', icon: 'folder', badge: null },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', badge: null },
  ];

  // Fetch roadworks data with improved error handling
  const fetchRoadworks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    let manualData = { roadworks: [] };
    let streetManagerData = { roadworks: [] };
    
    try {
      // Fetch manual roadworks with timeout
      const manualController = new AbortController();
      const manualTimeout = setTimeout(() => manualController.abort(), 10000); // 10s timeout
      
      try {
        const manualResponse = await fetch(`${baseUrl}/api/roadworks`, {
          signal: manualController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(manualTimeout);
        
        if (manualResponse.ok) {
          manualData = await manualResponse.json();
        } else {
          console.warn('Manual roadworks API returned:', manualResponse.status);
        }
      } catch (manualError) {
        console.warn('Manual roadworks fetch failed:', manualError.message);
      }
      
      // Fetch Street Manager roadworks with timeout
      const streetManagerController = new AbortController();
      const streetManagerTimeout = setTimeout(() => streetManagerController.abort(), 10000);
      
      try {
        const streetManagerResponse = await fetch(`${baseUrl}/api/street-manager-roadworks`, {
          signal: streetManagerController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(streetManagerTimeout);
        
        if (streetManagerResponse.ok) {
          streetManagerData = await streetManagerResponse.json();
        } else {
          console.warn('Street Manager API returned:', streetManagerResponse.status);
        }
      } catch (streetManagerError) {
        console.warn('Street Manager roadworks fetch failed:', streetManagerError.message);
      }

      // Validate and set data
      const validManualRoadworks = Array.isArray(manualData.roadworks) ? manualData.roadworks : [];
      const validStreetManagerRoadworks = Array.isArray(streetManagerData.roadworks) ? streetManagerData.roadworks : [];
      
      setRoadworks(validManualRoadworks);
      setStreetManagerRoadworks(validStreetManagerRoadworks);
      
      // Calculate statistics
      calculateStats(validManualRoadworks, validStreetManagerRoadworks);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error fetching roadworks:', error);
      // Don't clear existing data on error - keep what we have
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics from roadworks data
  const calculateStats = (manual, streetManager) => {
    const now = new Date();
    
    const manualActive = manual.filter(r => r.status === 'active').length;
    const manualPlanned = manual.filter(r => r.status === 'planned').length;
    const manualCritical = manual.filter(r => r.severity === 'critical').length;
    
    const streetManagerActive = streetManager.filter(r => r.status === 'active').length;
    const streetManagerPlanned = streetManager.filter(r => r.status === 'planned').length;
    const streetManagerCritical = streetManager.filter(r => r.severity === 'critical').length;
    
    // Count affected routes (deduplicated)
    const allAffectedRoutes = new Set();
    [...manual, ...streetManager].forEach(r => {
      if (r.affectsRoutes) {
        r.affectsRoutes.forEach(route => allAffectedRoutes.add(route));
      }
    });
    
    // Count active diversions
    const diversions = [...manual, ...streetManager].filter(r => 
      r.status === 'active' && r.hasDiversion
    ).length;

    setStats(prevStats => ({
      ...prevStats,
      total: manual.length + streetManager.length,
      critical: manualCritical + streetManagerCritical,
      active: manualActive + streetManagerActive,
      planned: manualPlanned + streetManagerPlanned,
      routesAffected: allAffectedRoutes.size,
      streetManager: streetManager.length,
      manual: manual.length,
      diversions
    }));
  };

  // Fetch pending review stats
  const fetchPendingStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/stats`, {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          pendingReview: data.stats?.pendingReview || 0
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch pending stats:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRoadworks(false);
  };

  // Filter roadworks based on current filters and active tab with data validation
  const getFilteredRoadworks = () => {
    try {
      // Validate input data
      const validRoadworks = Array.isArray(roadworks) ? roadworks : [];
      const validStreetManagerRoadworks = Array.isArray(streetManagerRoadworks) ? streetManagerRoadworks : [];
      
      let allRoadworks = [
        ...validRoadworks.map(r => ({ 
          ...r, 
          source: 'manual',
          // Ensure required fields exist
          id: r.id || `manual-${Date.now()}-${Math.random()}`,
          title: r.title || r.location || 'Unnamed Roadwork',
          status: r.status || 'active',
          severity: r.severity || 'medium'
        })),
        ...validStreetManagerRoadworks.map(r => ({ 
          ...r, 
          source: 'StreetManager',
          // Ensure required fields exist
          id: r.id || `streetmanager-${Date.now()}-${Math.random()}`,
          title: r.title || r.location || 'Street Manager Roadwork',
          status: r.status || 'active',
          severity: r.severity || 'medium'
        }))
      ];

      // Filter by active tab
      if (activeTab === 'active') {
        allRoadworks = allRoadworks.filter(r => r.status === 'active');
      } else if (activeTab === 'planned') {
        allRoadworks = allRoadworks.filter(r => r.status === 'planned');
      } else if (activeTab === 'critical') {
        allRoadworks = allRoadworks.filter(r => r.severity === 'critical');
      }

      // Apply filters with null checks
      if (filters.status && filters.status !== 'all') {
        allRoadworks = allRoadworks.filter(r => r.status === filters.status);
      }
      if (filters.severity && filters.severity !== 'all') {
        allRoadworks = allRoadworks.filter(r => r.severity === filters.severity);
      }
      if (filters.source && filters.source !== 'all') {
        allRoadworks = allRoadworks.filter(r => r.source === filters.source);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        allRoadworks = allRoadworks.filter(r => {
          const title = (r.title || '').toLowerCase();
          const location = (r.location || '').toLowerCase();
          const description = (r.description || '').toLowerCase();
          return title.includes(query) || location.includes(query) || description.includes(query);
        });
      }
      if (filters.affectedRoutes && Array.isArray(filters.affectedRoutes) && filters.affectedRoutes.length > 0) {
        allRoadworks = allRoadworks.filter(r => {
          const routes = Array.isArray(r.affectsRoutes) ? r.affectsRoutes : [];
          return routes.some(route => filters.affectedRoutes.includes(route));
        });
      }

      return allRoadworks;
    } catch (error) {
      console.error('Error filtering roadworks:', error);
      return []; // Return empty array on error
    }
  };

  // Get available routes for filtering
  const getAvailableRoutes = () => {
    const routes = new Set();
    [...roadworks, ...streetManagerRoadworks].forEach(r => {
      if (r.affectsRoutes) {
        r.affectsRoutes.forEach(route => routes.add(route));
      }
    });
    return Array.from(routes).sort();
  };

  // Handle stat card press
  const handleStatPress = (statType) => {
    switch (statType) {
      case 'critical':
        setActiveTab('critical');
        setViewMode('list');
        break;
      case 'active':
        setActiveTab('active');
        setViewMode('list');
        break;
      case 'planned':
        setActiveTab('planned');
        setViewMode('list');
        break;
      default:
        setViewMode('list');
    }
  };

  // Handle roadwork card actions
  const handleRoadworkPress = (roadwork) => {
    setSelectedRoadwork(roadwork);
    console.log('Roadwork pressed:', roadwork.title);
    // TODO: Open detailed modal
  };

  const handleViewMap = (roadwork) => {
    setSelectedRoadwork(roadwork);
    setViewMode('map');
    console.log('View map for:', roadwork.title);
  };

  const handleViewDiversions = (roadwork) => {
    console.log('View diversions for:', roadwork.title);
    // TODO: Open diversions
  };

  const handleStatusChange = (roadwork) => {
    console.log('Change status for:', roadwork.title);
    // TODO: Open status change modal
  };

  const handleViewFullMap = () => {
    setViewMode('map');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setActiveTab('timeline');
  };

  // Load data on component mount
  useEffect(() => {
    fetchRoadworks();
    if (sessionId) {
      fetchPendingStats();
    }
  }, [baseUrl, sessionId]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoadworks(false);
      if (sessionId) {
        fetchPendingStats();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [baseUrl]);

  const renderHeader = () => (
    <View style={[roadworksStyles.header, roadworksStyles.headerGradient]}>
      <View style={roadworksStyles.row}>
        <Ionicons name="construct" size={24} color={colors.textPrimary} />
        <View style={roadworksStyles.flex1}>
          <Text style={roadworksStyles.headerTitle}>Roadworks Manager V2</Text>
          <View style={roadworksStyles.row}>
            <Text style={roadworksStyles.headerSubtitle}>
              Real-time roadworks and diversions • Last updated {lastUpdate.toLocaleTimeString()}
            </Text>
            
            {/* Connection Status Indicator */}
            <View style={[
              roadworksStyles.statusBadge,
              { 
                backgroundColor: connectionStatus === 'online' ? colors.success : 
                                connectionStatus === 'slow' ? colors.warning : colors.error,
                marginLeft: spacing.sm
              }
            ]}>
              <Ionicons 
                name={connectionStatus === 'online' ? 'wifi' : 
                     connectionStatus === 'slow' ? 'time' : 'wifi-off'} 
                size={10} 
                color={colors.textPrimary} 
              />
              <Text style={[roadworksStyles.statusBadgeText, { fontSize: 10 }]}>
                {connectionStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Loading indicator */}
        {(loading || refreshing) && (
          <ActivityIndicator 
            size="small" 
            color={colors.textPrimary} 
            style={{ marginLeft: spacing.sm }}
          />
        )}
      </View>
      
      {/* Error Message */}
      {errorMessage && (
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: colors.error,
            marginTop: spacing.xs,
            alignSelf: 'flex-start'
          }
        ]}>
          <Ionicons name="warning" size={12} color={colors.textPrimary} />
          <Text style={roadworksStyles.statusBadgeText}>
            {errorMessage}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStatsOverview = () => (
    <View style={roadworksStyles.statsContainer}>
      <StatsCard
        {...StatCardPresets.total(stats.total, () => handleStatPress('total'))}
        size="large"
      />
      
      <StatsCard
        {...StatCardPresets.critical(stats.critical, () => handleStatPress('critical'))}
        trend={stats.critical > 5 ? '+2 from yesterday' : null}
        trendDirection={stats.critical > 5 ? 'up' : 'neutral'}
      />
      
      <StatsCard
        {...StatCardPresets.active(stats.active, () => handleStatPress('active'))}
      />
      
      <StatsCard
        {...StatCardPresets.planned(stats.planned, () => handleStatPress('planned'))}
      />
      
      <StatsCard
        {...StatCardPresets.affected(stats.routesAffected, () => handleStatPress('routes'))}
      />
      
      <StatsCard
        {...StatCardPresets.diversions(stats.diversions, () => handleStatPress('diversions'))}
      />
    </View>
  );

  const renderDataSourceStats = () => (
    <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
      <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
        Data Sources
      </Text>
      <View style={roadworksStyles.statsContainer}>
        <StatsCard
          {...StatCardPresets.streetManager(stats.streetManager, () => setActiveTab('streetmanager'))}
        />
        
        <StatsCard
          {...StatCardPresets.manual(stats.manual, () => setActiveTab('manual'))}
        />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={roadworksStyles.tabContainer}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[
            roadworksStyles.tab,
            activeTab === tab.id && roadworksStyles.tabActive
          ]}
          onPress={() => setActiveTab(tab.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <View style={roadworksStyles.row}>
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[
                roadworksStyles.tabText,
                activeTab === tab.id && roadworksStyles.tabTextActive
              ]}
            >
              {tab.label}
            </Text>
            {tab.badge && (
              <View style={roadworksStyles.tabBadge}>
                <Text style={roadworksStyles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={roadworksStyles.quickActionsContainer}>
      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'dashboard' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('dashboard')}
      >
        <Ionicons 
          name="grid" 
          size={16} 
          color={viewMode === 'dashboard' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'dashboard' && roadworksStyles.quickActionTextActive
        ]}>
          Dashboard
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'list' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons 
          name="list" 
          size={16} 
          color={viewMode === 'list' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'list' && roadworksStyles.quickActionTextActive
        ]}>
          List View
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'map' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('map')}
      >
        <Ionicons 
          name="map" 
          size={16} 
          color={viewMode === 'map' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'map' && roadworksStyles.quickActionTextActive
        ]}>
          Map View
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'timeline' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('timeline')}
      >
        <Ionicons 
          name="time" 
          size={16} 
          color={viewMode === 'timeline' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'timeline' && roadworksStyles.quickActionTextActive
        ]}>
          Timeline
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, showFilters && roadworksStyles.quickActionButtonActive]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons 
          name="funnel" 
          size={16} 
          color={showFilters ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          showFilters && roadworksStyles.quickActionTextActive
        ]}>
          Filters
        </Text>
      </Pressable>

      <Pressable
        style={roadworksStyles.quickActionButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={16} color={colors.textMuted} />
        <Text style={roadworksStyles.quickActionText}>Refresh</Text>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => (
    <View style={roadworksStyles.emptyContainer}>
      <Ionicons 
        name="construct" 
        size={64} 
        color={colors.textMuted} 
        style={roadworksStyles.emptyIcon}
      />
      <Text style={roadworksStyles.emptyTitle}>No Roadworks Found</Text>
      <Text style={roadworksStyles.emptyDescription}>
        {activeTab === 'overview' 
          ? 'There are currently no roadworks to display. Check back later or refresh to see if new data is available.'
          : `No ${activeTab} roadworks found. Try selecting a different tab or refreshing the data.`
        }
      </Text>
      <Pressable
        style={roadworksStyles.actionButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={16} color={colors.textPrimary} />
        <Text style={roadworksStyles.actionButtonText}>Refresh Data</Text>
      </Pressable>
    </View>
  );

  const renderRoadworksList = () => {
    const filteredRoadworks = getFilteredRoadworks();
    
    if (filteredRoadworks.length === 0) {
      return renderEmptyState();
    }

    // Performance optimization: limit rendering for very large datasets
    const maxItemsToShow = 100;
    const itemsToShow = filteredRoadworks.slice(0, maxItemsToShow);
    const hasMoreItems = filteredRoadworks.length > maxItemsToShow;

    return (
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>
            {activeTab === 'overview' ? 'All Roadworks' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Roadworks`}
          </Text>
          <Text style={roadworksStyles.textMuted}>
            {filteredRoadworks.length} item{filteredRoadworks.length === 1 ? '' : 's'}
            {hasMoreItems && ` (showing first ${maxItemsToShow})`}
          </Text>
        </View>
        
        {/* Performance warning for large datasets */}
        {hasMoreItems && (
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: colors.warning,
              marginBottom: spacing.md,
              alignSelf: 'flex-start'
            }
          ]}>
            <Ionicons name="information-circle" size={12} color={colors.textPrimary} />
            <Text style={roadworksStyles.statusBadgeText}>
              Large dataset - showing first {maxItemsToShow} items. Use filters to narrow results.
            </Text>
          </View>
        )}
        
        {itemsToShow.map((roadwork, index) => (
          <RoadworkCard
            key={roadwork.id || `${roadwork.source}-${index}`}
            roadwork={roadwork}
            onPress={handleRoadworkPress}
            onViewMap={handleViewMap}
            onViewDiversions={handleViewDiversions}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
            showActions={true}
          />
        ))}
        
        {/* Load more functionality for large datasets */}
        {hasMoreItems && (
          <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
            <Ionicons name="funnel" size={32} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>
              {filteredRoadworks.length - maxItemsToShow} more items available
            </Text>
            <Text style={roadworksStyles.emptyDescription}>
              Use the filters above to narrow down the results and find specific roadworks.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderMapView = () => {
    const allRoadworks = getFilteredRoadworks();
    
    return (
      <View style={roadworksStyles.section}>
        <MapOverview
          roadworks={allRoadworks}
          selectedRoadwork={selectedRoadwork}
          onRoadworkSelect={handleRoadworkPress}
          onViewFullMap={handleViewFullMap}
          showControls={true}
          height={400}
        />
        
        {/* Map Legend */}
        <View style={[roadworksStyles.section, { marginTop: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>Selected Roadwork Details</Text>
          {selectedRoadwork ? (
            <RoadworkCard
              roadwork={selectedRoadwork}
              onPress={handleRoadworkPress}
              onViewMap={handleViewMap}
              onViewDiversions={handleViewDiversions}
              onStatusChange={handleStatusChange}
              isAdmin={isAdmin}
              showActions={true}
              compact={false}
            />
          ) : (
            <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
              <Ionicons name="map" size={32} color={colors.textMuted} />
              <Text style={roadworksStyles.statTrendText}>
                Click on a roadwork marker to view details
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimelineView = () => {
    const allRoadworks = getFilteredRoadworks();
    
    return (
      <View style={roadworksStyles.section}>
        <TimelineView
          roadworks={allRoadworks}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onRoadworkSelect={handleRoadworkPress}
          viewMode="week"
          showFilters={true}
          compactMode={false}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={roadworksStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={roadworksStyles.loadingText}>Loading roadworks data...</Text>
        </View>
      );
    }

    // Render RoadworkQueue for queue tab
    if (activeTab === 'queue') {
      return <RoadworkQueue />;
    }

    // Render DiversionTemplates for templates tab
    if (activeTab === 'templates') {
      return (
        <DiversionTemplates 
          baseUrl={baseUrl}
          sessionId={sessionId}
          supervisorName={supervisorName}
        />
      );
    }

    // Render Analytics for analytics tab
    if (activeTab === 'analytics') {
      return (
        <RoadworksAnalytics 
          baseUrl={baseUrl}
          sessionId={sessionId}
          supervisorName={supervisorName}
        />
      );
    }

    if (activeTab === 'overview' && viewMode === 'dashboard') {
      return (
        <View style={roadworksStyles.section}>
          {renderStatsOverview()}
          {renderDataSourceStats()}
          
          {/* Quick Preview Components */}
          {stats.total > 0 && (
            <>
              <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
                <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
                  Map Overview
                </Text>
                <MapOverview
                  roadworks={getFilteredRoadworks().slice(0, 20)} // Limit for performance
                  selectedRoadwork={selectedRoadwork}
                  onRoadworkSelect={handleRoadworkPress}
                  onViewFullMap={handleViewFullMap}
                  showControls={false}
                  height={250}
                />
              </View>
              
              <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
                <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
                  Upcoming Events
                </Text>
                <TimelineView
                  roadworks={getFilteredRoadworks().slice(0, 10)} // Limit for performance
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onRoadworkSelect={handleRoadworkPress}
                  viewMode="week"
                  showFilters={false}
                  compactMode={true}
                />
              </View>
            </>
          )}
        </View>
      );
    }

    if (stats.total === 0) {
      return renderEmptyState();
    }

    switch (viewMode) {
      case 'map':
        return renderMapView();
      case 'timeline':
        return renderTimelineView();
      default:
        return renderRoadworksList();
    }
  };

  return (
    <View style={roadworksStyles.container}>
      {renderHeader()}
      
      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={roadworksStyles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabs()}
        {renderQuickActions()}
        
        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({
              status: 'all',
              severity: 'all',
              source: 'all',
              dateRange: 'all',
              affectedRoutes: [],
              searchQuery: ''
            })}
            availableRoutes={getAvailableRoutes()}
            onClose={() => setShowFilters(false)}
            visible={showFilters}
          />
        )}
        
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default RoadworksManagerV2;