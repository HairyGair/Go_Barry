// Test script to verify StreetManager webhook handles format correctly
// Following Jason Hamilton's guidance on SNS message structure

import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3001/api/streetmanager/webhook';

// Test 1: Send subscription confirmation exactly as Jason described
async function testSubscriptionConfirmation() {
  console.log('\n🧪 TEST 1: Subscription Confirmation (Jason\'s format)');
  console.log('================================================');
  
  const subscriptionMessage = {
    "Type": "SubscriptionConfirmation",
    "MessageId": "test-guid-12345",
    "Token": "test-token-67890",
    "TopicArn": "arn:aws:sns:eu-west-2:123456789:streetmanager-topic",
    "Message": "You have chosen to subscribe to the topic arn:aws:sns:eu-west-2:123456789:streetmanager-topic\nTo confirm the subscription, visit the SubscribeURL included in this message.",
    "SubscribeURL": "https://sns.eu-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-west-2:123456789:streetmanager-topic&Token=test-token-67890",
    "Timestamp": "2025-06-26T10:05:15.215Z",
    "SignatureVersion": "1",
    "Signature": "test-signature-data",
    "SigningCertURL": "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-a86cb10b4e1f29c941702d737128f7b6.pem"
  };
  
  console.log('📤 Sending subscription confirmation with flat structure (no nested body)...');
  console.log('Key fields at root level:');
  console.log('  - Type:', subscriptionMessage.Type);
  console.log('  - SubscribeURL:', subscriptionMessage.SubscribeURL ? 'Present' : 'Missing');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-sns-message-type': 'SubscriptionConfirmation',
        'x-amz-sns-message-id': subscriptionMessage.MessageId,
        'x-amz-sns-topic-arn': subscriptionMessage.TopicArn
      },
      body: JSON.stringify(subscriptionMessage)
    });
    
    const result = await response.json();
    console.log('\n✅ Response received:', result);
    
    if (result.subscribeUrl) {
      console.log('✅ Webhook correctly found SubscribeURL at root level');
    } else {
      console.log('❌ Webhook failed to find SubscribeURL - it might be looking in wrong place');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 2: Send a notification message
async function testNotification() {
  console.log('\n🧪 TEST 2: Notification Message');
  console.log('================================');
  
  const notificationMessage = {
    "Type": "Notification",
    "MessageId": "test-notification-12345",
    "TopicArn": "arn:aws:sns:eu-west-2:123456789:streetmanager-topic",
    "Subject": "StreetManager Update",
    "Message": JSON.stringify({
      "event_type": "PERMIT_CREATED",
      "event_time": "2025-06-26T10:30:00Z",
      "object_type": "PERMIT",
      "object_reference": "TEST-PERMIT-001",
      "object_data": {
        "permit_reference_number": "TEST-PERMIT-001",
        "highway_authority": "Newcastle City Council",
        "street_name": "Test Street",
        "work_description": "Test roadwork"
      }
    }),
    "Timestamp": "2025-06-26T10:30:15.215Z",
    "SignatureVersion": "1",
    "Signature": "test-signature-data"
  };
  
  console.log('📤 Sending notification with Message field containing JSON string...');
  console.log('Structure: root.Message = JSON string of actual data');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-sns-message-type': 'Notification',
        'x-amz-sns-message-id': notificationMessage.MessageId,
        'x-amz-sns-topic-arn': notificationMessage.TopicArn
      },
      body: JSON.stringify(notificationMessage)
    });
    
    const result = await response.json();
    console.log('\n✅ Response received:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 3: Common mistake - nested body structure
async function testIncorrectNestedStructure() {
  console.log('\n🧪 TEST 3: Incorrect Nested Structure (what NOT to do)');
  console.log('======================================================');
  
  const incorrectMessage = {
    body: {
      Type: "SubscriptionConfirmation",
      SubscribeURL: "https://example.com/subscribe"
    }
  };
  
  console.log('📤 Sending INCORRECT nested structure (body.Type, body.SubscribeURL)...');
  console.log('This should fail or be handled differently');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-sns-message-type': 'SubscriptionConfirmation'
      },
      body: JSON.stringify(incorrectMessage)
    });
    
    const result = await response.json();
    console.log('\n📋 Response:', result);
    
    if (!result.subscribeUrl || result.subscribeUrl === 'NOT FOUND') {
      console.log('✅ Good - webhook correctly failed to find SubscribeURL in nested structure');
    } else {
      console.log('⚠️  Webhook found SubscribeURL in nested structure - this suggests it\'s looking in wrong place');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Testing StreetManager Webhook Format Handling');
  console.log('Following Jason Hamilton\'s guidance on SNS structure\n');
  
  await testSubscriptionConfirmation();
  await testNotification();
  await testIncorrectNestedStructure();
  
  console.log('\n✅ All tests completed');
  console.log('\n📝 Summary:');
  console.log('- SNS messages have fields at root level (Type, SubscribeURL, etc.)');
  console.log('- There is no nested "body" field in the SNS schema');
  console.log('- The Message field contains a JSON string for notifications');
  console.log('- Code should access fields directly: message.Type, message.SubscribeURL');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running. Start it with: cd backend && npm start');
    return false;
  }
}

// Main
(async () => {
  if (await checkServer()) {
    await runAllTests();
  }
})();
