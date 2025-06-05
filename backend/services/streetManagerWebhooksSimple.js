// backend/services/streetManagerWebhooksSimple.js
// Simple StreetManager webhook handler - Quick Fix

// Storage for webhook data
let webhookActivities = [];
let webhookPermits = [];

/**
 * Handle StreetManager webhook data with BULLETPROOF debugging
 */
export function handleWebhookMessage(message) {
  const handlerId = Date.now();
  try {
    console.log(`📨 [HANDLER-${handlerId}] Processing StreetManager webhook`);
    console.log(`🔍 [HANDLER-${handlerId}] Message Type:`, message?.Type || 'UNDEFINED!');
    console.log(`🔍 [HANDLER-${handlerId}] Message exists:`, !!message);
    
    if (message) {
      console.log(`🔍 [HANDLER-${handlerId}] Message structure:`, {
        hasType: !!message.Type,
        hasMessage: !!message.Message,
        hasSubscribeURL: !!message.SubscribeURL,
        messageKeys: Object.keys(message),
        typeValue: message.Type,
        typeType: typeof message.Type
      });
    } else {
      console.error(`❌ [HANDLER-${handlerId}] NO MESSAGE PROVIDED!`);
      return { 
        error: 'No message provided to handler',
        handlerId,
        debug: { case: 'no_message' }
      };
    }
    
    // CRITICAL: Check for undefined Type field
    if (message.Type === undefined) {
      console.error(`❌ [HANDLER-${handlerId}] CRITICAL: Type field is undefined!`);
      console.log(`🔍 [HANDLER-${handlerId}] Full message:`, JSON.stringify(message, null, 2));
      return {
        error: 'Message Type is undefined',
        handlerId,
        debug: {
          case: 'undefined_type',
          messageKeys: Object.keys(message || {}),
          messageContent: message
        }
      };
    }
    
    const messageType = String(message.Type);
    console.log(`📨 [HANDLER-${handlerId}] Processing Type: "${messageType}"`);
    
    // Handle subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
      console.log(`📧 [HANDLER-${handlerId}] Auto-confirming StreetManager subscription`);
      if (message.SubscribeURL) {
        fetch(message.SubscribeURL).then(() => {
          console.log(`✅ [HANDLER-${handlerId}] StreetManager subscription confirmed`);
        }).catch(err => {
          console.error(`❌ [HANDLER-${handlerId}] Failed to confirm subscription:`, err.message);
        });
      } else {
        console.warn(`⚠️ [HANDLER-${handlerId}] Subscription confirmation missing SubscribeURL`);
      }
      return { 
        status: 'subscription_confirmed', 
        type: 'SubscriptionConfirmation',
        handlerId
      };
    }
    
    // Handle actual notifications
    if (messageType === 'Notification') {
      console.log(`📨 [HANDLER-${handlerId}] Processing notification message`);
      
      if (!message.Message) {
        console.error(`❌ [HANDLER-${handlerId}] Notification message missing Message field`);
        return { 
          error: 'Notification missing Message field',
          handlerId,
          debug: { case: 'missing_message_field' }
        };
      }
      
      console.log(`📋 [HANDLER-${handlerId}] Raw message content (first 200 chars):`, message.Message?.substring(0, 200) + '...');
      
      try {
        const data = JSON.parse(message.Message);
        console.log(`✅ [HANDLER-${handlerId}] Message parsed successfully`);
        console.log(`📋 [HANDLER-${handlerId}] StreetManager: ${data.event_type || 'unknown_event'} for ${data.object_type || 'unknown_object'}`);
        console.log(`🔍 [HANDLER-${handlerId}] Parsed data structure:`, {
          hasEventType: !!data.event_type,
          hasObjectType: !!data.object_type,
          hasObjectReference: !!data.object_reference,
          dataKeys: Object.keys(data)
        });
        
        // Store the data
        if (data.object_type === 'PERMIT') {
          const permitData = {
            id: `permit_${data.object_reference || Date.now()}`,
            ...data,
            receivedAt: new Date().toISOString(),
            handlerId
          };
          webhookPermits.push(permitData);
          // Keep only last 100
          if (webhookPermits.length > 100) webhookPermits = webhookPermits.slice(-100);
          console.log(`✅ [HANDLER-${handlerId}] Stored PERMIT data, total permits: ${webhookPermits.length}`);
          
        } else if (data.object_type === 'ACTIVITY') {
          const activityData = {
            id: `activity_${data.object_reference || Date.now()}`,
            ...data,
            receivedAt: new Date().toISOString(),
            handlerId
          };
          webhookActivities.push(activityData);
          // Keep only last 100
          if (webhookActivities.length > 100) webhookActivities = webhookActivities.slice(-100);
          console.log(`✅ [HANDLER-${handlerId}] Stored ACTIVITY data, total activities: ${webhookActivities.length}`);
          
        } else {
          console.warn(`⚠️ [HANDLER-${handlerId}] Unknown object_type: ${data.object_type}`);
          return { 
            status: 'ignored', 
            reason: `Unknown object_type: ${data.object_type}`,
            handlerId,
            debug: { case: 'unknown_object_type' }
          };
        }
        
        return { 
          status: 'processed', 
          type: data.object_type,
          event: data.event_type,
          reference: data.object_reference,
          handlerId
        };
      } catch (parseError) {
        console.error(`❌ [HANDLER-${handlerId}] Error parsing webhook message:`, parseError.message);
        console.log(`📄 [HANDLER-${handlerId}] Message that failed to parse:`, message.Message);
        return { 
          error: 'Invalid message format',
          details: parseError.message,
          messagePreview: message.Message?.substring(0, 100),
          handlerId,
          debug: { case: 'parse_error' }
        };
      }
    }
    
    // Handle known non-standard types
    const knownTypes = ['Unknown', 'InvalidJSON', 'EmptyRequest', 'EmptyObject', 'DirectObject', 'CriticalError', 'EmptyString'];
    if (knownTypes.includes(messageType)) {
      console.log(`⚠️ [HANDLER-${handlerId}] Handling known non-standard type: ${messageType}`);
      return { 
        status: 'ignored', 
        type: messageType,
        reason: `Non-standard message type: ${messageType}`,
        handlerId,
        debug: { case: 'known_non_standard' }
      };
    }
    
    // Handle completely unknown types
    console.log(`⚠️ [HANDLER-${handlerId}] Ignoring unknown message type: "${messageType}"`);
    return { 
      status: 'ignored', 
      type: messageType,
      reason: `Message type not handled: ${messageType}`,
      handlerId,
      debug: { case: 'unknown_type' }
    };
    
  } catch (error) {
    console.error(`❌ [HANDLER-${handlerId}] Webhook processing error:`, error.message);
    console.error(`❌ [HANDLER-${handlerId}] Error stack:`, error.stack);
    return { 
      error: 'Webhook processing failed',
      details: error.message,
      messageType: message?.Type || 'undefined',
      handlerId,
      debug: { case: 'processing_error' }
    };
  }
}

