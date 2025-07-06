// Go_BARRY/test-sharepoint-components.jsx
// Test page for SharePoint native components

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OnTimeRequestNative from './components/operations/cards/OnTimeRequestNative.jsx';
import DailyLostMileageNative from './components/operations/cards/DailyLostMileageNative.jsx';

const TestSharePointComponents = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  const components = [
    {
      id: 'on-time-request',
      title: 'On Time Request Native',
      description: 'Test native SharePoint Excel integration for On Time Requests',
      component: OnTimeRequestNative,
      color: '#0ea5e9',
      icon: 'clock-check'
    },
    {
      id: 'daily-lost-mileage', 
      title: 'Daily Lost Mileage Native',
      description: 'Test native SharePoint Excel integration for Lost Mileage Reports',
      component: DailyLostMileageNative,
      color: '#dc2626',
      icon: 'chart-line-variant'
    }
  ];

  if (selectedComponent) {
    const component = components.find(c => c.id === selectedComponent);
    const Component = component.component;
    
    return (
      <View style={styles.container}>
        <Component onClose={() => setSelectedComponent(null)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SharePoint Component Test</Text>
        <Text style={styles.subtitle}>Test native SharePoint Excel integration components</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {components.map((component) => (
          <Pressable
            key={component.id}
            style={[styles.componentCard, { borderLeftColor: component.color }]}
            onPress={() => setSelectedComponent(component.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: component.color }]}>
              <MaterialCommunityIcons name={component.icon} size={32} color="#ffffff" />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{component.title}</Text>
              <Text style={styles.cardDescription}>{component.description}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={styles.cardStatus}>✅ Component Ready</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
              </View>
            </View>
          </Pressable>
        ))}
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Testing Requirements</Text>
            <Text style={styles.infoText}>
              • Supervisor must be logged in{'\n'}
              • Azure AD permissions must be configured{'\n'}
              • SharePoint documents must be accessible{'\n'}
              • Backend API endpoints must be running
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingVertical: 24,
    paddingHorizontal: 20,
    paddingTop: 60, // Account for status bar
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  componentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default TestSharePointComponents;