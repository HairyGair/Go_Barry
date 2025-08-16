import express from 'express';
import microsoftEmailService from '../services/microsoftEmailService.js';

const router = express.Router();

// Get Microsoft login URL for supervisor
router.get('/microsoft/login-url/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID is required'
      });
    }

    const loginUrl = microsoftEmailService.getMicrosoftLoginUrl(supervisorId);
    
    res.json({
      success: true,
      loginUrl,
      supervisorId,
      message: 'Redirect user to this URL for Microsoft login'
    });

  } catch (error) {
    console.error('❌ Microsoft login URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle Microsoft OAuth callback
router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('❌ Microsoft OAuth error:', error);
      return res.redirect(`https://gobarry.co.uk/auth-error?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`https://gobarry.co.uk/auth-error?error=missing_code_or_state`);
    }

    // Extract supervisor ID from state
    const supervisorId = state.split('_')[1];
    if (!supervisorId) {
      return res.redirect(`https://gobarry.co.uk/auth-error?error=invalid_state`);
    }

    // Exchange code for token
    const result = await microsoftEmailService.exchangeCodeForToken(code, supervisorId);
    
    if (result.success) {
      console.log(`✅ Microsoft login successful for supervisor ${supervisorId}`);
      
      // Redirect to success page with supervisor info
      const successUrl = `https://gobarry.co.uk/auth-success?supervisor=${encodeURIComponent(supervisorId)}&name=${encodeURIComponent(result.userInfo.displayName)}&email=${encodeURIComponent(result.userInfo.mail)}`;
      res.redirect(successUrl);
    } else {
      console.error('❌ Token exchange failed:', result.error);
      res.redirect(`https://gobarry.co.uk/auth-error?error=${encodeURIComponent(result.error)}`);
    }

  } catch (error) {
    console.error('❌ Microsoft callback error:', error);
    res.redirect(`https://gobarry.co.uk/auth-error?error=${encodeURIComponent(error.message)}`);
  }
});

// Check Microsoft login status for supervisor
router.get('/microsoft/status/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    const status = microsoftEmailService.getSupervisorLoginStatus(supervisorId);
    
    let userInfo = null;
    if (status.loggedIn) {
      try {
        userInfo = await microsoftEmailService.getSupervisorInfo(supervisorId);
      } catch (error) {
        console.warn('Failed to get user info:', error.message);
      }
    }

    res.json({
      success: true,
      supervisorId,
      ...status,
      userInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Microsoft status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test email (requires Microsoft login)
router.post('/microsoft/test-email', async (req, res) => {
  try {
    const { supervisorId, recipient } = req.body;
    
    if (!supervisorId || !recipient) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID and recipient are required'
      });
    }

    // Check if supervisor is logged in
    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Supervisor not logged in to Microsoft 365',
        requiresAuth: true,
        loginUrl: microsoftEmailService.getMicrosoftLoginUrl(supervisorId)
      });
    }

    const result = await microsoftEmailService.sendTestEmail(supervisorId, recipient);
    
    res.json(result);

  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout supervisor from Microsoft
router.post('/microsoft/logout/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    const loggedOut = microsoftEmailService.logoutSupervisor(supervisorId);
    
    res.json({
      success: true,
      loggedOut,
      supervisorId,
      message: loggedOut ? 'Logged out successfully' : 'Supervisor was not logged in'
    });

  } catch (error) {
    console.error('❌ Microsoft logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all supervisors logged in to Microsoft
router.get('/microsoft/logged-in', async (req, res) => {
  try {
    const loggedInSupervisors = microsoftEmailService.getLoggedInSupervisors();
    
    res.json({
      success: true,
      supervisors: loggedInSupervisors,
      count: loggedInSupervisors.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get logged in supervisors error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;