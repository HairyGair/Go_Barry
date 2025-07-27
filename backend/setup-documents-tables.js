import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODE0OSwiZXhwIjoyMDYzMjU0MTQ5fQ.SXrxBWe1asnZecLdnDOXRUA8OCySNge27c2SpAJOwwo';

async function setupDocumentsTables() {
  console.log('🔧 Setting up documents tables via Supabase REST API...');
  
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    // First, test if tables exist by querying them
    const docsResponse = await fetch(`${supabaseUrl}/rest/v1/documents?limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (docsResponse.status === 406) {
      console.log('❌ Documents table does not exist');
      console.log('\n📋 Please create the tables manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/haountnghefcrsoniubq/sql');
      console.log('2. Copy the contents of backend/sql/manual_documents_setup.sql');
      console.log('3. Paste and run the SQL in the SQL Editor');
      console.log('\nAlso create a storage bucket:');
      console.log('1. Go to Storage section in Supabase dashboard');
      console.log('2. Create a new bucket called "documents"');
      console.log('3. Set it to Public if you want public access to files');
    } else if (docsResponse.ok) {
      console.log('✅ Documents table exists!');
      
      // Test categories table
      const catResponse = await fetch(`${supabaseUrl}/rest/v1/document_categories`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      
      if (catResponse.ok) {
        const categories = await catResponse.json();
        console.log(`✅ Categories table exists with ${categories.length} categories`);
        
        // List categories
        console.log('\n📁 Available categories:');
        categories.forEach(cat => {
          console.log(`  - ${cat.display_name} (${cat.name}): ${cat.description}`);
        });
      }
    }
    
    // Test file management endpoint
    console.log('\n🧪 Testing file management API...');
    const apiResponse = await fetch('http://localhost:3001/api/file-management/documents?limit=5');
    const apiData = await apiResponse.json();
    
    if (apiData.success) {
      console.log(`✅ File management API working! Found ${apiData.count} documents`);
    } else {
      console.log('❌ File management API error:', apiData.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupDocumentsTables();