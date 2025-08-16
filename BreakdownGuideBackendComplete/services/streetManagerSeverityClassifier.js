// StreetManager Severity Classification Engine
// Advanced classification system for Go North East bus route impact assessment
// Memory-optimized with intelligent caching for 2GB RAM constraint

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Advanced Severity Classification Engine
 * Analyzes StreetManager alerts to determine impact severity and notification requirements
 */
class StreetManagerSeverityClassifier {
  constructor() {
    this.classificationRules = new Map();
    this.trafficSensitiveStreets = new Set();
    this.majorRouteCorridors = new Set();
    this.classificationCache = new Map();
    this.cacheMaxSize = 200;
    this.initialized = false;
    
    // Classification weights for multi-factor analysis
    this.weights = {
      work_category: 0.3,
      traffic_management: 0.25,
      location_importance: 0.2,
      timing_sensitivity: 0.15,
      emergency_status: 0.1
    };
  }

  /**
   * Initialize the classifier with rules and reference data
   */
  async initialize() {
    try {
      console.log('📊 Initializing StreetManager Severity Classifier...');
      
      // Load classification rules from database
      await this.loadClassificationRules();
      
      // Load traffic-sensitive streets and major corridors
      await this.loadReferenceData();
      
      this.initialized = true;
      console.log(`✅ Severity Classifier ready: ${this.classificationRules.size} rules loaded`);
      
      return true;
    } catch (error) {
      console.error('❌ Severity Classifier initialization failed:', error.message);
      this.loadDefaultRules(); // Fallback to default rules
      this.initialized = true;
      return false;
    }
  }

  /**
   * Load classification rules from database
   */
  async loadClassificationRules() {
    try {
      const { data: rules, error } = await supabase
        .from('severity_classification_rules')
        .select('*')
        .eq('active', true)
        .order('priority');
      
      if (error) throw error;
      
      rules.forEach(rule => {
        this.classificationRules.set(rule.rule_name, {
          ...rule,
          conditions: typeof rule.conditions === 'string' 
            ? JSON.parse(rule.conditions) 
            : rule.conditions
        });
      });
      
      console.log(`📋 Loaded ${this.classificationRules.size} classification rules from database`);
    } catch (error) {
      console.warn('⚠️ Could not load rules from database:', error.message);
      throw error;
    }
  }

  /**
   * Load reference data for enhanced classification
   */
  async loadReferenceData() {
    // Traffic-sensitive streets in North East England
    const trafficSensitiveStreets = [
      'A1', 'A19', 'A183', 'A184', 'A167', 'A1231', 'A189', 'A69',
      'Grey Street', 'Northumberland Street', 'High Street West',
      'Central Motorway', 'Gateshead Highway', 'Felling Bypass',
      'Sunderland Bridge', 'Wear Bridge', 'Tyne Bridge',
      'Scotswood Road', 'West Road', 'Great North Road',
      'Durham Road', 'Chester Road', 'Shields Road'
    ];
    
    trafficSensitiveStreets.forEach(street => {
      this.trafficSensitiveStreets.add(street.toLowerCase());
    });
    
    // Major bus route corridors
    const majorCorridors = [
      'A167', 'A183', 'A184', 'Durham Road', 'Great North Road',
      'West Road', 'Scotswood Road', 'Chester Road', 'Shields Road',
      'High Street West', 'Northumberland Street', 'Grey Street',
      'Gateshead Highway', 'Felling Bypass', 'Washington Highway'
    ];
    
    majorCorridors.forEach(corridor => {
      this.majorRouteCorridors.add(corridor.toLowerCase());
    });
    
    console.log(`📍 Loaded ${this.trafficSensitiveStreets.size} traffic-sensitive streets and ${this.majorRouteCorridors.size} major corridors`);
  }

