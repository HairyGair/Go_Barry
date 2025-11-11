import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verifyRouteId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Checking route_id population in breakdowns table...\n');

    const [results] = await connection.query(`
      SELECT
        COUNT(*) as total_breakdowns,
        COUNT(route_id) as with_route_id,
        ROUND(COUNT(route_id)/COUNT(*)*100, 1) as pct_populated,
        COUNT(CASE WHEN route_id IS NULL OR route_id = '' THEN 1 END) as null_or_empty
      FROM breakdowns;
    `);

    const row = results[0];
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ROUTE_ID POPULATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Breakdowns:           ${row.total_breakdowns}`);
    console.log(`With route_id:              ${row.with_route_id}`);
    console.log(`Percentage Populated:       ${row.pct_populated}%`);
    console.log(`NULL or Empty:              ${row.null_or_empty}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (row.pct_populated >= 80) {
      console.log('✅ PASS: route_id is sufficiently populated (≥80%)');
      console.log('   Phase 1 can proceed without backfill migration.');
    } else if (row.pct_populated >= 60) {
      console.log('⚠️  CAUTION: route_id is at ' + row.pct_populated + '%');
      console.log('   Consider backfilling missing route_id values.');
    } else {
      console.log('❌ FAIL: route_id is at ' + row.pct_populated + '%');
      console.log('   Phase 1 features will have limited data.');
    }

    console.log('\nSample breakdown records check:');
    const [samples] = await connection.query(`
      SELECT id, route_id, location_description, created_at
      FROM breakdowns
      WHERE route_id IS NOT NULL AND route_id != ''
      LIMIT 5;
    `);

    console.log('Sample records WITH route_id:');
    samples.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ID: ${row.id}, Route: ${row.route_id}, Location: ${row.location_description}`);
    });

    const [nullSamples] = await connection.query(`
      SELECT id, location_description, created_at
      FROM breakdowns
      WHERE route_id IS NULL OR route_id = ''
      LIMIT 3;
    `);

    if (nullSamples.length > 0) {
      console.log('\nSample records WITHOUT route_id:');
      nullSamples.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ID: ${row.id}, Location: ${row.location_description}`);
      });
    }

  } catch (error) {
    console.error('Error querying database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

verifyRouteId();
