// test-display-routes.js
// Test script to verify routes are correctly included in enhanced alerts

import { apiRequest } from './Go_BARRY/config/api.js';

async function testDisplayRoutes() {
    console.log('🧪 Testing Display Screen Route Data...\n');
    
    try {
        console.log('🚌 Fetching enhanced alerts...');
        const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
        const data = await response.json();
        
        if (!data.success) {
            console.error('❌ Failed to fetch alerts:', data.error);
            return;
        }
        
        const alerts = data.alerts || [];
        console.log(`✅ Fetched ${alerts.length} alerts\n`);
        
        // Analyze route data
        let alertsWithRoutes = 0;
        let alertsWithFrequency = 0;
        let routeMismatches = [];
        
        console.log('📊 Analyzing route data in alerts:');
        console.log('=====================================');
        
        alerts.forEach((alert, index) => {
            console.log(`\nAlert ${index + 1}: ${alert.title}`);
            console.log(`  Location: ${alert.location}`);
            console.log(`  Coordinates: ${alert.coordinates ? alert.coordinates.join(', ') : 'None'}`);
            console.log(`  Source: ${alert.source}`);
            
            if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
                alertsWithRoutes++;
                console.log(`  ✅ Routes affected: ${alert.affectsRoutes.join(', ')}`);
                
                // Check frequency data
                if (alert.routeFrequencies || alert.routeFrequencySummaries) {
                    alertsWithFrequency++;
                    console.log('  ✅ Has frequency data');
                    
                    if (alert.routeFrequencySummaries) {
                        Object.entries(alert.routeFrequencySummaries).forEach(([route, summary]) => {
                            console.log(`     Route ${route}: ${summary}`);
                        });
                    }
                    
                    if (alert.frequencyImpact) {
                        console.log(`  ⚠️ Impact: ${alert.frequencyImpact.impactLevel} (score: ${alert.frequencyImpact.score})`);
                    }
                } else {
                    console.log('  ⚠️ No frequency data');
                }
            } else {
                console.log('  ❌ No routes affected');
                
                // Check if this should have routes
                if (alert.coordinates && alert.type !== 'manual_incident') {
                    routeMismatches.push({
                        title: alert.title,
                        location: alert.location,
                        coordinates: alert.coordinates,
                        source: alert.source
                    });
                }
            }
        });
        
        // Summary statistics
        console.log('\n\n📈 SUMMARY STATISTICS:');
        console.log('======================');
        console.log(`Total alerts: ${alerts.length}`);
        console.log(`Alerts with routes: ${alertsWithRoutes} (${Math.round(alertsWithRoutes/alerts.length * 100)}%)`);
        console.log(`Alerts with frequency data: ${alertsWithFrequency} (${Math.round(alertsWithFrequency/alerts.length * 100)}%)`);
        console.log(`Potential route mismatches: ${routeMismatches.length}`);
        
        if (routeMismatches.length > 0) {
            console.log('\n⚠️ ALERTS MISSING ROUTES:');
            console.log('========================');
            routeMismatches.forEach(alert => {
                console.log(`\n- ${alert.title}`);
                console.log(`  Location: ${alert.location}`);
                console.log(`  Coordinates: ${alert.coordinates.join(', ')}`);
                console.log(`  Source: ${alert.source}`);
            });
        }
        
        // Test specific endpoints
        console.log('\n\n🔍 Testing route matching for sample coordinates:');
        console.log('================================================');
        
        const testLocations = [
            { name: 'Newcastle Centre', lat: 54.9783, lng: -1.6178 },
            { name: 'Gateshead Interchange', lat: 54.9526, lng: -1.6014 },
            { name: 'Sunderland', lat: 54.9069, lng: -1.3838 }
        ];
        
        for (const loc of testLocations) {
            const url = `https://go-barry.onrender.com/api/routes/find-near-coordinate?lat=${loc.lat}&lng=${loc.lng}`;
            const routeResponse = await fetch(url);
            const routeData = await routeResponse.json();
            
            console.log(`\n${loc.name} (${loc.lat}, ${loc.lng}):`);
            if (routeData.success && routeData.routes) {
                console.log(`  Routes: ${routeData.routes.join(', ')}`);
            } else {
                console.log(`  ❌ Failed to get routes`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testDisplayRoutes();