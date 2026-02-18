// Breakdown Analytics Integration Module
// Handles data storage, retrieval, and pattern detection for GO BARRY

(function() {
    'use strict';

    const STORAGE_KEY = 'gobarry_breakdowns';
    const PATTERN_KEY = 'gobarry_patterns';
    
    // Initialize the BreakdownAnalytics module
    window.BreakdownAnalytics = {
        // Store supervisor session
        supervisorSession: null,
        
        // Set supervisor session
        setSupervisor: function(session) {
            this.supervisorSession = session;
            console.log(`BreakdownAnalytics: Supervisor ${session.supervisorId} set`);
        },
        
        // Record a new breakdown from wizard completion
        recordBreakdown: async function(wizardType, responses, decision) {
            try {
                // Create breakdown record with supervisor tracking
                const breakdown = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString('en-GB'),
                    time: new Date().toLocaleTimeString('en-GB'),
                    
                    // Supervisor Information (CRITICAL FOR AUDIT)
                    supervisorId: this.supervisorSession?.supervisorId || 'UNKNOWN',
                    supervisorName: this.supervisorSession?.supervisorName || 'Unknown Supervisor',
                    supervisorDepot: this.supervisorSession?.depot || 'Unknown',
                    supervisorAdmin: this.supervisorSession?.isAdmin || false,
                    
                    // Vehicle Information
                    fleetNumber: responses.fleetNumber || responses.vehicleNumber || 'Unknown',
                    depot: responses.depot || this.detectDepot(responses.fleetNumber) || 'Unknown',
                    
                    // Breakdown Details
                    category: this.mapWizardToCategory(wizardType),
                    wizardType: wizardType,
                    decision: decision, // STOP, AMBER, or CONTINUE
                    safetyCritical: decision === 'STOP',
                    
                    // Wizard Responses
                    responses: responses,
                    
                    // Additional Context
                    driverName: responses.driverName || 'Not Recorded',
                    driverWellbeing: responses.driverWellbeing || 'Not Assessed',
                    route: responses.route || 'Not Recorded',
                    location: responses.location || 'Not Recorded',
                    
                    // Calculated Fields
                    estimatedDowntime: this.calculateDowntime(wizardType, decision),
                    requiresEngineering: decision !== 'CONTINUE',
                    
                    // Metadata
                    recordedBy: this.supervisorSession?.supervisorId || 'Supervisor',
                    defectReported: responses.defectReported || false,
                    
                    // Audit Trail
                    auditLog: {
                        createdAt: new Date().toISOString(),
                        createdBy: this.supervisorSession?.supervisorId,
                        sessionToken: this.supervisorSession?.token ? 'Present' : 'Missing',
                        browserInfo: navigator.userAgent
                    }
                };
                
                // Get existing breakdowns
                const breakdowns = this.getAllBreakdowns();
                
                // Add new breakdown
                breakdowns.push(breakdown);
                
                // Save to localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(breakdowns));
                
                // Check for patterns
                this.updatePatternDetection(breakdown);
                
                return { success: true, breakdown: breakdown };
                
            } catch (error) {
                console.error('Error recording breakdown:', error);
                return { success: false, error: error.message, offline: true };
            }
        },
        
        // Get all breakdowns
        getAllBreakdowns: function() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Error retrieving breakdowns:', error);
                return [];
            }
        },
        
        // Get breakdowns with filters
        getFilteredBreakdowns: function(filters = {}) {
            let breakdowns = this.getAllBreakdowns();
            
            // Filter by date range
            if (filters.days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - filters.days);
                breakdowns = breakdowns.filter(b => new Date(b.timestamp) >= cutoffDate);
            }
            
            // Filter by depot
            if (filters.depot && filters.depot !== 'All Depots') {
                breakdowns = breakdowns.filter(b => b.depot === filters.depot);
            }
            
            // Filter by category
            if (filters.category) {
                breakdowns = breakdowns.filter(b => b.category === filters.category);
            }
            
            // Filter by decision
            if (filters.decision) {
                breakdowns = breakdowns.filter(b => b.decision === filters.decision);
            }
            
            // Filter by fleet number
            if (filters.fleetNumber) {
                breakdowns = breakdowns.filter(b => b.fleetNumber === filters.fleetNumber);
            }
            
            return breakdowns;
        },
        
        // Get analytics summary
        getAnalyticsSummary: function(filters = {}) {
            const breakdowns = this.getFilteredBreakdowns(filters);
            
            // Calculate statistics
            const stats = {
                totalBreakdowns: breakdowns.length,
                vehiclesAffected: [...new Set(breakdowns.map(b => b.fleetNumber))].length,
                safetyCritical: breakdowns.filter(b => b.safetyCritical).length,
                
                // By decision
                stopDecisions: breakdowns.filter(b => b.decision === 'STOP').length,
                amberDecisions: breakdowns.filter(b => b.decision === 'AMBER').length,
                continueDecisions: breakdowns.filter(b => b.decision === 'CONTINUE').length,
                
                // By depot
                depotBreakdown: this.groupByProperty(breakdowns, 'depot'),
                
                // By category
                categoryBreakdown: this.groupByProperty(breakdowns, 'category'),
                
                // By vehicle
                vehicleBreakdowns: this.groupByProperty(breakdowns, 'fleetNumber'),
                
                // Recent breakdowns
                recentBreakdowns: breakdowns.slice(-10).reverse(),
                
                // Time-based analysis
                breakdownsByHour: this.analyzeByHour(breakdowns),
                breakdownsByDay: this.analyzeByDay(breakdowns)
            };
            
            return stats;
        },
        
        // Pattern detection
        checkPatterns: function(fleetNumber, depot) {
            const patterns = [];
            const recentDays = 30;
            
            // Get recent breakdowns
            const recentBreakdowns = this.getFilteredBreakdowns({ days: recentDays });
            
            // Check vehicle pattern
            if (fleetNumber) {
                const vehicleBreakdowns = recentBreakdowns.filter(b => b.fleetNumber === fleetNumber);
                if (vehicleBreakdowns.length >= 3) {
                    patterns.push({
                        type: 'REPEAT_VEHICLE',
                        severity: 'warning',
                        message: `Vehicle ${fleetNumber} has had ${vehicleBreakdowns.length} breakdowns in the last ${recentDays} days`,
                        data: vehicleBreakdowns
                    });
                }
            }
            
            // Check depot pattern
            if (depot) {
                const depotBreakdowns = recentBreakdowns.filter(b => b.depot === depot);
                const avgPerDepot = recentBreakdowns.length / 5; // Assuming 5 depots
                
                if (depotBreakdowns.length > avgPerDepot * 1.5) {
                    patterns.push({
                        type: 'DEPOT_SPIKE',
                        severity: 'info',
                        message: `${depot} depot has ${depotBreakdowns.length} breakdowns, ${Math.round((depotBreakdowns.length / avgPerDepot - 1) * 100)}% above average`,
                        data: depotBreakdowns
                    });
                }
            }
            
            // Check category patterns
            const categories = this.groupByProperty(recentBreakdowns, 'category');
            Object.entries(categories).forEach(([category, count]) => {
                if (count >= 5) {
                    patterns.push({
                        type: 'CATEGORY_TREND',
                        severity: 'info',
                        message: `${category} issues are trending with ${count} occurrences in ${recentDays} days`,
                        data: recentBreakdowns.filter(b => b.category === category)
                    });
                }
            });
            
            return patterns;
        },
        
        // Export data to Excel format
        exportToExcel: function() {
            const breakdowns = this.getAllBreakdowns();
            
            // Transform to flat structure for Excel
            const excelData = breakdowns.map(b => ({
                'Date': b.date,
                'Time': b.time,
                'Fleet Number': b.fleetNumber,
                'Depot': b.depot,
                'Category': b.category,
                'Decision': b.decision,
                'Safety Critical': b.safetyCritical ? 'Yes' : 'No',
                'Driver Name': b.driverName,
                'Route': b.route,
                'Location': b.location,
                'Driver Wellbeing': b.driverWellbeing,
                'Requires Engineering': b.requiresEngineering ? 'Yes' : 'No',
                'Estimated Downtime (hrs)': b.estimatedDowntime,
                'Recorded By': b.recordedBy,
                'Defect Reported': b.defectReported ? 'Yes' : 'No'
            }));
            
            return excelData;
        },
        
        // Helper functions
        mapWizardToCategory: function(wizardType) {
            const categoryMap = {
                'steering': 'Steering System',
                'brakes': 'Brake System',
                'abs_light': 'ABS/EBS System',
                'oil_warning': 'Engine Oil System',
                'interior_lights': 'Interior Lighting',
                'exterior_lights': 'Exterior Lighting',
                'wheelchair_ramp': 'Accessibility Equipment',
                'destination_display': 'Destination Equipment',
                'battery': 'Electrical System',
                'cooling_system': 'Cooling System',
                'demisters_heaters': 'Climate Control',
                'doors': 'Door System',
                'non_starter': 'Starting System',
                'gear_selection': 'Transmission',
                'gearbox': 'Gearbox Temperature',
                'buzzers': 'Warning Systems',
                'warning_lights': 'Dashboard Warnings',
                'excessive_smoke': 'Exhaust System',
                'suspension': 'Suspension System',
                'wipers_screenwash': 'Visibility Systems',
                'low_water': 'Cooling System',
                'broken_windows': 'Body/Glass',
                'wing_mirrors': 'Mirrors',
                'cutting_out_fuel': 'Fuel System',
                'loose_wheel_nuts': 'Wheel Safety',
                'puncture': 'Tyres',
                'speedo': 'Instrumentation',
                'interior_exterior_damage': 'Body Damage',
                'repeat_defects': 'Multiple Systems',
                'road_traffic_incidents': 'Accident Damage'
            };
            
            return categoryMap[wizardType] || 'Other';
        },
        
        detectDepot: function(fleetNumber) {
            // Basic depot detection based on fleet number ranges
            // This should be customized based on actual fleet allocation
            const num = parseInt(fleetNumber);
            
            if (num >= 5000 && num < 5200) return 'Washington';
            if (num >= 5200 && num < 5400) return 'Consett';
            if (num >= 5400 && num < 5600) return 'Hexham';
            if (num >= 5600 && num < 5800) return 'Riverside';
            if (num >= 5800 && num < 6000) return 'Gateshead Riverside';
            
            return 'Unknown';
        },
        
        calculateDowntime: function(wizardType, decision) {
            // Estimate downtime in hours based on wizard type and decision
            if (decision === 'CONTINUE') return 0;
            
            const downtimeMap = {
                'steering': { STOP: 4, AMBER: 2 },
                'brakes': { STOP: 6, AMBER: 3 },
                'oil_warning': { STOP: 8, AMBER: 4 },
                'loose_wheel_nuts': { STOP: 3, AMBER: 1 },
                'puncture': { STOP: 2, AMBER: 1 },
                'non_starter': { STOP: 3, AMBER: 1.5 },
                'doors': { STOP: 2, AMBER: 1 }
            };
            
            const defaultDowntime = { STOP: 4, AMBER: 2 };
            const times = downtimeMap[wizardType] || defaultDowntime;
            
            return times[decision] || 2;
        },
        
        groupByProperty: function(array, property) {
            return array.reduce((acc, item) => {
                const key = item[property] || 'Unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
        },
        
        analyzeByHour: function(breakdowns) {
            const hourly = {};
            breakdowns.forEach(b => {
                const hour = new Date(b.timestamp).getHours();
                hourly[hour] = (hourly[hour] || 0) + 1;
            });
            return hourly;
        },
        
        analyzeByDay: function(breakdowns) {
            const daily = {};
            breakdowns.forEach(b => {
                const date = b.date;
                daily[date] = (daily[date] || 0) + 1;
            });
            return daily;
        },
        
        updatePatternDetection: function(newBreakdown) {
            // Store pattern detection results
            const patterns = this.checkPatterns(newBreakdown.fleetNumber, newBreakdown.depot);
            if (patterns.length > 0) {
                localStorage.setItem(PATTERN_KEY, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    patterns: patterns
                }));
            }
        },
        
        // Clear all data (for testing/reset)
        clearAllData: function() {
            if (confirm('Are you sure you want to clear all breakdown data? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(PATTERN_KEY);
                return true;
            }
            return false;
        }
    };
    
    console.log('BreakdownAnalytics module loaded successfully');
})();