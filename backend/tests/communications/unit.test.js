// backend/tests/communications/unit.test.js
// Unit tests for Communications Platform services
// Tests individual service functions and error handling

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

// Import services to test
import { communicationsErrorHandler } from '../../services/communications/errorHandler.js';

/**
 * Communications Platform Unit Test Suite
 * Tests individual service components in isolation
 */
describe('Communications Platform Unit Tests', () => {

  describe('Error Handler Service', () => {
    let errorHandler;
    let mockError;

    beforeEach(() => {
      errorHandler = communicationsErrorHandler;
      mockError = new Error('Test error message');
    });

    it('should categorize network errors correctly', () => {
      mockError.message = 'Network timeout occurred';
      const result = errorHandler.handleError(mockError, { service: 'email' });
      
      expect(result.errorInfo.category).to.equal('NETWORK_ERROR');
      expect(result.shouldRetry).to.be.true;
    });

    it('should categorize authentication errors correctly', () => {
      mockError.message = 'Authentication failed';
      const result = errorHandler.handleError(mockError, { service: 'voip' });
      
      expect(result.errorInfo.category).to.equal('AUTHENTICATION_ERROR');
      expect(result.errorInfo.severity).to.equal('CRITICAL');
      expect(result.shouldRetry).to.be.false;
    });

    it('should open circuit breaker after threshold failures', () => {
      const service = 'test-service';
      
      // Simulate 5 critical failures
      for (let i = 0; i < 5; i++) {
        const criticalError = new Error('Server error');
        errorHandler.handleError(criticalError, { 
          service,
          severity: 'CRITICAL'
        });
      }
      
      expect(errorHandler.isCircuitBreakerOpen(service)).to.be.true;
    });

    it('should calculate exponential backoff correctly', () => {
      const delay1 = errorHandler.calculateBackoffDelay({}, 1);
      const delay2 = errorHandler.calculateBackoffDelay({}, 2);
      const delay3 = errorHandler.calculateBackoffDelay({}, 3);
      
      expect(delay2).to.be.greaterThan(delay1);
      expect(delay3).to.be.greaterThan(delay2);
      expect(delay3).to.be.below(61000); // Max delay is 60 seconds
    });

    it('should detect error spikes', () => {
      const service = 'spike-test';
      let spikeDetected = false;
      
      errorHandler.on('errorSpike', () => {
        spikeDetected = true;
      });
      
      // Generate 6 errors quickly
      for (let i = 0; i < 6; i++) {
        errorHandler.handleError(new Error('Spike error'), { service });
      }
      
      expect(spikeDetected).to.be.true;
    });
  });

  describe('Template Processing', () => {
    it('should substitute variables correctly', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is {{status}}';
      const variables = {
        name: 'John',
        orderId: '12345',
        status: 'ready'
      };
      
      const result = processTemplate(template, variables);
      
      expect(result).to.equal('Hello John, your order 12345 is ready');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, {{missing}} variable here';
      const variables = { name: 'John' };
      
      const result = processTemplate(template, variables);
      
      expect(result).to.equal('Hello John, {{missing}} variable here');
    });

    it('should escape HTML in variables', () => {
      const template = 'Message: {{content}}';
      const variables = {
        content: '<script>alert("xss")</script>'
      };
      
      const result = processTemplate(template, variables, { escapeHtml: true });
      
      expect(result).to.not.include('<script>');
      expect(result).to.include('&lt;script&gt;');
    });
  });

  describe('Message Queue Processing', () => {
    let processor;
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      processor = new MessageQueueProcessor();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should process messages in priority order', async () => {
      const messages = [
        { id: '1', priority: 'low', type: 'email' },
        { id: '2', priority: 'urgent', type: 'sms' },
        { id: '3', priority: 'medium', type: 'email' }
      ];
      
      const processOrder = [];
      sandbox.stub(processor, 'processMessage').callsFake((msg) => {
        processOrder.push(msg.id);
        return Promise.resolve({ success: true });
      });
      
      await processor.processMessages(messages);
      
      expect(processOrder[0]).to.equal('2'); // Urgent first
      expect(processOrder[1]).to.equal('3'); // Medium second
      expect(processOrder[2]).to.equal('1'); // Low last
    });

    it('should retry failed messages', async () => {
      const message = {
        id: 'retry-test',
        type: 'email',
        retryCount: 0,
        maxRetries: 2
      };
      
      let attemptCount = 0;
      sandbox.stub(processor, 'sendMessage').callsFake(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({ success: true });
      });
      
      const result = await processor.processMessage(message);
      
      expect(attemptCount).to.equal(3); // Original + 2 retries
      expect(result.success).to.be.true;
    });

    it('should move messages to dead letter queue after max retries', async () => {
      const message = {
        id: 'dead-letter-test',
        type: 'email',
        retryCount: 3,
        maxRetries: 2
      };
      
      sandbox.stub(processor, 'sendMessage').rejects(new Error('Persistent failure'));
      const deadLetterSpy = sandbox.spy(processor, 'moveToDeadLetterQueue');
      
      await processor.processMessage(message);
      
      expect(deadLetterSpy.calledOnce).to.be.true;
    });
  });

  describe('Validation Functions', () => {
    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'supervisor@gonortheast.com'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'test@',
        'test..test@domain.com'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).to.be.true;
      });
      
      invalidEmails.forEach(email => {
        expect(() => validateEmail(email)).to.throw();
      });
    });

    it('should validate phone numbers correctly', () => {
      const validNumbers = [
        '+441234567890',
        '+1234567890',
        '01234567890'
      ];
      
      const invalidNumbers = [
        '123',
        'abc123',
        '+44-invalid'
      ];
      
      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).to.be.true;
      });
      
      invalidNumbers.forEach(number => {
        expect(() => validatePhoneNumber(number)).to.throw();
      });
    });
  });

  describe('Audit Logger', () => {
    let auditLogger;
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      auditLogger = new AuditLogger();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should log communication events', async () => {
      const event = {
        type: 'email_sent',
        supervisorId: 'AG003',
        details: {
          to: ['test@example.com'],
          subject: 'Test email'
        }
      };
      
      const result = await auditLogger.logEvent(event);
      
      expect(result.success).to.be.true;
      expect(result.eventId).to.exist;
    });

    it('should maintain audit trail integrity', () => {
      const events = [
        { type: 'login', supervisorId: 'AG003' },
        { type: 'email_sent', supervisorId: 'AG003' },
        { type: 'logout', supervisorId: 'AG003' }
      ];
      
      events.forEach(event => auditLogger.logEvent(event));
      
      const trail = auditLogger.getAuditTrail('AG003');
      
      expect(trail.length).to.equal(3);
      expect(trail[0].type).to.equal('login');
      expect(trail[2].type).to.equal('logout');
    });
  });
});

