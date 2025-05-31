// backend/check-env.js
// Script to verify SupaBase environment variables

import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking SupaBase environment variables...\n');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Check URL format
console.log('📍 SUPABASE_URL Analysis:');
if (!SUPABASE_URL) {
  console.log('❌ SUPABASE_URL is not set');
} else {
  console.log(`✅ SUPABASE_URL is set: ${SUPABASE_URL}`);
  
  // Check URL format
  if (SUPABASE_URL.includes('.supabase.co')) {
    console.log('✅ URL format looks correct');
  } else {
    console.log('⚠️ URL format might be incorrect - should end with .supabase.co');
  }
}

console.log('\n🔑 SUPABASE_SERVICE_KEY Analysis:');
if (!SUPABASE_SERVICE_KEY) {
  console.log('❌ SUPABASE_SERVICE_KEY is not set');
} else {
  console.log(`✅ SUPABASE_SERVICE_KEY is set`);
  console.log(`📏 Length: ${SUPABASE_SERVICE_KEY.length} characters`);
  
  // Check key format
  if (SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
    console.log('✅ Key format looks correct (starts with eyJ)');
  } else {
    console.log('❌ Key format is incorrect - should start with "eyJ"');
  }
  
  // Show first and last few characters for debugging
  const start = SUPABASE_SERVICE_KEY.substring(0, 10);
  const end = SUPABASE_SERVICE_KEY.substring(SUPABASE_SERVICE_KEY.length - 10);
  console.log(`🔍 Key preview: ${start}...${end}`);
  
  // Check if it might be the anon key instead
  if (SUPABASE_SERVICE_KEY.length < 200) {
    console.log('⚠️ Key seems short - make sure you\'re using the SERVICE ROLE key, not anon key');
  }
}

console.log('\n📋 Summary:');
console.log('Make sure you have:');
console.log('1. Created a SupaBase project at supabase.com');
console.log('2. Gone to Settings → API in your project');
console.log('3. Copied the PROJECT URL (not the API URL)');
console.log('4. Copied the SERVICE ROLE key (not the anon public key)');
console.log('5. Added both to your .env file');

console.log('\n📄 Your .env file should look like:');
console.log('SUPABASE_URL=https://your-project-id.supabase.co');
console.log('SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
} else if (!SUPABASE_URL.includes('.supabase.co') || !SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
  console.log('\n⚠️ Environment variables format looks incorrect!');
  process.exit(1);
} else {
  console.log('\n✅ Environment variables format looks good!');
  console.log('If you\'re still getting "Invalid API key", double-check:');
  console.log('1. The keys are copied correctly (no extra spaces)');
  console.log('2. You\'re using the SERVICE ROLE key (not anon key)');
  console.log('3. The SupaBase project is active and not paused');
}