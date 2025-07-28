// Test Supabase connection with custom fetch
import { supabaseOptimizer } from './services/supabaseOptimizer.js';

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test getting recent alerts
    const result = await supabaseOptimizer.getRecentAlerts(5);
    console.log('Supabase test result:', result);
    
    if (result.success) {
      console.log('✅ Supabase connection successful!');
      console.log(`Found ${result.data.length} alerts`);
    } else {
      console.log('❌ Supabase connection failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Test error:', error);
  }
}

testSupabase();
