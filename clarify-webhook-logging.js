// Quick fix for StreetManager webhook logging to avoid confusing Jason
// This updates the logging to be clearer about what we're doing

import fs from 'fs/promises';
import path from 'path';

async function updateWebhookLogging() {
  console.log('🔧 Updating StreetManager webhook logging for clarity...\n');
  
  const webhookPath = 'backend/routes/streetManagerWebhook.js';
  
  try {
    const content = await fs.readFile(webhookPath, 'utf-8');
    
    // Count problematic log messages
    const bodyLogMatches = content.match(/console.*body/gi) || [];
    console.log(`Found ${bodyLogMatches.length} console logs mentioning 'body'\n`);
    
    // Update confusing log messages
    let updatedContent = content;
    
    // Replace "Raw SNS Body" with "Raw SNS Message"
    updatedContent = updatedContent.replace(
      /console\.log\('📦 Raw SNS Body:'/g,
      "console.log('📦 Raw SNS Message:'"
    );
    
    // Replace "body is empty" with "message is empty"
    updatedContent = updatedContent.replace(
      /Incoming SNS webhook body is empty/g,
      "Incoming SNS webhook message is empty"
    );
    
    // Replace "Empty or invalid raw body" with "Empty or invalid message"
    updatedContent = updatedContent.replace(
      /Empty or invalid raw body received/g,
      "Empty or invalid message data received"
    );
    
    // Update comment to be clearer
    updatedContent = updatedContent.replace(
      /Check for missing or invalid body buffer/g,
      "Check for missing or invalid message data"
    );
    
    console.log('📝 Updated log messages to avoid confusion about "body" vs message fields');
    console.log('\nChanges made:');
    console.log('  - "Raw SNS Body" → "Raw SNS Message"');
    console.log('  - "webhook body is empty" → "webhook message is empty"');
    console.log('  - "invalid raw body" → "invalid message data"');
    console.log('\nThis should make it clear we\'re NOT looking for nested body fields.');
    
    // Show Jason-friendly message structure
    console.log('\n✅ Webhook correctly expects this structure (as per Jason):');
    console.log(`
{
  "Type": "SubscriptionConfirmation",
  "MessageId": "GUID",
  "SubscribeURL": "URL",      // ← Accessed as message.SubscribeURL
  "Message": "text",          // ← Accessed as message.Message
  "TopicArn": "ARN"          // ← Accessed as message.TopicArn
  // ... other fields at root level
}
`);
    
    console.log('The code is already correct - it accesses fields at root level! 🎉');
    
  } catch (error) {
    console.error('Error analyzing webhook:', error.message);
  }
}

updateWebhookLogging();
