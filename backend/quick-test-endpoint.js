// quick-test-endpoint.js
// Add this simple endpoint to test if the backend is working

export function addQuickTestEndpoint(app) {
  app.get('/api/quick-test', (req, res) => {
    console.log('🧪 Quick test endpoint called');
    res.json({
      success: true,
      message: 'Backend is working with improved routes!',
      timestamp: new Date().toISOString(),
      apiKeys: {
        tomtom: !!process.env.TOMTOM_API_KEY
      }
    });
  });
}
