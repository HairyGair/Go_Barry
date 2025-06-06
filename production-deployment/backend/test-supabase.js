// Test script to verify SupaBase connection
// Add this to a new file: Go_BARRY/test-supabase.js

export async function testSupaBaseConnection() {
  console.log('🧪 Testing SupaBase connection...');
  
  const SUPABASE_URL = 'https://haountnqhecfrsonivbq.supabase.co';
  const SUPABASE_ANON_KEY = 'PUT_YOUR_ANON_KEY_HERE'; // Replace with your actual key
  
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'PUT_YOUR_ANON_KEY_HERE') {
    console.error('❌ Please add your SupaBase anon key first!');
    console.log('📍 Go to: https://supabase.com/dashboard → Settings → API');
    console.log('📋 Copy the "anon public" key and replace PUT_YOUR_ANON_KEY_HERE');
    return false;
  }
  
  try {
    console.log('📡 Testing connection to SupaBase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/traffic_alerts?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ SupaBase connection failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ SupaBase connection successful!');
    console.log(`📊 Found ${data.length} alerts in database`);
    
    if (data.length > 0) {
      console.log('📋 Sample alert:', data[0].title);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Test function you can call from your app
export async function quickTest() {
  const success = await testSupaBaseConnection();
  
  if (success) {
    console.log('🎉 SupaBase is ready! Your app will now show live alerts.');
  } else {
    console.log('🔧 SupaBase setup needed. Follow the steps to configure your API key.');
  }
  
  return success;
}