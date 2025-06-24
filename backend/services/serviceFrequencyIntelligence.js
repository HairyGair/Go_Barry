// backend/services/serviceFrequencyIntelligence.js
// Advanced service frequency impact analysis and optimization recommendations

import { createClient } from '@supabase/supabase-js';
import serviceFrequencyAnalyzer from './serviceFrequencyAnalyzer.js';
import intelligentAnalytics from './intelligentAnalytics.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Service Frequency Intelligence System
 * Analyzes how disruptions affect service frequencies and recommends optimizations
 */
class ServiceFrequencyIntelligence {
  constructor() {
    this.frequencyBaselines = new Map();
    this.disruptionImpacts = new Map();
    this.optimizationCache = new Map();
    this.lastAnalysisUpdate = null;
  }

  /**
   * Comprehensive service frequency impact assessment
   */
  async assessFrequencyImpact(options = {}) {
    try {
      console.log('📊 Starting service frequency impact assessment...');

      const {
        includeOptimizations = true,
        timeHorizon = '24h',
        routes = 'all'
      } = options;

      const assessment = {
        timestamp: new Date().toISOString(),
        timeHorizon,
        overallImpact: {},
        routeAnalysis: [],
        frequencyOptimizations: [],
        capacityRecommendations: [],
        passengerImpactAnalysis: {},
        performanceMetrics: {}
      };

      // Get current route impacts
      const routeImpacts = await intelligentAnalytics.analyzeRouteImpact();
      if (!routeImpacts.success) {
        throw new Error('Failed to get route impact data');
      }

      // Get baseline frequency data
      const baselineFrequencies = await this.getBaselineFrequencies();

      // Analyze each affected route
      for (const impact of routeImpacts.analysis.routeImpacts) {
        for (const routeImpact of impact.affectedRoutes) {
          const routeAnalysis = await this.analyzeRouteFrequencyImpact(
            routeImpact.routeId,
            impact,
            baselineFrequencies
          );
          assessment.routeAnalysis.push(routeAnalysis);
        }
      }

      // Calculate overall impact metrics
      assessment.overallImpact = this.calculateOverallImpact(assessment.routeAnalysis);

      // Generate frequency optimization recommendations
      if (includeOptimizations) {
        assessment.frequencyOptimizations = await this.generateFrequencyOptimizations(
          assessment.routeAnalysis
        );
      }

      // Generate capacity recommendations
      assessment.capacityRecommendations = this.generateCapacityRecommendations(
        assessment.routeAnalysis
      );

      // Analyze passenger impact
      assessment.passengerImpactAnalysis = this.analyzePassengerImpact(
        assessment.routeAnalysis
      );

      // Calculate performance metrics
      assessment.performanceMetrics = this.calculatePerformanceMetrics(
        assessment.routeAnalysis
      );

      console.log(`✅ Frequency assessment complete: ${assessment.routeAnalysis.length} routes analyzed`);

      return {
        success: true,
        assessment
      };

    } catch (error) {
      console.error('❌ Service frequency assessment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze frequency impact for a specific route
   */
  async analyzeRouteFrequencyImpact(routeId, disruption, baselineFrequencies) {
    const baseline = baselineFrequencies.get(routeId) || await this.getRouteBaseline(routeId);
    
    const analysis = {
      routeId,
      routeName: this.getRouteDisplayName(routeId),
      disruptionId: disruption.roadworkId,
      disruptionLocation: disruption.location,
      baseline: {
        normalFrequency: baseline.frequency,
        peakFrequency: baseline.peakFrequency,
        offPeakFrequency: baseline.offPeakFrequency,
        averageJourneyTime: baseline.averageJourneyTime,
        reliability: baseline.reliability
      },
      impactedMetrics: {},
      recommendations: [],
      optimizationPotential: {},
      passengerImpact: {},
      operationalImpact: {}
    };

    // Calculate frequency impact
    analysis.impactedMetrics = await this.calculateFrequencyImpact(routeId, disruption, baseline);

    // Generate route-specific recommendations
    analysis.recommendations = this.generateRouteRecommendations(analysis);

    // Calculate optimization potential
    analysis.optimizationPotential = this.calculateOptimizationPotential(analysis);

    // Assess passenger impact
    analysis.passengerImpact = this.assessRoutePassengerImpact(analysis);

    // Assess operational impact
    analysis.operationalImpact = this.assessOperationalImpact(analysis);

    return analysis;
  }

  /**
   * Calculate frequency impact metrics
   */
  async calculateFrequencyImpact(routeId, disruption, baseline) {
    const impactFactor = this.calculateDisruptionImpactFactor(disruption);
    const delayFactor = disruption.estimatedDelay / baseline.averageJourneyTime;

    return {
      frequencyReduction: Math.round(baseline.frequency * impactFactor * 100) / 100,
      journeyTimeIncrease: disruption.estimatedDelay,
      reliabilityDrop: Math.round(baseline.reliability * impactFactor * 100),
      capacityLoss: Math.round(baseline.frequency * impactFactor * 40), // passengers per hour
      serviceLevel: this.calculateServiceLevel(baseline.frequency, impactFactor),
      punctualityImpact: Math.round(delayFactor * 100),
      operationalEfficiency: Math.round((1 - impactFactor) * 100)
    };
  }

  /**
   * Generate frequency optimization recommendations
   */
  async generateFrequencyOptimizations(routeAnalyses) {
    const optimizations = [];

    // Group routes by impact severity
    const highImpact = routeAnalyses.filter(r => r.impactedMetrics.frequencyReduction > 0.5);
    const mediumImpact = routeAnalyses.filter(r => 
      r.impactedMetrics.frequencyReduction > 0.2 && r.impactedMetrics.frequencyReduction <= 0.5
    );

    // High-impact route optimizations
    if (highImpact.length > 0) {
      optimizations.push({
        priority: 'URGENT',
        type: 'frequency_restoration',
        title: 'Critical Frequency Restoration Required',
        affectedRoutes: highImpact.map(r => r.routeId),
        description: `${highImpact.length} routes experiencing severe frequency impacts`,
        actions: [
          'Deploy additional vehicles to maintain baseline frequency',
          'Implement express services during peak periods',
          'Consider temporary route adjustments to bypass disruptions',
          'Activate dynamic scheduling protocols'
        ],
        expectedBenefit: {
          frequencyRestoration: '80-95%',
          passengerSatisfaction: '+40%',
          operationalEfficiency: '+25%'
        },
        implementationTime: '2-4 hours',
        resourceRequirement: 'High',
        cost: 'Medium-High'
      });
    }

    // Medium-impact optimizations
    if (mediumImpact.length > 0) {
      optimizations.push({
        priority: 'HIGH',
        type: 'efficiency_optimization',
        title: 'Service Efficiency Optimization',
        affectedRoutes: mediumImpact.map(r => r.routeId),
        description: 'Optimize service patterns to minimize disruption impact',
        actions: [
          'Adjust timetables to account for increased journey times',
          'Implement intelligent traffic signal priority',
          'Optimize boarding processes at key stops',
          'Deploy real-time passenger information updates'
        ],
        expectedBenefit: {
          efficiencyImprovement: '15-25%',
          reliabilityIncrease: '+20%',
          passengerWaitTime: '-30%'
        },
        implementationTime: '1-2 hours',
        resourceRequirement: 'Medium',
        cost: 'Low-Medium'
      });
    }

    // Network-wide optimizations
    if (routeAnalyses.length > 5) {
      optimizations.push({
        priority: 'MEDIUM',
        type: 'network_rebalancing',
        title: 'Network-Wide Service Rebalancing',
        affectedRoutes: routeAnalyses.map(r => r.routeId),
        description: 'Optimize entire network to maintain overall service levels',
        actions: [
          'Redistribute vehicles across network based on disruption impact',
          'Implement temporary express services on alternative routes',
          'Coordinate service adjustments across affected corridors',
          'Activate passenger guidance and information systems'
        ],
        expectedBenefit: {
          networkEfficiency: '+20%',
          overallCapacity: '+15%',
          passengerRedistribution: 'Optimized'
        },
        implementationTime: '3-6 hours',
        resourceRequirement: 'High',
        cost: 'Medium'
      });
    }

    return optimizations.sort((a, b) => {
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate capacity recommendations
   */
  generateCapacityRecommendations(routeAnalyses) {
    const recommendations = [];

    // Calculate total capacity loss
    const totalCapacityLoss = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.capacityLoss || 0), 0
    );

    if (totalCapacityLoss > 200) { // More than 200 passengers/hour impact
      recommendations.push({
        type: 'emergency_capacity',
        priority: 'URGENT',
        title: 'Emergency Capacity Deployment Required',
        description: `${totalCapacityLoss} passengers/hour capacity loss detected`,
        actions: [
          'Deploy reserve vehicles immediately',
          'Activate all available drivers',
          'Consider larger vehicle deployment',
          'Implement passenger load management'
        ],
        metrics: {
          capacityDeficit: totalCapacityLoss,
          vehiclesNeeded: Math.ceil(totalCapacityLoss / 40),
          estimatedCost: Math.round(totalCapacityLoss * 0.5) // £0.50 per passenger impact
        }
      });
    }

    // Route-specific capacity recommendations
    const highCapacityImpact = routeAnalyses.filter(r => r.impactedMetrics.capacityLoss > 80);
    for (const route of highCapacityImpact) {
      recommendations.push({
        type: 'route_capacity',
        priority: 'HIGH',
        routeId: route.routeId,
        title: `${route.routeName} Capacity Restoration`,
        description: `Route experiencing ${route.impactedMetrics.capacityLoss} passengers/hour loss`,
        actions: [
          'Increase vehicle capacity on this route',
          'Reduce headways during peak periods',
          'Consider articulated bus deployment',
          'Implement boarding efficiency measures'
        ],
        metrics: {
          routeCapacityLoss: route.impactedMetrics.capacityLoss,
          recommendedIncrease: Math.ceil(route.impactedMetrics.capacityLoss / 40),
          priorityLevel: route.impactedMetrics.serviceLevel
        }
      });
    }

    return recommendations;
  }

  /**
   * Analyze passenger impact across all routes
   */
  analyzePassengerImpact(routeAnalyses) {
    const totalRoutes = routeAnalyses.length;
    const totalCapacityLoss = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.capacityLoss || 0), 0
    );
    const averageDelayIncrease = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.journeyTimeIncrease || 0), 0
    ) / totalRoutes;

    return {
      summary: {
        totalAffectedRoutes: totalRoutes,
        totalCapacityLoss: totalCapacityLoss,
        averageDelayIncrease: Math.round(averageDelayIncrease),
        estimatedAffectedPassengers: totalCapacityLoss * 8, // 8-hour impact estimate
        severityLevel: this.calculatePassengerImpactSeverity(totalCapacityLoss)
      },
      demographics: {
        peakHourImpact: Math.round(totalCapacityLoss * 1.5),
        offPeakImpact: Math.round(totalCapacityLoss * 0.7),
        weekendImpact: Math.round(totalCapacityLoss * 0.5),
        vulnerablePassengers: Math.round(totalCapacityLoss * 0.3) // Elderly, disabled, etc.
      },
      alternativeOptions: {
        availableAlternatives: this.identifyAlternativeOptions(routeAnalyses),
        capacityOfAlternatives: this.calculateAlternativeCapacity(routeAnalyses),
        additionalWalkingRequired: this.calculateAdditionalWalking(routeAnalyses)
      },
      mitigationEffectiveness: {
        informationProvision: 0.2, // 20% impact reduction
        alternativeRouting: 0.4, // 40% impact reduction
        increasedFrequency: 0.7, // 70% impact reduction
        temporaryServices: 0.6 // 60% impact reduction
      }
    };
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(routeAnalyses) {
    const metrics = {
      networkReliability: 0,
      serviceEfficiency: 0,
      passengerSatisfaction: 0,
      operationalCost: 0,
      environmentalImpact: 0,
      overallScore: 0
    };

    // Calculate network reliability (percentage of routes maintaining >80% service level)
    const reliableRoutes = routeAnalyses.filter(r => r.impactedMetrics.operationalEfficiency > 80);
    metrics.networkReliability = Math.round((reliableRoutes.length / routeAnalyses.length) * 100);

    // Calculate service efficiency
    const avgEfficiency = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.operationalEfficiency || 0), 0
    ) / routeAnalyses.length;
    metrics.serviceEfficiency = Math.round(avgEfficiency);

