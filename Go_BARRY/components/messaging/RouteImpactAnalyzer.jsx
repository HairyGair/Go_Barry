// components/messaging/RouteImpactAnalyzer.jsx
// Visual route impact analysis component for Message Distribution Centre Phase 5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RouteImpactAnalyzer = ({ 
  location, 
  onRoutesAnalyzed, 
  visible = true,
  radius = 500 
}) => {
  const [loading, setLoading] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [expandedRoute, setExpandedRoute] = useState(null);

  // Run analysis when location changes
  useEffect(() => {
    if (location && visible) {
      analyzeRouteImpact();
    }
  }, [location, visible]);

  // Analyze route impact using enhanced GTFS matcher
  const analyzeRouteImpact = async () => {
    if (!location) return;

    setLoading(true);
    try {
      // Call backend API for route analysis
      const endpoint = '/api/messages/analyze-routes';
      const requestBody = {
        location: typeof location === 'string' ? location : undefined,
        coordinates: typeof location === 'object' ? location : undefined,
        radius
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        // Transform backend response to include enhanced analysis
        const enhancedAnalysis = {
          ...data,
          routes: data.suggestedRoutes.map(routeId => ({
            routeId,
            routeName: routeId,
            impactLevel: calculateImpactLevel(routeId),
            estimatedPassengers: getPassengerEstimate(routeId),
            diversionSuggestions: getDiversionSuggestions(routeId),
            operationalPriority: getOperationalPriority(routeId),
            confidence: data.confidence === 'high' ? 0.9 : 0.7
          }))
        };
        
        setRouteAnalysis(enhancedAnalysis);
        setSelectedRoutes([]); // Reset selection
      } else {
        // Fallback to mock analysis if API fails
        const mockAnalysis = createMockAnalysis(location);
        setRouteAnalysis(mockAnalysis);
      }
    } catch (error) {
      console.error('Route analysis error:', error);
      // Create fallback analysis
      const mockAnalysis = createMockAnalysis(location);
      setRouteAnalysis(mockAnalysis);
    } finally {
      setLoading(false);
    }
  };

  // Create mock analysis for fallback
  const createMockAnalysis = (location) => {
    const locationStr = typeof location === 'string' ? location.toLowerCase() : 'unknown location';
    
    let routes = [];
    if (locationStr.includes('high level bridge')) {
      routes = ['1', '10', '10A', '11', '12', 'Q3', '21', '56', '57', '94'];
    } else if (locationStr.includes('a1')) {
      routes = ['21', 'X21', '309', '310', '311'];
    } else if (locationStr.includes('central station')) {
      routes = ['10', '11', '12', '21', '56', '57'];
    } else {
      routes = ['21', '1', '12']; // Default routes
    }

    return {
      success: true,
      location: locationStr,
      totalRoutes: routes.length,
      routes: routes.map(routeId => ({
        routeId,
        routeName: routeId,
        impactLevel: calculateImpactLevel(routeId),
        estimatedPassengers: getPassengerEstimate(routeId),
        diversionSuggestions: getDiversionSuggestions(routeId),
        operationalPriority: getOperationalPriority(routeId),
        confidence: 0.8
      }))
    };
  };

  // Helper functions for route analysis
  const calculateImpactLevel = (routeId) => {
    const highImpact = ['21', 'X21', '1', '10', '11', '12', 'Q3'];
    const mediumImpact = ['56', '57', '58', '309', '310', '311'];
    
    if (highImpact.includes(routeId)) return 'high';
    if (mediumImpact.includes(routeId)) return 'medium';
    return 'low';
  };

  const getPassengerEstimate = (routeId) => {
    const estimates = {
      '21': 'Very High (800+ daily)',
      'X21': 'High (500+ daily)',
      '1': 'High (600+ daily)',
      '10': 'Medium (300+ daily)',
      '11': 'Medium (300+ daily)',
      '12': 'Medium (400+ daily)',
      'Q3': 'Medium (350+ daily)',
      '56': 'Medium (250+ daily)',
      '57': 'Medium (250+ daily)'
    };
    return estimates[routeId] || 'Low-Medium (50-200 daily)';
  };

  const getDiversionSuggestions = (routeId) => {
    const suggestions = {
      '21': ['Use X21 for express service', 'Via A167 if A1 affected'],
      'X21': ['Use service 21 for local stops', 'Via Durham if direct route blocked'],
      '1': ['Use Metro for Tyne crossing', 'Services 12/Q3 for city centre'],
      '10': ['Use services 11/12 for similar route', 'Metro for river crossing'],
      '11': ['Use services 10/12 for alternative', 'Central Station for connections'],
      '12': ['Use services 10/11 for similar areas', 'Q3 for city centre'],
      'Q3': ['Use services 12/21 for city centre', 'Metro for Quayside area']
    };
    return suggestions[routeId] || ['Monitor for alternative routes', 'Check live departures'];
  };

  const getOperationalPriority = (routeId) => {
    const critical = ['21', 'X21', '1', 'Q3'];
    const high = ['10', '11', '12', '56', '57', '58'];
    
    if (critical.includes(routeId)) return 'Critical';
    if (high.includes(routeId)) return 'High';
    return 'Standard';
  };

  // Handle route selection
  const toggleRouteSelection = (routeId) => {
    setSelectedRoutes(prev => 
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  // Select all routes of a specific impact level
  const selectByImpactLevel = (impactLevel) => {
    const routesOfLevel = routeAnalysis.routes
      .filter(route => route.impactLevel === impactLevel)
      .map(route => route.routeId);
    
    setSelectedRoutes(prev => {
      const newSelection = [...new Set([...prev, ...routesOfLevel])];
      return newSelection;
    });
  };

  // Apply selected routes
  const applySelection = () => {
    if (selectedRoutes.length === 0) {
      Alert.alert('No Routes Selected', 'Please select at least one route to continue.');
      return;
    }

    if (onRoutesAnalyzed) {
      onRoutesAnalyzed({
        selectedRoutes,
        analysis: routeAnalysis,
        location
      });
    }
  };

  // Render impact level badge
  const renderImpactBadge = (impactLevel) => {
    const colors = {
      high: { bg: '#FEE2E2', text: '#DC2626', icon: 'warning' },
      medium: { bg: '#FEF3C7', text: '#F59E0B', icon: 'alert-circle' },
      low: { bg: '#DBEAFE', text: '#2563EB', icon: 'information-circle' }
    };
    
    const color = colors[impactLevel] || colors.low;
    
    return (
      <View style={[styles.impactBadge, { backgroundColor: color.bg }]}>
        <Ionicons name={color.icon} size={12} color={color.text} />
        <Text style={[styles.impactBadgeText, { color: color.text }]}>
          {impactLevel.toUpperCase()}
        </Text>
      </View>
    );
  };

  // Render route card
  const renderRouteCard = (route) => {
    const isSelected = selectedRoutes.includes(route.routeId);
    const isExpanded = expandedRoute === route.routeId;
    
    return (
      <View key={route.routeId} style={styles.routeCard}>
        <TouchableOpacity
          style={[styles.routeHeader, isSelected && styles.routeHeaderSelected]}
          onPress={() => toggleRouteSelection(route.routeId)}
        >
          <View style={styles.routeMainInfo}>
            <View style={styles.routeNumber}>
              <Text style={styles.routeNumberText}>{route.routeName}</Text>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeTitle}>Service {route.routeName}</Text>
              <Text style={styles.routePriority}>{route.operationalPriority} Priority</Text>
            </View>
          </View>
          
          <View style={styles.routeMeta}>
            {renderImpactBadge(route.impactLevel)}
            <View style={styles.selectionIndicator}>
              <Ionicons 
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
                size={24} 
                color={isSelected ? '#10B981' : '#9CA3AF'} 
              />
            </View>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.routeExpandedInfo}>
            <View style={styles.expandedRow}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.expandedText}>{route.estimatedPassengers}</Text>
            </View>
            
            <View style={styles.diversionSection}>
              <Text style={styles.diversionTitle}>Suggested Diversions:</Text>
              {route.diversionSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.diversionItem}>
                  <Ionicons name="arrow-forward" size={12} color="#6B7280" />
                  <Text style={styles.diversionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render impact summary
  const renderImpactSummary = () => {
    if (!routeAnalysis) return null;

    const highImpact = routeAnalysis.routes.filter(r => r.impactLevel === 'high').length;
    const mediumImpact = routeAnalysis.routes.filter(r => r.impactLevel === 'medium').length;
    const lowImpact = routeAnalysis.routes.filter(r => r.impactLevel === 'low').length;

    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Impact Analysis Summary</Text>
        <View style={styles.summaryGrid}>
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => selectByImpactLevel('high')}
          >
            <Text style={styles.summaryNumber}>{highImpact}</Text>
            <Text style={styles.summaryLabel}>High Impact</Text>
            <Text style={styles.summarySubtext}>Critical routes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => selectByImpactLevel('medium')}
          >
            <Text style={styles.summaryNumber}>{mediumImpact}</Text>
            <Text style={styles.summaryLabel}>Medium Impact</Text>
            <Text style={styles.summarySubtext}>Important routes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => selectByImpactLevel('low')}
          >
            <Text style={styles.summaryNumber}>{lowImpact}</Text>
            <Text style={styles.summaryLabel}>Low Impact</Text>
            <Text style={styles.summarySubtext}>Standard routes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Impact Analysis</Text>
        <Text style={styles.headerSubtitle}>
          {typeof location === 'string' ? location : 'Coordinate-based analysis'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Analyzing route impacts...</Text>
        </View>
      ) : routeAnalysis ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderImpactSummary()}
          
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>
              Affected Routes ({routeAnalysis.routes.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap routes to include in your message
            </Text>
            
            {routeAnalysis.routes.map(renderRouteCard)}
          </View>

          <View style={styles.footer}>
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionText}>
                {selectedRoutes.length} routes selected
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.applyButton,
                selectedRoutes.length === 0 && styles.applyButtonDisabled
              ]}
              onPress={applySelection}
              disabled={selectedRoutes.length === 0}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Apply Selection</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>
            No location provided for analysis
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  routesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  routeHeaderSelected: {
    backgroundColor: '#EFF6FF',
  },
  routeMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeNumber: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  routeDetails: {
    marginLeft: 16,
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  routePriority: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectionIndicator: {
    padding: 4,
  },
  routeExpandedInfo: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expandedText: {
    fontSize: 14,
    color: '#4B5563',
  },
  diversionSection: {
    marginTop: 8,
  },
  diversionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  diversionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingLeft: 8,
  },
  diversionText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectionSummary: {
    flex: 1,
  },
  selectionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default RouteImpactAnalyzer;