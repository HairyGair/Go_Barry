import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnExists() {
    console.log('🔍 Checking if issue_category column has been added...');

    try {
        const { data, error } = await supabase
            .from('breakdowns')
            .select('issue_category')
            .limit(1);

        if (error) {
            if (error.message.includes('issue_category')) {
                console.log('❌ Column does not exist yet');
                console.log('📋 Error:', error.message);
                return false;
            } else {
                console.log('❓ Unexpected error:', error.message);
                return false;
            }
        } else {
            console.log('✅ issue_category column exists!');
            return true;
        }
    } catch (err) {
        console.log('❌ Error checking column:', err.message);
        return false;
    }
}

async function runBackendTests() {
    console.log('🧪 Running backend server tests...');

    try {
        const { stdout, stderr } = await execAsync('npm test', { cwd: process.cwd() });
        console.log('📊 Test Results:');
        console.log(stdout);
        if (stderr) {
            console.log('⚠️  Test Warnings/Errors:');
            console.log(stderr);
        }
        return true;
    } catch (err) {
        console.log('❌ Backend tests failed:');
        console.log(err.stdout || err.message);
        return false;
    }
}

async function runWizardIntegrationTest() {
    console.log('🔧 Running wizard integration test...');

    try {
        const { stdout, stderr } = await execAsync('node test_wizard_integration.js', { cwd: process.cwd() });
        console.log('📊 Integration Test Results:');
        console.log(stdout);
        if (stderr) {
            console.log('⚠️  Integration Test Warnings:');
            console.log(stderr);
        }
        return !stdout.includes('❌') && !stdout.includes('🚨');
    } catch (err) {
        console.log('❌ Integration test failed:');
        console.log(err.stdout || err.message);
        return false;
    }
}

async function checkAPIEndpoints() {
    console.log('🌐 Checking API endpoint availability...');

    const endpoints = [
        '/api/breakdowns/live',
        '/api/breakdowns/active',
        '/api/breakdowns/stats'
    ];

    const apiBase = process.env.API_BASE_URL || 'http://localhost:3001';

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${apiBase}${endpoint}`);
            if (response.ok) {
                console.log(`✅ ${endpoint} - Status: ${response.status}`);
            } else {
                console.log(`❌ ${endpoint} - Status: ${response.status}`);
                return false;
            }
        } catch (err) {
            console.log(`❌ ${endpoint} - Error: ${err.message}`);
            return false;
        }
    }

    return true;
}

async function showNextSteps() {
    console.log('');
    console.log('📋 NEXT STEPS FOR TESTING WIZARD INTEGRATION:');
    console.log('');
    console.log('1. 🧪 Test wizard assessment creation:');
    console.log('   POST /api/breakdowns/from-wizard');
    console.log('   - Include issue_category field');
    console.log('   - Verify breakdown is created');
    console.log('');
    console.log('2. 🎯 Test dashboard retrieval:');
    console.log('   GET /api/breakdowns/live');
    console.log('   - Verify issue categories are returned');
    console.log('   - Check data mapping is correct');
    console.log('');
    console.log('3. 🔄 Test end-to-end workflow:');
    console.log('   - Complete wizard assessment in frontend');
    console.log('   - Verify breakdown appears in dashboard');
    console.log('   - Check issue category is displayed');
    console.log('');
    console.log('4. 📊 Validate data integrity:');
    console.log('   - Check breakdown records have issue_category');
    console.log('   - Verify assessment data is preserved');
    console.log('   - Test filtering and searching by category');
    console.log('');
}

async function main() {
    console.log('🚀 Verifying Database Schema and Testing Integration...');
    console.log('');

    // Step 1: Check if column exists
    const columnExists = await checkColumnExists();
    console.log('');

    if (!columnExists) {
        console.log('🚨 MANUAL ACTION STILL REQUIRED:');
        console.log('The issue_category column has not been added to the database yet.');
        console.log('');
        console.log('📖 Please follow the instructions in:');
        console.log('   MANUAL_COLUMN_ADDITION_STEPS.md');
        console.log('');
        console.log('Or execute this SQL in Supabase Dashboard:');
        console.log('   ALTER TABLE breakdowns ADD COLUMN issue_category VARCHAR(100);');
        console.log('');
        console.log('Then run this script again to verify the integration.');
        return;
    }

    // Step 2: Check API endpoints
    console.log('🌐 Checking API endpoints...');
    const apiWorking = await checkAPIEndpoints();
    console.log('');

    // Step 3: Run wizard integration test
    const integrationWorking = await runWizardIntegrationTest();
    console.log('');

    // Step 4: Run backend tests if available
    console.log('🧪 Running any available backend tests...');
    const testsWorking = await runBackendTests();
    console.log('');

    // Summary
    console.log('📊 VERIFICATION SUMMARY:');
    console.log('========================');
    console.log(`Database Column: ${columnExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`API Endpoints: ${apiWorking ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`Integration Test: ${integrationWorking ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Backend Tests: ${testsWorking ? '✅ PASSED' : '⚠️  SEE OUTPUT'}`);
    console.log('');

    if (columnExists && apiWorking && integrationWorking) {
        console.log('🎉 SUCCESS! Wizard integration is ready to use.');
        console.log('');
        console.log('✅ You can now:');
        console.log('   - Create breakdowns from wizard assessments');
        console.log('   - View breakdowns with issue categories in dashboard');
        console.log('   - Filter and search by issue type');
        console.log('   - Trust that the integration is stable');
    } else {
        console.log('⚠️  Some issues remain. Check the output above for details.');
        await showNextSteps();
    }
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});