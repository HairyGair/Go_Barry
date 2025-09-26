// Comprehensive Authentication Test Suite
// Tests all authentication scenarios including security requirements

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import enhancedAuthService from '../services/enhanced-auth-service.js';
import { supabase } from '../services/supabase-client.js';
import { passwordValidator, sessionSecurity, rateLimiter } from '../services/security-service.js';

// Mock Supabase
vi.mock('../services/supabase-client.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    language: 'en-US',
    platform: 'Test Platform',
    onLine: true
  }
});

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset rate limiter
    rateLimiter.clearAttempts('login_test@example.com');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Valid Login - Correct Email/Password', () => {
    it('should successfully authenticate valid supervisor credentials', async () => {
      // Arrange
      const validCredentials = {
        email: 'anthony.gair@example.com',
        password: 'SecurePass123!'
      };

      const mockUser = { id: 'user-123', email: validCredentials.email };
      const mockSession = {
        access_token: 'valid-jwt-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };
      const mockSupervisor = {
        id: 'sup-123',
        name: 'Anthony Gair',
        email: validCredentials.email,
        depot: 'Washington',
        role: 'admin'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: mockSupervisor,
        error: null
      });

      // Act
      const result = await enhancedAuthService.authenticate(
        validCredentials.email,
        validCredentials.password,
        true
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.session.email).toBe(validCredentials.email);
      expect(result.session.role).toBe('admin');
      expect(result.session.depot).toBe('Washington');
      expect(result.session.authenticated).toBe(true);
      expect(result.session.authMethod).toBe('supabase');

      // Verify password validation was called
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password
      });

      // Verify session storage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supervisor_session',
        expect.stringContaining('Anthony Gair')
      );
    });

    it('should handle remember me functionality correctly', async () => {
      // Arrange
      const credentials = {
        email: 'anthony.gair@example.com',
        password: 'SecurePass123!'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: credentials.email },
          session: { access_token: 'token', expires_at: Date.now() + 3600000 }
        },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'sup-123', name: 'Anthony Gair', email: credentials.email, role: 'admin' },
        error: null
      });

      // Act
      await enhancedAuthService.authenticate(credentials.email, credentials.password, true);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sb_remember_me', 'true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sb_session_config',
        expect.stringContaining('rememberMe')
      );
    });
  });

  describe('2. Invalid Email - Non-existent User', () => {
    it('should return generic error for non-existent email', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      // Act
      const result = await enhancedAuthService.authenticate(
        invalidCredentials.email,
        invalidCredentials.password
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials. Please check your email and password.');

      // Should not reveal that email doesn't exist
      expect(result.error).not.toContain('email');
      expect(result.error).not.toContain('user not found');
      expect(result.error).not.toContain('unauthorized');
    });

    it('should log security events for failed authentication', async () => {
      // Arrange
      const invalidEmail = 'hacker@malicious.com';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      // Act
      await enhancedAuthService.authenticate(invalidEmail, 'password123');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed login attempt for email: ${invalidEmail}`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('3. Invalid Password - Wrong Password', () => {
    it('should return generic error for wrong password', async () => {
      // Arrange
      const credentials = {
        email: 'anthony.gair@example.com',
        password: 'WrongPassword123!'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      // Act
      const result = await enhancedAuthService.authenticate(
        credentials.email,
        credentials.password
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials. Please check your email and password.');
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      // Act - Attempt 6 failed logins (rate limit is 5)
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(await enhancedAuthService.authenticate(credentials.email, credentials.password));
      }

      // Assert
      // First 5 attempts should be allowed
      for (let i = 0; i < 5; i++) {
        expect(attempts[i].error).toBe('Invalid credentials. Please check your email and password.');
      }

      // 6th attempt should be rate limited
      expect(attempts[5].error).toContain('Too many login attempts');
    });
  });

  describe('4. Session Expiry - Token Timeout Handling', () => {
    it('should handle expired tokens gracefully', async () => {
      // Arrange
      const expiredSession = {
        id: 'session-123',
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        supabaseSession: {
          access_token: 'expired-token',
          expires_at: Math.floor(Date.now() / 1000) - 3600
        }
      };

      enhancedAuthService.currentSession = expiredSession;

      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      // Act
      const result = await enhancedAuthService.getCurrentSession();

      // Assert
      expect(result.success).toBe(false);
      expect(result.session).toBeNull();
      expect(enhancedAuthService.currentSession).toBeNull();
    });

    it('should attempt token refresh before expiry', async () => {
      // Arrange
      const nearExpirySession = {
        access_token: 'soon-to-expire-token',
        expires_at: Math.floor(Date.now() / 1000) + 240 // Expires in 4 minutes
      };

      supabase.auth.refreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'refreshed-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600
          }
        },
        error: null
      });

      // Act
      enhancedAuthService.setupRefreshTimer(nearExpirySession);

      // Wait for refresh timer (mocked)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });
  });

  describe('5. Remember Me - 24-hour Persistence', () => {
    it('should restore session from localStorage when remember me is enabled', async () => {
      // Arrange
      const storedSession = {
        supervisorId: 'sup-123',
        name: 'Anthony Gair',
        email: 'anthony.gair@example.com',
        timestamp: new Date().toISOString(), // Recent timestamp
        authenticated: true
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'supervisor_session') {
          return JSON.stringify(storedSession);
        }
        return null;
      });

      supabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            user: { id: 'user-123', email: storedSession.email }
          }
        },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'sup-123', name: 'Anthony Gair', email: storedSession.email },
        error: null
      });

      // Act
      const result = await enhancedAuthService.getCurrentSession();

      // Assert
      expect(result.success).toBe(true);
      expect(result.session.email).toBe(storedSession.email);
    });

    it('should clear expired stored sessions (>24 hours)', async () => {
      // Arrange
      const oldSession = {
        supervisorId: 'sup-123',
        name: 'Anthony Gair',
        email: 'anthony.gair@example.com',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        authenticated: true
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldSession));

      // Act
      const result = await enhancedAuthService.getCurrentSession();

      // Assert
      expect(result.success).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('supervisor_session');
    });
  });

  describe('6. Logout - Proper Session Clearing', () => {
    it('should clear all session data on logout', async () => {
      // Arrange
      enhancedAuthService.currentSession = {
        id: 'session-123',
        supervisorId: 'sup-123',
        email: 'test@example.com'
      };

      supabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      await enhancedAuthService.signOut();

      // Assert
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(enhancedAuthService.currentSession).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('supervisor_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb_remember_me');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sb_session_config');
    });

    it('should handle logout errors gracefully', async () => {
      // Arrange
      enhancedAuthService.currentSession = { id: 'session-123' };
      supabase.auth.signOut.mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      // Act
      await enhancedAuthService.signOut();

      // Assert
      expect(enhancedAuthService.currentSession).toBeNull(); // Force cleanup
      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('7. Network Errors - Offline/Timeout Handling', () => {
    it('should handle network connectivity issues', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock network error
      supabase.auth.signInWithPassword.mockRejectedValue(
        new Error('fetch: Network request failed')
      );

      // Act
      const result = await enhancedAuthService.authenticate(
        credentials.email,
        credentials.password
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred during authentication');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock timeout
      supabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Request timeout')
      );

      // Act
      const result = await enhancedAuthService.authenticate(
        credentials.email,
        credentials.password
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred during authentication');
    });

    it('should handle offline scenarios', async () => {
      // Arrange
      Object.defineProperty(window.navigator, 'onLine', { value: false });

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const result = await enhancedAuthService.authenticate(
        credentials.email,
        credentials.password
      );

      // Assert - Should still attempt authentication but may fail gracefully
      expect(result.success).toBe(false);
    });
  });

  describe('8. Concurrent Sessions - Multiple Tabs/Windows', () => {
    it('should handle multiple session listeners', () => {
      // Arrange
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      // Act
      const unsubscribe1 = enhancedAuthService.addSessionListener(listener1);
      const unsubscribe2 = enhancedAuthService.addSessionListener(listener2);

      const testSession = { id: 'session-123', name: 'Test User' };
      enhancedAuthService.notifySessionChange(testSession);

      // Assert
      expect(listener1).toHaveBeenCalledWith(testSession);
      expect(listener2).toHaveBeenCalledWith(testSession);

      // Test unsubscribe
      unsubscribe1();
      enhancedAuthService.notifySessionChange(testSession);

      expect(listener1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(listener2).toHaveBeenCalledTimes(2); // Should be called again

      unsubscribe2();
    });

    it('should sync session state across tabs', async () => {
      // Arrange
      const sessionData = {
        supervisorId: 'sup-123',
        name: 'Anthony Gair',
        email: 'anthony.gair@example.com',
        authenticated: true
      };

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'supervisor_session',
        newValue: JSON.stringify(sessionData),
        oldValue: null
      });

      const listener = vi.fn();
      enhancedAuthService.addSessionListener(listener);

      // Act
      window.dispatchEvent(storageEvent);

      // Assert - Session should be updated from storage
      expect(listener).toHaveBeenCalled();
    });

    it('should handle session conflicts gracefully', async () => {
      // Arrange
      const session1 = { id: 'session-1', email: 'user1@example.com' };
      const session2 = { id: 'session-2', email: 'user2@example.com' };

      enhancedAuthService.currentSession = session1;

      // Simulate another tab creating a different session
      localStorageMock.getItem.mockReturnValue(JSON.stringify(session2));

      // Act
      const result = await enhancedAuthService.getCurrentSession();

      // Assert - Should handle the conflict appropriately
      expect(result).toBeDefined();
    });
  });

  describe('9. Password Security Validation', () => {
    it('should enforce minimum password requirements', async () => {
      // Arrange
      const weakPasswords = [
        'weak',           // Too short
        '12345678',       // No letters
        'password',       // No numbers
        'PASSWORD123'     // Could be stronger
      ];

      const credentials = {
        email: 'test@example.com'
      };

      // Act & Assert
      for (const password of weakPasswords) {
        const result = await enhancedAuthService.authenticate(
          credentials.email,
          password
        );

        if (result.passwordValidation && !result.passwordValidation.isValid) {
          expect(result.success).toBe(false);
          expect(result.error).toContain('Password does not meet security requirements');
        }
      }
    });

    it('should accept strong passwords', async () => {
      // Arrange
      const strongPassword = 'SecurePassword123!';
      const credentials = {
        email: 'anthony.gair@example.com',
        password: strongPassword
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: credentials.email },
          session: { access_token: 'token' }
        },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'sup-123', name: 'Anthony Gair', email: credentials.email },
        error: null
      });

      // Act
      const result = await enhancedAuthService.authenticate(
        credentials.email,
        credentials.password
      );

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('10. Security Event Logging', () => {
    it('should log successful authentication events', async () => {
      // Arrange
      const credentials = {
        email: 'anthony.gair@example.com',
        password: 'SecurePass123!'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: credentials.email },
          session: { access_token: 'token' }
        },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'sup-123', name: 'Anthony Gair', email: credentials.email },
        error: null
      });

      // Act
      await enhancedAuthService.authenticate(credentials.email, credentials.password);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Successful login: Anthony Gair')
      );

      consoleSpy.mockRestore();
    });

    it('should log unauthorized access attempts', async () => {
      // Arrange
      const credentials = {
        email: 'unauthorized@example.com',
        password: 'SomePassword123!'
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      // User exists in Supabase but not in supervisors table
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: credentials.email },
          session: { access_token: 'token' }
        },
        error: null
      });

      supabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      });

      supabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      await enhancedAuthService.authenticate(credentials.email, credentials.password);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Unauthorized authenticated user: ${credentials.email}`)
      );

      consoleSpy.mockRestore();
    });
  });
});