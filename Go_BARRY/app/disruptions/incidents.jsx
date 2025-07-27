import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IncidentManager from '../../components/operations/IncidentManagerLegacy';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';

export default function IncidentsPage() {
  const router = useRouter();
  const { isLoggedIn, supervisorName } = useSupervisor();

  // Determine base URL based on environment
  const getBaseUrl = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:3001';
      }
    }
    return process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com';
  };

  const baseUrl = getBaseUrl();

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <MaterialCommunityIcons name="shield-lock" size={64} color="#dc2626" />
          <Text style={styles.loginTitle}>Authentication Required</Text>
          <Text style={styles.loginMessage}>Please log in to access incident management</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/')}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1a202c" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.breadcrumb}>Disruptions / Incidents</Text>
          <Text style={styles.supervisor}>{supervisorName}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <IncidentManager baseUrl={baseUrl} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1a202c',
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  breadcrumb: {
    fontSize: 14,
    color: '#6b7280',
  },
  supervisor: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginTop: 16,
    marginBottom: 8,
  },
  loginMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
