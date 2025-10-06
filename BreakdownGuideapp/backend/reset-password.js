import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key for this
);

async function resetPassword(email, newPassword) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId, // Need to get user ID first
    { password: newPassword }
  );
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Password updated successfully');
}

// Usage: node reset-password.js
