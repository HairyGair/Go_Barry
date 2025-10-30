#!/usr/bin/env node

/**
 * Database Migration Runner for Go BARRY
 * Executes SQL migration files against Supabase PostgreSQL database
 *
 * Usage:
 *   node scripts/run-migrations.js [options]
 *
 * Options:
 *   --file <filename>  Run a specific migration file
 *   --dry-run          Show what would be executed without running
 *   --verbose          Show detailed output
 *
 * Environment Variables Required:
 *   SUPABASE_URL       - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Service role key (not anon key!)
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

// Configuration
const MIGRATIONS_DIR = join(__dirname, '../migrations');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Print colored message to console
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Validate environment configuration
 */
function validateConfig() {
  const issues = [];

  if (!SUPABASE_URL) {
    issues.push('SUPABASE_URL environment variable is not set');
  }

  if (!SUPABASE_SERVICE_KEY) {
    issues.push('SUPABASE_SERVICE_KEY environment variable is not set');
    issues.push('Note: Use service_role key, not anon key, for migrations');
  }

  if (issues.length > 0) {
    print('\n❌ Configuration Error:', 'red');
    issues.forEach(issue => print(`   - ${issue}`, 'red'));
    print('\nAdd these to your .env file:', 'yellow');
    print('   SUPABASE_URL=https://your-project.supabase.co', 'yellow');
    print('   SUPABASE_SERVICE_KEY=your-service-role-key-here', 'yellow');
    return false;
  }

  return true;
}

/**
 * Initialize Supabase client
 */
function initSupabase() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (options.verbose) {
      print('✅ Supabase client initialized', 'green');
      print(`   URL: ${SUPABASE_URL}`, 'cyan');
    }

    return supabase;
  } catch (error) {
    print('❌ Failed to initialize Supabase client:', 'red');
    print(`   ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Get list of migration files to run
 */
async function getMigrationFiles() {
  try {
    const files = await readdir(MIGRATIONS_DIR);

    // Filter for .sql files only
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    if (options.file) {
      // Run specific file if specified
      if (sqlFiles.includes(options.file)) {
        return [options.file];
      } else {
        throw new Error(`Migration file not found: ${options.file}`);
      }
    }

    return sqlFiles;
  } catch (error) {
    print(`❌ Error reading migrations directory: ${MIGRATIONS_DIR}`, 'red');
    throw error;
  }
}

/**
 * Read SQL migration file
 */
async function readMigrationFile(filename) {
  const filepath = join(MIGRATIONS_DIR, filename);
  try {
    const content = await readFile(filepath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read ${filename}: ${error.message}`);
  }
}

/**
 * Execute SQL migration
 */
async function executeMigration(supabase, filename, sql) {
  try {
    if (options.verbose) {
      print(`\n📄 Migration: ${filename}`, 'cyan');
      print('─'.repeat(80), 'cyan');

      // Show first few lines of SQL
      const lines = sql.split('\n').filter(line => !line.trim().startsWith('--') && line.trim());
      const preview = lines.slice(0, 5).join('\n');
      print(preview, 'blue');
      if (lines.length > 5) {
        print('... (truncated)', 'blue');
      }
      print('─'.repeat(80), 'cyan');
    }

    if (options.dryRun) {
      print(`🔍 [DRY RUN] Would execute: ${filename}`, 'yellow');
      return { success: true, dryRun: true };
    }

    // Execute the SQL using Supabase RPC (direct SQL execution)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql RPC doesn't exist, try alternative approach
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        print('⚠️  Note: exec_sql function not available. Use Supabase SQL Editor for migrations.', 'yellow');
        print(`   Migration file: ${filename}`, 'yellow');
        return { success: false, error: 'Manual execution required', requiresManual: true };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  print('\n' + '='.repeat(80), 'blue');
  print('  Go BARRY Database Migration Runner', 'blue');
  print('='.repeat(80) + '\n', 'blue');

  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }

  // Initialize Supabase
  const supabase = initSupabase();

  // Get migration files
  print('📂 Reading migration files...', 'cyan');
  const migrationFiles = await getMigrationFiles();

  if (migrationFiles.length === 0) {
    print('⚠️  No migration files found in: ' + MIGRATIONS_DIR, 'yellow');
    return;
  }

  print(`   Found ${migrationFiles.length} migration(s):\n`, 'green');
  migrationFiles.forEach((file, index) => {
    print(`   ${index + 1}. ${file}`, 'cyan');
  });

  if (options.dryRun) {
    print('\n🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  // Execute migrations
  print('\n🚀 Executing migrations...\n', 'magenta');

  const results = {
    success: [],
    failed: [],
    manual: [],
  };

  for (const filename of migrationFiles) {
    try {
      const sql = await readMigrationFile(filename);
      const result = await executeMigration(supabase, filename, sql);

      if (result.success) {
        if (result.dryRun) {
          print(`✓ ${filename} (dry run)`, 'yellow');
        } else {
          print(`✓ ${filename}`, 'green');
          results.success.push(filename);
        }
      } else if (result.requiresManual) {
        print(`⚠ ${filename} (requires manual execution)`, 'yellow');
        results.manual.push(filename);
      } else {
        print(`✗ ${filename}`, 'red');
        if (options.verbose && result.error) {
          print(`   Error: ${result.error}`, 'red');
        }
        results.failed.push({ filename, error: result.error });
      }
    } catch (error) {
      print(`✗ ${filename}`, 'red');
      if (options.verbose) {
        print(`   Error: ${error.message}`, 'red');
      }
      results.failed.push({ filename, error: error.message });
    }
  }

  // Print summary
  print('\n' + '='.repeat(80), 'blue');
  print('  Migration Summary', 'blue');
  print('='.repeat(80) + '\n', 'blue');

  if (results.success.length > 0) {
    print(`✅ Successful: ${results.success.length}`, 'green');
  }

  if (results.failed.length > 0) {
    print(`❌ Failed: ${results.failed.length}`, 'red');
    results.failed.forEach(({ filename, error }) => {
      print(`   - ${filename}: ${error}`, 'red');
    });
  }

  if (results.manual.length > 0) {
    print(`\n⚠️  Manual Execution Required for ${results.manual.length} migration(s):`, 'yellow');
    print('   Use Supabase SQL Editor to run these files:', 'yellow');
    results.manual.forEach(filename => {
      print(`   - ${filename}`, 'yellow');
    });
    print('\n   How to run manually:', 'cyan');
    print('   1. Go to: https://app.supabase.com/project/_/sql', 'cyan');
    print('   2. Copy the SQL from backend/migrations/<filename>', 'cyan');
    print('   3. Paste and run in the SQL Editor', 'cyan');
  }

  print('');

  // Exit with appropriate code
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(error => {
  print('\n❌ Fatal error:', 'red');
  print(`   ${error.message}`, 'red');
  if (options.verbose && error.stack) {
    print('\nStack trace:', 'red');
    print(error.stack, 'red');
  }
  process.exit(1);
});
