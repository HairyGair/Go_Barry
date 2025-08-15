// Fleet Intelligence Service
// Provides vehicle health scoring, problem detection, and cost analysis
// Can be imported into main application or used standalone

class FleetIntelligenceService {
    constructor(apiBaseUrl = 'https://go-barry.onrender.com/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
        
        // Cost calculation factors (configurable)
        this.costFactors = {
            lostRevenuePerMinute: 8.50,      // Average revenue per bus per minute
            replacementVehiclePerHour: 150,   // Cost to deploy replacement
            engineeringCalloutBase: 250,      // Base callout fee
            engineeringPerHour: 85,           // Engineering hourly rate
            averagePartsPerBreakdown: 120,    // Average parts cost
            
            // Additional factors for more accurate calculations
            peakHourMultiplier: 1.5,         // Extra cost during peak hours
            weekendCalloutMultiplier: 1.5,    // Weekend engineering rates
            priorityRouteMultiplier: 2.0,     // X10, X21 routes
            repeatBreakdownMultiplier: 1.3    // Repeat issues cost more
        };
        
        // Health score thresholds
        this.healthThresholds = {
            excellent: 95,
            good: 85,
            fair: 70,
            poor: 50,
            critical: 0
        };
        
        // Priority routes (higher impact when down)
        this.priorityRoutes = ['X10', 'X21', 'X30', 'X31', 'Q3', '21', '56'];
    }

    // Main method to get all fleet intelligence data
    async getFleetIntelligence() {
        try {
            const [breakdowns, liveBreakdowns] = await Promise.all([
                this.fetchWithCache('breakdowns/today', 'todayBreakdowns'),
                this.fetchWithCache('breakdowns/live', 'liveBreakdowns')
            ]);
            
            // Generate 30-day history (in production, this would be a real API call)
            const history = await this.getBreakdownHistory(30);
            
            return {
                healthScores: this.calculateHealthScores(history),
                problemVehicles: this.identifyProblemVehicles(history),
                costs: this.calculateDetailedCosts(breakdowns, liveBreakdowns),
                statistics: this.generateStatistics(history, breakdowns, liveBreakdowns),
                predictions: this.generatePredictions(history),
                recommendations: this.generateRecommendations(history)
            };
        } catch (error) {
            console.error('Error getting fleet intelligence:', error);
            throw error;
        }
    }

