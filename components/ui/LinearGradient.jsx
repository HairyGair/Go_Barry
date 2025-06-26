// LinearGradient Web Polyfill for React Native Web
import React from 'react';
import { View } from 'react-native';

// Simple LinearGradient component for web
// Install expo-linear-gradient for full functionality: npm install expo-linear-gradient
const LinearGradient = ({ colors, style, children, ...props }) => {
  const gradientStyle = {
    ...style,
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
  };

  return (
    <View style={gradientStyle} {...props}>
      {children}
    </View>
  );
};

// If expo-linear-gradient is installed, use that instead
try {
  const ExpoLinearGradient = require('expo-linear-gradient').LinearGradient;
  module.exports = { LinearGradient: ExpoLinearGradient };
} catch (e) {
  // Fallback to web polyfill
  module.exports = { LinearGradient };
}

export { LinearGradient };