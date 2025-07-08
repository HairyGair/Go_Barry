/*
 * Go Barry - Analytics Chart Component
 * Renders different chart types for analytics
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { roadworksStyles, colors } from '../styles/roadworks.styles';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsChart = ({ type, data, height = 200, width, color = colors.primary }) => {
  const chartWidth = width || screenWidth - 40;

  // Simple chart visualizations (in production, use a proper charting library)
  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (chartWidth - 20) / data.length;

    return (
      <View style={[roadworksStyles.chartContainer, { height }]}>
        <View style={roadworksStyles.chartContent}>
          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * (height - 40);
            return (
              <View
                key={index}
                style={{
                  width: barWidth,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: height - 40,
                }}
              >
                <View
                  style={{
                    width: barWidth - 4,
                    height: barHeight,
                    backgroundColor: color,
                    borderRadius: 2,
                  }}
                />
                <Text style={roadworksStyles.chartLabel}>
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <View style={[roadworksStyles.pieChartContainer, { height, width: chartWidth }]}>
        <View style={roadworksStyles.pieChart}>
          {/* Simplified pie chart representation */}
          {data.map((segment, index) => {
            const percentage = (segment.value / total) * 100;
            const segmentStyle = {
              backgroundColor: segment.color,
              flex: segment.value,
              margin: 1,
            };
            return (
              <View key={index} style={segmentStyle}>
                <Text style={roadworksStyles.pieSegmentText}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <View style={[roadworksStyles.chartContainer, { height }]}>
        {data.map((item, index) => {
          const barWidth = (item.value / maxValue) * (chartWidth - 100);
          return (
            <View key={index} style={roadworksStyles.barChartRow}>
              <Text style={roadworksStyles.barChartLabel}>
                {item.label}
              </Text>
              <View style={roadworksStyles.barChartBarContainer}>
                <View
                  style={[
                    roadworksStyles.barChartBar,
                    {
                      width: barWidth,
                      backgroundColor: item.color || color,
                    }
                  ]}
                />
                <Text style={roadworksStyles.barChartValue}>
                  {item.value}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  switch (type) {
    case 'line':
      return renderLineChart();
    case 'pie':
      return renderPieChart();
    case 'bar':
      return renderBarChart();
    default:
      return <View />;
  }
};

export default AnalyticsChart;