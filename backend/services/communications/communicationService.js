// backend/services/communications/communicationService.js
// Core Communications Service Layer for Go BARRY
// Handles all inter-supervisor communication routing

import EventEmitter from 'events';

class CommunicationService extends EventEmitter {
  constructor() {
    super();
    this.activeChannels = new Map(); // supervisorId -> Set of channel types
    this.messageQueue = [];
    this.isProcessing = false;
    
    console.log('🔄 Communications Service initialized');
  }

  /**
   * Register a supervisor for communication channels
   */
  registerSupervisor(supervisorId, channels = ['email', 'ticketer']) {
    if (!this.activeChannels.has(supervisorId)) {
      this.activeChannels.set(supervisorId, new Set());
    }
    
    channels.forEach(channel => {
      this.activeChannels.get(supervisorId).add(channel);
    });
    
    console.log(`📡 Supervisor ${supervisorId} registered for channels: ${channels.join(', ')}`);
    this.emit('supervisorRegistered', { supervisorId, channels });
  }

  /**
   * Unregister supervisor from all channels
   */
  unregisterSupervisor(supervisorId) {
    this.activeChannels.delete(supervisorId);
    console.log(`📡 Supervisor ${supervisorId} unregistered from all channels`);
    this.emit('supervisorUnregistered', { supervisorId });
  }

  /**
   * Queue a message for processing
   */
  async queueMessage(message) {
    const messageId = this.generateMessageId();
    const queuedMessage = {
      id: messageId,
      ...message,
      status: 'queued',
      queuedAt: Date.now(),
      attempts: 0,
      maxAttempts: message.maxAttempts || 3
    };

    this.messageQueue.push(queuedMessage);
    console.log(`📨 Message queued: ${messageId} (${message.type})`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processMessageQueue();
    }

    return messageId;
  }

  /**
   * Process the message queue
   */
  async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      try {
        await this.processMessage(message);
        this.emit('messageProcessed', message);
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        
        message.attempts++;
        message.lastError = error.message;
        
        if (message.attempts < message.maxAttempts) {
          // Re-queue with delay
          setTimeout(() => {
            this.messageQueue.unshift(message);
          }, Math.pow(2, message.attempts) * 1000); // Exponential backoff
        } else {
          console.error(`❌ Message ${message.id} failed after ${message.maxAttempts} attempts`);
          this.emit('messageFailed', message);
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Message queue processing complete');
  }

  /**
   * Process individual message based on type
   */
  async processMessage(message) {
    message.status = 'processing';
    message.processedAt = Date.now();

    switch (message.type) {
      case 'email':
        return await this.processEmailMessage(message);
      case 'ticketer':
        return await this.processTicketerMessage(message);
      case 'sms':
        return await this.processSMSMessage(message);
      case 'voip':
        return await this.processVoIPMessage(message);
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Process email messages
   */
  async processEmailMessage(message) {
    console.log(`📧 Processing email message: ${message.id}`);
    
    // Implementation will be handled by EmailService
    // For now, just mark as processed
    message.status = 'sent';
    message.sentAt = Date.now();
    
    return message;
  }

  /**
   * Process Ticketer messages (driver communication)
   */
  async processTicketerMessage(message) {
    console.log(`🚌 Processing Ticketer message: ${message.id}`);
    
    // Implementation will be handled by TicketerService
    // For now, just mark as processed
    message.status = 'sent';
    message.sentAt = Date.now();
    
    return message;
  }

  /**
   * Process SMS messages
   */
  async processSMSMessage(message) {
    console.log(`📱 Processing SMS message: ${message.id}`);
    
    // Implementation will be handled by SMSService
    // For now, just mark as processed
    message.status = 'sent';
    message.sentAt = Date.now();
    
    return message;
  }

  /**
   * Process VoIP messages/calls
   */
  async processVoIPMessage(message) {
    console.log(`📞 Processing VoIP message: ${message.id}`);
    
    // Implementation will be handled by VoIPService
    // For now, just mark as processed
    message.status = 'sent';
    message.sentAt = Date.now();
    
    return message;
  }

  /**
   * Get message history for supervisor
   */
  getMessageHistory(supervisorId, limit = 50) {
    // This would typically query the database
    // For now, return empty array
    return [];
  }

  /**
   * Get active communication channels for supervisor
   */
  getActiveChannels(supervisorId) {
    return Array.from(this.activeChannels.get(supervisorId) || []);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      activeSupervisors: this.activeChannels.size
    };
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('🔄 Shutting down Communications Service...');
    
    // Process remaining messages
    if (this.messageQueue.length > 0) {
      console.log(`📨 Processing ${this.messageQueue.length} remaining messages...`);
      await this.processMessageQueue();
    }
    
    // Clear all channels
    this.activeChannels.clear();
    
    console.log('✅ Communications Service shutdown complete');
    this.emit('shutdown');
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();
export default communicationService;