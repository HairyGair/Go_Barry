/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { from, insert, update, remove, query } from '../utils/queryHelpers.js';
import { authenticateAdmin, rateLimitLogin, clearLoginAttempts, verifyToken } from '../middleware/authMiddleware.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';
import dutyManager from '../services/dutyManager.js';
import { validate } from '../middleware/validationMiddleware.js';
import { authSchemas } from '../validation/schemas.js';
import webSocketHandler from './webSocketHandler.js';
import { logAuditEvent, ACTION_TYPES as AUDIT_ACTIONS } from './dutyAudit.js';
import { seedDemoData } from '../services/demoDataService.js';

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const BCRYPT_SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  console.error('❌ FATAL: Missing JWT_SECRET in auth.js');
  console.error('   Set JWT_SECRET environment variable');
  process.exit(1);
}

const router = express.Router();

/**
 * Generate JWT token for authenticated user
 * @param {Object} supervisor - Supervisor object from database
 * @returns {string} JWT token
 */
function generateToken(supervisor) {
  const payload = {
    sub: supervisor.id,
    id: supervisor.id,
    user_id: supervisor.id,
    email: supervisor.email,
    name: supervisor.name,
    role: supervisor.role || 'supervisor',
    depot: supervisor.depot,
    badge_number: supervisor.badge_number,
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION
  });
}

