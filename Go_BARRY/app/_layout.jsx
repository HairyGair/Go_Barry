import { Stack } from 'expo-router';
import { SupervisorProvider } from '../components/hooks/useSupervisorSessionOptimized';

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
