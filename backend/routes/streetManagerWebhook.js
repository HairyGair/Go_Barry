// backend/routes/streetManagerWebhook.js
// AWS SNS webhook endpoint for manage-roadworks.service.gov.uk real-time notifications

import express from 'express';
import { processStreetManagerEvent } from '../services/streetManagerEvents.js';

const router = express.Router();

/**
 * POST /api/streetmanager/webhook
 * Receives AWS SNS notifications from manage-roadworks.service.gov.uk
 * 
 * Flow:
 * 1. First request will be SNS subscription confirmation
 * 2. Subsequent requests will be roadwork event notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 Received Street Manager webhook:', {
      messageType: req.headers['x-amz-sns-message-type'],
      topicArn: req.headers['x-amz-sns-topic-arn'],
      timestamp: new Date().toISOString()
    });

    const messageType = req.headers['x-amz-sns-message-type'];
    const message = req.body;

    // Handle SNS subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
      console.log('🔔 SNS Subscription Confirmation received');
      
      // Log the confirmation URL for manual confirmation if needed
      console.log('Confirmation URL:', message.SubscribeURL);
      
      // Auto-confirm the subscription
      if (message.SubscribeURL) {
        try {
          const response = await fetch(message.SubscribeURL);
          if (response.ok) {
            console.log('✅ SNS Subscription confirmed automatically');
          } else {
            console.error('❌ Failed to confirm subscription:', response.statusText);
          }
        } catch (error) {
          console.error('❌ Error confirming subscription:', error);
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Subscription confirmation received',
        subscribeUrl: message.SubscribeURL 
      });
      return;
    }

    // Handle notification messages
    if (messageType === 'Notification') {
      console.log('📬 Processing Street Manager notification');
      
      // Parse the SNS message
      let eventData;
      try {
        // SNS wraps the actual message in a Message field
        eventData = typeof message.Message === 'string' 
          ? JSON.parse(message.Message) 
          : message.Message;
      } catch (parseError) {
        console.error('❌ Failed to parse SNS message:', parseError);
        eventData = message;
      }

      // Process the roadwork event
      const result = await processStreetManagerEvent(eventData);
      
      if (result.success) {
        console.log('✅ Street Manager event processed successfully');
        res.status(200).json({ 
          success: true, 
          message: 'Event processed',
          alertId: result.alertId 
        });
      } else {
        console.error('❌ Failed to process event:', result.error);
        res.status(200).json({ 
          success: false, 
          error: result.error 
        });
      }
      return;
    }

    // Handle unsubscribe confirmations
    if (messageType === 'UnsubscribeConfirmation') {
      console.log('🔕 SNS Unsubscribe Confirmation received');
      res.status(200).json({ 
        success: true, 
        message: 'Unsubscribe confirmation received' 
      });
      return;
    }

    // Unknown message type
    console.warn('⚠️ Unknown SNS message type:', messageType);
    res.status(200).json({ 
      success: true, 
      message: 'Message received',
      type: messageType 
    });

  } catch (error) {
    console.error('❌ Street Manager webhook error:', error);
    // Always return 200 to SNS to prevent retries
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/streetmanager/webhook/status
 * Check webhook configuration and subscription status
 */
router.get('/webhook/status', (req, res) => {
  res.json({
    success: true,
    webhook: {
      endpoint: `${process.env.BACKEND_URL || 'https://go-barry.onrender.com'}/api/streetmanager/webhook`,
      ready: true,
      documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/',
      instructions: [
        '1. Register this endpoint at: https://www.manage-roadworks.service.gov.uk/open-data-onboarding',
        '2. Wait for subscription confirmation request',
        '3. Endpoint will auto-confirm the subscription',
        '4. Start receiving real-time roadwork events'
      ]
    }
  });
});

/**
 * POST /api/streetmanager/webhook/test
 * Test endpoint to simulate Street Manager events
 */
router.post('/webhook/test', async (req, res) => {
  try {
    const testEvent = {
      event_type: 'PERMIT_CREATED',
      event_time: new Date().toISOString(),
      object_reference: 'TEST-' + Date.now(),
      object_data: {
        permit_reference_number: 'TEST-PERMIT-001',
        highway_authority_swa_code: 'NEWC',
        highway_authority: 'Newcastle City Council',
        promoter_organisation: 'Test Utility Company',
        work_category_ref: 'standard',
        description: 'Test roadwork for webhook integration',
        location_description: 'A1 Newcastle',
        street_name: 'A1',
        area_name: 'Newcastle',
        proposed_start_date: new Date().toISOString(),
        proposed_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        permit_status: 'granted',
        geometry: {
          type: 'Point',
          coordinates: [-1.6178, 54.9783] // Newcastle coordinates
        }
      }
    };

    const result = await processStreetManagerEvent(testEvent);
    
    res.json({
      success: true,
      message: 'Test event processed',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
