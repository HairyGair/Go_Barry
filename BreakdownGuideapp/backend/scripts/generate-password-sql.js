#!/usr/bin/env node

/**
 * Generate SQL statements with bcrypt password hashes
 *
 * Run this script locally, then copy the SQL output
 * and paste it into cPanel phpMyAdmin
 */

import bcrypt from 'bcrypt';

const SUPERVISORS = [
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
    }
];

async function generateSQL() {
    console.log('-- =========================================');
    console.log('-- Go BARRY Supervisor Password Setup SQL');
    console.log('-- Generated:', new Date().toISOString());
    console.log('-- =========================================\n');

    console.log('-- Step 1: Create supervisors if they don\'t exist\n');

    for (const sup of SUPERVISORS) {
        const hash = await bcrypt.hash(sup.password, 10);

        console.log(`-- ${sup.name} (${sup.email})`);
        console.log(`INSERT INTO supervisors (email, name, badge_number, role, depot, is_active, pending_approval, password_hash, created_at, updated_at)`);
        console.log(`VALUES ('${sup.email}', '${sup.name}', '${sup.badge_number}', '${sup.role}', '${sup.depot}', 1, 0, '${hash}', NOW(), NOW())`);
        console.log(`ON DUPLICATE KEY UPDATE`);
        console.log(`  password_hash = '${hash}',`);
        console.log(`  is_active = 1,`);
        console.log(`  updated_at = NOW();\n`);
    }

    console.log('\n-- =========================================');
    console.log('-- Verification Query');
    console.log('-- =========================================\n');
    console.log('SELECT email, name, badge_number, role,');
    console.log('       CASE WHEN password_hash IS NOT NULL THEN \'YES\' ELSE \'NO\' END as has_password,');
    console.log('       is_active');
    console.log('FROM supervisors');
    console.log('ORDER BY name;\n');

    console.log('-- =========================================');
    console.log('-- Test Login');
    console.log('-- =========================================');
    console.log('-- URL: https://breakdowns.gobarry.co.uk');
    console.log('-- Email: anthony.gair@example.com');
    console.log('-- Password: Stafford45!');
    console.log('-- =========================================\n');
}

generateSQL().catch(console.error);
