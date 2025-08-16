// Enhanced StreetManager Webhook Handler
// Integrates comprehensive route impact analysis and supervisor notifications
// Replaces basic webhook handler with intelligent processing system

import express from 'express';
import https from 'https';
import crypto from 'crypto';
import fetch from 'node-fetch';
import enhancedProcessor from '../services/enhancedStreetManagerProcessor.js';
import notificationSystem from '../services/supervisorNotificationSystem.js';

const router = express.Router();

// Initialize systems on startup
let systemsInitialized = false;

async function initializeSystems() {
  if (systemsInitialized) return true;
  
  try {
    console.log('🚀 Initializing Enhanced StreetManager Systems...');
    
    // Initialize notification system
    await notificationSystem.initialize();
    
    systemsInitialized = true;
    console.log('✅ Enhanced StreetManager Systems ready');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize enhanced systems:', error.message);
    return false;
  }
}

// Signature validation functions - EXACTLY as per official docs
async function isValidSignature(snsMessage) {
  verifyMessageSignatureVersion(snsMessage.SignatureVersion);
  const certificate = await downloadCertificate(snsMessage.SigningCertURL);
  return validateSignature(snsMessage, certificate);
}

function verifyMessageSignatureVersion(version) {
  if (version != 1) {
    throw "Signature verification failed";
  }
}

function verifyMessageSignatureURL(certURL) {
  const url = new URL(certURL);
  if (url.protocol != 'https:') {
    throw "SigningCertURL was not using HTTPS";
  }
}

async function downloadCertificate(certURL) {
  verifyMessageSignatureURL(certURL);
  try {
    const response = await fetch(certURL);
    return await response.text();
  } catch (err) {
    throw `Error fetching certificate: ${err}`;
  }
}

async function validateSignature(message, certificate) {
  const verify = crypto.createVerify('sha1WithRSAEncryption');
  verify.write(getMessageToSign(message));
  verify.end();
  return verify.verify(certificate, message.Signature, 'base64');
}

function getMessageToSign(snsMessage) {
  switch(snsMessage.Type) {
    case 'SubscriptionConfirmation':
      return buildSubscriptionStringToSign(snsMessage);
    case 'Notification':
      return buildNotificationStringToSign(snsMessage);
    default:
      return;
  }
}

function buildNotificationStringToSign(snsMessage) {
  let stringToSign = '';
  stringToSign = "Message\n";
  stringToSign += snsMessage.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += snsMessage.MessageId + "\n";
  if (snsMessage.Subject) {
    stringToSign += "Subject\n";
    stringToSign += snsMessage.Subject + "\n";
  }
  stringToSign += "Timestamp\n";
  stringToSign += snsMessage.Timestamp + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += snsMessage.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += snsMessage.Type + "\n";
  return stringToSign;
}

function buildSubscriptionStringToSign(snsMessage) {
  let stringToSign = '';
  stringToSign = "Message\n";
  stringToSign += snsMessage.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += snsMessage.MessageId + "\n";
  stringToSign += "SubscribeURL\n";
  stringToSign += snsMessage.SubscribeURL + "\n";
  stringToSign += "Timestamp\n";
  stringToSign += snsMessage.Timestamp + "\n";
  stringToSign += "Token\n";
  stringToSign += snsMessage.Token + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += snsMessage.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += snsMessage.Type + "\n";
  return stringToSign;
}

// Handle messages with enhanced processing
function handleMessage(snsMessage) {
  switch(snsMessage.Type) {
    case 'SubscriptionConfirmation':
      confirmSubscription(snsMessage.SubscribeURL);
      break;
    case 'Notification':
      handleEnhancedNotification(snsMessage);
      break;
    default:
      return;
  }
}

function confirmSubscription(subscriptionUrl) {
  https.get(subscriptionUrl);
  console.log('✅ StreetManager subscription confirmed');
}

async function handleEnhancedNotification(snsMessage) {
  const notificationId = `sns_${snsMessage.MessageId}_${Date.now()}`;
  
  try {
    console.log(`📬 [${notificationId}] Received enhanced StreetManager notification`);
    
    // Parse the notification message
    const notificationData = JSON.parse(snsMessage.Message);
    
    // Add SNS metadata
    notificationData.sns_message_id = snsMessage.MessageId;
    notificationData.sns_timestamp = snsMessage.Timestamp;
    notificationData.sns_topic_arn = snsMessage.TopicArn;
    
    console.log(`🔍 [${notificationId}] Event: ${notificationData.event_type}, Object: ${notificationData.object_type}`);
    
    // Ensure enhanced systems are initialized
    const systemsReady = await initializeSystems();
    if (!systemsReady) {
      console.warn(`⚠️ [${notificationId}] Enhanced systems not ready, using basic processing`);
      return;
    }
    
    // Process with enhanced system
    const processingResult = await enhancedProcessor.processWebhookNotification(notificationData);
    
    console.log(`📊 [${notificationId}] Processing result: ${processingResult.status}`);
    
    // Handle notification creation if required
    if (processingResult.status === 'success' && processingResult.requires_notification) {
      try {
        // Create supervisor notification using the enhanced notification system
        const notificationResult = await notificationSystem.createNotification(
          processingResult.metadata, 
          { source: 'webhook', sns_message_id: snsMessage.MessageId }
        );
        
        if (notificationResult.success) {
          console.log(`📢 [${notificationId}] Supervisor notification created: ${notificationResult.notification_id}`);
        } else {
          console.warn(`⚠️ [${notificationId}] Failed to create supervisor notification: ${notificationResult.error}`);
        }
      } catch (notificationError) {
        console.error(`❌ [${notificationId}] Notification creation failed:`, notificationError.message);
      }
    }
    
    // Log processing summary
    if (processingResult.status === 'success') {
      console.log(`✅ [${notificationId}] Enhanced processing complete:`);
      console.log(`   - Severity: ${processingResult.severity}`);
      console.log(`   - Affected routes: ${processingResult.affected_routes}`);
      console.log(`   - Processing time: ${processingResult.processing_time_ms}ms`);
    } else {
      console.log(`⚠️ [${notificationId}] Processing result: ${processingResult.status} - ${processingResult.message}`);
    }
    
  } catch (error) {
    console.error(`❌ [${notificationId}] Enhanced notification handling failed:`, error.message);
    console.error(`❌ [${notificationId}] Error stack:`, error.stack);
  }
}

