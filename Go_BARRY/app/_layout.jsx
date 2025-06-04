// Go_BARRY/app/_layout.jsx - Theme Integration Applied
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';

export default function TabLayout() {
  return (
    <ThemeProvider>
      <SupervisorProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: {
              backgroundColor: '#F2F2F7',
            },
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Tabs.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        </Tabs>
      </SupervisorProvider>
    </ThemeProvider>
  );
}