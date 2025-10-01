// Script to create Supabase Authentication users for supervisors
// This needs to be run with admin privileges in Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required for creating auth users');
  console.log('   This key should be found in your Supabase project settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supervisorsToCreate = [
  {
    email: 'simon.glass@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Simon Glass',
      badge_number: 'SG001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'david.hall@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'David Hall',
      badge_number: 'DH001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'barry.perryman@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Barry Perryman',
      badge_number: 'BP001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'claire.fiddler@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Claire Fiddler',
      badge_number: 'CF001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'alex.woodcock@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Alex Woodcock',
      badge_number: 'AW001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'james.daglish@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'James Daglish',
      badge_number: 'JD003',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'andrew.cowley@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Andrew Cowley',
      badge_number: 'AC001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'john.paterson@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'John Paterson',
      badge_number: 'JP001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'ben.maxfield@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Ben Maxfield',
      badge_number: 'BM001',
      depot: 'SDC',
      role: 'supervisor'
    }
  },
  {
    email: 'anthony.gair@gonortheast.co.uk', 
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Anthony Gair',
      badge_number: 'AG003',
      depot: 'Washington',
      role: 'admin'
    }
  },
  {
    email: 'lee.mutch@gonortheast.co.uk',
    password: 'TempPass123!', 
    user_metadata: {
      full_name: 'Lee Mutch',
      badge_number: 'LM001',
      depot: 'Washington',
      role: 'admin'
    }
  },
  {
    email: 'joshua.devlin@gonortheast.co.uk',
    password: 'TempPass123!',
    user_metadata: {
      full_name: 'Joshua Devlin',
      badge_number: 'JD002', 
      depot: 'Washington',
      role: 'supervisor'
    }
  },
  {
    email: 'test@test.com',
    password: 'test123',
    user_metadata: {
      full_name: 'Test Supervisor',
      badge_number: 'TEST01',
      depot: 'SDC',
      role: 'supervisor'
    }
  }
];

async function createAuthUsers() {
  console.log('🔐 Creating Supabase Authentication users...');
  
  const results = [];
  
  for (const supervisor of supervisorsToCreate) {
    try {
      console.log(`\n📧 Creating auth user for: ${supervisor.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: supervisor.email,
        password: supervisor.password,
        user_metadata: supervisor.user_metadata,
        email_confirm: true // Auto-confirm email
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  User already exists: ${supervisor.email}`);
          results.push({ email: supervisor.email, status: 'exists', error: null });
        } else {
          console.error(`   ❌ Error creating user: ${error.message}`);
          results.push({ email: supervisor.email, status: 'error', error: error.message });
        }
      } else {
        console.log(`   ✅ Created user: ${supervisor.email} (ID: ${data.user.id})`);
        results.push({ email: supervisor.email, status: 'created', user_id: data.user.id });
      }
      
    } catch (error) {
      console.error(`   💥 Exception creating user ${supervisor.email}:`, error.message);
      results.push({ email: supervisor.email, status: 'exception', error: error.message });
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const statusIcon = {
      'created': '✅',
      'exists': '⚠️ ',
      'error': '❌',
      'exception': '💥'
    }[result.status];
    
    console.log(`${statusIcon} ${result.email} - ${result.status.toUpperCase()}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  const created = results.filter(r => r.status === 'created').length;
  const existing = results.filter(r => r.status === 'exists').length;
  const errors = results.filter(r => r.status === 'error' || r.status === 'exception').length;
  
  console.log('\n🎯 Results:');
  console.log(`   Created: ${created}`);
  console.log(`   Already existed: ${existing}`);
  console.log(`   Errors: ${errors}`);
  
  if (created > 0 || existing > 0) {
    console.log('\n🔑 Default passwords:');
    console.log('   Most supervisors: TempPass123!');
    console.log('   test@test.com: test123');
    console.log('\n⚠️  IMPORTANT: Change these passwords immediately after first login!');
  }
  
  if (errors === 0) {
    console.log('\n🎉 All supervisors should now be able to log in with their email addresses!');
  }
}

createAuthUsers().catch(console.error);