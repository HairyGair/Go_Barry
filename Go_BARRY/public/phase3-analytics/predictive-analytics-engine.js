/**
 * Go North East - Predictive Analytics Engine
 * Advanced pattern detection and maintenance forecasting system
 * 
 * Features:
 * - Breakdown pattern recognition
 * - Failure prediction algorithms 
 * - Maintenance scheduling optimization
 * - Cost impact forecasting
 * - Fleet reliability scoring
 */

import { addDays, subDays, differenceInDays, format } from 'date-fns';

class PredictiveAnalyticsEngine {
    constructor() {
        this.patterns = new Map();
        this.predictions = new Map();
        this.reliabilityScores = new Map();
        this.maintenanceSchedule = new Map();
        this.costProjections = new Map();
        
        // Algorithm configuration
        this.config = {
            patternDetection: {
                minBreakdownsForPattern: 3,
                timeWindowDays: 30,
                similarityThreshold: 0.7
            },
            prediction: {
                forecastDays: 90,
                confidenceThreshold: 0.6,
                riskCategories: ['low', 'medium', 'high', 'critical']
            },
            reliability: {
                baselineReliability: 95.0,
                degradationFactors: {
                    age: 0.1,
                    breakdownFrequency: 0.3,
                    maintenanceHistory: 0.2
                }
            }
        };
    }

    /**
     * Analyze breakdown patterns across the fleet
     */
    async analyzeBreakdownPatterns(breakdownData) {
        const patterns = [];
        const vehicleGroups = this.groupVehiclesByCharacteristics(breakdownData);
        
        for (const [groupId, vehicles] of vehicleGroups) {
            const groupBreakdowns = breakdownData.filter(b => 
                vehicles.includes(b.fleetNumber)
            );
            
            // Detect temporal patterns
            const temporalPattern = this.detectTemporalPatterns(groupBreakdowns);
            if (temporalPattern.confidence > this.config.patternDetection.similarityThreshold) {
                patterns.push({
                    type: 'temporal',
                    group: groupId,
                    pattern: temporalPattern,
                    vehiclesAffected: vehicles.length,
                    riskLevel: this.calculateRiskLevel(temporalPattern),
                    recommendations: this.generateRecommendations(temporalPattern)
                });
            }
            
            // Detect component failure patterns
            const componentPattern = this.detectComponentPatterns(groupBreakdowns);
            if (componentPattern.confidence > this.config.patternDetection.similarityThreshold) {
                patterns.push({
                    type: 'component',
                    group: groupId,
                    pattern: componentPattern,
                    vehiclesAffected: vehicles.length,
                    riskLevel: this.calculateRiskLevel(componentPattern),
                    recommendations: this.generateRecommendations(componentPattern)
                });
            }
        }
        
        this.patterns.set('current', patterns);
        return patterns;
    }

    /**
     * Group vehicles by similar characteristics for pattern analysis
     */
    groupVehiclesByCharacteristics(breakdownData) {
        const groups = new Map();
        
        // Group by manufacturer + model + year range
        const vehicleGroups = {};
        breakdownData.forEach(breakdown => {
            const vehicle = this.getVehicleDetails(breakdown.fleetNumber);
            const groupKey = `${vehicle.manufacturer}_${vehicle.model}_${this.getYearRange(vehicle.year)}`;
            
            if (!vehicleGroups[groupKey]) {
                vehicleGroups[groupKey] = new Set();
            }
            vehicleGroups[groupKey].add(breakdown.fleetNumber);
        });
        
        // Convert to Map
        Object.entries(vehicleGroups).forEach(([key, vehicles]) => {
            groups.set(key, Array.from(vehicles));
        });
        
        return groups;
    }

    /**
     * Detect temporal breakdown patterns
     */
    detectTemporalPatterns(breakdowns) {
        const timePatterns = {
            hourly: new Array(24).fill(0),
            daily: new Array(7).fill(0),
            monthly: new Array(12).fill(0),
            seasonal: { spring: 0, summer: 0, autumn: 0, winter: 0 }
        };
        
        breakdowns.forEach(breakdown => {
            const date = new Date(breakdown.reportedDate);
            const hour = date.getHours();
            const day = date.getDay();
            const month = date.getMonth();
            const season = this.getSeason(month);
            
            timePatterns.hourly[hour]++;
            timePatterns.daily[day]++;
            timePatterns.monthly[month]++;
            timePatterns.seasonal[season]++;
        });
        
        // Calculate pattern strength
        const peakHour = Math.max(...timePatterns.hourly);
        const peakDay = Math.max(...timePatterns.daily);
        const avgHour = timePatterns.hourly.reduce((a, b) => a + b, 0) / 24;
        const avgDay = timePatterns.daily.reduce((a, b) => a + b, 0) / 7;
        
        const hourlyVariance = peakHour / avgHour;
        const dailyVariance = peakDay / avgDay;
        
        return {
            patterns: timePatterns,
            variance: { hourly: hourlyVariance, daily: dailyVariance },
            confidence: Math.min((hourlyVariance + dailyVariance) / 4, 1.0),
            dominantHour: timePatterns.hourly.indexOf(peakHour),
            dominantDay: timePatterns.daily.indexOf(peakDay)
        };
    }

