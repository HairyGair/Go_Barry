import { readFileSync } from 'fs';
import axios from 'axios';

const sql = readFileSync('./migrations/add_performance_indexes.sql', 'utf8');
console.log('Adding performance indexes...');

const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
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
      const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown';
      console.log('✅ Created index:', indexName);
    } catch (e) {
      const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown';
      console.log('⚠️ Index may already exist:', indexName);
    }
  }
}