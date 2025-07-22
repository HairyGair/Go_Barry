// components/TrafficFlowIndicator.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrafficFlowIndicator = ({ alertId, showDetails = false }) => {
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlowData();
    // Refresh every 2 minutes if showing details
    const interval = showDetails ? setInterval(fetchFlowData, 120000) : null;
    return () => interval && clearInterval(interval);
  }, [alertId]);

  const fetchFlowData = async () => {
    try {
      const response = await fetch(`https://go-barry.onrender.com/api/flow/incident/${alertId}`);
      const data = await response.json();
      
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

  const getSpeedColor = (ratio) => {
    if (!ratio) return '#999999';
    const speedRatio = parseFloat(ratio);
    if (speedRatio >= 80) return '#10b981'; // Green - good flow
    if (speedRatio >= 50) return '#f59e0b'; // Amber - slow
    if (speedRatio >= 25) return '#ef4444'; // Red - congested
    return '#991b1b'; // Dark red - severe congestion
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return { name: 'trending-up', color: '#10b981' };
      case 'worsening': return { name: 'trending-down', color: '#ef4444' };
      case 'stable': return { name: 'remove', color: '#6b7280' };
      default: return { name: 'remove', color: '#6b7280' };
    }
  };

  const formatSpeed = (speed) => {
    if (!speed) return 'N/A';
    return `${Math.round(speed)} MPH`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#ee7203" />
      </View>
    );
  }

  if (error || !flowData) {
    return null; // Don't show anything if no flow data
  }

  const speedColor = getSpeedColor(flowData.speedRatio);
  const trendIcon = getTrendIcon(flowData.trend);

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {/* Speed indicator */}
        <View style={[styles.speedBadge, { backgroundColor: speedColor + '20' }]}>
          <Text style={[styles.speedText, { color: speedColor }]}>
            {flowData.speedRatio}%
          </Text>
        </View>

        {/* Trend arrow */}
        <View style={styles.trendContainer}>
          <Ionicons
            name={trendIcon.name}
            size={20}
            color={trendIcon.color}
          />
          <Text style={[styles.trendText, { color: trendIcon.color }]}>
            {flowData.trendArrow}
          </Text>
        </View>

        {/* Current speed */}
        <View style={styles.speedInfo}>
          <Text style={styles.currentSpeed}>
            {formatSpeed(flowData.currentSpeed)}
          </Text>
          <Text style={styles.speedLabel}>current</Text>
        </View>
      </View>

      {showDetails && (
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            Normal: {formatSpeed(flowData.freeFlowSpeed)}
          </Text>
          <Text style={styles.detailText}>•</Text>
          <Text style={styles.detailText}>
            Updated {formatTime(flowData.lastChecked)}
          </Text>
        </View>
      )}

      {showDetails && flowData.history && flowData.history.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Speed History (30 min)</Text>
          <View style={styles.historyChart}>
            {flowData.history.map((point, index) => {
              const height = (point.speed / (flowData.freeFlowSpeed || 70)) * 40;
              const color = getSpeedColor((point.speed / (flowData.freeFlowSpeed || 70)) * 100);
              return (
                <View
                  key={index}
                  style={[
                    styles.historyBar,
                    { height, backgroundColor: color }
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 18,
    fontWeight: '600',
  },
  speedInfo: {
    alignItems: 'flex-end',
  },
  currentSpeed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  speedLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  historyBar: {
    flex: 1,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    minHeight: 2,
  },
});

export default TrafficFlowIndicator;