/*
 * Go Barry - Time Range Filter Component
 * Advanced filtering with date picker and period comparison
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsTheme } from '../../styles/statistics.styles.js';

const TimeRangeFilter = ({ 
  value = 'today',
  onChange,
  showComparison = true,
  disabled = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  const timeRangeOptions = [
    { value: 'today', label: 'Today', icon: 'calendar-today' },
    { value: 'yesterday', label: 'Yesterday', icon: 'calendar-minus' },
    { value: 'week', label: 'This Week', icon: 'calendar-week' },
    { value: 'month', label: 'This Month', icon: 'calendar-month' },
    { value: 'quarter', label: 'This Quarter', icon: 'calendar-range' },
    { value: 'year', label: 'This Year', icon: 'calendar' },
    { value: 'custom', label: 'Custom Range', icon: 'calendar-edit' }
  ];

  const quickOptions = [
    { value: 'last7days', label: 'Last 7 Days', icon: 'clock-outline' },
    { value: 'last30days', label: 'Last 30 Days', icon: 'clock-outline' },
    { value: 'last90days', label: 'Last 90 Days', icon: 'clock-outline' }
  ];

  const selectedOption = timeRangeOptions.find(option => option.value === value) || timeRangeOptions[0];

  const handleOptionSelect = (optionValue) => {
    onChange?.(optionValue);
    setIsExpanded(false);
  };

  const formatDateDisplay = (rangeValue) => {
    const now = new Date();
    
    switch (rangeValue) {
      case 'today':
        return now.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return yesterday.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'short' 
        });
      case 'week':
        const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
        return `Week starting ${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
      case 'month':
        return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
      default:
        return selectedOption.label;
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.trigger, disabled && styles.triggerDisabled]}
          onPress={() => !disabled && setIsExpanded(!isExpanded)}
          disabled={disabled}
        >
          <MaterialCommunityIcons 
            name={selectedOption.icon} 
            size={16} 
            color={disabled ? statisticsTheme.colors.textSecondary : statisticsTheme.charts.primary}
          />
          <View style={styles.triggerContent}>
            <Text style={[styles.triggerLabel, disabled && styles.triggerLabelDisabled]}>
              {selectedOption.label}
            </Text>
            <Text style={styles.triggerDate}>
              {formatDateDisplay(value)}
            </Text>
          </View>
          <MaterialCommunityIcons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={statisticsTheme.colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.dropdown}>
            {/* Main Time Ranges */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Periods</Text>
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    value === option.value && styles.optionSelected
                  ]}
                  onPress={() => handleOptionSelect(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={16} 
                    color={value === option.value ? 
                      statisticsTheme.charts.primary : 
                      statisticsTheme.colors.textSecondary
                    }
                  />
                  <Text style={[
                    styles.optionText,
                    value === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={16} 
                      color={statisticsTheme.charts.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select</Text>
              {quickOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    value === option.value && styles.optionSelected
                  ]}
                  onPress={() => handleOptionSelect(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={16} 
                    color={value === option.value ? 
                      statisticsTheme.charts.primary : 
                      statisticsTheme.colors.textSecondary
                    }
                  />
                  <Text style={[
                    styles.optionText,
                    value === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comparison Toggle */}
            {showComparison && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.comparisonToggle}
                  onPress={() => setComparisonEnabled(!comparisonEnabled)}
                >
                  <MaterialCommunityIcons 
                    name={comparisonEnabled ? "checkbox-marked" : "checkbox-blank-outline"} 
                    size={16} 
                    color={comparisonEnabled ? 
                      statisticsTheme.charts.primary : 
                      statisticsTheme.colors.textSecondary
                    }
                  />
                  <Text style={styles.comparisonText}>
                    Compare with previous period
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  } else {
    // Mobile version - simplified horizontal scroll
    return (
      <View style={styles.mobileContainer}>
        <Text style={styles.mobileTitle}>Time Period</Text>
        <View style={styles.mobileOptions}>
          {timeRangeOptions.slice(0, 5).map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.mobileOption,
                value === option.value && styles.mobileOptionSelected
              ]}
              onPress={() => handleOptionSelect(option.value)}
            >
              <MaterialCommunityIcons 
                name={option.icon} 
                size={14} 
                color={value === option.value ? 
                  '#FFFFFF' : 
                  statisticsTheme.colors.textSecondary
                }
              />
              <Text style={[
                styles.mobileOptionText,
                value === option.value && styles.mobileOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.mobileDateDisplay}>
          {formatDateDisplay(value)}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minWidth: 250,
  },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: statisticsTheme.spacing.md,
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: statisticsTheme.spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        ':hover': {
          borderColor: statisticsTheme.charts.primary,
          backgroundColor: '#F0F9FF',
        },
      },
    }),
  },

  triggerDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
        ':hover': {
          borderColor: '#E5E7EB',
          backgroundColor: statisticsTheme.colors.cardBg,
        },
      },
    }),
  },

  triggerContent: {
    flex: 1,
  },

  triggerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  triggerLabelDisabled: {
    color: statisticsTheme.colors.textSecondary,
  },

  triggerDate: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
    maxHeight: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
    }),
  },

  section: {
    padding: statisticsTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: statisticsTheme.spacing.sm,
    letterSpacing: 0.5,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: statisticsTheme.spacing.sm,
    borderRadius: statisticsTheme.borderRadius.sm,
    gap: statisticsTheme.spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        ':hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    }),
  },

  optionSelected: {
    backgroundColor: '#F0F9FF',
  },

  optionText: {
    fontSize: 14,
    color: statisticsTheme.colors.textPrimary,
    flex: 1,
  },

  optionTextSelected: {
    color: statisticsTheme.charts.primary,
    fontWeight: '500',
  },

  comparisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: statisticsTheme.spacing.sm,
    gap: statisticsTheme.spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },

  comparisonText: {
    fontSize: 13,
    color: statisticsTheme.colors.textPrimary,
  },

  // Mobile styles
  mobileContainer: {
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    padding: statisticsTheme.spacing.md,
    marginBottom: statisticsTheme.spacing.md,
  },

  mobileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  mobileOptions: {
    flexDirection: 'row',
    gap: statisticsTheme.spacing.xs,
    marginBottom: statisticsTheme.spacing.sm,
  },

  mobileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: statisticsTheme.spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.sm,
    gap: 4,
  },

  mobileOptionSelected: {
    backgroundColor: statisticsTheme.charts.primary,
  },

  mobileOptionText: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },

  mobileOptionTextSelected: {
    color: '#FFFFFF',
  },

  mobileDateDisplay: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TimeRangeFilter;
