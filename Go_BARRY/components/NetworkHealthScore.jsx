// components/NetworkHealthScore.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Circle, G, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useActiveFlows } from '../hooks/useTrafficFlow';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NetworkHealthScore = ({ compact = false }) => {
  const { activeFlows } = useActiveFlows();
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Calculate network health score (0-100)
  const calculateHealthScore = () => {
    if (activeFlows.length === 0) return 100;
    
    const avgSpeedRatio = activeFlows.reduce((sum, flow) => 
      sum + (flow.speedRatio || 0), 0) / activeFlows.length;
    
    const criticalCount = activeFlows.filter(f => f.speedRatio < 25).length;
    const congestionPenalty = criticalCount * 10;
    
    return Math.max(0, Math.min(100, avgSpeedRatio - congestionPenalty));
  };
  
  const healthScore = calculateHealthScore();
  const radius = compact ? 40 : 60;
  const strokeWidth = compact ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: healthScore,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [healthScore]);
  
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  
  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    if (score >= 20) return '#ef4444';
    return '#991b1b';
  };
  
  const getHealthStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };
  
  const getHealthIcon = (score) => {
    if (score >= 80) return 'checkmark-circle';
    if (score >= 60) return 'checkmark';
    if (score >= 40) return 'warning';
    return 'alert-circle';
  };
  
  const healthColor = getHealthColor(healthScore);
  const healthStatus = getHealthStatus(healthScore);
  const healthIcon = getHealthIcon(healthScore);
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactScore}>
          <Ionicons name={healthIcon} size={24} color={healthColor} />
          <Text style={[styles.compactScoreText, { color: healthColor }]}>
            {Math.round(healthScore)}%
          </Text>
        </View>
        <Text style={styles.compactLabel}>Network Health</Text>
      </View>
    );
  }
  
  return (
    <LinearGradient
      colors={['#ffffff', '#f9fafb']}
      style={styles.container}
    >
      <Text style={styles.title}>Network Health Score</Text>
      
      <View style={styles.gaugeContainer}>
        <Svg width={radius * 2 + 20} height={radius * 2 + 20}>
          <G rotation="-90" origin={`${radius + 10}, ${radius + 10}`}>
            {/* Background circle */}
            <Circle
              cx={radius + 10}
              cy={radius + 10}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            
            {/* Animated progress circle */}
            <AnimatedCircle
              cx={radius + 10}
              cy={radius + 10}
              r={radius}
              stroke={healthColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </G>
          
          {/* Center text */}
          <SvgText
            x={radius + 10}
            y={radius + 10}
            fontSize="32"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={healthColor}
          >
            {Math.round(healthScore)}
          </SvgText>
          
          <SvgText
            x={radius + 10}
            y={radius + 30}
            fontSize="14"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#6b7280"
          >
            {healthStatus}
          </SvgText>
        </Svg>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Ionicons name="car" size={20} color="#6b7280" />
          <Text style={styles.metricValue}>{activeFlows.length}</Text>
          <Text style={styles.metricLabel}>Monitored</Text>
        </View>
        
        <View style={styles.metric}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={[styles.metricValue, { color: '#ef4444' }]}>
            {activeFlows.filter(f => f.speedRatio < 25).length}
          </Text>
          <Text style={styles.metricLabel}>Critical</Text>
        </View>
        
        <View style={styles.metric}>
          <Ionicons name="time" size={20} color="#f59e0b" />
          <Text style={[styles.metricValue, { color: '#f59e0b' }]}>
            {activeFlows.filter(f => f.speedRatio < 50).length}
          </Text>
          <Text style={styles.metricLabel}>Congested</Text>
        </View>
      </View>
      
      {/* Trend indicator */}
      <View style={styles.trendContainer}>
        <Text style={styles.trendLabel}>5 min trend:</Text>
        <View style={styles.trendIndicator}>
          <Ionicons 
            name={healthScore > 70 ? "trending-up" : "trending-down"} 
            size={20} 
            color={healthScore > 70 ? "#10b981" : "#ef4444"} 
          />
          <Text style={[
            styles.trendText,
            { color: healthScore > 70 ? "#10b981" : "#ef4444" }
          ]}>
            {healthScore > 70 ? "Improving" : "Degrading"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  compactScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactScoreText: {
    fontSize: 20,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  gaugeContainer: {
    marginBottom: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trendLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkHealthScore;