/*
 * Go Barry - Incident Categories Chart Component
 * Pie chart showing distribution of incident types with drill-down capability
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../../styles/statistics.styles.js';

const IncidentCategoriesChart = ({ data, loading, timeRange = 'today' }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mockData, setMockData] = useState([]);

  // Generate mock incident categories data
  useEffect(() => {
    const generateMockData = () => {
      const categories = [
        { 
          id: 'traffic', 
          name: 'Traffic Incidents', 
          value: 45, 
          color: statisticsTheme.charts.danger,
          icon: 'car-multiple',
          subcategories: ['Heavy Traffic', 'Lane Closure', 'Vehicle Breakdown']
        },
        { 
          id: 'roadworks', 
          name: 'Roadworks', 
          value: 28, 
          color: statisticsTheme.charts.warning,
          icon: 'road-variant',
          subcategories: ['Planned Works', 'Emergency Repairs', 'Utilities']
        },
        { 
          id: 'events', 
          name: 'Special Events', 
          value: 15, 
          color: statisticsTheme.charts.info,
          icon: 'calendar-star',
          subcategories: ['Concerts', 'Sports Events', 'Festivals']
        },
        { 
          id: 'weather', 
          name: 'Weather Related', 
          value: 8, 
          color: statisticsTheme.charts.secondary,
          icon: 'weather-cloudy',
          subcategories: ['Heavy Rain', 'Ice/Snow', 'High Winds']
        },
        { 
          id: 'emergency', 
          name: 'Emergency Services', 
          value: 4, 
          color: '#DC2626',
          icon: 'ambulance',
          subcategories: ['Police Response', 'Fire Service', 'Medical Emergency']
        }
      ];

      // Calculate percentages
      const total = categories.reduce((sum, cat) => sum + cat.value, 0);
      return categories.map(cat => ({
        ...cat,
        percentage: ((cat.value / total) * 100).toFixed(1)
      }));
    };

    setMockData(generateMockData());
  }, [timeRange]);

  const chartData = data || mockData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Calculate pie chart angles
  const pieData = chartData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    return {
      ...item,
      percentage: percentage.toFixed(1),
      angle,
      startAngle: chartData.slice(0, index).reduce((sum, prev) => 
        sum + ((prev.value / total) * 360), 0
      )
    };
  });

  const renderPieChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading incident data...</Text>
        </View>
      );
    }

    if (chartData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="chart-pie" 
            size={48} 
            color={statisticsTheme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>No incident data available</Text>
        </View>
      );
    }

    const size = 160;
    const radius = size / 2 - 10;
    const center = size / 2;

    if (Platform.OS === 'web') {
      // SVG Pie Chart for web
      let currentAngle = -90; // Start from top

      return (
        <View style={styles.pieContainer}>
          <svg width={size} height={size} style={styles.svg}>
            {/* Pie slices */}
            {pieData.map((item, index) => {
              const startAngle = currentAngle;
              const endAngle = currentAngle + item.angle;
              currentAngle = endAngle;

              const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
              const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
              const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
              const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

              const largeArcFlag = item.angle > 180 ? 1 : 0;

              const pathData = [
                `M ${center} ${center}`,
                `L ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
              ].join(' ');

              return (
                <path
                  key={item.id}
                  d={pathData}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{
                    cursor: 'pointer',
                    opacity: selectedCategory && selectedCategory !== item.id ? 0.6 : 1
                  }}
                  onClick={() => setSelectedCategory(
                    selectedCategory === item.id ? null : item.id
                  )}
                />
              );
            })}
            
            {/* Center circle */}
            <circle
              cx={center}
              cy={center}
              r={radius * 0.4}
              fill={statisticsTheme.colors.background}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            
            {/* Center text */}
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill={statisticsTheme.colors.textPrimary}
            >
              {total}
            </text>
            <text
              x={center}
              y={center + 10}
              textAnchor="middle"
              fontSize="12"
              fill={statisticsTheme.colors.textSecondary}
            >
              Total
            </text>
          </svg>
        </View>
      );
    } else {
      // Mobile fallback - horizontal bars
      return (
        <View style={styles.mobileChart}>
          {chartData.map((item, index) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.mobileBarContainer}
              onPress={() => setSelectedCategory(
                selectedCategory === item.id ? null : item.id
              )}
            >
              <View style={styles.mobileBarInfo}>
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={20} 
                  color={item.color}
                />
                <Text style={styles.mobileBarLabel}>{item.name}</Text>
              </View>
              
              <View style={styles.mobileBarTrack}>
                <View 
                  style={[
                    styles.mobileBar,
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }
                  ]}
                />
              </View>
              
              <Text style={styles.mobileBarValue}>{item.value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
  };

  const selectedCategoryData = chartData.find(cat => cat.id === selectedCategory);

  return (
    <View style={statisticsStyles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🥧 Incident Categories</Text>
          <Text style={styles.subtitle}>Distribution by incident type</Text>
        </View>
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalValue}>{total}</Text>
          <Text style={styles.totalLabel}>Total Incidents</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Pie Chart */}
        <View style={styles.chartSection}>
          {renderPieChart()}
        </View>

        {/* Legend */}
        <View style={styles.legendSection}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {chartData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.legendItem,
                  selectedCategory === item.id && styles.legendItemSelected
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === item.id ? null : item.id
                )}
              >
                <View style={styles.legendItemHeader}>
                  <View style={styles.legendItemInfo}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <MaterialCommunityIcons 
                      name={item.icon} 
                      size={16} 
                      color={item.color}
                      style={styles.legendIcon}
                    />
                    <Text style={styles.legendName}>{item.name}</Text>
                  </View>
                  
                  <View style={styles.legendValues}>
                    <Text style={styles.legendValue}>{item.value}</Text>
                    <Text style={styles.legendPercentage}>{item.percentage}%</Text>
                  </View>
                </View>

                {selectedCategory === item.id && item.subcategories && (
                  <View style={styles.subcategories}>
                    {item.subcategories.map((sub, index) => (
                      <View key={index} style={styles.subcategoryItem}>
                        <MaterialCommunityIcons 
                          name="chevron-right" 
                          size={12} 
                          color={statisticsTheme.colors.textSecondary}
                        />
                        <Text style={styles.subcategoryText}>{sub}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Selected Category Details */}
      {selectedCategoryData && (
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeader}>
            <MaterialCommunityIcons 
              name={selectedCategoryData.icon} 
              size={20} 
              color={selectedCategoryData.color}
            />
            <Text style={styles.detailsTitle}>{selectedCategoryData.name}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <MaterialCommunityIcons 
                name="close" 
                size={16} 
                color={statisticsTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsStats}>
            <View style={styles.detailsStat}>
              <Text style={styles.detailsStatValue}>{selectedCategoryData.value}</Text>
              <Text style={styles.detailsStatLabel}>Incidents</Text>
            </View>
            
            <View style={styles.detailsStat}>
              <Text style={styles.detailsStatValue}>{selectedCategoryData.percentage}%</Text>
              <Text style={styles.detailsStatLabel}>of Total</Text>
            </View>
            
            <View style={styles.detailsStat}>
              <Text style={styles.detailsStatValue}>
                {timeRange === 'today' ? '3.2h' : '1.2d'}
              </Text>
              <Text style={styles.detailsStatLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Updated: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • 
          Tap categories for details
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

  totalContainer: {
    alignItems: 'center',
  },

  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  totalLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  content: {
    flexDirection: 'row',
    gap: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.md,
  },

  chartSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  legendSection: {
    flex: 1,
    maxHeight: 200,
  },

  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  svg: {
    backgroundColor: 'transparent',
  },

  mobileChart: {
    flex: 1,
    gap: statisticsTheme.spacing.sm,
  },

  mobileBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
    paddingVertical: statisticsTheme.spacing.xs,
  },

  mobileBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.xs,
    width: 100,
  },

  mobileBarLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textPrimary,
    fontWeight: '500',
  },

  mobileBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },

  mobileBar: {
    height: '100%',
    borderRadius: 4,
  },

  mobileBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    width: 30,
    textAlign: 'right',
  },

  legendItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.sm,
    marginBottom: statisticsTheme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  legendItemSelected: {
    borderColor: statisticsTheme.charts.primary,
    backgroundColor: '#F0F9FF',
  },

  legendItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  legendItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: statisticsTheme.spacing.xs,
  },

  legendIcon: {
    marginRight: statisticsTheme.spacing.xs,
  },

  legendName: {
    fontSize: 12,
    color: statisticsTheme.colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },

  legendValues: {
    alignItems: 'flex-end',
  },

  legendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  legendPercentage: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
  },

  subcategories: {
    marginTop: statisticsTheme.spacing.sm,
    paddingLeft: statisticsTheme.spacing.lg,
    gap: 2,
  },

  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  subcategoryText: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
  },

  detailsSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    marginBottom: statisticsTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: statisticsTheme.charts.primary,
  },

  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
    marginBottom: statisticsTheme.spacing.sm,
  },

  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    flex: 1,
  },

  detailsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  detailsStat: {
    alignItems: 'center',
  },

  detailsStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  detailsStatLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  footer: {
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  footerText: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
    textAlign: 'center',
  },

  loadingContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  emptyContainer: {
    height: 160,
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

export default IncidentCategoriesChart;