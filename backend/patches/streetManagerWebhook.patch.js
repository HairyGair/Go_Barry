// Patch for streetManagerWebhook.js to add retry mechanism
// Apply this patch to backend/routes/streetManagerWebhook.js

// Add these imports at the top of the file:
import { StreetManagerRetryHandler } from '../services/retryManager.js';
import fallbackManager from '../services/fallbackDataManager.js';

// Initialize retry handler after the router declaration:
const retryHandler = new StreetManagerRetryHandler();

// Replace the existing handleMessage function with this enhanced version:
async function handleMessageWithRetry(snsMessage) {
  console.log('Processing SNS message with retry capability');
  
  try {
    // For subscription confirmations
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      console.log('🔔 Confirming SNS subscription...');
      const response = await fetch(snsMessage.SubscribeURL);
      if (response.ok) {
        console.log('✅ Subscription confirmed');
      } else {
        console.error('❌ Failed to confirm subscription');
      }
      return;
    }
    
    // For notifications
    if (snsMessage.Type === 'Notification') {
      console.log('📬 Processing notification with retry handler');
      
      const message = JSON.parse(snsMessage.Message);
      
      // Process with retry logic
      await retryHandler.processWebhookWithRetry(message, {
        messageId: snsMessage.MessageId,
        timestamp: snsMessage.Timestamp,
        topicArn: snsMessage.TopicArn
      });
      
      // Process through existing handlers with fallback
      try {
        // Try hybrid storage first
        if (hybridStorage) {
          const result = await hybridStorage.processIncomingWebhook(message);
          console.log('✅ Stored in hybrid storage:', result);
        }
        
        // Process to streetworks table
        const streetworks = await processWebhookToStreetworks(message);
        if (streetworks && streetworks.length > 0) {
          console.log(`✅ Processed ${streetworks.length} streetworks`);
        }
      } catch (processingError) {
        console.error('⚠️ Processing error, saving to fallback:', processingError);
        
        // Save to fallback storage
        await fallbackManager.saveFallback('streetManager', message, {
          messageId: snsMessage.MessageId,
          error: processingError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // For unsubscribe confirmations
    if (snsMessage.Type === 'UnsubscribeConfirmation') {
      console.log('🔕 Unsubscribe confirmation received');
    }
  } catch (error) {
    console.error('❌ Error handling message with retry:', error);
    
    // Save entire message to fallback for manual recovery
    await fallbackManager.saveFallback('streetManager_failed', snsMessage, {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error; // Re-throw to maintain existing error handling
  }
}

// Update the handleWebhook function to use the retry version:
// Replace: handleMessage(snsMessage);
// With: await handleMessageWithRetry(snsMessage);

// Add a new endpoint for manual retry of failed webhooks:
router.post('/webhook/retry', async (req, res) => {
  try {
    const { messageId } = req.body;
    
    // Get failed message from fallback storage
    const failedMessage = await fallbackManager.getFallback('streetManager_failed');
    
    if (!failedMessage) {
      return res.status(404).json({
        success: false,
        error: 'No failed messages found'
      });
    }
    
    // Retry processing
    await handleMessageWithRetry(failedMessage);
    
    res.json({
      success: true,
      message: 'Webhook reprocessed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add endpoint to check retry queue status:
router.get('/webhook/retry-status', (req, res) => {
  const status = retryHandler.retryManager.getQueueStatus();
  
  res.json({
    success: true,
    retryQueue: status,
    timestamp: new Date().toISOString()
  });
});