// Helper functions for tests
function processTemplate(template, variables, options = {}) {
  let result = template;
  
  Object.keys(variables).forEach(key => {
    const value = options.escapeHtml ? 
      escapeHtml(variables[key]) : variables[key];
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  return true;
}

function validatePhoneNumber(phone) {
  const phoneRegex = /^(\+?[1-9]\d{1,14}|0\d{10})$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    throw new Error(`Invalid phone number: ${phone}`);
  }
  return true;
}

// Mock classes for testing
class MessageQueueProcessor {
  constructor() {
    this.deadLetterQueue = [];
  }
  
  async processMessages(messages) {
    const sortedMessages = messages.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    for (const message of sortedMessages) {
      await this.processMessage(message);
    }
  }
  
  async processMessage(message) {
    if (message.retryCount > message.maxRetries) {
      this.moveToDeadLetterQueue(message);
      return { success: false, reason: 'max_retries_exceeded' };
    }
    
    try {
      await this.sendMessage(message);
      return { success: true };
    } catch (error) {
      message.retryCount = (message.retryCount || 0) + 1;
      if (message.retryCount <= message.maxRetries) {
        return await this.processMessage(message);
      } else {
        this.moveToDeadLetterQueue(message);
        return { success: false, reason: 'max_retries_exceeded' };
      }
    }
  }
  
  async sendMessage(message) {
    // Mock implementation - will be stubbed in tests
    return { success: true };
  }
  
  moveToDeadLetterQueue(message) {
    this.deadLetterQueue.push(message);
    console.log(`Message ${message.id} moved to dead letter queue`);
  }
}

class AuditLogger {
  constructor() {
    this.events = [];
  }
  
  async logEvent(event) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logEntry = {
      ...event,
      eventId,
      timestamp: Date.now(),
      sequence: this.events.length + 1
    };
    
    this.events.push(logEntry);
    
    return { success: true, eventId };
  }
  
  getAuditTrail(supervisorId) {
    return this.events.filter(event => event.supervisorId === supervisorId);
  }
}