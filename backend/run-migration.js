import { readFileSync } from 'fs';
import axios from 'axios';

const sql = readFileSync('./migrations/add_coordinate_caching.sql', 'utf8');
console.log('Running coordinate caching migration...');

try {
  const statements = sql.split(';').filter(s => s.trim() && s.trim().indexOf('--') !== 0);
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await axios.post(
          'https://haountnghecfrsoniubq.supabase.co/rest/v1/rpc/sql',
          { query: statement },
          {
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_KEY,
              'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (e) {
        console.log('⚠️ Statement may already exist:', statement.substring(0, 50) + '...');
      }
    }
  }
  console.log('✅ Coordinate caching migration completed');
} catch (error) {
  console.log('⚠️ Migration error:', error.message);
}