/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Center
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSupervisor } from '../components/hooks/useSupervisorSession';

// Import operational components
import DutyBoards from '../components/operations/DutyBoards';
import IncidentManager from '../components/operations/IncidentManager';
import RoadworksManager from '../components/operations/RoadworksManager';
import AIDisruptionManager from '../components/operations/DisruptionDatabase';

const OperationsScreen = () => {
  const router = useRouter();
  const { isLoggedIn, supervisorName, logout } = useSupervisor();
  const [activeTab, setActiveTab] = useState('duty-boards');

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn]);

  const tabs = [
    { id: 'duty-boards', name: 'Duty Boards', icon: 'clipboard-list' },
    { id: 'incidents', name: 'Incident Manager', icon: 'exclamation-triangle' },
    { id: 'roadworks', name: 'Roadworks Manager', icon: 'road' },
    { id: 'disruptions', name: 'Disruption Database', icon: 'database' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'duty-boards':
        return <DutyBoards />;
      
      case 'incidents':
        return <IncidentManager />;
      
      case 'roadworks':
        return <RoadworksManager />;
      
      case 'disruptions':
        return <AIDisruptionManager />;
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <Icon name="tools" size={24} color="#fff" />
            <Text style={styles.title}>Operations Center</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.userInfo}>
            <Icon name="user-circle" size={16} color="#fff" />
            <Text style={styles.userName}>{supervisorName}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
          >
            <Icon name="sign-out-alt" size={16} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.id ? '#059669' : '#6b7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#E31E24',
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#B71C1C',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  userName: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 24,
  },
});

export default OperationsScreen;
