/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import csrf from 'csurf';

// Configure CSRF protection
// Uses cookies to store CSRF secret (secure for our architecture)
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,      // CSRF secret cookie cannot be accessed by JS
    secure: true,        // HTTPS only
    sameSite: 'strict',  // Strict same-site policy
    maxAge: 3600000,     // 1 hour
    path: '/',
    domain: '.gobarry.co.uk'  // Share across subdomains
  }
});

// Middleware to provide CSRF token to frontend
export const provideCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

// Error handler for CSRF token validation failures
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.warn(`⚠️ CSRF token validation failed for ${req.path} from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  next(err);
};

export default {
  csrfProtection,
  provideCsrfToken,
  csrfErrorHandler
};