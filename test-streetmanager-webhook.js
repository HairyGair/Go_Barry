// Test Street Manager webhook locally

const testWebhook = async () => {
  try {
    console.log('Testing Street Manager webhook...\n');
    
    // Test status endpoint first
    console.log('1. Testing status endpoint...');
    const statusResponse = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook/status');
    const statusData = await statusResponse.json();
    console.log('Status response:', JSON.stringify(statusData, null, 2));
    
    // Test the test endpoint
    console.log('\n2. Testing test endpoint...');
    const testResponse = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const testData = await testResponse.json();
    console.log('Test response:', JSON.stringify(testData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testWebhook();
