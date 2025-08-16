// backend/routes/streetmanagerWebhook.js
// StreetManager SNS Webhook Handler - Following Official Documentation Exactly

import express from 'express';
import https from 'https';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { processStreetManagerWebhook } from '../services/streetManager.js';
import { processWebhookToStreetworks } from '../services/streetManagerProcessor.js';
import HybridStreetManagerStorage from '../services/hybridStreetManagerStorage.js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize hybrid storage with error handling
let hybridStorage;
try {
  hybridStorage = new HybridStreetManagerStorage();
  console.log('✅ Hybrid Street Manager storage initialized');
} catch (error) {
  console.warn('⚠️ Hybrid storage failed to initialize:', error.message);
  console.log('🔄 Webhook will continue processing without hybrid storage');
  hybridStorage = null;
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

// Handle messages
function handleMessage(snsMessage) {
  switch(snsMessage.Type) {
    case 'SubscriptionConfirmation':
      confirmSubscription(snsMessage.SubscribeURL);
      break;
    case 'Notification':
      handleNotification(snsMessage);
      break;
    default:
      return;
  }
}

function confirmSubscription(subscriptionUrl) {
  https.get(subscriptionUrl);
  console.log('✅ Subscription confirmed');
}

async function handleNotification(snsMessage) {
  console.log(`📬 Received notification from SNS`);
  console.log(`Message content: ${snsMessage.Message}`);
  
  try {
    // Parse the notification message
    const notificationData = JSON.parse(snsMessage.Message);
    
    // Create consistent notification ID
    const notificationId = `sm_${notificationData.event_reference}_${snsMessage.MessageId}`;
    
    // Store using new hybrid storage system (with fallback)
    if (hybridStorage) {
      try {
        const storageResult = await hybridStorage.storeNotification({
          ...notificationData,
          notificationId,
          messageAttributes: snsMessage.MessageAttributes,
          receivedAt: new Date().toISOString(),
          processingStatus: 'pending'
        });
        
        if (storageResult.success) {
          console.log('✅ Notification saved via hybrid storage (summary + JSON file)');
        } else {
          console.error('❌ Failed to save notification:', storageResult.error);
        }
      } catch (storageError) {
        console.warn('⚠️ Hybrid storage error (continuing anyway):', storageError.message);
      }
    } else {
      console.log('⚠️ Hybrid storage not available - processing notification without storage');
    }
    
    // ALWAYS process the notification regardless of storage success
    await processNotification(notificationData, notificationId);
  } catch (err) {
    console.error('❌ Error handling notification:', err);
  }
}

async function processNotification(notificationData, notificationId) {
  try {
    // Process to new streetworks table for V2 system
    const v2Result = await processWebhookToStreetworks(notificationData);
    if (v2Result.success) {
      console.log(`✅ V2: Streetwork saved for review (${v2Result.autoMatchedRoutes} routes matched)`);
    }
    
    // Also use the enhanced processing function for existing system
    const alert = await processStreetManagerWebhook(notificationData);
    
    if (!alert) {
      console.log('⚠️ Notification filtered out (likely non-North East)');
      // Note: Filtered notifications will be cleaned up automatically after 7 days
      // No need to update status in hybrid storage - saves database writes
      return;
    }
    
    // Save enhanced alert with route impacts
    const { error } = await supabase
      .from('roadworks')
      .upsert({
        ...alert,
        // Additional webhook-specific fields
        notificationId: `sm_${notificationData.event_reference}_${Date.now()}`,
        routeImpacts: alert.affectedRoutes || [],
        impactedRouteCount: alert.affectedRoutes?.length || 0,
        processedAt: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('❌ Failed to save roadwork:', error);
    } else {
      console.log(`✅ Roadwork saved: ${alert.title} affecting ${alert.affectedRoutes?.length || 0} routes`);
      
      // If high impact, also sync to alerts
      if (alert.affectedRoutes?.length > 3 || alert.severity === 'High') {
        const { error: alertError } = await supabase
          .from('traffic_alerts')
          .upsert({
            ...alert,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
          
        if (!alertError) {
          console.log('🚨 High-impact alert created for traffic monitoring');
        }
      }
    }
    
    // Note: Processing status tracked in roadworks table instead of separate notifications table
    // This reduces database writes and prevents table bloat
    console.log(`✅ Notification ${notificationId} processed successfully`);
      
  } catch (err) {
    console.error('❌ Error processing notification:', err);
  }
}

function determineSeverity(objectData) {
  // High severity
  if (objectData.is_emergency_works === 'Yes' ||
      objectData.traffic_management_type_ref === 'road_closure' ||
      objectData.work_category_ref === 'major' ||
      objectData.work_status_ref === 'in_progress') {
    return 'High';
  }
  
  // Medium severity
  if (objectData.traffic_management_type_ref === 'multi_way_signals' ||
      objectData.work_category_ref === 'standard' ||
      objectData.is_traffic_sensitive === 'Yes') {
    return 'Medium';
  }
  
  // Default to Low
  return 'Low';
}

function determineStatus(objectData) {
  const workStatus = objectData.work_status_ref || objectData.activity_status || '';
  
  if (workStatus === 'in_progress' || workStatus === 'active') {
    return 'red';
  }
  
  if (workStatus === 'proposed' || workStatus === 'planned') {
    return 'amber';
  }
  
  return 'green';
}

function parseCoordinates(coordString) {
  if (!coordString) return null;
  
  try {
    // Handle POINT format
    if (coordString.startsWith('POINT')) {
      const match = coordString.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        return [lat, lng];
      }
    }
    
    // Handle LINESTRING format (take first point)
    if (coordString.startsWith('LINESTRING')) {
      const match = coordString.match(/LINESTRING\(([\d.-]+)\s+([\d.-]+)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        return [lat, lng];
      }
    }
  } catch (err) {
    console.error('Failed to parse coordinates:', err);
  }
  
  return null;
}

// Main webhook endpoint - EXACTLY as per official docs
router.post('/', handleWebhook);
router.post('/webhook', handleWebhook);

async function handleWebhook(req, res) {
  console.log('📨 StreetManager webhook received');
  console.log('Headers:', req.headers);
  
  try {
    // Parse the text body as JSON to get the SNS message
    const snsMessage = JSON.parse(req.body);
    console.log('SNS Message Type:', snsMessage.Type);
    console.log('SNS Message Fields:', Object.keys(snsMessage));
    
    // Check for SNS message type header
    if (req.get('x-amz-sns-message-type') == null) {
      console.log('⚠️ No x-amz-sns-message-type header');
      return res.status(400).send('Bad Request');
    }
    
    // Log the SubscribeURL if present (for SubscriptionConfirmation)
    if (snsMessage.Type === 'SubscriptionConfirmation' && snsMessage.SubscribeURL) {
      console.log('🔗 SubscribeURL found:', snsMessage.SubscribeURL);
    }
    
    // Validate signature
    if (await isValidSignature(snsMessage)) {
      console.log('✅ Signature validated');
      handleMessage(snsMessage);
      res.status(200).send('OK');
    } else {
      console.error('❌ Invalid signature');
      res.status(403).send('Forbidden');
    }
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
}

// Status endpoint (for GET requests to main webhook URL)
router.get('/', statusHandler);
router.get('/webhook', statusHandler);

async function statusHandler(req, res) {
  // Get storage stats (with fallback)
  let stats = { database: { size_estimate: 'N/A' }, files: { size_estimate: 'N/A' } };
  if (hybridStorage) {
    try {
      stats = await hybridStorage.getStorageStats();
    } catch (error) {
      console.warn('⚠️ Failed to get storage stats:', error.message);
    }
  }
  
  res.json({
    success: true,
    status: 'ready',
    message: 'StreetManager webhook with hybrid storage (fixed 489MB bloat)',
    endpoint: 'POST /api/streetmanager/webhook',
    expects: 'AWS SNS notifications with x-amz-sns-message-type header',
    bodyParser: 'text (as per official docs)',
    storage: {
      type: hybridStorage ? 'hybrid' : 'processing-only',
      description: hybridStorage 
        ? 'Lightweight summaries in database + full payloads in JSON files'
        : 'Webhook processing without storage (fallback mode)',
      database_size: stats.database.size_estimate,
      json_files: stats.files.size_estimate,
      retention: '7 days after roadwork completion',
      status: hybridStorage ? 'active' : 'fallback_mode'
    },
    documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/',
    test: 'GET /api/streetmanager/webhook/test',
    implementation: 'Official SNS webhook + hybrid storage system',
    fixed: 'Database bloat issue resolved (489MB → lightweight summaries)',
    timestamp: new Date().toISOString()
  });
}

// Test endpoint
router.get('/test', testHandler);
router.get('/webhook/test', testHandler);

function testHandler(req, res) {
  res.json({
    status: 'ready',
    endpoint: '/api/streetmanager/webhook',
    expects: 'SNS notifications with x-amz-sns-message-type header',
    bodyParser: 'text'
  });
}

export default router;
