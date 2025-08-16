// Fix for StreetManager webhook - ensure raw body is preserved
// This middleware must run BEFORE any body parsing for the webhook route

import express from 'express';

// Create a router that will handle the webhook without any body parsing
const webhookRouter = express.Router();

// This middleware captures the raw body BEFORE any parsing
webhookRouter.use('/api/streetmanager/webhook', (req, res, next) => {
  // Skip if not the webhook endpoint
  if (!req.path.includes('/streetmanager/webhook')) {
    return next();
  }
  
  console.log('🔍 Webhook middleware - capturing raw body...');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('x-amz-sns-message-type:', req.headers['x-amz-sns-message-type']);
  
  // Check if body has already been parsed (this is the problem!)
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    console.error('❌ Body already parsed! This is why webhook sees empty object');
    console.log('Parsed body:', req.body);
  }
  
  let rawBody = '';
  
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('📦 Raw body captured:', rawBody.substring(0, 200) + '...');
    
    // Store raw body for the webhook handler
    req.rawBody = rawBody;
    
    // Parse it ourselves
    try {
      req.body = JSON.parse(rawBody);
      console.log('✅ Successfully parsed SNS message');
      console.log('Message Type:', req.body.Type);
      console.log('Has SubscribeURL:', !!req.body.SubscribeURL);
    } catch (e) {
      console.error('❌ Failed to parse raw body:', e.message);
      req.body = {};
    }
    
    next();
  });
  
  req.on('error', (err) => {
    console.error('❌ Error reading request body:', err);
    next(err);
  });
});

export default webhookRouter;
