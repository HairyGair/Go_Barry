import React from 'react';
import { theme } from './theme';

/**
 * Theme utilities for consistent styling across the application
 */

// CSS-in-JS style generator using theme constants
export const generateThemeStyles = () => ({
  // Layout styles
  container: {
    backgroundColor: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
    minHeight: '100vh',
  },
  
  card: {
    backgroundColor: theme.colors.bgSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    transition: theme.transitions.normal,
  },
  
  cardHover: {
    backgroundColor: theme.colors.bgHover,
    borderColor: theme.colors.borderHover,
    boxShadow: theme.shadows.md,
  },
  
  // Button styles
  button: {
    base: {
      fontFamily: theme.fonts.primary,
      fontSize: theme.fontSizes.sm,
      fontWeight: '500',
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      borderRadius: theme.radius.sm,
      border: 'none',
      cursor: 'pointer',
      transition: theme.transitions.fast,
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      color: 'white',
    },
    secondary: {
      backgroundColor: theme.colors.bgTertiary,
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.border}`,
    },
    danger: {
      backgroundColor: theme.colors.danger,
      color: 'white',
    },
  },
  
  // Badge styles
  badge: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.radius.full,
      fontSize: theme.fontSizes.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    variants: {
      danger: { backgroundColor: theme.colors.danger, color: 'white' },
      warning: { backgroundColor: theme.colors.warning, color: '#000' },
      success: { backgroundColor: theme.colors.success, color: 'white' },
      info: { backgroundColor: theme.colors.info, color: 'white' },
      stop: { backgroundColor: theme.colors.stop, color: 'white' },
      amber: { backgroundColor: theme.colors.amber, color: 'white' },
      continue: { backgroundColor: theme.colors.continue, color: 'white' },
    },
  },
  
  // Form styles
  input: {
    backgroundColor: theme.colors.bgTertiary,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textPrimary,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    fontFamily: theme.fonts.primary,
    fontSize: theme.fontSizes.md,
    transition: theme.transitions.fast,
    width: '100%',
  },
  
  // Status indicator styles
  statusIndicator: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: theme.spacing.sm,
  },
  
  // Timeline styles
  timeline: {
    container: {
      position: 'relative',
      padding: `${theme.spacing.md} 0`,
    },
    line: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: theme.colors.border,
      transform: 'translateY(-50%)',
      zIndex: 0,
    },
    item: {
      position: 'relative',
      flex: 1,
      textAlign: 'center',
      zIndex: 1,
    },
    dot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: theme.colors.bgSecondary,
      border: `2px solid ${theme.colors.border}`,
      margin: '0 auto',
      transition: theme.transitions.fast,
    },
    dotActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    dotComplete: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
  },
});

// Style helper hooks
export const useThemeStyles = () => {
  const styles = generateThemeStyles();
  
  const getButtonStyle = (variant = 'primary', isHovered = false) => ({
    ...styles.button.base,
    ...styles.button[variant],
    ...(isHovered && {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.sm,
      backgroundColor: variant === 'primary' 
        ? theme.colors.primaryDark 
        : theme.colors.bgHover,
    }),
  });
  
  const getBadgeStyle = (variant = 'info') => ({
    ...styles.badge.base,
    ...styles.badge.variants[variant],
  });
  
  const getCardStyle = (isHovered = false) => ({
    ...styles.card,
    ...(isHovered && styles.cardHover),
  });
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'stop': return theme.colors.stop;
      case 'amber': return theme.colors.amber;
      case 'continue': return theme.colors.continue;
      case 'critical': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };
  
  return {
    styles,
    getButtonStyle,
    getBadgeStyle,
    getCardStyle,
    getStatusColor,
    theme,
  };
};

// Theme context for advanced use cases
export const ThemeContext = React.createContext(theme);

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
