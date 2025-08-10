// Emergency Login Bypass Script
// Copy and paste this entire code into the browser console

(function() {
    console.log('🚀 Running emergency login bypass...');
    
    // Create a session directly
    const session = {
        supervisorId: 'supervisor003',
        supervisorName: 'Anthony Gair',
        name: 'Anthony Gair',
        badge: 'AG003',
        depot: 'Emergency Login',
        isAdmin: true,
        email: 'ag003@gonortheast.co.uk',
        token: 'emergency-' + Date.now(),
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('supervisor_session', JSON.stringify(session));
    
    // Initialize all systems
    if (window.SupervisorBreakdownLogger) {
        window.SupervisorBreakdownLogger.setSupervisor(session);
        console.log('✅ Logger initialized');
    }
    
    if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.setSupervisor(session);
        console.log('✅ Analytics initialized');
    }
    
    if (window.breakdownTracker) {
        window.breakdownTracker.supervisorBadge = session.badge;
        window.breakdownTracker.supervisorName = session.name;
        window.breakdownTracker.init();
        console.log('✅ Tracker initialized');
    }
    
    console.log('✅ Emergency login successful!');
    console.log('📝 Session created for: Anthony Gair (AG003)');
    console.log('🔄 Refreshing page in 2 seconds...');
    
    // Refresh after a short delay
    setTimeout(() => {
        location.reload();
    }, 2000);
})();
