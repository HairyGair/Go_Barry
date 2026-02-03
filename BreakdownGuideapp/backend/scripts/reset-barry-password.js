#!/usr/bin/env node
/**
 * Reset Barry Perryman's password
 *
 * Usage:
 * node scripts/reset-barry-password.js <new-password>
 *
 * Or for interactive mode:
 * node scripts/reset-barry-password.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BARRY_EMAIL = 'barry.perryman@example.com';
const BARRY_AUTH_ID = 'ee515465-f14a-4fea-b2d7-aacb6c9d8578';

async function resetPassword(newPassword) {
  try {
    console.log(`🔄 Resetting password for ${BARRY_EMAIL}...`);

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      return false;
    }

    // Update password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      BARRY_AUTH_ID,
      {
        password: newPassword,
        email_confirm: true // Ensure email is confirmed
      }
    );

    if (error) {
      console.error('❌ Failed to reset password:', error.message);
      return false;
    }

    console.log('✅ Password reset successfully for Barry Perryman');
    console.log('📧 Email:', BARRY_EMAIL);
    console.log('🔑 New password:', newPassword);
    console.log('');
    console.log('Barry can now login at:');
    console.log('   https://breakdowns.gobarry.co.uk');
    console.log('');
    console.log('⚠️  Please share this password securely and ask Barry to change it after first login');

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Alternative: Send password reset email
async function sendResetEmail() {
  try {
    console.log(`📧 Sending password reset email to ${BARRY_EMAIL}...`);

    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
      BARRY_EMAIL,
      {
        redirectTo: 'https://breakdowns.gobarry.co.uk/reset-password'
      }
    );

    if (error) {
      console.error('❌ Failed to send reset email:', error.message);
      return false;
    }

    console.log('✅ Password reset email sent successfully');
    console.log('📧 Barry should check his email:', BARRY_EMAIL);
    console.log('');
    console.log('The email contains a link to reset his password');

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Password provided as argument
    const newPassword = args[0];
    await resetPassword(newPassword);
  } else {
    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('');
    console.log('=== Reset Password for Barry Perryman ===');
    console.log('');
    console.log('Options:');
    console.log('1. Set a temporary password (you choose)');
    console.log('2. Send password reset email to barry.perryman@example.com');
    console.log('');

    rl.question('Select option (1 or 2): ', async (option) => {
      if (option === '1') {
        rl.question('Enter new password (min 8 characters): ', async (password) => {
          await resetPassword(password);
          rl.close();
          process.exit(0);
        });
      } else if (option === '2') {
        await sendResetEmail();
        rl.close();
        process.exit(0);
      } else {
        console.log('Invalid option');
        rl.close();
        process.exit(1);
      }
    });
  }
}

main();
