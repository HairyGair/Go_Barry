import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NEW_PASSWORD = 'GoNorthEast2025!';
const SALT_ROUNDS = 10;

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gobarryco',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gobarryco_breakdowns',
};

async function setAllPasswords() {
  console.log('🔐 Setting all supervisor passwords to: GoNorthEast2025!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let connection;

  try {
    // Create database connection
    console.log('\n📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');

    // Hash the new password
    console.log('\n🔒 Hashing password with bcrypt (10 rounds)...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    console.log(`✅ Password hashed: ${hashedPassword.substring(0, 20)}...`);

    // Get all supervisors
    console.log('\n👥 Fetching all supervisors...');
    const [supervisors] = await connection.execute(
      'SELECT id, badge_number, name, email FROM supervisors WHERE is_active = 1 ORDER BY name'
    );

    if (!supervisors || supervisors.length === 0) {
      console.log('⚠️  No active supervisors found in database');
      return;
    }

    console.log(`✅ Found ${supervisors.length} active supervisors`);

    // Update each supervisor's password
    console.log('\n🔄 Updating passwords...');
    let successCount = 0;
    let errorCount = 0;

    for (const supervisor of supervisors) {
      try {
        await connection.execute(
          'UPDATE supervisors SET password_hash = ? WHERE id = ?',
          [hashedPassword, supervisor.id]
        );

        console.log(`   ✅ ${supervisor.badge_number} - ${supervisor.name}`);
        successCount++;
      } catch (error) {
        console.log(`   ❌ ${supervisor.badge_number} - ${supervisor.name} - ERROR: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log(`   Total supervisors: ${supervisors.length}`);
    console.log(`   ✅ Updated successfully: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✨ All supervisor passwords have been set to: GoNorthEast2025!');
    console.log('\n📝 Supervisor credentials:');
    supervisors.forEach(sup => {
      console.log(`   Badge: ${sup.badge_number.padEnd(8)} | Password: GoNorthEast2025! | Name: ${sup.name}`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run the script
setAllPasswords()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
