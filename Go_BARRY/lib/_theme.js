/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Theme - Admin Dashboard Style
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

export const operationsTheme = {
  // Matching Admin Dashboard style
  colors: {
    // Backgrounds
    background: '#f0f2f5',        // Light grey background
    headerBg: '#1a1a2e',          // Dark header
    cardBg: 'white',              // White cards
    
    // Brand colors for gradient cards
    gradients: {
      dutyBoards: '#667eea',      // Purple
      onTimeRequest: '#0ea5e9',   // Sky blue for SharePoint integration
      dailyLostMileage: '#dc2626', // Red for lost mileage reports
      incidents: '#fa709a',       // Pink
      roadworks: '#f093fb',       // Light purple
      disruptions: '#30cfd0',     // Cyan
      statistics: '#ffecd2',      // Light orange
      liveMap: '#ff9a9e',         // Light red
    },
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    info: '#2196F3',
    
    // Text
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
    textWhite: '#ffffff',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};
