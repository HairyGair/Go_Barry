// backend/test-breakdown-env.js
// Check if environment variables are set correctly for breakdown logging

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Checking environment configuration for breakdown logging...\n');

// Check Supabase configuration
console.log('📊 Supabase Configuration:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ NOT SET'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ NOT SET'}`);

const hasSupabaseConfig = process.env.SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

if (!hasSupabaseConfig) {
    console.log('\n❌ Missing Supabase configuration!');
    console.log('\n📝 To fix this:');
    console.log('1. Make sure you have a .env file in the backend directory');
    console.log('2. Add these variables to your .env file:');
    console.log('   SUPABASE_URL=your-supabase-url');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('\n💡 You can find these values in your Supabase dashboard:');
    console.log('   - Go to Settings > API');
    console.log('   - Copy the Project URL and service_role key');
} else {
    console.log('\n✅ Supabase configuration looks good!');
    
    // Try a simple request to verify the configuration works
    console.log('\n🧪 Testing Supabase connection...');
    
    import('./routes/adminBreakdowns.js').then(async (module) => {
        try {
            const axios = (await import('axios')).default;
            const response = await axios({
                method: 'GET',
                url: `${process.env.SUPABASE_URL}/rest/v1/breakdowns?limit=1`,
                headers: {
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`
                }
            });
            
            console.log('✅ Supabase connection successful!');
            console.log('   Table exists and is accessible');
            
        } catch (error) {
            if (error.response?.status === 404 || error.response?.data?.message?.includes('relation')) {
                console.log('⚠️  Supabase connection works, but the breakdowns table does not exist');
                console.log('\n📝 To create the table:');
                console.log('1. Go to your Supabase dashboard');
                console.log('2. Open the SQL Editor');
                console.log('3. Run the SQL from: backend/sql/breakdowns_schema.sql');
            } else if (error.response?.status === 401) {
                console.log('❌ Invalid Supabase credentials');
                console.log('   Please check your API keys');
            } else {
                console.log('❌ Supabase connection failed:', error.message);
            }
        }
    });
}

console.log('\n📚 Documentation:');
console.log('   - Implementation guide: BREAKDOWN_LOGGING_IMPLEMENTATION.md');
console.log('   - Troubleshooting: BREAKDOWN_ROUTES_TROUBLESHOOTING.md');
