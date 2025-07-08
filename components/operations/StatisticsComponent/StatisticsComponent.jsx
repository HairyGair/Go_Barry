/*
 * Go Barry - Traffic Intelligence Platform
 * Statistics Component - Operations Centre Dashboard
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, Platform } from 'react-native';
import { useSupervisor } from '../../hooks/useSupervisorSession';

// Import components
import StatisticsHeader from './components/StatisticsHeader.jsx';
import RealTimeOverview from './components/RealTimeOverview.jsx';
import DataSourceStatus from './components/DataSourceStatus.jsx';
import RouteImpactSection from './components/RouteImpactSection.jsx';
import SupervisorActivity from './components/SupervisorActivity.jsx';

// Import Phase 2 charts
import AlertVolumeChart from './components/charts/AlertVolumeChart.jsx';
import IncidentCategoriesChart from './components/charts/IncidentCategoriesChart.jsx';
import ResponseTimeChart from './components/charts/ResponseTimeChart.jsx';

// Import Phase 3 components
import TimeRangeFilter from './components/filters/TimeRangeFilter.jsx';
import ExportOptions from './components/filters/ExportOptions.jsx';
import GeographicHeatmap from './components/charts/GeographicHeatmap.jsx';

// Import hooks
import { useStatisticsData } from './hooks/useStatisticsData.js';

// Import styles
import { statisticsStyles, statisticsTheme } from './styles/statistics.styles.js';

const StatisticsComponent = () => {
  const { isLoggedIn, supervisorName } = useSupervisor();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  
  // Get statistics data with real-time updates
  const {
    dashboardData,
    routeData,
    supervisorData,
    systemHealth,
    loading,
    error,
    refreshData
  } = useStatisticsData({ timeRange, autoRefresh: true });

  // Handle manual refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData, refreshing]);

  if (!isLoggedIn) {
    return (
      <View style={statisticsStyles.unauthorizedContainer}>
        <Text style={statisticsStyles.unauthorizedText}>
          Please log in to view statistics
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={statisticsStyles.errorContainer}>
        <Text style={statisticsStyles.errorTitle}>Failed to Load Statistics</Text>
        <Text style={statisticsStyles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={statisticsStyles.container}>
      {/* Header */}
      <StatisticsHeader 
        supervisorName={supervisorName}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={onRefresh}
        loading={loading}
      />
      
      {/* Advanced Controls */}
      <View style={styles.advancedControls}>
        <TimeRangeFilter 
          value={timeRange}
          onChange={setTimeRange}
          disabled={loading}
        />
        
        <ExportOptions 
          data={{
            alerts: dashboardData?.alerts,
            incidents: dashboardData?.incidents,
            supervisors: supervisorData,
            routes: routeData
          }}
          timeRange={timeRange}
          supervisorName={supervisorName}
          disabled={loading}
        />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={statisticsStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Real-Time Overview */}
        <RealTimeOverview 
          data={dashboardData}
          loading={loading}
        />

        {/* Three Column Layout */}
        <View style={statisticsStyles.mainContent}>
          {/* Left Column */}
          <View style={statisticsStyles.leftColumn}>
            <RouteImpactSection 
              data={routeData}
              loading={loading}
            />
          </View>

          {/* Center Column */}
          <View style={statisticsStyles.centerColumn}>
            <AlertVolumeChart 
              timeRange={timeRange}
              loading={loading}
            />
            
            <IncidentCategoriesChart 
              timeRange={timeRange}
              loading={loading}
            />
          </View>

          {/* Right Column */}
          <View style={statisticsStyles.rightColumn}>
            <SupervisorActivity 
              data={supervisorData}
              loading={loading}
            />
            
            <DataSourceStatus 
              data={systemHealth}
              loading={loading}
            />
          </View>
        </View>

        {/* Bottom Section - Response Time & Geographic Analysis */}
        <View style={statisticsStyles.bottomSection}>
          <ResponseTimeChart 
            timeRange={timeRange}
            loading={loading}
          />
          
          <GeographicHeatmap 
            timeRange={timeRange}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  advancedControls: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: statisticsTheme.spacing.lg,
    paddingHorizontal: statisticsTheme.spacing.lg,
    paddingBottom: statisticsTheme.spacing.md,
    ...Platform.select({
      web: {
        '@media (max-width: 768px)': {
          flexDirection: 'column',
        },
      },
    }),
  },
});
export default StatisticsComponent;