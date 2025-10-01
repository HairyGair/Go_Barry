// Global Configuration for Breakdown Guide
window.APP_CONFIG = {
  // Backend URLs
  MAIN_BACKEND_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3003'  // Use local backend in development
    : 'https://go-barry.onrender.com',  // Production backend
    
  BREAKDOWN_BACKEND_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3003'  // Dedicated breakdown backend
    : 'https://breakdown-backend.onrender.com',  // Production breakdown backend (when deployed)
  
  // Feature flags
  USE_DEDICATED_BACKEND: true,  // Use dedicated breakdown backend instead of main
  ENABLE_LOCATION_TRACKING: true,
  ENABLE_HOTSPOT_ANALYSIS: true,
  ENABLE_AUTO_ESCALATION: true,
  
  // Refresh intervals (milliseconds)
  DASHBOARD_REFRESH_INTERVAL: 5000,
  ANALYTICS_REFRESH_INTERVAL: 30000,
  
  // Priority routes
  PRIORITY_ROUTES: ['X10', 'X21', '307', '1', '21', '56'],
  
  // Depots
  VALID_DEPOTS: ['Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford', 'Hexham'],
  
  // Supervisor badges
  SUPERVISOR_BADGES: ['AW001', 'AC002', 'AG003', 'CF004', 'DH005', 'JD006', 'JP007', 'SG008', 'BP009'],
  ADMIN_BADGES: ['AG003', 'BP009'],
  
  // Timeouts (minutes)
  DECISION_TIMEOUT: 30,  // Auto-escalate after 30 minutes
  SESSION_TIMEOUT: 480,  // 8 hours
  
  // External services
  PASSENGER_CLOUD_URL: 'https://gonortheast.passenger-app.com/network/journeys/cancellations',
  GOOGLE_MAPS_API_KEY: '',  // Add your API key
  WHAT3WORDS_API_KEY: '',   // Add your API key
};

// Helper function to get the correct backend URL
window.getBackendUrl = function(useMain = false) {
  if (useMain || !window.APP_CONFIG.USE_DEDICATED_BACKEND) {
    return window.APP_CONFIG.MAIN_BACKEND_URL;
  }
  return window.APP_CONFIG.BREAKDOWN_BACKEND_URL;
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.APP_CONFIG;
}
