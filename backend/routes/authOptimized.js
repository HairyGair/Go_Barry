import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gobarryco',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gobarryco_breakdowns',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();
    console.log('✅ MySQL database connection verified');
    return true;
  } catch (err) {
    console.error('❌ MySQL database connection failed:', err.message);
    return false;
  }
}

// Test on startup
testDatabaseConnection();

/**
 * POST /api/auth/login
 * Authenticate supervisor with badge and password
 * Uses MySQL database with bcrypt-hashed passwords
 */
router.post('/login', async (req, res) => {
  const startTime = Date.now();

  try {
    const { badge, password } = req.body;

    console.log(`🔐 Login attempt: badge=${badge}`);

    // Validate input
    if (!badge || !password) {
      return res.status(400).json({
        success: false,
        error: 'Badge and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log('📡 Attempting to get database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connection obtained');

    try {
      // Query supervisor from MySQL database
      const [supervisors] = await connection.execute(
        'SELECT id, email, name, badge_number, depot, role, password_hash FROM supervisors WHERE badge_number = ? LIMIT 1',
        [badge.toUpperCase()]
      );

      if (!supervisors || supervisors.length === 0) {
        console.warn(`❌ Login attempt: Supervisor not found (badge: ${badge})`);
        connection.release();
        return res.status(401).json({
          success: false,
          error: 'Invalid badge or password',
          code: 'AUTH_FAILED'
        });
      }

      const supervisor = supervisors[0];

      // Verify password with bcrypt
      const passwordValid = await bcrypt.compare(password, supervisor.password_hash);

      if (!passwordValid) {
        console.warn(`❌ Login attempt: Invalid password (badge: ${badge})`);
        connection.release();
        return res.status(401).json({
          success: false,
          error: 'Invalid badge or password',
          code: 'AUTH_FAILED'
        });
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          id: supervisor.id,
          badge: supervisor.badge_number,
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role,
          depot: supervisor.depot,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = jwt.sign(
        {
          id: supervisor.id,
          badge: supervisor.badge_number,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log successful login
      const duration = Date.now() - startTime;
      console.log(`✅ Login successful: ${supervisor.name} (${badge}) - ${duration}ms`);

      connection.release();

      // Return tokens and supervisor info
      return res.json({
        success: true,
        token: accessToken,
        user: {
          id: supervisor.id,
          badge: supervisor.badge_number,
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role,
          depot: supervisor.depot,
        },
        message: 'Login successful'
      });

    } catch (dbError) {
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.',
      code: 'AUTH_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        console.warn('❌ Refresh token verification failed:', err.message);
        res.clearCookie('refreshToken');
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: decoded.id,
          badge: decoded.badge,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      console.log(`✅ Access token refreshed for badge: ${decoded.badge}`);

      return res.json({
        success: true,
        token: newAccessToken,
        message: 'Token refreshed successfully'
      });
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear refresh token and end session
 */
router.post('/logout', (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    console.log('✅ User logged out successfully');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * GET /api/auth/validate
 * Validate JWT access token
 */
router.get('/validate', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        success: true,
        valid: true,
        user: decoded,
        message: 'Token valid'
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        valid: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('❌ Token validation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
});

/**
 * GET /api/auth/supervisors
 * Get list of all supervisors (for debugging/admin only)
 */
router.get('/supervisors', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [supervisors] = await connection.execute(
        'SELECT id, badge_number, name, email, role, depot, is_active FROM supervisors WHERE is_active = 1 ORDER BY name'
      );

      connection.release();

      res.json({
        success: true,
        supervisors: supervisors.map(s => ({
          id: s.id,
          badge: s.badge_number,
          name: s.name,
          email: s.email,
          role: s.role,
          depot: s.depot,
        }))
      });
    } catch (dbError) {
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Error fetching supervisors:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from JWT token
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        success: true,
        user: {
          id: decoded.id,
          badge: decoded.badge,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          depot: decoded.depot,
        }
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching user info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user info',
      code: 'FETCH_ERROR'
    });
  }
});

export default router;
