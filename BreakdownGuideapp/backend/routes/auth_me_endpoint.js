// Add this endpoint to /backend/routes/auth.js

// GET /api/auth/me - Get current authenticated user
// Used to restore session on page refresh without localStorage
router.get('/me', verifyToken, async (req, res) => {
  try {
    // User is already verified by verifyToken middleware
    const userId = req.user.id;

    // Fetch fresh user data from database
    const { data: supervisor, error } = await from('supervisors')
      .select('id, name, email, role, depot, badge_number, is_active, current_duty, duty_start_time, duty_end_time')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !supervisor) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user has active session
    const sessionResult = await query(
      'SELECT * FROM supervisor_sessions WHERE supervisor_id = ? AND is_online = TRUE LIMIT 1',
      [userId]
    );

    const activeSession = sessionResult.length > 0 ? sessionResult[0] : null;

    // Return user data (no sensitive tokens)
    const userData = {
      id: supervisor.id,
      email: supervisor.email,
      name: supervisor.name,
      role: supervisor.role || 'supervisor',
      depot: supervisor.depot,
      badge_number: supervisor.badge_number,
      current_duty: supervisor.current_duty || activeSession?.current_duty || null,
      duty_start_time: supervisor.duty_start_time || activeSession?.duty_start_time || null,
      duty_end_time: supervisor.duty_end_time || activeSession?.duty_end_time || null,
      loginTime: activeSession?.login_time || null,
      lastActivity: activeSession?.last_activity || null
    };

    // Update last activity if session exists
    if (activeSession) {
      await query(
        'UPDATE supervisor_sessions SET last_activity = NOW() WHERE id = ?',
        [activeSession.id]
      );
    }

    res.json({
      success: true,
      user: userData,
      session: {
        active: !!activeSession,
        expires_at: req.user.exp,
        authenticated: true
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
      code: 'FETCH_ERROR'
    });
  }
});

// GET /api/auth/csrf-token - Get CSRF token for forms
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
});