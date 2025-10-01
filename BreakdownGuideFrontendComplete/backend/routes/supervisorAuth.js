/*
 * Supervisor Authentication Routes
 * Handles supervisor login and session management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

// Mock supervisor database
const supervisors = {
  'AW001': {
    badge: 'AW001',
    name: 'Alan Wilson',
    hashedPassword: '$2b$10$YourHashedPasswordHere', // In production, use real hashed passwords
    role: 'supervisor'
  },
  'AC002': {
    badge: 'AC002',
    name: 'Andrew Coates',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'AG003': {
    badge: 'AG003',
    name: 'Anthony Gair',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'admin'
  },
  'CF004': {
    badge: 'CF004',
    name: 'Chris Forster',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'DH005': {
    badge: 'DH005',
    name: 'David Hunter',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'JD006': {
    badge: 'JD006',
    name: 'John Dobson',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'JP007': {
    badge: 'JP007',
    name: 'John Patterson',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'SG008': {
    badge: 'SG008',
    name: 'Steven Graham',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'supervisor'
  },
  'BP009': {
    badge: 'BP009',
    name: 'Brian Pears',
    hashedPassword: '$2b$10$YourHashedPasswordHere',
    role: 'admin'
  }
};

// Active sessions (in production, use Redis or database)
const activeSessions = new Map();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Supervisor login
router.post('/login', async (req, res) => {
  try {
    const { badge, password } = req.body;
    
    // Validate input
    if (!badge || !password) {
      return res.status(400).json({
        success: false,
        error: 'Badge and password required'
      });
    }
    
    // Check if supervisor exists
    const supervisor = supervisors[badge.toUpperCase()];
    if (!supervisor) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // For development, accept any password
    // In production, uncomment the bcrypt check:
    // const validPassword = await bcrypt.compare(password, supervisor.hashedPassword);
    // if (!validPassword) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Invalid credentials'
    //   });
    // }
    
    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = jwt.sign(
      {
        badge: supervisor.badge,
        name: supervisor.name,
        role: supervisor.role,
        sessionId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Store session
    const session = {
      supervisorId: supervisor.badge,
      supervisorName: supervisor.name,
      role: supervisor.role,
      sessionId,
      token,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    activeSessions.set(sessionId, session);
    
    res.json({
      success: true,
      message: 'Login successful',
      session: {
        supervisorId: supervisor.badge,
        supervisorName: supervisor.name,
        role: supervisor.role,
        sessionId,
        token
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Verify session
router.post('/verify', async (req, res) => {
  try {
    const { token, sessionId } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // Verify JWT
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      // Check if session exists
      const session = activeSessions.get(decoded.sessionId);
      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      activeSessions.set(decoded.sessionId, session);
      
      res.json({
        success: true,
        valid: true,
        supervisor: {
          badge: decoded.badge,
          name: decoded.name,
          role: decoded.role
        }
      });
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Get supervisor state
router.get('/state', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      const session = activeSessions.get(decoded.sessionId);
      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      res.json({
        success: true,
        state: {
          supervisorId: session.supervisorId,
          supervisorName: session.supervisorName,
          role: session.role,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          isAdmin: session.role === 'admin'
        }
      });
    });
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get state'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId, token } = req.body;
    
    if (token) {
      // Verify and extract session ID from token
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err && decoded.sessionId) {
          activeSessions.delete(decoded.sessionId);
        }
      });
    } else if (sessionId) {
      activeSessions.delete(sessionId);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Get all supervisors (admin only)
router.get('/all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      // Check if admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }
      
      // Return supervisor list (without passwords)
      const supervisorList = Object.values(supervisors).map(s => ({
        badge: s.badge,
        name: s.name,
        role: s.role
      }));
      
      res.json({
        success: true,
        supervisors: supervisorList
      });
    });
  } catch (error) {
    console.error('Error getting supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supervisors'
    });
  }
});

// Get active sessions (admin only)
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      
      // Check if admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }
      
      // Return active sessions
      const sessions = Array.from(activeSessions.values()).map(s => ({
        sessionId: s.sessionId,
        supervisorId: s.supervisorId,
        supervisorName: s.supervisorName,
        loginTime: s.loginTime,
        lastActivity: s.lastActivity
      }));
      
      res.json({
        success: true,
        sessions,
        count: sessions.length
      });
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

export default router;
