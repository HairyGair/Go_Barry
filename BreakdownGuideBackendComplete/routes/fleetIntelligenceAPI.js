/*
 * Fleet Intelligence API
 * Provides advanced analytics for fleet health monitoring and breakdown cost analysis
 */

import express from 'express';
import supabaseService from '../services/supabaseService.js';
import fleetDatabase from '../services/fleetDatabaseService.js';

const router = express.Router();

// Cost calculation constants
const COST_CONFIG = {
    REVENUE_LOSS_PER_MINUTE: 8.50,        // Average revenue loss per minute of delay
    ENGINEERING_CALLOUT_BASE: 150,        // Base engineering callout cost
    ENGINEERING_HOURLY: 75,               // Engineering hourly rate after base
    REPLACEMENT_VEHICLE_HOURLY: 45,       // Replacement vehicle cost per hour
    PASSENGER_COMPENSATION_PER_INCIDENT: 25, // Average compensation per incident
    FUEL_WASTE_PER_HOUR: 15              // Fuel waste for idling/recovery
};

// Health score thresholds
const HEALTH_THRESHOLDS = {
    EXCELLENT: { min: 90, status: 'green' },
    GOOD: { min: 70, status: 'green' },
    WARNING: { min: 50, status: 'amber' },
    CRITICAL: { min: 0, status: 'red' }
};

// Get Supabase client helper
async function getSupabaseClient() {
    try {
        if (!supabaseService.isInitialized) {
            await supabaseService.initialize();
        }
        return await supabaseService.getClient();
    } catch (error) {
        console.error('Error getting Supabase client:', error);
        return null;
    }
}

/**
 * GET /api/fleet-intelligence/health-scores
 * Get health scores for all vehicles based on breakdown history
 */
