// Go_BARRY/app/(tabs)/disruption.jsx
// AI-Powered Disruption Management Screen with Enhanced Browser Compatibility
import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisruptionControlRoom from '../../components/DisruptionControlRoom';
import DisruptionLogger from '../../components/DisruptionLogger';
import AppHeader from '../../components/common/AppHeader';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';

export default function DisruptionScreen() {
  const [activeTab, setActiveTab] = useState('control');

  return (
    <View style={styles.container}>
      {!isWeb && <StatusBar barStyle="light-content" backgroundColor="#111827" />}
      <AppHeader />
      
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'control' && styles.tabActive]}
          onPress={() => setActiveTab('control')}
        >
          <Ionicons 
            name={activeTab === 'control' ? 'bulb' : 'bulb-outline'} 
            size={16} 
            color={activeTab === 'control' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'control' && styles.tabTextActive]}>
            AI Control
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logger' && styles.tabActive]}
          onPress={() => setActiveTab('logger')}
        >
          <Ionicons 
            name={activeTab === 'logger' ? 'document-text' : 'document-text-outline'} 
            size={16} 
            color={activeTab === 'logger' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'logger' && styles.tabTextActive]}>
            Logger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'control' ? (
          <DisruptionControlRoom 
            baseUrl={API_CONFIG.baseURL}
          />
        ) : (
          <DisruptionLogger 
            baseUrl={API_CONFIG.baseURL}
            supervisorId="AG003" // This should come from auth context
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});