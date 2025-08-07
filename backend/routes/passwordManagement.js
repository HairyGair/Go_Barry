import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword, verifyPassword } from '../utils/secureAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const PASSWORDS_FILE = path.join(__dirname, '../data/supervisor-passwords.json');
const PASSWORD_HISTORY_FILE = path.join(__dirname, '../data/password-history.json');

// Now using secure bcrypt authentication utilities from ../utils/secureAuth.js

// Read password data
async function readPasswords() {
  try {
    const data = await fs.readFile(PASSWORDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Save password data
async function savePasswords(passwords) {
  await fs.writeFile(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
}

// Read password history
async function readPasswordHistory() {
  try {
    const data = await fs.readFile(PASSWORD_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Save password history
async function savePasswordHistory(history) {
  await fs.writeFile(PASSWORD_HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Check password strength
function checkPasswordStrength(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password)
  };
  
  const strength = Object.values(requirements).filter(Boolean).length;
  return { requirements, strength, isValid: strength >= 3 };
}

// Change password endpoint
router.post('/change-password', async function(req, res) {
  try {
    const { supervisorBadge, currentPassword, newPassword } = req.body;
    
    if (!supervisorBadge || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Check password strength
    const strengthCheck = checkPasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet strength requirements',
        requirements: strengthCheck.requirements
      });
    }
    
    // Get current passwords
    const passwords = await readPasswords();
    const currentData = passwords[supervisorBadge];
    
    // Verify current password
    if (!currentData) {
      // First time setting password
      const { hash, salt } = hashPassword(newPassword);
      passwords[supervisorBadge] = {
        hash,
        salt,
        lastChanged: new Date().toISOString(),
        mustChange: false
      };
    } else {
      // Verify current password
      if (!verifyPassword(currentPassword, currentData.hash, currentData.salt)) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
      
      // Check password history (prevent reuse of last 5 passwords)
      const history = await readPasswordHistory();
      const userHistory = history[supervisorBadge] || [];
      
      for (const oldPassword of userHistory.slice(-5)) {
        if (verifyPassword(newPassword, oldPassword.hash, oldPassword.salt)) {
          return res.status(400).json({
            success: false,
            error: 'Cannot reuse recent passwords'
          });
        }
      }
      
      // Add current password to history
      if (!history[supervisorBadge]) {
        history[supervisorBadge] = [];
      }
      history[supervisorBadge].push({
        hash: currentData.hash,
        salt: currentData.salt,
        changedAt: currentData.lastChanged || new Date().toISOString()
      });
      await savePasswordHistory(history);
      
      // Update password
      const { hash, salt } = hashPassword(newPassword);
      passwords[supervisorBadge] = {
        hash,
        salt,
        lastChanged: new Date().toISOString(),
        mustChange: false
      };
    }
    
    // Save updated passwords
    await savePasswords(passwords);
    
    // Log the action
    const actionsFile = path.join(__dirname, '../data/supervisor-actions.json');
    const actions = JSON.parse(await fs.readFile(actionsFile, 'utf-8').catch(() => '[]'));
    actions.push({
      supervisor_badge: supervisorBadge,
      action: 'PASSWORD_CHANGE',
      details: { success: true },
      timestamp: new Date().toISOString()
    });
    await fs.writeFile(actionsFile, JSON.stringify(actions, null, 2));
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      lastChanged: passwords[supervisorBadge].lastChanged
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Verify password endpoint (for login)
router.post('/verify-password', async function(req, res) {
  try {
    const { supervisorBadge, password } = req.body;
    
    if (!supervisorBadge || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const passwords = await readPasswords();
    const userData = passwords[supervisorBadge];
    
    if (!userData) {
      return res.json({
        success: false,
        needsSetup: true,
        error: 'Password not set'
      });
    }
    
    const isValid = verifyPassword(password, userData.hash, userData.salt);
    
    if (isValid) {
      // Check if password is expired (90 days)
      const lastChanged = new Date(userData.lastChanged);
      const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
      
      res.json({
        success: true,
        mustChange: userData.mustChange || daysSinceChange > 90,
        lastChanged: userData.lastChanged,
        daysUntilExpiry: Math.max(0, 90 - Math.floor(daysSinceChange))
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify password'
    });
  }
});

// Get password status (for displaying in UI)
router.get('/password-status/:badge', async function(req, res) {
  try {
    const passwords = await readPasswords();
    const userData = passwords[req.params.badge];
    
    if (!userData) {
      return res.json({
        success: true,
        hasPassword: false,
        needsSetup: true
      });
    }
    
    const lastChanged = new Date(userData.lastChanged);
    const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
    
    res.json({
      success: true,
      hasPassword: true,
      lastChanged: userData.lastChanged,
      mustChange: userData.mustChange || daysSinceChange > 90,
      daysUntilExpiry: Math.max(0, 90 - Math.floor(daysSinceChange)),
      isExpired: daysSinceChange > 90
    });
  } catch (error) {
    console.error('Password status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get password status'
    });
  }
});

// Force password change (admin only)
router.post('/force-password-change', async function(req, res) {
  try {
    const { adminBadge, targetBadge } = req.body;
    
    // Verify admin (AG003 or BP009)
    if (!['AG003', 'BP009'].includes(adminBadge)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin access required'
      });
    }
    
    const passwords = await readPasswords();
    if (passwords[targetBadge]) {
      passwords[targetBadge].mustChange = true;
      await savePasswords(passwords);
      
      res.json({
        success: true,
        message: `Password change required for ${targetBadge}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }
  } catch (error) {
    console.error('Force password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force password change'
    });
  }
});

// Migrate existing password (for users with local passwords)
router.post('/migrate-password', async function(req, res) {
  try {
    const { supervisorBadge, hashedPassword, salt } = req.body;
    
    if (!supervisorBadge || !hashedPassword || !salt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const passwords = await readPasswords();
    
    // Check if already has password
    if (passwords[supervisorBadge]) {
      return res.json({
        success: true,
        message: 'Password already exists',
        alreadyMigrated: true
      });
    }
    
    // Store the migrated password
    passwords[supervisorBadge] = {
      hash: hashedPassword,
      salt: salt,
      lastChanged: new Date().toISOString(),
      mustChange: false,
      migrated: true
    };
    
    await savePasswords(passwords);
    
    res.json({
      success: true,
      message: 'Password migrated successfully'
    });
  } catch (error) {
    console.error('Password migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to migrate password'
    });
  }
});

export default router;