// Go_BARRY/app/_layout.jsx - RESTORED with FIXED imports
import { Stack } from 'expo-router';
import { ThemeProvider } from '../components/theme/ThemeContext.jsx';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession.js';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import analytics from '../services/analytics';
import { useEffect } from 'react';

// FORCE PRODUCTION URL - Never use environment variable that might be missing
const CONVEX_URL = 'https://standing-octopus-908.convex.cloud';

// Initialize Convex client with explicit URL
console.log('🔌 Initializing Convex client with URL:', CONVEX_URL);
const convex = new ConvexReactClient(CONVEX_URL);

// Initialize analytics
if (typeof window !== 'undefined') {
  analytics.init({
    enableAutoTracking: true,
    debugMode: process.env.NODE_ENV === 'development'
  });
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <SupervisorProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="browser-main-optimized" options={{ headerShown: false }} />
            <Stack.Screen name="display" options={{ headerShown: false }} />
            <Stack.Screen name="operations" options={{ headerShown: false }} />
            <Stack.Screen name="operations-centre" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="disruptions" options={{ headerShown: false }} />
            <Stack.Screen name="voip" options={{ headerShown: false }} />
            <Stack.Screen name="communications-hub" options={{ headerShown: false }} />
          </Stack>
        </SupervisorProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}