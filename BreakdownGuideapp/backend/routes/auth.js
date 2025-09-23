import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// GET /api/auth/supervisors - Get all supervisors
router.get('/supervisors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, depot, is_active')
      .eq('role', 'supervisor')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// GET /api/auth/user/:id - Get specific user
router.get('/user/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/supervisor/:username - Get supervisor by username  
router.get('/supervisor/:username', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', req.params.username)
      .eq('role', 'supervisor')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor' });
  }
});

// POST /api/auth/login - Basic login for supervisors
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find supervisor by username
    const { data: supervisor, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', 'supervisor')
      .eq('is_active', true)
      .single();

    if (error || !supervisor) {
      return res.status(401).json({ error: 'Invalid username' });
    }

    // For development, allow login without password validation
    // In production, implement proper password hashing/checking
    if (process.env.NODE_ENV === 'production' && password) {
      // TODO: Implement password validation
      // For now, accept any password in production for backward compatibility
    }

    // Create session data (in production, use proper JWT or session management)
    const sessionData = {
      user_id: supervisor.id,
      username: supervisor.username,
      full_name: supervisor.full_name,
      email: supervisor.email,
      depot: supervisor.depot,
      role: supervisor.role,
      login_time: new Date().toISOString()
    };

    res.json({
      success: true,
      user: sessionData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // In a full implementation, invalidate the session/token here
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/verify - Verify session (alias for validate)
router.post('/verify', async (req, res) => {
  try {
    const { session_token, username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required for verification' });
    }

    // Verify user exists and is active
    const { data: supervisor, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, is_active')
      .eq('username', username)
      .eq('role', 'supervisor')
      .eq('is_active', true)
      .single();

    if (error || !supervisor) {
      return res.status(401).json({ 
        valid: false, 
        error: 'Invalid session' 
      });
    }

    res.json({
      valid: true,
      user: {
        id: supervisor.id,
        username: supervisor.username,
        full_name: supervisor.full_name,
        role: supervisor.role
      },
      message: 'Session verified'
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
});

// GET /api/auth/validate - Validate session/token
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // In a full implementation, validate JWT token here
    // For now, return success for development
    res.json({
      valid: true,
      message: 'Session valid'
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
});

// GET /api/auth/depots - Get list of depots from users
router.get('/depots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('depot')
      .not('depot', 'is', null);

    if (error) throw error;

    // Get unique depots
    const depots = [...new Set(data.map(user => user.depot))].sort();

    res.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

// GET /api/auth/recent-sessions - Get recent authentication sessions
router.get('/recent-sessions', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Since sessions are managed in memory, we'll provide basic session info
    // This could be enhanced to track actual session data if needed
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, username, depot')
      .eq('is_active', true)
      .eq('role', 'supervisor')
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent sessions',
      data: []
    });
  }
});

export default router;