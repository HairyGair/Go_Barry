// Go_BARRY/components/FallbackMap.jsx
// Simple fallback map component for when TomTom fails

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FallbackMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const alertsWithCoords = alerts.filter(alert => 
    alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Traffic Overview</Text>
        <Text style={styles.subtitle}>North East England</Text>
      </View>
      
      <View style={styles.content}>
        {currentAlert ? (
          <View style={styles.currentAlert}>
            <Text style={styles.alertTitle}>📍 Current Alert</Text>
            <Text style={styles.alertText}>{currentAlert.title}</Text>
            <Text style={styles.alertLocation}>{currentAlert.location}</Text>
            {currentAlert.coordinates && (
              <Text style={styles.coordinates}>
                📍 {currentAlert.coordinates[0].toFixed(4)}, {currentAlert.coordinates[1].toFixed(4)}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noAlert}>
            <Text style={styles.noAlertText}>No current alert selected</Text>
          </View>
        )}
        
        <View style={styles.alertsList}>
          <Text style={styles.alertsTitle}>
            Active Alerts with Locations ({alertsWithCoords.length})
          </Text>
          {alertsWithCoords.map((alert, index) => (
            <View 
              key={index} 
              style={[
                styles.alertItem,
                index === alertIndex && styles.alertItemCurrent
              ]}
            >
              <Text style={styles.alertItemTitle}>{alert.title}</Text>
              <Text style={styles.alertItemLocation}>{alert.location}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📊 {alerts.length} total alerts • {alertsWithCoords.length} mapped
        </Text>
        <Text style={styles.fallbackText}>
          Map visualization temporarily unavailable
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  currentAlert: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  noAlert: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  noAlertText: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertsList: {
    flex: 1,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alertItemCurrent: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  alertItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertItemLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default FallbackMap;