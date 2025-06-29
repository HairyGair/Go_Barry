// components/SupervisorAnalytics.jsx
// Supervisor Performance Dashboard - Phase 3, Step 3.1
// Provides insights into supervisor effectiveness

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const SupervisorAnalytics = ({ timeframe = '24h' }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedSupervisor, setSelectedSupervisor] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { supervisor } = useSupervisorSession();
  
  // Get supervisor actions and display message analytics from Convex
  const recentActions = useQuery(api.sync.getRecentActions, { limit: 500 });
  const displayAnalytics = useQuery(api.sync.getDisplayMessageAnalytics, { timeframe: selectedTimeframe });
  const activeSessions = useQuery(api.supervisors.getActiveSessions);

  const timeframes = [
    { id: '24h', label: '24 Hours', hours: 24 },
    { id: '7d', label: '7 Days', hours: 168 },
    { id: '30d', label: '30 Days', hours: 720 }
  ];

  // Calculate analytics from supervisor actions
  useEffect(() => {
    if (!recentActions) {
      setLoading(true);
      return;
    }

    const now = Date.now();
    const timeframeHours = timeframes.find(t => t.id === selectedTimeframe)?.hours || 24;
    const startTime = now - (timeframeHours * 60 * 60 * 1000);

    // Filter actions by timeframe
    const filteredActions = recentActions.filter(action => 
      action.timestamp >= startTime
    );

    // Filter by supervisor if not 'all'
    const supervisorActions = selectedSupervisor === 'all' 
      ? filteredActions 
      : filteredActions.filter(action => action.supervisorId === selectedSupervisor);

    // Calculate metrics
    const analytics = calculateSupervisorMetrics(supervisorActions, timeframeHours);
    
    setAnalyticsData(analytics);
    setLoading(false);
  }, [recentActions, selectedTimeframe, selectedSupervisor]);

  const calculateSupervisorMetrics = (actions, timeframeHours) => {
    const supervisorStats = {};
    const actionTypes = {};
    const hourlyActivity = {};
    
    // Initialize hourly buckets
    for (let i = 0; i < Math.min(timeframeHours, 24); i++) {
      hourlyActivity[i] = 0;
    }

    actions.forEach(action => {
      const supervisorId = action.supervisorId;
      const actionType = action.action;
      const actionTime = new Date(action.timestamp);
      const hour = actionTime.getHours();

      // Track by supervisor
      if (!supervisorStats[supervisorId]) {
        supervisorStats[supervisorId] = {
          supervisorId,
          supervisorName: action.supervisorName,
          totalActions: 0,
          actionTypes: {},
          firstAction: action.timestamp,
          lastAction: action.timestamp,
          avgResponseTime: 0,
          alertsAcknowledged: 0,
          messageseSent: 0,
          roadworksCreated: 0,
          incidentsCreated: 0
        };
      }

      const stats = supervisorStats[supervisorId];
      stats.totalActions++;
      stats.actionTypes[actionType] = (stats.actionTypes[actionType] || 0) + 1;
      stats.lastAction = Math.max(stats.lastAction, action.timestamp);
      stats.firstAction = Math.min(stats.firstAction, action.timestamp);

      // Track specific action types
      switch (actionType) {
        case 'acknowledge_alert':
        case 'dismiss_alert':
          stats.alertsAcknowledged++;
          break;
        case 'send_display_message':
          stats.messageseSent++;
          break;
        case 'create_roadwork':
          stats.roadworksCreated++;
          break;
        case 'create_incident':
          stats.incidentsCreated++;
          break;
      }

      // Track action types globally
      actionTypes[actionType] = (actionTypes[actionType] || 0) + 1;

      // Track hourly activity (last 24 hours only)
      if (timeframeHours <= 24) {
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      }
    });

    // Calculate additional metrics
    Object.values(supervisorStats).forEach(stats => {
      const activeTimeMs = stats.lastAction - stats.firstAction;
      stats.activeTimeHours = activeTimeMs > 0 ? (activeTimeMs / (1000 * 60 * 60)).toFixed(1) : 0;
      stats.actionsPerHour = stats.activeTimeHours > 0 ? (stats.totalActions / stats.activeTimeHours).toFixed(1) : 0;
    });

    // Sort supervisors by total actions
    const sortedSupervisors = Object.values(supervisorStats)
      .sort((a, b) => b.totalActions - a.totalActions);

    return {
      totalActions: actions.length,
      uniqueSupervisors: Object.keys(supervisorStats).length,
      actionTypes,
      supervisorStats: sortedSupervisors,
      hourlyActivity: Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour),
      topSupervisor: sortedSupervisors[0] || null,
      avgActionsPerSupervisor: sortedSupervisors.length > 0 
        ? (actions.length / sortedSupervisors.length).toFixed(1) 
        : 0
    };
  };

  const getSupervisorOptions = () => {
    const supervisors = activeSessions || [];
    return [
      { id: 'all', name: 'All Supervisors' },
      ...supervisors.map(s => ({ 
        id: s.supervisorId, 
        name: `${s.supervisorName} (${s.badge})` 
      }))
    ];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📊 Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Supervisor Performance Analytics</Text>
        
        <View style={styles.controls}>
          {/* Timeframe Selector */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Timeframe:</Text>
            <View style={styles.buttonGroup}>
              {timeframes.map(tf => (
                <TouchableOpacity
                  key={tf.id}
                  style={[
                    styles.timeframeButton,
                    selectedTimeframe === tf.id && styles.activeTimeframeButton
                  ]}
                  onPress={() => setSelectedTimeframe(tf.id)}
                >
                  <Text style={[
                    styles.timeframeButtonText,
                    selectedTimeframe === tf.id && styles.activeTimeframeButtonText
                  ]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Supervisor Selector */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>View:</Text>
            <View style={styles.buttonGroup}>
              {getSupervisorOptions().slice(0, 4).map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.supervisorButton,
                    selectedSupervisor === option.id && styles.activeSupervisorButton
                  ]}
                  onPress={() => setSelectedSupervisor(option.id)}
                >
                  <Text style={[
                    styles.supervisorButtonText,
                    selectedSupervisor === option.id && styles.activeSupervisorButtonText
                  ]}>
                    {option.id === 'all' ? 'All' : option.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Overview Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Actions"
            value={analyticsData?.totalActions || 0}
            color="#0984E3"
            subtitle={`${selectedTimeframe.toUpperCase()}`}
          />
          <MetricCard
            title="Active Supervisors"
            value={analyticsData?.uniqueSupervisors || 0}
            color="#00B894"
            subtitle="participated"
          />
          <MetricCard
            title="Avg Actions/Supervisor"
            value={analyticsData?.avgActionsPerSupervisor || '0'}
            color="#FDCB6E"
            subtitle="per person"
          />
          <MetricCard
            title="Messages Sent"
            value={displayAnalytics?.totalMessages || 0}
            color="#E17055"
            subtitle="to display"
          />
        </View>
      </View>

      {/* Top Performer */}
      {analyticsData?.topSupervisor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Performer</Text>
          <TopPerformerCard supervisor={analyticsData.topSupervisor} />
        </View>
      )}

      {/* Action Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Action Breakdown</Text>
        <ActionBreakdownChart actionTypes={analyticsData?.actionTypes || {}} />
      </View>

      {/* Individual Supervisor Performance */}
      {selectedSupervisor === 'all' && analyticsData?.supervisorStats?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Individual Performance</Text>
          {analyticsData.supervisorStats.slice(0, 5).map((stats, index) => (
            <SupervisorPerformanceCard key={stats.supervisorId} stats={stats} rank={index + 1} />
          ))}
        </View>
      )}

      {/* Display Message Analytics */}
      {displayAnalytics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📺 Display Messages</Text>
          <DisplayMessageAnalytics analytics={displayAnalytics} />
        </View>
      )}

      {/* Hourly Activity (24h view only) */}
      {selectedTimeframe === '24h' && analyticsData?.hourlyActivity && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Hourly Activity</Text>
          <HourlyActivityChart hourlyData={analyticsData.hourlyActivity} />
        </View>
      )}
    </ScrollView>
  );
};

