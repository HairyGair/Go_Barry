/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Intelligence Dashboard Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { darkTheme, getStatusColor as getStatusColorHelper } from './styles/darkTheme';

const API_BASE = 'https://go-barry.onrender.com';
const { width: screenWidth } = Dimensions.get('window');

export default function IntelligenceDashboard() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedAnalysis, setSelectedAnalysis] = useState('overview');
  
  // Analytics data states
  const [routeImpactData, setRouteImpactData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [disruptionScore, setDisruptionScore] = useState(null);

  const timeframes = [
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  const analysisTypes = [
    { value: 'overview', label: 'Overview', icon: 'google-analytics' },
    { value: 'routes', label: 'Route Impact', icon: 'map-outline' },
    { value: 'predictions', label: 'Predictions', icon: 'trending-up' },
    { value: 'frequency', label: 'Service Frequency', icon: 'clock-outline' },
    { value: 'trends', label: 'Historical Trends', icon: 'chart-bar' }
  ];

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      setTimeout(() => {
        router.replace('/');
      }, 0);
    }
  }, [supervisorSession, isAdmin, router]);

  useEffect(() => {
    loadIntelligenceData();
  }, [selectedTimeframe, selectedAnalysis]);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);

      // Load all analytics data in parallel
      const promises = [
        loadRouteImpactAnalysis(),
        loadPredictiveAnalysis(),
        loadFrequencyAnalysis(),
        loadHistoricalAnalysis(),
        loadDisruptionScore()
      ];

      await Promise.allSettled(promises);

    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const loadRouteImpactAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/intelligence-new/overview`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.overview.routeImpact?.success) {
          setRouteImpactData(data.overview.routeImpact.analysis);
          return;
        }
      }
      
      // Fallback to mock data
      const mockData = {
        totalRoadworks: 12,
        routeImpacts: [
          {
            roadworkId: 'sm_newcastle_001',
            title: 'A1 Newcastle - Gas Works',
            location: 'A1 Central Motorway',
            affectedRoutes: [
              { routeId: 'Q3', routeName: 'Quayside - Q3', impactScore: 85 },
              { routeId: '21', routeName: 'Durham - 21', impactScore: 65 }
            ],
            impactScore: 85,
            severityLevel: 'HIGH',
            estimatedDelay: 12,
            passengerImpact: 240
          }
        ],
        severityDistribution: { CRITICAL: 2, HIGH: 4, MEDIUM: 5, LOW: 1 },
        geographicHotspots: [
          {
            center: [54.9783, -1.6178],
            impactCount: 3,
            totalScore: 210,
            description: 'Newcastle City Centre hotspot'
          }
        ]
      };
      setRouteImpactData(mockData);
    } catch (error) {
      // Silently fail
    }
  };

  const loadPredictiveAnalysis = async () => {
    try {
      const mockData = {
        confidence: 78,
        totalRisk: 'MEDIUM',
        predictions: [
          {
            type: 'disruption_escalation',
            confidence: 85,
            severity: 'HIGH',
            description: 'A1 disruption may escalate during peak hours',
            timeframe: '24h',
            affectedRoutes: ['Q3', '21']
          },
          {
            type: 'weather_disruption',
            confidence: 72,
            severity: 'MEDIUM',
            description: 'Heavy rain predicted to affect rural routes',
            timeframe: '48h',
            affectedRoutes: ['10', '27']
          }
        ],
        recommendations: [
          {
            priority: 'HIGH',
            title: 'Deploy Additional Supervisors',
            description: 'Position supervisors at A1 corridor for potential escalation',
            timeframe: '2-4h'
          }
        ]
      };
      setPredictiveData(mockData);
    } catch (error) {
      // Silently fail
    }
  };

  const loadFrequencyAnalysis = async () => {
    try {
      const mockData = {
        overallImpact: {
          severity: 'MEDIUM',
          affectedRoutes: 6,
          averageCapacityLoss: 45
        },
        routeAnalysis: [
          {
            routeId: 'Q3',
            routeName: 'Quayside - Q3',
            baseline: { normalFrequency: 8, reliability: 0.92 },
            impactedMetrics: {
              frequencyReduction: 0.3,
              journeyTimeIncrease: 8,
              capacityLoss: 60,
              serviceLevel: 'GOOD'
            }
          }
        ],
        frequencyOptimizations: [
          {
            priority: 'HIGH',
            type: 'frequency_restoration',
            title: 'Critical Frequency Restoration Required',
            affectedRoutes: ['Q3', '21'],
            expectedBenefit: { frequencyRestoration: '85%' }
          }
        ]
      };
      setFrequencyData(mockData);
    } catch (error) {
      // Silently fail
    }
  };

  const loadHistoricalAnalysis = async () => {
    try {
      const mockData = {
        trends: {
          disruptions: {
            totalDisruptions: 156,
            dailyAverage: 5.2,
            growthRate: 15,
            volatility: 22
          },
          roadworks: {
            totalRoadworks: 89,
            sourceDistribution: { streetmanager: 75, manual: 25 }
          }
        },
        insights: [
          {
            type: 'warning',
            title: 'Increasing Disruption Trend',
            description: 'Disruptions have increased by 15% over the analysis period',
            impact: 'HIGH'
          }
        ],
        patterns: {
          correlations: [
            {
              categories: ['disruptions', 'roadworks'],
              strength: 0.72,
              direction: 'positive',
              description: 'Disruptions increase with roadwork activity'
            }
          ]
        }
      };
      setHistoricalData(mockData);
    } catch (error) {
      // Silently fail
    }
  };

  const loadDisruptionScore = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/intelligence-new/disruption-score?includeBreakdown=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDisruptionScore(data.disruptionScore);
          return;
        }
      }
      
      // Fallback to mock data
      const mockData = {
        currentScore: 67,
        trend: 'increasing',
        factors: [
          { name: 'Active Roadworks', impact: 35, status: 'high' },
          { name: 'Weather Conditions', impact: 15, status: 'normal' },
          { name: 'Traffic Volume', impact: 25, status: 'medium' },
          { name: 'Service Reliability', impact: 25, status: 'good' }
        ]
      };
      setDisruptionScore(mockData);
    } catch (error) {
      // Silently fail
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIntelligenceData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    return getStatusColorHelper(severity || 'unknown');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return darkTheme.error;
    if (score >= 60) return darkTheme.warning;
    if (score >= 40) return darkTheme.caution;
    return darkTheme.success;
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  const renderHistoricalTrends = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.sectionTitle}>Historical Trends</Text>
      
      {/* Trend Summary */}
      <View style={styles.trendSummaryCard}>
        <Text style={styles.cardTitle}>Trend Summary</Text>
        <View style={styles.trendGrid}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Total Disruptions</Text>
            <Text style={styles.trendValue}>{historicalData?.trends?.disruptions?.totalDisruptions || 0}</Text>
            <Text style={styles.trendSubtext}>Daily avg: {historicalData?.trends?.disruptions?.dailyAverage || 0}</Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Growth Rate</Text>
            <Text style={[styles.trendValue, { color: historicalData?.trends?.disruptions?.growthRate > 0 ? darkTheme.error : darkTheme.success }]}>
              {historicalData?.trends?.disruptions?.growthRate > 0 ? '+' : ''}{historicalData?.trends?.disruptions?.growthRate || 0}%
            </Text>
            <Text style={styles.trendSubtext}>30-day trend</Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Data Sources</Text>
            <Text style={styles.trendValue}>{historicalData?.trends?.roadworks?.sourceDistribution?.streetmanager || 0}%</Text>
            <Text style={styles.trendSubtext}>Automated capture</Text>
          </View>
        </View>
      </View>

      {/* Pattern Analysis */}
      <View style={styles.patternsCard}>
        <Text style={styles.cardTitle}>Pattern Analysis</Text>
        {historicalData?.patterns?.correlations?.map((correlation, index) => (
          <View key={index} style={styles.correlationItem}>
            <View style={styles.correlationHeader}>
              <Text style={styles.correlationTitle}>
                {correlation.categories.join(' ↔ ')} Correlation
              </Text>
              <Text style={[styles.correlationStrength, { color: getScoreColor(correlation.strength * 100) }]}>
                {Math.round(correlation.strength * 100)}%
              </Text>
            </View>
            <Text style={styles.correlationDescription}>{correlation.description}</Text>
            <Text style={styles.correlationDirection}>Direction: {correlation.direction}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFrequencyAnalysis = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.sectionTitle}>Service Frequency Analysis</Text>
      
      {/* Overall Impact */}
      <View style={styles.overallImpactCard}>
        <Text style={styles.cardTitle}>Network Impact Summary</Text>
        <View style={styles.impactSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Severity</Text>
            <Text style={[styles.summaryValue, { color: getSeverityColor(frequencyData?.overallImpact?.severity) }]}>
              {frequencyData?.overallImpact?.severity || 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Routes Affected</Text>
            <Text style={styles.summaryValue}>{frequencyData?.overallImpact?.affectedRoutes || 0}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Capacity Loss</Text>
            <Text style={styles.summaryValue}>{frequencyData?.overallImpact?.averageCapacityLoss || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Route Analysis */}
      <View style={styles.routeAnalysisCard}>
        <Text style={styles.cardTitle}>Route Performance</Text>
        {frequencyData?.routeAnalysis?.map((route, index) => (
          <View key={index} style={styles.routePerformanceItem}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>{route.routeName}</Text>
              <View style={[styles.serviceLevelBadge, { backgroundColor: getSeverityColor(route.impactedMetrics?.serviceLevel) }]}>
                <Text style={styles.serviceLevelText}>{route.impactedMetrics?.serviceLevel}</Text>
              </View>
            </View>
            
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Frequency</Text>
                <Text style={styles.performanceValue}>
                  {route.baseline?.normalFrequency} → {Math.round(route.baseline?.normalFrequency * (1 - route.impactedMetrics?.frequencyReduction))}
                </Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Delay</Text>
                <Text style={styles.performanceValue}>+{route.impactedMetrics?.journeyTimeIncrease}min</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Capacity Loss</Text>
                <Text style={styles.performanceValue}>{route.impactedMetrics?.capacityLoss}pax/h</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Optimizations */}
      <View style={styles.optimizationsCard}>
        <Text style={styles.cardTitle}>Optimization Opportunities</Text>
        {frequencyData?.frequencyOptimizations?.map((opt, index) => (
          <View key={index} style={styles.optimizationItem}>
            <View style={styles.optimizationHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: getSeverityColor(opt.priority) }]}>
                <Text style={styles.priorityText}>{opt.priority}</Text>
              </View>
              <Text style={styles.optimizationTitle}>{opt.title}</Text>
            </View>
            <Text style={styles.optimizationDescription}>{opt.description || 'Optimize route frequency for better service.'}</Text>
            <Text style={styles.optimizationBenefit}>
              Expected Benefit: {opt.expectedBenefit?.frequencyRestoration}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPredictions = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.sectionTitle}>Predictive Analysis</Text>
      
      {/* Confidence Score */}
      <View style={styles.confidenceCard}>
        <Text style={styles.cardTitle}>Prediction Confidence</Text>
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceScore, { color: getScoreColor(predictiveData?.confidence || 0) }]}>
            {predictiveData?.confidence || 0}%
          </Text>
          <Text style={styles.riskLevel}>Risk Level: {predictiveData?.totalRisk || 'UNKNOWN'}</Text>
        </View>
      </View>

      {/* Predictions List */}
      <View style={styles.predictionsCard}>
        <Text style={styles.cardTitle}>Upcoming Predictions</Text>
        {predictiveData?.predictions?.map((prediction, index) => (
          <View key={index} style={styles.predictionItem}>
            <View style={styles.predictionHeader}>
              <View style={[styles.predictionIcon, { backgroundColor: getSeverityColor(prediction.severity) + '20' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color={getSeverityColor(prediction.severity)} />
              </View>
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionTitle}>{prediction.description}</Text>
                <Text style={styles.predictionTimeframe}>Timeframe: {prediction.timeframe}</Text>
              </View>
              <Text style={styles.predictionConfidence}>{prediction.confidence}%</Text>
            </View>
            
            {prediction.affectedRoutes && (
              <View style={styles.predictionRoutes}>
                {prediction.affectedRoutes.map((route, idx) => (
                  <View key={idx} style={styles.routeChip}>
                    <Text style={styles.routeChipText}>{route}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Recommended Actions</Text>
        {predictiveData?.recommendations?.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: getSeverityColor(rec.priority) }]}>
                <Text style={styles.priorityText}>{rec.priority}</Text>
              </View>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
            <Text style={styles.recommendationTimeframe}>Implementation: {rec.timeframe}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRouteImpact = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.sectionTitle}>Route Impact Analysis</Text>
      
      {/* Severity Distribution */}
      <View style={styles.distributionCard}>
        <Text style={styles.cardTitle}>Severity Distribution</Text>
        <View style={styles.distributionGrid}>
          {Object.entries(routeImpactData?.severityDistribution || {}).map(([severity, count]) => (
            <View key={severity} style={styles.distributionItem}>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(severity) }]} />
              <Text style={styles.severityLabel}>{severity}</Text>
              <Text style={styles.severityCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Route Impacts */}
      <View style={styles.impactsCard}>
        <Text style={styles.cardTitle}>High-Impact Disruptions</Text>
        {routeImpactData?.routeImpacts?.map((impact, index) => (
          <View key={index} style={styles.impactItem}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactTitle}>{impact.title}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(impact.severityLevel) }]}>
                <Text style={styles.severityBadgeText}>{impact.severityLevel}</Text>
              </View>
            </View>
            
            <Text style={styles.impactLocation}>📍 {impact.location}</Text>
            
            <View style={styles.impactMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Impact Score</Text>
                <Text style={styles.metricValue}>{impact.impactScore}/100</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Est. Delay</Text>
                <Text style={styles.metricValue}>{impact.estimatedDelay}min</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Passengers</Text>
                <Text style={styles.metricValue}>{impact.passengerImpact}</Text>
              </View>
            </View>
            
            <View style={styles.affectedRoutes}>
              <Text style={styles.routesLabel}>Affected Routes:</Text>
              <View style={styles.routesList}>
                {impact.affectedRoutes?.map((route, idx) => (
                  <View key={idx} style={styles.routeChip}>
                    <Text style={styles.routeChipText}>{route.routeId}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.analysisContainer}>
      {/* Disruption Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.cardTitle}>Live Disruption Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getScoreColor(disruptionScore?.currentScore || 0) }]}>
            {disruptionScore?.currentScore || 0}
          </Text>
          <View style={styles.scoreDetails}>
            <View style={styles.trendIndicator}>
              <MaterialCommunityIcons 
                name={disruptionScore?.trend === 'increasing' ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={disruptionScore?.trend === 'increasing' ? darkTheme.error : darkTheme.success} 
              />
              <Text style={styles.trendText}>{disruptionScore?.trend || 'stable'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.factorsContainer}>
          {disruptionScore?.factors?.map((factor, index) => (
            <View key={index} style={styles.factorRow}>
              <Text style={styles.factorName}>{factor.name}</Text>
              <View style={styles.factorBar}>
                <View 
                  style={[
                    styles.factorProgress, 
                    { 
                      width: `${factor.impact}%`,
                      backgroundColor: getSeverityColor(factor.status)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.factorValue}>{factor.impact}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="hammer-wrench" size={24} color={darkTheme.warning} />
          <Text style={styles.statValue}>{routeImpactData?.totalRoadworks || 0}</Text>
          <Text style={styles.statLabel}>Active Roadworks</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={darkTheme.error} />
          <Text style={styles.statValue}>{routeImpactData?.severityDistribution?.CRITICAL || 0}</Text>
          <Text style={styles.statLabel}>Critical Issues</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="trending-up" size={24} color={darkTheme.success} />
          <Text style={styles.statValue}>{predictiveData?.confidence || 0}%</Text>
          <Text style={styles.statLabel}>Prediction Confidence</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-group" size={24} color={darkTheme.accent} />
          <Text style={styles.statValue}>{routeImpactData?.routeImpacts?.[0]?.passengerImpact || 0}</Text>
          <Text style={styles.statLabel}>Affected Passengers</Text>
        </View>
      </View>

      {/* Key Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.cardTitle}>Key Insights</Text>
        {historicalData?.insights?.map((insight, index) => (
          <View key={index} style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: getSeverityColor(insight.impact) + '20' }]}>
              <MaterialCommunityIcons 
                name={insight.type === 'warning' ? 'alert' : 'information'} 
                size={16} 
                color={getSeverityColor(insight.impact)} 
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !routeImpactData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Loading Intelligence Dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#f093fb"
            />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="brain" size={32} color="#f093fb" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Intelligence Dashboard</Text>
              <Text style={styles.pageSubtitle}>ML predictions & insights</Text>
            </View>
          </View>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {timeframes.map(timeframe => (
              <Pressable
                key={timeframe.value}
                style={[styles.timeframeButton, selectedTimeframe === timeframe.value && styles.timeframeButtonActive]}
                onPress={() => setSelectedTimeframe(timeframe.value)}
              >
                <Text style={[styles.timeframeText, selectedTimeframe === timeframe.value && styles.timeframeTextActive]}>
                  {timeframe.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Analysis Type Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.analysisSelector}>
            {analysisTypes.map(analysis => (
              <Pressable
                key={analysis.value}
                style={[styles.analysisButton, selectedAnalysis === analysis.value && styles.analysisButtonActive]}
                onPress={() => setSelectedAnalysis(analysis.value)}
              >
                <MaterialCommunityIcons 
                  name={analysis.icon} 
                  size={18} 
                  color={selectedAnalysis === analysis.value ? '#FFFFFF' : darkTheme.textSecondary} 
                />
                <Text style={[styles.analysisText, selectedAnalysis === analysis.value && styles.analysisTextActive]}>
                  {analysis.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Content */}
          {selectedAnalysis === 'overview' && renderOverview()}
          {selectedAnalysis === 'routes' && renderRouteImpact()}
          {selectedAnalysis === 'predictions' && renderPredictions()}
          {selectedAnalysis === 'frequency' && renderFrequencyAnalysis()}
          {selectedAnalysis === 'trends' && renderHistoricalTrends()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  
  // Timeframe Selector
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: darkTheme.surface,
  },
  timeframeButtonActive: {
    backgroundColor: '#f093fb',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.textSecondary,
  },
  timeframeTextActive: {
    color: '#FFFFFF',
  },
  
  // Analysis Selector
  analysisSelector: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    paddingHorizontal: 16,
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: darkTheme.surface,
    gap: 6,
  },
  analysisButtonActive: {
    backgroundColor: '#f093fb',
  },
  analysisText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.textSecondary,
  },
  analysisTextActive: {
    color: '#FFFFFF',
  },
  
  // Analysis Container
  analysisContainer: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 8,
  },
  
  // Score Card
  scoreCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreDetails: {
    alignItems: 'flex-end',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
  },
  factorsContainer: {
    gap: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorName: {
    flex: 1,
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  factorBar: {
    flex: 2,
    height: 6,
    backgroundColor: darkTheme.background,
    borderRadius: 3,
  },
  factorProgress: {
    height: '100%',
    borderRadius: 3,
  },
  factorValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'right',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 56) / 2,
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Insights Card
  insightsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  
  // Distribution styles
  distributionCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distributionItem: {
    alignItems: 'center',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  severityLabel: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  severityCount: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.text,
  },
  
  // Impact items
  impactsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  impactItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  impactTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  impactLocation: {
    fontSize: 12,
    color: darkTheme.info,
    marginBottom: 12,
  },
  impactMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  affectedRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routesLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  routesList: {
    flexDirection: 'row',
  },
  routeChip: {
    backgroundColor: darkTheme.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.info + '30',
    marginRight: 4,
  },
  routeChipText: {
    fontSize: 10,
    color: darkTheme.info,
    fontWeight: '600',
  },
  
  // Predictions styles
  confidenceCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceScore: {
    fontSize: 36,
    fontWeight: '700',
  },
  riskLevel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginTop: 8,
  },
  predictionsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  predictionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  predictionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
    marginBottom: 4,
  },
  predictionTimeframe: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  predictionConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.success,
  },
  predictionRoutes: {
    flexDirection: 'row',
    marginTop: 8,
  },
  recommendationsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  recommendationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  recommendationDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  recommendationTimeframe: {
    fontSize: 11,
    color: darkTheme.textMuted,
    fontStyle: 'italic',
  },
  
  // Frequency Analysis styles
  overallImpactCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  impactSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
  },
  routeAnalysisCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  routePerformanceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  serviceLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceLevelText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  optimizationsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  optimizationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  optimizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optimizationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  optimizationDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  optimizationBenefit: {
    fontSize: 11,
    color: darkTheme.success,
    fontStyle: 'italic',
  },
  
  // Historical Trends styles
  trendSummaryCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 8,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
  },
  trendSubtext: {
    fontSize: 10,
    color: darkTheme.textMuted,
    marginTop: 4,
  },
  patternsCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  correlationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  correlationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  correlationStrength: {
    fontSize: 16,
    fontWeight: '700',
  },
  correlationDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  correlationDirection: {
    fontSize: 11,
    color: darkTheme.textMuted,
    fontStyle: 'italic',
  },
});
