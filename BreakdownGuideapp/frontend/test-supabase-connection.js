// Test Supabase Connection
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://oieliubbvvdzhzvikzal.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8'

console.log('🔍 Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
async function testConnection() {
  try {
    console.log('\n📡 Testing basic connection...')
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('supervisors')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔑 API Key Issues:')
        console.log('- Check if your Supabase project is active')
        console.log('- Verify the API key hasn\'t expired')
        console.log('- Ensure you\'re using the anon key (not service key)')
        console.log('- Check if the project URL is correct')
      }
      
      return false
    }
    
    console.log('✅ Basic connection successful!')
    console.log('Supervisors table exists:', data !== null)
    
    // Test 2: Try to read supervisors
    console.log('\n📋 Testing supervisors table...')
    const { data: supervisors, error: supervisorsError } = await supabase
      .from('supervisors')
      .select('name, email')
      .limit(5)
    
    if (supervisorsError) {
      console.error('❌ Supervisors query failed:', supervisorsError.message)
      return false
    }
    
    console.log('✅ Supervisors query successful!')
    console.log('Found', supervisors?.length || 0, 'supervisors')
    if (supervisors?.length > 0) {
      console.log('Sample:', supervisors[0])
    }
    
    // Test 3: Test auth
    console.log('\n🔐 Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message)
    } else {
      console.log('✅ Auth system accessible!')
      console.log('Current session:', authData.session ? 'Active' : 'None')
    }
    
    return true
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

// Run test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase connection is working.')
  } else {
    console.log('\n❌ Connection tests failed. Check the issues above.')
    console.log('\n🛠️  Next steps:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Check if your project is active')
    console.log('3. Verify API keys in Settings > API')
    console.log('4. Check if supervisors table exists')
    console.log('5. Ensure RLS policies allow read access')
  }
}).catch(err => {
  console.error('💥 Test script failed:', err)
})
