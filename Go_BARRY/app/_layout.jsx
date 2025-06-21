// Go_BARRY/app/_layout.jsx - Main App Layout with Display Route
import { Stack } from 'expo-router';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL || 'https://standing-octopus-908.convex.cloud');

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <SupervisorProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="browser-main" options={{ headerShown: false }} />
            <Stack.Screen name="display" options={{ headerShown: false }} />
          </Stack>
        </SupervisorProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}