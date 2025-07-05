/*
 * Go Barry - Statistics Card Component
 * Displays key metrics with change indicators
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors } from '../styles/roadworks.styles';

const StatCard = ({ title, value, change, icon, color = colors.primary, format = 'number' }) => {
  const formatValue = (val) => {
    if (format === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    if (format === 'currency') {
      return `£${val.toLocaleString()}`;
    }
    if (format === 'duration') {
      return `${val}d`;
    }
    return val?.toString() || '0';
  };

  const formatChange = (changeValue) => {
    if (changeValue === null || changeValue === undefined) return null;
    
    const isPositive = changeValue > 0;
    const isNegative = changeValue < 0;
    
    return {
      value: Math.abs(changeValue),
      isPositive,
      isNegative,
      color: isPositive ? colors.success : isNegative ? colors.error : colors.textMuted
    };
  };

  const changeInfo = formatChange(change);

  return (
    <View style={[roadworksStyles.statCard, { borderLeftColor: color }]}>
      <View style={roadworksStyles.statCardHeader}>
        <View style={roadworksStyles.statCardIcon}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {changeInfo && (
          <View style={[roadworksStyles.changeIndicator, { backgroundColor: changeInfo.color }]}>
            <Ionicons 
              name={changeInfo.isPositive ? 'trending-up' : changeInfo.isNegative ? 'trending-down' : 'remove'} 
              size={12} 
              color={colors.textPrimary} 
            />
            <Text style={roadworksStyles.changeText}>
              {changeInfo.value}{format === 'percentage' ? 'pp' : '%'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={roadworksStyles.statCardBody}>
        <Text style={[roadworksStyles.statValue, { color }]}>
          {formatValue(value)}
        </Text>
        <Text style={roadworksStyles.statLabel}>
          {title}
        </Text>
      </View>
    </View>
  );
};

export default StatCard;