// Add this to backend/index.js after other route imports

import coordinateResolutionAPI from './routes/coordinateResolutionAPI.js';

// Add this after other app.use() statements (around line 200-250)
app.use('/api/coordinate-resolution', memoryOptimizedRouteManager.optimizeRoute(coordinateResolutionAPI));

// Or if not using memoryOptimizedRouteManager:
// app.use('/api/coordinate-resolution', coordinateResolutionAPI);
