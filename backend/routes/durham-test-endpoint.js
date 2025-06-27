// Test endpoint for Durham roadworks lightweight scraper
app.get('/api/test/durham-roadworks', async (req, res) => {
  try {
    console.log('🚧 Testing Durham roadworks lightweight scraper...');
    
    // Import the lightweight scraper
    const { default: durhamRoadworksLight } = await import('./services/durhamRoadworksLight.js');
    
    // Fetch roadworks
    const roadworks = await durhamRoadworksLight.fetchRoadworks();
    
    res.json({
      success: true,
      message: 'Durham roadworks fetched successfully',
      count: roadworks.length,
      roadworks: roadworks,
      metadata: {
        source: 'Durham County Council Website',
        method: 'Lightweight scraper (axios + cheerio)',
        timestamp: new Date().toISOString(),
        scraper: 'durhamRoadworksLight.js'
      }
    });
    
  } catch (error) {
    console.error('❌ Durham test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: 'Failed to fetch Durham roadworks'
    });
  }
});

console.log('✅ Durham roadworks test endpoint registered at /api/test/durham-roadworks');