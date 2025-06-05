// Go_BARRY/app/(tabs)/_layout.jsx - Theme-Aware Navigation System
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../components/theme/ThemeContext';

export default function TabLayout() {
  const { theme, colors, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Theme-aware colors
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme.text.light,
        tabBarStyle: {
          backgroundColor: theme.navigation.background,
          borderTopColor: theme.border.light,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          // Add subtle elevation for better visual hierarchy
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: theme.shadow.opacity,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.navigation.background,
          borderBottomColor: theme.border.light,
          borderBottomWidth: 1,
          // Add subtle shadow for depth
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.shadow.opacity * 0.5,
          shadowRadius: 3,
          elevation: 4,
        },
        headerTintColor: theme.navigation.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: theme.navigation.text,
        },
        // Theme-aware status bar
        headerStatusBarHeight: isDarkMode ? 0 : undefined,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'BARRY Control',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          headerTitle: 'Traffic Alerts',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "warning" : "warning-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          headerTitle: 'Traffic Map',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "map" : "map-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'System',
          headerTitle: 'System Status',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "server" : "server-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Preferences',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null, // Hide this tab from navigation
        }}
      />
    </Tabs>
  );
}