/**
 * Get stored activities
 */
export function getWebhookActivities() {
  return {
    success: true,
    data: webhookActivities,
    metadata: {
      source: 'StreetManager Webhooks',
      count: webhookActivities.length,
      method: 'webhook_storage',
      lastReceived: webhookActivities.length > 0 ? webhookActivities[webhookActivities.length - 1].receivedAt : null
    }
  };
}

/**
 * Get stored permits
 */
export function getWebhookPermits() {
  return {
    success: true,
    data: webhookPermits,
    metadata: {
      source: 'StreetManager Webhooks',
      count: webhookPermits.length,
      method: 'webhook_storage',
      lastReceived: webhookPermits.length > 0 ? webhookPermits[webhookPermits.length - 1].receivedAt : null
    }
  };
}

/**
 * Add test data (for development)
 */
export function addTestData() {
  const testActivity = {
    id: 'activity_TEST123',
    event_type: 'ACTIVITY_CREATED',
    object_type: 'ACTIVITY',
    object_data: {
      activity_reference_number: 'TEST123',
      activity_name: 'Test Road Works',
      street_name: 'Grey Street',
      area_name: 'Newcastle upon Tyne'
    },
    receivedAt: new Date().toISOString()
  };
  
  webhookActivities.push(testActivity);
  console.log('🧪 Added test StreetManager data');
}

/**
 * Get webhook status
 */
export function getWebhookStatus() {
  return {
    configured: true,
    method: 'webhook_receiver',
    endpoints: {
      main: '/api/streetmanager/webhook',
      activities: '/api/streetmanager/webhook/activities'
    },
    storage: {
      activities: webhookActivities.length,
      permits: webhookPermits.length
    },
    registration: {
      required: true,
      instructions: 'Register webhook URLs with DFT at: https://www.gov.uk/guidance/find-and-use-roadworks-data'
    }
  };
}

export default {
  handleWebhookMessage,
  getWebhookActivities,
  getWebhookPermits,
  addTestData,
  getWebhookStatus
};
