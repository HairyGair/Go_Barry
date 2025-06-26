#!/usr/bin/env node
// Test script to verify StreetManager webhook fix

import http from 'http';

const WEBHOOK_URL = 'http://localhost:3001/api/streetmanager/webhook';

// Test subscription confirmation with proper SNS format
async function testSubscriptionConfirmation() {
  console.log('\n🧪 Testing StreetManager Webhook Fix');
  console.log('=====================================\n');
  
  const subscriptionMessage = {
    "Type": "SubscriptionConfirmation",
    "MessageId": "165545c9-2a5c-472c-8df2-6ffa4d5b2b7c",
    "Token": "2336412f37fb685f5d51e6e24f5de7c4b5c8e9b0a9f14dc29f6a76d2c8f4e9d2",
    "TopicArn": "arn:aws:sns:eu-west-2:123456789012:MyTopic",
    "Message": "You have chosen to subscribe to the topic arn:aws:sns:eu-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
    "SubscribeURL": "https://sns.eu-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-west-2:123456789012:MyTopic&Token=2336412f37fb685f5d51e6e24f5de7c4b5c8e9b0a9f14dc29f6a76d2c8f4e9d2",
    "Timestamp": "2025-06-26T10:15:00.000Z",
    "SignatureVersion": "1",
    "Signature": "EXAMPLEpH+DcEwjAPg8O9mY8dWBKjZCnNOvVYBZGHT...",
    "SigningCertURL": "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-a86cb10b4e1f29c941702d737128f7b6.pem"
  };

  const body = JSON.stringify(subscriptionMessage);
  
  console.log('📤 Sending subscription confirmation...');
  console.log('Message Type:', subscriptionMessage.Type);
  console.log('Has SubscribeURL:', !!subscriptionMessage.SubscribeURL);
  console.log('Body length:', body.length);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/streetmanager/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-amz-sns-message-type': 'SubscriptionConfirmation',
      'x-amz-sns-message-id': subscriptionMessage.MessageId,
      'x-amz-sns-topic-arn': subscriptionMessage.TopicArn
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        console.log('\n✅ Response Status:', res.statusCode);
        console.log('Response Headers:', res.headers);
        
        try {
          const response = JSON.parse(responseBody);
          console.log('Response Body:', JSON.stringify(response, null, 2));
          
          if (response.subscribeUrl && response.subscribeUrl !== 'NOT FOUND') {
            console.log('\n🎉 SUCCESS! Webhook correctly received SubscribeURL');
            console.log('SubscribeURL found:', response.subscribeUrl);
          } else {
            console.log('\n❌ FAILED! Webhook did not find SubscribeURL');
            console.log('This means the body is still being consumed before reaching the handler');
          }
        } catch (e) {
          console.error('Failed to parse response:', e);
          console.log('Raw response:', responseBody);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    // Write the body
    req.write(body);
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    // Check if server is running
    await new Promise((resolve) => {
      http.get('http://localhost:3001/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running on port 3001');
          resolve();
        }
      }).on('error', () => {
        console.error('❌ Server is not running! Start it with: cd backend && npm start');
        process.exit(1);
      });
    });
    
    await testSubscriptionConfirmation();
    
    console.log('\n📝 Fix Summary:');
    console.log('1. Modified render-startup.js to skip JSON parsing for /api/streetmanager/webhook');
    console.log('2. Updated webhook handler to read raw body manually');
    console.log('3. This preserves the SNS message structure exactly as Jason described');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTest();
