// backend/services/streetManagerWebhooksSimple.js
// Simple StreetManager webhook handler - Quick Fix

// Storage for webhook data
let webhookActivities = [];
let webhookPermits = [];

/**
 * Handle StreetManager webhook data
 */
export function handleWebhookMessage(message) {
  try {
    console.log('📨 Processing StreetManager webhook:', message.Type);
    
    // Handle subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      console.log('📧 Auto-confirming StreetManager subscription');
      if (message.SubscribeURL) {
        fetch(message.SubscribeURL).then(() => {
          console.log('✅ StreetManager subscription confirmed');
        }).catch(err => {
          console.error('❌ Failed to confirm subscription:', err.message);
        });
      }
      return { status: 'subscription_confirmed' };
    }
    
    // Handle actual notifications
    if (message.Type === 'Notification') {
      try {
        const data = JSON.parse(message.Message);
        console.log(`📋 StreetManager: ${data.event_type} for ${data.object_type}`);
        
        // Store the data
        if (data.object_type === 'PERMIT') {
          webhookPermits.push({
            id: `permit_${data.object_reference}`,
            ...data,
            receivedAt: new Date().toISOString()
          });
          // Keep only last 100
          if (webhookPermits.length > 100) webhookPermits = webhookPermits.slice(-100);
          
        } else if (data.object_type === 'ACTIVITY') {
          webhookActivities.push({
            id: `activity_${data.object_reference}`,
            ...data,
            receivedAt: new Date().toISOString()
          });
          // Keep only last 100
          if (webhookActivities.length > 100) webhookActivities = webhookActivities.slice(-100);
        }
        
        return { status: 'processed', type: data.object_type };
      } catch (parseError) {
        console.error('❌ Error parsing webhook message:', parseError.message);
        return { error: 'Invalid message format' };
      }
    }
    
    return { status: 'ignored', type: message.Type };
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    return { error: 'Webhook processing failed' };
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
