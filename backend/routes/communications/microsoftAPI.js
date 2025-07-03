import express from 'express';
import { MicrosoftGraphService } from '../../services/communications/microsoftGraphService.js';

const router = express.Router();
const graphService = new MicrosoftGraphService();

// Get auth URL for Microsoft login
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = graphService.getAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle auth callback
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code required' 
      });
    }

    const tokens = await graphService.getTokenFromCode(code);
    
    // Get user info
    const userInfo = await graphService.getUserProfile(tokens.accessToken);
    
    res.json({ 
      success: true, 
      data: {
        user: userInfo,
        expiresAt: new Date(Date.now() + (tokens.expiresIn * 1000)).toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error in auth callback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send email
router.post('/send-email', async (req, res) => {
  try {
    const { accessToken, to, subject, body, cc, attachments } = req.body;
    
    if (!accessToken || !to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token, to, subject, and body are required' 
      });
    }

    const result = await graphService.sendEmail(
      accessToken,
      { to, cc, subject, body, attachments }
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Check if token expired
    if (error.statusCode === 401) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate token
router.post('/validate-token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    const userInfo = await graphService.getUserProfile(accessToken);
    res.json({ success: true, valid: true, user: userInfo });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.json({ success: true, valid: false });
    }
    console.error('❌ Error validating token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
