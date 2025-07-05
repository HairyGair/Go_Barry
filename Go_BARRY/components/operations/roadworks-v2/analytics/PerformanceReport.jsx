/*
 * Go Barry - Performance Report Component
 * Display performance metrics and KPIs
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const PerformanceReport = ({ performance, timeRange }) => {
  const getPerformanceColor = (value, threshold = 80) => {
    if (value >= threshold) return colors.success;
    if (value >= threshold * 0.7) return colors.warning;
    return colors.error;
  };

  const performanceMetrics = [
    {
      label: 'Review Speed',
      value: performance.reviewSpeed,
      unit: '%',
      description: 'Roadworks reviewed within 2 hours',
      icon: 'speedometer',
      threshold: 85
    },
    {
      label: 'Approval Rate',
      value: performance.approvalRate,
      unit: '%',
      description: 'Percentage of roadworks approved',
      icon: 'checkmark-circle',
      threshold: 70
    },
    {
      label: 'Diversion Effectiveness',
      value: performance.diversionEffectiveness,
      unit: '%',
      description: 'Diversions with positive impact',
      icon: 'git-branch',
      threshold: 90
    }
  ];

  return (
    <View style={roadworksStyles.performanceSection}>
      <Text style={roadworksStyles.sectionTitle}>Performance Report</Text>
      <Text style={roadworksStyles.sectionSubtitle}>
        Key performance indicators for {timeRange}
      </Text>

      <View style={roadworksStyles.performanceGrid}>
        {performanceMetrics.map((metric, index) => {
          const color = getPerformanceColor(metric.value, metric.threshold);
          const progress = metric.value / 100;

          return (
            <View key={index} style={roadworksStyles.performanceCard}>
              <View style={roadworksStyles.performanceHeader}>
                <Ionicons name={metric.icon} size={20} color={color} />
                <Text style={roadworksStyles.performanceLabel}>
                  {metric.label}
                </Text>
              </View>

              <View style={roadworksStyles.performanceValueContainer}>
                <Text style={[roadworksStyles.performanceValue, { color }]}>
                  {metric.value}
                </Text>
                <Text style={[roadworksStyles.performanceUnit, { color }]}>
                  {metric.unit}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={roadworksStyles.progressBarContainer}>
                <View style={roadworksStyles.progressBarBackground}>
                  <View
                    style={[
                      roadworksStyles.progressBar,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: color
                      }
                    ]}
                  />
                </View>
              </View>

              <Text style={roadworksStyles.performanceDescription}>
                {metric.description}
              </Text>

              {/* Target vs Actual */}
              <View style={roadworksStyles.targetRow}>
                <Text style={roadworksStyles.targetLabel}>Target:</Text>
                <Text style={roadworksStyles.targetValue}>{metric.threshold}%</Text>
                <View style={[
                  roadworksStyles.targetIndicator,
                  { backgroundColor: metric.value >= metric.threshold ? colors.success : colors.error }
                ]}>
                  <Ionicons
                    name={metric.value >= metric.threshold ? 'checkmark' : 'close'}
                    size={12}
                    color={colors.textPrimary}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary Box */}
      <View style={[
        roadworksStyles.summaryBox,
        {
          backgroundColor: performance.reviewSpeed >= 85 && 
                          performance.approvalRate >= 70 && 
                          performance.diversionEffectiveness >= 90
            ? colors.success + '20'
            : colors.warning + '20'
        }
      ]}>
        <Ionicons
          name="analytics"
          size={24}
          color={
            performance.reviewSpeed >= 85 && 
            performance.approvalRate >= 70 && 
            performance.diversionEffectiveness >= 90
              ? colors.success
              : colors.warning
          }
        />
        <View style={roadworksStyles.summaryContent}>
          <Text style={roadworksStyles.summaryTitle}>Overall Performance</Text>
          <Text style={roadworksStyles.summaryText}>
            {performance.reviewSpeed >= 85 && 
             performance.approvalRate >= 70 && 
             performance.diversionEffectiveness >= 90
              ? 'All KPIs are meeting targets. Great work!'
              : 'Some KPIs need attention. Review areas below target.'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PerformanceReport;