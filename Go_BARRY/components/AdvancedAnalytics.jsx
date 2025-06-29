// components/AdvancedAnalytics.jsx
// Advanced Analytics Dashboard - Phase 4.2
// Historical trends, predictive patterns, revenue impact, and business intelligence

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const AdvancedAnalytics = () => {
  const [activeView, setActiveView] = useState('historical');
  const [timeframe, setTimeframe] = useState('30d');
  const [analysisType, setAnalysisType] = useState('alerts');
  const [showExportModal, setShowExportModal] = useState(false);
  
  const { supervisor } = useSupervisorSession();
  
  // Convex queries for different analytics
  const historicalTrends = useQuery(api.analytics.getHistoricalTrends, {
    timeframe,
    analysisType,
    groupBy: 'day'
  });
  
  const predictivePatterns = useQuery(api.analytics.getPredictivePatterns, {
    analysisType: 'route_risk',
    timeHorizon: 'next_day'
  });
  
  const revenueImpact = useQuery(api.analytics.getRevenueImpact, {
    timeframe,
    impactType: 'total_cost',
    includeProjections: true
  });
  
  const businessIntelligence = useQuery(api.analytics.getBusinessIntelligence, {
    dashboardType: 'executive',
    timeframe
  });

  // View configuration
  const views = [
    { id: 'historical', label: 'Historical Trends', icon: '📈' },
    { id: 'predictive', label: 'Predictive Analytics', icon: '🔮' },
    { id: 'financial', label: 'Financial Impact', icon: '💰' },
    { id: 'business', label: 'Business Intelligence', icon: '📊' },
  ];

  // Timeframe options
  const timeframes = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' },
  ];

  const renderViewContent = () => {
    switch (activeView) {
      case 'historical':
        return <HistoricalTrendsView 
          data={historicalTrends} 
          timeframe={timeframe}
          analysisType={analysisType}
          onAnalysisTypeChange={setAnalysisType}
        />;
      case 'predictive':
        return <PredictiveAnalyticsView data={predictivePatterns} />;
      case 'financial':
        return <FinancialImpactView data={revenueImpact} />;
      case 'business':
        return <BusinessIntelligenceView data={businessIntelligence} />;
      default:
        return <HistoricalTrendsView 
          data={historicalTrends} 
          timeframe={timeframe}
          analysisType={analysisType}
          onAnalysisTypeChange={setAnalysisType}
        />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with controls */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <View style={styles.headerControls}>
          {/* Timeframe Selector */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Timeframe:</Text>
            <View style={styles.buttonGroup}>
              {timeframes.map((tf) => (
                <TouchableOpacity
                  key={tf.id}
                  style={[styles.timeframeButton, timeframe === tf.id && styles.activeTimeframe]}
                  onPress={() => setTimeframe(tf.id)}
                >
                  <Text style={[styles.timeframeText, timeframe === tf.id && styles.activeTimeframeText]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Export Button */}
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Text style={styles.exportButtonText}>📊 Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Navigation */}
      <View style={styles.viewContainer}>
        {views.map((view) => (
          <TouchableOpacity
            key={view.id}
            style={[styles.viewTab, activeView === view.id && styles.activeViewTab]}
            onPress={() => setActiveView(view.id)}
          >
            <Text style={styles.viewIcon}>{view.icon}</Text>
            <Text style={[styles.viewLabel, activeView === view.id && styles.activeViewLabel]}>
              {view.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {renderViewContent()}
      </View>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          timeframe={timeframe}
          supervisor={supervisor}
        />
      )}
    </View>
  );
};

// Historical Trends View Component
const HistoricalTrendsView = ({ data, timeframe, analysisType, onAnalysisTypeChange }) => {
  const analysisTypes = [
    { id: 'alerts', label: 'Alerts' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'performance', label: 'Performance' },
    { id: 'routes', label: 'Routes' },
  ];

  return (
    <ScrollView style={styles.trendsContent}>
      {/* Analysis Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Analysis Type</Text>
        <View style={styles.analysisTypeGrid}>
          {analysisTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.analysisCard, analysisType === type.id && styles.activeAnalysisCard]}
              onPress={() => onAnalysisTypeChange(type.id)}
            >
              <Text style={[styles.analysisLabel, analysisType === type.id && styles.activeAnalysisLabel]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Key Metrics ({timeframe})</Text>
        <View style={styles.metricsGrid}>
          {data && (
            <>
              <MetricCard 
                title={`Total ${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}`}
                value={data.totalAlerts || data.totalIncidents || data.totalActions || 0}
                color="#0984e3"
                trend={data.trendData ? calculateTrend(data.trendData) : 0}
              />
              {data.severityBreakdown && (
                <>
                  <MetricCard title="Critical" value={data.severityBreakdown.critical} color="#e17055" />
                  <MetricCard title="High" value={data.severityBreakdown.high} color="#fd79a8" />
                  <MetricCard title="Medium" value={data.severityBreakdown.medium} color="#fdcb6e" />
                  <MetricCard title="Low" value={data.severityBreakdown.low} color="#55efc4" />
                </>
              )}
              {data.averageResponseTime && (
                <MetricCard 
                  title="Avg Response Time" 
                  value={`${data.averageResponseTime.toFixed(1)}m`} 
                  color="#74b9ff" 
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Trend Chart */}
      {data?.trendData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Trend Analysis</Text>
          <View style={styles.chartContainer}>
            <TrendChart data={data.trendData} timeframe={timeframe} />
          </View>
        </View>
      )}

      {/* Peak Hours */}
      {data?.peakHours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Peak Activity Hours</Text>
          <View style={styles.peakHoursGrid}>
            {data.peakHours.map((peak, index) => (
              <View key={index} style={styles.peakHourCard}>
                <Text style={styles.peakHour}>{peak.hour}:00</Text>
                <Text style={styles.peakCount}>{peak.count} incidents</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Source/Type Breakdown */}
      {data?.sourceBreakdown && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Source Breakdown</Text>
          <View style={styles.breakdownGrid}>
            {Object.entries(data.sourceBreakdown).map(([source, count]) => (
              <BreakdownCard key={source} label={source} value={count} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// Predictive Analytics View Component
const PredictiveAnalyticsView = ({ data }) => {
  return (
    <ScrollView style={styles.predictiveContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Predictive Insights</Text>
        
        {/* Route Risk Scoring */}
        {data?.riskScores && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>🚨 Route Risk Analysis</Text>
            <View style={styles.riskGrid}>
              {data.riskScores.slice(0, 6).map((route, index) => (
                <RiskScoreCard key={index} route={route} />
              ))}
            </View>
          </View>
        )}

        {/* High Risk Routes */}
        {data?.highRiskRoutes && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>⚠️ High Risk Routes</Text>
            <View style={styles.highRiskList}>
              {data.highRiskRoutes.map((route, index) => (
                <HighRiskRouteCard key={index} route={route} />
              ))}
            </View>
          </View>
        )}

        {/* Risk Factors */}
        {data?.riskFactors && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>📊 Risk Factor Analysis</Text>
            <View style={styles.riskFactorsGrid}>
              {data.riskFactors.map((factor, index) => (
                <RiskFactorCard key={index} factor={factor} />
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {data?.recommendations && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>💡 AI Recommendations</Text>
            <View style={styles.recommendationsList}>
              {data.recommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} priority={index + 1} />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Financial Impact View Component
const FinancialImpactView = ({ data }) => {
  return (
    <ScrollView style={styles.financialContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Financial Impact Analysis</Text>
        
        {data && (
          <>
            {/* Direct Costs */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>💸 Direct Costs</Text>
              <View style={styles.costsGrid}>
                <CostCard 
                  title="Lost Revenue" 
                  value={`£${(data.directCosts?.lostRevenue || 0).toLocaleString()}`} 
                  color="#e17055" 
                />
                <CostCard 
                  title="Operational Costs" 
                  value={`£${(data.directCosts?.operationalCosts || 0).toLocaleString()}`} 
                  color="#fd79a8" 
                />
                <CostCard 
                  title="Supervisor Time" 
                  value={`£${(data.directCosts?.supervisorTimeValue || 0).toLocaleString()}`} 
                  color="#fdcb6e" 
                />
              </View>
            </View>

            {/* Total Impact */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📊 Total Financial Impact</Text>
              <View style={styles.totalImpactCard}>
                <Text style={styles.totalImpactValue}>
                  £{(data.totalEstimatedCost || 0).toLocaleString()}
                </Text>
                <Text style={styles.totalImpactLabel}>Estimated Total Cost</Text>
                <Text style={styles.totalImpactPeriod}>Current Period</Text>
              </View>
            </View>

            {/* Impact Projections */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📈 Impact Projections</Text>
              <View style={styles.projectionsGrid}>
                <ProjectionCard 
                  period="Daily Average" 
                  value={`£${Math.round((data.totalEstimatedCost || 0) / 30).toLocaleString()}`} 
                />
                <ProjectionCard 
                  period="Monthly Estimate" 
                  value={`£${(data.totalEstimatedCost || 0).toLocaleString()}`} 
                />
                <ProjectionCard 
                  period="Annual Projection" 
                  value={`£${Math.round((data.totalEstimatedCost || 0) * 12).toLocaleString()}`} 
                />
              </View>
            </View>

            {/* Cost Breakdown Chart */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🥧 Cost Breakdown</Text>
              <View style={styles.chartContainer}>
                <CostBreakdownChart data={data} />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

// Business Intelligence View Component
const BusinessIntelligenceView = ({ data }) => {
  return (
    <ScrollView style={styles.biContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Executive Dashboard</Text>
        
        {data && (
          <>
            {/* KPI Overview */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🎯 Key Performance Indicators</Text>
              <View style={styles.kpiGrid}>
                {data.kpis && (
                  <>
                    <KPICard 
                      title="Total Alerts" 
                      value={data.kpis.totalAlerts} 
                      color="#0984e3"
                      trend={data.trends?.alertTrend}
                    />
                    <KPICard 
                      title="Critical Incidents" 
                      value={data.kpis.criticalIncidents} 
                      color="#e17055"
                      trend={data.trends?.incidentTrend}
                    />
                    <KPICard 
                      title="System Availability" 
                      value={`${data.kpis.systemAvailability?.toFixed(1)}%`} 
                      color="#00b894"
                    />
                    <KPICard 
                      title="Customer Satisfaction" 
                      value={`${data.kpis.customerSatisfactionScore}%`} 
                      color="#fdcb6e"
                    />
                    <KPICard 
                      title="Cost Impact" 
                      value={`£${(data.kpis.estimatedCostImpact || 0).toLocaleString()}`} 
                      color="#fd79a8"
                    />
                  </>
                )}
              </View>
            </View>

            {/* Top Issues */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🔴 Top Issues Requiring Attention</Text>
              <View style={styles.issuesList}>
                {data.topIssues?.slice(0, 5).map((issue, index) => (
                  <IssueCard key={index} issue={issue} rank={index + 1} />
                ))}
              </View>
            </View>

            {/* Strategic Recommendations */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🎯 Strategic Recommendations</Text>
              <View style={styles.strategicRecommendations}>
                {data.recommendations?.map((rec, index) => (
                  <StrategicRecommendationCard key={index} recommendation={rec} priority={index + 1} />
                ))}
              </View>
            </View>

            {/* Performance Trends */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📈 Performance Trends</Text>
              <View style={styles.trendsOverview}>
                <TrendIndicator 
                  label="Alert Volume" 
                  trend={data.trends?.alertTrend || 0}
                  value={data.kpis?.totalAlerts || 0}
                />
                <TrendIndicator 
                  label="Incident Rate" 
                  trend={data.trends?.incidentTrend || 0}
                  value={data.kpis?.criticalIncidents || 0}
                />
                <TrendIndicator 
                  label="System Performance" 
                  trend={1} // Mock positive trend
                  value={`${data.trends?.performanceTrend || 95}%`}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

// Utility Components
const MetricCard = ({ title, value, color, trend }) => (
  <View style={styles.metricCard}>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {trend !== undefined && (
      <Text style={[styles.metricTrend, { color: trend > 0 ? '#00b894' : trend < 0 ? '#e17055' : '#636e72' }]}>
        {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}
      </Text>
    )}
  </View>
);

const RiskScoreCard = ({ route }) => (
  <View style={styles.riskCard}>
    <Text style={styles.routeNumber}>Route {route.route}</Text>
    <View style={styles.riskMeter}>
      <View style={[styles.riskFill, { 
        width: `${route.riskScore * 100}%`,
        backgroundColor: route.riskScore > 0.7 ? '#e17055' : route.riskScore > 0.4 ? '#fdcb6e' : '#00b894'
      }]} />
    </View>
    <Text style={styles.riskScore}>{Math.round(route.riskScore * 100)}% Risk</Text>
    <Text style={styles.riskTrend}>Trend: {route.trend}</Text>
  </View>
);

const HighRiskRouteCard = ({ route }) => (
  <View style={styles.highRiskCard}>
    <View style={styles.highRiskHeader}>
      <Text style={styles.highRiskRoute}>Route {route.route}</Text>
      <Text style={styles.highRiskScore}>{Math.round(route.riskScore * 100)}%</Text>
    </View>
    <View style={styles.riskFactorsList}>
      {route.factors?.slice(0, 2).map((factor, index) => (
        <Text key={index} style={styles.riskFactor}>• {factor}</Text>
      ))}
    </View>
  </View>
);

const RiskFactorCard = ({ factor }) => (
  <View style={styles.riskFactorCard}>
    <Text style={styles.factorName}>{factor.factor}</Text>
    <Text style={styles.factorImpact}>Impact: {Math.round(factor.impact * 100)}%</Text>
    <Text style={styles.factorFrequency}>Frequency: {Math.round(factor.frequency * 100)}%</Text>
  </View>
);

const RecommendationCard = ({ recommendation, priority }) => (
  <View style={styles.recommendationCard}>
    <View style={styles.recommendationHeader}>
      <Text style={styles.recommendationPriority}>#{priority}</Text>
      <Text style={styles.recommendationIcon}>💡</Text>
    </View>
    <Text style={styles.recommendationText}>{recommendation}</Text>
  </View>
);

const CostCard = ({ title, value, color }) => (
  <View style={styles.costCard}>
    <Text style={[styles.costValue, { color }]}>{value}</Text>
    <Text style={styles.costTitle}>{title}</Text>
  </View>
);

const ProjectionCard = ({ period, value }) => (
  <View style={styles.projectionCard}>
    <Text style={styles.projectionValue}>{value}</Text>
    <Text style={styles.projectionPeriod}>{period}</Text>
  </View>
);

const KPICard = ({ title, value, color, trend }) => (
  <View style={styles.kpiCard}>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
    {trend !== undefined && (
      <Text style={[styles.kpiTrend, { color: trend > 0 ? '#00b894' : trend < 0 ? '#e17055' : '#636e72' }]}>
        {trend > 0 ? '+' : ''}{trend}
      </Text>
    )}
  </View>
);

const IssueCard = ({ issue, rank }) => (
  <View style={styles.issueCard}>
    <View style={styles.issueRank}>
      <Text style={styles.rankNumber}>{rank}</Text>
    </View>
    <View style={styles.issueContent}>
      <Text style={styles.issueTitle}>{issue.title}</Text>
      <Text style={styles.issueLocation}>{issue.location}</Text>
      <Text style={styles.issueSeverity}>{issue.severity}</Text>
    </View>
    <Text style={styles.issueType}>{issue.type}</Text>
  </View>
);

const StrategicRecommendationCard = ({ recommendation, priority }) => (
  <View style={styles.strategicCard}>
    <View style={styles.strategicPriority}>
      <Text style={styles.strategicPriorityText}>P{priority}</Text>
    </View>
    <Text style={styles.strategicText}>{recommendation}</Text>
  </View>
);

const TrendIndicator = ({ label, trend, value }) => (
  <View style={styles.trendIndicator}>
    <Text style={styles.trendLabel}>{label}</Text>
    <Text style={styles.trendValue}>{value}</Text>
    <Text style={[styles.trendDirection, { 
      color: trend > 0 ? '#00b894' : trend < 0 ? '#e17055' : '#636e72' 
    }]}>
      {trend > 0 ? '↗ Improving' : trend < 0 ? '↘ Declining' : '→ Stable'}
    </Text>
  </View>
);

const BreakdownCard = ({ label, value }) => (
  <View style={styles.breakdownCard}>
    <Text style={styles.breakdownValue}>{value}</Text>
    <Text style={styles.breakdownLabel}>{label}</Text>
  </View>
);

// Simple chart components (would use a real charting library in production)
const TrendChart = ({ data, timeframe }) => (
  <View style={styles.chartPlaceholder}>
    <Text style={styles.chartTitle}>Trend Chart ({timeframe})</Text>
    <Text style={styles.chartSubtitle}>{data.length} data points</Text>
    <View style={styles.chartBars}>
      {data.slice(-7).map((point, index) => (
        <View 
          key={index} 
          style={[styles.chartBar, { 
            height: Math.max(20, (point.count / Math.max(...data.map(d => d.count))) * 100) 
          }]} 
        />
      ))}
    </View>
  </View>
);

const CostBreakdownChart = ({ data }) => (
  <View style={styles.chartPlaceholder}>
    <Text style={styles.chartTitle}>Cost Distribution</Text>
    <View style={styles.costBreakdownBars}>
      <View style={[styles.costBar, { flex: data.directCosts?.lostRevenue || 1, backgroundColor: '#e17055' }]} />
      <View style={[styles.costBar, { flex: data.directCosts?.operationalCosts || 1, backgroundColor: '#fd79a8' }]} />
      <View style={[styles.costBar, { flex: data.directCosts?.supervisorTimeValue || 1, backgroundColor: '#fdcb6e' }]} />
    </View>
    <View style={styles.costBreakdownLegend}>
      <Text style={styles.legendItem}>🟥 Lost Revenue</Text>
      <Text style={styles.legendItem}>🟪 Operational</Text>
      <Text style={styles.legendItem}>🟨 Supervisor Time</Text>
    </View>
  </View>
);

// Export Modal Component
const ExportModal = ({ visible, onClose, timeframe, supervisor }) => {
  const [exportType, setExportType] = useState('full');
  const [format, setFormat] = useState('json');
  
  const exportData = useQuery(api.analytics.exportAnalyticsData, {
    exportType,
    timeframe,
    format
  });

  const handleExport = () => {
    if (exportData) {
      // In a real implementation, this would trigger a download
      alert(`📊 Export complete!\n\nType: ${exportType}\nFormat: ${format}\nRecords: ${exportData.metadata.recordCount}`);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Export Analytics Data</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.exportOptions}>
            <Text style={styles.optionGroupTitle}>Export Type</Text>
            {['alerts', 'incidents', 'performance', 'revenue', 'full'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.exportOption, exportType === type && styles.activeExportOption]}
                onPress={() => setExportType(type)}
              >
                <Text style={styles.exportOptionText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={styles.optionGroupTitle}>Format</Text>
            {['json', 'csv_ready'].map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={[styles.exportOption, format === fmt && styles.activeExportOption]}
                onPress={() => setFormat(fmt)}
              >
                <Text style={styles.exportOptionText}>{fmt.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {exportData && (
            <View style={styles.exportPreview}>
              <Text style={styles.previewTitle}>Export Preview</Text>
              <Text style={styles.previewText}>Records: {exportData.metadata.recordCount}</Text>
              <Text style={styles.previewText}>Timeframe: {timeframe}</Text>
              <Text style={styles.previewText}>Generated: {new Date().toLocaleString()}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Text style={styles.exportButtonText}>📊 Export Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Utility functions
const calculateTrend = (trendData) => {
  if (!trendData || trendData.length < 2) return 0;
  const recent = trendData.slice(-3).reduce((sum, point) => sum + point.count, 0) / 3;
  const earlier = trendData.slice(0, 3).reduce((sum, point) => sum + point.count, 0) / 3;
  return Math.round(recent - earlier);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  timeframeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeTimeframe: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  timeframeText: {
    fontSize: 12,
    color: '#636e72',
  },
  activeTimeframeText: {
    color: '#fff',
  },
  exportButton: {
    backgroundColor: '#00b894',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeViewTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0984e3',
  },
  viewIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  viewLabel: {
    fontSize: 13,
    color: '#636e72',
  },
  activeViewLabel: {
    color: '#0984e3',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  trendsContent: {
    flex: 1,
    padding: 16,
  },
  predictiveContent: {
    flex: 1,
    padding: 16,
  },
  financialContent: {
    flex: 1,
    padding: 16,
  },
  biContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  analysisTypeGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  activeAnalysisCard: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  analysisLabel: {
    fontSize: 14,
    color: '#636e72',
  },
  activeAnalysisLabel: {
    color: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    flex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  metricTrend: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    height: 200,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  chartPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 100,
  },
  chartBar: {
    backgroundColor: '#0984e3',
    width: 20,
    borderRadius: 2,
  },
  peakHoursGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  peakHourCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  peakHour: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  peakCount: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 2,
    textAlign: 'center',
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  riskMeter: {
    height: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 2,
  },
  riskTrend: {
    fontSize: 11,
    color: '#b2bec3',
  },
  highRiskList: {
    gap: 8,
  },
  highRiskCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e17055',
  },
  highRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  highRiskRoute: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  highRiskScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e17055',
  },
  riskFactorsList: {
    gap: 2,
  },
  riskFactor: {
    fontSize: 12,
    color: '#636e72',
  },
  riskFactorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riskFactorCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  factorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  factorImpact: {
    fontSize: 12,
    color: '#e17055',
    marginBottom: 2,
  },
  factorFrequency: {
    fontSize: 12,
    color: '#0984e3',
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationHeader: {
    alignItems: 'center',
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  recommendationIcon: {
    fontSize: 16,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
  },
  costsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  costCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    alignItems: 'center',
    flex: 1,
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  costTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  totalImpactCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  totalImpactValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e17055',
  },
  totalImpactLabel: {
    fontSize: 16,
    color: '#2d3436',
    marginTop: 4,
  },
  totalImpactPeriod: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  projectionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  projectionCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: 120,
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fd79a8',
  },
  projectionPeriod: {
    fontSize: 11,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 2,
  },
  costBreakdownBars: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  costBar: {
    minWidth: 10,
  },
  costBreakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    fontSize: 12,
    color: '#636e72',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    alignItems: 'center',
    flex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  kpiTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  kpiTrend: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  issuesList: {
    gap: 8,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  issueRank: {
    width: 24,
    height: 24,
    backgroundColor: '#e17055',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  issueContent: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  issueLocation: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 1,
  },
  issueSeverity: {
    fontSize: 11,
    color: '#e17055',
    fontWeight: 'bold',
  },
  issueType: {
    fontSize: 11,
    color: '#b2bec3',
  },
  strategicRecommendations: {
    gap: 8,
  },
  strategicCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strategicPriority: {
    width: 28,
    height: 28,
    backgroundColor: '#0984e3',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategicPriorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  strategicText: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
  },
  trendsOverview: {
    gap: 12,
  },
  trendIndicator: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 14,
    color: '#2d3436',
    flex: 1,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0984e3',
    marginRight: 12,
  },
  trendDirection: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  closeButton: {
    fontSize: 18,
    color: '#636e72',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  exportOptions: {
    marginBottom: 20,
  },
  optionGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
    marginTop: 16,
  },
  exportOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 6,
  },
  activeExportOption: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  exportOptionText: {
    fontSize: 14,
    color: '#2d3436',
  },
  exportPreview: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 4,
  },
});

export default AdvancedAnalytics;
