// backend/routes/streetmanagerWebhook.js
// StreetManager SNS Webhook Handler - Following Official Documentation Exactly

import express from 'express';
import https from 'https';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Signature validation functions - EXACTLY as per official docs
async function isValidSignature(body) {
  verifyMessageSignatureVersion(body.SignatureVersion);
  const certificate = await downloadCertificate(body.SigningCertURL);
  return validateSignature(body, certificate);
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

function getMessageToSign(body) {
  switch(body.Type) {
    case 'SubscriptionConfirmation':
      return buildSubscriptionStringToSign(body);
    case 'Notification':
      return buildNotificationStringToSign(body);
    default:
      return;
  }
}

function buildNotificationStringToSign(body) {
  let stringToSign = '';
  stringToSign = "Message\n";
  stringToSign += body.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += body.MessageId + "\n";
  if (body.Subject) {
    stringToSign += "Subject\n";
    stringToSign += body.Subject + "\n";
  }
  stringToSign += "Timestamp\n";
  stringToSign += body.Timestamp + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += body.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += body.Type + "\n";
  return stringToSign;
}

function buildSubscriptionStringToSign(body) {
  let stringToSign = '';
  stringToSign = "Message\n";
  stringToSign += body.Message + "\n";
  stringToSign += "MessageId\n";
  stringToSign += body.MessageId + "\n";
  stringToSign += "SubscribeURL\n";
  stringToSign += body.SubscribeURL + "\n";
  stringToSign += "Timestamp\n";
  stringToSign += body.Timestamp + "\n";
  stringToSign += "Token\n";
  stringToSign += body.Token + "\n";
  stringToSign += "TopicArn\n";
  stringToSign += body.TopicArn + "\n";
  stringToSign += "Type\n";
  stringToSign += body.Type + "\n";
  return stringToSign;
}

// Handle messages
function handleMessage(body) {
  switch(body.Type) {
    case 'SubscriptionConfirmation':
      confirmSubscription(body.SubscribeURL);
      break;
    case 'Notification':
      handleNotification(body);
      break;
    default:
      return;
  }
}

function confirmSubscription(subscriptionUrl) {
  https.get(subscriptionUrl);
  console.log('✅ Subscription confirmed');
}

async function handleNotification(body) {
  console.log(`📬 Received message from SNS: ${body.Message}`);
  
  try {
    // Parse the notification message
    const notificationData = JSON.parse(body.Message);
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('streetmanager_notifications')
      .insert({
        notification_id: `sm_${notificationData.event_reference}_${Date.now()}`,
        webhook_event_type: notificationData.event_type,
        object_type: notificationData.object_type,
        object_reference: notificationData.object_reference,
        raw_webhook_data: notificationData,
        message_attributes: body.MessageAttributes,
        webhook_received_at: new Date().toISOString(),
        processing_status: 'pending'
      });
    
    if (error) {
      console.error('❌ Failed to save notification:', error);
    } else {
      console.log('✅ Notification saved to Supabase');
      
      // Process the notification
      await processNotification(notificationData);
    }
  } catch (err) {
    console.error('❌ Error handling notification:', err);
  }
}

async function processNotification(notificationData) {
  try {
    // Extract relevant data based on object type
    const objectData = notificationData.object_data;
    
    if (!objectData) {
      console.log('⚠️ No object data in notification');
      return;
    }
    
    // Transform to roadwork alert format
    const roadwork = {
      id: `streetmanager_${notificationData.object_reference || notificationData.event_reference}`,
      title: `${objectData.work_category || 'Roadwork'} - ${objectData.street_name || 'Unknown Location'}`,
      description: objectData.description || `${notificationData.event_type} for ${notificationData.object_type}`,
      location: objectData.street_name || objectData.area_name || 'Unknown Location',
      severity: determineSeverity(objectData),
      status: determineStatus(objectData),
      type: 'roadwork',
      source: 'StreetManager',
      dataSource: 'StreetManager Webhook',
      
      // StreetManager specific fields
      permitReference: objectData.permit_reference_number,
      workReference: objectData.work_reference_number,
      activityReference: objectData.activity_reference_number,
      section58Reference: objectData.section_58_reference_number,
      
      // Dates
      proposedStartDate: objectData.proposed_start_date,
      proposedEndDate: objectData.proposed_end_date,
      actualStartDate: objectData.actual_start_date_time,
      actualEndDate: objectData.actual_end_date_time,
      
      // Location details
      streetName: objectData.street_name,
      areaName: objectData.area_name,
      town: objectData.town,
      usrn: objectData.usrn,
      coordinates: parseCoordinates(objectData.works_location_coordinates || objectData.activity_coordinates || objectData.section_58_coordinates),
      
      // Work details
      workCategory: objectData.work_category,
      workCategoryRef: objectData.work_category_ref,
      workStatus: objectData.work_status,
      workStatusRef: objectData.work_status_ref,
      activityType: objectData.activity_type,
      trafficManagementType: objectData.traffic_management_type,
      trafficManagementTypeRef: objectData.traffic_management_type_ref,
      
      // Authority details
      highwayAuthority: objectData.highway_authority,
      highwayAuthoritySwaCode: objectData.highway_authority_swa_code,
      promoterOrganisation: objectData.promoter_organisation,
      promoterSwaCode: objectData.promoter_swa_code,
      
      // Additional flags
      isEmergency: objectData.is_emergency_works === 'Yes',
      isCovid19Response: objectData.is_covid_19_response === 'Yes',
      isTtroRequired: objectData.is_ttro_required === 'Yes',
      isTrafficSensitive: objectData.is_traffic_sensitive === 'Yes',
      isDeemed: objectData.is_deemed === 'Yes',
      
      // Event metadata
      eventType: notificationData.event_type,
      eventReference: notificationData.event_reference,
      eventTime: notificationData.event_time,
      version: notificationData.version,
      
      lastUpdated: new Date().toISOString()
    };
    
    // Save to roadworks collection
    const { error } = await supabase
      .from('roadworks')
      .upsert(roadwork, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('❌ Failed to save roadwork:', error);
    } else {
      console.log('✅ Roadwork saved/updated:', roadwork.id);
    }
    
    // Update notification as processed
    await supabase
      .from('streetmanager_notifications')
      .update({
        processing_status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('object_reference', notificationData.object_reference)
      .eq('webhook_event_type', notificationData.event_type);
      
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
router.post('/', async (req, res) => {
  console.log('📨 StreetManager webhook received');
  console.log('Headers:', req.headers);
  
  try {
    // Parse the text body as JSON
    const body = JSON.parse(req.body);
    console.log('Body type:', body.Type);
    
    // Check for SNS message type header
    if (req.get('x-amz-sns-message-type') == null) {
      console.log('⚠️ No x-amz-sns-message-type header');
      return res.status(400).send('Bad Request');
    }
    
    // Validate signature
    if (await isValidSignature(body)) {
      console.log('✅ Signature validated');
      handleMessage(body);
      res.status(200).send('OK');
    } else {
      console.error('❌ Invalid signature');
      res.status(403).send('Forbidden');
    }
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Status endpoint (for GET requests to main webhook URL)
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ready',
    message: 'StreetManager webhook is configured and ready',
    endpoint: 'POST /api/streetmanager/webhook',
    expects: 'AWS SNS notifications with x-amz-sns-message-type header',
    bodyParser: 'text (as per official docs)',
    documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/',
    test: 'GET /api/streetmanager/webhook/test',
    implementation: 'Exact match to official example',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'ready',
    endpoint: '/api/streetmanager/webhook',
    expects: 'SNS notifications with x-amz-sns-message-type header',
    bodyParser: 'text'
  });
});

export default router;
