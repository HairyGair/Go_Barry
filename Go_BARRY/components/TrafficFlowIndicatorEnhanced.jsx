// components/TrafficFlowIndicatorEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch, API_ENDPOINTS } from '../utils/apiConfig';

const TrafficFlowIndicatorEnhanced = ({ alertId, showDetails = false, onPress }) => {
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // Animations
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    fetchFlowData();
    const interval = setInterval(fetchFlowData, 120000); // 2 minutes
    
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => clearInterval(interval);
  }, [alertId]);

  useEffect(() => {
    // Pulse animation for critical speeds
    if (flowData && flowData.speedRatio < 25) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [flowData]);

  const fetchFlowData = async () => {
    try {
      const data = await apiFetch(API_ENDPOINTS.flowIncident(alertId));
      
      if (data.success && data.flowInfo) {
        setFlowData(data.flowInfo);
        setError(null);
      } else {
        setFlowData(null);
        setError('No flow data available');
      }
    } catch (err) {
      console.error('Error fetching flow data:', err);
      setError('Failed to load flow data');
    } finally {
      setLoading(false);
    }
  };

  const getSpeedGradient = (ratio) => {
    const speedRatio = parseFloat(ratio);
    if (speedRatio >= 80) return ['#10b981', '#059669']; // Green
    if (speedRatio >= 50) return ['#f59e0b', '#d97706']; // Amber
    if (speedRatio >= 25) return ['#ef4444', '#dc2626']; // Red
    return ['#991b1b', '#7f1d1d']; // Dark red
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return { name: 'trending-up', color: '#10b981' };
      case 'worsening': return { name: 'trending-down', color: '#ef4444' };
      case 'stable': return { name: 'swap-horizontal', color: '#6b7280' };
      default: return { name: 'remove', color: '#6b7280' };
    }
  };

  const formatSpeed = (speed) => {
    if (!speed) return '--';
    return Math.round(speed);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1) return 'Live';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ee7203" />
      </View>
    );
  }

  if (error || !flowData) {
    return null;
  }

  const gradient = getSpeedGradient(flowData.speedRatio);
  const trendIcon = getTrendIcon(flowData.trend);
  const isCritical = flowData.speedRatio < 25;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: isCritical ? pulseAnim : 1 }
          ]
        }
      ]}
    >
      <Pressable 
        onPress={() => onPress ? onPress() : setExpanded(!expanded)}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Speed Gauge */}
            <View style={styles.gaugeContainer}>
              <View style={styles.speedCircle}>
                <Text style={styles.speedNumber}>{formatSpeed(flowData.currentSpeed)}</Text>
                <Text style={styles.speedUnit}>MPH</Text>
              </View>
              <View style={styles.speedComparison}>
                <Text style={styles.normalSpeed}>Normal: {formatSpeed(flowData.freeFlowSpeed)}</Text>
              </View>
            </View>

            {/* Center Info */}
            <View style={styles.centerInfo}>
              <View style={styles.ratioContainer}>
                <Text style={styles.ratioText}>{flowData.speedRatio}%</Text>
                <Text style={styles.ratioLabel}>of normal</Text>
              </View>
              
              <View style={styles.trendContainer}>
                <Ionicons
                  name={trendIcon.name}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.trendText}>
                  {flowData.trend.charAt(0).toUpperCase() + flowData.trend.slice(1)}
                </Text>
              </View>
            </View>

            {/* Right Info */}
            <View style={styles.rightInfo}>
              <View style={styles.updateBadge}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.updateText}>{formatTime(flowData.lastChecked)}</Text>
              </View>
              
              {flowData.roadClosure && (
                <View style={styles.closureBadge}>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.closureText}>CLOSED</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Expanded Details */}
        {(expanded || showDetails) && flowData.history && flowData.history.length > 0 && (
          <View style={styles.expandedContent}>
            <Text style={styles.historyTitle}>Speed Trend (30 min)</Text>
            <View style={styles.miniChart}>
              {flowData.history.slice(-10).map((point, index) => {
                const height = (point.speed / (flowData.freeFlowSpeed || 70)) * 40;
                const color = getSpeedGradient((point.speed / (flowData.freeFlowSpeed || 70)) * 100)[0];
                return (
                  <View
                    key={index}
                    style={[
                      styles.historyBar,
                      { 
                        height,
                        backgroundColor: color,
                        opacity: 0.8 + (index * 0.02)
                      }
                    ]}
                  />
                );
              })}
            </View>
            
            {flowData.shouldAutoClear && (
              <View style={styles.autoClearInfo}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.autoClearText}>
                  Traffic normalizing - will auto-clear soon
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  gradientContainer: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  speedCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  speedUnit: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
  speedComparison: {
    marginTop: 4,
  },
  normalSpeed: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ratioContainer: {
    alignItems: 'center',
  },
  ratioText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  ratioLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 6,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  updateText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  closureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closureText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  expandedContent: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  historyBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  autoClearInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#10b98120',
    borderRadius: 8,
  },
  autoClearText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
});

export default TrafficFlowIndicatorEnhanced;