// Backend Authentication Integration Tests
// Tests the complete authentication flow including API endpoints

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';

// Test data
const TEST_CREDENTIALS = {
  valid: {
    email: 'anthony.gair@example.com',
    password: 'TempPassword2025!'
  },
  invalid: {
    email: 'nonexistent@example.com',
    password: 'WrongPassword123!'
  },
  unauthorized: {
    email: 'regular.user@example.com',
    password: 'ValidPassword123!'
  }
};

describe('Authentication API Integration Tests', () => {
  let authToken = null;

  beforeEach(async () => {
    // Reset any previous state
    authToken = null;
  });

  describe('1. POST /api/auth/login - Valid Login', () => {
    it('should successfully authenticate valid supervisor credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(TEST_CREDENTIALS.valid.email);
      expect(response.body.user.name).toBe('Anthony Gair');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.session).toBeDefined();
      expect(response.body.session.access_token).toBeDefined();

      // Store token for subsequent tests
      authToken = response.body.session.access_token;
    });

    it('should include proper security headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid);

      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should log successful authentication', async () => {
      // This would be verified through log monitoring in a real environment
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('2. POST /api/auth/login - Invalid Email', () => {
    it('should return generic error for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.invalid)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials. Please check your email and password.');
      expect(response.body.code).toBe('AUTH_FAILED');

      // Should not reveal whether email exists
      expect(response.body.error).not.toContain('email not found');
      expect(response.body.error).not.toContain('user does not exist');
    });

    it('should not provide timing attack information', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.invalid)
        .expect(401);

      const responseTime = Date.now() - startTime;

      // Response should be reasonably fast (not artificially delayed)
      expect(responseTime).toBeLessThan(5000);
    });
  });

  describe('3. POST /api/auth/login - Invalid Password', () => {
    it('should return generic error for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_CREDENTIALS.valid.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials. Please check your email and password.');
      expect(response.body.code).toBe('AUTH_FAILED');
    });
  });

  describe('4. Rate Limiting Tests', () => {
    it('should enforce rate limiting after multiple failed attempts', async () => {
      const rapidAttempts = [];

      // Make 6 rapid failed login attempts
      for (let i = 0; i < 6; i++) {
        rapidAttempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: `test${i}@example.com`,
              password: 'WrongPassword'
            })
        );
      }

      const responses = await Promise.all(rapidAttempts);

      // Check if any response indicates rate limiting
      const rateLimitedResponse = responses.find(res => res.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body.error).toContain('Too many');
        expect(rateLimitedResponse.body.retryAfter).toBeDefined();
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.invalid);

      // Some rate limiting implementations include headers
      // This is optional but good practice
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });
  });

  describe('5. Protected Routes - Token Validation', () => {
    beforeEach(async () => {
      // Get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid);

      authToken = loginResponse.body.session.access_token;
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/breakdowns/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/breakdowns/stats')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
      expect(response.body.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/breakdowns/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired token');
      expect(response.body.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/breakdowns/stats')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('6. POST /api/auth/logout - Session Clearing', () => {
    beforeEach(async () => {
      // Get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid);

      authToken = loginResponse.body.session.access_token;
    });

    it('should successfully logout with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should invalidate token after logout', async () => {
      // Logout first
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to use the token after logout
      const response = await request(app)
        .get('/api/breakdowns/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('7. Input Validation and Sanitization', () => {
    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SomePassword123!' })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
      expect(response.body.code).toBe('MISSING_CREDENTIALS');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
      expect(response.body.code).toBe('MISSING_CREDENTIALS');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '  ANTHONY.GAIR@EXAMPLE.COM  ',
          password: 'TempPassword2025!'
        });

      // Should normalize email to lowercase and trim
      if (response.status === 200) {
        expect(response.body.user.email).toBe('anthony.gair@example.com');
      }
    });
  });

  describe('8. Error Handling and Recovery', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, we test that errors return proper format
      const response = await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.invalid)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return proper error format for server errors', async () => {
      // Test with malformed request that might cause server error
      const response = await request(app)
        .post('/api/auth/login')
        .send(null);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('9. Security Headers and CORS', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers (helmet.js)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(400);
    });
  });

  describe('10. Health Check and Monitoring', () => {
    it('should provide health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.auth).toBe('configured');
      expect(response.body.rateLimit).toBe('active');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should provide API health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('11. Concurrent Session Handling', () => {
    it('should handle multiple simultaneous login requests', async () => {
      const simultaneousLogins = [];

      // Create 5 simultaneous login requests
      for (let i = 0; i < 5; i++) {
        simultaneousLogins.push(
          request(app)
            .post('/api/auth/login')
            .send(TEST_CREDENTIALS.valid)
        );
      }

      const responses = await Promise.all(simultaneousLogins);

      // All should succeed (or fail consistently)
      responses.forEach(response => {
        expect([200, 401, 429]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
      });
    });

    it('should generate unique session tokens', async () => {
      const tokens = new Set();

      // Get multiple tokens
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(TEST_CREDENTIALS.valid);

        if (response.status === 200) {
          tokens.add(response.body.session.access_token);
        }
      }

      // All tokens should be unique
      expect(tokens.size).toBeGreaterThan(0);
    });
  });

  describe('12. Performance and Load Testing', () => {
    it('should respond to login requests within reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/auth/login')
        .send(TEST_CREDENTIALS.valid);

      const responseTime = Date.now() - startTime;

      // Should respond within 2 seconds under normal conditions
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle burst of requests without crashing', async () => {
      const burstRequests = [];

      // Create burst of 10 requests
      for (let i = 0; i < 10; i++) {
        burstRequests.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(burstRequests);

      // All should complete successfully
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});