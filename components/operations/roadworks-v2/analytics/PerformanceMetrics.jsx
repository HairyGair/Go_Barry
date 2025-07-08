/*
 * Go Barry - Performance Metrics Component
 * Displays detailed performance indicators and KPIs
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors } from '../styles/roadworks.styles';

const PerformanceMetrics = ({ data, timeframe }) => {
  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return colors.success;
    if (value >= thresholds.good) return colors.warning;
    return colors.error;
  };

  const getTimeFrameLabel = (tf) => {
    const labels = {
      '1d': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days'
    };
    return labels[tf] || 'Current Period';
  };

  const performanceIndicators = [
    {
      title: 'Processing Speed',
      value: data.avgProcessingTime,
      unit: 'min',
      description: 'Average time from notification to action',
      icon: 'speedometer',
      thresholds: { excellent: 15, good: 30 },
      invert: true // Lower is better
    },
    {
      title: 'Review Completion',
      value: data.reviewCompletionRate,
      unit: '%',
      description: 'Percentage of roadworks reviewed within 2 hours',
      icon: 'checkmark-circle',
      thresholds: { excellent: 95, good: 85 }
    },
    {
      title: 'Diversion Success',
      value: data.diversionSuccessRate,
      unit: '%',
      description: 'Successful diversions with minimal disruption',
      icon: 'swap-horizontal',
      thresholds: { excellent: 90, good: 75 }
    },
    {
      title: 'Template Reuse',
      value: data.templateReuseRate,
      unit: '%',
      description: 'Usage of existing diversion templates',
      icon: 'copy',
      thresholds: { excellent: 70, good: 50 }
    },
    {
      title: 'Overrun Prevention',
      value: data.overrunPreventionRate,
      unit: '%',
      description: 'Roadworks completed on schedule',
      icon: 'time',
      thresholds: { excellent: 85, good: 70 }
    },
    {
      title: 'Display Response',
      value: data.displayResponseTime,
      unit: 'sec',
      description: 'Time to push critical updates to display',
      icon: 'tv',
      thresholds: { excellent: 30, good: 60 },
      invert: true
    }
  ];

  return (
    <View style={roadworksStyles.performanceContainer}>
      <View style={roadworksStyles.performanceHeader}>
        <Text style={roadworksStyles.chartTitle}>Performance Metrics</Text>
        <Text style={roadworksStyles.performanceSubtitle}>
          {getTimeFrameLabel(timeframe)}
        </Text>
      </View>

      <View style={roadworksStyles.performanceGrid}>
        {performanceIndicators.map((indicator, index) => {
          const value = indicator.value || 0;
          const adjustedValue = indicator.invert ? 
            (value <= indicator.thresholds.excellent ? 100 : 
             value <= indicator.thresholds.good ? 75 : 50) : value;
          
          const performanceColor = indicator.invert ?
            (value <= indicator.thresholds.excellent ? colors.success :
             value <= indicator.thresholds.good ? colors.warning : colors.error) :
            getPerformanceColor(value, indicator.thresholds);

          return (
            <View key={index} style={roadworksStyles.performanceCard}>
              <View style={roadworksStyles.performanceCardHeader}>
                <View style={[roadworksStyles.performanceIcon, { backgroundColor: `${performanceColor}20` }]}>
                  <Ionicons name={indicator.icon} size={24} color={performanceColor} />
                </View>
                <View style={roadworksStyles.performanceValue}>
                  <Text style={[roadworksStyles.performanceNumber, { color: performanceColor }]}>
                    {value.toFixed(indicator.unit === '%' ? 1 : 0)}{indicator.unit}
                  </Text>
                </View>
              </View>
              
              <View style={roadworksStyles.performanceBody}>
                <Text style={roadworksStyles.performanceTitle}>
                  {indicator.title}
                </Text>
                <Text style={roadworksStyles.performanceDescription}>
                  {indicator.description}
                </Text>
              </View>

              {/* Performance bar */}
              <View style={roadworksStyles.performanceBarContainer}>
                <View 
                  style={[
                    roadworksStyles.performanceBar,
                    { 
                      width: `${Math.min(100, Math.max(0, adjustedValue))}%`,
                      backgroundColor: performanceColor
                    }
                  ]} 
                />
              </View>

              {/* Performance status */}
              <View style={roadworksStyles.performanceStatus}>
                <View style={[roadworksStyles.statusDot, { backgroundColor: performanceColor }]} />
                <Text style={[roadworksStyles.statusText, { color: performanceColor }]}>
                  {indicator.invert ? 
                    (value <= indicator.thresholds.excellent ? 'Excellent' :
                     value <= indicator.thresholds.good ? 'Good' : 'Needs Improvement') :
                    (value >= indicator.thresholds.excellent ? 'Excellent' :
                     value >= indicator.thresholds.good ? 'Good' : 'Needs Improvement')
                  }
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Overall Performance Score */}
      <View style={roadworksStyles.overallPerformanceCard}>
        <View style={roadworksStyles.overallPerformanceHeader}>
          <Ionicons name="trophy" size={32} color={getPerformanceColor(data.overallScore || 0, { excellent: 90, good: 75 })} />
          <View style={roadworksStyles.overallPerformanceScore}>
            <Text style={[
              roadworksStyles.overallScoreNumber,
              { color: getPerformanceColor(data.overallScore || 0, { excellent: 90, good: 75 }) }
            ]}>
              {(data.overallScore || 0).toFixed(1)}
            </Text>
            <Text style={roadworksStyles.overallScoreLabel}>Overall Score</Text>
          </View>
        </View>
        
        <Text style={roadworksStyles.overallPerformanceDescription}>
          {data.overallScore >= 90 ? 'Excellent performance across all metrics' :
           data.overallScore >= 75 ? 'Good performance with room for improvement' :
           'Performance needs attention in key areas'}
        </Text>

        {/* Improvement suggestions */}
        {data.suggestions && data.suggestions.length > 0 && (
          <View style={roadworksStyles.suggestionsContainer}>
            <Text style={roadworksStyles.suggestionsTitle}>
              <Ionicons name="bulb" size={16} color={colors.warning} /> Improvement Suggestions
            </Text>
            {data.suggestions.slice(0, 3).map((suggestion, index) => (
              <Text key={index} style={roadworksStyles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Trend indicators */}
      {data.trends && (
        <View style={roadworksStyles.trendsContainer}>
          <Text style={roadworksStyles.trendsTitle}>Performance Trends</Text>
          <View style={roadworksStyles.trendsGrid}>
            {Object.entries(data.trends).map(([metric, trend]) => (
              <View key={metric} style={roadworksStyles.trendItem}>
                <Text style={roadworksStyles.trendMetric}>
                  {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <View style={roadworksStyles.trendIndicator}>
                  <Ionicons 
                    name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove'} 
                    size={16} 
                    color={trend > 0 ? colors.success : trend < 0 ? colors.error : colors.textMuted} 
                  />
                  <Text style={[
                    roadworksStyles.trendValue,
                    { color: trend > 0 ? colors.success : trend < 0 ? colors.error : colors.textMuted }
                  ]}>
                    {Math.abs(trend).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default PerformanceMetrics;