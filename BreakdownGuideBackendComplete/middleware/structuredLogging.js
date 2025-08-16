/*
 * Structured Logging Middleware
 * Adds contextual prefixes to logs for easy filtering in Render
 */

const LOG_CONTEXTS = {
  // API endpoints to log contexts
  '/api/disruptions': '[DISRUPTION-CENTRE]',
  '/api/operations': '[OPERATIONS-CENTRE]',
  '/api/admin': '[ADMIN-DASHBOARD]',
  '/api/control-room': '[CONTROL-ROOM]',
  '/api/supervisor': '[SUPERVISOR-AUTH]',
  '/api/breakdown': '[BREAKDOWN-GUIDE]',
  '/api/alerts': '[ALERTS]',
  '/api/routes': '[ROUTES]',
  '/api/traffic': '[TRAFFIC-DATA]'
};

// Color codes for terminal output (optional)
const COLORS = {
  '[DISRUPTION-CENTRE]': '\x1b[36m', // Cyan
  '[OPERATIONS-CENTRE]': '\x1b[33m', // Yellow
  '[ADMIN-DASHBOARD]': '\x1b[35m',   // Magenta
  '[CONTROL-ROOM]': '\x1b[32m',      // Green
  '[BREAKDOWN-GUIDE]': '\x1b[34m',   // Blue
  reset: '\x1b[0m'
};

export function structuredLoggingMiddleware(req, res, next) {
  // Determine log context based on request path
  let context = '[GENERAL]';
  for (const [path, ctx] of Object.entries(LOG_CONTEXTS)) {
    if (req.path.startsWith(path)) {
      context = ctx;
      break;
    }
  }
  
  // Store context on request for use in other middleware
  req.logContext = context;
  
  // Override console.log for this request
  const originalLog = console.log;
  const originalError = console.error;
  
  // Create contextual loggers
  req.log = (...args) => {
    const timestamp = new Date().toISOString();
    const color = COLORS[context] || '';
    const reset = COLORS.reset;
    originalLog(`${color}${context}${reset} [${timestamp}]`, ...args);
  };
  
  req.logError = (...args) => {
    const timestamp = new Date().toISOString();
    originalError(`${context} [ERROR] [${timestamp}]`, ...args);
  };
  
  // Log the request
  req.log(`${req.method} ${req.path} from ${req.ip}`);
  
  // Track response time
  const startTime = Date.now();
  
  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    req.log(`Response ${res.statusCode} in ${duration}ms`);
    originalSend.call(this, data);
  };
  
  next();
}

// Helper function to filter logs in Render dashboard
export function getLogFilterExamples() {
  return {
    disruptions: 'grep "\\[DISRUPTION-CENTRE\\]"',
    operations: 'grep "\\[OPERATIONS-CENTRE\\]"',
    admin: 'grep "\\[ADMIN-DASHBOARD\\]"',
    controlRoom: 'grep "\\[CONTROL-ROOM\\]"',
    breakdown: 'grep "\\[BREAKDOWN-GUIDE\\]"',
    errors: 'grep "\\[ERROR\\]"',
    slowRequests: 'grep -E "in [0-9]{4,}ms"' // 1000ms+
  };
}

export default structuredLoggingMiddleware;