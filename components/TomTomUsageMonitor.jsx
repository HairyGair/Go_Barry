// Go_BARRY/components/TomTomUsageMonitor.jsx
// Monitor TomTom tile usage to stay within daily limits

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TomTomUsageMonitor = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('https://go-barry.onrender.com/api/tomtom/usage/stats');
        if (response.ok) {
          const data = await response.json();
          setUsage(data.daily);
        }
      } catch (error) {
        console.error('Failed to fetch TomTom usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !usage) {
    return null;
  }

  const getUsageColor = (percentUsed) => {
    const percent = parseFloat(percentUsed);
    if (percent > 80) return '#ef4444'; // Red
    if (percent > 60) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const usagePercent = parseFloat(usage.quotaUsed);
  const usageColor = getUsageColor(usagePercent);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 TomTom Daily Usage</Text>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: usageColor 
            }
          ]} 
        />
      </View>
      
      <View style={styles.stats}>
        <Text style={[styles.percentage, { color: usageColor }]}>
          {usage.quotaUsed} Used
        </Text>
        <Text style={styles.statText}>
          {usage.quotaRemaining.toLocaleString()} tiles remaining
        </Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Network Requests:</Text>
          <Text style={styles.detailValue}>{usage.networkRequests.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cache Hit Rate:</Text>
          <Text style={[styles.detailValue, { color: '#10b981' }]}>
            {usage.cacheHitRate}%
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Est. Cost:</Text>
          <Text style={styles.detailValue}>{usage.estimatedCost}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reset in:</Text>
          <Text style={styles.detailValue}>{usage.hoursUntilReset}h</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '500',
  },
});

export default TomTomUsageMonitor;
