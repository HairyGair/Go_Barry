// Go_BARRY/components/AnalyticsDashboard.jsx
// Intelligent Analytics Dashboard for Go BARRY

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const AnalyticsDashboard = ({ supervisorId, sessionId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [insights, setInsights] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [vulnerableRoutes, setVulnerableRoutes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const responses = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/intelligence/health`),
        fetch(`${API_BASE_URL}/api/intelligence/analytics/insights`),
        fetch(`${API_BASE_URL}/api/intelligence/analytics/hotspots`),
        fetch(`${API_BASE_URL}/api/intelligence/analytics/route-vulnerability`),
        fetch(`${API_BASE_URL}/api/intelligence/analytics/recommendations`)
      ]);

      const [healthRes, insightsRes, hotspotsRes, routesRes, recRes] = responses;

      if (healthRes.status === 'fulfilled') {
        const data = await healthRes.value.json();
        if (data.success) setSystemHealth(data.health);
      }

      if (hotspotsRes.status === 'fulfilled') {
        const data = await hotspotsRes.value.json();
        if (data.success) setHotspots(data.hotspots || []);
      }

      if (routesRes.status === 'fulfilled') {
        const data = await routesRes.value.json();
        if (data.success) setVulnerableRoutes(data.vulnerableRoutes || []);
      }

      if (recRes.status === 'fulfilled') {
        const data = await recRes.value.json();
        if (data.success) setRecommendations(data.recommendations || []);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
      case 'healthy': return '#10B981';
      case 'degraded': return '#F59E0B';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#DC2626';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        {systemHealth ? (
          <View style={styles.healthCard}>
            <Text style={[styles.healthStatus, { color: getStatusColor(systemHealth.status) }]}>
              {systemHealth.status.toUpperCase()}
            </Text>
            <Text style={styles.healthDetail}>
              Data Sources: {systemHealth.components?.dataSources?.activeSources || 0}/
              {systemHealth.components?.dataSources?.totalSources || 0}
            </Text>
          </View>
        ) : (
          <Text style={styles.noData}>Loading...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="location" size={24} color="#EF4444" />
            <Text style={styles.metricValue}>{hotspots.length}</Text>
            <Text style={styles.metricLabel}>Hotspots</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="bus" size={24} color="#F59E0B" />
            <Text style={styles.metricValue}>{vulnerableRoutes.length}</Text>
            <Text style={styles.metricLabel}>Vulnerable Routes</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {recommendations.slice(0, 3).map((rec, index) => (
          <View key={index} style={[styles.recommendationCard, { borderLeftColor: getPriorityColor(rec.priority) }]}>
            <Text style={styles.recTitle}>{rec.title}</Text>
            <Text style={styles.recDescription}>{rec.description}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
              <Text style={styles.priorityText}>{rec.priority}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const HotspotsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traffic Hotspots</Text>
        {hotspots.map((hotspot, index) => (
          <View key={index} style={styles.hotspotCard}>
            <Text style={styles.hotspotLocation}>{hotspot.location}</Text>
            <Text style={styles.hotspotRisk}>Risk Score: {Math.round(hotspot.riskScore)}</Text>
            <Text style={styles.hotspotIncidents}>{hotspot.incidentCount} incidents</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const RoutesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vulnerable Routes</Text>
        {vulnerableRoutes.map((route, index) => (
          <View key={index} style={styles.routeCard}>
            <Text style={styles.routeNumber}>Route {route.route}</Text>
            <Text style={styles.routeScore}>Score: {Math.round(route.vulnerabilityScore)}</Text>
            <Text style={styles.routeDetails}>
              {route.incidentCount} incidents, {Math.round(route.averageDelay)}min avg delay
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['overview', 'hotspots', 'routes'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'hotspots' && <HotspotsTab />}
          {activeTab === 'routes' && <RoutesTab />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeButton: { padding: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  tabContent: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  healthCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8 },
  healthStatus: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  healthDetail: { fontSize: 14, color: '#6B7280' },
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginVertical: 8 },
  metricLabel: { fontSize: 12, color: '#6B7280' },
  recommendationCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, borderLeftWidth: 4, marginBottom: 12 },
  recTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  recDescription: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  priorityText: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },
  hotspotCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 12 },
  hotspotLocation: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  hotspotRisk: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  hotspotIncidents: { fontSize: 12, color: '#6B7280' },
  routeCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 12 },
  routeNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  routeScore: { fontSize: 14, color: '#F59E0B', fontWeight: '500' },
  routeDetails: { fontSize: 12, color: '#6B7280' },
  noData: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 24 }
});

export default AnalyticsDashboard;