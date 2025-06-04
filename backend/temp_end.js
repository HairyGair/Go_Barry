import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';
import { 
  findNearbyGTFSRoutes,
  findGTFSRoutesInRadius,
  findNearbyGTFSStops
} from '../gtfs-location-enhancer-optimized.js';
import { 
  alertAffectsGTFSRoute,
  classifyAlert,
  deduplicateAlerts
} from '../utils/alerts.js';
import { calculateDistance } from '../utils/helpers.js';

// Setup function that takes the app and global state
export function setupAPIRoutes(app, globalState) {
  const { 
    acknowledgedAlerts, 
    alertNotes, 
    alertsCache, 
    GTFS_ROUTES,
    NORTH_EAST_BBOXES,
    sampleTestAlerts,
    ACK_FILE,
    NOTES_FILE,
    // Add any other global variables that routes need
  } = globalState;

  // Enhanced alerts endpoint
  app.get('/api/alerts-enhanced', async (req, res) => {
    // Move the entire route handler here from index.js
    // This will be filled in when we copy the actual handlers
  });

  // GTFS status endpoint  
  app.get('/api/gtfs-status', (req, res) => {
    // Move handler here
  });

  // Main alerts endpoint (the big one!)
  app.get('/api/alerts', async (req, res) => {
    // Move the massive alerts handler here
  });

  // Test alerts endpoint
  app.get('/api/alerts-test', async (req, res) => {
    res.json({
      metadata: {
        count: sampleTestAlerts.length,
        source: 'sampleTestAlerts',
      },
      alerts: sampleTestAlerts,
    });
  });

  // Configuration endpoint
  app.get('/api/config', (req, res) => {
    res.json({
      gtfsRoutesCount: GTFS_ROUTES.length,
      northeastBboxesCount: NORTH_EAST_BBOXES.length,
    });
  });

  // Cache refresh endpoint
  app.get('/api/refresh', async (req, res) => {
    alertsCache.clear();
    res.json({ status: 'cache cleared' });
  });

  // Alert acknowledgment endpoint
  app.post('/api/acknowledge', async (req, res) => {
    const { alertId } = req.body;
    if (alertId) {
      acknowledgedAlerts.add(alertId);
      // Save to ACK_FILE or persist as needed
      res.json({ status: 'acknowledged', alertId });
    } else {
      res.status(400).json({ error: 'alertId is required' });
    }
  });

  // Staff notes endpoint
  app.post('/api/note', async (req, res) => {
    const { alertId, note } = req.body;
    if (alertId && note) {
      alertNotes[alertId] = note;
      // Save to NOTES_FILE or persist as needed
      res.json({ status: 'note saved', alertId });
    } else {
      res.status(400).json({ error: 'alertId and note are required' });
    }
  });

  // Debug traffic endpoint
  app.get('/api/debug-traffic', async (req, res) => {
    try {
      const tomTomData = await fetchTomTomTraffic();
      const hereData = await fetchHereTraffic();
      const nationalHighwaysData = await fetchNationalHighwaysTraffic();

      console.log('TomTom Traffic Data:', tomTomData);
      console.log('Here Traffic Data:', hereData);
      console.log('National Highways Traffic Data:', nationalHighwaysData);

      res.json({
        tomTom: tomTomData,
        here: hereData,
        nationalHighways: nationalHighwaysData,
      });
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      res.status(500).json({ error: 'Failed to fetch traffic data' });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.send('Welcome to BARRY API');
  });
}

export default { setupAPIRoutes };