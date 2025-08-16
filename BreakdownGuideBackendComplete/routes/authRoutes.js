// backend/routes/authRoutes.js
// Authentication routes for Microsoft Graph integration

import express from 'express';
import MicrosoftGraphAuth from '../services/microsoftGraphAuth.js';

const router = express.Router();

// Initialize Microsoft Graph Auth with error handling
let graphAuth;
try {
  graphAuth = new MicrosoftGraphAuth();
} catch (error) {
  console.warn('⚠️ Microsoft Graph Auth initialization failed:', error.message);
  graphAuth = null;
}

// In-memory token storage (replace with database in production)
const tokenStorage = new Map();

// Middleware to check if Microsoft Graph is configured
function requireGraphAuth(req, res, next) {
  if (!graphAuth || !graphAuth.isConfigured) {
    return res.status(503).json({
      error: 'Microsoft Graph not configured',
      message: 'SharePoint integration requires Azure AD configuration'
    });
  }
  next();
}

// Apply middleware to all Microsoft routes
router.use('/microsoft/*', requireGraphAuth);

/**
 * GET /api/auth/microsoft/login
 * Initiate Microsoft OAuth login flow
 */
router.get('/microsoft/login', async (req, res) => {
  try {

    // Validate configuration
    graphAuth.validateConfig();

    // Generate state parameter for security
    const state = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get authorization URL
    const authUrl = await graphAuth.getAuthUrl(state);
    
    console.log('🔐 Starting Microsoft auth flow');
    console.log('🔐 Auth URL generated for state:', state);

    // Store state for validation (in production, use secure session storage)
    req.session = req.session || {};
    req.session.authState = state;

    res.json({
      success: true,
      authUrl: authUrl,
      state: state,
      message: 'Navigate to authUrl to complete authentication'
    });

  } catch (error) {
    console.error('🔐 Auth initiation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate authentication',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/microsoft/callback
 * Handle OAuth callback from Microsoft
 */
router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('🔐 OAuth error:', error, error_description);
      return res.status(400).json({
        success: false,
        error: 'OAuth authentication failed',
        details: error_description || error
      });
    }

    // Validate required parameters
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code'
      });
    }

    console.log('🔐 Processing callback with state:', state);

    // Exchange code for tokens
    const tokenData = await graphAuth.getTokenFromCode(code, process.env.AZURE_REDIRECT_URI);

    // Get user information
    const userInfo = await graphAuth.getUserInfo(tokenData.accessToken);

    // Store tokens securely (replace with database in production)
    const userId = userInfo.id;
    tokenStorage.set(userId, {
      ...tokenData,
      userInfo: userInfo,
      lastUpdated: new Date()
    });

    console.log('🔐 Authentication successful for user:', userInfo.displayName);

    // Redirect to success page or return tokens
    res.json({
      success: true,
      user: {
        id: userInfo.id,
        displayName: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName
      },
      message: 'Authentication successful',
      // Don't return actual tokens in response for security
      tokenExpiry: tokenData.expiresOn
    });

  } catch (error) {
    console.error('🔐 Callback processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication callback failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/microsoft/refresh
 * Refresh access token
 */
router.post('/microsoft/refresh', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    const storedData = tokenStorage.get(userId);
    if (!storedData) {
      return res.status(404).json({
        success: false,
        error: 'No stored authentication data found'
      });
    }

    // Check if token needs refresh
    if (graphAuth.isTokenValid(storedData)) {
      return res.json({
        success: true,
        message: 'Token is still valid',
        expiry: storedData.expiresOn
      });
    }

    console.log('🔐 Refreshing token for user:', userId);

    // Refresh the token
    const newTokenData = await graphAuth.refreshAccessToken(
      storedData.refreshToken,
      storedData.account
    );

    // Update stored data
    tokenStorage.set(userId, {
      ...storedData,
      ...newTokenData,
      lastUpdated: new Date()
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiry: newTokenData.expiresOn
    });

  } catch (error) {
    console.error('🔐 Token refresh failed:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/microsoft/status
 * Check authentication status for a user
 */
router.get('/microsoft/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const storedData = tokenStorage.get(userId);

    if (!storedData) {
      return res.json({
        authenticated: false,
        message: 'No authentication data found'
      });
    }

    const isValid = graphAuth.isTokenValid(storedData);

    res.json({
      authenticated: isValid,
      user: storedData.userInfo ? {
        id: storedData.userInfo.id,
        displayName: storedData.userInfo.displayName,
        email: storedData.userInfo.mail || storedData.userInfo.userPrincipalName
      } : null,
      tokenExpiry: storedData.expiresOn,
      lastUpdated: storedData.lastUpdated,
      needsRefresh: !isValid
    });

  } catch (error) {
    console.error('🔐 Status check failed:', error);
    res.status(500).json({
      authenticated: false,
      error: 'Status check failed',
      details: error.message
    });
  }
});

/**
 * DELETE /api/auth/microsoft/logout/:userId
 * Logout and clear stored tokens
 */
router.delete('/microsoft/logout/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    if (tokenStorage.has(userId)) {
      tokenStorage.delete(userId);
      console.log('🔐 User logged out:', userId);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('🔐 Logout failed:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/microsoft/config
 * Get configuration info (for debugging)
 */
router.get('/microsoft/config', (req, res) => {
  try {
    const hasConfig = !![
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET,
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_REDIRECT_URI
    ].every(Boolean);

    res.json({
      configured: hasConfig,
      redirectUri: process.env.AZURE_REDIRECT_URI,
      tenantId: process.env.AZURE_TENANT_ID ? 'Set' : 'Missing',
      clientId: process.env.AZURE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.AZURE_CLIENT_SECRET ? 'Set' : 'Missing',
    });

  } catch (error) {
    res.status(500).json({
      configured: false,
      error: error.message
    });
  }
});

// Helper function to get valid access token for a user
export const getValidAccessToken = async (userId) => {
  const storedData = tokenStorage.get(userId);
  if (!storedData) {
    throw new Error('No authentication data found for user');
  }

  // If token is still valid, return it
  if (graphAuth.isTokenValid(storedData)) {
    return storedData.accessToken;
  }

  // Try to refresh the token
  try {
    const newTokenData = await graphAuth.refreshAccessToken(
      storedData.refreshToken,
      storedData.account
    );

    // Update stored data
    tokenStorage.set(userId, {
      ...storedData,
      ...newTokenData,
      lastUpdated: new Date()
    });

    return newTokenData.accessToken;
  } catch (error) {
    // Token refresh failed, user needs to re-authenticate
    tokenStorage.delete(userId);
    throw new Error('Token expired and refresh failed. Re-authentication required.');
  }
};

export default router;