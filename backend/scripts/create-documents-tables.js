// Script to create documents tables in Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Need service role key for schema changes
);

async function createDocumentsTables() {
  try {
    console.log('🔧 Creating documents tables in Supabase...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../sql/documents_schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📜 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement + ';' 
        });
        
        if (error) {
          // Some errors are expected (like table already exists)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key')) {
            console.log(`ℹ️  Skipping: ${error.message}`);
          } else {
            console.error(`❌ Error executing statement: ${error.message}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}: ${err.message}`);
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'document_categories']);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📊 Found tables:', tables.map(t => t.table_name));
    }
    
    // Test basic functionality
    console.log('\n🧪 Testing basic operations...');
    
    // Test categories query
    const { data: categories, error: catError } = await supabase
      .from('document_categories')
      .select('*')
      .limit(5);
    
    if (catError) {
      console.error('❌ Error querying categories:', catError);
    } else {
      console.log(`✅ Categories table working - found ${categories.length} default categories`);
    }
    
    // Test documents query (should be empty initially)
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (docError) {
      console.error('❌ Error querying documents:', docError);
    } else {
      console.log(`✅ Documents table working - found ${documents.length} documents`);
    }
    
    console.log('\n🎉 Documents tables setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a storage bucket called "documents" in Supabase dashboard');
    console.log('2. Set up storage policies for the documents bucket');
    console.log('3. Test file upload functionality');
    
  } catch (error) {
    console.error('❌ Failed to create documents tables:', error);
    process.exit(1);
  }
}

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY');
  process.exit(1);
}

createDocumentsTables().catch(console.error);