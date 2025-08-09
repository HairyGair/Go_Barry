// backend/init-breakdown-system.js
// Quick initialization helper for the breakdown logging system

import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config();

console.log('🚀 Breakdown Logging System Initialization\n');

async function checkEnvFile() {
    try {
        await fs.access('.env');
        console.log('✅ .env file found');
        return true;
    } catch {
        console.log('❌ .env file NOT found');
        console.log('   Creating .env from .env.example...');
        
        try {
            const example = await fs.readFile('.env.example', 'utf8');
            await fs.writeFile('.env', example);
            console.log('✅ .env file created - YOU NEED TO ADD YOUR API KEYS!');
            return false;
        } catch (error) {
            console.error('❌ Could not create .env file:', error.message);
            return false;
        }
    }
}

async function checkSupabaseConfig() {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
    
    console.log('\n📊 Supabase Configuration:');
    console.log(`   URL: ${hasUrl ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   API Key: ${hasKey ? '✅ Set' : '❌ NOT SET'}`);
    
    if (!hasUrl || !hasKey) {
        console.log('\n📝 To configure Supabase:');
        console.log('1. Open your .env file');
        console.log('2. Go to your Supabase dashboard > Settings > API');
        console.log('3. Add these values:');
        console.log('   SUPABASE_URL=<your-project-url>');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
        return false;
    }
    
    return true;
}

function showSqlInstructions() {
    console.log('\n🗄️  Database Setup:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Copy and run the SQL from: backend/sql/breakdowns_schema.sql');
    console.log('\nOr run this SQL directly:');
    console.log('----------------------------------------');
    console.log(`
CREATE TABLE IF NOT EXISTS breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id TEXT NOT NULL,
    vehicle_reg TEXT NOT NULL,
    fleet_no TEXT NOT NULL,
    breakdown_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breakdowns_timestamp ON breakdowns(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_vehicle_reg ON breakdowns(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX IF NOT EXISTS idx_breakdowns_type ON breakdowns(breakdown_type);
    `);
    console.log('----------------------------------------');
}

async function main() {
    // Step 1: Check .env file
    const hasEnv = await checkEnvFile();
    
    // Step 2: Check Supabase configuration
    const hasSupabase = await checkSupabaseConfig();
    
    // Step 3: Show SQL instructions
    showSqlInstructions();
    
    // Step 4: Next steps
    console.log('\n📋 Next Steps:');
    
    if (!hasEnv || !hasSupabase) {
        console.log('1. ⚠️  Configure your .env file with Supabase credentials');
        console.log('2. Run the SQL to create the breakdowns table');
        console.log('3. Restart the server: npm start');
        console.log('4. Test: node test-breakdown-logging.js');
    } else {
        console.log('1. ✅ Configuration looks good!');
        console.log('2. Create the database table (if not done)');
        console.log('3. Restart the server: npm start');
        console.log('4. Test: node test-breakdown-logging.js');
    }
    
    console.log('\n📚 Documentation:');
    console.log('   - Quick fix guide: BREAKDOWN_QUICK_FIX.md');
    console.log('   - Full implementation: BREAKDOWN_LOGGING_IMPLEMENTATION.md');
    console.log('   - Troubleshooting: BREAKDOWN_ROUTES_TROUBLESHOOTING.md');
}

main().catch(console.error);
