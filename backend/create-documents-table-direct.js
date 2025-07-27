// Direct SQL execution to create documents tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODE0OSwiZXhwIjoyMDYzMjU0MTQ5fQ.SXrxBWe1asnZecLdnDOXRUA8OCySNge27c2SpAJOwwo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDocumentsTables() {
  try {
    console.log('🔧 Creating documents tables in Supabase...');
    
    // Create documents table
    const { error: docsTableError } = await supabase.from('documents').select('id').limit(1);
    
    if (docsTableError?.code === '42P01') {
      console.log('📋 Documents table does not exist, creating it...');
      
      // Since we can't execute raw SQL directly, let's use the manual setup SQL file
      console.log('\n⚠️  Tables need to be created manually in Supabase Dashboard');
      console.log('\n📋 Instructions:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of backend/sql/documents_schema.sql');
      console.log('4. Run the SQL commands');
      console.log('\n✅ Once done, the file management API will be ready to use!');
      
    } else if (!docsTableError) {
      console.log('✅ Documents table already exists!');
      
      // Check categories table
      const { data: categories, error: catError } = await supabase
        .from('document_categories')
        .select('*');
        
      if (!catError) {
        console.log(`✅ Categories table exists with ${categories.length} categories`);
      }
    }
    
    // Test the file management API
    console.log('\n🧪 Testing file management API...');
    const testUrl = 'http://localhost:3001/api/file-management/health';
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      console.log('📡 File Management API Status:', data);
    } catch (err) {
      console.log('⚠️  Backend not running or file management API not available');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createDocumentsTables();