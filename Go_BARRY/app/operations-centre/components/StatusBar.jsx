/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Status Bar Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../styles';
import { UK_LOCALE } from '../constants';

export default function StatusBar() {
  const [statuses, setStatuses] = useState([
    { service: UK_LOCALE.BACKEND_API, status: UK_LOCALE.CHECKING, icon: 'help-circle' },
    { service: UK_LOCALE.CONVEX_SYNC, status: UK_LOCALE.CHECKING, icon: 'help-circle' },
    { service: UK_LOCALE.GTFS_DATA, status: UK_LOCALE.CHECKING, icon: 'help-circle' },
    { service: UK_LOCALE.WEATHER_API, status: UK_LOCALE.CHECKING, icon: 'help-circle' },
  ]);
  
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const checkSystemStatus = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/health-extended');
      const data = await response.json();
      
      setStatuses([
        { 
          service: UK_LOCALE.BACKEND_API, 
          status: data.healthy ? 'operational' : 'error',
          icon: data.healthy ? 'check-circle' : 'alert-circle'
        },
        { 
          service: UK_LOCALE.CONVEX_SYNC, 
          status: data.services?.convex?.status === 'connected' ? 'operational' : 'degraded',
          icon: data.services?.convex?.status === 'connected' ? 'check-circle' : 'alert-circle'
        },
        { 
          service: UK_LOCALE.GTFS_DATA, 
          status: data.gtfs?.routesLoaded > 0 ? 'operational' : 'error',
          icon: data.gtfs?.routesLoaded > 0 ? 'check-circle' : 'alert-circle'
        },
        { 
          service: UK_LOCALE.WEATHER_API, 
          status: data.services?.weather?.healthy ? 'operational' : 'degraded',
          icon: data.services?.weather?.healthy ? 'check-circle' : 'alert-circle'
        },
      ]);
    } catch (error) {
      console.error('Status check failed:', error);
      // Set all to error if check fails
      setStatuses(prev => prev.map(s => ({ ...s, status: 'error', icon: 'alert-circle' })));
    }
  };
  
  return (
    <View style={styles.statusBar}>
      {statuses.map((item, index) => (
        <View key={index} style={styles.statusItem}>
          <MaterialCommunityIcons 
            name={item.icon} 
            size={16} 
            color={
              item.status === 'operational' ? operationsTheme.colors.success : 
              item.status === 'degraded' ? operationsTheme.colors.warning :
              item.status === 'error' ? operationsTheme.colors.error :
              operationsTheme.colors.textLight
            } 
          />
          <Text style={styles.statusText}>{item.service}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: operationsTheme.borderRadius.md,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    ...operationsTheme.shadows.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statusText: {
    fontSize: 12,
    color: operationsTheme.colors.textSecondary,
    marginLeft: 6,
  },
});
