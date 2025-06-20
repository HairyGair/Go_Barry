// Demo component showing all enhanced UI elements for Go BARRY Display Screen
// This file demonstrates the usage of custom UI components

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  GoBarryLogo,
  StatusButton,
  PriorityIndicator,
  RefreshButton,
  ConnectionStatus,
  LoadingSpinner
} from './DisplayUIElements';

const UIElementsDemo = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const toggleConnection = () => {
    setConnected(!connected);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Go BARRY Enhanced UI Elements</Text>
      
      {/* Logo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Logo</Text>
        <View style={styles.logoRow}>
          <GoBarryLogo size={40} animated={false} />
          <GoBarryLogo size={60} animated={true} />
          <GoBarryLogo size={80} animated={false} />
        </View>
      </View>

      {/* Status Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Buttons</Text>
        <View style={styles.buttonRow}>
          <StatusButton 
            status="connected" 
            label="ONLINE" 
            size="small"
            pulsing={true}
          />
          <StatusButton 
            status="updating" 
            label="UPDATING" 
            size="medium"
          />
          <StatusButton 
            status="disconnected" 
            label="OFFLINE" 
            size="large"
          />
        </View>
      </View>

      {/* Priority Indicators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Indicators</Text>
        <View style={styles.priorityRow}>
          <PriorityIndicator level="CRITICAL" count={3} animated={true} size="small" />
          <PriorityIndicator level="URGENT" count={7} animated={true} size="medium" />
          <PriorityIndicator level="MONITOR" count={12} animated={true} size="large" />
        </View>
      </View>

      {/* Refresh Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refresh Buttons</Text>
        <View style={styles.buttonRow}>
          <RefreshButton 
            onPress={handleRefresh}
            loading={loading}
            size="small"
            variant="primary"
          />
          <RefreshButton 
            onPress={handleRefresh}
            loading={loading}
            size="medium"
            variant="secondary"
          />
          <RefreshButton 
            onPress={handleRefresh}
            loading={loading}
            size="large"
            variant="success"
          />
        </View>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <View style={styles.connectionRow}>
          <ConnectionStatus 
            connected={connected}
            label="WebSocket"
            showPulse={true}
            onPress={toggleConnection}
          />
          <ConnectionStatus 
            connected={true}
            label="API Server"
            showPulse={false}
          />
          <ConnectionStatus 
            connected={false}
            label="Database"
            showPulse={false}
          />
        </View>
      </View>

      {/* Loading Spinner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loading Spinners</Text>
        <View style={styles.spinnerRow}>
          <LoadingSpinner size="small" message="Loading..." />
          <LoadingSpinner size="medium" message="Processing data..." />
          <LoadingSpinner size="large" message="Analyzing traffic..." />
        </View>
      </View>

      {/* Integration Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integration Example</Text>
        <View style={styles.integrationExample}>
          <View style={styles.mockHeader}>
            <GoBarryLogo size={50} animated={true} />
            <Text style={styles.mockTitle}>GO NORTH EAST CONTROL</Text>
            <StatusButton 
              status="connected"
              label="LIVE"
              size="medium"
              pulsing={true}
            />
          </View>
          
          <View style={styles.mockPriorities}>
            <PriorityIndicator level="CRITICAL" count={2} animated={true} />
            <PriorityIndicator level="URGENT" count={5} animated={true} />
            <PriorityIndicator level="MONITOR" count={8} animated={true} />
            <RefreshButton 
              onPress={handleRefresh}
              loading={loading}
              size="large"
              variant="primary"
            />
          </View>
          
          <View style={styles.mockFooter}>
            <ConnectionStatus connected={true} label="Supervisor Sync" />
            <ConnectionStatus connected={true} label="Traffic APIs" />
            <ConnectionStatus connected={false} label="Weather Data" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 1,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 15,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 15,
  },
  connectionRow: {
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
  },
  spinnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 20,
  },
  integrationExample: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 15,
    gap: 15,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  mockPriorities: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 15,
  },
});

export default UIElementsDemo;
