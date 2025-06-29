/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Dark Theme Constants
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

export const darkTheme = {
  // Background colors
  background: '#0a0a0f',        // Main app background
  surface: '#14141f',           // Cards and sections
  surfaceLight: '#1e1e2e',      // Hover states, lighter surfaces
  
  // Text colors
  text: '#f8fafc',              // Primary text
  textSecondary: '#94a3b8',     // Secondary/muted text
  textMuted: '#64748b',         // Even more muted text
  
  // Border colors
  border: '#1e1e2e',            // Default borders
  borderLight: '#2a2a3e',       // Lighter borders
  
  // Status colors
  success: '#4CAF50',           // Green
  warning: '#FF9800',           // Orange  
  error: '#F44336',             // Red
  info: '#2196F3',              // Blue
  caution: '#FFC107',           // Amber
  accent: '#7C3AED',            // Purple
  
  // Accent colors (matching dashboard cards)
  accents: {
    systemOverview: '#667eea',  // Purple
    intelligence: '#f093fb',    // Pink
    roadworks: '#fa709a',       // Rose
    supervisors: '#30cfd0',     // Cyan
    audit: '#a8edea',          // Light blue
    analytics: '#ffecd2',       // Peach
    apiUsage: '#ff9a9e',       // Light red
    liveMap: '#fbc2eb',        // Light pink
  },
  
  // Special backgrounds
  errorBg: 'rgba(244, 67, 54, 0.1)',    // Error background with opacity
  successBg: 'rgba(76, 175, 80, 0.1)',  // Success background with opacity
  warningBg: 'rgba(255, 152, 0, 0.1)',  // Warning background with opacity
  infoBg: 'rgba(33, 150, 243, 0.1)',    // Info background with opacity
  
  // Chart colors
  chart: {
    primary: '#667eea',
    secondary: '#f093fb',
    tertiary: '#fa709a',
    quaternary: '#30cfd0',
    grid: '#2a2a3e',
    text: '#64748b',
  },
  
  // Component specific
  progressBar: {
    background: '#1e1e2e',
    fill: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      default: '#667eea',
    }
  },
  
  // Button colors
  button: {
    primary: '#667eea',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    text: '#ffffff',
  },
  
  // Shadow colors (with opacity)
  shadow: 'rgba(0, 0, 0, 0.5)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
};

// Helper function to get status color
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'healthy':
    case 'operational':
    case 'success':
    case 'active':
    case 'good':
    case 'low':
      return darkTheme.success;
    case 'degraded':
    case 'warning':
    case 'partial':
    case 'medium':
    case 'normal':
      return darkTheme.warning;
    case 'down':
    case 'error':
    case 'failed':
    case 'inactive':
    case 'critical':
    case 'high':
      return darkTheme.error;
    default:
      return darkTheme.textMuted;
  }
};

// Helper function to get RAM status
export const getRAMStatus = (used, total) => {
  const percentage = (used / total) * 100;
  if (percentage > 90) return { color: darkTheme.error, status: 'Critical' };
  if (percentage > 70) return { color: darkTheme.warning, status: 'Warning' };
  return { color: darkTheme.success, status: 'Healthy' };
};

// Default export for compatibility
export default darkTheme;
