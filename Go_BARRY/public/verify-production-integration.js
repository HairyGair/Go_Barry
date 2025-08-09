// Quick verification script - run this in browser console
console.log('🔍 Verifying Breakdown Logging Integration...\n');

// 1. Check if breakdownLogger is loaded
if (typeof window.logBreakdown === 'function') {
    console.log('✅ Breakdown logger is loaded');
} else {
    console.error('❌ Breakdown logger NOT found - check if breakdownLogger.js is included');
}

// 2. Check wizards with logging
const wizardsToCheck = [
    'SteeringWizard',
    'BrakesWizard', 
    'NonStarterWizard',
    'BatteryWizard',
    'DoorsWizard',
    'OilWarningLightWizard',
    'LooseWheelNutsWizard'
];

console.log('\n📋 Checking wizard integration:');
wizardsToCheck.forEach(wizard => {
    if (window[wizard]) {
        // Convert function to string and check for logBreakdown
        const wizardCode = window[wizard].toString();
        if (wizardCode.includes('window.logBreakdown')) {
            console.log(`✅ ${wizard} - Logging integrated`);
        } else {
            console.log(`❌ ${wizard} - Logging NOT integrated`);
        }
    } else {
        console.log(`⚠️ ${wizard} - Not loaded yet`);
    }
});

// 3. Test API endpoint
console.log('\n🌐 Testing API endpoint:');
const apiUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api/breakdowns'
    : '/api/breakdowns';

fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
        console.log(`✅ API is responding - ${data.breakdowns ? data.breakdowns.length : 0} breakdowns logged`);
        if (data.breakdowns && data.breakdowns.length > 0) {
            console.log('📊 Latest breakdown:', data.breakdowns[data.breakdowns.length - 1]);
        }
    })
    .catch(err => {
        console.error('❌ API error:', err.message);
    });

console.log('\n✨ Integration check complete! Check results above.');
console.log('💡 To test logging, navigate through any wizard and trigger a critical condition.');
