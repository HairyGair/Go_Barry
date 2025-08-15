// Configuration file for cPanel deployment
// Add this to the top of your main JavaScript files

const CONFIG = {
    // Production backend on Render
    BACKEND_URL: 'https://go-barry.onrender.com',
    
    // API endpoints
    API: {
        START_BREAKDOWN: '/api/breakdowns/start',
        LOG_STEP: '/api/breakdowns/step',
        DIAGNOSE: '/api/breakdowns/diagnose',
        RESOLVE: '/api/breakdowns/resolve',
        LIVE_BREAKDOWNS: '/api/breakdowns/live',
        TODAY_BREAKDOWNS: '/api/breakdowns/today',
        FLEET_HISTORY: '/api/breakdowns/fleet'
    },
    
    // Auto-refresh interval for dashboard (milliseconds)
    DASHBOARD_REFRESH_INTERVAL: 5000,
    
    // Supervisor badges
    SUPERVISORS: [
        'AW001', 'AC002', 'AG003', 'CF004', 
        'DH005', 'JD006', 'JP007', 'SG008', 'BP009'
    ],
    
    // Admin badges (delete permissions)
    ADMIN_SUPERVISORS: ['AG003', 'BP009'],
    
    // Priority routes
    PRIORITY_ROUTES: ['X10', 'X21'],
    
    // Depots
    DEPOTS: [
        'Washington',
        'Gateshead',
        'Consett', 
        'Hexham',
        'Percy Main',
        'Deptford'
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}