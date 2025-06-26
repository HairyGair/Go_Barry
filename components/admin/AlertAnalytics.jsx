// Go_BARRY/components/admin/AlertAnalytics.jsx
// Alert analytics component for admin panel

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://go-barry.onrender.com';

const AlertAnalytics = () => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    bySource: {},
    bySeverity: {},
    byRoute: {},
    avgDismissalTime: 0,
    peakHours: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts-enhanced`);
      if (response.ok) {
        const data = await response.json();
        analyzeAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAlerts = (alerts) => {
    const bySource = {};
    const bySeverity = { High: 0, Medium: 0, Low: 0 };
    const byRoute = {};
    
    alerts.forEach(alert => {
      // By source
      bySource[alert.source] = (bySource[alert.source] || 0) + 1;
      
      // By severity
      if (alert.severity in bySeverity) {
        bySeverity[alert.severity]++;
      }
      
      // By route
      (alert.affectsRoutes || []).forEach(route => {
        byRoute[route] = (byRoute[route] || 0) + 1;
      });
    });
    
    // Get top 10 affected routes
    const topRoutes = Object.entries(byRoute)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    setStats({
      totalAlerts: alerts.length,
      bySource,
      bySeverity,
      topRoutes,
      avgDismissalTime: '4.5 mins', // Would calculate from real data
      peakHours: ['08:00-09:00', '17:00-18:00'] // Would calculate from real data
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Alert Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <Text style={styles.statValue}>{stats.totalAlerts}</Text>
          <Text style={styles.statLabel}>Total Alerts Today</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{stats.avgDismissalTime}</Text>
          <Text style={styles.statLabel}>Avg Dismissal Time</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alerts by Severity</Text>
      <View style={styles.severityChart}>
        {Object.entries(stats.bySeverity).map(([severity, count]) => (
          <View key={severity} style={styles.severityItem}>
            <Text style={styles.severityLabel}>{severity}</Text>
            <View style={styles.severityBar}>
              <View 
                style={[
                  styles.severityFill,
                  { 
                    width: `${(count / stats.totalAlerts * 100) || 0}%`,
                    backgroundColor: severity === 'High' ? '#EF4444' : 
                                   severity === 'Medium' ? '#F59E0B' : '#10B981'
                  }
                ]}
              />
            </View>
            <Text style={styles.severityCount}>{count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Alerts by Source</Text>
      <View style={styles.sourceGrid}>
        {Object.entries(stats.bySource).map(([source, count]) => (
          <View key={source} style={styles.sourceCard}>
            <Text style={styles.sourceLabel}>{source}</Text>
            <Text style={styles.sourceCount}>{count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Top Affected Routes</Text>
      <View style={styles.routesList}>
        {(stats.topRoutes || []).map(([route, count], index) => (
          <View key={route} style={styles.routeItem}>
            <Text style={styles.routeRank}>#{index + 1}</Text>
            <Text style={styles.routeName}>Route {route}</Text>
            <Text style={styles.routeCount}>{count} alerts</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Peak Alert Hours</Text>
      <View style={styles.peakHours}>
        {stats.peakHours.map(hour => (
          <View key={hour} style={styles.peakHourItem}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.peakHourText}>{hour}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  severityChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityLabel: {
    width: 60,
    fontSize: 14,
    color: '#374151',
  },
  severityBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  severityFill: {
    height: '100%',
    borderRadius: 4,
  },
  severityCount: {
    width: 40,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  sourceCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  routesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeRank: {
    width: 30,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  routeName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  routeCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  peakHours: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  peakHourText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
});

export default AlertAnalytics;
