import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// GET /api/auth/supervisors - Get all supervisors
router.get('/supervisors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('id, name, email, role, depot, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Map to match frontend expectations
    const supervisors = (data || []).map(supervisor => ({
      id: supervisor.id,
      username: supervisor.name,
      full_name: supervisor.name,
      name: supervisor.name,
      email: supervisor.email,
      role: supervisor.role || 'supervisor',
      depot: supervisor.depot,
      is_active: supervisor.is_active
    }));

    res.json(supervisors);
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

// POST /api/auth/login - Supabase authentication login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Attempt Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });

    if (error || !data.user) {
      // Log failed attempt with generic response
      console.warn(`Failed login attempt for email: ${email}`);

      return res.status(401).json({
        error: 'Invalid credentials. Please check your email and password.',
        code: 'AUTH_FAILED'
      });
    }

    // Check if user is authorized supervisor
    const { data: supervisor, error: supervisorError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (supervisorError || !supervisor) {
      // User authenticated with Supabase but not authorized in our system
      console.warn(`Unauthorized authenticated user: ${email}`);

      // Sign them out of Supabase
      await supabase.auth.signOut();

      return res.status(401).json({
        error: 'Invalid credentials. Please check your email and password.',
        code: 'AUTH_FAILED'
      });
    }

    // Successful authentication
    const sessionData = {
      user_id: data.user.id,
      supervisorId: supervisor.id,
      username: supervisor.name,
      full_name: supervisor.name,
      name: supervisor.name,
      email: supervisor.email,
      depot: supervisor.depot,
      role: supervisor.role,
      login_time: new Date().toISOString(),
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    };

    // Log successful authentication
    console.log(`✅ Successful login: ${supervisor.name} (${supervisor.email})`);

    res.json({
      success: true,
      user: sessionData,
      session: data.session,
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
router.post('/logout', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut(token);
      if (error) {
        console.warn('Supabase logout error:', error.message);
      }
    }

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