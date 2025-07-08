/*
 * Go Barry - Trends Analysis Component
 * Display trend analysis for routes and patterns
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const TrendsAnalysis = ({ data, type }) => {
  if (!data || data.length === 0) {
    return (
      <View style={roadworksStyles.emptyTrends}>
        <Text style={roadworksStyles.emptyTrendsText}>No trend data available</Text>
      </View>
    );
  }

  const renderRoutesTrend = () => {
    return (
      <View style={roadworksStyles.trendsContainer}>
        {data.slice(0, 10).map((route, index) => {
          const impactLevel = route.impactScore > 80 ? 'critical' : 
                             route.impactScore > 50 ? 'high' : 
                             route.impactScore > 20 ? 'medium' : 'low';
          
          const impactColor = impactLevel === 'critical' ? colors.error :
                             impactLevel === 'high' ? colors.warning :
                             impactLevel === 'medium' ? colors.primary : colors.success;

          return (
            <View key={index} style={roadworksStyles.trendItem}>
              <View style={roadworksStyles.trendRank}>
                <Text style={roadworksStyles.trendRankText}>#{index + 1}</Text>
              </View>
              
              <View style={roadworksStyles.trendContent}>
                <View style={roadworksStyles.trendHeader}>
                  <Text style={roadworksStyles.trendTitle}>Route {route.routeId}</Text>
                  <View style={[
                    roadworksStyles.impactBadge,
                    { backgroundColor: impactColor + '20' }
                  ]}>
                    <Text style={[roadworksStyles.impactBadgeText, { color: impactColor }]}>
                      {impactLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={roadworksStyles.trendStats}>
                  <View style={roadworksStyles.trendStat}>
                    <Ionicons name="construct" size={12} color={colors.textMuted} />
                    <Text style={roadworksStyles.trendStatText}>
                      {route.roadworksCount} roadworks
                    </Text>
                  </View>
                  
                  <View style={roadworksStyles.trendStat}>
                    <Ionicons name="time" size={12} color={colors.textMuted} />
                    <Text style={roadworksStyles.trendStatText}>
                      {route.avgDuration}h avg
                    </Text>
                  </View>
                  
                  <View style={roadworksStyles.trendStat}>
                    <Ionicons name="trending-up" size={12} color={colors.textMuted} />
                    <Text style={roadworksStyles.trendStatText}>
                      {route.trend > 0 ? '+' : ''}{route.trend}%
                    </Text>
                  </View>
                </View>
                
                {/* Impact visualization */}
                <View style={roadworksStyles.impactBar}>
                  <View
                    style={[
                      roadworksStyles.impactBarFill,
                      {
                        width: `${route.impactScore}%`,
                        backgroundColor: impactColor
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
        
        {data.length > 10 && (
          <View style={roadworksStyles.moreTrends}>
            <Text style={roadworksStyles.moreTrendsText}>
              +{data.length - 10} more routes affected
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPatternsTrend = () => {
    return (
      <View style={roadworksStyles.patternsContainer}>
        {data.map((pattern, index) => (
          <View key={index} style={roadworksStyles.patternCard}>
            <Ionicons 
              name={pattern.icon || 'information-circle'} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={roadworksStyles.patternTitle}>{pattern.title}</Text>
            <Text style={roadworksStyles.patternDescription}>
              {pattern.description}
            </Text>
            <View style={roadworksStyles.patternConfidence}>
              <Text style={roadworksStyles.patternConfidenceText}>
                {pattern.confidence}% confidence
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return type === 'routes' ? renderRoutesTrend() : renderPatternsTrend();
};

export default TrendsAnalysis;