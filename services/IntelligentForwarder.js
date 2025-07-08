// services/IntelligentForwarder.js
// Smart Information Forwarding System - Phase 2, Step 2.1
// Intelligent priority-based message queuing for Display Screen

import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

class IntelligentForwarder {
  constructor() {
    this.messageQueue = [];
    this.activeMessage = null;
    this.priorityLevels = {
      P0: { duration: 0, rotation: 0, autoExpire: 2 * 60 * 60 * 1000 }, // Emergency: 2hr
      P1: { duration: 30000, rotation: 30000, autoExpire: 1 * 60 * 60 * 1000 }, // Critical: 1hr  
      P2: { duration: 60000, rotation: 60000, autoExpire: 30 * 60 * 1000 }, // Important: 30min
      P3: { duration: 300000, rotation: 300000, autoExpire: 15 * 60 * 1000 } // Info: 15min
    };
  }

  // Send message to display screen with intelligent priority handling
  async sendToDisplay(messageData, options = {}) {
    try {
      const enrichedMessage = this.enrichMessage(messageData, options);
      
      // Auto-trigger priority logic if not manually set
      if (!messageData.manualPriority && this.shouldAutoTrigger(messageData)) {
        enrichedMessage.priority = this.calculateAutoPriority(messageData);
        enrichedMessage.autoTriggered = true;
      }

      // Store in Convex for real-time sync
      const result = await this.storeInConvex(enrichedMessage);
      
      // Add to local queue for immediate processing
      this.addToQueue(enrichedMessage);
      
      console.log(`📤 Message forwarded to display with priority ${enrichedMessage.priority}:`, enrichedMessage.content);
      
      return {
        success: true,
        messageId: result.messageId,
        priority: enrichedMessage.priority,
        estimatedDisplay: this.calculateDisplayTime(enrichedMessage.priority)
      };
      
    } catch (error) {
      console.error('❌ Failed to forward message to display:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enrich message with metadata and context
  enrichMessage(messageData, options) {
    const now = Date.now();
    const priority = messageData.priority || 'P2';
    const priorityConfig = this.priorityLevels[priority];
    
    return {
      ...messageData,
      id: `msg_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      expiresAt: now + priorityConfig.autoExpire,
      displayDuration: priorityConfig.duration,
      rotationInterval: priorityConfig.rotation,
      
      // Context enrichment
      source: options.source || 'supervisor',
      triggerType: messageData.templateId ? 'template' : 'custom',
      
      // Display configuration  
      displayed: false,
      displayedAt: null,
      displayCount: 0,
      
      // Supervisor context
      supervisorContext: {
        id: messageData.createdBy,
        name: messageData.supervisorName,
        timestamp: now,
        action: 'message_forward'
      }
    };
  }

  // Auto-trigger logic based on content and context
  shouldAutoTrigger(messageData) {
    // Check for auto-trigger keywords/patterns
    const emergencyKeywords = ['emergency', 'urgent', 'critical', 'suspended', 'blocked'];
    const content = (messageData.content || '').toLowerCase();
    
    // Auto-trigger for emergency content
    if (emergencyKeywords.some(keyword => content.includes(keyword))) {
      return true;
    }
    
    // Auto-trigger for high-impact templates
    const autoTriggerTemplates = ['emergency_diversion', 'route_suspension'];
    if (autoTriggerTemplates.includes(messageData.templateId)) {
      return true;
    }
    
    // Auto-trigger for events and roadworks
    if (messageData.source === 'event' || messageData.source === 'roadwork') {
      return true;
    }
    
    return false;
  }

  // Calculate automatic priority based on content analysis
  calculateAutoPriority(messageData) {
    const content = (messageData.content || '').toLowerCase();
    
    // P0 Emergency patterns
    if (content.includes('emergency') || content.includes('urgent') || content.includes('critical')) {
      return 'P0';
    }
    
    // P1 Critical patterns  
    if (content.includes('suspended') || content.includes('blocked') || content.includes('diverted')) {
      return 'P1';
    }
    
    // P2 Important patterns
    if (content.includes('delay') || content.includes('disruption') || content.includes('weather')) {
      return 'P2';
    }
    
    // Default to P3 Info
    return 'P3';
  }

  // Store message in Convex for real-time sync
  async storeInConvex(messageData) {
    // This would use the Convex mutation in a React component
    // For now, we'll simulate the storage
    const messageId = messageData.id;
    
    // In a real implementation, this would be:
    // const result = await convexMutation(api.sync.addDisplayMessage, messageData);
    
    console.log('💾 Stored message in Convex:', messageId);
    return { messageId };
  }

  // Add message to local processing queue
  addToQueue(messageData) {
    // Remove any existing messages with same priority if P0 (emergency override)
    if (messageData.priority === 'P0') {
      this.messageQueue = this.messageQueue.filter(msg => msg.priority !== 'P0');
    }
    
    // Insert message based on priority (P0 first, then by timestamp)
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const insertIndex = this.messageQueue.findIndex(msg => 
      priorityOrder[msg.priority] > priorityOrder[messageData.priority]
    );
    
    if (insertIndex === -1) {
      this.messageQueue.push(messageData);
    } else {
      this.messageQueue.splice(insertIndex, 0, messageData);
    }
    
    console.log(`📋 Added to queue (${this.messageQueue.length} messages), priority ${messageData.priority}`);
  }

  // Calculate estimated display time
  calculateDisplayTime(priority) {
    const queuePosition = this.messageQueue.findIndex(msg => msg.priority === priority);
    const config = this.priorityLevels[priority];
    
    if (priority === 'P0') {
      return 'Immediate';
    }
    
    const estimatedSeconds = (queuePosition * config.rotation) / 1000;
    if (estimatedSeconds < 60) {
      return `${Math.round(estimatedSeconds)}s`;
    } else {
      return `${Math.round(estimatedSeconds / 60)}m`;
    }
  }

  // Get current queue status
  getQueueStatus() {
    return {
      totalMessages: this.messageQueue.length,
      byPriority: {
        P0: this.messageQueue.filter(m => m.priority === 'P0').length,
        P1: this.messageQueue.filter(m => m.priority === 'P1').length,
        P2: this.messageQueue.filter(m => m.priority === 'P2').length,
        P3: this.messageQueue.filter(m => m.priority === 'P3').length,
      },
      activeMessage: this.activeMessage,
      nextMessage: this.messageQueue[0] || null
    };
  }

  // Process queue (would be called by display screen)
  processQueue() {
    const now = Date.now();
    
    // Remove expired messages
    this.messageQueue = this.messageQueue.filter(msg => msg.expiresAt > now);
    
    // Get next message if no active message or current one expired
    if (!this.activeMessage || this.activeMessage.expiresAt <= now) {
      this.activeMessage = this.messageQueue.shift() || null;
      
      if (this.activeMessage) {
        this.activeMessage.displayed = true;
        this.activeMessage.displayedAt = now;
        this.activeMessage.displayCount++;
        
        console.log(`📺 Displaying message: ${this.activeMessage.content}`);
      }
    }
    
    return this.activeMessage;
  }

  // Manual message control methods
  promoteMessage(messageId, newPriority) {
    const message = this.messageQueue.find(m => m.id === messageId);
    if (message) {
      message.priority = newPriority;
      message.manualPriority = true;
      
      // Re-sort queue
      this.messageQueue = this.messageQueue.sort((a, b) => {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      console.log(`⬆️ Promoted message ${messageId} to ${newPriority}`);
    }
  }

  removeMessage(messageId) {
    this.messageQueue = this.messageQueue.filter(m => m.id !== messageId);
    if (this.activeMessage?.id === messageId) {
      this.activeMessage = null;
    }
    console.log(`🗑️ Removed message ${messageId}`);
  }

  // Analytics methods
  getAnalytics() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // This would integrate with Convex to get historical data
    return {
      messagesLast24h: 0, // Would query Convex
      averageDisplayTime: '45s',
      mostUsedPriority: 'P2',
      autoTriggeredCount: 0,
      manualCount: 0
    };
  }
}

// Singleton instance
const intelligentForwarder = new IntelligentForwarder();

// React Hook for easy integration
export const useIntelligentForwarder = () => {
  const addDisplayMessage = useMutation(api.sync.addDisplayMessage);
  const displayMessages = useQuery(api.sync.getDisplayMessages);
  const markMessageDisplayed = useMutation(api.sync.markMessageDisplayed);
  const removeDisplayMessage = useMutation(api.sync.removeDisplayMessage);
  const promoteMessagePriority = useMutation(api.sync.promoteMessagePriority);
  const displayAnalytics = useQuery(api.sync.getDisplayMessageAnalytics);
  
  const sendMessage = async (messageData, options = {}) => {
    try {
      // Process message through intelligent forwarder
      const enrichedMessage = intelligentForwarder.enrichMessage(messageData, options);
      
      // Auto-trigger priority logic if not manually set
      if (!messageData.manualPriority && intelligentForwarder.shouldAutoTrigger(messageData)) {
        enrichedMessage.priority = intelligentForwarder.calculateAutoPriority(messageData);
        enrichedMessage.autoTriggered = true;
      }
      
      // Store in Convex for real-time sync
      const result = await addDisplayMessage({
        id: enrichedMessage.id,
        content: enrichedMessage.content,
        priority: enrichedMessage.priority,
        messageType: enrichedMessage.triggerType,
        supervisorId: enrichedMessage.supervisorContext.id,
        supervisorName: enrichedMessage.supervisorContext.name,
        templateId: enrichedMessage.templateId,
        templateVariables: enrichedMessage.templateVariables,
        displayDuration: enrichedMessage.displayDuration,
        rotationInterval: enrichedMessage.rotationInterval,
        autoTriggered: enrichedMessage.autoTriggered,
        source: enrichedMessage.source,
        expiresAt: enrichedMessage.expiresAt,
      });
      
      // Add to local queue for immediate processing
      intelligentForwarder.addToQueue(enrichedMessage);
      
      console.log(`📺 Message forwarded to display with priority ${enrichedMessage.priority}:`, enrichedMessage.content);
      
      return {
        success: true,
        messageId: result.messageId,
        priority: enrichedMessage.priority,
        estimatedDisplay: intelligentForwarder.calculateDisplayTime(enrichedMessage.priority)
      };
      
    } catch (error) {
      console.error('❌ Failed to forward message to display:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const getQueueStatus = () => intelligentForwarder.getQueueStatus();
  const promoteMessage = async (id, priority, promotedBy) => {
    intelligentForwarder.promoteMessage(id, priority);
    return await promoteMessagePriority({ messageId: id, newPriority: priority, promotedBy });
  };
  const removeMessage = async (id, removedBy) => {
    intelligentForwarder.removeMessage(id);
    return await removeDisplayMessage({ messageId: id, removedBy });
  };
  const markDisplayed = async (id) => {
    return await markMessageDisplayed({ messageId: id });
  };
  const getAnalytics = () => displayAnalytics || intelligentForwarder.getAnalytics();

  return {
    sendMessage,
    getQueueStatus,
    promoteMessage,
    removeMessage,
    markDisplayed,
    getAnalytics,
    displayMessages: displayMessages || [],
    isLoading: displayMessages === undefined
  };
};

export default intelligentForwarder;
