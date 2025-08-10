// Breakdown Analytics Dashboard Data Provider
// Provides data from the breakdown guide wizards to the analytics dashboard

(function() {
    'use strict';
    
    console.log('📊 Breakdown Analytics Dashboard Provider initializing...');
    
    // Create global interface for the dashboard
    window.BreakdownDashboardData = {
        
        // Get all breakdown records for the dashboard
        getBreakdownRecords: function() {
            if (!window.BreakdownAnalytics) {
                console.warn('BreakdownAnalytics not available');
                return [];
            }
            
            const breakdowns = window.BreakdownAnalytics.getAllBreakdowns();
            
            // Transform to dashboard format
            return breakdowns.map(b => ({
                id: b.id,
                date: b.date,
                time: b.time,
                fleetNumber: b.fleetNumber,
                depot: b.depot,
                category: b.category,
                decision: b.decision,
                safetyCritical: b.safetyCritical,
                driverName: b.driverName,
                route: b.route,
                location: b.location,
                supervisorName: b.supervisorName,
                supervisorId: b.supervisorId,
                requiresEngineering: b.requiresEngineering,
                estimatedDowntime: b.estimatedDowntime,
                goCheckReported: b.goCheckReported,
                timestamp: b.timestamp
            }));
        },
        
        // Get analytics summary for dashboard widgets
        getDashboardSummary: function(filters = {}) {
            if (!window.BreakdownAnalytics) {
                return {
                    totalBreakdowns: 0,
                    vehiclesAffected: 0,
                    safetyCritical: 0,
                    amberWarnings: 0,
                    continueDecisions: 0,
                    depotBreakdown: {},
                    categoryBreakdown: {},
                    worstPerformers: []
                };
            }
            
            const summary = window.BreakdownAnalytics.getAnalyticsSummary(filters);
            
            // Calculate worst performers
            const worstPerformers = Object.entries(summary.vehicleBreakdowns || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([fleet, count]) => ({
                    fleetNumber: fleet,
                    breakdowns: count,
                    rating: this.calculateReliabilityRating(count)
                }));
            
            return {
                totalBreakdowns: summary.totalBreakdowns,
                vehiclesAffected: summary.vehiclesAffected,
                safetyCritical: summary.safetyCritical,
                amberWarnings: summary.amberDecisions,
                continueDecisions: summary.continueDecisions,
                depotBreakdown: summary.depotBreakdown,
                categoryBreakdown: summary.categoryBreakdown,
                worstPerformers: worstPerformers,
                breakdownsByHour: summary.breakdownsByHour,
                breakdownsByDay: summary.breakdownsByDay
            };
        },
        
        // Calculate reliability rating
        calculateReliabilityRating: function(breakdownCount) {
            if (breakdownCount === 0) return 'Excellent';
            if (breakdownCount === 1) return 'Good';
            if (breakdownCount === 2) return 'Fair';
            if (breakdownCount === 3) return 'Poor';
            return 'Critical';
        },
        
        // Get data for charts
        getChartData: function() {
            const summary = this.getDashboardSummary();
            
            return {
                // Depot breakdown pie chart
                depotChart: {
                    labels: Object.keys(summary.depotBreakdown),
                    data: Object.values(summary.depotBreakdown),
                    backgroundColor: [
                        '#3B82F6', // blue
                        '#EF4444', // red
                        '#10B981', // green
                        '#F59E0B', // amber
                        '#8B5CF6', // purple
                        '#EC4899'  // pink
                    ]
                },
                
                // Category breakdown bar chart
                categoryChart: {
                    labels: Object.keys(summary.categoryBreakdown),
                    data: Object.values(summary.categoryBreakdown),
                    backgroundColor: '#3B82F6'
                },
                
                // Time series data
                timeSeriesChart: {
                    labels: Object.keys(summary.breakdownsByDay || {}),
                    data: Object.values(summary.breakdownsByDay || {})
                },
                
                // Decision types donut chart
                decisionChart: {
                    labels: ['STOP (Critical)', 'AMBER (Warning)', 'CONTINUE'],
                    data: [
                        summary.safetyCritical,
                        summary.amberWarnings,
                        summary.continueDecisions
                    ],
                    backgroundColor: ['#EF4444', '#F59E0B', '#10B981']
                }
            };
        },
        
        // Export data to CSV format
        exportToCSV: function() {
            const records = this.getBreakdownRecords();
            
            if (records.length === 0) {
                console.warn('No records to export');
                return null;
            }
            
            // Create CSV header
            const headers = [
                'Date', 'Time', 'Fleet Number', 'Depot', 'Category', 
                'Decision', 'Safety Critical', 'Driver Name', 'Route', 
                'Location', 'Supervisor', 'Requires Engineering', 
                'Est. Downtime (hrs)', 'GO-Check Reported'
            ];
            
            // Create CSV rows
            const rows = records.map(r => [
                r.date,
                r.time,
                r.fleetNumber,
                r.depot,
                r.category,
                r.decision,
                r.safetyCritical ? 'Yes' : 'No',
                r.driverName,
                r.route,
                r.location,
                r.supervisorName,
                r.requiresEngineering ? 'Yes' : 'No',
                r.estimatedDowntime,
                r.goCheckReported ? 'Yes' : 'No'
            ]);
            
            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => 
                    // Escape commas and quotes in cell content
                    typeof cell === 'string' && cell.includes(',') 
                        ? `"${cell.replace(/"/g, '""')}"` 
                        : cell
                ).join(','))
            ].join('\n');
            
            return csvContent;
        },
        
        // Download CSV file
        downloadCSV: function() {
            const csv = this.exportToCSV();
            if (!csv) {
                alert('No breakdown data to export');
                return;
            }
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `breakdown-data-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ CSV exported successfully');
        },
        
        // Get pattern detection results
        getPatterns: function(fleetNumber = null, depot = null) {
            if (!window.BreakdownAnalytics) {
                return [];
            }
            
            return window.BreakdownAnalytics.checkPatterns(fleetNumber, depot);
        },
        
        // Clear all data (with confirmation)
        clearAllData: function() {
            if (!window.BreakdownAnalytics) {
                return false;
            }
            
            return window.BreakdownAnalytics.clearAllData();
        },
        
        // Check if data is available
        hasData: function() {
            const records = this.getBreakdownRecords();
            return records && records.length > 0;
        },
        
        // Get last update time
        getLastUpdateTime: function() {
            const records = this.getBreakdownRecords();
            if (records.length === 0) return null;
            
            const lastRecord = records[records.length - 1];
            return lastRecord.timestamp;
        }
    };
    
    // Auto-refresh function for live dashboards
    window.BreakdownDashboardData.startAutoRefresh = function(callback, interval = 5000) {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            const data = this.getDashboardSummary();
            if (callback) callback(data);
        }, interval);
        
        console.log(`📊 Auto-refresh started (every ${interval/1000}s)`);
    };
    
    window.BreakdownDashboardData.stopAutoRefresh = function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('📊 Auto-refresh stopped');
        }
    };
    
    // Listen for breakdown recorded events
    window.addEventListener('breakdown-recorded', function(event) {
        console.log('📊 New breakdown recorded, updating dashboard data...');
        
        // Trigger any dashboard update callbacks
        if (window.BreakdownDashboardData.onUpdate) {
            window.BreakdownDashboardData.onUpdate(event.detail);
        }
    });
    
    console.log('✅ Breakdown Dashboard Data Provider ready');
    
    // Test the provider
    setTimeout(() => {
        const hasData = window.BreakdownDashboardData.hasData();
        console.log(`📊 Dashboard data available: ${hasData}`);
        
        if (hasData) {
            const summary = window.BreakdownDashboardData.getDashboardSummary();
            console.log('📊 Current dashboard summary:', summary);
        }
    }, 2000);
    
})();
