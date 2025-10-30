import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://oieliubbvvdzhzvikzal.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = process.argv[2];
const newPassword = process.argv[3] || 'TempPass123!';

if (!email) {
  console.error('Usage: node reset-supervisor.js <email> [new-password]');
  console.error('');
  console.error('Example: node reset-supervisor.js simon.glass@gonortheast.co.uk "NewPass2025!"');
  console.error('');
  console.error('Note: Password must contain lowercase, uppercase, numbers, and special characters');
  process.exit(1);
}

console.log(`🔄 Resetting password for ${email}...`);

// Get supervisor to find auth_user_id
const { data: supervisor, error: lookupError } = await supabase
  .from('supervisors')
  .select('auth_user_id, name')
  .eq('email', email.toLowerCase())
  .single();

if (lookupError || !supervisor) {
  console.error(`❌ Supervisor not found: ${email}`);
  process.exit(1);
}

if (!supervisor.auth_user_id) {
  console.log(`✅ No auth account yet - they can sign up fresh`);
  process.exit(0);
}

// Reset password using admin API
const { data, error } = await supabase.auth.admin.updateUserById(
  supervisor.auth_user_id,
  { password: newPassword }
);

if (error) {
  console.error(`❌ Failed to reset password:`, error.message);
  process.exit(1);
}

console.log(`✅ Password reset for ${supervisor.name} (${email})`);
console.log(`🔑 New password: ${newPassword}`);
console.log('');
console.log('📧 Please provide this password to the supervisor securely.');
