import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  console.log('📋 URL:', url);
  console.log('📋 Key present:', !!key);
  console.log('📋 Key length:', key?.length || 0);
  
  try {
    const response = await axios.get(`${url}/rest/v1/streetworks`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      params: { limit: 3 },
      timeout: 10000
    });
    
    console.log('✅ Success! Records found:', response.data.length);
    if (response.data.length > 0) {
      console.log('📋 Sample record:', {
        id: response.data[0].id,
        reference: response.data[0].sm_reference,
        description: response.data[0].sm_works_description
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('📊 Response:', error.response?.data);
  }
}

testSupabaseConnection();