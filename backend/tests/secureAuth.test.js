// backend/tests/secureAuth.test.js
// Unit tests for secure authentication utilities

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken, 
  generateSessionId, 
  createSecureSession, 
  isSessionValid, 
  sanitizeSessionForClient, 
  validateInput, 
  checkRateLimit 
} from '../utils/secureAuth.js';

describe('Secure Authentication Utilities', () => {
  
  describe('Password Hashing', () => {
    it('should hash a password securely', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      assert.ok(hash, 'Hash should be generated');
      assert.notStrictEqual(hash, password, 'Hash should not equal plain password');
      assert.ok(hash.startsWith('$2b$'), 'Should use bcrypt format');
      assert.ok(hash.length > 50, 'Hash should be sufficiently long');
    });

    it('should throw error for empty password', async () => {
      await assert.rejects(
        async () => await hashPassword(''),
        /Password is required/,
        'Should reject empty password'
      );
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      assert.notStrictEqual(hash1, hash2, 'Hashes should be unique due to salt');
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      assert.strictEqual(isValid, true, 'Should verify correct password');
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      assert.strictEqual(isValid, false, 'Should reject incorrect password');
    });

    it('should return false for invalid inputs', async () => {
      const result1 = await verifyPassword('', 'somehash');
      const result2 = await verifyPassword('password', '');
      const result3 = await verifyPassword('', '');
      
      assert.strictEqual(result1, false, 'Should reject empty password');
      assert.strictEqual(result2, false, 'Should reject empty hash');
      assert.strictEqual(result3, false, 'Should reject both empty');
    });
  });

  describe('Token Generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      assert.ok(token1, 'Token should be generated');
      assert.ok(token2, 'Token should be generated');
      assert.notStrictEqual(token1, token2, 'Tokens should be unique');
      assert.strictEqual(token1.length, 128, 'Token should be 128 chars (64 bytes hex)');
      assert.ok(/^[a-f0-9]+$/.test(token1), 'Token should be hex string');
    });

    it('should generate session IDs with supervisor prefix', () => {
      const supervisorId = 'supervisor001';
      const sessionId1 = generateSessionId(supervisorId);
      const sessionId2 = generateSessionId(supervisorId);
      
      assert.ok(sessionId1.startsWith('sess_'), 'Session ID should have proper prefix');
      assert.ok(sessionId2.startsWith('sess_'), 'Session ID should have proper prefix');
      assert.notStrictEqual(sessionId1, sessionId2, 'Session IDs should be unique');
      assert.strictEqual(sessionId1.length, 37, 'Session ID should be correct length (sess_ + 32 chars)');
    });
  });

  describe('Session Management', () => {
    it('should create valid session record', () => {
      const supervisorId = 'supervisor001';
      const badge = 'AG003';
      const name = 'Anthony Gair';
      
      const session = createSecureSession(supervisorId, badge, name);
      
      assert.strictEqual(session.supervisorId, supervisorId);
      assert.strictEqual(session.badge, badge);
      assert.strictEqual(session.name, name);
      assert.ok(session.sessionId);
      assert.ok(session.sessionToken);
      assert.strictEqual(session.isValid, true);
      assert.ok(session.createdAt > 0);
      assert.ok(session.expiresAt > session.createdAt);
    });

    it('should validate fresh session', () => {
      const session = createSecureSession('supervisor001', 'AG003', 'Test User');
      const isValid = isSessionValid(session);
      
      assert.strictEqual(isValid, true, 'Fresh session should be valid');
    });

    it('should reject expired session', () => {
      const session = createSecureSession('supervisor001', 'AG003', 'Test User');
      session.expiresAt = Date.now() - 1000; // Expired 1 second ago
      
      const isValid = isSessionValid(session);
      assert.strictEqual(isValid, false, 'Expired session should be invalid');
    });

    it('should reject inactive session', () => {
      const session = createSecureSession('supervisor001', 'AG003', 'Test User');
      session.lastActivity = Date.now() - (11 * 60 * 1000); // 11 minutes ago
      
      const isValid = isSessionValid(session);
      assert.strictEqual(isValid, false, 'Inactive session should be invalid');
    });

    it('should sanitize session for client', () => {
      const session = createSecureSession('supervisor001', 'AG003', 'Test User');
      const sanitized = sanitizeSessionForClient(session);
      
      assert.strictEqual(sanitized.supervisorId, session.supervisorId);
      assert.strictEqual(sanitized.badge, session.badge);
      assert.strictEqual(sanitized.name, session.name);
      assert.strictEqual(sanitized.sessionToken, undefined, 'Token should be removed');
      assert.strictEqual(sanitized.sessionId, undefined, 'Session ID should be removed');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid inputs', () => {
      assert.strictEqual(validateInput('supervisor001'), true);
      assert.strictEqual(validateInput('AG003'), true);
      assert.strictEqual(validateInput('Normal text'), true);
    });

    it('should reject dangerous SQL injection patterns', () => {
      assert.strictEqual(validateInput("'; DROP TABLE users; --"), false);
      assert.strictEqual(validateInput("' OR 1=1 --"), false);
      assert.strictEqual(validateInput("SELECT * FROM"), false);
      assert.strictEqual(validateInput("DELETE FROM"), false);
      assert.strictEqual(validateInput("INSERT INTO"), false);
      assert.strictEqual(validateInput("UPDATE SET"), false);
    });

    it('should reject XSS patterns', () => {
      assert.strictEqual(validateInput('<script>alert("xss")</script>'), false);
      assert.strictEqual(validateInput('javascript:alert(1)'), false);
      assert.strictEqual(validateInput('onclick=alert(1)'), false);
      assert.strictEqual(validateInput('onerror=alert(1)'), false);
    });

    it('should reject invalid types', () => {
      assert.strictEqual(validateInput(null), false);
      assert.strictEqual(validateInput(undefined), false);
      assert.strictEqual(validateInput(123), false);
      assert.strictEqual(validateInput({}), false);
      assert.strictEqual(validateInput([]), false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const key = 'test-user-1';
      const result = checkRateLimit(key, 5, 60000); // 5 attempts per minute
      
      assert.strictEqual(result.isAllowed, true);
      assert.strictEqual(result.attempts, 1);
      assert.strictEqual(result.remaining, 4);
      assert.ok(result.resetIn > 0);
    });

    it('should track multiple attempts', () => {
      const key = 'test-user-2';
      
      // Make multiple requests
      checkRateLimit(key, 3, 60000);
      checkRateLimit(key, 3, 60000);
      const result = checkRateLimit(key, 3, 60000);
      
      assert.strictEqual(result.attempts, 3);
      assert.strictEqual(result.remaining, 0);
      assert.strictEqual(result.isAllowed, true, 'Should still allow at limit');
    });

    it('should block when limit exceeded', () => {
      const key = 'test-user-3';
      
      // Exceed the limit
      checkRateLimit(key, 2, 60000);
      checkRateLimit(key, 2, 60000);
      const result = checkRateLimit(key, 2, 60000); // This should be blocked
      
      assert.strictEqual(result.isAllowed, false);
      assert.strictEqual(result.attempts, 3);
      assert.strictEqual(result.remaining, 0);
    });

    it('should reset after time window', () => {
      const key = 'test-user-4';
      
      // Use a very short window for testing
      const shortWindow = 10; // 10ms
      
      checkRateLimit(key, 1, shortWindow);
      const blockedResult = checkRateLimit(key, 1, shortWindow);
      assert.strictEqual(blockedResult.isAllowed, false);
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const resetResult = checkRateLimit(key, 1, shortWindow);
          assert.strictEqual(resetResult.isAllowed, true);
          assert.strictEqual(resetResult.attempts, 1);
          resolve();
        }, 15);
      });
    });
  });
});

// Export for potential use in other test files
export default describe;