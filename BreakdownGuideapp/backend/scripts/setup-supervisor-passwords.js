#!/usr/bin/env node

/**
 * Setup Supervisor Passwords in MySQL
 *
 * This script adds bcrypt password hashes to the supervisors table
 * in your cPanel MySQL database.
 */

import bcrypt from 'bcrypt';
import { query } from '../config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

// Supervisors to set up with their passwords
const SUPERVISORS_TO_SETUP = [
    {
        email: 'anthony.gair@example.com',
        name: 'Anthony Gair',
        badge_number: 'AG003',
        password: 'Stafford45!',
        role: 'admin',
        depot: 'Washington'
    },
    {
        email: 'jamie.rao@goahead.com',
        name: 'Jamie Rao',
        badge_number: 'JR001',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'ben.potts@goahead.com',
        name: 'Ben Potts',
        badge_number: 'BP009',
        password: 'Stafford45!',
        role: 'admin',
        depot: 'Washington'
    },
    {
        email: 'laura.lee@goahead.com',
        name: 'Laura Lee',
        badge_number: 'LL002',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'mitchell.taylor@goahead.com',
        name: 'Mitchell Taylor',
        badge_number: 'MT004',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'ryan.henderson@goahead.com',
        name: 'Ryan Henderson',
        badge_number: 'RH005',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'connor.dixon@goahead.com',
        name: 'Connor Dixon',
        badge_number: 'CD006',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'josh.murray@goahead.com',
        name: 'Josh Murray',
        badge_number: 'JM007',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    },
    {
        email: 'kacey.hughes@goahead.com',
        name: 'Kacey Hughes',
        badge_number: 'KH008',
        password: 'Stafford45!',
        role: 'supervisor',
        depot: 'Washington'
    }
];

const BCRYPT_SALT_ROUNDS = 10;

async function setupSupervisors() {
    console.log('🔐 Setting up supervisor passwords in MySQL...\n');
    console.log('=' .repeat(70));

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const supervisor of SUPERVISORS_TO_SETUP) {
        console.log(`\n📝 Processing: ${supervisor.name} (${supervisor.email})`);

        try {
            // Check if supervisor exists
            const checkSql = `SELECT * FROM supervisors WHERE email = ?`;
            const existing = await query(checkSql, [supervisor.email]);

            let supervisorId;

            if (existing.length > 0) {
                supervisorId = existing[0].id;
                console.log(`   ℹ️  Supervisor exists (ID: ${supervisorId})`);

                // Check if already has password_hash
                if (existing[0].password_hash) {
                    console.log(`   ⚠️  Already has password hash - skipping`);
                    skippedCount++;
                    continue;
                }
            } else {
                // Create new supervisor
                console.log(`   ➕ Creating new supervisor...`);
                const createSql = `
                    INSERT INTO supervisors (
                        email, name, badge_number, role, depot, is_active,
                        pending_approval, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const result = await query(createSql, [
                    supervisor.email,
                    supervisor.name,
                    supervisor.badge_number,
                    supervisor.role,
                    supervisor.depot,
                    true,  // is_active
                    false  // pending_approval
                ]);
                supervisorId = result.insertId;
                console.log(`   ✅ Created (ID: ${supervisorId})`);
            }

            // Generate password hash
            console.log(`   🔒 Generating password hash...`);
            const passwordHash = await bcrypt.hash(supervisor.password, BCRYPT_SALT_ROUNDS);

            // Update password_hash
            const updateSql = `
                UPDATE supervisors
                SET password_hash = ?, updated_at = NOW()
                WHERE id = ?
            `;
            await query(updateSql, [passwordHash, supervisorId]);

            console.log(`   ✅ Password hash set successfully`);
            successCount++;

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            errorCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('Summary:');
    console.log('-'.repeat(70));
    console.log(`✅ Successfully set up: ${successCount} supervisors`);
    console.log(`⚠️  Skipped (already set): ${skippedCount} supervisors`);
    console.log(`❌ Failed: ${errorCount} supervisors`);
    console.log(`📊 Total processed: ${SUPERVISORS_TO_SETUP.length} supervisors`);

    if (successCount > 0) {
        console.log('\n✅ Setup completed successfully!');
        console.log('\nYou can now log in with:');
        console.log('  Email: anthony.gair@example.com');
        console.log('  Password: Stafford45!');
        console.log('\nOR:');
        console.log('  Email: jamie.rao@goahead.com');
        console.log('  Password: Stafford45!');
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

// Run the setup
setupSupervisors()
    .then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
