// Go_BARRY/components/QuickSupervisorTest.jsx
// Quick test component to verify supervisor card works

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView
} from 'react-native';
import SupervisorCard from '../archive/SupervisorCard';

const QuickSupervisorTest = () => {
  // Sample data for immediate testing
  const testSupervisors = [
    {
      id: 'barry_perryman',
      name: 'Barry Perryman',
      role: 'Service Delivery Controller - Line Manager',
      duty: { name: 'Service Delivery Controller Shift' },
      isAdmin: true,
      loginTime: new Date(Date.now() - 120 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: 'alex_woodcock',
      name: 'Alex Woodcock',
      role: 'Traffic Supervisor',
      duty: { name: 'Duty 100 (6am-3:30pm)' },
      isAdmin: false,
      loginTime: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'active'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚦 Supervisor Card Test</Text>
        <Text style={styles.subtitle}>
          Testing individual supervisor tracking - Barry (Line Manager) + Alex (Regular Supervisor)
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Live Supervisor Card:</Text>
        <SupervisorCard 
          supervisors={testSupervisors}
          connectedCount={2}
          onCardPress={(expanded) => {
            console.log('Test supervisor card', expanded ? 'expanded' : 'collapsed');
          }}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>✅ What You Should See:</Text>
        <Text style={styles.infoText}>• Green status (2 supervisors online)</Text>
        <Text style={styles.infoText}>• Tap to expand details</Text>
        <Text style={styles.infoText}>• Barry with purple shield + "LINE MGR" badge</Text>
        <Text style={styles.infoText}>• Alex with blue person icon</Text>
        <Text style={styles.infoText}>• Login times ("2h ago", "45m ago")</Text>
        <Text style={styles.infoText}>• System status indicators at bottom</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  
  cardContainer: {
    margin: 16,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  
  info: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default QuickSupervisorTest;