router.get('/health-scores', async (req, res) => {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            throw new Error('Database connection failed');
        }

        // Get all vehicles from fleet database
        const fleetData = await fleetDatabase.getAllVehicles();
        
        // Get breakdown data for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate health scores
        const vehicleHealth = calculateVehicleHealth(fleetData.vehicles || [], breakdowns || []);

        res.json({
            success: true,
            vehicles: vehicleHealth,
            summary: {
                total: vehicleHealth.length,
                critical: vehicleHealth.filter(v => v.health_status === 'red').length,
                warning: vehicleHealth.filter(v => v.health_status === 'amber').length,
                healthy: vehicleHealth.filter(v => v.health_status === 'green').length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting health scores:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/fleet-intelligence/cost-analysis
 * Get breakdown cost analysis for today
 */
router.get('/cost-analysis', async (req, res) => {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            throw new Error('Database connection failed');
        }

        // Get today's breakdowns
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*')
            .gte('created_at', today.toISOString());

        if (error) throw error;

        // Calculate costs
        const costAnalysis = calculateBreakdownCosts(breakdowns || []);

        res.json({
            success: true,
            costs: costAnalysis,
            breakdown_count: breakdowns?.length || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting cost analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/fleet-intelligence/problem-vehicles
 * Get top problem vehicles based on breakdown frequency
 */
router.get('/problem-vehicles', async (req, res) => {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            throw new Error('Database connection failed');
        }

        const limit = parseInt(req.query.limit) || 10;
        const days = parseInt(req.query.days) || 30;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('fleet_number, created_at, severity, diagnosis')
            .gte('created_at', cutoffDate.toISOString());

        if (error) throw error;

        // Count breakdowns per vehicle
        const vehicleCounts = {};
        const vehicleDetails = {};

        (breakdowns || []).forEach(breakdown => {
            const fleetNo = breakdown.fleet_number;
            if (!vehicleCounts[fleetNo]) {
                vehicleCounts[fleetNo] = 0;
                vehicleDetails[fleetNo] = {
                    breakdowns: [],
                    severities: { high: 0, medium: 0, low: 0 }
                };
            }
            vehicleCounts[fleetNo]++;
            vehicleDetails[fleetNo].breakdowns.push(breakdown);
            
            const severity = breakdown.severity?.toLowerCase() || 'low';
            vehicleDetails[fleetNo].severities[severity]++;
        });

        // Sort by breakdown count and get top N
        const problemVehicles = Object.entries(vehicleCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([fleetNo, count]) => {
                const vehicleInfo = fleetDatabase.getVehicleByFleetNumber(fleetNo) || {};
                const details = vehicleDetails[fleetNo];
                
                // Calculate estimated cost impact
                const costImpact = count * (
                    COST_CONFIG.ENGINEERING_CALLOUT_BASE +
                    (COST_CONFIG.REVENUE_LOSS_PER_MINUTE * 30) // Assume 30 min average delay
                );

                return {
                    fleet_number: fleetNo,
                    breakdown_count: count,
                    vehicle_info: vehicleInfo,
                    severities: details.severities,
                    last_breakdown: details.breakdowns[0]?.created_at,
                    estimated_cost_impact: Math.round(costImpact),
                    recommendation: getMaintenanceRecommendation(count, details.severities)
                };
            });

        res.json({
            success: true,
            problem_vehicles: problemVehicles,
            period_days: days,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting problem vehicles:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/fleet-intelligence/predictions
 * Get breakdown predictions based on patterns
 */
router.get('/predictions', async (req, res) => {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            throw new Error('Database connection failed');
        }

        // Get breakdown history for pattern analysis
        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) throw error;

        // Analyze patterns and generate predictions
        const predictions = analyzeBreakdownPatterns(breakdowns || []);

        res.json({
            success: true,
            predictions,
            confidence_level: 'moderate', // This would be calculated based on data quality
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating predictions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/fleet-intelligence/depot-comparison
 * Compare breakdown rates across depots
 */
router.get('/depot-comparison', async (req, res) => {
    try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            throw new Error('Database connection failed');
        }

        const days = parseInt(req.query.days) || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*')
            .gte('created_at', cutoffDate.toISOString());

        if (error) throw error;

        // Get fleet data to map vehicles to depots
        const fleetData = await fleetDatabase.getAllVehicles();
        const vehicleDepotMap = {};
        (fleetData.vehicles || []).forEach(v => {
            vehicleDepotMap[v.fleet_number] = v.depot;
        });

        // Calculate depot statistics
        const depotStats = {};
        const depots = ['Consett', 'Gateshead', 'Washington', 'Percy Main', 'Deptford', 'Hexham'];
        
        depots.forEach(depot => {
            depotStats[depot] = {
                breakdown_count: 0,
                vehicle_count: fleetData.vehicles?.filter(v => v.depot === depot).length || 0,
                total_downtime_minutes: 0,
                cost_impact: 0,
                response_times: []
            };
        });

        (breakdowns || []).forEach(breakdown => {
            const depot = vehicleDepotMap[breakdown.fleet_number] || breakdown.depot_id;
            if (depot && depotStats[depot]) {
                depotStats[depot].breakdown_count++;
                
                // Calculate downtime (if diagnosed_at exists)
                if (breakdown.diagnosed_at && breakdown.resolved_at) {
                    const downtime = new Date(breakdown.resolved_at) - new Date(breakdown.diagnosed_at);
                    depotStats[depot].total_downtime_minutes += Math.round(downtime / 60000);
                }
                
                // Add to response times if we have the data
                if (breakdown.created_at && breakdown.diagnosed_at) {
                    const responseTime = new Date(breakdown.diagnosed_at) - new Date(breakdown.created_at);
                    depotStats[depot].response_times.push(Math.round(responseTime / 60000));
                }
            }
        });

        // Calculate rates and averages
        const comparison = Object.entries(depotStats).map(([depot, stats]) => {
            const avgResponseTime = stats.response_times.length > 0
                ? Math.round(stats.response_times.reduce((a, b) => a + b, 0) / stats.response_times.length)
                : 0;
            
            const breakdownRate = stats.vehicle_count > 0
                ? ((stats.breakdown_count / stats.vehicle_count) * 100).toFixed(1)
                : 0;

            return {
                depot,
                breakdown_count: stats.breakdown_count,
                vehicle_count: stats.vehicle_count,
                breakdown_rate: parseFloat(breakdownRate),
                avg_response_time_minutes: avgResponseTime,
                total_downtime_hours: Math.round(stats.total_downtime_minutes / 60),
                estimated_cost: Math.round(stats.breakdown_count * COST_CONFIG.ENGINEERING_CALLOUT_BASE)
            };
        });

        // Sort by breakdown rate
        comparison.sort((a, b) => b.breakdown_rate - a.breakdown_rate);

        res.json({
            success: true,
            depot_comparison: comparison,
            period_days: days,
            best_performer: comparison[comparison.length - 1],
            worst_performer: comparison[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting depot comparison:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper Functions

function calculateVehicleHealth(vehicles, breakdowns) {
    const breakdownCounts = {};
    
    // Count breakdowns per vehicle
    breakdowns.forEach(breakdown => {
        const fleetNo = breakdown.fleet_number;
        if (!breakdownCounts[fleetNo]) {
            breakdownCounts[fleetNo] = {
                count: 0,
                severities: [],
                dates: []
            };
        }
        breakdownCounts[fleetNo].count++;
        breakdownCounts[fleetNo].severities.push(breakdown.severity || 'low');
        breakdownCounts[fleetNo].dates.push(breakdown.created_at);
    });

    // Calculate health score for each vehicle
    return vehicles.map(vehicle => {
        const fleetNo = vehicle.fleet_number || vehicle.fleet_no;
        const breakdownData = breakdownCounts[fleetNo] || { count: 0, severities: [], dates: [] };
        
        // Base score calculation
        let score = 100;
        
        // Deduct points for breakdowns (more recent = more impact)
        const now = new Date();
        breakdownData.dates.forEach((date, index) => {
            const daysAgo = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
            const recencyMultiplier = Math.max(0.5, 1 - (daysAgo / 30)); // More recent = higher multiplier
            const severityMultiplier = breakdownData.severities[index] === 'high' ? 2 : 
                                      breakdownData.severities[index] === 'medium' ? 1.5 : 1;
            
            score -= (10 * recencyMultiplier * severityMultiplier);
        });

        score = Math.max(0, Math.round(score));

        // Determine status
        let status = 'green';
        if (score < 50) status = 'red';
        else if (score < 70) status = 'amber';

        // Get last breakdown info
        let lastBreakdown = 'No breakdowns';
        if (breakdownData.dates.length > 0) {
            const lastDate = new Date(Math.max(...breakdownData.dates.map(d => new Date(d))));
            const daysAgo = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            lastBreakdown = daysAgo === 0 ? 'Today' : 
                           daysAgo === 1 ? 'Yesterday' : 
                           `${daysAgo} days ago`;
        }

        return {
            fleet_number: fleetNo,
            make: vehicle.make,
            model: vehicle.model,
            depot: vehicle.depot,
            year: vehicle.year,
            health_score: score,
            health_status: status,
            breakdown_count: breakdownData.count,
            last_breakdown: lastBreakdown,
            risk_level: score < 50 ? 'high' : score < 70 ? 'medium' : 'low'
        };
    });
}

function calculateBreakdownCosts(breakdowns) {
    let totalCost = 0;
    let lostRevenue = 0;
    let engineeringCost = 0;
    let replacementCost = 0;
    let otherCosts = 0;

    breakdowns.forEach(breakdown => {
        // Calculate delay-based revenue loss
        let delayMinutes = 30; // Default assumption
        if (breakdown.created_at && breakdown.resolved_at) {
            const duration = new Date(breakdown.resolved_at) - new Date(breakdown.created_at);
            delayMinutes = Math.round(duration / 60000);
        }
        lostRevenue += delayMinutes * COST_CONFIG.REVENUE_LOSS_PER_MINUTE;

        // Engineering costs
        if (breakdown.status === 'resolved' || breakdown.status === 'on_site') {
            engineeringCost += COST_CONFIG.ENGINEERING_CALLOUT_BASE;
            // Add hourly rate for extended repairs
            if (delayMinutes > 60) {
                engineeringCost += Math.ceil((delayMinutes - 60) / 60) * COST_CONFIG.ENGINEERING_HOURLY;
            }
        }

        // Replacement vehicle costs
        if (breakdown.severity === 'high' || breakdown.status === 'cleared') {
            const hours = Math.ceil(delayMinutes / 60);
            replacementCost += hours * COST_CONFIG.REPLACEMENT_VEHICLE_HOURLY;
        }

        // Other costs (fuel waste, passenger compensation)
        if (delayMinutes > 30) {
            otherCosts += COST_CONFIG.FUEL_WASTE_PER_HOUR * (delayMinutes / 60);
            otherCosts += COST_CONFIG.PASSENGER_COMPENSATION_PER_INCIDENT;
        }
    });

    totalCost = lostRevenue + engineeringCost + replacementCost + otherCosts;

    return {
        total_impact: Math.round(totalCost),
        lost_revenue: Math.round(lostRevenue),
        engineering_cost: Math.round(engineeringCost),
        replacement_cost: Math.round(replacementCost),
        other_costs: Math.round(otherCosts),
        breakdown_count: breakdowns.length,
        avg_cost_per_breakdown: breakdowns.length > 0 ? Math.round(totalCost / breakdowns.length) : 0
    };
}

function getMaintenanceRecommendation(breakdownCount, severities) {
    if (breakdownCount >= 5 || severities.high >= 2) {
        return 'URGENT: Schedule immediate comprehensive inspection';
    } else if (breakdownCount >= 3 || severities.high >= 1) {
        return 'Schedule preventive maintenance within 7 days';
    } else if (breakdownCount >= 2) {
        return 'Monitor closely and schedule routine check';
    } else {
        return 'Continue regular maintenance schedule';
    }
}

function analyzeBreakdownPatterns(breakdowns) {
    const predictions = [];
    const vehiclePatterns = {};

    // Analyze patterns per vehicle
    breakdowns.forEach(breakdown => {
        const fleetNo = breakdown.fleet_number;
        if (!vehiclePatterns[fleetNo]) {
            vehiclePatterns[fleetNo] = {
                breakdowns: [],
                diagnoses: {}
            };
        }
        vehiclePatterns[fleetNo].breakdowns.push(breakdown);
        
        const diagnosis = breakdown.diagnosis || 'unknown';
        vehiclePatterns[fleetNo].diagnoses[diagnosis] = 
            (vehiclePatterns[fleetNo].diagnoses[diagnosis] || 0) + 1;
    });

    // Generate predictions based on patterns
    Object.entries(vehiclePatterns).forEach(([fleetNo, data]) => {
        if (data.breakdowns.length >= 2) {
            // Calculate breakdown frequency
            const dates = data.breakdowns.map(b => new Date(b.created_at)).sort((a, b) => a - b);
            if (dates.length >= 2) {
                const intervals = [];
                for (let i = 1; i < dates.length; i++) {
                    intervals.push(dates[i] - dates[i-1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const avgDays = avgInterval / (1000 * 60 * 60 * 24);
                
                // Predict next breakdown
                const lastBreakdown = dates[dates.length - 1];
                const predictedNext = new Date(lastBreakdown.getTime() + avgInterval);
                const daysUntil = Math.round((predictedNext - new Date()) / (1000 * 60 * 60 * 24));
                
                if (daysUntil > 0 && daysUntil <= 14) {
                    // Find most common diagnosis
                    const mostCommon = Object.entries(data.diagnoses)
                        .sort(([, a], [, b]) => b - a)[0];
                    
                    predictions.push({
                        fleet_number: fleetNo,
                        predicted_date: predictedNext.toISOString(),
                        days_until: daysUntil,
                        confidence: data.breakdowns.length >= 3 ? 'high' : 'moderate',
                        likely_issue: mostCommon ? mostCommon[0] : 'unknown',
                        pattern_type: avgDays <= 7 ? 'frequent' : avgDays <= 14 ? 'regular' : 'sporadic',
                        recommendation: daysUntil <= 3 ? 'Schedule preventive maintenance immediately' :
                                      daysUntil <= 7 ? 'Schedule maintenance this week' :
                                      'Monitor closely'
                    });
                }
            }
        }
    });

    // Sort by urgency (days until predicted breakdown)
    predictions.sort((a, b) => a.days_until - b.days_until);

    return predictions.slice(0, 10); // Return top 10 predictions
}

export default router;
