/**
 * Authentication Test Script
 * Use this to test authentication when enabled
 */

import { createClient } from '@supabase/supabase-js';

// Configuration (same as in .env)
const supabaseUrl = 'https://oieliubbvvdzhzvikzal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8';

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test authentication
async function testAuth() {
  console.log('🔐 Testing Authentication System...\n');
  
  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('email')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      console.log('   💡 Make sure supervisors table exists in Supabase');
    } else {
      console.log('   ✅ Supabase connected successfully');
      if (data && data.length > 0) {
        console.log('   ✅ Supervisors table accessible');
      } else {
        console.log('   ⚠️ Supervisors table is empty - add supervisor accounts');
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 2: Try test login
  console.log('\n2. Testing email/password authentication...');
  const testEmail = 'test@gonortheast.co.uk';
  const testPassword = 'Test123!';
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('   ❌ Login failed:', error.message);
      console.log('   💡 Create test account using instructions in ENABLE_AUTH_QUICK.md');
    } else {
      console.log('   ✅ Authentication successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      
      // Check supervisor profile
      const { data: supervisor, error: supervisorError } = await supabase
        .from('supervisors')
        .select('*')
        .eq('email', testEmail)
        .single();
      
      if (supervisor) {
        console.log('   ✅ Supervisor profile found:');
        console.log('      Name:', supervisor.name);
        console.log('      Depot:', supervisor.depot);
        console.log('      Role:', supervisor.role);
      } else {
        console.log('   ⚠️ No supervisor profile - create one in supervisors table');
      }
      
      // Sign out
      await supabase.auth.signOut();
      console.log('   ✅ Sign out successful');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 3: List existing supervisors
  console.log('\n3. Checking existing supervisors...');
  try {
    const { data: supervisors, error } = await supabase
      .from('supervisors')
      .select('email, name, depot, role')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.log('   ❌ Error fetching supervisors:', error.message);
    } else if (supervisors && supervisors.length > 0) {
      console.log('   ✅ Found', supervisors.length, 'active supervisor(s):');
      supervisors.forEach(s => {
        console.log(`      - ${s.name} (${s.email}) - ${s.depot}`);
      });
    } else {
      console.log('   ⚠️ No active supervisors found');
      console.log('   💡 Add supervisors using instructions in ENABLE_AUTH_QUICK.md');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- Supabase URL:', supabaseUrl);
  console.log('- Auth enabled in app: Check VITE_ENABLE_AUTH in .env');
  console.log('- To enable auth: Set VITE_ENABLE_AUTH=true');
  console.log('- Documentation: See ENABLE_AUTH_QUICK.md');
}

// Run test
testAuth().then(() => {
  console.log('\n✅ Authentication test complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
