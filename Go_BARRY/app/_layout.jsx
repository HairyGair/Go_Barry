// Go_BARRY/app/_layout.jsx - Main App Layout with Display Route
import { Stack } from 'expo-router';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SupervisorProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="display" options={{ headerShown: false }} />
        </Stack>
      </SupervisorProvider>
    </ThemeProvider>
  );
}