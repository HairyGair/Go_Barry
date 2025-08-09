// Go_BARRY/public/verify-breakdown-integration.js
// Run this in the browser console to verify breakdown logging is integrated correctly

(function() {
    console.log('🔍 Verifying Breakdown Logging Integration...\n');
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Check if breakdown logger is loaded
    total++;
    if (window.logBreakdown && typeof window.logBreakdown === 'function') {
        console.log('✅ Breakdown logger is loaded');
        passed++;
    } else {
        console.error('❌ Breakdown logger NOT loaded - add <script src="../breakdownLogger.js"></script> to your HTML');
    }
    
    // Test 2: Check helper functions
    total++;
    if (window.getBreakdownData && window.isBreakdownLoggingAvailable) {
        console.log('✅ Helper functions available');
        passed++;
    } else {
        console.error('❌ Helper functions missing');
    }
    
    // Test 3: Check availability status
    total++;
    try {
        const status = window.isBreakdownLoggingAvailable();
        console.log('📊 Availability status:', status);
        
        if (!status.available) {
            console.warn('⚠️  Some required data is missing:');
            if (status.missing.supervisor) console.warn('   - Supervisor ID not set');
            if (status.missing.vehicleReg) console.warn('   - Vehicle registration not set');
            if (status.missing.fleetNo) console.warn('   - Fleet number not set');
        } else {
            console.log('✅ All required data is available');
            passed++;
        }
    } catch (error) {
        console.error('❌ Error checking availability:', error);
    }
    
    // Test 4: Check backend connectivity
    total++;
    const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://go-barry.onrender.com';
    
    console.log(`\n🌐 Testing backend at: ${backendUrl}`);
    
    fetch(`${backendUrl}/api/health`)
        .then(response => {
            if (response.ok) {
                console.log('✅ Backend is reachable');
                passed++;
                
                // Test 5: Try a test log
                console.log('\n📝 Attempting test breakdown log...');
                return window.logBreakdown({
                    supervisorId: 'INTEGRATION_TEST',
                    vehicleReg: 'TEST999',
                    fleetNo: 'FL_TEST',
                    breakdownType: 'Integration Test',
                    timestamp: new Date().toISOString()
                });
            } else {
                throw new Error(`Backend returned ${response.status}`);
            }
        })
        .then(result => {
            console.log('✅ Test breakdown logged successfully!');
            console.log('   Response:', result);
            total++;
            passed++;
            showSummary();
        })
        .catch(error => {
            console.error('❌ Backend test failed:', error.message);
            console.log('   Make sure your backend is running');
            showSummary();
        });
    
    function showSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Integration Test Summary: ${passed}/${total} tests passed`);
        console.log('='.repeat(50) + '\n');
        
        if (passed === total) {
            console.log('🎉 Perfect! Breakdown logging is fully integrated!');
        } else if (passed >= 2) {
            console.log('✅ Basic integration complete, but some features may not work');
            console.log('📝 Check the errors above for what needs fixing');
        } else {
            console.log('❌ Integration incomplete - please follow the setup guide');
            console.log('📚 See QUICK_FRONTEND_SETUP.md for instructions');
        }
        
        console.log('\n💡 Next steps:');
        console.log('1. Update your wizard components to call window.logBreakdown()');
        console.log('2. Add BreakdownLogs component to your admin dashboard');
        console.log('3. Test with real vehicle data');
    }
    
    // Show manual test command
    console.log('\n📝 Manual test command (copy and run):');
    console.log(`window.logBreakdown({
    supervisorId: 'MANUAL_TEST',
    vehicleReg: 'MAN123',
    fleetNo: 'FL_MAN',
    breakdownType: 'Manual Test',
    timestamp: new Date().toISOString()
}).then(r => console.log('Success!', r)).catch(e => console.error('Failed:', e));`);
    
})();
