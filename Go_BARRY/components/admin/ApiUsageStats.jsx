// Go_BARRY/components/admin/ApiUsageStats.jsx
// API usage monitoring component for admin panel

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGeocodeStats, clearGeocodeCache } from '../operations/incidents-v2/services/geocodingService';

const API_BASE = 'https://go-barry.onrender.com';

const ApiUsageStats = () => {
  const [apiStats, setApiStats] = useState({
    tomtom: { calls: 0, limit: 2500, cost: 0 },
    nationalHighways: { calls: 0, limit: 5000, cost: 0 },
    total: { calls: 0, errors: 0, avgResponseTime: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [mapboxUsage, setMapboxUsage] = useState({
    daily: 0,
    limit: 100000,
    cacheStats: null
  });

  useEffect(() => {
    loadApiStats();
    loadMapboxStats();
    const interval = setInterval(() => {
      loadApiStats();
      loadMapboxStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMapboxStats = () => {
    // Load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('mapbox_usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset if it's a new day
        if (parsed.date !== new Date().toDateString()) {
          const newUsage = { geocoding: 0, date: new Date().toDateString() };
          localStorage.setItem('mapbox_usage', JSON.stringify(newUsage));
          setMapboxUsage(prev => ({ ...prev, daily: 0 }));
        } else {
          setMapboxUsage(prev => ({ ...prev, daily: parsed.geocoding || 0 }));
        }
      }
    }
    
    // Get cache stats
    const stats = getGeocodeStats();
    setMapboxUsage(prev => ({ ...prev, cacheStats: stats }));
  };

  const handleClearMapboxCache = () => {
    clearGeocodeCache();
    loadMapboxStats();
  };

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

      {/* Mapbox Geocoding API */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Mapbox Geocoding API</Text>
            <Text style={styles.serviceDescription}>Location search & geocoding</Text>
          </View>
          <Text style={[styles.serviceCost, { color: '#10B981' }]}>FREE TIER</Text>
        </View>
        
        <View style={styles.usageContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageFill,
                { 
                  width: `${getUsagePercentage(mapboxUsage.daily, mapboxUsage.limit)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(mapboxUsage.daily, mapboxUsage.limit))
                }
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {mapboxUsage.daily.toLocaleString()} / {mapboxUsage.limit.toLocaleString()} requests today
            ({getUsagePercentage(mapboxUsage.daily, mapboxUsage.limit).toFixed(3)}%)
          </Text>
        </View>
        
        {mapboxUsage.cacheStats && (
          <View style={styles.cacheInfo}>
            <View style={styles.cacheRow}>
              <Text style={styles.cacheLabel}>Cache Size:</Text>
              <Text style={styles.cacheValue}>{mapboxUsage.cacheStats.cacheSize} entries</Text>
            </View>
            <View style={styles.cacheRow}>
              <Text style={styles.cacheLabel}>Common Locations:</Text>
              <Text style={styles.cacheValue}>{mapboxUsage.cacheStats.commonLocationsCount} presets</Text>
            </View>
            <Pressable style={styles.clearCacheButton} onPress={handleClearMapboxCache}>
              <Ionicons name="trash-outline" size={16} color="#3B82F6" />
              <Text style={styles.clearCacheText}>Clear Cache</Text>
            </Pressable>
          </View>
        )}
        
        {getUsagePercentage(mapboxUsage.daily, mapboxUsage.limit) > 80 && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              High usage detected! Consider waiting until tomorrow or using cached results.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Cost Summary</Text>
      
      <View style={styles.costCard}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Daily API Costs</Text>
          <Text style={styles.costValue}>
            £{parseFloat(apiStats.tomtom.cost).toFixed(2)}
          </Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Monthly Projection</Text>
          <Text style={styles.costValue}>
            £{(parseFloat(apiStats.tomtom.cost) * 30).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.costRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
          <Text style={styles.costLabel}>Annual Projection</Text>
          <Text style={[styles.costValue, { fontSize: 20, fontWeight: '700' }]}>
            £{(parseFloat(apiStats.tomtom.cost) * 365).toFixed(2)}
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
  cacheInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cacheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cacheLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cacheValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearCacheText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});

export default ApiUsageStats;
