// Quick emergency endpoint to bypass the current issue
// This will return real TomTom data directly

export function addEmergencyEndpoint(app) {
  app.get('/api/emergency-alerts', async (req, res) => {
    console.log('🚨 Emergency alerts endpoint called');
    
    try {
      // Import TomTom service directly
      const { fetchTomTomTrafficWithStreetNames } = await import('./services/tomtom.js');
      
      console.log('🚗 Testing TomTom directly...');
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      
      console.log('📊 TomTom emergency result:', {
        success: tomtomResult.success,
        dataCount: tomtomResult.data ? tomtomResult.data.length : 0,
        error: tomtomResult.error
      });
      
      if (tomtomResult.success && tomtomResult.data) {
        res.json({
          success: true,
          alerts: tomtomResult.data,
          metadata: {
            source: 'emergency_tomtom_direct',
            count: tomtomResult.data.length,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.json({
          success: false,
          alerts: [],
          error: tomtomResult.error,
          metadata: {
            source: 'emergency_tomtom_direct',
            count: 0,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ Emergency endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: []
      });
    }
  });
}
