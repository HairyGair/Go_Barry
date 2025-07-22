/*
 * Go Barry - Mapbox Usage Monitor
 * Track and display Mapbox API usage to stay within free tier
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGeocodeStats, clearGeocodeCache } from '../services/geocodingService';

const MapboxUsageMonitor = ({ style }) => {
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // Daily usage tracking (stored in localStorage for web)
  const [dailyUsage, setDailyUsage] = useState({
    geocoding: 0,
    date: new Date().toDateString()
  });

  useEffect(() => {
    // Load daily usage from storage
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('mapbox_usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset if it's a new day
        if (parsed.date !== new Date().toDateString()) {
          const newUsage = { geocoding: 0, date: new Date().toDateString() };
          localStorage.setItem('mapbox_usage', JSON.stringify(newUsage));
          setDailyUsage(newUsage);
        } else {
          setDailyUsage(parsed);
        }
      }
    }

    // Update stats
    setStats(getGeocodeStats());
  }, []);

  // Track API calls (called by geocoding service)
  const trackApiCall = (type = 'geocoding') => {
    const newUsage = {
      ...dailyUsage,
      [type]: (dailyUsage[type] || 0) + 1
    };
    setDailyUsage(newUsage);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('mapbox_usage', JSON.stringify(newUsage));
    }
  };

  // Make this available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.trackMapboxUsage = trackApiCall;
    }
  }, [dailyUsage]);

  const handleClearCache = () => {
    clearGeocodeCache();
    setStats(getGeocodeStats());
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
      margin: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      ...style
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333'
    },
    toggleButton: {
      padding: 4
    },
    content: {
      marginTop: 12
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4
    },
    statLabel: {
      fontSize: 12,
      color: '#666'
    },
    statValue: {
      fontSize: 12,
      fontWeight: '500',
      color: '#333'
    },
    warning: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffeaa7',
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      marginTop: 8
    },
    warningText: {
      fontSize: 11,
      color: '#856404'
    },
    clearButton: {
      backgroundColor: '#007bff',
      borderRadius: 4,
      padding: 8,
      marginTop: 8,
      alignItems: 'center'
    },
    clearButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500'
    }
  });

  const usagePercent = (dailyUsage.geocoding / 100000) * 100; // 100k free tier
  const showWarning = usagePercent > 80;

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.title}>Mapbox API Usage</Text>
        <View style={styles.toggleButton}>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#666" 
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Daily Geocoding Requests:</Text>
            <Text style={styles.statValue}>
              {dailyUsage.geocoding.toLocaleString()} / 100,000
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Usage Percentage:</Text>
            <Text style={[styles.statValue, showWarning && { color: '#ff6b6b' }]}>
              {usagePercent.toFixed(2)}%
            </Text>
          </View>

          {stats && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Cache Size:</Text>
                <Text style={styles.statValue}>{stats.cacheSize} entries</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Common Locations:</Text>
                <Text style={styles.statValue}>{stats.commonLocationsCount} presets</Text>
              </View>
            </>
          )}

          {showWarning && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ High API usage detected! Consider clearing cache or waiting until tomorrow.
              </Text>
            </View>
          )}

          <Pressable style={styles.clearButton} onPress={handleClearCache}>
            <Text style={styles.clearButtonText}>Clear Cache</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default MapboxUsageMonitor;