  /**
   * Load default classification rules as fallback
   */
  loadDefaultRules() {
    const defaultRules = [
      {
        rule_name: 'emergency_works_critical',
        conditions: { is_emergency_works: 'Yes' },
        base_severity: 'CRITICAL',
        impact_radius_meters: 1000,
        requires_notification: true,
        advance_notice_hours: 0,
        priority: 1
      },
      {
        rule_name: 'road_closure_critical',
        conditions: { traffic_management_type: 'road_closure' },
        base_severity: 'CRITICAL',
        impact_radius_meters: 800,
        requires_notification: true,
        advance_notice_hours: 24,
        priority: 2
      },
      {
        rule_name: 'major_works_in_progress',
        conditions: { work_category: 'major', work_status: 'in_progress' },
        base_severity: 'HIGH',
        impact_radius_meters: 600,
        requires_notification: true,
        advance_notice_hours: 12,
        priority: 3
      },
      {
        rule_name: 'multi_way_signals_high',
        conditions: { traffic_management_type: 'multi_way_signals' },
        base_severity: 'HIGH',
        impact_radius_meters: 400,
        requires_notification: true,
        advance_notice_hours: 6,
        priority: 4
      },
      {
        rule_name: 'lane_closure_major',
        conditions: { traffic_management_type: 'lane_closure', work_category: 'major' },
        base_severity: 'MEDIUM',
        impact_radius_meters: 300,
        requires_notification: true,
        advance_notice_hours: 8,
        priority: 5
      },
      {
        rule_name: 'traffic_sensitive_medium',
        conditions: { is_traffic_sensitive: 'Yes' },
        base_severity: 'MEDIUM',
        impact_radius_meters: 250,
        requires_notification: false,
        advance_notice_hours: 4,
        priority: 6
      },
      {
        rule_name: 'standard_works',
        conditions: { work_category: 'standard' },
        base_severity: 'LOW',
        impact_radius_meters: 150,
        requires_notification: false,
        advance_notice_hours: 2,
        priority: 7
      },
      {
        rule_name: 'minor_works',
        conditions: { work_category: 'minor' },
        base_severity: 'LOW',
        impact_radius_meters: 100,
        requires_notification: false,
        advance_notice_hours: 1,
        priority: 8
      }
    ];
    
    defaultRules.forEach(rule => {
      this.classificationRules.set(rule.rule_name, rule);
    });
    
    console.log('📋 Loaded default classification rules');
  }

  /**
   * Classify severity for a StreetManager alert using advanced multi-factor analysis
   */
  classifySeverity(streetworkData) {
    const classificationId = this.generateClassificationKey(streetworkData);
    
    // Check cache first
    if (this.classificationCache.has(classificationId)) {
      return this.classificationCache.get(classificationId);
    }

    try {
      // Multi-factor severity analysis
      const analysis = this.performMultiFactorAnalysis(streetworkData);
      
      // Apply classification rules
      const ruleBasedResult = this.applyClassificationRules(streetworkData);
      
      // Combine rule-based and analytical approaches
      const finalClassification = this.combineClassificationResults(analysis, ruleBasedResult, streetworkData);
      
      // Add contextual enhancements
      const enhancedClassification = this.enhanceWithContext(finalClassification, streetworkData);
      
      // Cache result
      if (this.classificationCache.size >= this.cacheMaxSize) {
        const oldestKey = this.classificationCache.keys().next().value;
        this.classificationCache.delete(oldestKey);
      }
      this.classificationCache.set(classificationId, enhancedClassification);
      
      console.log(`📊 Classified as ${enhancedClassification.severity} (confidence: ${enhancedClassification.confidence}%)`);
      
      return enhancedClassification;
      
    } catch (error) {
      console.error('❌ Severity classification failed:', error.message);
      return this.getDefaultClassification(streetworkData);
    }
  }

