/*
 * Go Barry - Traffic Intelligence Platform
 * 8x8 VoIP System - Dedicated Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../components/hooks/useSupervisorSession';
import VoIPIntegrationEnhanced from '../components/communications/voip/VoIPIntegrationEnhanced.jsx';
import AppHeader from '../components/common/AppHeader';

export default function VoIPPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useSupervisor();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, router]);

  // Show loading or redirect while checking auth
  if (isLoading || !isLoggedIn) {
    return null;
  }

  const handleClose = () => {
    // Navigate back to Communications Hub instead of modal close
    router.back();
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <VoIPIntegrationEnhanced onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
});