/*
 * Go Barry - Response Time Analytics Chart Component  
 * Bar chart showing supervisor response times with targets and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../../styles/statistics.styles.js';
import { formatDuration } from '../../utils/dataFormatters.js';

const ResponseTimeChart = ({ data, loading, timeRange = 'today' }) => {
  const [selectedMetric, setSelectedMetric] = useState('average');
  const [selectedPeriod, setSelectedPeriod] = useState('hour');
  const [mockData, setMockData] = useState([]);

  // Response time targets
  const targets = {
    critical: 2, // 2 minutes for critical incidents
    high: 5,     // 5 minutes for high priority
    medium: 10,  // 10 minutes for medium priority
    low: 15      // 15 minutes for low priority
  };

  // Generate mock response time data
  useEffect(() => {
    const generateMockData = () => {
      if (selectedPeriod === 'hour') {
        // Last 24 hours, hourly averages
        const hours = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
          const hour = time.getHours();
          
          // Simulate response time patterns (higher during busy hours)
          const baseTime = 3 + Math.sin((hour - 6) * 0.5) * 2; // Peak around midday
          const randomVariation = Math.random() * 2 - 1;
          const avgResponseTime = Math.max(1, baseTime + randomVariation);
          
          hours.push({
            period: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            timestamp: time.getTime(),
            average: avgResponseTime,
            target: targets.high,
            incidents: Math.floor(Math.random() * 8) + 2,
            critical: Math.max(0.5, avgResponseTime - 1 - Math.random()),
            high: avgResponseTime,
            medium: avgResponseTime + Math.random() * 2,
            low: avgResponseTime + Math.random() * 5
          });
        }
        return hours;
      } else {
        // Last 7 days, daily averages  
        const days = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const time = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
          const baseTime = 4 + Math.random() * 2;
          
          days.push({
            period: time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            timestamp: time.getTime(),
            average: baseTime,
            target: targets.high,
            incidents: Math.floor(Math.random() * 50) + 20,
            critical: Math.max(1, baseTime - 2),
            high: baseTime,
            medium: baseTime + Math.random() * 3,
            low: baseTime + Math.random() * 8
          });
        }
        return days;
      }
    };

    setMockData(generateMockData());
  }, [selectedPeriod]);

  const chartData = data || mockData;
  const maxValue = Math.max(...chartData.map(d => Math.max(d[selectedMetric], d.target)));
  const overallAverage = chartData.reduce((sum, d) => sum + d[selectedMetric], 0) / chartData.length;

  // Calculate performance metrics
  const onTargetCount = chartData.filter(d => d[selectedMetric] <= d.target).length;
  const onTargetPercentage = ((onTargetCount / chartData.length) * 100).toFixed(1);

  const renderBarChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading response time data...</Text>
        </View>
      );
    }

    if (chartData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="chart-bar" 
            size={48} 
            color={statisticsTheme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>No response time data available</Text>
        </View>
      );
    }

    const chartWidth = Platform.OS === 'web' ? 400 : 300;
    const chartHeight = 200;
    const padding = 40;
    const plotWidth = chartWidth - (padding * 2);
    const plotHeight = chartHeight - (padding * 2);

    if (Platform.OS === 'web') {
      // SVG Bar Chart for web
      return (
        <View style={styles.chartContainer}>
          <svg width={chartWidth} height={chartHeight} style={styles.svg}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <g key={`grid-${index}`}>
                <line
                  x1={padding}
                  y1={padding + ratio * plotHeight}
                  x2={chartWidth - padding}
                  y2={padding + ratio * plotHeight}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding - 5}
                  y={padding + ratio * plotHeight + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill={statisticsTheme.colors.textSecondary}
                >
                  {(maxValue * (1 - ratio)).toFixed(1)}m
                </text>
              </g>
            ))}

            {/* Target line */}
            <line
              x1={padding}
              y1={padding + (1 - (targets.high / maxValue)) * plotHeight}
              x2={chartWidth - padding}
              y2={padding + (1 - (targets.high / maxValue)) * plotHeight}
              stroke={statisticsTheme.charts.warning}
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Bars */}
            {chartData.map((item, index) => {
              const barWidth = plotWidth / chartData.length * 0.7;
              const barX = padding + (index / chartData.length) * plotWidth + 
                          (plotWidth / chartData.length - barWidth) / 2;
              const barHeight = (item[selectedMetric] / maxValue) * plotHeight;
              const barY = padding + plotHeight - barHeight;
              
              const isOnTarget = item[selectedMetric] <= item.target;
              const barColor = isOnTarget ? 
                statisticsTheme.charts.secondary : 
                statisticsTheme.charts.danger;

              return (
                <g key={index}>
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    rx="2"
                    style={{ cursor: 'pointer' }}
                  />
                  
                  {/* Bar value label */}
                  <text
                    x={barX + barWidth / 2}
                    y={barY - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={statisticsTheme.colors.textPrimary}
                    fontWeight="600"
                  >
                    {item[selectedMetric].toFixed(1)}m
                  </text>
                  
                  {/* Period label */}
                  <text
                    x={barX + barWidth / 2}
                    y={chartHeight - padding + 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill={statisticsTheme.colors.textSecondary}
                  >
                    {item.period}
                  </text>
                </g>
              );
            })}
          </svg>
        </View>
      );
    } else {
      // Mobile horizontal bars
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mobileChart}>
            {chartData.map((item, index) => {
              const isOnTarget = item[selectedMetric] <= item.target;
              const barColor = isOnTarget ? 
                statisticsTheme.charts.secondary : 
                statisticsTheme.charts.danger;

              return (
                <View key={index} style={styles.mobileBarContainer}>
                  <Text style={styles.mobileBarLabel}>{item.period}</Text>
                  
                  <View style={styles.mobileBarTrack}>
                    <View 
                      style={[
                        styles.mobileBar,
                        { 
                          height: `${(item[selectedMetric] / maxValue) * 100}%`,
                          backgroundColor: barColor
                        }
                      ]}
                    />
                  </View>
                  
                  <Text style={styles.mobileBarValue}>
                    {item[selectedMetric].toFixed(1)}m
                  </Text>
                  
                  <MaterialCommunityIcons 
                    name={isOnTarget ? "check-circle" : "alert-circle"}
                    size={12}
                    color={barColor}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }
  };

  return (
    <View style={statisticsStyles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>⏱️ Response Time Analytics</Text>
          <Text style={styles.subtitle}>Supervisor performance vs targets</Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'hour' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('hour')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'hour' && styles.periodButtonTextActive
            ]}>
              Hourly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'day' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'day' && styles.periodButtonTextActive
            ]}>
              Daily
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Performance Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatDuration(overallAverage)}
          </Text>
          <Text style={styles.summaryLabel}>Average Response</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[
            styles.summaryValue,
            { color: onTargetPercentage >= 80 ? 
              statisticsTheme.metrics.success : 
              statisticsTheme.metrics.warning 
            }
          ]}>
            {onTargetPercentage}%
          </Text>
          <Text style={styles.summaryLabel}>On Target</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatDuration(targets.high)}
          </Text>
          <Text style={styles.summaryLabel}>Target</Text>
        </View>
      </View>

      {/* Metric Selector */}
      <View style={styles.metricSelector}>
        {[
          { key: 'average', label: 'Average', icon: 'chart-line' },
          { key: 'critical', label: 'Critical', icon: 'alert-circle' },
          { key: 'high', label: 'High', icon: 'alert' },
          { key: 'medium', label: 'Medium', icon: 'information' },
          { key: 'low', label: 'Low', icon: 'information-outline' }
        ].map((metric) => (
          <TouchableOpacity
            key={metric.key}
            style={[
              styles.metricButton,
              selectedMetric === metric.key && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric.key)}
          >
            <MaterialCommunityIcons 
              name={metric.icon} 
              size={14} 
              color={selectedMetric === metric.key ? 
                statisticsTheme.charts.primary : 
                statisticsTheme.colors.textSecondary
              }
            />
            <Text style={[
              styles.metricButtonText,
              selectedMetric === metric.key && styles.metricButtonTextActive
            ]}>
              {metric.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Legend and Insights */}
      <View style={styles.footer}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.secondary }]} />
            <Text style={styles.legendText}>On Target</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.danger }]} />
            <Text style={styles.legendText}>Over Target</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={styles.targetLine} />
            <Text style={styles.legendText}>Target Line</Text>
          </View>
        </View>
        
        <View style={styles.insights}>
          {onTargetPercentage >= 90 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="star" 
                size={14} 
                color={statisticsTheme.metrics.success}
              />
              <Text style={styles.insightText}>
                Excellent performance - {onTargetPercentage}% on target
              </Text>
            </View>
          )}
          
          {onTargetPercentage < 70 && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={14} 
                color={statisticsTheme.metrics.warning}
              />
              <Text style={styles.insightText}>
                Response times need improvement - only {onTargetPercentage}% on target
              </Text>
            </View>
          )}
          
          {overallAverage < targets.critical && (
            <View style={styles.insightItem}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={14} 
                color={statisticsTheme.metrics.success}
              />
              <Text style={styles.insightText}>
                Outstanding speed - averaging under {formatDuration(targets.critical)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  function renderChart() {
    return renderBarChart();
  }
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: statisticsTheme.spacing.lg,
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.md,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  controls: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.md,
    padding: 4,
  },

  periodButton: {
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.sm,
    borderRadius: statisticsTheme.borderRadius.sm,
  },

  periodButtonActive: {
    backgroundColor: statisticsTheme.charts.primary,
  },

  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: statisticsTheme.colors.textSecondary,
  },

  periodButtonTextActive: {
    color: '#FFFFFF',
  },

  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: statisticsTheme.spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
  },

  summaryCard: {
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  summaryLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  metricSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.xs,
    marginBottom: statisticsTheme.spacing.lg,
  },

  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: statisticsTheme.spacing.sm,
    paddingVertical: statisticsTheme.spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  metricButtonActive: {
    backgroundColor: '#F0F9FF',
    borderColor: statisticsTheme.charts.primary,
  },

  metricButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: statisticsTheme.colors.textSecondary,
  },

  metricButtonTextActive: {
    color: statisticsTheme.charts.primary,
  },

  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    marginBottom: statisticsTheme.spacing.md,
    padding: statisticsTheme.spacing.sm,
  },

  svg: {
    backgroundColor: 'transparent',
  },

  mobileChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: statisticsTheme.spacing.sm,
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    marginBottom: statisticsTheme.spacing.md,
  },

  mobileBarContainer: {
    alignItems: 'center',
    width: 50,
  },

  mobileBarLabel: {
    fontSize: 8,
    color: statisticsTheme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },

  mobileBarTrack: {
    width: 20,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  mobileBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },

  mobileBarValue: {
    fontSize: 8,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },

  footer: {
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.md,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  targetLine: {
    width: 12,
    height: 2,
    backgroundColor: statisticsTheme.charts.warning,
    borderRadius: 1,
  },

  legendText: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },

  insights: {
    gap: statisticsTheme.spacing.xs,
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

  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  emptyText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ResponseTimeChart;