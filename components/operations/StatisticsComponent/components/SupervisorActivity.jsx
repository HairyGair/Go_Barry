/*
 * Go Barry - Enhanced Supervisor Activity Component
 * Advanced performance tracking with leaderboard, timeline, and efficiency metrics
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../styles/statistics.styles.js';

const SupervisorActivity = ({ data, loading, timeRange = 'today' }) => {
  const [viewMode, setViewMode] = useState('leaderboard'); // 'leaderboard', 'timeline', 'efficiency'
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [mockActivityData, setMockActivityData] = useState([]);

  // Generate mock real-time activity data
  useEffect(() => {
    const generateActivityFeed = () => {
      const activities = [];
      const supervisors = ['AG003', 'BP009', 'CF004', 'DH005', 'JD006'];
      const actions = ['Dismissed Alert', 'Created Roadwork', 'Updated Status', 'Acknowledged Incident', 'Sent Message'];
      const now = new Date();
      
      for (let i = 0; i < 20; i++) {
        const time = new Date(now.getTime() - (i * 5 * 60 * 1000)); // Every 5 minutes
        activities.push({
          id: `activity_${i}`,
          supervisor: supervisors[Math.floor(Math.random() * supervisors.length)],
          action: actions[Math.floor(Math.random() * actions.length)],
          time: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          timestamp: time.getTime(),
          impact: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
        });
      }
      
      return activities.sort((a, b) => b.timestamp - a.timestamp);
    };

    setMockActivityData(generateActivityFeed());
  }, [timeRange]);

  if (loading || !data) {
    return (
      <View style={[statisticsStyles.card, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={statisticsTheme.charts.primary} />
        <Text style={styles.loadingText}>Loading supervisor data...</Text>
      </View>
    );
  }

  const topPerformers = data.topPerformers || [];
  const summary = {
    activeToday: data.activeToday || 0,
    totalActions: data.totalActions || 0,
    avgResponseTime: data.avgResponseTime || '0 mins'
  };
  
  const activityFeed = data.activityFeed || mockActivityData;

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return statisticsTheme.metrics.success;
    if (efficiency >= 80) return statisticsTheme.metrics.warning;
    return statisticsTheme.metrics.critical;
  };

  const getEfficiencyIcon = (efficiency) => {
    if (efficiency >= 90) return 'star';
    if (efficiency >= 80) return 'star-half-full';
    return 'star-outline';
  };

  const formatResponseTime = (timeString) => {
    // Convert "2.1 mins" to more readable format
    const time = parseFloat(timeString);
    if (time < 1) {
      return `${Math.round(time * 60)}s`;
    } else if (time < 60) {
      return `${time.toFixed(1)}m`;
    } else {
      const hours = Math.floor(time / 60);
      const minutes = Math.round(time % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const renderActivityTimeline = () => (
    <View style={styles.timelineContainer}>
      <Text style={styles.sectionTitle}>Real-Time Activity Feed</Text>
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {activityFeed.slice(0, 8).map((activity, index) => (
          <View key={activity.id} style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <View style={[
                styles.timelineDot,
                {
                  backgroundColor: activity.impact === 'High' ? statisticsTheme.charts.danger :
                                   activity.impact === 'Medium' ? statisticsTheme.charts.warning :
                                   statisticsTheme.charts.secondary
                }
              ]} />
              {index < activityFeed.length - 1 && <View style={styles.timelineLine} />}
            </View>
            
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTime}>{activity.time}</Text>
                <Text style={[styles.timelineImpact, {
                  color: activity.impact === 'High' ? statisticsTheme.charts.danger :
                         activity.impact === 'Medium' ? statisticsTheme.charts.warning :
                         statisticsTheme.charts.secondary
                }]}>
                  {activity.impact}
                </Text>
              </View>
              
              <Text style={styles.timelineAction}>
                <Text style={styles.timelineSupervisor}>{activity.supervisor}</Text> {activity.action.toLowerCase()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderEfficiencyMetrics = () => {
    const efficiencyData = topPerformers.map(supervisor => ({
      name: supervisor.name,
      efficiency: supervisor.efficiency,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: (Math.random() * 10).toFixed(1)
    }));

    return (
      <View style={styles.efficiencyContainer}>
        <Text style={styles.sectionTitle}>Efficiency Trends</Text>
        
        {efficiencyData.map((supervisor) => (
          <View key={supervisor.name} style={styles.efficiencyCard}>
            <View style={styles.efficiencyHeader}>
              <Text style={styles.efficiencyName}>{supervisor.name}</Text>
              <View style={styles.efficiencyTrend}>
                <MaterialCommunityIcons 
                  name={supervisor.trend === 'up' ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={supervisor.trend === 'up' ? statisticsTheme.metrics.success : statisticsTheme.metrics.critical}
                />
                <Text style={[styles.efficiencyTrendText, {
                  color: supervisor.trend === 'up' ? statisticsTheme.metrics.success : statisticsTheme.metrics.critical
                }]}>
                  {supervisor.trendValue}%
                </Text>
              </View>
            </View>
            
            <View style={styles.efficiencyBar}>
              <View style={styles.efficiencyBarTrack}>
                <View style={[
                  styles.efficiencyBarFill,
                  {
                    width: `${supervisor.efficiency}%`,
                    backgroundColor: supervisor.efficiency >= 90 ? statisticsTheme.metrics.success :
                                   supervisor.efficiency >= 80 ? statisticsTheme.charts.warning :
                                   statisticsTheme.charts.danger
                  }
                ]} />
              </View>
              
              <Text style={styles.efficiencyValue}>{supervisor.efficiency}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSparkline = (dataPoints, color = statisticsTheme.charts.primary) => {
    if (Platform.OS !== 'web') return null;
    
    const width = 60;
    const height = 20;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;
    
    const points = dataPoints.map((value, index) => {
      const x = (index / (dataPoints.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} style={styles.sparkline}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const renderViewTabs = () => (
    <View style={styles.viewTabs}>
      {[
        { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
        { key: 'timeline', label: 'Timeline', icon: 'timeline' },
        { key: 'efficiency', label: 'Efficiency', icon: 'chart-line' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.viewTab, viewMode === tab.key && styles.viewTabActive]}
          onPress={() => setViewMode(tab.key)}
        >
          <MaterialCommunityIcons 
            name={tab.icon}
            size={16}
            color={viewMode === tab.key ? '#FFFFFF' : statisticsTheme.colors.textSecondary}
          />
          <Text style={[styles.viewTabText, viewMode === tab.key && styles.viewTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={statisticsStyles.card}>
      <View style={statisticsStyles.cardHeader}>
        <View>
          <Text style={statisticsStyles.cardTitle}>👥 Supervisor Performance</Text>
          <Text style={statisticsStyles.cardSubtitle}>Advanced activity tracking and analytics</Text>
        </View>
      </View>

      {renderViewTabs()}

      {/* Summary Metrics */}
      <View style={styles.summaryMetrics}>
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons 
            name="account-check" 
            size={20} 
            color={statisticsTheme.charts.secondary}
          />
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryValue}>{summary.activeToday}</Text>
            <Text style={styles.summaryLabel}>Active Today</Text>
          </View>
        </View>

        <View style={styles.summaryItem}>
          <MaterialCommunityIcons 
            name="flash" 
            size={20} 
            color={statisticsTheme.charts.primary}
          />
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryValue}>{summary.totalActions}</Text>
            <Text style={styles.summaryLabel}>Total Actions</Text>
          </View>
        </View>

        <View style={styles.summaryItem}>
          <MaterialCommunityIcons 
            name="clock-fast" 
            size={20} 
            color={statisticsTheme.charts.warning}
          />
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryValue}>{formatResponseTime(summary.avgResponseTime)}</Text>
            <Text style={styles.summaryLabel}>Avg Response</Text>
          </View>
        </View>
      </View>

      {/* Top Performers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performers Today</Text>
        
        {topPerformers.length > 0 ? (
          <View style={styles.performersList}>
            {topPerformers.map((supervisor, index) => (
              <View key={supervisor.name} style={styles.performerCard}>
                <View style={styles.performerRank}>
                  <View style={[
                    styles.rankBadge,
                    index === 0 && styles.rankFirst,
                    index === 1 && styles.rankSecond,
                    index === 2 && styles.rankThird
                  ]}>
                    <Text style={[
                      styles.rankText,
                      (index === 0 || index === 1 || index === 2) && styles.rankTextHighlight
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                </View>

                <View style={styles.performerInfo}>
                  <View style={styles.performerHeader}>
                    <Text style={styles.performerName}>{supervisor.name}</Text>
                    <View style={styles.efficiencyBadge}>
                      <MaterialCommunityIcons 
                        name={getEfficiencyIcon(supervisor.efficiency)} 
                        size={12} 
                        color={getEfficiencyColor(supervisor.efficiency)}
                      />
                      <Text style={[
                        styles.efficiencyText,
                        { color: getEfficiencyColor(supervisor.efficiency) }
                      ]}>
                        {supervisor.efficiency}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.performerStats}>
                    <View style={styles.statGroup}>
                      <Text style={styles.statValue}>{supervisor.actions}</Text>
                      <Text style={styles.statLabel}>actions</Text>
                    </View>
                    
                    <View style={styles.statGroup}>
                      <Text style={styles.statValue}>
                        {formatResponseTime(supervisor.avgResponseTime)}
                      </Text>
                      <Text style={styles.statLabel}>avg time</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="account-off" 
              size={32} 
              color={statisticsTheme.colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No supervisor activity today</Text>
          </View>
        )}
      </View>

      {/* Dynamic Content Based on View Mode */}
      {viewMode === 'leaderboard' && (
        <View style={styles.leaderboardView}>
          {/* Top Performers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performers Today</Text>
            
            {topPerformers.length > 0 ? (
              <View style={styles.performersList}>
                {topPerformers.map((supervisor, index) => (
                  <TouchableOpacity
                    key={supervisor.name}
                    style={[
                      styles.performerCard,
                      selectedSupervisor === supervisor.name && styles.performerCardSelected
                    ]}
                    onPress={() => setSelectedSupervisor(
                      selectedSupervisor === supervisor.name ? null : supervisor.name
                    )}
                  >
                    <View style={styles.performerRank}>
                      <View style={[
                        styles.rankBadge,
                        index === 0 && styles.rankFirst,
                        index === 1 && styles.rankSecond,
                        index === 2 && styles.rankThird
                      ]}>
                        <Text style={[
                          styles.rankText,
                          (index === 0 || index === 1 || index === 2) && styles.rankTextHighlight
                        ]}>
                          {index + 1}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.performerInfo}>
                      <View style={styles.performerHeader}>
                        <Text style={styles.performerName}>{supervisor.name}</Text>
                        <View style={styles.performerMetrics}>
                          {renderSparkline([85, 88, 92, 90, supervisor.efficiency], getEfficiencyColor(supervisor.efficiency))}
                          <View style={styles.efficiencyBadge}>
                            <MaterialCommunityIcons 
                              name={getEfficiencyIcon(supervisor.efficiency)} 
                              size={12} 
                              color={getEfficiencyColor(supervisor.efficiency)}
                            />
                            <Text style={[
                              styles.efficiencyText,
                              { color: getEfficiencyColor(supervisor.efficiency) }
                            ]}>
                              {supervisor.efficiency}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.performerStats}>
                        <View style={styles.statGroup}>
                          <Text style={styles.statValue}>{supervisor.actions}</Text>
                          <Text style={styles.statLabel}>actions</Text>
                        </View>
                        
                        <View style={styles.statGroup}>
                          <Text style={styles.statValue}>
                            {formatResponseTime(supervisor.avgResponseTime)}
                          </Text>
                          <Text style={styles.statLabel}>avg time</Text>
                        </View>
                        
                        <View style={styles.statGroup}>
                          <Text style={styles.statValue}>
                            {Math.floor(Math.random() * 100)}%
                          </Text>
                          <Text style={styles.statLabel}>uptime</Text>
                        </View>
                      </View>
                    </View>
                    
                    <MaterialCommunityIcons 
                      name={selectedSupervisor === supervisor.name ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={statisticsTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="account-off" 
                  size={32} 
                  color={statisticsTheme.colors.textSecondary}
                />
                <Text style={styles.emptyStateText}>No supervisor activity today</Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      {viewMode === 'timeline' && renderActivityTimeline()}
      
      {viewMode === 'efficiency' && renderEfficiencyMetrics()}

      {/* Performance Insights */}
      <View style={styles.insights}>
        <Text style={styles.insightsTitle}>📊 Performance Insights</Text>
        
        <View style={styles.insightsList}>
          {summary.totalActions > 100 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="trending-up" 
                size={14} 
                color={statisticsTheme.metrics.success}
              />
              <Text style={styles.insightText}>
                High activity day - {summary.totalActions} actions processed
              </Text>
            </View>
          )}
          
          {parseFloat(summary.avgResponseTime) < 5 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={14} 
                color={statisticsTheme.metrics.success}
              />
              <Text style={styles.insightText}>
                Excellent response times - under 5 minute average
              </Text>
            </View>
          )}
          
          {topPerformers.length > 0 && topPerformers[0].efficiency > 90 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="star" 
                size={14} 
                color={statisticsTheme.charts.warning}
              />
              <Text style={styles.insightText}>
                {topPerformers[0].name} leading with {topPerformers[0].efficiency}% efficiency
              </Text>
            </View>
          )}
          
          {summary.activeToday >= 6 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={14} 
                color={statisticsTheme.charts.primary}
              />
              <Text style={styles.insightText}>
                Full team coverage - {summary.activeToday} supervisors active
              </Text>
            </View>
          )}
          
          {activityFeed.length > 0 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="clock-fast" 
                size={14} 
                color={statisticsTheme.charts.info}
              />
              <Text style={styles.insightText}>
                Latest activity: {activityFeed[0].action} by {activityFeed[0].supervisor}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.sm,
  },

  summaryMetrics: {
    marginBottom: statisticsTheme.spacing.lg,
    gap: statisticsTheme.spacing.md,
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    gap: statisticsTheme.spacing.md,
  },

  summaryDetails: {
    flex: 1,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  summaryLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  section: {
    marginBottom: statisticsTheme.spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  performersList: {
    gap: statisticsTheme.spacing.sm,
  },

  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: statisticsTheme.spacing.md,
  },

  performerRank: {
    alignItems: 'center',
  },

  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankFirst: {
    backgroundColor: '#FEF3C7',
  },

  rankSecond: {
    backgroundColor: '#E5E7EB',
  },

  rankThird: {
    backgroundColor: '#FED7AA',
  },

  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textSecondary,
  },

  rankTextHighlight: {
    color: statisticsTheme.colors.textPrimary,
  },

  performerInfo: {
    flex: 1,
  },

  performerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: statisticsTheme.spacing.xs,
  },

  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  efficiencyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  performerStats: {
    flexDirection: 'row',
    gap: statisticsTheme.spacing.lg,
  },

  statGroup: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  statLabel: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  emptyState: {
    alignItems: 'center',
    padding: statisticsTheme.spacing.xl,
  },

  emptyStateText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.sm,
    textAlign: 'center',
  },

  insights: {
    marginTop: statisticsTheme.spacing.md,
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  insightsList: {
    gap: statisticsTheme.spacing.sm,
  },

  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  insightText: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    flex: 1,
  },

  // Phase 3 Enhanced Styles
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.md,
    padding: 4,
    marginBottom: statisticsTheme.spacing.lg,
  },

  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: statisticsTheme.spacing.sm,
    borderRadius: statisticsTheme.borderRadius.sm,
    gap: 4,
  },

  viewTabActive: {
    backgroundColor: statisticsTheme.charts.primary,
  },

  viewTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: statisticsTheme.colors.textSecondary,
  },

  viewTabTextActive: {
    color: '#FFFFFF',
  },

  leaderboardView: {
    marginBottom: statisticsTheme.spacing.md,
  },

  performerCardSelected: {
    borderColor: statisticsTheme.charts.primary,
    backgroundColor: '#F0F9FF',
  },

  performerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  sparkline: {
    marginRight: statisticsTheme.spacing.sm,
  },

  // Timeline Styles
  timelineContainer: {
    marginBottom: statisticsTheme.spacing.md,
  },

  timeline: {
    maxHeight: 300,
  },

  timelineItem: {
    flexDirection: 'row',
    marginBottom: statisticsTheme.spacing.md,
  },

  timelineMarker: {
    alignItems: 'center',
    marginRight: statisticsTheme.spacing.md,
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    minHeight: 40,
  },

  timelineContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.sm,
  },

  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  timelineTime: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '600',
  },

  timelineImpact: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  timelineAction: {
    fontSize: 12,
    color: statisticsTheme.colors.textPrimary,
  },

  timelineSupervisor: {
    fontWeight: '600',
    color: statisticsTheme.charts.primary,
  },

  // Efficiency Styles
  efficiencyContainer: {
    marginBottom: statisticsTheme.spacing.md,
  },

  efficiencyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    marginBottom: statisticsTheme.spacing.sm,
  },

  efficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: statisticsTheme.spacing.sm,
  },

  efficiencyName: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  efficiencyTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  efficiencyTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  efficiencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  efficiencyBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },

  efficiencyBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  efficiencyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    minWidth: 35,
    textAlign: 'right',
  },
});

export default SupervisorActivity;