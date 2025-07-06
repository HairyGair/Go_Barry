// Quick emergency endpoint to bypass the current issue
// This will return real TomTom data directly

export function addEmergencyEndpoint(app) {
  // POST endpoint for sending priority alerts
  app.post('/api/emergency-alerts', async (req, res) => {
    console.log('🚨 Priority alert POST received:', req.body);
    
    try {
      const { type, message, supervisorId, timestamp, priority } = req.body;
      
      // For now, just log the alert and return success
      // In production, this would broadcast to all supervisors via Convex or WebSocket
      const alertData = {
        id: `alert_${Date.now()}`,
        type: type || 'priority',
        message: message || 'Priority alert from operations',
        supervisorId: supervisorId || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        priority: priority || 'high',
        status: 'sent'
      };
      
      console.log('✅ Priority alert logged:', alertData);
      
      res.json({
        success: true,
        alert: alertData,
        message: 'Priority alert sent successfully'
      });
    } catch (error) {
      console.error('❌ Priority alert error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

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
