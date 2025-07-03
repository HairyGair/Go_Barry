// Test script for Communications API
// Run with: node test-communications-api.js

import fetch from 'node-fetch';

// const API_BASE = 'http://localhost:3001';
const API_BASE = 'https://go-barry.onrender.com';

const TEST_SUPERVISOR = {
  id: 'supervisor003',
  name: 'Anthony Gair',
  badge: 'AG003'
};

console.log('🧪 Testing Communications API...\n');

async function testEndpoint(name, method, path, body = null) {
  console.log(`📍 Testing: ${name}`);
  console.log(`   ${method} ${API_BASE}${path}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'supervisor-id': TEST_SUPERVISOR.id,
        'supervisor-name': TEST_SUPERVISOR.name
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`   ✅ Success:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`   ❌ Failed:`, response.status, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('');
}

async function runTests() {
  // Test health endpoint
  await testEndpoint(
    'Communications Health Check',
    'GET',
    '/api/communications/health'
  );
  
  // Test email templates
  await testEndpoint(
    'Get Email Templates',
    'GET',
    '/api/communications/email/templates'
  );
  
  // Test distribution lists
  await testEndpoint(
    'Get Distribution Lists',
    'GET',
    '/api/communications/email/distribution-lists'
  );
  
  // Test email validation
  await testEndpoint(
    'Validate Email Addresses',
    'POST',
    '/api/communications/email/validate',
    {
      emails: [
        'valid@example.com',
        'another.valid+tag@company.co.uk',
        'invalid-email',
        'missing@domain',
        'spaces in@email.com'
      ]
    }
  );
  
  // Test sending an email
  await testEndpoint(
    'Send Test Email',
    'POST',
    '/api/communications/email/send',
    {
      to: ['traffic.control@gonortheast.com'],
      cc: [],
      bcc: [],
      subject: 'Test Email from Go BARRY Communications API',
      body: `<p>This is a test email sent via the Go BARRY Communications Platform.</p>
             <p><strong>Sent by:</strong> ${TEST_SUPERVISOR.name}</p>
             <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
             <p>This email was queued for delivery through the communications service.</p>`,
      priority: 'normal'
    }
  );
  
  // Test VoIP quick dial numbers
  await testEndpoint(
    'Get VoIP Quick Dial Numbers',
    'GET',
    '/api/communications/voip/quick-dial'
  );
  
  // Test VoIP emergency numbers
  await testEndpoint(
    'Get VoIP Emergency Numbers',
    'GET',
    '/api/communications/voip/emergency'
  );
  
  // Test queue status
  await testEndpoint(
    'Get Message Queue Status',
    'GET',
    '/api/communications/queue/status'
  );
  
  console.log('✅ All tests completed!\n');
}

// Run the tests
runTests().catch(console.error);