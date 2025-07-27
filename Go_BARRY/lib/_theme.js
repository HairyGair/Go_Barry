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
    
    // Brand colors for gradient cards - Modern, friendly palette
    gradients: {
      dutyBoards: ['#6366f1', '#8b5cf6'],      // Indigo to purple - friendly professional
      onTimeRequest: ['#0ea5e9', '#06b6d4'],   // Sky blue to cyan - calm efficiency
      dailyLostMileage: ['#f59e0b', '#f97316'], // Amber to orange - warm attention
      incidents: ['#ec4899', '#f472b6'],       // Pink to lighter pink - soft urgency
      roadworks: ['#8b5cf6', '#a855f7'],       // Purple gradient - calm authority
      disruptions: ['#10b981', '#34d399'],     // Emerald gradient - positive action
      statistics: ['#3b82f6', '#6366f1'],      // Blue to indigo - trustworthy data
      liveMap: ['#06b6d4', '#0891b2'],         // Cyan gradient - fresh activity
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