  /**
   * Perform multi-factor analysis considering various impact dimensions
   */
  performMultiFactorAnalysis(data) {
    const factors = {
      work_category: this.analyzeWorkCategory(data),
      traffic_management: this.analyzeTrafficManagement(data),
      location_importance: this.analyzeLocationImportance(data),
      timing_sensitivity: this.analyzeTimingSensitivity(data),
      emergency_status: this.analyzeEmergencyStatus(data)
    };
    
    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [factor, score] of Object.entries(factors)) {
      const weight = this.weights[factor] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: finalScore,
      factors: factors,
      severity: this.scoreToSeverity(finalScore)
    };
  }

  /**
   * Analyze work category impact (0-100 score)
   */
  analyzeWorkCategory(data) {
    const category = (data.work_category || '').toLowerCase();
    
    switch (category) {
      case 'immediate': return 100;
      case 'major': return 80;
      case 'standard': return 50;
      case 'minor': return 20;
      default: return 30;
    }
  }

  /**
   * Analyze traffic management impact (0-100 score)
   */
  analyzeTrafficManagement(data) {
    const management = (data.traffic_management_type || '').toLowerCase();
    
    switch (management) {
      case 'road_closure': return 100;
      case 'contra_flow': return 85;
      case 'multi_way_signals': return 70;
      case 'two_way_signals': return 60;
      case 'lane_closure': return 50;
      case 'priority_working': return 30;
      case 'no_carriageway_incursion': return 10;
      default: return 25;
    }
  }

  /**
   * Analyze location importance based on street names and areas
   */
  analyzeLocationImportance(data) {
    let score = 30; // Base score
    
    const location = (data.location_description || '').toLowerCase();
    const street = (data.street_name || '').toLowerCase();
    
    // Check for major corridors
    if (this.majorRouteCorridors.has(street) || 
        [...this.majorRouteCorridors].some(corridor => location.includes(corridor))) {
      score += 40;
    }
    
    // Check for traffic-sensitive streets
    if (this.trafficSensitiveStreets.has(street) || 
        [...this.trafficSensitiveStreets].some(sensitive => location.includes(sensitive))) {
      score += 30;
    }
    
    // Check for city centers
    const cityCenters = ['newcastle', 'gateshead', 'sunderland', 'durham'];
    if (cityCenters.some(city => location.includes(city))) {
      score += 20;
    }
    
    // Check for transport hubs
    const transportHubs = ['central station', 'metro', 'interchange', 'bus station'];
    if (transportHubs.some(hub => location.includes(hub))) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  /**
   * Analyze timing sensitivity
   */
  analyzeTimingSensitivity(data) {
    let score = 20; // Base score
    
    // Check if marked as traffic sensitive
    if (data.is_traffic_sensitive === 'Yes') {
      score += 30;
    }
    
    // Analyze proposed timing
    if (data.proposed_start_date) {
      const startDate = new Date(data.proposed_start_date);
      const dayOfWeek = startDate.getDay();
      const hour = startDate.getHours();
      
      // Weekday vs weekend
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        score += 20; // Weekdays are more sensitive
        
        // Peak hours (7-9 AM, 4-6 PM)
        if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
          score += 30;
        }
      }
    }
    
    // Check for school term time sensitivity
    if (data.location_description && data.location_description.toLowerCase().includes('school')) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  /**
   * Analyze emergency status
   */
  analyzeEmergencyStatus(data) {
    if (data.is_emergency_works === 'Yes') {
      return 100;
    }
    
    // Check for urgent indicators in description
    const urgentKeywords = ['emergency', 'urgent', 'immediate', 'safety', 'hazard', 'dangerous'];
    const description = (data.description || '').toLowerCase();
    
    if (urgentKeywords.some(keyword => description.includes(keyword))) {
      return 70;
    }
    
    return 10;
  }

  /**
   * Apply rule-based classification
   */
  applyClassificationRules(data) {
    // Apply rules in priority order
    for (const [ruleName, rule] of this.classificationRules) {
      if (this.matchesRuleConditions(data, rule.conditions)) {
        return {
          severity: rule.base_severity,
          impact_radius_meters: rule.impact_radius_meters,
          requires_notification: rule.requires_notification,
          advance_notice_hours: rule.advance_notice_hours,
          matched_rule: ruleName,
          rule_priority: rule.priority
        };
      }
    }
    
    // Default if no rules match
    return this.getDefaultRuleResult();
  }

  /**
   * Check if data matches rule conditions
   */
  matchesRuleConditions(data, conditions) {
    for (const [field, expectedValue] of Object.entries(conditions)) {
      if (data[field] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Combine analytical and rule-based results
   */
  combineClassificationResults(analysis, ruleResult, data) {
    // Rule-based takes precedence for specific conditions
    // Analytical fills in confidence and nuanced scoring
    
    const severity = ruleResult.severity || analysis.severity;
    const impactRadius = ruleResult.impact_radius_meters || this.calculateRadiusFromScore(analysis.score);
    
    return {
      severity: severity,
      impact_radius_meters: impactRadius,
      requires_notification: ruleResult.requires_notification || severity === 'CRITICAL' || severity === 'HIGH',
      advance_notice_hours: ruleResult.advance_notice_hours || this.calculateAdvanceNotice(severity),
      confidence: this.calculateConfidence(analysis, ruleResult),
      analysis_method: 'multi_factor_with_rules',
      matched_rule: ruleResult.matched_rule || 'analytical',
      factor_scores: analysis.factors,
      overall_score: Math.round(analysis.score)
    };
  }

  /**
   * Enhance classification with contextual information
   */
  enhanceWithContext(classification, data) {
    // Adjust for work status
    if (data.work_status === 'in_progress') {
      classification.severity = this.increaseSeverity(classification.severity);
      classification.requires_notification = true;
    }
    
    // Adjust for duration
    if (data.proposed_start_date && data.proposed_end_date) {
      const duration = new Date(data.proposed_end_date) - new Date(data.proposed_start_date);
      const durationDays = duration / (1000 * 60 * 60 * 24);
      
      if (durationDays > 7) {
        classification.impact_radius_meters *= 1.2;
        classification.requires_notification = true;
      }
    }
    
    // Add escalation indicators
    classification.escalation_triggers = this.identifyEscalationTriggers(data, classification);
    
    // Add notification priority
    classification.notification_priority = this.calculateNotificationPriority(classification);
    
    return classification;
  }

  /**
   * Identify conditions that should trigger escalation
   */
  identifyEscalationTriggers(data, classification) {
    const triggers = [];
    
    if (data.is_emergency_works === 'Yes') {
      triggers.push('EMERGENCY_WORKS');
    }
    
    if (classification.severity === 'CRITICAL') {
      triggers.push('CRITICAL_SEVERITY');
    }
    
    if (data.traffic_management_type === 'road_closure') {
      triggers.push('ROAD_CLOSURE');
    }
    
    if (classification.impact_radius_meters > 500) {
      triggers.push('WIDE_IMPACT');
    }
    
    return triggers;
  }

  /**
   * Calculate notification priority level
   */
  calculateNotificationPriority(classification) {
    if (classification.escalation_triggers.includes('EMERGENCY_WORKS')) {
      return 'CRITICAL';
    }
    
    if (classification.severity === 'CRITICAL') {
      return 'HIGH';
    }
    
    if (classification.requires_notification) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Convert numerical score to severity level
   */
  scoreToSeverity(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Increase severity by one level
   */
  increaseSeverity(currentSeverity) {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = levels.indexOf(currentSeverity);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  /**
   * Calculate impact radius from analytical score
   */
  calculateRadiusFromScore(score) {
    if (score >= 80) return 800;
    if (score >= 60) return 500;
    if (score >= 40) return 300;
    if (score >= 20) return 150;
    return 100;
  }

  /**
   * Calculate advance notice hours based on severity
   */
  calculateAdvanceNotice(severity) {
    switch (severity) {
      case 'CRITICAL': return 24;
      case 'HIGH': return 12;
      case 'MEDIUM': return 6;
      case 'LOW': return 2;
      default: return 1;
    }
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(analysis, ruleResult) {
    let confidence = 60; // Base confidence
    
    if (ruleResult.matched_rule && ruleResult.matched_rule !== 'analytical') {
      confidence += 25; // Rule-based adds confidence
    }
    
    if (analysis.score > 70 || analysis.score < 30) {
      confidence += 15; // Extreme scores are more confident
    }
    
    return Math.min(100, confidence);
  }

  /**
   * Generate cache key for classification
   */
  generateClassificationKey(data) {
    const keyComponents = [
      data.work_category || 'unknown',
      data.traffic_management_type || 'unknown',
      data.is_emergency_works || 'No',
      data.is_traffic_sensitive || 'No',
      data.work_status || 'unknown'
    ];
    
    return keyComponents.join('|');
  }

  /**
   * Get default classification for fallback
   */
  getDefaultClassification(data) {
    return {
      severity: 'MEDIUM',
      impact_radius_meters: 200,
      requires_notification: false,
      advance_notice_hours: 4,
      confidence: 50,
      analysis_method: 'default_fallback',
      matched_rule: 'default',
      factor_scores: {},
      overall_score: 50,
      escalation_triggers: [],
      notification_priority: 'LOW'
    };
  }

  /**
   * Get default rule result
   */
  getDefaultRuleResult() {
    return {
      severity: 'MEDIUM',
      impact_radius_meters: 200,
      requires_notification: false,
      advance_notice_hours: 4,
      matched_rule: 'default',
      rule_priority: 999
    };
  }

  /**
   * Get classifier status and statistics
   */
  getStatus() {
    return {
      initialized: this.initialized,
      rules_loaded: this.classificationRules.size,
      traffic_sensitive_streets: this.trafficSensitiveStreets.size,
      major_corridors: this.majorRouteCorridors.size,
      cache_size: this.classificationCache.size,
      cache_max_size: this.cacheMaxSize,
      classification_weights: this.weights
    };
  }

  /**
   * Clear classification cache
   */
  clearCache() {
    this.classificationCache.clear();
    console.log('🧹 Severity classification cache cleared');
  }

  /**
   * Update classification rules from database
   */
  async refreshRules() {
    try {
      await this.loadClassificationRules();
      this.clearCache(); // Clear cache to use new rules
      console.log('🔄 Classification rules refreshed from database');
    } catch (error) {
      console.error('❌ Failed to refresh classification rules:', error.message);
    }
  }
}

// Export singleton instance
const severityClassifier = new StreetManagerSeverityClassifier();

export default severityClassifier;
export { StreetManagerSeverityClassifier };