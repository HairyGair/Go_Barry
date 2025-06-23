// Add to backend/index.js to enable analytics

// Import analytics routes
import analyticsRoutes from './routes/analyticsAPI.js';

// Register analytics routes (add after other route registrations)
app.use('/api', analyticsRoutes);

// Log analytics registration
console.log('✅ Analytics API routes registered');

// Optional: Add analytics middleware to track all API calls
app.use((req, res, next) => {
  const start = Date.now();
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Don't track analytics endpoints to avoid loops
    if (!req.path.includes('/analytics')) {
      // You could send this to analytics service
      console.log(`API: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
});