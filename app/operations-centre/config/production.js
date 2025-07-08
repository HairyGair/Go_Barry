// Operations Centre Production Configuration
// Created: June 30, 2025

export const OPERATIONS_CONFIG = {
  // Feature Flags
  features: {
    dutyBoards: true,
    incidentManager: true,
    roadworksManager: true,
    disruptionDatabase: true,
    realtimeSync: true,
    advancedAnalytics: false, // Coming soon
  },

  // Performance Settings
  performance: {
    maxConcurrentRequests: 5,
    cacheTimeout: 300000, // 5 minutes
    refreshInterval: 30000, // 30 seconds
    lazyLoadDelay: 100, // ms
  },

  // Security Settings
  security: {
    requireAuthentication: true,
    sessionTimeout: 600000, // 10 minutes
    allowedRoles: ['supervisor', 'admin'],
    enforceHTTPS: true,
  },

  // UI Settings
  ui: {
    animationsEnabled: true,
    compactMode: false,
    showDevTools: false,
    maxActivityItems: 50,
  },

  // Error Handling
  errorHandling: {
    showUserErrors: true,
    logToConsole: false, // Disabled in production
    reportToSentry: true,
    fallbackUI: true,
  },

  // API Configuration (uses environment variables)
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Monitoring
  monitoring: {
    trackPageViews: true,
    trackErrors: true,
    trackPerformance: true,
    anonymizeIP: true,
  },
};

// Deployment Readiness Checks
export const deploymentChecks = {
  isProductionBuild: process.env.NODE_ENV === 'production',
  hasRequiredEnvVars: () => {
    const required = [
      'EXPO_PUBLIC_API_URL',
      'EXPO_PUBLIC_CONVEX_URL',
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ];
    return required.every(key => process.env[key]);
  },
  memoryLimit: 2048, // MB
  minimumNodeVersion: '18.0.0',
};

// Export for use in components
export default OPERATIONS_CONFIG;
