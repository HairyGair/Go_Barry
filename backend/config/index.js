// Centralized Configuration Management
// Single source of truth for all configuration

import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    memoryLimit: 2048,
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },
  
  database: {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      enabled: !!process.env.SUPABASE_URL
    }
  },
  
  services: {
    tomtom: {
      apiKey: process.env.TOMTOM_API_KEY,
      rateLimit: 500,
      timeout: 10000,
      enabled: !!process.env.TOMTOM_API_KEY
    },
    streetManager: {
      webhookEndpoint: '/api/streetmanager/webhook',
      retentionDays: 7,
      enabled: true
    },
    nationalHighways: {
      apiUrl: process.env.NH_API_URL || 'https://api.nationalhighways.co.uk',
      timeout: 15000,
      enabled: true
    }
  },
  
  cache: {
    redis: {
      enabled: process.env.ENABLE_REDIS === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: {
        default: 300,        // 5 minutes
        routes: 86400,       // 24 hours
        coordinates: 604800, // 7 days
        tomtom: 300,        // 5 minutes
        sessions: 600       // 10 minutes
      }
    }
  },
  
  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableCircuitBreaker: process.env.ENABLE_CIRCUIT_BREAKER !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    enableQueueing: process.env.ENABLE_QUEUEING !== 'false'
  },
  
  limits: {
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
    maxHeavyRequests: parseInt(process.env.MAX_HEAVY_REQUESTS || '3'),
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    roadworksPageSize: 50,
    alertsPageSize: 100
  },
  
  cleanup: {
    dismissedAlerts: {
      daily: 30,    // Keep 30 days
      weekly: 90,   // Keep 90 days
      monthly: 365  // Keep 1 year
    },
    tempFiles: {
      maxAge: 86400 // 24 hours
    }
  },
  
  security: {
    adminBadges: ['AG003', 'BP009'],
    sessionTimeout: 600000, // 10 minutes
    bcryptRounds: 10
  }
};

// Validate critical configuration
export function validateConfig() {
  const errors = [];
  
  if (!config.database.supabase.url && config.database.supabase.enabled) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (!config.services.tomtom.apiKey && config.services.tomtom.enabled) {
    console.warn('⚠️ TomTom API key not configured - service will be limited');
  }
  
  if (config.server.isProduction && !config.database.supabase.serviceKey) {
    errors.push('Supabase service key required for production');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Get config section
export function getConfig(path) {
  const parts = path.split('.');
  let value = config;
  
  for (const part of parts) {
    value = value[part];
    if (value === undefined) return undefined;
  }
  
  return value;
}

// Export the entire config
export default config;
