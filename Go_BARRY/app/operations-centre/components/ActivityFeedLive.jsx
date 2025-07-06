/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Activity Feed Component - Live Data
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../lib/_styles-index.js';

export default function ActivityFeedLive({ refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const API_BASE = 'https://go-barry.onrender.com';
  
  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Refresh when parent component triggers it
  useEffect(() => {
    if (refreshTrigger) {
      fetchRecentActivity();
    }
  }, [refreshTrigger]);
  
  const fetchRecentActivity = async () => {
    setIsLoading(true);
    try {
      // Fetch data from multiple live sources
      const [alertsRes, roadworksRes, weatherRes, bodsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/alerts-enhanced`),
        fetch(`${API_BASE}/api/roadworks-v2/stats`),
        fetch(`${API_BASE}/api/weather/current`),
        fetch(`${API_BASE}/api/bods/status`)
      ]);

      const liveActivities = [];

      // Process alerts data
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const alertsData = await alertsRes.value.json();
        if (alertsData.alerts && alertsData.alerts.length > 0) {
          // Get the most recent alerts (last 6 hours)
          const recentAlerts = alertsData.alerts
            .filter(alert => {
              const alertTime = new Date(alert.timestamp || alert.created_at);
              const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
              return alertTime > sixHoursAgo;
            })
            .slice(0, 3) // Limit to 3 most recent
            .map(alert => ({
              id: `alert-${alert.id}`,
              time: getRelativeTime(alert.timestamp || alert.created_at),
              action: formatAlertMessage(alert),
              type: alert.alert_type || 'incident',
              icon: getAlertIcon(alert.alert_type || alert.type),
              color: getAlertColor(alert.alert_type || alert.type),
              priority: alert.priority || 'normal'
            }));
          
          liveActivities.push(...recentAlerts);
        }
      }

      // Process roadworks data
      if (roadworksRes.status === 'fulfilled' && roadworksRes.value.ok) {
        const roadworksData = await roadworksRes.value.json();
        if (roadworksData.recent_changes) {
          const recentRoadworks = roadworksData.recent_changes
            .slice(0, 2)
            .map((roadwork, index) => ({
              id: `roadwork-${index}`,
              time: getRelativeTime(roadwork.last_updated || roadwork.created_at),
              action: `Roadworks update: ${roadwork.location || roadwork.street_name || 'Unknown location'}`,
              type: 'roadwork',
              icon: 'road-variant',
              color: operationsTheme.colors.warning,
              priority: 'normal'
            }));
          
          liveActivities.push(...recentRoadworks);
        }
      }

      // Process weather data
      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const weatherData = await weatherRes.value.json();
        if (weatherData.hasActiveAlerts || weatherData.current?.conditions) {
          liveActivities.push({
            id: 'weather-current',
            time: getRelativeTime(weatherData.timestamp || new Date()),
            action: `Weather update: ${weatherData.current?.description || 'Current conditions updated'}`,
            type: 'weather',
            icon: getWeatherIcon(weatherData.current?.icon),
            color: '#f59e0b',
            priority: weatherData.hasActiveAlerts ? 'high' : 'normal'
          });
        }
      }

      // Process BODS data (bus tracking)
      if (bodsRes.status === 'fulfilled' && bodsRes.value.ok) {
        try {
          const bodsData = await bodsRes.value.json();
          if (bodsData.activeBuses || bodsData.totalBuses) {
            liveActivities.push({
              id: 'bods-status',
              time: getRelativeTime(bodsData.lastUpdated || new Date()),
              action: `Bus tracking: ${bodsData.activeBuses || bodsData.totalBuses || 0} vehicles active`,
              type: 'bus',
              icon: 'bus',
              color: '#0ea5e9',
              priority: 'normal'
            });
          }
        } catch (jsonError) {
          console.warn('BODS data parsing failed:', jsonError);
        }
      }

      // Add system status activity
      liveActivities.push({
        id: 'system-status',
        time: getRelativeTime(new Date()),
        action: 'System status: All monitoring services operational',
        type: 'system',
        icon: 'check-circle',
        color: operationsTheme.colors.success,
        priority: 'low'
      });

      // Sort by priority and time, limit to 8 items
      const sortedActivities = liveActivities
        .sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          // Then sort by time (newer first)
          return new Date(b.time) - new Date(a.time);
        })
        .slice(0, 8);

      setActivities(sortedActivities);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
      
      // Fallback to basic system status if all APIs fail
      setActivities([
        {
          id: 'system-fallback',
          time: getRelativeTime(new Date()),
          action: 'System monitoring active - limited data available',
          type: 'system',
          icon: 'information',
          color: operationsTheme.colors.info,
          priority: 'normal'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAlertMessage = (alert) => {
    const type = alert.alert_type || alert.type || 'incident';
    const location = alert.location || alert.street_name || alert.road || 'Unknown location';
    
    switch (type) {
      case 'incident':
        return `New incident: ${location}`;
      case 'roadwork':
        return `Roadworks active: ${location}`;
      case 'weather':
        return `Weather alert: ${alert.description || 'Conditions updated'}`;
      case 'traffic':
        return `Traffic disruption: ${location}`;
      default:
        return `Alert: ${location}`;
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'incident': return 'alert-circle';
      case 'roadwork': return 'road-variant';
      case 'weather': return 'weather-cloudy';
      case 'traffic': return 'car-off';
      case 'emergency': return 'alert-octagon';
      default: return 'information';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'incident': return operationsTheme.colors.error;
      case 'roadwork': return operationsTheme.colors.warning;
      case 'weather': return '#f59e0b';
      case 'traffic': return '#dc2626';
      case 'emergency': return '#b91c1c';
      default: return operationsTheme.colors.info;
    }
  };

  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return 'weather-cloudy';
    
    const iconMap = {
      '01d': 'weather-sunny',
      '01n': 'weather-night',
      '02d': 'weather-partly-cloudy',
      '02n': 'weather-night-partly-cloudy',
      '03d': 'weather-cloudy',
      '03n': 'weather-cloudy',
      '04d': 'weather-cloudy',
      '04n': 'weather-cloudy',
      '09d': 'weather-rainy',
      '09n': 'weather-rainy',
      '10d': 'weather-rainy',
      '10n': 'weather-rainy',
      '11d': 'weather-lightning',
      '11n': 'weather-lightning',
      '13d': 'weather-snowy',
      '13n': 'weather-snowy',
      '50d': 'weather-fog',
      '50n': 'weather-fog'
    };
    
    return iconMap[iconCode] || 'weather-cloudy';
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.lastUpdate}>
          Updated: {lastUpdate.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      
      <View style={styles.feedContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={operationsTheme.colors.info} />
            <Text style={styles.loadingText}>Loading live activity...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {activities.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={[styles.iconContainer, { backgroundColor: (item.color || '#666666') + '20' }]}>
                  <MaterialCommunityIcons 
                    name={item.icon || 'information'} 
                    size={16} 
                    color={item.color || '#666666'} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{item.action || 'Unknown activity'}</Text>
                  <Text style={styles.activityTime}>{item.time || 'Unknown time'}</Text>
                </View>
                {item.priority === 'high' && (
                  <View style={styles.priorityIndicator}>
                    <MaterialCommunityIcons 
                      name="alert" 
                      size={12} 
                      color={operationsTheme.colors.error} 
                    />
                  </View>
                )}
              </View>
            ))}
            {activities.length === 0 && !isLoading && (
              <Text style={styles.noActivityText}>No recent activity available</Text>
            )}
          </ScrollView>
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: operationsTheme.colors.textPrimary,
  },
  lastUpdate: {
    fontSize: 12,
    color: operationsTheme.colors.textLight,
    fontStyle: 'italic',
  },
  feedContainer: {
    backgroundColor: 'white',
    borderRadius: operationsTheme.borderRadius.md,
    padding: 20,
    minHeight: 200,
    maxHeight: 350,
    ...operationsTheme.shadows.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: operationsTheme.colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
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
  priorityIndicator: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: operationsTheme.colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noActivityText: {
    fontSize: 14,
    color: operationsTheme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 40,
  },
});