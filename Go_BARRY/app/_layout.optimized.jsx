import { Stack } from 'expo-router';
import { SupervisorProvider } from '../components/hooks/useSupervisorSessionOptimized';

/**
 * Optimized Root Layout
 *
 * Removed Convex from the authentication flow for faster startup.
 * Authentication now uses pure JWT tokens with backend.
 *
 * Performance improvements:
 * - No Convex initialization delay on startup
 * - Direct JWT authentication without real-time sync overhead
 * - Faster app launch time
 */
export default function RootLayout() {
  return (
    <SupervisorProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyle: { backgroundColor: 'white' }
        }}
      />
    </SupervisorProvider>
  );
}
