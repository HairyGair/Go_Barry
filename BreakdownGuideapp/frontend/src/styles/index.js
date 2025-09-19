// Central export for all theme-related modules
export { theme, getStatusColor, getStatusBackground } from './theme';
export { 
  ThemeProvider, 
  ThemeContext, 
  useTheme, 
  useThemeStyles,
  generateThemeStyles 
} from './ThemeProvider';

// Re-export commonly used theme values for convenience
export { theme as default } from './theme';
