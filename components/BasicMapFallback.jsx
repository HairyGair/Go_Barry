// Go_BARRY/components/BasicMapFallback.jsx
// Ultra-simple map that definitely works

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const BasicMapFallback = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  // For web, show a static map image from OpenStreetMap
  if (Platform.OS === 'web') {
    const centerLat = 54.9783;
    const centerLng = -1.6131;
    const zoom = 11;
    
    // OpenStreetMap static tile URL
    const mapUrl = `https://tile.openstreetmap.org/${zoom}/${Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📍 Newcastle Traffic Overview</Text>
          <Text style={styles.subtitle}>{alerts.length} active alerts</Text>
        </View>
        
        <View style={styles.mapContainer}>
          <img 
            src={mapUrl}
            alt="Newcastle Map"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 16
            }}
          />
          
          {/* Overlay with current alert info */}
          {currentAlert && (
            <View style={styles.alertOverlay}>
              <Text style={styles.alertTitle}>{currentAlert.title}</Text>
              <Text style={styles.alertLocation}>{currentAlert.location}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Static map view • Alert {alertIndex + 1} of {alerts.length}
          </Text>
        </View>
      </View>
    );
  }
  
  // Non-web fallback
  return (
    <View style={styles.container}>
      <View style={styles.centerMessage}>
        <Text style={styles.messageText}>Map view available on web only</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  alertOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default BasicMapFallback;
