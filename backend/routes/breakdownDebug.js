// Add this temporary test endpoint to check environment variables
router.get('/debug/env', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    
    res.json({
      success: true,
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
        hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
        hasSupabaseRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
        clientAvailable: !!client,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
        hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
        hasSupabaseRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  }
});

// Add this at the end of the file before export
