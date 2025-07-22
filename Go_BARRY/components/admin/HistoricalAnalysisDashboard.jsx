// Historical Analysis Dashboard Component
// View business period reports and analytics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Picker
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const HistoricalAnalysisDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodReport, setPeriodReport] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [error, setError] = useState(null);

  // Fetch current period
  useEffect(() => {
    fetchCurrentPeriod();
    fetchQuickStats();
  }, []);

  // Fetch period report when selection changes
  useEffect(() => {
    if (selectedPeriod && selectedYear) {
      fetchPeriodReport(selectedYear, selectedPeriod);
    }
  }, [selectedPeriod, selectedYear]);

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/historical/current-period');
      const data = await response.json();
      if (data.success) {
        setCurrentPeriod(data.current_period);
        setSelectedPeriod(data.current_period);
      }
    } catch (error) {
      console.error('Failed to fetch current period:', error);
    }
  };

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/historical/quick-stats');
      const data = await response.json();
      if (data.success) {
        setQuickStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
    }
  };

  const fetchPeriodReport = async (year, period) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://go-barry.onrender.com/api/historical/period-report/${year}/${period}`
      );
      const data = await response.json();
      if (data.success) {
        setPeriodReport(data.report);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch period report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderQuickStats = () => {
    if (!quickStats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Current Period Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quickStats.total_disruptions}</Text>
            <Text style={styles.statLabel}>Total Disruptions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quickStats.avg_duration}m</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quickStats.most_affected_route}</Text>
            <Text style={styles.statLabel}>Most Affected Route</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quickStats.critical_incidents}</Text>
            <Text style={styles.statLabel}>Critical Incidents</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => {
    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.sectionTitle}>Select Business Period</Text>
        <View style={styles.pickerRow}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Year:</Text>
            <Picker
              selectedValue={selectedYear}
              style={styles.picker}
              onValueChange={(value) => setSelectedYear(value)}
            >
              <Picker.Item label="2025" value={2025} />
              <Picker.Item label="2024" value={2024} />
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Period:</Text>
            <Picker
              selectedValue={selectedPeriod}
              style={styles.picker}
              onValueChange={(value) => setSelectedPeriod(value)}
            >
              {[...Array(13)].map((_, i) => (
                <Picker.Item 
                  key={i + 1} 
                  label={`Period ${i + 1}`} 
                  value={i + 1} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderDisruptionsByType = () => {
    if (!periodReport) return null;

    const pieData = [
      {
        name: 'Incidents',
        disruptions: periodReport.summary.by_type.incident,
        color: '#FF6384',
        legendFontColor: '#333',
        legendFontSize: 12
      },
      {
        name: 'Roadworks',
        disruptions: periodReport.summary.by_type.roadwork,
        color: '#36A2EB',
        legendFontColor: '#333',
        legendFontSize: 12
      },
      {
        name: 'Events',
        disruptions: periodReport.summary.by_type.event,
        color: '#FFCE56',
        legendFontColor: '#333',
        legendFontSize: 12
      }
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Disruptions by Type</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.webChart}>
            <Text>Incidents: {periodReport.summary.by_type.incident}</Text>
            <Text>Roadworks: {periodReport.summary.by_type.roadwork}</Text>
            <Text>Events: {periodReport.summary.by_type.event}</Text>
          </View>
        ) : (
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            accessor="disruptions"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        )}
      </View>
    );
  };

  const renderTopAffectedRoutes = () => {
    if (!periodReport || !periodReport.route_analysis.top_5_routes) return null;

    const top5 = periodReport.route_analysis.top_5_routes;
    
    return (
      <View style={styles.routeContainer}>
        <Text style={styles.sectionTitle}>Most Affected Routes</Text>
        {top5.map((route, index) => (
          <View key={route.route} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeNumber}>Route {route.route}</Text>
              <Text style={styles.routeCount}>{route.count} disruptions</Text>
            </View>
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>
                Total: {route.totalMinutes}m | Avg: {route.avgMinutes}m
              </Text>
              <Text style={styles.routeSeverity}>
                Max Severity: {route.maxSeverity}/10
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTimePatterns = () => {
    if (!periodReport || !periodReport.time_patterns) return null;

    const patterns = periodReport.time_patterns;
    
    return (
      <View style={styles.patternsContainer}>
        <Text style={styles.sectionTitle}>Time Patterns</Text>
        <View style={styles.patternCard}>
          <Text style={styles.patternLabel}>Peak Hour:</Text>
          <Text style={styles.patternValue}>
            {patterns.peak_hour}:00 ({patterns.peak_hour_count} disruptions)
          </Text>
        </View>
        <View style={styles.patternCard}>
          <Text style={styles.patternLabel}>Peak Day:</Text>
          <Text style={styles.patternValue}>
            {patterns.peak_day} ({patterns.peak_day_count} disruptions)
          </Text>
        </View>
      </View>
    );
  };

  const downloadReport = async () => {
    // TODO: Implement PDF/Excel export
    alert('Report export feature coming soon!');
  };

  if (loading && !quickStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading historical data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historical Analysis</Text>
        <TouchableOpacity style={styles.exportButton} onPress={downloadReport}>
          <Text style={styles.exportButtonText}>Export Report</Text>
        </TouchableOpacity>
      </View>

      {renderQuickStats()}
      {renderPeriodSelector()}

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : periodReport ? (
        <>
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>
              Period {selectedPeriod}, {selectedYear} Summary
            </Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {periodReport.summary.total_disruptions}
                </Text>
                <Text style={styles.summaryLabel}>Total Disruptions</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {periodReport.summary.avg_duration_minutes}m
                </Text>
                <Text style={styles.summaryLabel}>Avg Duration</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {periodReport.summary.total_disruption_minutes}m
                </Text>
                <Text style={styles.summaryLabel}>Total Minutes</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {periodReport.route_analysis.total_routes_affected}
                </Text>
                <Text style={styles.summaryLabel}>Routes Affected</Text>
              </View>
            </View>
          </View>

          {renderDisruptionsByType()}
          {renderTopAffectedRoutes()}
          {renderTimePatterns()}
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  exportButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  selectorContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  picker: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 5
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  loader: {
    marginVertical: 20
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  errorText: {
    color: '#c62828'
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2'
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  webChart: {
    padding: 10
  },
  routeContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  routeCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  routeCount: {
    fontSize: 14,
    color: '#666'
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  routeStat: {
    fontSize: 12,
    color: '#666'
  },
  routeSeverity: {
    fontSize: 12,
    color: '#ff6b6b'
  },
  patternsContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  patternCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  patternLabel: {
    fontSize: 14,
    color: '#666'
  },
  patternValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  }
});

export default HistoricalAnalysisDashboard;
