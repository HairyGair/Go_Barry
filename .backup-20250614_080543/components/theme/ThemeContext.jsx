// Go_BARRY/components/theme/ThemeContext.jsx
// Comprehensive theme system for Go BARRY app
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';

// Enhanced theme definitions
const lightTheme = {
  id: 'light',
  // Background colors
  background: {
    primary: Colors.background,
    secondary: Colors.backgrounds.section,
    card: Colors.backgrounds.card,
    elevated: '#FFFFFF',
  },
  // Text colors
  text: {
    primary: Colors.text.primary,
    secondary: Colors.text.secondary,
    light: Colors.text.light,
    inverse: '#FFFFFF',
    accent: Colors.primary,
  },
  // Surface colors
  surface: {
    primary: '#FFFFFF',
    secondary: Colors.backgrounds.section,
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },
  // Border colors
  border: {
    light: Colors.border.light,
    medium: Colors.border.medium,
    strong: Colors.border.dark,
  },
  // Status bar
  statusBar: 'dark-content',
  // Navigation
  navigation: {
    background: '#FFFFFF',
    text: Colors.text.primary,
    accent: Colors.primary,
  },
  // Shadows
  shadow: {
    color: '#000',
    elevation: {
      small: 2,
      medium: 4,
      large: 8,
    },
    opacity: 0.1,
  },
};

const darkTheme = {
  id: 'dark',
  // Background colors
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    card: '#1F2937',
    elevated: '#374151',
  },
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#D1D5DB',
    light: '#9CA3AF',
    inverse: '#111827',
    accent: '#60A5FA',
  },
  // Surface colors
  surface: {
    primary: '#1F2937',
    secondary: '#374151',
    elevated: '#4B5563',
    overlay: 'rgba(255, 255, 255, 0.1)',
  },
  // Border colors
  border: {
    light: '#374151',
    medium: '#4B5563',
    strong: '#6B7280',
  },
  // Status bar
  statusBar: 'light-content',
  // Navigation
  navigation: {
    background: '#1E293B',
    text: '#FFFFFF',
    accent: '#60A5FA',
  },
  // Shadows
  shadow: {
    color: '#000',
    elevation: {
      small: 2,
      medium: 4,
      large: 8,
    },
    opacity: 0.3,
  },
};

// Create context
const ThemeContext = createContext();

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('barry_theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      await AsyncStorage.setItem('barry_theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Set theme programmatically
  const setTheme = async (theme) => {
    const newIsDark = theme === 'dark';
    setIsDarkMode(newIsDark);
    
    try {
      await AsyncStorage.setItem('barry_theme', theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Current theme object
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Enhanced theme object with utilities
  const themeValue = {
    // Current theme data
    theme: currentTheme,
    isDarkMode,
    isLightMode: !isDarkMode,
    
    // Theme controls
    toggleTheme,
    setTheme,
    
    // Quick access to common colors
    colors: {
      ...Colors,
      // Theme-aware colors
      background: currentTheme.background.primary,
      card: currentTheme.surface.primary,
      text: currentTheme.text.primary,
      textSecondary: currentTheme.text.secondary,
      border: currentTheme.border.light,
      accent: currentTheme.text.accent,
    },
    
    // Common styles
    styles: {
      card: {
        backgroundColor: currentTheme.surface.primary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: currentTheme.border.light,
        shadowColor: currentTheme.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: currentTheme.shadow.opacity,
        shadowRadius: 4,
        elevation: currentTheme.shadow.elevation.small,
      },
      elevatedCard: {
        backgroundColor: currentTheme.surface.elevated,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: currentTheme.border.light,
        shadowColor: currentTheme.shadow.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: currentTheme.shadow.opacity * 1.5,
        shadowRadius: 8,
        elevation: currentTheme.shadow.elevation.medium,
      },
      button: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
      },
      section: {
        backgroundColor: currentTheme.surface.primary,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: currentTheme.border.light,
      },
    },
    
    // Loading state
    isLoading,
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
