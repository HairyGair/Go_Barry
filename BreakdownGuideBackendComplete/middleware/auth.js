// middleware/auth.js
// Authentication and authorization middleware for Go BARRY

import jwt from 'jsonwebtoken';

// Generic authentication middleware
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No authentication token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    req.supervisor = decoded; // For backward compatibility
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Check if user is a supervisor
export const checkSupervisor = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ 
      success: false,
      error: 'Supervisor access required' 
    });
  }

  const supervisorRoles = ['supervisor', 'admin', 'manager'];
  if (!supervisorRoles.includes(req.user.role.toLowerCase())) {
    return res.status(403).json({ 
      success: false,
      error: 'Insufficient permissions - supervisor role required' 
    });
  }

  next();
};

// Check if user is an admin
export const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }

  next();
};

// Role-based access control
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - no role assigned' 
      });
    }

    const userRole = req.user.role.toLowerCase();
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.some(role => role.toLowerCase() === userRole)) {
      return res.status(403).json({ 
        success: false,
        error: `Access denied - requires one of: ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      req.supervisor = decoded;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
    console.debug('Optional auth token invalid:', error.message);
  }
  
  next();
};

// Verify API key for external integrations
export const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API key required' 
    });
  }

  // Check against configured API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid API key' 
    });
  }

  next();
};

export default {
  authenticate,
  checkSupervisor,
  checkAdmin,
  requireRole,
  optionalAuth,
  verifyApiKey
};