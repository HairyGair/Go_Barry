/**
 * Horizon VIX-ITS Card Component
 * Displays the Horizon GAG VIX-ITS traffic management system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Modal, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HorizonVixCard = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set initial load time
    setLastRefresh(new Date());
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setLastRefresh(new Date());
    
    // Simulate refresh time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load Horizon VIX-ITS system');
  };

  if (Platform.OS !== 'web') {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Horizon VIX-ITS</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="web" size={48} color="#666" />
            <Text style={styles.errorText}>
              Horizon VIX-ITS is only available on web platform
            </Text>
            <Text style={styles.errorSubtext}>
              Please use the web version of Go BARRY to access this system
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="traffic-light" size={24} color="#333" />
            <Text style={styles.title}>Horizon VIX-ITS</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={handleRefresh} style={styles.refreshButton}>
              <MaterialCommunityIcons 
                name="refresh" 
                size={20} 
                color="#666" 
                style={isLoading ? styles.spinning : null}
              />
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </Pressable>
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
            <Text style={styles.statusText}>
              Last updated: {lastRefresh.toLocaleTimeString('en-GB')}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: error ? '#ef4444' : '#10b981' }]} />
            <Text style={styles.statusText}>
              {error ? 'Connection Error' : 'Connected'}
            </Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Loading Horizon VIX-ITS...</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorSubtext}>
                Check your internet connection and try refreshing
              </Text>
              <Pressable onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <iframe
              src="https://horizon.gag.vix-its.com/"
              style={styles.iframe}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Horizon VIX-ITS Traffic Management System"
              allow="fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#666" />
            <Text style={styles.footerText}>
              GAG VIX Intelligent Transportation System
            </Text>
          </View>
          <View style={styles.footerInfo}>
            <MaterialCommunityIcons name="web" size={16} color="#666" />
            <Text style={styles.footerText}>
              horizon.gag.vix-its.com
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({
      web: {
        paddingTop: 20,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0284c7',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
});

export default HorizonVixCard;