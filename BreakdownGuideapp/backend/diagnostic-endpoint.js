/**
 * Diagnostic Endpoint for Troubleshooting
 * Add this to server.js to help identify configuration issues
 */

import { query } from './config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

export const diagnosticEndpoint = async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      env: process.env.NODE_ENV || 'not set'
    },
    database: {
      host: process.env.DB_HOST || 'NOT SET',
      port: process.env.DB_PORT || 'NOT SET',
      user: process.env.DB_USER || 'NOT SET',
      database: process.env.DB_NAME || 'NOT SET',
      passwordSet: !!process.env.DB_PASSWORD
    },
    routes: {
      supervisorsFileExists: null,
      supervisorsImported: null
    },
    tests: {}
  };

  // Test 1: MySQL connection
  try {
    const testQuery = await query('SELECT 1 as test');
    diagnostics.tests.mysqlConnection = '✅ Connected';
    diagnostics.tests.mysqlResponse = testQuery[0];
  } catch (error) {
    diagnostics.tests.mysqlConnection = `❌ ${error.message}`;
  }

  // Test 2: Check supervisors table
  try {
    const count = await query('SELECT COUNT(*) as count FROM supervisors');
    diagnostics.tests.supervisorsTable = `✅ ${count[0].count} supervisors found`;
  } catch (error) {
    diagnostics.tests.supervisorsTable = `❌ ${error.message}`;
  }

  // Test 3: Check specific supervisor
  try {
    const supervisor = await query(
      'SELECT id, email, name, badge_number FROM supervisors WHERE badge_number = ? LIMIT 1',
      ['AG003']
    );
    diagnostics.tests.supervisorAG003 = supervisor[0]
      ? `✅ Found: ${supervisor[0].name}`
      : '❌ Not found';
  } catch (error) {
    diagnostics.tests.supervisorAG003 = `❌ ${error.message}`;
  }

  // Test 4: Check breakdowns table
  try {
    const count = await query('SELECT COUNT(*) as count FROM breakdowns');
    diagnostics.tests.breakdownsTable = `✅ ${count[0].count} breakdowns found`;
  } catch (error) {
    diagnostics.tests.breakdownsTable = `❌ ${error.message}`;
  }

  res.json(diagnostics);
};
