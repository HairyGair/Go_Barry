import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Checking breakdowns table schema...\n');

    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'breakdowns'
      ORDER BY ORDINAL_POSITION;
    `, [process.env.DB_NAME]);

    console.log('BREAKDOWNS TABLE COLUMNS:');
    console.log('═══════════════════════════════════════════════════════════════');
    columns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const def = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
      console.log(`${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE.padEnd(20)} ${nullable}${def}`);
    });
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check if route_id column exists
    const hasRouteId = columns.some(col => col.COLUMN_NAME === 'route_id');

    if (hasRouteId) {
      console.log('✅ route_id column exists');
    } else {
      console.log('❌ route_id column DOES NOT EXIST');
      console.log('\nTo add route_id column, run:');
      console.log(`
ALTER TABLE breakdowns ADD COLUMN route_id VARCHAR(10) NULL AFTER fleet_no;
ALTER TABLE breakdowns ADD INDEX idx_route_id (route_id);
      `);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

checkSchema();