    // Estimate passenger satisfaction (inverse correlation with delays)
    const avgDelay = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.journeyTimeIncrease || 0), 0
    ) / routeAnalyses.length;
    metrics.passengerSatisfaction = Math.max(0, Math.round(100 - (avgDelay * 5))); // 5% reduction per minute delay

    // Calculate operational cost impact
    const totalCapacityLoss = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.capacityLoss || 0), 0
    );
    metrics.operationalCost = Math.round(totalCapacityLoss * 0.75); // £0.75 per passenger-hour lost

    // Environmental impact (increased journey times = more emissions)
    metrics.environmentalImpact = Math.round(avgDelay * routeAnalyses.length * 2.5); // CO2 kg estimate

    // Calculate overall score
    metrics.overallScore = Math.round(
      (metrics.networkReliability * 0.3 + 
       metrics.serviceEfficiency * 0.3 + 
       metrics.passengerSatisfaction * 0.4)
    );

    return metrics;
  }

  /**
   * Helper functions
   */
  async getBaselineFrequencies() {
    // Get baseline data from service frequency analyzer
    try {
      const data = await serviceFrequencyAnalyzer.analyzeAllRoutes();
      const baselines = new Map();
      
      if (data.success && data.analysis) {
        for (const route of data.analysis.routes) {
          baselines.set(route.routeId, {
            frequency: route.frequency || 4,
            peakFrequency: route.peakFrequency || 6,
            offPeakFrequency: route.offPeakFrequency || 3,
            averageJourneyTime: route.averageJourneyTime || 30,
            reliability: route.reliability || 0.85
          });
        }
      }
      
      return baselines;
    } catch (error) {
      console.warn('⚠️ Failed to get baseline frequencies:', error.message);
      return new Map();
    }
  }

  async getRouteBaseline(routeId) {
    // Default baseline values if no data available
    return {
      frequency: 4,
      peakFrequency: 6,
      offPeakFrequency: 3,
      averageJourneyTime: 30,
      reliability: 0.85
    };
  }

  getRouteDisplayName(routeId) {
    const names = {
      'Q3': 'Quayside - Q3',
      'Q3X': 'Quayside Express - Q3X', 
      '10': 'Hexham - 10',
      '21': 'Durham - 21',
      '22': 'Sunderland - 22'
    };
    return names[routeId] || `Route ${routeId}`;
  }

  calculateDisruptionImpactFactor(disruption) {
    // Calculate impact factor based on disruption severity and type
    const severityFactors = {
      'CRITICAL': 0.4,  // 40% impact
      'HIGH': 0.25,     // 25% impact
      'MEDIUM': 0.15,   // 15% impact
      'LOW': 0.05       // 5% impact
    };

    const typeFactors = {
      'emergency_closure': 1.5,
      'utilities_work': 1.2,
      'general_roadwork': 1.0,
      'gas_work': 1.3,
      'electrical_work': 1.1
    };

    const baseFactor = severityFactors[disruption.severityLevel] || 0.1;
    const typeFactor = typeFactors[disruption.impactType] || 1.0;

    return Math.min(baseFactor * typeFactor, 0.6); // Cap at 60% impact
  }

  calculateServiceLevel(baselineFrequency, impactFactor) {
    const newFrequency = baselineFrequency * (1 - impactFactor);
    
    if (newFrequency >= 6) return 'EXCELLENT';
    if (newFrequency >= 4) return 'GOOD';
    if (newFrequency >= 2) return 'ADEQUATE';
    return 'POOR';
  }

  calculateOverallImpact(routeAnalyses) {
    const totalRoutes = routeAnalyses.length;
    if (totalRoutes === 0) {
      return { severity: 'NONE', description: 'No route impacts detected' };
    }

    const criticalRoutes = routeAnalyses.filter(r => r.impactedMetrics.serviceLevel === 'POOR').length;
    const averageCapacityLoss = routeAnalyses.reduce(
      (sum, route) => sum + (route.impactedMetrics.capacityLoss || 0), 0
    ) / totalRoutes;

    let severity, description;
    
    if (criticalRoutes > totalRoutes * 0.5 || averageCapacityLoss > 100) {
      severity = 'CRITICAL';
      description = 'Network-wide service disruption requiring immediate intervention';
    } else if (criticalRoutes > totalRoutes * 0.3 || averageCapacityLoss > 60) {
      severity = 'HIGH';
      description = 'Significant service impacts requiring active management';
    } else if (criticalRoutes > 0 || averageCapacityLoss > 30) {
      severity = 'MEDIUM';
      description = 'Moderate service impacts with manageable effects';
    } else {
      severity = 'LOW';
      description = 'Minor service impacts with minimal passenger effect';
    }

    return {
      severity,
      description,
      affectedRoutes: totalRoutes,
      criticalRoutes,
      averageCapacityLoss: Math.round(averageCapacityLoss),
      networkEfficiency: Math.round(100 - (averageCapacityLoss / 2)) // Rough estimate
    };
  }

  generateRouteRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.impactedMetrics.serviceLevel === 'POOR') {
      recommendations.push('Deploy additional vehicles immediately');
      recommendations.push('Consider temporary route modifications');
    }
    
    if (analysis.impactedMetrics.reliabilityDrop > 30) {
      recommendations.push('Implement real-time passenger communications');
      recommendations.push('Increase supervisor monitoring frequency');
    }
    
    if (analysis.impactedMetrics.capacityLoss > 80) {
      recommendations.push('Activate passenger load management');
      recommendations.push('Consider express service deployment');
    }

    return recommendations;
  }

  calculateOptimizationPotential(analysis) {
    return {
      frequencyRestoration: Math.round(analysis.impactedMetrics.frequencyReduction * 0.8 * 100),
      capacityRecovery: Math.round(analysis.impactedMetrics.capacityLoss * 0.7),
      reliabilityImprovement: Math.round(analysis.impactedMetrics.reliabilityDrop * 0.6),
      implementationDifficulty: this.assessImplementationDifficulty(analysis)
    };
  }

  assessRoutePassengerImpact(analysis) {
    return {
      peakHourImpact: Math.round(analysis.impactedMetrics.capacityLoss * 1.5),
      offPeakImpact: Math.round(analysis.impactedMetrics.capacityLoss * 0.7),
      dailyImpact: Math.round(analysis.impactedMetrics.capacityLoss * 12),
      weeklyImpact: Math.round(analysis.impactedMetrics.capacityLoss * 84)
    };
  }

  assessOperationalImpact(analysis) {
    return {
      additionalCost: Math.round(analysis.impactedMetrics.capacityLoss * 0.5),
      resourceRequirement: this.assessResourceRequirement(analysis),
      complexityLevel: this.assessComplexityLevel(analysis),
      timeToRestore: this.estimateRestorationTime(analysis)
    };
  }

  calculatePassengerImpactSeverity(totalCapacityLoss) {
    if (totalCapacityLoss > 300) return 'CRITICAL';
    if (totalCapacityLoss > 150) return 'HIGH';
    if (totalCapacityLoss > 50) return 'MEDIUM';
    return 'LOW';
  }

  identifyAlternativeOptions(routeAnalyses) {
    // Simplified alternative identification
    return Math.max(0, 5 - routeAnalyses.length);
  }

  calculateAlternativeCapacity(routeAnalyses) {
    return Math.round(routeAnalyses.length * 120); // Rough estimate
  }

  calculateAdditionalWalking(routeAnalyses) {
    return Math.round(routeAnalyses.length * 0.3); // km estimate
  }

  assessImplementationDifficulty(analysis) {
    if (analysis.impactedMetrics.serviceLevel === 'POOR') return 'HIGH';
    if (analysis.impactedMetrics.capacityLoss > 60) return 'MEDIUM';
    return 'LOW';
  }

  assessResourceRequirement(analysis) {
    if (analysis.impactedMetrics.capacityLoss > 100) return 'HIGH';
    if (analysis.impactedMetrics.capacityLoss > 50) return 'MEDIUM';
    return 'LOW';
  }

  assessComplexityLevel(analysis) {
    if (analysis.impactedMetrics.frequencyReduction > 0.4) return 'HIGH';
    if (analysis.impactedMetrics.frequencyReduction > 0.2) return 'MEDIUM';
    return 'LOW';
  }

  estimateRestorationTime(analysis) {
    if (analysis.impactedMetrics.serviceLevel === 'POOR') return '4-8 hours';
    if (analysis.impactedMetrics.serviceLevel === 'ADEQUATE') return '2-4 hours';
    return '1-2 hours';
  }
}

export default new ServiceFrequencyIntelligence();