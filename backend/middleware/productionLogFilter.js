/**
 * Production Log Filter for Render.com
 * Reduces log noise and provides clean, actionable logging
 * 
 * Copyright (c) 2025 Anthony Gair
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class ProductionLogFilter {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.quietMode = process.env.QUIET_LOGS === 'true';
    this.enableHealthLogs = process.env.ENABLE_HEALTH_LOGS === 'true';
    this.enableMemoryLogs = process.env.ENABLE_MEMORY_LOGS === 'true';
    
    // Suppress noisy endpoints
    this.suppressedPaths = [
      '/api/health',
      '/api/memory',
      '/favicon.ico',
      '/robots.txt',
      '/.well-known/',
      '/api/optimization/status',
      '/api/optimization/health'
    ];
    
    // Critical endpoints that should always be logged
    this.criticalPaths = [
      '/api/breakdowns',
      '/api/supervisor',
      '/api/auth',
      '/api/streetmanager',
      '/api/alerts-enhanced'
    ];
    
    this.setupLogOverrides();
  }
  
  setupLogOverrides() {
    if (!this.quietMode) return;
    
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // Filter console.log output
    console.log = (...args) => {
      const message = args.join(' ');
      if (this.shouldLog('INFO', message)) {
        originalConsole.log(`[${new Date().toISOString()}]`, ...args);
      }
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.shouldLog('ERROR', message)) {
        originalConsole.error(`[${new Date().toISOString()}] ❌`, ...args);
      }
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.shouldLog('WARN', message)) {
        originalConsole.warn(`[${new Date().toISOString()}] ⚠️`, ...args);
      }
    };
  }
  
  shouldLog(level, message) {
    // Always log errors
    if (level === 'ERROR') return true;
    
    // Check log level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.logLevel]) {
      return false;
    }
    
    // Filter out noise
    if (this.isNoisyMessage(message)) {
      return false;
    }
    
    return true;
  }
  
  isNoisyMessage(message) {
    const noisyPatterns = [
      // Health check noise
      !this.enableHealthLogs && /health/i,
      !this.enableMemoryLogs && /memory.*usage/i,
      !this.enableMemoryLogs && /heap.*used/i,
      
      // TomTom API spam
      /tomtom.*traffic.*flow/i,
      /fetching.*tomtom/i,
      
      // GTFS processing spam
      /gtfs.*processing/i,
      /route.*matching.*\d+.*routes/i,
      
      // Coordinate processing noise
      /coordinate.*enhancement/i,
      /geocoding.*cache/i,
      
      // Supabase connection spam
      /supabase.*connection.*test/i,
      /database.*pool/i,
      
      // Express middleware noise
      /static.*files/i,
      /cors.*headers/i,
      
      // Optimization spam
      /optimization.*status/i,
      /memory.*optimization.*active/i,
      
      // Supervisor polling noise
      /supervisor.*sync/i,
      /polling.*supervisors/i
    ].filter(Boolean);
    
    return noisyPatterns.some(pattern => pattern.test(message));
  }
  
  // Middleware for Express
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Skip logging for suppressed paths unless critical
      const isSuppressed = this.suppressedPaths.some(path => req.path.startsWith(path));
      const isCritical = this.criticalPaths.some(path => req.path.startsWith(path));
      
      if (isSuppressed && !isCritical) {
        return next();
      }
      
      // Log only important requests
      if (this.shouldLogRequest(req)) {
        console.log(`🌐 ${req.method} ${req.path} - ${req.ip}`);
      }
      
      // Log response time for slow requests only
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000 || res.statusCode >= 400) {
          const emoji = res.statusCode >= 400 ? '❌' : duration > 5000 ? '🐌' : '✅';
          console.log(`${emoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        }
      });
      
      next();
    };
  }
  
  shouldLogRequest(req) {
    // Always log errors and important endpoints
    if (this.criticalPaths.some(path => req.path.startsWith(path))) {
      return true;
    }
    
    // Skip noise in quiet mode
    if (this.quietMode) {
      return req.method !== 'GET' || req.path.includes('breakdown') || req.path.includes('alert');
    }
    
    return true;
  }
  
  // Clean startup logging
  logStartup() {
    console.log('🚀 Go BARRY Backend Starting...');
    console.log(`📊 Log Level: ${this.logLevel}`);
    console.log(`🔇 Quiet Mode: ${this.quietMode ? 'ON' : 'OFF'}`);
    
    if (this.quietMode) {
      console.log('✅ Production log filtering active - reduced noise');
      console.log('💡 Set QUIET_LOGS=false to see all logs');
      console.log('💡 Set LOG_LEVEL=DEBUG for verbose logging');
    }
  }
  
  // Emergency override for debugging
  enableDebugMode() {
    this.logLevel = 'DEBUG';
    this.quietMode = false;
    console.log('🔧 Debug mode enabled - all logs will be shown');
  }
}

const logFilter = new ProductionLogFilter();

export default logFilter;
export { ProductionLogFilter };