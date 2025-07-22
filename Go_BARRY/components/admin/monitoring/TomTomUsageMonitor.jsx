import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Simple ProgressBar component
const ProgressBar = ({ progress, color, height = 8 }) => {
  return (
    <View style={[styles.progressBar, { height }]}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${Math.min(100, Math.max(0, progress * 100))}%`, 
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  );
};

const TomTomUsageMonitor = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsageData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/tomtom/usage');
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ee7203" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="error-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#dc2626'; // Red - Critical
    if (percentage >= 75) return '#f59e0b'; // Amber - Warning
    if (percentage >= 50) return '#ee7203'; // Orange - Normal
    return '#10b981'; // Green - Good
  };

  const renderAPIUsage = (api, data) => {
    const percentage = (data.used / data.limit) * 100;
    const color = getUsageColor(percentage);
    const isWarning = percentage >= 75;
    const isCritical = percentage >= 90;

    return (
      <View key={api} style={[styles.apiCard, isWarning && styles.warningCard, isCritical && styles.criticalCard]}>
        <View style={styles.apiHeader}>
          <Text style={styles.apiName}>{api}</Text>
          {isCritical && <MaterialIcons name="warning" size={20} color="#dc2626" />}
          {isWarning && !isCritical && <MaterialIcons name="error-outline" size={20} color="#f59e0b" />}
        </View>
        
        <View style={styles.usageInfo}>
          <Text style={styles.usageText}>
            {data.used.toLocaleString()} / {data.limit.toLocaleString()} calls
          </Text>
          <Text style={[styles.percentageText, { color }]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>

        <ProgressBar 
          progress={percentage / 100} 
          color={color}
          height={8}
        />

        {data.resetsAt && (
          <Text style={styles.resetText}>
            Resets: {new Date(data.resetsAt).toLocaleString()}
          </Text>
        )}

        {isCritical && (
          <View style={styles.alertBox}>
            <MaterialIcons name="error" size={16} color="#dc2626" />
            <Text style={styles.alertText}>
              Critical: Only {data.limit - data.used} calls remaining!
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="map" size={32} color="#ee7203" />
        <Text style={styles.title}>TomTom API Usage Monitor</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily API Limits</Text>
        <Text style={styles.summaryText}>
          All TomTom APIs have a 2,500 calls/day limit
        </Text>
      </View>

      <View style={styles.apiList}>
        {usage && Object.entries(usage.apis).map(([api, data]) => 
          renderAPIUsage(api, data)
        )}
      </View>

      {usage?.recommendations && usage.recommendations.length > 0 && (
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          {usage.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <MaterialIcons name="lightbulb-outline" size={16} color="#f59e0b" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#1f2937',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  apiList: {
    paddingHorizontal: 16,
  },
  apiCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  warningCard: {
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  criticalCard: {
    borderColor: '#dc2626',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  apiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#6b7280',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  alertText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 4,
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#fffbeb',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 12,
    fontSize: 16,
  },
  progressBar: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default TomTomUsageMonitor;
