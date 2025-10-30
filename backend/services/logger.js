/**
 * Logger Service
 * Structured logging with Winston
 * Provides different log levels and sanitization of sensitive data
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define transports
const transports = [
  // Console output for all environments
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

/**
 * Sanitize sensitive data before logging
 * @param {Object} data Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitize(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'cookie',
    'session'
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Log with request context
 * @param {string} level Log level
 * @param {string} message Log message
 * @param {Object} meta Metadata
 * @param {Object} req Express request object
 */
function logWithContext(level, message, meta = {}, req = null) {
  const context = {
    ...meta,
    timestamp: new Date().toISOString(),
  };

  if (req) {
    context.request = {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      query: sanitize(req.query),
    };
  }

  logger[level](message, sanitize(context));
}

/**
 * Security event logger
 * @param {string} event Event type
 * @param {Object} details Event details
 * @param {Object} req Express request object
 */
function security(event, details = {}, req = null) {
  logWithContext('warn', `SECURITY: ${event}`, {
    event,
    ...details,
  }, req);
}

/**
 * Authentication event logger
 * @param {string} event Event type
 * @param {string} badge Supervisor badge
 * @param {boolean} success Success status
 * @param {Object} req Express request object
 */
function auth(event, badge, success, req = null) {
  logWithContext(success ? 'info' : 'warn', `AUTH: ${event}`, {
    event,
    badge,
    success,
  }, req);
}

/**
 * Database event logger
 * @param {string} operation Operation type
 * @param {Object} details Operation details
 */
function database(operation, details = {}) {
  logger.debug(`DATABASE: ${operation}`, sanitize(details));
}

/**
 * API request logger
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {number} duration Request duration in ms
 */
function request(req, res, duration) {
  const message = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

  logWithContext(level, message, {
    duration,
    statusCode: res.statusCode,
  }, req);
}

// Export logger with custom methods
export default {
  ...logger,
  sanitize,
  logWithContext,
  security,
  auth,
  database,
  request,
};
