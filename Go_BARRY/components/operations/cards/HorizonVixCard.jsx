/**
 * Horizon VIX-ITS Card Component
 * Displays the Horizon GAG VIX-ITS traffic management system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HorizonVixCard = ({ onClose }) => {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Set initial load time
    setLastRefresh(new Date());
  }, []);

  const handleOpenExternal = () => {
    if (Platform.OS === 'web') {
      window.open('https://horizon.gag.vix-its.com/', '_blank');
    }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    handleOpenExternal();
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
                name="open-in-new" 
                size={20} 
                color="#666"
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
            <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.statusText}>
              External System
            </Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          <View style={styles.iframeBlockedMessage}>
            <MaterialCommunityIcons name="web-off" size={64} color="#64748b" />
            <Text style={styles.blockedTitle}>External System Access</Text>
            <Text style={styles.blockedText}>
              Horizon VIX-ITS cannot be embedded due to security restrictions.
            </Text>
            <Text style={styles.blockedSubtext}>
              Click below to open the system in a new browser tab.
            </Text>
            <Pressable onPress={handleOpenExternal} style={styles.openExternalButton}>
              <MaterialCommunityIcons name="open-in-new" size={16} color="#fff" />
              <Text style={styles.openExternalButtonText}>Open Horizon VIX-ITS</Text>
            </Pressable>
          </View>
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
    backgroundColor: '#fff',
  },
  iframeBlockedMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 16,
  },
  blockedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  blockedSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  openExternalButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
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