    // Fetch with caching
    async fetchWithCache(endpoint, cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/${endpoint}`);
            if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
            
            const result = await response.json();
            const data = result.breakdowns || result.data || [];
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    }

    // Get breakdown history for specified days
    async getBreakdownHistory(days = 30) {
        // In production, this would fetch from /api/breakdowns/history?days=30
        // For now, generate realistic mock data
        const history = [];
        const fleetNumbers = this.generateFleetNumbers();
        const depots = ['Consett', 'Gateshead', 'Washington', 'Percy Main', 'Deptford', 'Hexham'];
        const routes = ['X10', 'X21', '21', '56', 'Q3', '10', '10A', '10B', '307', '309'];
        
        for (let d = 0; d < days; d++) {
            const date = new Date();
            date.setDate(date.getDate() - d);
            
            // Generate 0-15 breakdowns per day (realistic for 900 vehicle fleet)
            const dailyBreakdowns = Math.floor(Math.random() * 16);
            
            for (let b = 0; b < dailyBreakdowns; b++) {
                const fleet = fleetNumbers[Math.floor(Math.random() * fleetNumbers.length)];
                const severity = this.randomSeverity();
                
                history.push({
                    breakdown_id: `BD-2025-${String(history.length + 1).padStart(5, '0')}`,
                    fleet_no: fleet,
                    depot_id: depots[Math.floor(Math.random() * depots.length)],
                    route_id: routes[Math.floor(Math.random() * routes.length)],
                    severity: severity,
                    created_at: this.randomTimeOnDate(date),
                    resolved_at: this.addMinutes(date, 30 + Math.random() * 120),
                    diagnosis: this.randomDiagnosis(),
                    repeat_breakdown: Math.random() < 0.2,
                    engineer_dispatched: severity === 'RED' || Math.random() < 0.4,
                    replacement_deployed: severity === 'RED' || Math.random() < 0.3
                });
            }
        }
        
        return history;
    }

    // Calculate vehicle health scores
    calculateHealthScores(history) {
        const vehicleData = new Map();
        const now = new Date();
        
        // Initialize all fleet vehicles with perfect health
        this.generateFleetNumbers().forEach(fleet => {
            vehicleData.set(fleet, {
                fleet,
                breakdowns: [],
                score: 100,
                trend: 'stable'
            });
        });
        
        // Process breakdown history
        history.forEach(breakdown => {
            const fleet = breakdown.fleet_no;
            if (!vehicleData.has(fleet)) {
                vehicleData.set(fleet, {
                    fleet,
                    breakdowns: [],
                    score: 100,
                    trend: 'stable'
                });
            }
            
            const vehicle = vehicleData.get(fleet);
            vehicle.breakdowns.push(breakdown);
        });
        
        // Calculate health scores
        const scores = [];
        vehicleData.forEach(vehicle => {
            let score = 100;
            const breakdowns = vehicle.breakdowns;
            
            // Analyze breakdowns
            const last7Days = breakdowns.filter(b => 
                (now - new Date(b.created_at)) / (1000 * 60 * 60 * 24) <= 7
            );
            const last30Days = breakdowns.filter(b => 
                (now - new Date(b.created_at)) / (1000 * 60 * 60 * 24) <= 30
            );
            
            // Deduct points based on breakdown frequency and severity
            last30Days.forEach(breakdown => {
                const daysSince = (now - new Date(breakdown.created_at)) / (1000 * 60 * 60 * 24);
                const recencyMultiplier = daysSince <= 7 ? 2 : daysSince <= 14 ? 1.5 : 1;
                
                if (breakdown.severity === 'RED') {
                    score -= (15 * recencyMultiplier);
                } else if (breakdown.severity === 'AMBER') {
                    score -= (8 * recencyMultiplier);
                } else {
                    score -= (3 * recencyMultiplier);
                }
                
                // Extra penalty for repeat breakdowns
                if (breakdown.repeat_breakdown) {
                    score -= 5;
                }
            });
            
            // Determine trend
            const recentCount = last7Days.length;
            const previousCount = breakdowns.filter(b => {
                const days = (now - new Date(b.created_at)) / (1000 * 60 * 60 * 24);
                return days > 7 && days <= 14;
            }).length;
            
            if (recentCount > previousCount) {
                vehicle.trend = 'worsening';
                score -= 5;
            } else if (recentCount < previousCount) {
                vehicle.trend = 'improving';
                score += 5;
            }
            
            // Ensure score is between 0 and 100
            vehicle.score = Math.max(0, Math.min(100, Math.round(score)));
            
            // Determine status
            if (vehicle.score >= this.healthThresholds.excellent) {
                vehicle.status = 'excellent';
                vehicle.color = '#10b981';
            } else if (vehicle.score >= this.healthThresholds.good) {
                vehicle.status = 'good';
                vehicle.color = '#3b82f6';
            } else if (vehicle.score >= this.healthThresholds.fair) {
                vehicle.status = 'fair';
                vehicle.color = '#f59e0b';
            } else if (vehicle.score >= this.healthThresholds.poor) {
                vehicle.status = 'poor';
                vehicle.color = '#ef4444';
            } else {
                vehicle.status = 'critical';
                vehicle.color = '#991b1b';
            }
            
            scores.push({
                fleet: vehicle.fleet,
                score: vehicle.score,
                status: vehicle.status,
                color: vehicle.color,
                trend: vehicle.trend,
                breakdownCount: last30Days.length,
                recentBreakdowns: last7Days.length,
                lastBreakdown: last30Days.length > 0 ? 
                    this.formatDate(last30Days[0].created_at) : null
            });
        });
        
        // Sort by score (lowest first for attention)
        scores.sort((a, b) => a.score - b.score);
        
        return scores;
    }

    // Identify problem vehicles
    identifyProblemVehicles(history) {
        const vehicleStats = new Map();
        
        // Aggregate breakdown data
        history.forEach(breakdown => {
            const fleet = breakdown.fleet_no;
            if (!vehicleStats.has(fleet)) {
                vehicleStats.set(fleet, {
                    fleet,
                    total: 0,
                    critical: 0,
                    lastWeek: 0,
                    lastMonth: 0,
                    repeatCount: 0,
                    totalDowntime: 0,
                    diagnoses: new Set()
                });
            }
            
            const stats = vehicleStats.get(fleet);
            stats.total++;
            
            if (breakdown.severity === 'RED') {
                stats.critical++;
            }
            
            const daysSince = (new Date() - new Date(breakdown.created_at)) / (1000 * 60 * 60 * 24);
            if (daysSince <= 7) {
                stats.lastWeek++;
            }
            if (daysSince <= 30) {
                stats.lastMonth++;
            }
            
            if (breakdown.repeat_breakdown) {
                stats.repeatCount++;
            }
            
            // Calculate downtime
            if (breakdown.resolved_at) {
                const downtime = (new Date(breakdown.resolved_at) - new Date(breakdown.created_at)) / (1000 * 60);
                stats.totalDowntime += downtime;
            }
            
            // Track diagnoses
            if (breakdown.diagnosis) {
                stats.diagnoses.add(breakdown.diagnosis);
            }
        });
        
        // Convert to array and calculate problem score
        const problemVehicles = Array.from(vehicleStats.values())
            .map(stats => {
                // Calculate problem score (higher = worse)
                let problemScore = stats.total * 10;
                problemScore += stats.critical * 25;
                problemScore += stats.lastWeek * 15;
                problemScore += stats.repeatCount * 20;
                problemScore += (stats.totalDowntime / 60) * 5; // Hours of downtime
                
                return {
                    ...stats,
                    problemScore: Math.round(problemScore),
                    avgDowntime: stats.total > 0 ? Math.round(stats.totalDowntime / stats.total) : 0,
                    commonIssue: stats.diagnoses.size > 0 ? 
                        Array.from(stats.diagnoses)[0] : 'Various'
                };
            })
            .filter(v => v.total > 0)
            .sort((a, b) => b.problemScore - a.problemScore)
            .slice(0, 20); // Top 20 problem vehicles
        
        return problemVehicles;
    }

    // Calculate detailed costs
    calculateDetailedCosts(todayBreakdowns, liveBreakdowns) {
        const costs = {
            lostRevenue: 0,
            replacementVehicles: 0,
            engineering: 0,
            parts: 0,
            total: 0,
            breakdown: []
        };
        
        const now = new Date();
        const currentHour = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        const isPeakHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 18);
        
        // Process today's breakdowns
        todayBreakdowns.forEach(breakdown => {
            const downtime = this.calculateDowntime(breakdown);
            const breakdownCosts = {
                fleet: breakdown.fleet_no,
                lostRevenue: 0,
                replacement: 0,
                engineering: 0,
                parts: 0
            };
            
            // Lost revenue calculation
            let revenueRate = this.costFactors.lostRevenuePerMinute;
            if (isPeakHour) revenueRate *= this.costFactors.peakHourMultiplier;
            if (this.priorityRoutes.includes(breakdown.route_id)) {
                revenueRate *= this.costFactors.priorityRouteMultiplier;
            }
            breakdownCosts.lostRevenue = downtime * revenueRate;
            
            // Replacement vehicle costs
            if (breakdown.replacement_deployed) {
                breakdownCosts.replacement = (downtime / 60) * this.costFactors.replacementVehiclePerHour;
            }
            
            // Engineering costs
            if (breakdown.engineer_dispatched) {
                breakdownCosts.engineering = this.costFactors.engineeringCalloutBase;
                if (isWeekend) {
                    breakdownCosts.engineering *= this.costFactors.weekendCalloutMultiplier;
                }
                breakdownCosts.engineering += (downtime / 60) * this.costFactors.engineeringPerHour;
            }
            
            // Parts costs
            if (breakdown.severity === 'RED') {
                breakdownCosts.parts = this.costFactors.averagePartsPerBreakdown * 2.5;
            } else if (breakdown.severity === 'AMBER') {
                breakdownCosts.parts = this.costFactors.averagePartsPerBreakdown;
            }
            
            // Add repeat breakdown multiplier
            if (breakdown.repeat_breakdown) {
                Object.keys(breakdownCosts).forEach(key => {
                    if (key !== 'fleet') {
                        breakdownCosts[key] *= this.costFactors.repeatBreakdownMultiplier;
                    }
                });
            }
            
            // Accumulate costs
            costs.lostRevenue += breakdownCosts.lostRevenue;
            costs.replacementVehicles += breakdownCosts.replacement;
            costs.engineering += breakdownCosts.engineering;
            costs.parts += breakdownCosts.parts;
            costs.breakdown.push(breakdownCosts);
        });
        
        // Add ongoing costs from live breakdowns
        liveBreakdowns.forEach(breakdown => {
            const minutesSince = breakdown.minutes_since_diagnosis || 0;
            let revenueRate = this.costFactors.lostRevenuePerMinute;
            
            if (isPeakHour) revenueRate *= this.costFactors.peakHourMultiplier;
            if (this.priorityRoutes.includes(breakdown.route_id)) {
                revenueRate *= this.costFactors.priorityRouteMultiplier;
            }
            
            costs.lostRevenue += minutesSince * revenueRate;
        });
        
        // Calculate total
        costs.total = costs.lostRevenue + costs.replacementVehicles + costs.engineering + costs.parts;
        
        // Round all values
        Object.keys(costs).forEach(key => {
            if (typeof costs[key] === 'number') {
                costs[key] = Math.round(costs[key]);
            }
        });
        
        return costs;
    }

    // Generate statistics
    generateStatistics(history, todayBreakdowns, liveBreakdowns) {
        const stats = {
            fleet: {
                total: 900,
                operational: 0,
                inMaintenance: 0,
                broken: liveBreakdowns.length
            },
            breakdowns: {
                today: todayBreakdowns.length,
                thisWeek: 0,
                thisMonth: 0,
                trend: 'stable'
            },
            performance: {
                mtbf: 0, // Mean Time Between Failures
                mttr: 0, // Mean Time To Repair
                availability: 0
            },
            depots: {},
            routes: {}
        };
        
        // Calculate weekly and monthly breakdowns
        const now = new Date();
        history.forEach(breakdown => {
            const daysSince = (now - new Date(breakdown.created_at)) / (1000 * 60 * 60 * 24);
            
            if (daysSince <= 7) {
                stats.breakdowns.thisWeek++;
            }
            if (daysSince <= 30) {
                stats.breakdowns.thisMonth++;
            }
            
            // Depot statistics
            const depot = breakdown.depot_id;
            if (!stats.depots[depot]) {
                stats.depots[depot] = { total: 0, critical: 0 };
            }
            stats.depots[depot].total++;
            if (breakdown.severity === 'RED') {
                stats.depots[depot].critical++;
            }
            
            // Route statistics
            const route = breakdown.route_id;
            if (!stats.routes[route]) {
                stats.routes[route] = { total: 0, critical: 0 };
            }
            stats.routes[route].total++;
            if (breakdown.severity === 'RED') {
                stats.routes[route].critical++;
            }
        });
        
        // Calculate fleet operational status
        stats.fleet.operational = stats.fleet.total - stats.fleet.broken - stats.fleet.inMaintenance;
        
        // Calculate performance metrics
        if (stats.breakdowns.thisMonth > 0) {
            stats.performance.mtbf = Math.round((30 * 24) / stats.breakdowns.thisMonth); // Hours
            
            const totalDowntime = history
                .filter(b => b.resolved_at)
                .reduce((sum, b) => {
                    const downtime = (new Date(b.resolved_at) - new Date(b.created_at)) / (1000 * 60 * 60);
                    return sum + downtime;
                }, 0);
            
            stats.performance.mttr = Math.round((totalDowntime / stats.breakdowns.thisMonth) * 60); // Minutes
            stats.performance.availability = Math.round(((30 * 24 - totalDowntime) / (30 * 24)) * 100); // Percentage
        }
        
        // Determine trend
        const thisWeekAvg = stats.breakdowns.thisWeek / 7;
        const lastWeekCount = history.filter(b => {
            const days = (now - new Date(b.created_at)) / (1000 * 60 * 60 * 24);
            return days > 7 && days <= 14;
        }).length;
        const lastWeekAvg = lastWeekCount / 7;
        
        if (thisWeekAvg > lastWeekAvg * 1.1) {
            stats.breakdowns.trend = 'increasing';
        } else if (thisWeekAvg < lastWeekAvg * 0.9) {
            stats.breakdowns.trend = 'decreasing';
        }
        
        return stats;
    }

    // Generate predictions
    generatePredictions(history) {
        const predictions = [];
        const vehiclePatterns = new Map();
        
        // Analyze patterns for each vehicle
        history.forEach(breakdown => {
            const fleet = breakdown.fleet_no;
            if (!vehiclePatterns.has(fleet)) {
                vehiclePatterns.set(fleet, {
                    fleet,
                    breakdowns: [],
                    intervals: [],
                    diagnoses: new Map()
                });
            }
            
            const pattern = vehiclePatterns.get(fleet);
            pattern.breakdowns.push(breakdown);
            
            // Track diagnosis frequency
            if (breakdown.diagnosis) {
                const count = pattern.diagnoses.get(breakdown.diagnosis) || 0;
                pattern.diagnoses.set(breakdown.diagnosis, count + 1);
            }
        });
        
        // Calculate failure patterns and make predictions
        vehiclePatterns.forEach(pattern => {
            if (pattern.breakdowns.length < 2) return;
            
            // Sort breakdowns by date
            pattern.breakdowns.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            // Calculate intervals between breakdowns
            for (let i = 1; i < pattern.breakdowns.length; i++) {
                const interval = (new Date(pattern.breakdowns[i].created_at) - 
                                 new Date(pattern.breakdowns[i-1].created_at)) / (1000 * 60 * 60 * 24);
                pattern.intervals.push(interval);
            }
            
            if (pattern.intervals.length > 0) {
                // Calculate average interval
                const avgInterval = pattern.intervals.reduce((a, b) => a + b, 0) / pattern.intervals.length;
                
                // Get last breakdown date
                const lastBreakdown = pattern.breakdowns[pattern.breakdowns.length - 1];
                const daysSinceLastBreakdown = (new Date() - new Date(lastBreakdown.created_at)) / (1000 * 60 * 60 * 24);
                
                // Predict next failure
                const daysUntilNextFailure = avgInterval - daysSinceLastBreakdown;
                
                if (daysUntilNextFailure <= 7 && daysUntilNextFailure > 0) {
                    // Find most common diagnosis
                    let mostCommonDiagnosis = 'General failure';
                    let maxCount = 0;
                    pattern.diagnoses.forEach((count, diagnosis) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostCommonDiagnosis = diagnosis;
                        }
                    });
                    
                    predictions.push({
                        fleet: pattern.fleet,
                        daysUntilFailure: Math.round(daysUntilNextFailure),
                        confidence: this.calculateConfidence(pattern),
                        likelyIssue: mostCommonDiagnosis,
                        preventiveCost: this.costFactors.averagePartsPerBreakdown,
                        breakdownCost: this.costFactors.averagePartsPerBreakdown * 5 + 
                                      this.costFactors.engineeringCalloutBase +
                                      (120 * this.costFactors.lostRevenuePerMinute)
                    });
                }
            }
        });
        
        // Sort by urgency (days until failure)
        predictions.sort((a, b) => a.daysUntilFailure - b.daysUntilFailure);
        
        return predictions.slice(0, 10); // Top 10 predictions
    }

    // Generate recommendations
    generateRecommendations(history) {
        const recommendations = [];
        const vehicleStats = new Map();
        
        // Analyze each vehicle
        history.forEach(breakdown => {
            const fleet = breakdown.fleet_no;
            if (!vehicleStats.has(fleet)) {
                vehicleStats.set(fleet, {
                    fleet,
                    totalCost: 0,
                    breakdownCount: 0,
                    criticalCount: 0,
                    age: this.estimateVehicleAge(fleet)
                });
            }
            
            const stats = vehicleStats.get(fleet);
            stats.breakdownCount++;
            
            if (breakdown.severity === 'RED') {
                stats.criticalCount++;
            }
            
            // Estimate cost
            stats.totalCost += this.estimateBreakdownCost(breakdown);
        });
        
        // Generate recommendations
        vehicleStats.forEach(stats => {
            // Recommend replacement for high-cost vehicles
            if (stats.totalCost > 15000 || stats.criticalCount >= 3) {
                recommendations.push({
                    type: 'replacement',
                    priority: 'high',
                    fleet: stats.fleet,
                    reason: `${stats.criticalCount} critical failures, £${stats.totalCost.toLocaleString()} in repairs`,
                    action: 'Schedule for replacement',
                    roi: Math.round(stats.totalCost / 2000) // Months to ROI
                });
            }
            // Recommend major service for moderate issues
            else if (stats.breakdownCount >= 5) {
                recommendations.push({
                    type: 'service',
                    priority: 'medium',
                    fleet: stats.fleet,
                    reason: `${stats.breakdownCount} breakdowns in 30 days`,
                    action: 'Schedule comprehensive service',
                    estimatedCost: 2000
                });
            }
            // Recommend preventive maintenance for emerging patterns
            else if (stats.breakdownCount >= 2) {
                recommendations.push({
                    type: 'preventive',
                    priority: 'low',
                    fleet: stats.fleet,
                    reason: 'Early warning signs detected',
                    action: 'Preventive inspection recommended',
                    estimatedCost: 200
                });
            }
        });
        
        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        return recommendations.slice(0, 15); // Top 15 recommendations
    }

    // Helper methods
    calculateDowntime(breakdown) {
        if (!breakdown.created_at) return 30;
        
        const start = new Date(breakdown.created_at);
        const end = breakdown.resolved_at ? new Date(breakdown.resolved_at) : new Date();
        const minutes = (end - start) / (1000 * 60);
        
        return Math.min(minutes, 480); // Cap at 8 hours
    }

    calculateConfidence(pattern) {
        // More breakdowns = higher confidence in prediction
        const dataPoints = pattern.breakdowns.length;
        const intervalConsistency = this.calculateStandardDeviation(pattern.intervals) < 10 ? 20 : 0;
        
        const confidence = Math.min(95, 50 + (dataPoints * 5) + intervalConsistency);
        return confidence;
    }

    calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        
        return Math.sqrt(avgSquareDiff);
    }

    estimateBreakdownCost(breakdown) {
        let cost = 500; // Base cost
        
        if (breakdown.severity === 'RED') cost += 2000;
        else if (breakdown.severity === 'AMBER') cost += 800;
        
        if (breakdown.engineer_dispatched) cost += 500;
        if (breakdown.replacement_deployed) cost += 300;
        if (breakdown.repeat_breakdown) cost += 400;
        
        return cost;
    }

    estimateVehicleAge(fleetNumber) {
        // Estimate based on fleet number patterns
        const num = parseInt(fleetNumber);
        if (num >= 6000 && num < 6100) return 2; // 2 years
        if (num >= 6100 && num < 6200) return 3;
        if (num >= 6200 && num < 6300) return 4;
        if (num >= 6300 && num < 6400) return 5;
        if (num >= 5000 && num < 6000) return 6;
        return 7; // Older vehicles
    }

    generateFleetNumbers() {
        // Generate realistic fleet numbers for Go North East
        const fleetNumbers = [];
        
        // Modern double deckers (6000 series)
        for (let i = 6001; i <= 6050; i++) {
            fleetNumbers.push(String(i));
        }
        
        // Older double deckers (5000 series)
        for (let i = 5401; i <= 5450; i++) {
            fleetNumbers.push(String(i));
        }
        
        // Single deckers (8000 series)
        for (let i = 8301; i <= 8350; i++) {
            fleetNumbers.push(String(i));
        }
        
        return fleetNumbers;
    }

    randomSeverity() {
        const rand = Math.random();
        if (rand < 0.15) return 'RED';
        if (rand < 0.45) return 'AMBER';
        return 'GREEN';
    }

    randomDiagnosis() {
        const diagnoses = [
            'Engine overheating',
            'Brake system failure',
            'Steering issues',
            'Electrical fault',
            'Door mechanism failure',
            'Suspension problem',
            'Gearbox issue',
            'Oil leak',
            'Coolant leak',
            'Battery failure',
            'Alternator fault',
            'Air system leak',
            'Demister failure',
            'Lighting fault',
            'Ramp malfunction'
        ];
        
        return diagnoses[Math.floor(Math.random() * diagnoses.length)];
    }

    randomTimeOnDate(date) {
        const newDate = new Date(date);
        newDate.setHours(Math.floor(Math.random() * 24));
        newDate.setMinutes(Math.floor(Math.random() * 60));
        return newDate.toISOString();
    }

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000).toISOString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FleetIntelligenceService;
}

// Also make available globally for browser use
if (typeof window !== 'undefined') {
    window.FleetIntelligenceService = FleetIntelligenceService;
}
