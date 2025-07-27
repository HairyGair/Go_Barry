import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';

export default function DisruptionsPage() {
  const router = useRouter();

  const handleIncidentsPress = () => {
    router.push('/disruptions/incidents');
  };
  
  const handleDisruptionCentrePress = () => {
    router.push('/disruption-centre');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      
      <View style={styles.content}>
        <Text style={styles.title}>Disruptions Management</Text>
        <Text style={styles.subtitle}>Manage traffic incidents and roadworks</Text>
        
        <View style={styles.cardGrid}>
          <Pressable
            style={[styles.card, { backgroundColor: '#8b5cf6' }]}
            onPress={handleDisruptionCentrePress}
          >
            <MaterialCommunityIcons name="shield-alert" size={48} color="white" />
            <Text style={styles.cardTitle}>Disruption Centre</Text>
            <Text style={styles.cardSubtitle}>All disruptions & roadworks</Text>
          </Pressable>
          
          <Pressable
            style={[styles.card, { backgroundColor: '#dc2626' }]}
            onPress={handleIncidentsPress}
          >
            <MaterialCommunityIcons name="alert-circle" size={48} color="white" />
            <Text style={styles.cardTitle}>Incidents</Text>
            <Text style={styles.cardSubtitle}>Traffic incidents only</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    maxWidth: 200,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});
