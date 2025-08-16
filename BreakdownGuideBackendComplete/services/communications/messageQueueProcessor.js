// backend/services/communications/messageQueueProcessor.js
// Message Queue Processing System for Communications Platform
// Handles background processing of emails, SMS, VoIP, and Ticketer messages

import EventEmitter from 'events';
import { communicationService } from './communicationService.js';
import { emailService } from './emailService.js';
import { voipService } from './voipService.js';

class MessageQueueProcessor extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.processingInterval = null;
    this.batchSize = 10; // Process 10 messages at a time
    this.processingDelay = 2000; // 2 seconds between batches
    this.retryDelays = [1000, 5000, 15000]; // Exponential backoff for retries
    this.maxConcurrentMessages = 5;
    this.currentlyProcessing = new Set();
    
    console.log('📨 Message Queue Processor initialized');
  }

  /**
   * Start the message queue processor
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Message Queue Processor already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Message Queue Processor...');
    
    // Start processing loop
    this.processingInterval = setInterval(() => {
      this.processMessageBatch();
    }, this.processingDelay);

    // Listen to communication service events
    communicationService.on('messageProcessed', this.handleMessageProcessed.bind(this));
    communicationService.on('messageFailed', this.handleMessageFailed.bind(this));

    this.emit('started');
    console.log('✅ Message Queue Processor started');
  }

  /**
   * Stop the message queue processor
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Message Queue Processor not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping Message Queue Processor...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Wait for current messages to finish processing
    if (this.currentlyProcessing.size > 0) {
      console.log(`⏳ Waiting for ${this.currentlyProcessing.size} messages to finish processing...`);
    }

    this.emit('stopped');
    console.log('✅ Message Queue Processor stopped');
  }

  /**
   * Process a batch of messages from the queue
   */
  async processMessageBatch() {
    if (!this.isRunning) {
      return;
    }

    try {
      // Don't process if we're at max capacity
      if (this.currentlyProcessing.size >= this.maxConcurrentMessages) {
        return;
      }

      // Get pending messages (this would integrate with Convex)
      const pendingMessages = await this.getPendingMessages();
      
      if (pendingMessages.length === 0) {
        return; // No messages to process
      }

      console.log(`📨 Processing batch of ${Math.min(pendingMessages.length, this.batchSize)} messages`);

      // Process messages up to batch size and concurrency limit
      const availableSlots = this.maxConcurrentMessages - this.currentlyProcessing.size;
      const messagesToProcess = pendingMessages.slice(0, Math.min(this.batchSize, availableSlots));

      // Process messages concurrently
      const processingPromises = messagesToProcess.map(message => 
        this.processMessage(message)
      );

      await Promise.allSettled(processingPromises);

    } catch (error) {
      console.error('❌ Error in message batch processing:', error);
      this.emit('batchError', error);
    }
  }

  /**
   * Process individual message
   */
  async processMessage(message) {
    const messageId = message.messageId || message.id;
    
    try {
      // Track processing
      this.currentlyProcessing.add(messageId);
      
      console.log(`📨 Processing message ${messageId} (${message.type})`);
      this.emit('messageStarted', message);

      // Update message status to processing (would integrate with Convex)
      await this.updateMessageStatus(messageId, 'processing');

      let result;
      
      // Route to appropriate processor based on message type
      switch (message.type) {
        case 'email':
          result = await this.processEmailMessage(message);
          break;
        case 'sms':
          result = await this.processSMSMessage(message);
          break;
        case 'ticketer':
          result = await this.processTicketerMessage(message);
          break;
        case 'voip':
          result = await this.processVoIPMessage(message);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }

      // Update message status to sent
      await this.updateMessageStatus(messageId, 'sent');
      
      console.log(`✅ Message ${messageId} processed successfully`);
      this.emit('messageCompleted', { message, result });

    } catch (error) {
      console.error(`❌ Error processing message ${messageId}:`, error);
      
      // Handle retry logic
      const shouldRetry = await this.handleMessageError(message, error);
      
      if (!shouldRetry) {
        await this.updateMessageStatus(messageId, 'failed', error.message);
        this.emit('messageFailed', { message, error });
      }
      
    } finally {
      // Remove from processing set
      this.currentlyProcessing.delete(messageId);
    }
  }

  /**
   * Process email message
   */
  async processEmailMessage(message) {
    console.log(`📧 Processing email: ${message.subject}`);

    // Process template if templateId provided
    let { subject, body } = message;
    
    if (message.templateId && message.templateVariables) {
      const templates = await emailService.getEmailTemplates();
      const template = templates.find(t => t.id === message.templateId);
      
      if (template) {
        const processed = emailService.processTemplate(template, message.templateVariables);
        subject = processed.subject;
        body = processed.body;
      }
    }

    // Send email via email service
    const result = await emailService.sendEmail({
      to: message.to,
      cc: message.cc || [],
      bcc: message.bcc || [],
      subject,
      body,
      from: message.from || 'gobarry@gonortheast.co.uk'
    });

    // Log communication activity (would integrate with Convex)
    await this.logCommunication({
      type: 'email',
      action: 'sent',
      from: message.from || 'gobarry@gonortheast.co.uk',
      to: message.to,
      subject,
      content: body,
      templateUsed: message.templateId,
      supervisorId: message.supervisorId,
      supervisorName: message.supervisorName || 'System',
      success: true
    });

    return result;
  }

  /**
   * Process SMS message
   */
  async processSMSMessage(message) {
    console.log(`📱 Processing SMS to ${message.to.length} recipients`);

    // SMS processing would integrate with SMS service (Twilio, etc.)
    // For now, just simulate processing
    await this.delay(500);

    // Log communication activity
    await this.logCommunication({
      type: 'sms',
      action: 'sent',
      from: 'Go BARRY',
      to: message.to,
      content: message.content,
      supervisorId: message.supervisorId,
      supervisorName: message.supervisorName || 'System',
      success: true
    });

    return {
      messageId: message.messageId,
      status: 'sent',
      recipients: message.to.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process Ticketer message (driver communication)
   */
  async processTicketerMessage(message) {
    console.log(`🚌 Processing Ticketer message to ${message.to.length} drivers/routes`);

    // Ticketer processing would integrate with existing driver communication system
    // For now, just simulate processing
    await this.delay(1000);

    // Log communication activity
    await this.logCommunication({
      type: 'ticketer',
      action: 'sent',
      from: 'Go BARRY Control',
      to: message.to,
      content: message.content,
      supervisorId: message.supervisorId,
      supervisorName: message.supervisorName || 'System',
      success: true
    });

    return {
      messageId: message.messageId,
      status: 'sent',
      routes: message.to,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process VoIP message
   */
  async processVoIPMessage(message) {
    console.log(`📞 Processing VoIP message: ${message.type}`);

    // VoIP processing would integrate with 8x8 API
    // For now, just log the call attempt
    await this.delay(200);

    // Log communication activity
    await this.logCommunication({
      type: 'voip',
      action: 'initiated',
      from: message.from,
      to: [message.to],
      supervisorId: message.supervisorId,
      supervisorName: message.supervisorName || 'System',
      success: true
    });

    return {
      messageId: message.messageId,
      status: 'initiated',
      callType: message.callType || 'outbound',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle message processing errors and retry logic
   */
  async handleMessageError(message, error) {
    const retryCount = message.retryCount || 0;
    const maxRetries = message.maxRetries || 3;

    if (retryCount < maxRetries) {
      const delay = this.retryDelays[retryCount] || this.retryDelays[this.retryDelays.length - 1];
      
      console.log(`🔄 Scheduling retry ${retryCount + 1}/${maxRetries} for message ${message.messageId} in ${delay}ms`);
      
      // Schedule retry (would integrate with Convex to update retry count and schedule)
      setTimeout(async () => {
        try {
          await this.updateMessageStatus(message.messageId, 'pending');
          // Increment retry count would be done in Convex
        } catch (retryError) {
          console.error('❌ Error scheduling retry:', retryError);
        }
      }, delay);

      return true; // Will retry
    }

    console.error(`❌ Message ${message.messageId} failed after ${maxRetries} attempts:`, error.message);
    return false; // Won't retry
  }

  /**
   * Get pending messages from queue (integrates with Convex)
   */
  async getPendingMessages() {
    // This would integrate with Convex getPendingMessages query
    // For now, return empty array
    return [];
  }

  /**
   * Update message status (integrates with Convex)
   */
  async updateMessageStatus(messageId, status, errorMessage = null) {
    // This would integrate with Convex updateMessageStatus mutation
    console.log(`📊 Message ${messageId} status: ${status}${errorMessage ? ` (${errorMessage})` : ''}`);
  }

  /**
   * Log communication activity (integrates with Convex)
   */
  async logCommunication(logData) {
    // This would integrate with Convex logCommunication mutation
    console.log(`📝 Logged ${logData.type} communication: ${logData.action}`);
  }

  /**
   * Handle successful message processing
   */
  handleMessageProcessed(message) {
    console.log(`✅ Message processed successfully: ${message.id}`);
    this.emit('processingStats', this.getProcessingStats());
  }

  /**
   * Handle failed message processing
   */
  handleMessageFailed(message) {
    console.error(`❌ Message failed permanently: ${message.id}`);
    this.emit('processingStats', this.getProcessingStats());
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      isRunning: this.isRunning,
      currentlyProcessing: this.currentlyProcessing.size,
      maxConcurrentMessages: this.maxConcurrentMessages,
      batchSize: this.batchSize,
      processingDelay: this.processingDelay
    };
  }

  /**
   * Update processor configuration
   */
  updateConfig({ batchSize, processingDelay, maxConcurrentMessages }) {
    if (batchSize !== undefined) {
      this.batchSize = Math.max(1, Math.min(50, batchSize));
      console.log(`📊 Updated batch size: ${this.batchSize}`);
    }
    
    if (processingDelay !== undefined) {
      this.processingDelay = Math.max(1000, Math.min(30000, processingDelay));
      console.log(`📊 Updated processing delay: ${this.processingDelay}ms`);
      
      // Restart interval with new delay
      if (this.isRunning && this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = setInterval(() => {
          this.processMessageBatch();
        }, this.processingDelay);
      }
    }
    
    if (maxConcurrentMessages !== undefined) {
      this.maxConcurrentMessages = Math.max(1, Math.min(20, maxConcurrentMessages));
      console.log(`📊 Updated max concurrent messages: ${this.maxConcurrentMessages}`);
    }

    this.emit('configUpdated', this.getProcessingStats());
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down Message Queue Processor...');
    
    this.stop();
    
    // Wait for all current messages to finish
    while (this.currentlyProcessing.size > 0) {
      console.log(`⏳ Waiting for ${this.currentlyProcessing.size} messages to complete...`);
      await this.delay(1000);
    }
    
    console.log('✅ Message Queue Processor shutdown complete');
    this.emit('shutdown');
  }
}

// Export singleton instance
export const messageQueueProcessor = new MessageQueueProcessor();
export default messageQueueProcessor;