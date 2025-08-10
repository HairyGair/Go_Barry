#!/bin/bash

# Test script for Breakdown Analytics Integration

echo "🔧 Testing Breakdown Analytics Integration..."
echo "========================================="
echo ""

# Create a simple test HTML file
cat > test-breakdown-analytics.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Breakdown Analytics Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        button { 
            margin: 10px 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
        .results {
            background: #f0f0f0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        pre {
            background: #fff;
            padding: 10px;
            border: 1px solid #ddd;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>Breakdown Analytics Integration Test</h1>
    
    <div class="results">
        <h2>Test Controls</h2>
        <button onclick="testRecording()">Test Record Breakdown</button>
        <button onclick="checkData()">Check Stored Data</button>
        <button onclick="clearData()">Clear All Data</button>
        <button onclick="exportData()">Export to CSV</button>
    </div>
    
    <div id="results" class="results">
        <h2>Test Results</h2>
        <pre id="output">Click a test button to begin...</pre>
    </div>
    
    <!-- Load the analytics scripts -->
    <script src="Go_BARRY/public/breakdown-guide/breakdown-analytics.js"></script>
    <script src="Go_BARRY/public/breakdown-guide/breakdown-analytics-integration.js"></script>
    <script src="Go_BARRY/public/breakdown-guide/breakdown-dashboard-provider.js"></script>
    
    <script>
        const output = document.getElementById('output');
        
        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            output.innerHTML += `<span class="${type}">[${timestamp}] ${message}</span>\n`;
        }
        
        function testRecording() {
            output.innerHTML = '';
            log('Starting test recording...', 'info');
            
            // Set up a mock supervisor session
            const mockSupervisor = {
                supervisorId: 'TEST001',
                supervisorName: 'Test Supervisor',
                depot: 'Test Depot',
                isAdmin: true,
                token: 'test-token'
            };
            
            if (window.BreakdownAnalytics) {
                window.BreakdownAnalytics.setSupervisor(mockSupervisor);
                log('✓ Supervisor session set', 'success');
                
                // Record a test breakdown
                const result = window.BreakdownAnalytics.recordBreakdown(
                    'brakes',
                    {
                        fleetNumber: '5804',
                        depot: 'Gateshead Riverside',
                        driverName: 'Test Driver',
                        route: 'Route 21',
                        location: 'High Street',
                        brakeToFloor: true,
                        delayedBraking: false,
                        brakeLeaks: false,
                        goCheckReported: true
                    },
                    'STOP'
                );
                
                if (result.success) {
                    log('✓ Breakdown recorded successfully', 'success');
                    log('Breakdown ID: ' + result.breakdown.id, 'info');
                    log('Fleet: ' + result.breakdown.fleetNumber, 'info');
                    log('Decision: ' + result.breakdown.decision, 'info');
                } else {
                    log('✗ Failed to record breakdown', 'error');
                }
            } else {
                log('✗ BreakdownAnalytics not loaded', 'error');
            }
        }
        
        function checkData() {
            output.innerHTML = '';
            log('Checking stored data...', 'info');
            
            if (window.BreakdownDashboardData) {
                const hasData = window.BreakdownDashboardData.hasData();
                log('Has data: ' + hasData, hasData ? 'success' : 'error');
                
                if (hasData) {
                    const summary = window.BreakdownDashboardData.getDashboardSummary();
                    log('Summary:', 'info');
                    log(JSON.stringify(summary, null, 2), 'info');
                    
                    const records = window.BreakdownDashboardData.getBreakdownRecords();
                    log('\\nTotal records: ' + records.length, 'success');
                    
                    if (records.length > 0) {
                        log('\\nLatest record:', 'info');
                        log(JSON.stringify(records[records.length - 1], null, 2), 'info');
                    }
                }
            } else {
                log('✗ BreakdownDashboardData not loaded', 'error');
            }
        }
        
        function clearData() {
            if (confirm('Are you sure you want to clear all breakdown data?')) {
                output.innerHTML = '';
                log('Clearing all data...', 'info');
                
                if (window.BreakdownAnalytics) {
                    localStorage.removeItem('gobarry_breakdowns');
                    localStorage.removeItem('gobarry_patterns');
                    log('✓ Data cleared', 'success');
                    checkData();
                } else {
                    log('✗ BreakdownAnalytics not loaded', 'error');
                }
            }
        }
        
        function exportData() {
            output.innerHTML = '';
            log('Exporting data to CSV...', 'info');
            
            if (window.BreakdownDashboardData) {
                const csv = window.BreakdownDashboardData.exportToCSV();
                if (csv) {
                    window.BreakdownDashboardData.downloadCSV();
                    log('✓ CSV exported successfully', 'success');
                } else {
                    log('✗ No data to export', 'error');
                }
            } else {
                log('✗ BreakdownDashboardData not loaded', 'error');
            }
        }
        
        // Initial check on load
        setTimeout(() => {
            log('\\n=== System Check ===', 'info');
            log('BreakdownAnalytics: ' + (window.BreakdownAnalytics ? '✓' : '✗'), 
                window.BreakdownAnalytics ? 'success' : 'error');
            log('BreakdownDashboardData: ' + (window.BreakdownDashboardData ? '✓' : '✗'), 
                window.BreakdownDashboardData ? 'success' : 'error');
            
            if (window.BreakdownDashboardData) {
                const hasData = window.BreakdownDashboardData.hasData();
                log('Existing data found: ' + hasData, hasData ? 'success' : 'info');
            }
        }, 1000);
    </script>
</body>
</html>
EOF

echo "✅ Test file created: test-breakdown-analytics.html"
echo ""
echo "To test the integration:"
echo "1. Open test-breakdown-analytics.html in your browser"
echo "2. Click 'Test Record Breakdown' to create a test record"
echo "3. Click 'Check Stored Data' to verify it was saved"
echo "4. Open the Fleet Breakdown Analytics dashboard"
echo "5. The dashboard should now show data instead of '0 records'"
echo ""
echo "You can also test in the actual breakdown guide:"
echo "1. Open the breakdown guide"
echo "2. Complete a wizard assessment"
echo "3. Check the analytics dashboard for the new record"
