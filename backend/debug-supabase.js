// Add this simple network test to your debug function
// Replace the existing debugSupaBase function with this enhanced version

const debugSupaBase = async () => {
  console.log('🔍 Enhanced SupaBase debug...');
  
  // Test 1: Basic internet connectivity
  console.log('🌐 Test 1: Basic internet test...');
  try {
    const response = await fetch('https://www.google.com', {
      method: 'GET',
      timeout: 5000
    });
    console.log('✅ Internet works, Google status:', response.status);
  } catch (error) {
    console.error('❌ No internet connection:', error.message);
    Alert.alert('No Internet ❌', 'Your device appears to be offline. Check your WiFi or mobile data connection.', [{ text: 'OK' }]);
    return false;
  }

  // Test 2: SupaBase domain connectivity
  console.log('🌐 Test 2: SupaBase domain test...');
  try {
    const response = await fetch('https://supabase.com', {
      method: 'GET',
      timeout: 5000
    });
    console.log('✅ SupaBase domain accessible, status:', response.status);
  } catch (error) {
    console.error('❌ Cannot reach SupaBase servers:', error.message);
    Alert.alert('SupaBase Unreachable ❌', 'Cannot connect to SupaBase servers. This might be a network firewall or SupaBase service issue.', [{ text: 'OK' }]);
    return false;
  }

  // Test 3: Your specific SupaBase project
  const SUPABASE_URL = 'https://haountnqhecfrsonivbq.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs';

  console.log('🏗️ Test 3: Your SupaBase project test...');
  try {
    const response = await fetch(SUPABASE_URL, {
      method: 'GET',
      timeout: 10000
    });
    console.log('✅ Your SupaBase project accessible, status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Project is ACTIVE');
    } else {
      console.log('⚠️ Unexpected status - project might be paused');
    }
  } catch (error) {
    console.error('❌ Your SupaBase project unreachable:', error.message);
    Alert.alert(
      'Project Unreachable ❌', 
      'Your SupaBase project cannot be reached. Check:\n\n1. Project is not paused in dashboard\n2. URL is correct\n3. Project exists', 
      [{ text: 'OK' }]
    );
    return false;
  }

  // Test 4: API endpoint with authentication
  console.log('🔑 Test 4: API authentication test...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log('🔑 API endpoint status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ API authentication works');
      
      // Test 5: Table access
      console.log('📊 Test 5: Table access test...');
      const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/traffic_alerts?select=id,title&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('📊 Table query status:', tableResponse.status);

      if (tableResponse.ok) {
        const data = await tableResponse.json();
        console.log('🎉 SUCCESS! Table accessible, found:', data.length, 'records');
        Alert.alert('Debug Success! 🎉', `All tests passed!\n\nFound ${data.length} alerts in your SupaBase.\n\nThe issue was temporary - try refreshing your app now.`, [{ text: 'Great!' }]);
        return true;
      } else {
        const errorText = await tableResponse.text();
        console.error('❌ Table access denied:', tableResponse.status, errorText);
        Alert.alert('Access Denied ❌', `Table query failed with status ${tableResponse.status}.\n\nThis is likely a Row Level Security issue. Run the RLS fix SQL in your SupaBase dashboard.`, [{ text: 'OK' }]);
        return false;
      }
    } else {
      console.error('❌ API authentication failed:', response.status);
      Alert.alert('Auth Failed ❌', `API authentication failed with status ${response.status}.\n\nCheck your API key is correct.`, [{ text: 'OK' }]);
      return false;
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    Alert.alert('API Test Failed ❌', `Could not test API: ${error.message}`, [{ text: 'OK' }]);
    return false;
  }
};