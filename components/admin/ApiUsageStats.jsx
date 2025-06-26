// Go_BARRY/components/admin/ApiUsageStats.jsx
// API usage monitoring component for admin panel

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

const ApiUsageStats = () => {
  const [apiStats, setApiStats] = useState({
    tomtom: { calls: 0, limit: 2500, cost: 0 },
    here: { calls: 0, limit: 1000, cost: 0 },
    nationalHighways: { calls: 0, limit: 5000, cost: 0 },
    total: { calls: 0, errors: 0, avgResponseTime: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiStats();
    const interval = setInterval(loadApiStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadApiStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-extended`);
      if (response.ok) {
        const data = await response.json();
        
        // Parse API stats from health data
        setApiStats({
          tomtom: {
            calls: data.services?.tomtom?.requestsToday || 0,
            limit: 2500,
            cost: ((data.services?.tomtom?.requestsToday || 0) * 0.002).toFixed(2)
          },
          here: {
            calls: data.services?.here?.requestsToday || 0,
            limit: 1000,
            cost: ((data.services?.here?.requestsToday || 0) * 0.003).toFixed(2)
          },
          nationalHighways: {
            calls: data.services?.nationalHighways?.requestsToday || 0,
            limit: 5000,
            cost: 0 // Free API
          },
          total: {
            calls: data.apiStats?.last24Hours || 0,
            errors: data.apiStats?.errors || 0,
            avgResponseTime: data.apiStats?.avgResponseTime || 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading API stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage > 80) return '#EF4444';
    if (percentage > 60) return '#F59E0B';
    return '#10B981';
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
      <Text style={styles.sectionTitle}>API Usage Overview</Text>
      
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total API Calls (24h)</Text>
            <Text style={styles.overviewValue}>{apiStats.total.calls.toLocaleString()}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Failed Requests</Text>
            <Text style={[styles.overviewValue, { color: '#EF4444' }]}>
              {apiStats.total.errors}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Avg Response Time</Text>
            <Text style={styles.overviewValue}>{apiStats.total.avgResponseTime}ms</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Service Usage</Text>
      
      {/* TomTom API */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>TomTom Traffic API</Text>
            <Text style={styles.serviceDescription}>Real-time traffic data & maps</Text>
          </View>
          <Text style={styles.serviceCost}>£{apiStats.tomtom.cost}/day</Text>
        </View>
        
        <View style={styles.usageContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageFill,
                { 
                  width: `${getUsagePercentage(apiStats.tomtom.calls, apiStats.tomtom.limit)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(apiStats.tomtom.calls, apiStats.tomtom.limit))
                }
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {apiStats.tomtom.calls} / {apiStats.tomtom.limit} calls 
            ({getUsagePercentage(apiStats.tomtom.calls, apiStats.tomtom.limit).toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* HERE API */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>HERE Maps API</Text>
            <Text style={styles.serviceDescription}>Backup traffic provider</Text>
          </View>
          <Text style={styles.serviceCost}>£{apiStats.here.cost}/day</Text>
        </View>
        
        <View style={styles.usageContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageFill,
                { 
                  width: `${getUsagePercentage(apiStats.here.calls, apiStats.here.limit)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(apiStats.here.calls, apiStats.here.limit))
                }
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {apiStats.here.calls} / {apiStats.here.limit} calls 
            ({getUsagePercentage(apiStats.here.calls, apiStats.here.limit).toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* National Highways API */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>National Highways API</Text>
            <Text style={styles.serviceDescription}>UK roadworks data</Text>
          </View>
          <Text style={[styles.serviceCost, { color: '#10B981' }]}>FREE</Text>
        </View>
        
        <View style={styles.usageContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageFill,
                { 
                  width: `${getUsagePercentage(apiStats.nationalHighways.calls, apiStats.nationalHighways.limit)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(apiStats.nationalHighways.calls, apiStats.nationalHighways.limit))
                }
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {apiStats.nationalHighways.calls} / {apiStats.nationalHighways.limit} calls 
            ({getUsagePercentage(apiStats.nationalHighways.calls, apiStats.nationalHighways.limit).toFixed(1)}%)
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cost Summary</Text>
      
      <View style={styles.costCard}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Daily API Costs</Text>
          <Text style={styles.costValue}>
            £{(parseFloat(apiStats.tomtom.cost) + parseFloat(apiStats.here.cost)).toFixed(2)}
          </Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Monthly Projection</Text>
          <Text style={styles.costValue}>
            £{((parseFloat(apiStats.tomtom.cost) + parseFloat(apiStats.here.cost)) * 30).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.costRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
          <Text style={styles.costLabel}>Annual Projection</Text>
          <Text style={[styles.costValue, { fontSize: 20, fontWeight: '700' }]}>
            £{((parseFloat(apiStats.tomtom.cost) + parseFloat(apiStats.here.cost)) * 365).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          API usage is cached for 30 seconds to reduce costs. TomTom map tiles are cached for 5 minutes.
        </Text>
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
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  usageContainer: {
    gap: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
});

export default ApiUsageStats;
