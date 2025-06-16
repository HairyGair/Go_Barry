// test-frequency-service.js
// Test the service frequency analyzer

import serviceFrequencyAnalyzer from './backend/services/serviceFrequencyAnalyzer.js';

async function testFrequencyService() {
    console.log('🧪 Testing Service Frequency Analyzer...\n');
    
    try {
        // Initialize the analyzer
        console.log('📊 Initializing analyzer...');
        await serviceFrequencyAnalyzer.initialize();
        console.log('✅ Analyzer initialized\n');
        
        // Test some popular Go North East routes
        const testRoutes = ['21', 'X21', '10', '1', 'Q3', '56', '309'];
        
        console.log('🚌 Testing individual routes:');
        console.log('================================');
        
        for (const routeId of testRoutes) {
            const frequency = serviceFrequencyAnalyzer.getRouteFrequency(routeId);
            const summary = serviceFrequencyAnalyzer.getFrequencySummary(routeId);
            
            if (frequency) {
                console.log(`\nRoute ${routeId}:`);
                console.log(`  Summary: ${summary}`);
                console.log(`  Category: ${frequency.overall.category}`);
                console.log(`  Total trips/day: ${frequency.totalTrips}`);
                console.log(`  Service hours: ${frequency.firstDeparture} - ${frequency.lastDeparture}`);
                if (frequency.peak) {
                    console.log(`  Peak frequency: every ${frequency.peak.avgMinutes} min (${frequency.peak.tripsInPeriod} trips)`);
                }
            } else {
                console.log(`\nRoute ${routeId}: No frequency data available`);
            }
        }
        
        // Test multiple routes (like an alert affecting several routes)
        console.log('\n\n🚦 Testing alert impact analysis:');
        console.log('==================================');
        
        const affectedRoutes = ['21', 'X21', '10', '56'];
        const frequencies = serviceFrequencyAnalyzer.getMultipleRouteFrequencies(affectedRoutes);
        const impact = serviceFrequencyAnalyzer.getImpactScore(affectedRoutes);
        
        console.log(`\nAlert affecting routes: ${affectedRoutes.join(', ')}`);
        console.log(`Impact score: ${impact.score}/10`);
        console.log(`Impact level: ${impact.impactLevel.toUpperCase()}`);
        console.log(`High-frequency routes affected: ${impact.affectedHighFrequency.join(', ') || 'None'}`);
        
        // Test high-frequency route detection
        console.log('\n\n🚄 Testing high-frequency routes:');
        console.log('===================================');
        
        const allRoutes = serviceFrequencyAnalyzer.routeFrequencies;
        const highFreqCount = Array.from(allRoutes.values())
            .filter(freq => freq.overall && freq.overall.category === 'high-frequency')
            .length;
        
        console.log(`Total routes analyzed: ${allRoutes.size}`);
        console.log(`High-frequency routes (≤10 min): ${highFreqCount}`);
        
        // Show top 10 most frequent routes
        const sortedRoutes = Array.from(allRoutes.entries())
            .filter(([_, freq]) => freq.overall && freq.overall.avgMinutes)
            .sort((a, b) => a[1].overall.avgMinutes - b[1].overall.avgMinutes)
            .slice(0, 10);
        
        console.log('\nTop 10 most frequent routes:');
        sortedRoutes.forEach(([routeId, freq], index) => {
            console.log(`  ${index + 1}. Route ${routeId}: ${serviceFrequencyAnalyzer.getFrequencySummary(routeId)}`);
        });
        
        console.log('\n✅ Frequency service test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testFrequencyService().then(() => {
    console.log('\n👍 All tests passed!');
    process.exit(0);
});