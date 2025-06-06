import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { SupervisorProvider } from './components/hooks/useSupervisorSession';
import { ThemeProvider } from './components/theme/ThemeContext';
import BrowserMainApp from './app/browser-main';

export default function App() {
  // For web platforms, use the browser-optimized interface
  if (Platform.OS === 'web') {
    return (
      <ThemeProvider>
        <SupervisorProvider>
          <BrowserMainApp />
        </SupervisorProvider>
      </ThemeProvider>
    );
  }

  // For mobile platforms, use the traditional expo-router
  return (
    <ThemeProvider>
      <SupervisorProvider>
        <Slot />
        <StatusBar style="auto" />
      </SupervisorProvider>
    </ThemeProvider>
  );
}