// GET /api/auth/supervisors - Get all active supervisors
router.get('/supervisors', async (req, res) => {
  try {
    // Demo sessions see only the demo supervisor; everyone else excludes it.
    // Demo is signalled by ?demo=true (this GET has no auth token) or by req.user.
    const demo = req.query.demo === 'true' || req.user?.badge_number === 'DEMO01';
    let supervisorQuery = from('supervisors')
      .select('id, name, email, role, depot, is_active, badge_number')
      .eq('is_active', true);
    supervisorQuery = demo
      ? supervisorQuery.eq('badge_number', 'DEMO01')
      : supervisorQuery.neq('badge_number', 'DEMO01');
    const { data, error } = await supervisorQuery
      .order('name', 'ASC')
      .execute();

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
      badge_number: supervisor.badge_number,
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
    const { data, error } = await from('supervisors')
      .select('id, name, email, role, depot, is_active, badge_number')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: data.id,
      username: data.name,
      full_name: data.name,
      email: data.email,
      role: data.role,
      depot: data.depot,
      badge_number: data.badge_number,
      is_active: data.is_active
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/supervisor/:username - Get supervisor by username
router.get('/supervisor/:username', async (req, res) => {
  try {
    const { data, error } = await from('supervisors')
      .select('*')
      .eq('name', req.params.username)
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

// POST /api/auth/supervisor-signup - Existing supervisor account activation
router.post('/supervisor-signup', rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`📝 Signup attempt for email: ${email}`);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if supervisor exists in our database
    const { data: existingSupervisor, error: checkError } = await from('supervisors')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (checkError || !existingSupervisor) {
      console.log(`❌ Signup failed: No supervisor found with email ${email}`);
      return res.status(404).json({
        error: 'No supervisor account found with this email address. Please contact your administrator.',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    // Check if already has a password (already activated)
    if (existingSupervisor.password_hash) {
      console.log(`❌ Signup failed: Supervisor already has password`);
      return res.status(409).json({
        error: 'Account already activated. Please use the login page.',
        code: 'ACCOUNT_EXISTS'
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Update supervisor with password hash
    try {
      await update('supervisors', {
        password_hash: passwordHash,
        signup_date: new Date().toISOString(),
        pending_approval: false,
        approved_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        id: existingSupervisor.id
      });
    } catch (updateError) {
      console.error('❌ Failed to activate supervisor account:', updateError);
      return res.status(500).json({
        error: 'Failed to complete account setup. Please try again.',
        code: 'ACTIVATION_FAILED'
      });
    }

    console.log(`✅ Account activated successfully for ${existingSupervisor.name} (${email})`);

    res.json({
      success: true,
      message: 'Account activated successfully! You can now log in.',
      supervisor: {
        id: existingSupervisor.id,
        name: existingSupervisor.name,
        email: existingSupervisor.email,
        badge_number: existingSupervisor.badge_number,
        depot: existingSupervisor.depot,
        role: existingSupervisor.role
      }
    });

  } catch (error) {
    console.error('❌ Supervisor signup error:', error);
    res.status(500).json({
      error: 'Account activation failed. Please try again.',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// POST /api/auth/login - MySQL + JWT authentication login
router.post('/login', rateLimitLogin, clearLoginAttempts, validate(authSchemas.login), async (req, res) => {
  try {
    const { email, password, duty } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate duty if provided
    if (duty && !dutyManager.DUTY_SHIFTS[duty]) {
      return res.status(400).json({
        error: 'Invalid duty selected',
        code: 'INVALID_DUTY'
      });
    }

    // Fetch supervisor by email
    const { data: supervisor, error: supervisorError } = await from('supervisors')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (supervisorError || !supervisor) {
      console.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials. Please check your email and password.',
        code: 'AUTH_FAILED'
      });
    }

    // Check if supervisor has a password hash
    if (!supervisor.password_hash) {
      console.warn(`Login attempt for unactivated account: ${email}`);
      return res.status(401).json({
        error: 'Account not activated. Please complete signup first.',
        code: 'ACCOUNT_NOT_ACTIVATED'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, supervisor.password_hash);

    if (!passwordMatch) {
      console.warn(`Failed login attempt (wrong password) for email: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials. Please check your email and password.',
        code: 'AUTH_FAILED'
      });
    }

    // Check if supervisor is active
    if (!supervisor.is_active) {
      console.warn(`Login attempt for inactive account: ${email}`);
      return res.status(403).json({
        error: 'Account is inactive. Please contact your administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Generate JWT token
    const token = generateToken(supervisor);

    // Calculate expiration timestamp
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Start shift if duty provided
    let shiftInfo = null;
    if (duty) {
      try {
        shiftInfo = await dutyManager.startShift({
          supervisorId: supervisor.id,
          supervisorName: supervisor.name,
          supervisorBadge: supervisor.badge_number,
          duty
        });
        console.log(`✅ Shift started: ${supervisor.name} on ${duty} (ends at ${shiftInfo.shiftEnd.toLocaleTimeString()})`);
      } catch (shiftError) {
        console.error('Error starting shift:', shiftError);
        // Don't fail login if shift start fails
      }
    }

    // Create supervisor session for real-time tracking
    try {
      // Check if session already exists
      const existingSessions = await query(
        'SELECT id FROM supervisor_sessions WHERE supervisor_id = ? AND is_online = TRUE',
        [supervisor.id]
      );

      if (existingSessions.length > 0) {
        // Close existing session (prevent multiple simultaneous logins)
        console.log(`⚠️  Closing existing session for ${supervisor.name}`);
        await query(`
          UPDATE supervisor_sessions
          SET
            is_online = FALSE,
            logout_time = NOW(),
            session_duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW())
          WHERE supervisor_id = ? AND is_online = TRUE
        `, [supervisor.id]);
      }

      // Create new session
      const sessionData = {
        id: crypto.randomUUID(),
        supervisor_id: supervisor.id,
        supervisor_name: supervisor.name,
        email: supervisor.email,
        badge_number: supervisor.badge_number,
        current_duty: duty || null,
        duty_start_time: shiftInfo ? shiftInfo.shiftStart.toISOString().slice(0, 19).replace('T', ' ') : null,
        duty_end_time: shiftInfo ? shiftInfo.shiftEnd.toISOString().slice(0, 19).replace('T', ' ') : null,
        depot: supervisor.depot || null,
        role: supervisor.role || 'supervisor',
        login_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        last_activity: new Date().toISOString().slice(0, 19).replace('T', ' '),
        is_online: true
      };

      await insert('supervisor_sessions', sessionData);
      console.log(`📝 Session created for ${supervisor.name}`);

      // Broadcast supervisor login via WebSocket
      webSocketHandler.broadcast('control-room', {
        type: 'supervisor_login',
        data: {
          supervisor_id: supervisor.id,
          name: supervisor.name,
          badge_number: supervisor.badge_number,
          depot: supervisor.depot,
          current_duty: duty,
          duty_start_time: sessionData.duty_start_time,
          login_time: sessionData.login_time
        },
        timestamp: new Date().toISOString()
      });

    } catch (sessionError) {
      console.error('⚠️  Error creating session:', sessionError);
      // Continue with login even if session creation fails
    }

    // Successful authentication
    const sessionData = {
      user_id: supervisor.id,
      supervisorId: supervisor.id,
      username: supervisor.name,
      full_name: supervisor.name,
      name: supervisor.name,
      email: supervisor.email,
      depot: supervisor.depot,
      role: supervisor.role || 'supervisor',
      badge_number: supervisor.badge_number,
      current_duty: duty || supervisor.current_duty || null,
      duty_end_time: shiftInfo ? shiftInfo.shiftEnd.toISOString() : null,
      login_time: new Date().toISOString(),
      expires_at: expiresAt
      // NOTE: Token removed from response body - now stored in HTTP-only cookie for XSS protection
    };

    // Set JWT token in HTTP-only cookie (cannot be accessed by JavaScript - XSS protection)
    // This cookie will be automatically sent with all future requests to the API
    // IMPORTANT: domain must ALWAYS be .gobarry.co.uk to share cookies across subdomains
    // (frontend at breakdowns.gobarry.co.uk and backend at api.breakdowns.gobarry.co.uk)
    res.cookie('auth_token', token, {
      httpOnly: true, // Cookie cannot be accessed by client-side JavaScript
      secure: true, // Always use HTTPS (required for cross-subdomain cookies)
      sameSite: 'None', // 'None' required for cross-origin requests between api.breakdowns.gobarry.co.uk and breakdowns.gobarry.co.uk
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/', // Cookie available for all routes
      domain: '.gobarry.co.uk' // ALWAYS share across all subdomains
    });

    // Log successful authentication
    console.log(`✅ Successful login: ${supervisor.name} (${supervisor.email})${duty ? ` - ${duty}` : ''}`);
    console.log(`🍪 Auth token set in HTTP-only cookie (XSS-protected)`);

    // Log login activity to Activity Feed
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.USER_LOGIN,
      action: duty ? `logged in and started ${duty}` : 'logged in',
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisor.badge_number || supervisor.id,
      actorName: supervisor.name,
      depot: supervisor.depot,
      severity: SEVERITY_LEVELS.INFO,
      source: 'authentication',
      metadata: {
        email: supervisor.email,
        role: supervisor.role,
        duty: duty || null,
        shiftEnd: shiftInfo ? shiftInfo.shiftEnd.toISOString() : null,
        loginTime: sessionData.login_time
      }
    });

    // Return user data WITHOUT token (token is in HTTP-only cookie now)
    res.json({
      success: true,
      user: sessionData,
      session: {
        // Token removed from response for security - stored in HTTP-only cookie
        expires_at: expiresAt,
        expires_in: expiresIn,
        token_type: 'Bearer'
      },
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

// POST /api/auth/demo-login - One-click demo login (no password required)
router.post('/demo-login', rateLimitLogin, async (req, res) => {
  try {
    console.log('🎭 Demo login attempt');

    // Look up demo supervisor
    const { data: supervisor, error: supervisorError } = await from('supervisors')
      .select('*')
      .eq('badge_number', 'DEMO01')
      .single();

    if (supervisorError || !supervisor) {
      console.error('🎭 Demo supervisor not found - run migration 033');
      return res.status(500).json({
        error: 'Demo mode not available. Contact administrator.',
        code: 'DEMO_NOT_CONFIGURED'
      });
    }

    // Seed fresh demo data (clears old, inserts new)
    try {
      await seedDemoData();
    } catch (seedError) {
      console.error('🎭 Failed to seed demo data:', seedError);
      // Continue with login even if seeding fails
    }

    // Generate JWT token
    const token = generateToken(supervisor);

    // Calculate expiration
    const expiresIn = 24 * 60 * 60;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Close any existing demo sessions
    try {
      await query(`
        UPDATE supervisor_sessions
        SET is_online = FALSE, logout_time = NOW(),
            session_duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW())
        WHERE supervisor_id = ? AND is_online = TRUE
      `, [supervisor.id]);
    } catch (sessionCleanupError) {
      console.warn('🎭 Session cleanup error:', sessionCleanupError.message);
    }

    // Create new session
    try {
      await insert('supervisor_sessions', {
        id: crypto.randomUUID(),
        supervisor_id: supervisor.id,
        supervisor_name: supervisor.name,
        email: supervisor.email,
        badge_number: supervisor.badge_number,
        current_duty: 'Duty 200',
        depot: supervisor.depot || 'Riverside',
        role: supervisor.role || 'admin',
        login_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        last_activity: new Date().toISOString().slice(0, 19).replace('T', ' '),
        is_online: true
      });
    } catch (sessionError) {
      console.warn('🎭 Session creation error:', sessionError.message);
    }

    // Build session response data
    const sessionData = {
      user_id: supervisor.id,
      supervisorId: supervisor.id,
      username: supervisor.name,
      full_name: supervisor.name,
      name: supervisor.name,
      email: supervisor.email,
      depot: supervisor.depot,
      role: supervisor.role || 'admin',
      badge_number: supervisor.badge_number,
      current_duty: 'Duty 200',
      login_time: new Date().toISOString(),
      expires_at: expiresAt,
      is_demo: true
    };

    // Set JWT token in HTTP-only cookie (same as regular login)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      domain: '.gobarry.co.uk'
    });

    console.log('🎭 Demo login successful');

    res.json({
      success: true,
      user: sessionData,
      session: {
        expires_at: expiresAt,
        expires_in: expiresIn,
        token_type: 'Bearer'
      },
      message: 'Demo login successful'
    });
  } catch (error) {
    console.error('🎭 Demo login error:', error);
    res.status(500).json({
      error: 'Demo login failed. Please try again.',
      code: 'DEMO_LOGIN_ERROR'
    });
  }
});

// GET /api/auth/me - Get current authenticated user (session restoration)
router.get('/me', verifyToken, async (req, res) => {
  try {
    // User is already attached to request by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'AUTH_REQUIRED'
      });
    }

    // Return user data from session
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        depot: req.user.depot,
        badge_number: req.user.badge_number,
        loginTime: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ /me endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user information',
      code: 'ME_ERROR'
    });
  }
});

// POST /api/auth/signup - New supervisor signup endpoint
router.post('/signup', rateLimitLogin, validate(authSchemas.signup), async (req, res) => {
  try {
    const { email, password, fullName, badgeNumber, depot, role = 'supervisor' } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !badgeNumber) {
      return res.status(400).json({
        error: 'Email, password, full name, and badge number are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate badge number format (e.g., AG003, BP009)
    const badgeRegex = /^[A-Z]{2}\d{3}$/;
    if (!badgeRegex.test(badgeNumber)) {
      return res.status(400).json({
        error: 'Badge number must be in format: AB123',
        code: 'INVALID_BADGE'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if supervisor already exists
    const { data: existingSupervisor, error: checkError } = await from('supervisors')
      .select('email, badge_number')
      .execute();

    if (!checkError && existingSupervisor) {
      const existing = existingSupervisor.find(
        s => s.email === email.toLowerCase() || s.badge_number === badgeNumber.toUpperCase()
      );

      if (existing) {
        if (existing.email === email.toLowerCase()) {
          return res.status(409).json({
            error: 'An account with this email address already exists',
            code: 'EMAIL_EXISTS'
          });
        }
        if (existing.badge_number === badgeNumber.toUpperCase()) {
          return res.status(409).json({
            error: 'An account with this badge number already exists',
            code: 'BADGE_EXISTS'
          });
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Generate UUID for new supervisor
    const supervisorId = crypto.randomUUID();

    // Insert new supervisor (pending approval by default)
    try {
      await insert('supervisors', {
        id: supervisorId,
        email: email.toLowerCase(),
        name: fullName,
        badge_number: badgeNumber.toUpperCase(),
        depot: depot || 'SDC',
        role: role,
        password_hash: passwordHash,
        is_active: false, // Pending approval
        pending_approval: true,
        signup_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (insertError) {
      console.error('Supervisor insert error:', insertError);
      return res.status(500).json({
        error: 'Failed to create supervisor record. Please try again.',
        code: 'SUPERVISOR_CREATE_FAILED'
      });
    }

    // Log successful signup
    console.log(`🆕 New supervisor signup: ${fullName} (${email}) - Badge: ${badgeNumber}`);

    res.status(201).json({
      success: true,
      message: 'Signup successful! Your account is pending approval.',
      supervisor: {
        id: supervisorId,
        name: fullName,
        email: email.toLowerCase(),
        badge_number: badgeNumber.toUpperCase(),
        depot: depot || 'SDC',
        pending_approval: true
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred during signup. Please try again.',
      code: 'SIGNUP_ERROR'
    });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', verifyToken, validate(authSchemas.logout), async (req, res) => {
  try {
    let supervisorInfo = null;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Decode token to get user info (don't verify, just decode)
        const decoded = jwt.decode(token);

        if (decoded && decoded.id) {
          // Fetch supervisor details
          const { data: supervisor } = await from('supervisors')
            .select('*')
            .eq('id', decoded.id)
            .single();

          supervisorInfo = supervisor;
        }
      } catch (decodeError) {
        console.warn('Error decoding token during logout:', decodeError.message);
      }
    }

    // End supervisor session if supervisor info is available
    if (supervisorInfo) {
      try {
        // Update supervisor_sessions table to mark session as offline
        await query(`
          UPDATE supervisor_sessions
          SET
            is_online = FALSE,
            logout_time = NOW(),
            session_duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW())
          WHERE supervisor_id = ? AND is_online = TRUE
        `, [supervisorInfo.id]);

        console.log(`📴 Session ended for ${supervisorInfo.name}`);

        // Clear supervisor's current duty
        await update('supervisors', {
          current_duty: null,
          duty_start_time: null,
          duty_end_time: null
        }, {
          id: supervisorInfo.id
        });

        // Broadcast supervisor logout via WebSocket (imported at top)
        if (typeof webSocketHandler !== 'undefined' && webSocketHandler.broadcast) {
          webSocketHandler.broadcast('control-room', {
            type: 'supervisor_logout',
            data: {
              supervisor_id: supervisorInfo.id,
              name: supervisorInfo.name,
              badge_number: supervisorInfo.badge_number,
              depot: supervisorInfo.depot,
              logout_time: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          });
        }
      } catch (sessionError) {
        console.error('⚠️  Error ending session:', sessionError);
        // Continue with logout even if session update fails
      }

      // Log logout activity to Activity Feed
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.USER_LOGOUT,
        action: 'logged out',
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: supervisorInfo.badge_number || supervisorInfo.id,
        actorName: supervisorInfo.name,
        depot: supervisorInfo.depot,
        severity: SEVERITY_LEVELS.INFO,
        source: 'authentication',
        metadata: {
          email: supervisorInfo.email,
          role: supervisorInfo.role,
          logoutTime: new Date().toISOString()
        }
      });

      // Phase 9.2: Log duty end to audit trail (if they had a duty)
      if (supervisorInfo.current_duty) {
        const now = new Date();
        let overtimeMinutes = 0;

        // Calculate overtime if duty_end_time exists
        if (supervisorInfo.duty_end_time) {
          const scheduledEnd = new Date(supervisorInfo.duty_end_time);
          if (now > scheduledEnd) {
            overtimeMinutes = Math.floor((now - scheduledEnd) / 60000);
          }
        }

        await logAuditEvent({
          supervisorId: supervisorInfo.id,
          supervisorBadge: supervisorInfo.badge_number,
          supervisorName: supervisorInfo.name,
          supervisorDepot: supervisorInfo.depot,
          actionType: AUDIT_ACTIONS.DUTY_END,
          dutyCode: supervisorInfo.current_duty,
          dutyName: dutyManager.getDutyName(supervisorInfo.current_duty),
          shiftStartTime: supervisorInfo.duty_start_time ? new Date(supervisorInfo.duty_start_time).toTimeString().slice(0, 5) : null,
          shiftEndTime: supervisorInfo.duty_end_time ? new Date(supervisorInfo.duty_end_time).toTimeString().slice(0, 5) : null,
          actualEndTime: now,
          overtimeMinutes,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent'),
          notes: overtimeMinutes > 0 ? `Logged out ${overtimeMinutes} minutes after scheduled shift end` : null,
          metadata: {
            email: supervisorInfo.email,
            role: supervisorInfo.role,
            logoutType: 'manual'
          }
        });
      }

      console.log(`👋 User logged out: ${supervisorInfo.name} (${supervisorInfo.email})`);
    } else {
      console.log('👋 User logged out successfully');
    }

    // Clear the HTTP-only cookie containing the JWT token
    // This prevents the browser from sending the token in future requests
    // IMPORTANT: Must use same cookie options as login endpoint
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true, // Must match login cookie settings
      sameSite: 'None', // Must match login cookie settings - Changed to 'None' for cross-origin
      path: '/',
      domain: '.gobarry.co.uk' // Must match login cookie settings
    });

    console.log('🍪 Auth token cookie cleared');

    // Note: JWT tokens are stateless, so we don't invalidate them server-side
    // The cookie has been cleared, preventing future authenticated requests
    // To implement token blacklisting, you would add the token to a blacklist here

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
    const { data: supervisor, error } = await from('supervisors')
      .select('id, name, email, role, is_active, badge_number')
      .eq('name', username)
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
        username: supervisor.name,
        full_name: supervisor.name,
        role: supervisor.role,
        email: supervisor.email,
        badge_number: supervisor.badge_number
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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      res.json({
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        },
        message: 'Session valid'
      });
    } catch (jwtError) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
});

// GET /api/auth/depots - Get list of depots
router.get('/depots', async (req, res) => {
  try {
    const { data, error } = await from('supervisors')
      .select('depot')
      .notNull('depot')
      .execute();

    if (error) throw error;

    // Get unique depots
    const depots = [...new Set(data.map(supervisor => supervisor.depot))].sort();

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

    const { data, error } = await from('supervisors')
      .select('id, name, email, depot, badge_number')
      .eq('is_active', true)
      .limit(parseInt(limit))
      .execute();

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

// GET /api/auth/pending-signups - Get all pending supervisor signups (Admin only)
router.get('/pending-signups', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await from('supervisors')
      .select('*')
      .eq('pending_approval', true)
      .order('signup_date', 'DESC')
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });
  } catch (error) {
    console.error('Error fetching pending signups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending signups'
    });
  }
});

// POST /api/auth/approve-signup - Approve a pending supervisor signup (Admin only)
router.post('/approve-signup', authenticateAdmin, async (req, res) => {
  try {
    const { supervisorId, approved = true } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        error: 'Supervisor ID is required',
        code: 'MISSING_SUPERVISOR_ID'
      });
    }

    // Get the supervisor record
    const { data: supervisor, error: fetchError } = await from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .single();

    if (fetchError || !supervisor) {
      return res.status(404).json({
        error: 'Supervisor not found',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    if (!supervisor.pending_approval) {
      return res.status(400).json({
        error: 'Supervisor is not pending approval',
        code: 'NOT_PENDING'
      });
    }

    if (approved) {
      // Approve the supervisor
      try {
        await update('supervisors', {
          is_active: true,
          pending_approval: false,
          approved_date: new Date().toISOString()
        }, {
          id: supervisorId
        });
      } catch (updateError) {
        throw updateError;
      }

      console.log(`✅ Supervisor approved: ${supervisor.name} (${supervisor.email})`);

      res.json({
        success: true,
        message: 'Supervisor approved successfully',
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          is_active: true,
          pending_approval: false
        }
      });
    } else {
      // Reject the supervisor - delete from table
      try {
        await remove('supervisors', { id: supervisorId });
      } catch (deleteError) {
        throw deleteError;
      }

      console.log(`❌ Supervisor rejected: ${supervisor.name} (${supervisor.email})`);

      res.json({
        success: true,
        message: 'Supervisor signup rejected and removed',
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          rejected: true
        }
      });
    }

  } catch (error) {
    console.error('Error processing signup approval:', error);
    res.status(500).json({
      error: 'Failed to process signup approval',
      code: 'APPROVAL_ERROR'
    });
  }
});

// PUT /api/auth/supervisor/:id - Update supervisor details (Admin only)
router.put('/supervisor/:id', authenticateAdmin, async (req, res) => {
  try {
    const supervisorId = req.params.id;
    const { name, email, depot, role, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (depot !== undefined) updateData.depot = depot;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    try {
      await update('supervisors', updateData, { id: supervisorId });
    } catch (error) {
      throw error;
    }

    // Fetch updated supervisor
    const { data: updatedSupervisor } = await from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .single();

    if (!updatedSupervisor) {
      return res.status(404).json({
        error: 'Supervisor not found',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    console.log(`🔄 Supervisor updated: ${updatedSupervisor.name} (${updatedSupervisor.email})`);

    res.json({
      success: true,
      message: 'Supervisor updated successfully',
      supervisor: updatedSupervisor
    });

  } catch (error) {
    console.error('Error updating supervisor:', error);
    res.status(500).json({
      error: 'Failed to update supervisor',
      code: 'UPDATE_ERROR'
    });
  }
});

// POST /api/auth/change-password - Change password for logged-in supervisor
router.post('/change-password', verifyToken, validate(authSchemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;

    // Validate required fields
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Email, current password, and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Fetch supervisor
    const { data: supervisor, error: fetchError } = await from('supervisors')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !supervisor) {
      return res.status(404).json({
        error: 'Supervisor not found',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, supervisor.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    try {
      await update('supervisors', {
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      }, {
        id: supervisor.id
      });
    } catch (updateError) {
      console.error('❌ Failed to update password:', updateError);
      return res.status(500).json({
        error: 'Failed to update password. Please try again.',
        code: 'UPDATE_FAILED',
        details: updateError.message
      });
    }

    console.log(`🔑 Password changed for ${email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({
      error: 'Password change failed. Please try again.',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// GET /api/supervisors/:id/stats - Get supervisor-specific statistics
router.get('/supervisors/:id/stats', async (req, res) => {
  try {
    const supervisorId = req.params.id;

    // Get supervisor details first
    const { data: supervisor, error: supervisorError } = await from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .or(`badge_number.eq.${supervisorId}`)
      .single();

    if (supervisorError || !supervisor) {
      console.log(`Supervisor not found: ${supervisorId}`);
      return res.status(404).json({
        error: 'Supervisor not found',
        code: 'SUPERVISOR_NOT_FOUND'
      });
    }

    // Get breakdown counts for this supervisor
    const today = new Date().toISOString().split('T')[0];

    // Get active breakdowns
    const { data: activeBreakdowns } = await from('breakdowns')
      .select('id')
      .eq('supervisor_id', supervisor.id)
      .in('status', ['in_progress', 'pending', 'dispatched'])
      .execute();

    // Get today's breakdowns
    const { data: todayBreakdowns } = await from('breakdowns')
      .select('id')
      .eq('supervisor_id', supervisor.id)
      .gte('created_at', `${today}T00:00:00`)
      .execute();

    // Get resolved breakdowns
    const { data: resolvedBreakdowns } = await from('breakdowns')
      .select('id')
      .eq('supervisor_id', supervisor.id)
      .eq('status', 'completed')
      .execute();

    // Calculate response time (mock for now)
    const avgResponseMinutes = Math.floor(Math.random() * 15) + 5;
    const responseTime = `00:${String(avgResponseMinutes).padStart(2, '0')}`;

    // Fleet health metrics (mock for now)
    const fleetHealth = 85 + Math.floor(Math.random() * 15);
    const onRoute = Math.floor(Math.random() * 50) + 150;
    const depotCount = Math.floor(Math.random() * 10) + 5;

    const stats = {
      active: activeBreakdowns?.length || 0,
      today: todayBreakdowns?.length || 0,
      resolved: resolvedBreakdowns?.length || 0,
      responseTime,
      fleetHealth,
      onRoute,
      depot: depotCount,
      avgResponseTime: avgResponseMinutes,
      supervisorName: supervisor.name,
      supervisorDepot: supervisor.depot
    };

    console.log(`📊 Supervisor stats fetched for ${supervisor.name} (${supervisorId})`);
    res.json(stats);

  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({
      error: 'Failed to fetch supervisor statistics',
      code: 'STATS_ERROR'
    });
  }
});

// POST /api/auth/admin/reset-password - Admin-only password reset
router.post('/admin/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log('🔐 Password reset request for:', email);

    // Validate required fields
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Find supervisor by email
    const { data: supervisor, error: findError } = await from('supervisors')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !supervisor) {
      return res.status(404).json({
        success: false,
        error: 'User not found with that email',
        code: 'USER_NOT_FOUND'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Format datetime for MySQL (YYYY-MM-DD HH:MM:SS)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Update password
    try {
      await update('supervisors', {
        password_hash: passwordHash,
        updated_at: now
      }, {
        id: supervisor.id
      });
    } catch (updateError) {
      console.error('❌ Failed to update password:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update password',
        code: 'PASSWORD_UPDATE_ERROR',
        details: updateError.message
      });
    }

    console.log(`✅ Password reset by admin for: ${email}`);

    res.json({
      success: true,
      message: 'Password updated successfully',
      user: {
        email: supervisor.email,
        id: supervisor.id
      }
    });

  } catch (error) {
    console.error('❌ Admin password reset error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      code: 'RESET_ERROR',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Apply rate limit clearing middleware after successful login
router.use(clearLoginAttempts);

// GET /api/auth/duties - Get available duty shifts
router.get('/duties', async (req, res) => {
  try {
    const duties = Object.values(dutyManager.DUTY_SHIFTS).map(duty => ({
      code: duty.code,
      startTime: duty.startTime,
      endTime: duty.endTime,
      description: duty.description
    }));

    res.json({
      success: true,
      duties
    });
  } catch (error) {
    console.error('Error fetching duties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch duties'
    });
  }
});

// GET /api/auth/shift-warning - Check if supervisor should see shift ending warning
router.get('/shift-warning', async (req, res) => {
  try {
    const supervisorId = req.user?.id || req.query.supervisorId;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID required'
      });
    }

    const warning = await dutyManager.checkShiftEndingWarning(supervisorId);

    res.json({
      success: true,
      warning: warning || { shouldWarn: false }
    });
  } catch (error) {
    console.error('Error checking shift warning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check shift warning'
    });
  }
});

// POST /api/auth/end-shift - End supervisor's current shift
router.post('/end-shift', async (req, res) => {
  try {
    const supervisorId = req.user?.id || req.body.supervisorId;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID required'
      });
    }

    // Get supervisor info before ending shift (for audit trail)
    const { data: supervisorInfo } = await from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .single();

    const result = await dutyManager.endShift(supervisorId);

    // Phase 9.2: Log to duty audit trail
    if (supervisorInfo && supervisorInfo.current_duty) {
      const now = new Date();
      let overtimeMinutes = 0;

      if (supervisorInfo.duty_end_time) {
        const scheduledEnd = new Date(supervisorInfo.duty_end_time);
        if (now > scheduledEnd) {
          overtimeMinutes = Math.floor((now - scheduledEnd) / 60000);
        }
      }

      await logAuditEvent({
        supervisorId: supervisorInfo.id,
        supervisorBadge: supervisorInfo.badge_number,
        supervisorName: supervisorInfo.name,
        supervisorDepot: supervisorInfo.depot,
        actionType: AUDIT_ACTIONS.DUTY_END,
        dutyCode: supervisorInfo.current_duty,
        dutyName: dutyManager.getDutyName(supervisorInfo.current_duty),
        shiftStartTime: supervisorInfo.duty_start_time ? new Date(supervisorInfo.duty_start_time).toTimeString().slice(0, 5) : null,
        shiftEndTime: supervisorInfo.duty_end_time ? new Date(supervisorInfo.duty_end_time).toTimeString().slice(0, 5) : null,
        actualEndTime: now,
        overtimeMinutes,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        notes: overtimeMinutes > 0 ? `Shift ended ${overtimeMinutes} minutes after scheduled end` : 'Shift ended on time',
        metadata: {
          endMethod: 'explicit_end_shift',
          breakdownsHandled: result.breakdownsHandled || 0
        }
      });
    }

    res.json({
      success: true,
      message: `Shift ended for ${result.supervisorName}`,
      data: result
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end shift'
    });
  }
});

// GET /api/auth/active-supervisors - Get supervisors currently on shift
router.get('/active-supervisors', async (req, res) => {
  try {
    const { duty } = req.query;
    const supervisors = await dutyManager.getActiveSupervisors(duty);

    res.json({
      success: true,
      supervisors,
      count: supervisors.length
    });
  } catch (error) {
    console.error('Error fetching active supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active supervisors'
    });
  }
});

// GET /api/auth/shift-history - Get shift history for reporting
router.get('/shift-history', async (req, res) => {
  try {
    const filters = {
      supervisorId: req.query.supervisorId,
      duty: req.query.duty,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const history = await dutyManager.getShiftHistory(filters);

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching shift history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shift history'
    });
  }
});

// GET /api/auth/current-duty - Get supervisor's current duty information
router.get('/current-duty', verifyToken, async (req, res) => {
  try {
    const supervisorId = req.user.id;

    console.log(`📊 Fetching current duty for supervisor ${supervisorId}`);

    // Get supervisor's current duty from database
    const { data: supervisor, error } = await from('supervisors')
      .select('id, name, current_duty, duty_start_time, duty_end_time')
      .eq('id', supervisorId)
      .single();

    if (error || !supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    if (!supervisor.current_duty) {
      return res.json({
        success: true,
        hasDuty: false,
        message: 'No active duty set'
      });
    }

    const dutyInfo = dutyManager.DUTY_SHIFTS[supervisor.current_duty];
    const now = new Date();
    const dutyEnd = new Date(supervisor.duty_end_time);
    const timeRemainingMs = dutyEnd - now;
    const minutesRemaining = Math.floor(timeRemainingMs / 60000);

    res.json({
      success: true,
      hasDuty: true,
      duty_code: supervisor.current_duty,
      duty_name: dutyInfo ? dutyInfo.description : supervisor.current_duty,
      start_time: supervisor.duty_start_time,
      end_time: supervisor.duty_end_time,
      time_remaining_ms: timeRemainingMs,
      minutes_remaining: minutesRemaining,
      locked: true // Duty is always locked once set
    });

  } catch (error) {
    console.error('❌ Error fetching current duty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current duty'
    });
  }
});

// Set duty after login
// POST /api/auth/set-duty
router.post('/set-duty', verifyToken, validate(authSchemas.setDuty), async (req, res) => {
  try {
    console.log('🔄 [set-duty] Request received');
    console.log('📦 [set-duty] Body:', req.body);
    console.log('👤 [set-duty] User:', req.user);

    const { duty } = req.body;
    const supervisorId = req.user.id;

    console.log(`📋 [set-duty] Duty: ${duty}, Supervisor ID: ${supervisorId}`);

    if (!duty) {
      console.error('❌ [set-duty] No duty provided');
      return res.status(400).json({
        success: false,
        error: 'Duty code is required'
      });
    }

    // SECURITY FIX: Normalize duty code (accept 'Duty 100' or '100' format)
    console.log(`🔍 [set-duty] Normalizing duty code: ${duty}`);
    let normalizedDuty;
    try {
      normalizedDuty = dutyManager.normalizeDutyCode(duty);
      console.log(`✅ [set-duty] Duty code normalized: ${duty} -> ${normalizedDuty}`);
    } catch (normalizeError) {
      console.error(`❌ [set-duty] Invalid duty code: ${duty}`);
      return res.status(400).json({
        success: false,
        error: `Invalid duty code: ${duty}`
      });
    }

    // Get supervisor details (including duty_locked_at field for security check)
    console.log(`🔍 [set-duty] Fetching supervisor details for ID: ${supervisorId}`);
    const supervisorResult = await query(
      'SELECT id, name, badge_number, current_duty, duty_locked_at, depot, email, role FROM supervisors WHERE id = ?',
      [supervisorId]
    );

    console.log(`📊 [set-duty] Supervisor query result:`, supervisorResult);

    if (supervisorResult.length === 0) {
      console.error(`❌ [set-duty] Supervisor not found: ${supervisorId}`);
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];
    console.log(`👤 [set-duty] Supervisor found: ${supervisor.name} (${supervisor.badge_number})`);

    // SECURITY FIX: Check if duty is currently locked (prevent mid-shift duty changes)
    if (supervisor.duty_locked_at) {
      const isAdmin = req.supervisor && req.supervisor.role === 'admin';

      if (!isAdmin) {
        // Non-admin supervisors cannot change locked duties
        console.warn(`❌ [set-duty] Duty change blocked: Duty is locked for ${supervisor.name}`);
        return res.status(403).json({
          success: false,
          error: 'Current duty is locked. Contact an administrator to change your duty.',
          code: 'DUTY_LOCKED'
        });
      }

      // Admin override: Log the action for audit trail
      console.log(`⚠️  [set-duty] Admin override: ${req.user?.name} changed locked duty for ${supervisor.name}`);

      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.ADMIN_ACTION,
        action: `admin override duty change (locked) for ${supervisor.name}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: req.user?.badge_number || req.user?.id,
        actorName: req.user?.name,
        depot: req.user?.depot,
        severity: SEVERITY_LEVELS.WARNING,
        source: 'admin_duty_override',
        metadata: {
          targetSupervisor: supervisor.name,
          newDuty: normalizedDuty,
          previousDuty: supervisor.current_duty,
          adminAction: 'duty_change_override'
        }
      });
    }

    // Start the shift (using normalized duty code)
    console.log(`🚀 [set-duty] Starting shift for ${supervisor.name}...`);
    const shiftInfo = await dutyManager.startShift({
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      supervisorBadge: supervisor.badge_number,
      duty: normalizedDuty
    });

    console.log(`✅ [set-duty] Shift started successfully:`, shiftInfo);
    console.log(`✅ Duty set after login: ${supervisor.name} -> Duty ${normalizedDuty}`);

    // Log duty selection to Activity Feed
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.USER_LOGIN,
      action: `started ${normalizedDuty}`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisor.badge_number || supervisor.id,
      actorName: supervisor.name,
      depot: supervisor.depot,
      severity: SEVERITY_LEVELS.INFO,
      source: 'authentication',
      metadata: {
        email: supervisor.email,
        role: supervisor.role,
        duty: normalizedDuty,
        shiftEnd: shiftInfo ? shiftInfo.shiftEnd.toISOString() : null,
        dutyStartTime: new Date().toISOString()
      }
    });

    // Phase 9.2: Log to duty audit trail
    await logAuditEvent({
      supervisorId: supervisor.id,
      supervisorBadge: supervisor.badge_number,
      supervisorName: supervisor.name,
      supervisorDepot: supervisor.depot,
      actionType: AUDIT_ACTIONS.DUTY_START,
      dutyCode: normalizedDuty,
      dutyName: dutyManager.getDutyName(normalizedDuty),
      previousDutyCode: supervisor.current_duty || null,
      shiftStartTime: shiftInfo.shiftStart.toTimeString().slice(0, 5),
      shiftEndTime: shiftInfo.shiftEnd.toTimeString().slice(0, 5),
      actualStartTime: new Date(),
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: {
        email: supervisor.email,
        role: supervisor.role
      }
    });

    // Update supervisor session with duty information (using normalized code)
    try {
      await query(`
        UPDATE supervisor_sessions
        SET
          current_duty = ?,
          duty_start_time = ?,
          duty_end_time = ?,
          last_activity = NOW()
        WHERE supervisor_id = ? AND is_online = TRUE
      `, [
        normalizedDuty,
        shiftInfo.shiftStart.toISOString().slice(0, 19).replace('T', ' '),
        shiftInfo.shiftEnd.toISOString().slice(0, 19).replace('T', ' '),
        supervisor.id
      ]);

      // Broadcast duty change via WebSocket (using normalized code)
      webSocketHandler.broadcast('control-room', {
        type: 'supervisor_duty_change',
        data: {
          supervisor_id: supervisor.id,
          name: supervisor.name,
          badge_number: supervisor.badge_number,
          depot: supervisor.depot,
          new_duty: normalizedDuty,
          duty_start_time: shiftInfo.shiftStart.toISOString(),
          duty_end_time: shiftInfo.shiftEnd.toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (sessionUpdateError) {
      console.error('⚠️  Error updating session with duty:', sessionUpdateError);
      // Don't fail the request if session update fails
    }

    res.json({
      success: true,
      duty: normalizedDuty,
      shiftInfo: {
        duty: shiftInfo.duty,
        shiftStart: shiftInfo.shiftStart,
        shiftEnd: shiftInfo.shiftEnd
      }
    });

  } catch (error) {
    console.error('❌ [set-duty] ERROR:', error);
    console.error('❌ [set-duty] Error stack:', error.stack);
    console.error('❌ [set-duty] Error name:', error.name);
    console.error('❌ [set-duty] Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to set duty',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/admin/reset-password - Admin reset password for supervisor
router.post('/admin/reset-password', verifyToken, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log(`🔐 Admin password reset requested for: ${email}`);

    // Validate required fields
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Get requester's role from JWT token
    const requesterRole = req.user?.role;
    if (requesterRole !== 'admin') {
      console.warn(`⚠️ Non-admin user attempted password reset: ${req.user?.email}`);
      return res.status(403).json({
        success: false,
        error: 'Only administrators can reset passwords'
      });
    }

    // Find supervisor by email
    const { data: supervisor, error: findError } = await from('supervisors')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !supervisor) {
      console.warn(`❌ Password reset failed: No supervisor found with email ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update supervisor password hash
    try {
      await update('supervisors', {
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      }, {
        id: supervisor.id
      });

      console.log(`✅ Password reset successful for ${supervisor.name} (${email})`);

      // Log admin action
      await activityLogger.logActivity({
        activityType: 'ADMIN_ACTION',
        action: `reset password for ${supervisor.name}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: req.user?.badge_number || req.user?.id,
        actorName: req.user?.name,
        depot: req.user?.depot,
        severity: SEVERITY_LEVELS.INFO,
        source: 'admin_settings',
        metadata: {
          targetSupervisor: supervisor.name,
          targetEmail: email,
          actionType: 'password_reset'
        }
      });

      res.json({
        success: true,
        message: `Password successfully reset for ${supervisor.name}`
      });
    } catch (updateError) {
      console.error('❌ Failed to update password hash:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset password. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// GET /api/auth/supervisors/:id/history - Get supervisor activity history
// Admin only - Returns full history of activities, breakdowns, and actions
// =====================================================
router.get('/supervisors/:id/history', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0, dateFrom, dateTo } = req.query;

    // 1. Get supervisor info
    const supervisorResult = await query(
      'SELECT id, name, email, role, depot, badge_number, is_active, created_at FROM supervisors WHERE id = ?',
      [id]
    );

    if (supervisorResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];

    // Build date filter for queries
    let dateFilter = '';
    const dateParams = [];
    if (dateFrom) {
      dateFilter += ' AND created_at >= ?';
      dateParams.push(new Date(dateFrom));
    }
    if (dateTo) {
      dateFilter += ' AND created_at <= ?';
      dateParams.push(new Date(dateTo));
    }

    // 2. Get activities from activities table (where they are the actor)
    const parsedLimit = parseInt(limit) || 100;
    const parsedOffset = parseInt(offset) || 0;

    const activitiesQuery = `
      SELECT id, activity_type, action, actor_name, entity_type, entity_id,
             severity, source, icon, created_at, depot
      FROM activities
      WHERE (actor_id = ? OR actor_id = ?)
      ${dateFilter}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${parsedOffset}
    `;
    const activities = await query(activitiesQuery, [
      supervisor.badge_number,
      supervisor.id,
      ...dateParams
    ]);

    // 3. Get breakdowns they logged
    const breakdownsQuery = `
      SELECT id, breakdown_id, fleet_no, location_description, issue_category,
             severity, status, wizard_decision, created_at, resolved_at, depot
      FROM breakdowns
      WHERE supervisor_badge = ?
      ${dateFilter}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const breakdowns = await query(breakdownsQuery, [supervisor.badge_number, ...dateParams]);

    // 4. Get duty audit log entries
    const auditQuery = `
      SELECT id, action_type, duty_code, duty_name, notes, created_at,
             overtime_minutes, previous_duty_code
      FROM duty_audit_log
      WHERE supervisor_badge = ?
      ${dateFilter}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    let auditEntries = [];
    try {
      auditEntries = await query(auditQuery, [supervisor.badge_number, ...dateParams]);
    } catch (auditError) {
      console.warn('Audit log query failed (table may not exist):', auditError.message);
    }

    // 5. Get login analytics
    const loginQuery = `
      SELECT id, login_time, logout_time, session_duration_minutes,
             ip_address, user_agent, duty_selected
      FROM login_analytics
      WHERE supervisor_id = ?
      ${dateFilter}
      ORDER BY login_time DESC
      LIMIT 30
    `;
    let loginHistory = [];
    try {
      loginHistory = await query(loginQuery, [supervisor.id, ...dateParams]);
    } catch (loginError) {
      console.warn('Login analytics query failed:', loginError.message);
    }

    // 6. Get duty notes they created
    const notesQuery = `
      SELECT id, note, note_type, duty_code, is_priority, breakdown_id, created_at
      FROM duty_notes
      WHERE supervisor_badge = ?
      ${dateFilter}
      ORDER BY created_at DESC
      LIMIT 30
    `;
    let dutyNotes = [];
    try {
      dutyNotes = await query(notesQuery, [supervisor.badge_number, ...dateParams]);
    } catch (notesError) {
      console.warn('Duty notes query failed:', notesError.message);
    }

    // 7. Calculate summary stats
    const stats = {
      totalActivities: activities.length,
      totalBreakdowns: breakdowns.length,
      breakdownsByStatus: {
        active: breakdowns.filter(b => b.status === 'active' || b.status === 'pending').length,
        resolved: breakdowns.filter(b => b.status === 'resolved' || b.status === 'cleared').length
      },
      breakdownsBySeverity: {
        STOP: breakdowns.filter(b => b.severity === 'STOP' || b.wizard_decision === 'STOP').length,
        AMBER: breakdowns.filter(b => b.severity === 'AMBER' || b.wizard_decision === 'AMBER').length,
        CONTINUE: breakdowns.filter(b => b.severity === 'CONTINUE' || b.wizard_decision === 'CONTINUE').length
      },
      totalLoginSessions: loginHistory.length,
      totalDutyNotes: dutyNotes.length,
      priorityNotes: dutyNotes.filter(n => n.is_priority).length
    };

    res.json({
      success: true,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        email: supervisor.email,
        role: supervisor.role,
        depot: supervisor.depot,
        badge_number: supervisor.badge_number,
        is_active: supervisor.is_active,
        member_since: supervisor.created_at
      },
      stats,
      activities,
      breakdowns,
      auditEntries,
      loginHistory,
      dutyNotes,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching supervisor history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// SECURITY FIX: CSRF error handler for invalid/missing CSRF tokens
router.use((error, req, res, next) => {
  if (error.code === 'EBADCSRFTOKEN') {
    console.warn('❌ CSRF token validation failed:', error.message);
    return res.status(403).json({
      success: false,
      error: 'CSRF token validation failed',
      code: 'CSRF_INVALID',
      message: 'Invalid or missing CSRF token. Please refresh and try again.'
    });
  }

  // Pass other errors to next middleware
  next(error);
});

export default router;
