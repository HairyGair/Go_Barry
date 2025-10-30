import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/authMiddleware.js';

// JWT secret for token generation
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

// Supervisor database with credentials
const SUPERVISOR_CREDENTIALS = {
  'AG001': { name: 'Anthony Gair', password: 'demo123', role: 'admin', depot: 'SDC' },
  'BP001': { name: 'Barry Perryman', password: 'demo123', role: 'admin', depot: 'SDC' },
  'AW001': { name: 'Alex Woodcock', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'AC001': { name: 'Andrew Cowley', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'CF001': { name: 'Claire Fiddler', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'DH001': { name: 'David Hall', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'JD001': { name: 'James Daglish', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'JP001': { name: 'John Paterson', password: 'demo123', role: 'supervisor', depot: 'SDC' },
  'SG001': { name: 'Simon Glass', password: 'demo123', role: 'supervisor', depot: 'SDC' },
};

const router = express.Router();

// GET /api/auth/supervisors - Get all supervisors
router.get('/supervisors', (req, res) => {
  try {
    const supervisors = Object.entries(SUPERVISOR_CREDENTIALS).map(([badge, data]) => ({
      id: badge,
      badge: badge,
      username: data.name,
      full_name: data.name,
      name: data.name,
      role: data.role,
      depot: data.depot,
      is_active: true
    }));

    res.json(supervisors);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// GET /api/auth/supervisor/:badge - Get supervisor by badge
router.get('/supervisor/:badge', (req, res) => {
  try {
    const supervisor = SUPERVISOR_CREDENTIALS[req.params.badge.toUpperCase()];

    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json({
      badge: req.params.badge.toUpperCase(),
      name: supervisor.name,
      role: supervisor.role,
      depot: supervisor.depot,
      is_active: true
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor' });
  }
});

// POST /api/auth/login - Local JWT authentication
router.post('/login', (req, res) => {
  try {
    const { badge, password } = req.body;

    // Validate required fields
    if (!badge || !password) {
      return res.status(400).json({
        error: 'Badge and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const badgeUpper = badge.toUpperCase();
    const supervisor = SUPERVISOR_CREDENTIALS[badgeUpper];

    // Check if supervisor exists
    if (!supervisor) {
      console.warn(`❌ Failed login attempt for badge: ${badgeUpper}`);
      return res.status(401).json({
        error: 'Invalid badge or password',
        code: 'AUTH_FAILED'
      });
    }

    // Verify password
    if (supervisor.password !== password) {
      console.warn(`❌ Failed login attempt for badge: ${badgeUpper} (wrong password)`);
      return res.status(401).json({
        error: 'Invalid badge or password',
        code: 'AUTH_FAILED'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        badge: badgeUpper,
        name: supervisor.name,
        role: supervisor.role,
        depot: supervisor.depot
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Successful authentication
    const sessionData = {
      badge: badgeUpper,
      name: supervisor.name,
      role: supervisor.role,
      depot: supervisor.depot,
      login_time: new Date().toISOString()
    };

    console.log(`✅ Successful login: ${supervisor.name} (${badgeUpper})`);

    res.json({
      success: true,
      token: token,
      user: sessionData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication failed. Please try again.',
      code: 'AUTH_ERROR'
    });
  }
});


// POST /api/auth/logout - Logout endpoint
router.post('/logout', (req, res) => {
  try {
    console.log('👋 User logged out successfully');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// GET /api/auth/validate - Validate JWT token
router.get('/validate', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        valid: true,
        user: decoded,
        message: 'Token valid'
      });
    } catch (err) {
      res.status(401).json({
        valid: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
});


export default router;