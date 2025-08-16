// middleware/supervisorAuth.js
import jwt from 'jsonwebtoken';

export const supervisorAuth = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.supervisor = decoded;
      
      // Check roles if required
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};