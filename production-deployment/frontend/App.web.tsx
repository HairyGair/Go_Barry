// App.web.tsx - Browser-First Entry Point for Go Barry v3.0
// This file takes priority when running on web platforms

import React from 'react';
import { Platform } from 'react-native';
import { SupervisorProvider } from './components/hooks/useSupervisorSession';
import { ThemeProvider } from './components/theme/ThemeContext';
import BrowserMainApp from './app/browser-main';

// Ensure we're optimized for web
const App = () => {
  // Add web-specific global styles
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // Set body styles for full-screen app
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      
      // Set viewport meta tag for mobile responsiveness
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Set page title
      document.title = 'Go Barry v3.0 - Traffic Intelligence Platform';
      
      // Add favicon if it exists
      const favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = '/assets/icon.png';
        document.head.appendChild(newFavicon);
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <SupervisorProvider>
        <BrowserMainApp />
      </SupervisorProvider>
    </ThemeProvider>
  );
};

export default App;
