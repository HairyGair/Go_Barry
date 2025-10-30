// Comprehensive Security Service for Go North East Breakdown Management System
// Handles password validation, session security, and suspicious activity detection
// Supabase removed - now uses backend MySQL API

// Security configuration
export const SECURITY_CONFIG = {
  // Password requirements
  password: {
    minLength: 8,
    requireNumber: true,
    requireUppercase: false, // Relaxed for supervisors
    requireLowercase: false,
    requireSpecialChar: false,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Session security
  session: {
    maxDuration: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours
    maxConcurrentSessions: 3,
    suspiciousActivityThreshold: 5
  },

  // Device tracking
  device: {
    trackFingerprint: true,
    allowNewDevices: true,
    requireDeviceVerification: false
  },

  // Rate limiting
  rateLimit: {
    loginAttempts: 5,
    loginWindow: 15 * 60 * 1000, // 15 minutes
    apiRequests: 100,
    apiWindow: 60 * 1000 // 1 minute
  }
}

// Password validation service
export class PasswordValidator {
  static validate(password) {
    const results = {
      isValid: true,
      score: 0,
      issues: [],
      suggestions: []
    }

    // Check minimum length
    if (password.length < SECURITY_CONFIG.password.minLength) {
      results.isValid = false
      results.issues.push(`Password must be at least ${SECURITY_CONFIG.password.minLength} characters long`)
      results.suggestions.push('Use a longer password')
    } else {
      results.score += 20
    }

    // Check for numbers
    if (SECURITY_CONFIG.password.requireNumber) {
      if (!/\d/.test(password)) {
        results.isValid = false
        results.issues.push('Password must contain at least one number')
        results.suggestions.push('Add a number (0-9)')
      } else {
        results.score += 20
      }
    }

    // Check for uppercase (optional)
    if (SECURITY_CONFIG.password.requireUppercase) {
      if (!/[A-Z]/.test(password)) {
        results.isValid = false
        results.issues.push('Password must contain at least one uppercase letter')
        results.suggestions.push('Add an uppercase letter (A-Z)')
      } else {
        results.score += 15
      }
    }

    // Check for lowercase (optional)
    if (SECURITY_CONFIG.password.requireLowercase) {
      if (!/[a-z]/.test(password)) {
        results.isValid = false
        results.issues.push('Password must contain at least one lowercase letter')
        results.suggestions.push('Add a lowercase letter (a-z)')
      } else {
        results.score += 15
      }
    }

    // Check for special characters (optional)
    if (SECURITY_CONFIG.password.requireSpecialChar) {
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        results.isValid = false
        results.issues.push('Password must contain at least one special character')
        results.suggestions.push('Add a special character (!@#$%^&*)')
      } else {
        results.score += 20
      }
    }

    // Additional strength checks
    if (password.length >= 12) {
      results.score += 10
    }

    if (/\d.*\d/.test(password)) {
      results.score += 5 // Multiple numbers
    }

    if (/[A-Z].*[A-Z]/.test(password)) {
      results.score += 5 // Multiple uppercase
    }

    // Check for common patterns
    if (this.isCommonPassword(password)) {
      results.score -= 30
      results.suggestions.push('Avoid common passwords')
    }

    if (this.hasRepeatingCharacters(password)) {
      results.score -= 10
      results.suggestions.push('Avoid repeating characters')
    }

    if (this.hasSequentialCharacters(password)) {
      results.score -= 10
      results.suggestions.push('Avoid sequential characters')
    }

    // Calculate strength level
    results.strength = this.getStrengthLevel(results.score)

    return results
  }

  static isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'supervisor', 'breakdown', 'gonortheast', 'gne123'
    ]

    return commonPasswords.some(common =>
      password.toLowerCase().includes(common.toLowerCase())
    )
  }

  static hasRepeatingCharacters(password) {
    return /(.)\1{2,}/.test(password) // 3 or more repeating characters
  }

  static hasSequentialCharacters(password) {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i)
      const char2 = password.charCodeAt(i + 1)
      const char3 = password.charCodeAt(i + 2)

      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true // Sequential ascending
      }

      if (char2 === char1 - 1 && char3 === char2 - 1) {
        return true // Sequential descending
      }
    }
    return false
  }

  static getStrengthLevel(score) {
    if (score >= 80) return 'very-strong'
    if (score >= 60) return 'strong'
    if (score >= 40) return 'medium'
    if (score >= 20) return 'weak'
    return 'very-weak'
  }

  static getStrengthColor(strength) {
    const colors = {
      'very-strong': '#00C851',
      'strong': '#2BBBAD',
      'medium': '#FF8800',
      'weak': '#FF4444',
      'very-weak': '#CC0000'
    }
    return colors[strength] || '#999999'
  }

  static getStrengthMessage(strength) {
    const messages = {
      'very-strong': 'Excellent! Your password is very strong',
      'strong': 'Good! Your password is strong',
      'medium': 'Your password is moderately strong',
      'weak': 'Your password is weak - consider strengthening it',
      'very-weak': 'Your password is very weak - please strengthen it'
    }
    return messages[strength] || 'Password strength unknown'
  }
}

