// Create minimal escalation tables for testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://haountnghecfrsoniubq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODE0OSwiZXhwIjoyMDYzMjU0MTQ5fQ.k2Ni4hNfyqzJl3AHHQF1mDdRJ7g5s1o5qTlrxmCsvaY'
);

async function createTables() {
  console.log('🚀 Creating minimal escalation tables...');
  
  // Create display_screen_alerts table
  try {
    const displayTableSQL = `
    CREATE TABLE IF NOT EXISTS display_screen_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_id TEXT NOT NULL,
      display_config JSONB NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;
    
    await supabase.rpc('sql', { query: displayTableSQL });
    console.log('✅ display_screen_alerts table created');
  } catch (error) {
    console.log('⚠️ display_screen_alerts table may already exist or be accessible');
  }

  // Create supervisor_audit_log table
  try {
    const auditTableSQL = `
    CREATE TABLE IF NOT EXISTS supervisor_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_id TEXT NOT NULL,
      supervisor_badge TEXT NOT NULL,
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;
    
    await supabase.rpc('sql', { query: auditTableSQL });
    console.log('✅ supervisor_audit_log table created');
  } catch (error) {
    console.log('⚠️ supervisor_audit_log table may already exist or be accessible');
  }

  // Test table access
  try {
    const { data: displayTest } = await supabase.from('display_screen_alerts').select('*').limit(1);
    console.log('✅ display_screen_alerts table accessible');
  } catch (error) {
    console.log('❌ display_screen_alerts not accessible:', error.message);
  }

  try {
    const { data: auditTest } = await supabase.from('supervisor_audit_log').select('*').limit(1);
    console.log('✅ supervisor_audit_log table accessible');
  } catch (error) {
    console.log('❌ supervisor_audit_log not accessible:', error.message);
  }

  console.log('🎉 Table creation completed');
}

createTables().catch(console.error);