// Component: Top Performer Card
const TopPerformerCard = ({ supervisor }) => (
  <View style={styles.topPerformerCard}>
    <View style={styles.topPerformerHeader}>
      <Text style={styles.topPerformerName}>{supervisor.supervisorName}</Text>
      <Text style={styles.topPerformerBadge}>{supervisor.supervisorId}</Text>
    </View>
    <View style={styles.topPerformerStats}>
      <Text style={styles.topPerformerStat}>{supervisor.totalActions} actions</Text>
      <Text style={styles.topPerformerStat}>{supervisor.actionsPerHour} per hour</Text>
      <Text style={styles.topPerformerStat}>{supervisor.activeTimeHours}h active</Text>
    </View>
  </View>
);

// Component: Action Breakdown Chart
const ActionBreakdownChart = ({ actionTypes }) => {
  const sortedActions = Object.entries(actionTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const total = Object.values(actionTypes).reduce((sum, count) => sum + count, 0);

  const getActionLabel = (action) => {
    const labels = {
      'send_display_message': 'Messages',
      'acknowledge_alert': 'Acknowledged',
      'dismiss_alert': 'Dismissed',
      'create_roadwork': 'Roadworks',
      'create_incident': 'Incidents',
      'login': 'Logins',
      'logout': 'Logouts'
    };
    return labels[action] || action.replace('_', ' ');
  };

  return (
    <View style={styles.actionChart}>
      {sortedActions.map(([action, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        return (
          <View key={action} style={styles.actionItem}>
            <View style={styles.actionItemHeader}>
              <Text style={styles.actionItemLabel}>{getActionLabel(action)}</Text>
              <Text style={styles.actionItemCount}>{count}</Text>
            </View>
            <View style={styles.actionItemBar}>
              <View 
                style={[
                  styles.actionItemBarFill, 
                  { width: `${percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.actionItemPercentage}>{percentage}%</Text>
          </View>
        );
      })}
    </View>
  );
};

// Component: Supervisor Performance Card
const SupervisorPerformanceCard = ({ stats, rank }) => (
  <View style={styles.performanceCard}>
    <View style={styles.performanceCardHeader}>
      <View style={styles.performanceCardRank}>
        <Text style={styles.rankNumber}>{rank}</Text>
      </View>
      <View style={styles.performanceCardInfo}>
        <Text style={styles.performanceCardName}>{stats.supervisorName}</Text>
        <Text style={styles.performanceCardId}>({stats.supervisorId})</Text>
      </View>
      <View style={styles.performanceCardStats}>
        <Text style={styles.performanceCardMainStat}>{stats.totalActions}</Text>
        <Text style={styles.performanceCardStatLabel}>actions</Text>
      </View>
    </View>
    <View style={styles.performanceCardDetails}>
      <DetailItem label="Alerts" value={stats.alertsAcknowledged} />
      <DetailItem label="Messages" value={stats.messageseSent} />
      <DetailItem label="Roadworks" value={stats.roadworksCreated} />
      <DetailItem label="Rate" value={`${stats.actionsPerHour}/hr`} />
    </View>
  </View>
);

// Component: Display Message Analytics
const DisplayMessageAnalytics = ({ analytics }) => (
  <View style={styles.displayAnalytics}>
    <View style={styles.displayMetricsRow}>
      <MetricCard
        title="Display Rate"
        value={`${analytics.displayRate.toFixed(1)}%`}
        color="#10B981"
        subtitle="messages shown"
        compact
      />
      <MetricCard
        title="Auto-triggered"
        value={analytics.autoTriggered}
        color="#F59E0B"
        subtitle="by system"
        compact
      />
      <MetricCard
        title="Avg Display Time"
        value={analytics.avgDisplayTimeFormatted}
        color="#3B82F6"
        subtitle="per message"
        compact
      />
    </View>
    <View style={styles.priorityBreakdown}>
      <Text style={styles.priorityBreakdownTitle}>Priority Breakdown:</Text>
      <View style={styles.priorityItems}>
        <PriorityItem label="P0" count={analytics.priorityBreakdown.P0} color="#DC2626" />
        <PriorityItem label="P1" count={analytics.priorityBreakdown.P1} color="#F59E0B" />
        <PriorityItem label="P2" count={analytics.priorityBreakdown.P2} color="#3B82F6" />
        <PriorityItem label="P3" count={analytics.priorityBreakdown.P3} color="#10B981" />
      </View>
    </View>
  </View>
);

// Component: Hourly Activity Chart
const HourlyActivityChart = ({ hourlyData }) => {
  const maxActivity = Math.max(...hourlyData.map(d => d.count));

  return (
    <View style={styles.hourlyChart}>
      <View style={styles.hourlyChartBars}>
        {hourlyData.map(({ hour, count }) => {
          const height = maxActivity > 0 ? (count / maxActivity) * 100 : 0;
          return (
            <View key={hour} style={styles.hourlyBar}>
              <View style={styles.hourlyBarContainer}>
                <View 
                  style={[
                    styles.hourlyBarFill, 
                    { height: `${height}%` }
                  ]} 
                />
              </View>
              <Text style={styles.hourlyBarLabel}>{hour.toString().padStart(2, '0')}</Text>
              <Text style={styles.hourlyBarCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Utility Components
const MetricCard = ({ title, value, color, subtitle, compact = false }) => (
  <View style={[styles.metricCard, compact && styles.compactMetricCard]}>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
);

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailValue}>{value}</Text>
    <Text style={styles.detailLabel}>{label}</Text>
  </View>
);

const PriorityItem = ({ label, count, color }) => (
  <View style={styles.priorityItem}>
    <View style={[styles.priorityDot, { backgroundColor: color }]} />
    <Text style={styles.priorityLabel}>{label}: {count}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  controlGroup: {
    flex: 1,
    minWidth: 200,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeTimeframeButton: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  activeTimeframeButtonText: {
    color: '#fff',
  },
  supervisorButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeSupervisorButton: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
  },
  supervisorButtonText: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '500',
  },
  activeSupervisorButtonText: {
    color: '#fff',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    alignItems: 'center',
    flex: 1,
    maxWidth: '48%',
  },
  compactMetricCard: {
    padding: 12,
    minWidth: 100,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  metricTitle: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#b2bec3',
    marginTop: 2,
  },
  topPerformerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00b894',
  },
  topPerformerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topPerformerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  topPerformerBadge: {
    fontSize: 14,
    color: '#636e72',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  topPerformerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  topPerformerStat: {
    fontSize: 14,
    color: '#00b894',
    fontWeight: '600',
  },
  actionChart: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  actionItem: {
    marginBottom: 12,
  },
  actionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  actionItemCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  actionItemBar: {
    height: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
    marginBottom: 2,
  },
  actionItemBarFill: {
    height: '100%',
    backgroundColor: '#0984e3',
    borderRadius: 4,
  },
  actionItemPercentage: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'right',
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  performanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceCardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0984e3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  performanceCardInfo: {
    flex: 1,
  },
  performanceCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  performanceCardId: {
    fontSize: 14,
    color: '#636e72',
  },
  performanceCardStats: {
    alignItems: 'center',
  },
  performanceCardMainStat: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  performanceCardStatLabel: {
    fontSize: 12,
    color: '#636e72',
  },
  performanceCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  detailLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  displayAnalytics: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  displayMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priorityBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 16,
  },
  priorityBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 8,
  },
  priorityItems: {
    flexDirection: 'row',
    gap: 16,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#2d3436',
  },
  hourlyChart: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  hourlyChartBars: {
    flexDirection: 'row',
    gap: 2,
    height: 120,
    alignItems: 'end',
  },
  hourlyBar: {
    flex: 1,
    alignItems: 'center',
  },
  hourlyBarContainer: {
    height: 80,
    width: '100%',
    backgroundColor: '#f1f3f4',
    borderRadius: 2,
    justifyContent: 'end',
  },
  hourlyBarFill: {
    backgroundColor: '#0984e3',
    borderRadius: 2,
    width: '100%',
  },
  hourlyBarLabel: {
    fontSize: 10,
    color: '#636e72',
    marginTop: 2,
  },
  hourlyBarCount: {
    fontSize: 9,
    color: '#b2bec3',
  },
});

export default SupervisorAnalytics;