// Session security manager
export class SessionSecurityManager {
  constructor() {
    this.sessions = new Map()
    this.suspiciousActivity = new Map()
    this.deviceFingerprints = new Map()
    this.initializeMonitoring()
  }

  initializeMonitoring() {
    // Monitor user activity
    this.setupActivityTracking()

    // Check for session expiration every minute
    setInterval(() => {
      this.checkSessionExpiration()
    }, 60000)

    // Clean up old activity logs every hour
    setInterval(() => {
      this.cleanupActivityLogs()
    }, 3600000)
  }

  setupActivityTracking() {
    // Track mouse movement, clicks, and keyboard activity
    let lastActivity = Date.now()

    const updateActivity = () => {
      lastActivity = Date.now()
      this.updateSessionActivity()
    }

    // Add event listeners for activity detection
    document.addEventListener('mousedown', updateActivity)
    document.addEventListener('mousemove', updateActivity)
    document.addEventListener('keydown', updateActivity)
    document.addEventListener('scroll', updateActivity)
    document.addEventListener('touchstart', updateActivity)

    // Check for inactivity every 30 seconds
    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity
      if (inactiveTime > SECURITY_CONFIG.session.inactivityTimeout) {
        this.handleInactiveSession()
      }
    }, 30000)
  }

  async createSession(user, deviceInfo = {}) {
    const sessionId = this.generateSessionId()
    const now = Date.now()
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo)

    const session = {
      id: sessionId,
      userId: user.id,
      userEmail: user.email,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + SECURITY_CONFIG.session.maxDuration,
      deviceFingerprint,
      deviceInfo,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      isActive: true,
      suspiciousActivityCount: 0
    }

    // Check for concurrent sessions
    await this.manageConcurrentSessions(user.id)

    // Store session
    this.sessions.set(sessionId, session)

    // Log session creation
    await this.logSecurityEvent('session_created', {
      sessionId,
      userId: user.id,
      deviceFingerprint,
      ipAddress: session.ipAddress
    })

    console.log('✅ Session created:', sessionId)
    return session
  }

  async validateSession(sessionId) {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return { valid: false, reason: 'session_not_found' }
    }

    if (!session.isActive) {
      return { valid: false, reason: 'session_inactive' }
    }

    if (Date.now() > session.expiresAt) {
      await this.invalidateSession(sessionId, 'expired')
      return { valid: false, reason: 'session_expired' }
    }

    const inactiveTime = Date.now() - session.lastActivity
    if (inactiveTime > SECURITY_CONFIG.session.inactivityTimeout) {
      await this.invalidateSession(sessionId, 'inactive')
      return { valid: false, reason: 'session_inactive_timeout' }
    }

    // Check for suspicious activity
    if (session.suspiciousActivityCount >= SECURITY_CONFIG.session.suspiciousActivityThreshold) {
      await this.invalidateSession(sessionId, 'suspicious_activity')
      return { valid: false, reason: 'suspicious_activity' }
    }

    return { valid: true, session }
  }

  async invalidateSession(sessionId, reason = 'manual') {
    const session = this.sessions.get(sessionId)

    if (session) {
      session.isActive = false
      session.invalidatedAt = Date.now()
      session.invalidationReason = reason

      // Log session invalidation
      await this.logSecurityEvent('session_invalidated', {
        sessionId,
        userId: session.userId,
        reason,
        duration: Date.now() - session.createdAt
      })

      console.log(`🚪 Session invalidated: ${sessionId} (${reason})`)
    }

    return true
  }

  async manageConcurrentSessions(userId) {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive)
      .sort((a, b) => b.lastActivity - a.lastActivity)

    if (userSessions.length >= SECURITY_CONFIG.session.maxConcurrentSessions) {
      // Invalidate oldest sessions
      const sessionsToInvalidate = userSessions.slice(SECURITY_CONFIG.session.maxConcurrentSessions - 1)

      for (const session of sessionsToInvalidate) {
        await this.invalidateSession(session.id, 'concurrent_limit')
      }

      await this.logSecurityEvent('concurrent_sessions_limited', {
        userId,
        invalidatedCount: sessionsToInvalidate.length,
        maxAllowed: SECURITY_CONFIG.session.maxConcurrentSessions
      })
    }
  }

  generateSessionId() {
    return 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  generateDeviceFingerprint(deviceInfo) {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...deviceInfo
    }

    return btoa(JSON.stringify(fingerprint)).replace(/[+/=]/g, '')
  }

  async getClientIP() {
    try {
      // In production, this would get the real IP from headers
      // For now, return a placeholder
      return 'client_ip_placeholder'
    } catch (error) {
      return 'unknown'
    }
  }

  updateSessionActivity() {
    // Update activity for current session
    const currentSession = this.getCurrentSession()
    if (currentSession) {
      currentSession.lastActivity = Date.now()
    }
  }

  getCurrentSession() {
    // Get current session from storage or context
    // This would integrate with your auth system
    return null // Placeholder
  }

  async handleInactiveSession() {
    console.log('⚠️ User inactive - considering session timeout')

    // You could show a warning dialog here
    const session = this.getCurrentSession()
    if (session) {
      await this.logSecurityEvent('session_inactive_warning', {
        sessionId: session.id,
        userId: session.userId,
        inactiveTime: Date.now() - session.lastActivity
      })
    }
  }

  checkSessionExpiration() {
    const now = Date.now()

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.isActive && now > session.expiresAt) {
        this.invalidateSession(sessionId, 'expired')
      }
    }
  }

  cleanupActivityLogs() {
    // Clean up old suspicious activity logs
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours

    for (const [key, activities] of this.suspiciousActivity.entries()) {
      const filtered = activities.filter(activity => activity.timestamp > cutoff)
      if (filtered.length === 0) {
        this.suspiciousActivity.delete(key)
      } else {
        this.suspiciousActivity.set(key, filtered)
      }
    }
  }

  async detectSuspiciousActivity(userId, activityType, details = {}) {
    const now = Date.now()
    const activities = this.suspiciousActivity.get(userId) || []

    const newActivity = {
      type: activityType,
      timestamp: now,
      details
    }

    activities.push(newActivity)
    this.suspiciousActivity.set(userId, activities)

    // Check for suspicious patterns
    const recentActivities = activities.filter(a => now - a.timestamp < 3600000) // Last hour

    let suspiciousScore = 0

    // Multiple failed logins
    const failedLogins = recentActivities.filter(a => a.type === 'failed_login').length
    if (failedLogins >= 3) {
      suspiciousScore += failedLogins * 10
    }

    // Rapid requests
    const rapidRequests = recentActivities.filter(a => now - a.timestamp < 60000).length
    if (rapidRequests >= 20) {
      suspiciousScore += 20
    }

    // New device login
    if (activityType === 'new_device_login') {
      suspiciousScore += 15
    }

    // Unusual hours
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      suspiciousScore += 5
    }

    if (suspiciousScore >= 30) {
      await this.logSecurityEvent('suspicious_activity_detected', {
        userId,
        score: suspiciousScore,
        activities: recentActivities,
        activityType
      })

      // Invalidate all user sessions
      await this.invalidateAllUserSessions(userId, 'suspicious_activity')

      return { suspicious: true, score: suspiciousScore }
    }

    return { suspicious: false, score: suspiciousScore }
  }

  async invalidateAllUserSessions(userId, reason = 'security') {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive)

    for (const session of userSessions) {
      await this.invalidateSession(session.id, reason)
    }

    await this.logSecurityEvent('all_sessions_invalidated', {
      userId,
      reason,
      sessionCount: userSessions.length
    })
  }

  async logSecurityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    }

    console.log(`🔒 Security Event: ${eventType}`, data)

    // In production, send to logging service
    try {
      // await this.sendToLoggingService(event)
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

// Create singleton instances with proper method binding
export const passwordValidator = {
  validate: (password) => PasswordValidator.validate(password),
  isCommonPassword: (password) => PasswordValidator.isCommonPassword(password),
  hasRepeatingCharacters: (password) => PasswordValidator.hasRepeatingCharacters(password),
  hasSequentialCharacters: (password) => PasswordValidator.hasSequentialCharacters(password),
  getStrengthLevel: (score) => PasswordValidator.getStrengthLevel(score),
  getStrengthColor: (strength) => PasswordValidator.getStrengthColor(strength),
  getStrengthMessage: (strength) => PasswordValidator.getStrengthMessage(strength)
}
export const sessionSecurity = new SessionSecurityManager()

// Rate limiting service
export class RateLimiter {
  constructor() {
    this.attempts = new Map()
  }

  checkLimit(key, maxAttempts, windowMs) {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs)

    if (validAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validAttempts[0] + windowMs
      }
    }

    // Add current attempt
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)

    return {
      allowed: true,
      remaining: maxAttempts - validAttempts.length,
      resetTime: now + windowMs
    }
  }

  clearAttempts(key) {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Security utilities
export const SecurityUtils = {
  // Generate secure random string
  generateSecureRandom(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => chars[byte % chars.length]).join('')
  },

  // Hash sensitive data (for storage)
  async hashData(data) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  // Check if running in secure context
  isSecureContext() {
    return window.isSecureContext || location.protocol === 'https:'
  },

  // Generate CSP nonce
  generateNonce() {
    return this.generateSecureRandom(16)
  }
}

// Export security service
export default {
  PasswordValidator,
  SessionSecurityManager,
  RateLimiter,
  SecurityUtils,
  SECURITY_CONFIG,
  passwordValidator,
  sessionSecurity,
  rateLimiter
}