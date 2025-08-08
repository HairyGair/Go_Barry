// Go_BARRY/components/DisplayScreen.jsx
// Control Room Display - Enhanced for 55" Screen with Weather and Alert Carousel
// Optimized for 24/7 viewing at 10-15 feet distance

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import TomTomTrafficMapEnhanced from './TomTomTrafficMapEnhanced';
import WeatherCarousel from './WeatherCarousel';
import AlertCarousel from './AlertCarousel';
import { useConvexSyncSimple } from '../hooks/useConvexSyncSimple';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState('dark'); // Default to dark mode
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  
  const convexData = useConvexSyncSimple();
  const activeAlerts = convexData?.activeAlerts || convexData?.allIncidents || [];
  const activeSupervisors = convexData?.activeSupervisors || [];
  const isConnected = convexData?.isConnected || false;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Auto dark mode based on time (optional)
  useEffect(() => {
    const hour = currentTime.getHours();
    // Dark mode between 6pm and 6am
    setTheme((hour >= 18 || hour < 6) ? 'dark' : 'light');
  }, [currentTime]);

  // Handle alert changes from carousel
  const handleAlertChange = useCallback((index, alert) => {
    setCurrentAlertIndex(index);
  }, []);

  // Calculate statistics
  const stats = {
    activeIncidents: activeAlerts?.filter(a => a.type === 'INCIDENT').length || 0,
    activeRoadworks: activeAlerts?.filter(a => a.type === 'ROADWORK').length || 0,
    totalAlerts: activeAlerts?.length || 0,
    supervisorsOnline: activeSupervisors?.length || 0
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, theme === 'dark' && styles.headerDark]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, theme === 'dark' && styles.textDark]}>
            GO BARRY CONTROL ROOM
          </Text>
          <View style={styles.connectionIndicator}>
            <View style={[
              styles.connectionDot,
              connectionStatus === 'connected' ? styles.connected : styles.disconnected
            ]} />
            <Text style={[styles.connectionText, theme === 'dark' && styles.textSecondaryDark]}>
              {connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerCenter}>
          <WeatherCarousel theme={theme} />
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.time, theme === 'dark' && styles.textDark]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.date, theme === 'dark' && styles.textSecondaryDark]}>
            {formatDate(currentTime)}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Side - Alerts */}
        <View style={styles.leftPanel}>
          <AlertCarousel theme={theme} onAlertChange={handleAlertChange} />
        </View>

        {/* Right Side - Map */}
        <View style={styles.rightPanel}>
          {Platform.OS === 'web' ? (
            <View style={styles.mapContainer}>
              <TomTomTrafficMapEnhanced
                alerts={activeAlerts}
                currentAlertIndex={currentAlertIndex}
                mapId="display-screen-main"
                theme={theme}
                showPreviousAlerts={true}
                maxPreviousAlerts={5}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : (
            <View style={[styles.mapPlaceholder, theme === 'dark' && styles.mapPlaceholderDark]}>
              <Text style={[styles.mapPlaceholderText, theme === 'dark' && styles.textDark]}>
                Map View Available on Web
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, theme === 'dark' && styles.statusBarDark]}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusLabel, theme === 'dark' && styles.textSecondaryDark]}>
            Active Incidents
          </Text>
          <Text style={[
            styles.statusValue, 
            theme === 'dark' && styles.textDark,
            stats.activeIncidents > 0 && styles.statusAlert
          ]}>
            {stats.activeIncidents}
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusItem}>
          <Text style={[styles.statusLabel, theme === 'dark' && styles.textSecondaryDark]}>
            Active Roadworks
          </Text>
          <Text style={[
            styles.statusValue, 
            theme === 'dark' && styles.textDark,
            stats.activeRoadworks > 0 && styles.statusWarning
          ]}>
            {stats.activeRoadworks}
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusItem}>
          <Text style={[styles.statusLabel, theme === 'dark' && styles.textSecondaryDark]}>
            Supervisors Online
          </Text>
          <Text style={[
            styles.statusValue, 
            theme === 'dark' && styles.textDark,
            { color: stats.supervisorsOnline > 0 ? '#10B981' : '#DC2626' }
          ]}>
            {stats.supervisorsOnline}
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusItem}>
          <Text style={[styles.statusLabel, theme === 'dark' && styles.textSecondaryDark]}>
            Last Update
          </Text>
          <Text style={[styles.statusValue, theme === 'dark' && styles.textDark]}>
            {formatTime(currentTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  containerDark: {
    backgroundColor: '#0a0a0a'
  },
  header: {
    height: 140,
    backgroundColor: '#ffffff',
    borderBottomWidth: 3,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    justifyContent: 'space-between'
  },
  headerDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333333'
  },
  headerLeft: {
    flex: 0.25,
    justifyContent: 'center'
  },
  headerCenter: {
    flex: 0.5,
    paddingHorizontal: 20
  },
  headerRight: {
    flex: 0.25,
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  connected: {
    backgroundColor: '#10B981'
  },
  disconnected: {
    backgroundColor: '#DC2626'
  },
  connectionText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600'
  },
  time: {
    fontSize: 56,
    fontWeight: '300',
    color: '#1a1a1a',
    fontFamily: Platform.select({ web: 'monospace', default: 'System' }),
    letterSpacing: -2
  },
  date: {
    fontSize: 20,
    color: '#666666',
    marginTop: -5
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    gap: 20
  },
  leftPanel: {
    flex: 0.6,
    minHeight: 400
  },
  rightPanel: {
    flex: 0.4,
    minHeight: 400
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#333333'
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e5e5e5'
  },
  mapPlaceholderDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333'
  },
  mapPlaceholderText: {
    fontSize: 24,
    color: '#666666'
  },
  statusBar: {
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 3,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  statusBarDark: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333333'
  },
  statusItem: {
    flex: 1,
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 4
  },
  statusValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  statusAlert: {
    color: '#DC2626'
  },
  statusWarning: {
    color: '#F59E0B'
  },
  statusDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#e5e5e5'
  },
  textDark: {
    color: '#f5f5f5'
  },
  textSecondaryDark: {
    color: '#a0a0a0'
  }
});

export default DisplayScreen;
