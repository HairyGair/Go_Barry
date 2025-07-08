/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Activity Feed Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../lib/_styles-index.js';
import { UK_LOCALE } from '../../../lib/_constants-index.js';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  const fetchRecentActivity = async () => {
    // Mock data for now - replace with actual API call
    const mockActivities = [
      { 
        id: 1,
        time: UK_LOCALE.MINUTES_AGO(2), 
        action: `${UK_LOCALE.NEW_INCIDENT_REPORTED}: A1 Northbound at junction 65`,
        type: 'incident',
        icon: 'alert-circle',
        color: operationsTheme.colors.error
      },
      { 
        id: 2,
        time: UK_LOCALE.MINUTES_AGO(15), 
        action: `${UK_LOCALE.ROADWORK_COMPLETED}: Queen Street resurfacing`,
        type: 'roadwork',
        icon: 'check-circle',
        color: operationsTheme.colors.success
      },
      { 
        id: 3,
        time: UK_LOCALE.HOURS_AGO(1), 
        action: `${UK_LOCALE.DUTY_BOARD_UPDATED} for route 21`,
        type: 'duty',
        icon: 'clipboard-check',
        color: operationsTheme.colors.info
      },
      { 
        id: 4,
        time: UK_LOCALE.HOURS_AGO(2), 
        action: `${UK_LOCALE.WEATHER_ALERT}: Heavy rain expected 14:00-18:00`,
        type: 'weather',
        icon: 'weather-rainy',
        color: operationsTheme.colors.warning
      },
    ];
    
    setActivities(mockActivities);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{UK_LOCALE.RECENT_ACTIVITY}</Text>
      <View style={styles.feedContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {activities.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={16} 
                  color={item.color} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{item.action}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
          {activities.length === 0 && (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: operationsTheme.colors.textPrimary,
    marginBottom: 16,
  },
  feedContainer: {
    backgroundColor: 'white',
    borderRadius: operationsTheme.borderRadius.md,
    padding: 20,
    maxHeight: 300,
    ...operationsTheme.shadows.sm,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: operationsTheme.colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: operationsTheme.colors.textLight,
  },
  noActivityText: {
    fontSize: 14,
    color: operationsTheme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