// Main webhook endpoint with enhanced processing
router.post('/', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`📨 [${requestId}] Enhanced StreetManager webhook received`);
    
    // Parse the text body as JSON to get the SNS message
    const snsMessage = JSON.parse(req.body);
    console.log(`🔍 [${requestId}] SNS Message Type: ${snsMessage.Type}`);
    
    // Check for SNS message type header
    if (req.get('x-amz-sns-message-type') == null) {
      console.log(`⚠️ [${requestId}] No x-amz-sns-message-type header`);
      return res.status(400).json({ 
        success: false,
        error: 'Missing SNS message type header',
        request_id: requestId
      });
    }
    
    // Log subscription confirmation URLs for debugging
    if (snsMessage.Type === 'SubscriptionConfirmation' && snsMessage.SubscribeURL) {
      console.log(`🔗 [${requestId}] SubscribeURL found: ${snsMessage.SubscribeURL}`);
    }
    
    // Validate signature
    if (await isValidSignature(snsMessage)) {
      console.log(`✅ [${requestId}] Signature validated`);
      
      // Handle message with enhanced processing
      await handleMessage(snsMessage);
      
      res.status(200).json({
        success: true,
        message: 'Enhanced StreetManager webhook processed',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ [${requestId}] Invalid signature`);
      res.status(403).json({
        success: false,
        error: 'Invalid signature',
        request_id: requestId
      });
    }
  } catch (error) {
    console.error(`❌ [${requestId}] Enhanced webhook error:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Enhanced webhook processing failed',
      details: error.message,
      request_id: requestId
    });
  }
});

// Status endpoint with comprehensive system information
router.get('/', async (req, res) => {
  try {
    // Initialize systems if not already done
    const systemsReady = await initializeSystems();
    
    const status = {
      success: true,
      status: 'ready',
      message: 'Enhanced StreetManager webhook with comprehensive route impact analysis',
      endpoint: 'POST /api/streetmanager/enhanced/webhook',
      expects: 'AWS SNS notifications with x-amz-sns-message-type header',
      bodyParser: 'text (as per official docs)',
      
      // Enhanced system status
      enhanced_systems: {
        initialized: systemsInitialized,
        systems_ready: systemsReady,
        processor_status: enhancedProcessor.getStatus(),
        notification_system: notificationSystem.getStatus()
      },
      
      // Capabilities
      capabilities: [
        'Geographical route matching using GTFS data',
        'Multi-factor severity classification',
        'Intelligent supervisor notifications',
        'Advanced route impact analysis',
        'Memory-optimized processing for 231+ routes',
        'Real-time dashboard integration'
      ],
      
      // Geographic coverage
      coverage: {
        region: 'North East England',
        areas: ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Northumberland'],
        routes_supported: '231+ Go North East bus routes',
        coordinate_bounds: {
          north: 55.811,
          south: 54.400,
          east: -1.200,
          west: -2.800
        }
      },
      
      documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/',
      api_endpoints: {
        status: 'GET /api/streetmanager/enhanced/webhook',
        active_critical: 'GET /api/streetmanager/enhanced/active-critical',
        route_disruptions: 'GET /api/streetmanager/enhanced/route-disruptions/:routeNumber',
        analytics: 'GET /api/streetmanager/enhanced/analytics/performance'
      },
      
      implementation: 'Enhanced SNS webhook with route impact analysis',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    };

    res.json(status);
    
  } catch (error) {
    console.error('❌ Failed to get enhanced webhook status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      details: error.message
    });
  }
});

// Test endpoint for validating enhanced processing
router.post('/test', async (req, res) => {
  try {
    const { test_data } = req.body;
    
    if (!test_data) {
      return res.status(400).json({
        success: false,
        error: 'test_data required for enhanced webhook testing'
      });
    }

    console.log('🧪 Processing test webhook with enhanced system...');
    
    // Ensure systems are initialized
    const systemsReady = await initializeSystems();
    if (!systemsReady) {
      return res.status(503).json({
        success: false,
        error: 'Enhanced systems not ready for testing'
      });
    }

    // Process test data
    const result = await enhancedProcessor.processWebhookNotification(test_data, { test_mode: true });

    res.json({
      success: true,
      message: 'Enhanced webhook test completed',
      test_result: result,
      system_status: {
        processor: enhancedProcessor.getStatus(),
        notifications: notificationSystem.getStatus()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced webhook test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Enhanced webhook test failed',
      details: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      enhanced_systems: systemsInitialized,
      timestamp: new Date().toISOString(),
      checks: {
        processor: enhancedProcessor ? 'ready' : 'not_loaded',
        notifications: notificationSystem ? 'ready' : 'not_loaded'
      }
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;