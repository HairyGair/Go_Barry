// Go_BARRY/components/messaging/MessageTabs.jsx
// Tab navigation component for Message Distribution Centre

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'driver',
      name: 'Driver Messages',
      icon: 'bus',
      color: '#2563EB',
      description: 'Ticketer messaging system'
    },
    {
      id: 'customer',
      name: 'Customer Messages',
      icon: 'people',
      color: '#10B981',
      description: 'Passenger Cloud updates'
    },
    {
      id: 'email',
      name: 'Email Centre',
      icon: 'mail',
      color: '#8B5CF6',
      description: 'Outlook integration'
    }
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? tab.color : '#64748B'}
            />
            <Text style={[styles.tabText, isActive && { color: tab.color }]}>
              {tab.name}
            </Text>
            {isActive && <View style={[styles.tabIndicator, { backgroundColor: tab.color }]} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
    position: 'relative'
  },
  activeTab: {
    backgroundColor: '#F8FAFC'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3
  }
});

export default MessageTabs;
