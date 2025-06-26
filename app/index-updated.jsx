// Go_BARRY/app/index.jsx - Updated with new navigation
import React from 'react';
import { Platform } from 'react-native';
import LandingPage from '../components/LandingPage';

const IndexApp = () => {
  // Use the new enhanced landing page for web
  if (Platform.OS === 'web') {
    return <LandingPage />;
  }

  // Mobile can use the same component - it's responsive
  return <LandingPage />;
};

export default IndexApp;