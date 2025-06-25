// reset-david-hall-password.js
// Script to reset David Hall's password

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'backend', '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function resetDavidHallPassword() {
  console.log('🔐 Resetting password for David Hall (DH005)...');
  
  try {
    // First, check if David Hall exists in Supabase
    const { data: supervisor, error: fetchError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', 'supervisor005')
      .eq('badge', 'DH005')
      .single();
    
    if (fetchError || !supervisor) {
      console.log('⚠️ David Hall not found in Supabase, checking if we need to create the record...');
      
      // Create the supervisor record in Supabase if it doesn't exist
      const { error: insertError } = await supabase
        .from('supervisors')
        .insert({
          id: 'supervisor005',
          name: 'David Hall',
          badge: 'DH005',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          password_hash: null, // No password hash - will force reset
          password_reset_required: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to create supervisor record:', insertError);
        return;
      }
      
      console.log('✅ Created David Hall record in Supabase with password reset required');
    } else {
      // Update existing record to clear password and require reset
      const { error: updateError } = await supabase
        .from('supervisors')
        .update({
          password_hash: null, // Clear the password hash
          password_reset_required: true, // Set flag to require password reset
          updated_at: new Date().toISOString()
        })
        .eq('id', 'supervisor005');
      
      if (updateError) {
        console.error('❌ Failed to update password:', updateError);
        return;
      }
      
      console.log('✅ Password cleared for David Hall');
      console.log('✅ Password reset flag set - David will be prompted to set a new password on next login');
    }
    
    // Log the password reset action
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        action: 'password_reset',
        details: {
          supervisorId: 'supervisor005',
          supervisorName: 'David Hall',
          resetBy: 'System Administrator',
          reason: 'Requested password reset'
        },
        supervisor_id: null, // System action
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.warn('⚠️ Failed to log password reset action:', logError);
    }
    
    console.log('\n📝 Password Reset Summary:');
    console.log('   Supervisor: David Hall');
    console.log('   Badge: DH005');
    console.log('   Status: Password cleared');
    console.log('   Next Step: David will be prompted to set a new password on next login');
    console.log('\n✅ Password reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  process.exit(0);
}

// Run the reset
resetDavidHallPassword();
