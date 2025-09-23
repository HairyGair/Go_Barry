import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data for wizard integration
const testWizardData = {
    vehicle: {
        fleet_number: "7001",
        route: "Test Route",
        direction: "Outbound"
    },
    location: {
        latitude: 54.9783,
        longitude: -1.6174,
        description: "Newcastle City Centre Test Location"
    },
    driver: {
        name: "Test Driver",
        phone: "01234567890"
    },
    supervisor: {
        badge: "AG003",
        name: "Anthony Gair"
    },
    assessment: {
        wizard_type: "Steering",
        wizard_decision: "AMBER",
        issue_category: "Steering System",
        issue_description: "Steering wheel feels loose when turning left",
        steps: [
            {
                step: 1,
                question: "Is the steering wheel loose?",
                answer: "Yes",
                decision: "CONTINUE"
            },
            {
                step: 2,
                question: "Does the vehicle pull to one side?",
                answer: "Yes, pulls left",
                decision: "AMBER"
            }
        ]
    }
};

async function testColumnExists() {
    console.log('🔍 Testing if issue_category column exists...');

    try {
        const { data, error } = await supabase
            .from('breakdowns')
            .select('issue_category')
            .limit(1);

        if (error) {
            console.log('❌ Column does not exist:', error.message);
            return false;
        } else {
            console.log('✅ issue_category column exists!');
            return true;
        }
    } catch (err) {
        console.log('❌ Error checking column:', err.message);
        return false;
    }
}

async function testWizardToBreakdownAPI() {
    console.log('🧪 Testing /api/breakdowns/from-wizard endpoint...');

    try {
        const response = await fetch(`${apiBaseUrl}/api/breakdowns/from-wizard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testWizardData)
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('✅ Wizard API endpoint successful!');
            console.log('📋 Created breakdown:', responseData);
            return responseData;
        } else {
            console.log('❌ Wizard API endpoint failed:', response.status);
            console.log('💬 Error:', responseData);
            return null;
        }
    } catch (err) {
        console.log('❌ Error calling wizard API:', err.message);
        return null;
    }
}

async function testDirectInsert() {
    console.log('🧪 Testing direct database insert with issue_category...');

    const testRecord = {
        fleet_no: 'TEST002',
        location: 'Direct Insert Test Location',
        severity: 'AMBER',
        status: 'active',
        supervisor_badge: 'AG003',
        supervisor_name: 'Anthony Gair',
        assessment_type: 'Direct Test',
        diagnosis: 'Test diagnosis for direct insert',
        final_decision: 'AMBER',
        depot_id: 'SDC',
        dvsa_reportable: false,
        safety_critical: false,
        service_disruption: false,
        passengers_affected: 0,
        estimated_cost: 0,
        issue_category: 'Electrical System'  // This should work now
    };

    try {
        const { data, error } = await supabase
            .from('breakdowns')
            .insert([testRecord])
            .select();

        if (error) {
            console.log('❌ Direct insert failed:', error.message);
            return null;
        } else {
            console.log('✅ Direct insert successful!');
            console.log('📋 Inserted record:', data[0]);
            return data[0];
        }
    } catch (err) {
        console.log('❌ Error in direct insert:', err.message);
        return null;
    }
}

async function testBreakdownsRetrieval() {
    console.log('🧪 Testing breakdowns retrieval endpoint...');

    try {
        const response = await fetch(`${apiBaseUrl}/api/breakdowns/live`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('✅ Live breakdowns endpoint successful!');
            console.log('📊 Retrieved', responseData.length, 'breakdown(s)');

            // Check if any have issue_category
            const withIssueCategory = responseData.filter(b => b.issue_category);
            console.log('📋', withIssueCategory.length, 'breakdown(s) have issue_category populated');

            return responseData;
        } else {
            console.log('❌ Live breakdowns endpoint failed:', response.status);
            console.log('💬 Error:', responseData);
            return null;
        }
    } catch (err) {
        console.log('❌ Error retrieving breakdowns:', err.message);
        return null;
    }
}

async function cleanupTestRecords(createdRecords) {
    console.log('🧹 Cleaning up test records...');

    for (const record of createdRecords) {
        if (record && record.id) {
            try {
                await supabase
                    .from('breakdowns')
                    .delete()
                    .eq('id', record.id);
                console.log('🗑️  Deleted test record:', record.breakdown_id || record.id);
            } catch (err) {
                console.log('⚠️  Could not delete record:', record.id, err.message);
            }
        }
    }
}

async function runCompleteTest() {
    console.log('🚀 Starting comprehensive wizard integration test...');
    console.log('🔗 Testing against:', apiBaseUrl);
    console.log('');

    const createdRecords = [];

    // Test 1: Check column exists
    const columnExists = await testColumnExists();
    console.log('');

    if (!columnExists) {
        console.log('🚨 Cannot proceed - issue_category column missing');
        console.log('📖 Please follow DATABASE_MIGRATION_INSTRUCTIONS.md');
        return;
    }

    // Test 2: Direct insert
    const directInsert = await testDirectInsert();
    if (directInsert) createdRecords.push(directInsert);
    console.log('');

    // Test 3: Wizard API
    const wizardResult = await testWizardToBreakdownAPI();
    if (wizardResult && wizardResult.breakdown) createdRecords.push(wizardResult.breakdown);
    console.log('');

    // Test 4: Retrieval
    await testBreakdownsRetrieval();
    console.log('');

    // Cleanup
    if (createdRecords.length > 0) {
        await cleanupTestRecords(createdRecords);
    }

    console.log('');
    console.log('🏁 Integration test completed!');

    if (columnExists && directInsert && wizardResult) {
        console.log('✅ All tests passed - wizard integration is working!');
    } else {
        console.log('❌ Some tests failed - check the output above');
    }
}

// Run the complete test
runCompleteTest().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});