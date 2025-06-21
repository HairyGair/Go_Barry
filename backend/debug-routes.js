// backend/debug-routes.js
// Add this temporarily to backend/index.js to debug route registration

export function debugRoutes(app) {
  console.log('🔍 DEBUG: Checking route registration...');
  
  // Add a test endpoint that lists all registered routes
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // Routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        // Router middleware
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
    
    res.json({
      success: true,
      totalRoutes: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      timestamp: new Date().toISOString()
    });
  });
  
  // Add test endpoints to verify specific routers are loaded
  app.get('/api/debug/test-imports', (req, res) => {
    res.json({
      success: true,
      imports: {
        activityLogsAPI: typeof activityLogsAPI !== 'undefined',
        dutyAPI: typeof dutyAPI !== 'undefined',
        supervisorAPI: typeof supervisorAPI !== 'undefined'
      },
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('✅ DEBUG routes added');
}
