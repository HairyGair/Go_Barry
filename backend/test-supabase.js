import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'Not set');

try {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  console.log('\nTesting streetworks table...');
  const { data, error } = await supabase.from('streetworks').select('*').limit(1);
  
  if (error) {
    console.log('Streetworks query error:', error);
  } else {
    console.log('Streetworks query success, rows:', data.length);
  }
  
  console.log('\nTesting roadworks table...');
  const { data: roadworksData, error: roadworksError } = await supabase.from('roadworks').select('*').limit(1);
  
  if (roadworksError) {
    console.log('Roadworks query error:', roadworksError);
  } else {
    console.log('Roadworks query success, rows:', roadworksData.length);
  }
  
} catch (err) {
  console.log('Connection error:', err.message);
}