    /**
     * Detect component failure patterns
     */
    detectComponentPatterns(breakdowns) {
        const componentFreq = {};
        const componentCombinations = {};
        
        breakdowns.forEach(breakdown => {
            const component = breakdown.breakdownCategory;
            componentFreq[component] = (componentFreq[component] || 0) + 1;
            
            // Track co-occurring failures within 7 days
            const relatedBreakdowns = breakdowns.filter(b => 
                b.fleetNumber === breakdown.fleetNumber &&
                Math.abs(differenceInDays(new Date(b.reportedDate), new Date(breakdown.reportedDate))) <= 7 &&
                b.breakdownCategory !== breakdown.breakdownCategory
            );
            
            relatedBreakdowns.forEach(related => {
                const combo = [component, related.breakdownCategory].sort().join('-');
                componentCombinations[combo] = (componentCombinations[combo] || 0) + 1;
            });
        });
        
        // Find dominant patterns
        const totalBreakdowns = breakdowns.length;
        const dominantComponent = Object.entries(componentFreq)
            .sort(([,a], [,b]) => b - a)[0];
        
        const dominantCombination = Object.entries(componentCombinations)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            componentFrequency: componentFreq,
            combinations: componentCombinations,
            dominantComponent: dominantComponent ? {
                component: dominantComponent[0],
                frequency: dominantComponent[1],
                percentage: (dominantComponent[1] / totalBreakdowns) * 100
            } : null,
            dominantCombination: dominantCombination ? {
                combination: dominantCombination[0],
                frequency: dominantCombination[1]
            } : null,
            confidence: dominantComponent ? Math.min(dominantComponent[1] / 5, 1.0) : 0
        };
    }

    /**
     * Predict future breakdowns based on patterns
     */
    async predictBreakdowns(vehicleData, historicalBreakdowns) {
        const predictions = [];
        
        for (const vehicle of vehicleData) {
            const vehicleHistory = historicalBreakdowns.filter(b => 
                b.fleetNumber === vehicle.fleetNumber
            );
            
            if (vehicleHistory.length >= 2) {
                const prediction = await this.predictVehicleBreakdowns(vehicle, vehicleHistory);
                predictions.push(prediction);
            }
        }
        
        this.predictions.set('current', predictions);
        return predictions.sort((a, b) => b.riskScore - a.riskScore);
    }

    /**
     * Predict breakdowns for a specific vehicle
     */
    async predictVehicleBreakdowns(vehicle, history) {
        const recentBreakdowns = history.filter(h => 
            differenceInDays(new Date(), new Date(h.reportedDate)) <= 90
        );
        
        // Calculate breakdown frequency
        const avgDaysBetweenBreakdowns = this.calculateAverageDaysBetween(history);
        const lastBreakdown = new Date(Math.max(...history.map(h => new Date(h.reportedDate))));
        const daysSinceLastBreakdown = differenceInDays(new Date(), lastBreakdown);
        
        // Risk factors
        const ageRisk = this.calculateAgeRisk(vehicle);
        const frequencyRisk = this.calculateFrequencyRisk(recentBreakdowns);
        const patternRisk = this.calculatePatternRisk(vehicle, history);
        const maintenanceRisk = this.calculateMaintenanceRisk(vehicle);
        
        // Combined risk score (0-100)
        const riskScore = Math.min((
            ageRisk * 0.2 +
            frequencyRisk * 0.3 +
            patternRisk * 0.3 +
            maintenanceRisk * 0.2
        ) * 100, 100);
        
        // Predict next breakdown date
        const daysUntilNextBreakdown = Math.max(
            avgDaysBetweenBreakdowns - daysSinceLastBreakdown,
            1
        );
        
        const predictedDate = addDays(new Date(), daysUntilNextBreakdown);
        
        // Predict likely failure types
        const likelyFailures = this.predictFailureTypes(history);
        
        return {
            fleetNumber: vehicle.fleetNumber,
            depot: vehicle.depot,
            riskScore,
            riskLevel: this.getRiskLevel(riskScore),
            predictedDate,
            confidence: this.calculateConfidence(history, riskScore),
            likelyFailures,
            recommendedActions: this.generateVehicleRecommendations(riskScore, likelyFailures),
            costEstimate: this.estimateBreakdownCost(riskScore, likelyFailures)
        };
    }

    /**
     * Calculate fleet reliability scores
     */
    calculateFleetReliabilityScores(vehicleData, breakdownData) {
        const scores = new Map();
        
        vehicleData.forEach(vehicle => {
            const vehicleBreakdowns = breakdownData.filter(b => 
                b.fleetNumber === vehicle.fleetNumber
            );
            
            const baseScore = this.config.reliability.baselineReliability;
            
            // Age factor
            const agePenalty = this.getVehicleAge(vehicle) * this.config.reliability.degradationFactors.age;
            
            // Breakdown frequency factor
            const recentBreakdowns = vehicleBreakdowns.filter(b => 
                differenceInDays(new Date(), new Date(b.reportedDate)) <= 365
            );
            const frequencyPenalty = recentBreakdowns.length * this.config.reliability.degradationFactors.breakdownFrequency;
            
            // Maintenance history factor (simulated)
            const maintenancePenalty = Math.random() * this.config.reliability.degradationFactors.maintenanceHistory;
            
            const finalScore = Math.max(baseScore - agePenalty - frequencyPenalty - maintenancePenalty, 0);
            
            scores.set(vehicle.fleetNumber, {
                score: Math.round(finalScore * 10) / 10,
                factors: {
                    age: agePenalty,
                    frequency: frequencyPenalty,
                    maintenance: maintenancePenalty
                },
                grade: this.getReliabilityGrade(finalScore)
            });
        });
        
        this.reliabilityScores = scores;
        return scores;
    }

    /**
     * Optimize maintenance scheduling based on predictions
     */
    optimizeMaintenanceSchedule(predictions, capacity) {
        const schedule = new Map();
        const dailyCapacity = capacity.dailySlots || 10;
        
        // Sort by risk score and urgency
        const sortedPredictions = predictions
            .filter(p => p.riskScore > 50)
            .sort((a, b) => {
                const urgencyA = differenceInDays(a.predictedDate, new Date());
                const urgencyB = differenceInDays(b.predictedDate, new Date());
                return (b.riskScore - a.riskScore) + (urgencyA - urgencyB) * 0.1;
            });
        
        let currentDate = new Date();
        let currentSlots = 0;
        
        sortedPredictions.forEach(prediction => {
            if (currentSlots >= dailyCapacity) {
                currentDate = addDays(currentDate, 1);
                currentSlots = 0;
            }
            
            const scheduledDate = new Date(Math.max(currentDate, subDays(prediction.predictedDate, 7)));
            
            schedule.set(prediction.fleetNumber, {
                scheduledDate,
                priority: this.getMaintenancePriority(prediction.riskScore),
                estimatedDuration: this.estimateMaintenanceDuration(prediction.likelyFailures),
                costBudget: prediction.costEstimate * 0.3, // Preventive vs reactive cost
                recommendations: prediction.recommendedActions
            });
            
            currentSlots++;
        });
        
        this.maintenanceSchedule = schedule;
        return schedule;
    }

    /**
     * Generate cost impact projections
     */
    generateCostProjections(predictions, historicalCosts) {
        const projections = {
            nextMonth: 0,
            nextQuarter: 0,
            nextYear: 0,
            potentialSavings: 0
        };
        
        predictions.forEach(prediction => {
            const daysUntilBreakdown = differenceInDays(prediction.predictedDate, new Date());
            const cost = prediction.costEstimate;
            
            if (daysUntilBreakdown <= 30) {
                projections.nextMonth += cost;
            }
            if (daysUntilBreakdown <= 90) {
                projections.nextQuarter += cost;
            }
            if (daysUntilBreakdown <= 365) {
                projections.nextYear += cost;
            }
            
            // Calculate potential savings from preventive maintenance
            if (prediction.riskScore > 70) {
                projections.potentialSavings += cost * 0.6; // 60% savings from prevention
            }
        });
        
        this.costProjections = projections;
        return projections;
    }

    // Utility methods
    getVehicleDetails(fleetNumber) {
        // Mock vehicle details - replace with actual fleet database lookup
        return {
            manufacturer: 'Wright',
            model: 'StreetDeck',
            year: 2019 + Math.floor(Math.random() * 5)
        };
    }

    getYearRange(year) {
        return `${Math.floor(year / 5) * 5}-${Math.floor(year / 5) * 5 + 4}`;
    }

    getSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    calculateRiskLevel(pattern) {
        if (pattern.confidence > 0.8) return 'critical';
        if (pattern.confidence > 0.6) return 'high';
        if (pattern.confidence > 0.4) return 'medium';
        return 'low';
    }

    getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    getReliabilityGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 75) return 'C+';
        if (score >= 70) return 'C';
        if (score >= 65) return 'D+';
        if (score >= 60) return 'D';
        return 'F';
    }

    calculateAverageDaysBetween(history) {
        if (history.length < 2) return 60; // Default assumption
        
        const dates = history.map(h => new Date(h.reportedDate)).sort();
        const intervals = [];
        
        for (let i = 1; i < dates.length; i++) {
            intervals.push(differenceInDays(dates[i], dates[i-1]));
        }
        
        return intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    calculateAgeRisk(vehicle) {
        const age = this.getVehicleAge(vehicle);
        return Math.min(age / 15, 1.0); // Max risk at 15 years
    }

    calculateFrequencyRisk(recentBreakdowns) {
        return Math.min(recentBreakdowns.length / 10, 1.0); // Max risk at 10 breakdowns in 90 days
    }

    calculatePatternRisk(vehicle, history) {
        // Check if vehicle matches any high-risk patterns
        const patterns = this.patterns.get('current') || [];
        const matchingPatterns = patterns.filter(p => 
            p.riskLevel === 'high' || p.riskLevel === 'critical'
        );
        
        return matchingPatterns.length > 0 ? 0.8 : 0.2;
    }

    calculateMaintenanceRisk(vehicle) {
        // Simulated maintenance risk based on overdue maintenance
        return Math.random() * 0.5; // Random for demo purposes
    }

    calculateConfidence(history, riskScore) {
        const dataPoints = history.length;
        const dataConfidence = Math.min(dataPoints / 10, 1.0);
        const riskConfidence = riskScore / 100;
        
        return (dataConfidence + riskConfidence) / 2;
    }

    predictFailureTypes(history) {
        const failureFreq = {};
        history.forEach(h => {
            failureFreq[h.breakdownCategory] = (failureFreq[h.breakdownCategory] || 0) + 1;
        });
        
        return Object.entries(failureFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type, freq]) => ({
                type,
                probability: Math.min(freq / history.length, 0.8)
            }));
    }

    generateVehicleRecommendations(riskScore, likelyFailures) {
        const recommendations = [];
        
        if (riskScore > 80) {
            recommendations.push('Immediate inspection required');
            recommendations.push('Schedule for depot maintenance within 7 days');
        } else if (riskScore > 60) {
            recommendations.push('Schedule preventive maintenance within 14 days');
        } else if (riskScore > 40) {
            recommendations.push('Monitor closely for symptoms');
        }
        
        likelyFailures.forEach(failure => {
            if (failure.probability > 0.5) {
                recommendations.push(`Focus on ${failure.type.toLowerCase()} system during next maintenance`);
            }
        });
        
        return recommendations;
    }

    generateRecommendations(pattern) {
        const recommendations = [];
        
        if (pattern.type === 'temporal') {
            recommendations.push('Adjust maintenance schedules based on peak failure times');
            recommendations.push('Increase monitoring during high-risk periods');
        } else if (pattern.type === 'component') {
            recommendations.push('Implement targeted component inspection program');
            recommendations.push('Review supplier quality for affected components');
        }
        
        return recommendations;
    }

    estimateBreakdownCost(riskScore, likelyFailures) {
        const baseCost = 2500; // Average breakdown cost
        const riskMultiplier = 1 + (riskScore / 100);
        
        let failureMultiplier = 1;
        likelyFailures.forEach(failure => {
            if (failure.type.includes('Engine') || failure.type.includes('Gearbox')) {
                failureMultiplier *= 1.5;
            }
        });
        
        return Math.round(baseCost * riskMultiplier * failureMultiplier);
    }

    getVehicleAge(vehicle) {
        return new Date().getFullYear() - vehicle.year;
    }

    getMaintenancePriority(riskScore) {
        if (riskScore > 80) return 'urgent';
        if (riskScore > 60) return 'high';
        if (riskScore > 40) return 'medium';
        return 'low';
    }

    estimateMaintenanceDuration(likelyFailures) {
        let hours = 4; // Base maintenance time
        
        likelyFailures.forEach(failure => {
            if (failure.type.includes('Engine')) hours += 6;
            if (failure.type.includes('Gearbox')) hours += 8;
            if (failure.type.includes('Electrical')) hours += 3;
        });
        
        return hours;
    }
}

// Export for use in other modules
export default PredictiveAnalyticsEngine;