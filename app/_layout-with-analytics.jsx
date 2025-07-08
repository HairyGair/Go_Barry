// Go_BARRY/app/_layout.jsx - With Analytics Integration
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { OnboardingProvider } from '../components/ui/OnboardingSystem';
import analytics from '../services/analytics';
import { View, Text, StyleSheet } from 'react-native';

// FORCE PRODUCTION URL - Never use environment variable that might be missing
const CONVEX_URL = 'https://standing-octopus-908.convex.cloud';

// Initialize Convex client with explicit URL
console.log('🔌 Initializing Convex client with URL:', CONVEX_URL);
const convex = new ConvexReactClient(CONVEX_URL);

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading Go BARRY...</Text>
  </View>
);

export default function RootLayout() {
  useEffect(() => {
    // Initialize analytics
    analytics.init({
      enableAutoTracking: true,
      flushInterval: 30000, // 30 seconds
    });

    // Track app start
    analytics.track('app_started', {
      version: '3.0.0',
      environment: process.env.NODE_ENV,
    });

    // Cleanup on unmount
    return () => {
      analytics.destroy();
    };
  }, []);

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <SupervisorProvider>
          <OnboardingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="browser-main-optimized" options={{ headerShown: false }} />
              <Stack.Screen name="display" options={{ headerShown: false }} />
            </Stack>
          </OnboardingProvider>
        </SupervisorProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
});