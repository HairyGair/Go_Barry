import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Test if routes are registered
app.get('/api/test-routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({ routes });
});

// Direct test of the roadwork alerts API
import roadworkAlertsAPI from './routes/roadworkAlertsAPI-simple.js';
app.use('/api/roadwork-alerts', roadworkAlertsAPI);

// Test endpoint
app.post('/api/roadwork-alerts-direct', (req, res) => {
  res.json({ success: true, message: 'Direct POST endpoint works', body: req.body });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Test the routes
  setTimeout(async () => {
    try {
      // Test GET
      const getResponse = await axios.get(`http://localhost:${PORT}/api/roadwork-alerts/test`);
      console.log('GET test response:', getResponse.data);
      
      // Test POST
      const postResponse = await axios.post(`http://localhost:${PORT}/api/roadwork-alerts`, {
        title: 'Test roadwork',
        location: 'Test location',
        start_date: new Date().toISOString(),
        created_by_supervisor_id: 'TEST001'
      });
      console.log('POST response:', postResponse.data);
      
    } catch (error) {
      console.error('Test error:', error.response?.data || error.message);
    }
    
    process.exit(0);
  }, 1000);
});
