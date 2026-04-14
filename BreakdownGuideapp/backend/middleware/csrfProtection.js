/**
 * CSRF Protection Middleware
 * Uses csrf-csrf (double-submit cookie pattern)
 * Replaces deprecated csurf package
 */

import { doubleCsrf } from 'csrf-csrf';

const isProduction = process.env.NODE_ENV === 'production';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'csrf-fallback-secret',
  cookieName: '_csrf',
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(isProduction && { domain: '.gobarry.co.uk' }),
    path: '/',
    maxAge: 3600000, // 1 hour
  },
  getTokenFromRequest: (req) => req.headers['csrf-token'] || req.headers['x-csrf-token'],
});

export { generateToken, doubleCsrfProtection };

export default { generateToken, doubleCsrfProtection };
