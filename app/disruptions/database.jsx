/*
 * Go Barry - Disruption Database Route
 * Displays comprehensive disruption database with audit trails
 * Accessible via: Homepage -> Disruptions -> Disruption Database
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import DisruptionDatabase from '../../components/DisruptionDatabase';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';

export default function DisruptionDatabasePage() {
  const { isLoggedIn } = useSupervisor();

  // Security check - redirect if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
      return;
    }
  }, [isLoggedIn]);

  // Don't render if not authenticated
  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <DisruptionDatabase 
        baseUrl="https://go-barry.onrender.com"
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});