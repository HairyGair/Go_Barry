/*
 * Go Barry - Alert Volume Chart Component
 * Time series line chart showing alert volume trends over time
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../../styles/statistics.styles.js';
import { useChartData } from '../../hooks/useChartData.js';
import { formatTimeSeriesData } from '../../utils/chartHelpers.js';

const { width: screenWidth } = Dimensions.get('window');

const AlertVolumeChart = ({ timeRange = 'today', data, loading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('hour');
  const [mockData, setMockData] = useState([]);

  // Generate mock time series data
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const points = [];
      
      if (selectedPeriod === 'hour') {
        // Last 24 hours, hourly data
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
          const baseValue = 8 + Math.sin(i * 0.3) * 4; // Simulate daily pattern
          const randomVariation = Math.random() * 6 - 3;
          const value = Math.max(0, Math.round(baseValue + randomVariation));
          
          points.push({
            time: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            value,
            timestamp: time.getTime(),
            label: `${value} alerts at ${time.getHours()}:00`
          });
        }
      } else if (selectedPeriod === 'day') {
        // Last 7 days, daily data
        for (let i = 6; i >= 0; i--) {
          const time = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
          const baseValue = 150 + Math.sin(i * 0.5) * 50;
          const randomVariation = Math.random() * 40 - 20;
          const value = Math.max(0, Math.round(baseValue + randomVariation));
          
          points.push({
            time: time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            value,
            timestamp: time.getTime(),
            label: `${value} alerts on ${time.toLocaleDateString('en-GB')}`
          });
        }
      }
      
      return points;
    };

    setMockData(generateMockData());
  }, [selectedPeriod]);

  const chartData = data || mockData;
  const maxValue = Math.max(...chartData.map(d => d.value));
  const avgValue = Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length);

  // Calculate trend
  const recentValues = chartData.slice(-3).map(d => d.value);
  const trend = recentValues.length >= 2 ? 
    (recentValues[recentValues.length - 1] - recentValues[0]) : 0;
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  // SVG Chart for web/mobile compatibility
  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading alert trends...</Text>
        </View>
      );
    }

    const chartWidth = Math.min(screenWidth - 80, 400);
    const chartHeight = 200;
    const padding = 40;
    const plotWidth = chartWidth - (padding * 2);
    const plotHeight = chartHeight - (padding * 2);

    if (chartData.length === 0) {
      return (
        <View style={[styles.chartContainer, { height: chartHeight }]}>
          <Text style={styles.emptyText}>No alert data available</Text>
        </View>
      );
    }

    // Calculate points for SVG path
    const points = chartData.map((item, index) => {
      const x = padding + (index / (chartData.length - 1)) * plotWidth;
      const y = padding + (1 - (item.value / maxValue)) * plotHeight;
      return { x, y, data: item };
    });

    // Create SVG path
    const pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      } else {
        return `${path} L ${point.x} ${point.y}`;
      }
    }, '');

    // Area fill path
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

    if (Platform.OS === 'web') {
      return (
        <View style={[styles.chartContainer, { height: chartHeight }]}>
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
              </g>
            ))}
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill={`${statisticsTheme.charts.primary}20`}
              stroke="none"
            />
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={statisticsTheme.charts.primary}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={statisticsTheme.charts.primary}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            ))}
          </svg>
        </View>
      );
    } else {
      // Mobile fallback - show data as bars
      return (
        <View style={styles.mobileChart}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: (item.value / maxValue) * 100,
                    backgroundColor: statisticsTheme.charts.primary
                  }
                ]}
              />
              <Text style={styles.barLabel}>{item.time}</Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={statisticsStyles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📊 Alert Volume Trends</Text>
          <Text style={styles.subtitle}>Real-time alert processing metrics</Text>
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

      {/* Chart Metrics */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{maxValue}</Text>
          <Text style={styles.metricLabel}>Peak</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{avgValue}</Text>
          <Text style={styles.metricLabel}>Average</Text>
        </View>
        
        <View style={styles.metric}>
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons 
              name={
                trendDirection === 'up' ? 'trending-up' :
                trendDirection === 'down' ? 'trending-down' : 'minus'
              }
              size={16}
              color={
                trendDirection === 'up' ? statisticsTheme.metrics.success :
                trendDirection === 'down' ? statisticsTheme.metrics.critical :
                statisticsTheme.metrics.neutral
              }
            />
            <Text style={[
              styles.trendText,
              {
                color: trendDirection === 'up' ? statisticsTheme.metrics.success :
                       trendDirection === 'down' ? statisticsTheme.metrics.critical :
                       statisticsTheme.metrics.neutral
              }
            ]}>
              {trendDirection === 'neutral' ? 'Stable' : 
               `${Math.abs(trend)} ${trendDirection === 'up' ? 'increase' : 'decrease'}`}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Trend</Text>
        </View>
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Chart Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.primary }]} />
          <Text style={styles.legendText}>Alert Volume</Text>
        </View>
        
        <Text style={styles.chartInfo}>
          {selectedPeriod === 'hour' ? 'Last 24 hours' : 'Last 7 days'} • 
          Updated: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
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

  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: statisticsTheme.spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
  },

  metric: {
    alignItems: 'center',
  },

  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  metricLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    marginBottom: statisticsTheme.spacing.md,
  },

  svg: {
    backgroundColor: 'transparent',
  },

  mobileChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    marginBottom: statisticsTheme.spacing.md,
  },

  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },

  bar: {
    width: '80%',
    backgroundColor: statisticsTheme.charts.primary,
    borderRadius: 2,
    minHeight: 4,
  },

  barLabel: {
    fontSize: 8,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },

  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginTop: 2,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  legendText: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },

  chartInfo: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
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

  emptyText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AlertVolumeChart;