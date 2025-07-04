// components/messaging/DiversionSuggestions.jsx
// Smart diversion recommendations component for Message Distribution Centre Phase 5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DiversionSuggestions = ({ 
  location, 
  affectedRoutes = [], 
  onSuggestionsSelected,
  visible = true 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [customDiversion, setCustomDiversion] = useState('');

  // Generate diversion suggestions when routes change
  useEffect(() => {
    if (affectedRoutes.length > 0 && location) {
      generateDiversionSuggestions();
    }
  }, [affectedRoutes, location]);

  // Generate intelligent diversion suggestions
  const generateDiversionSuggestions = () => {
    const locationStr = typeof location === 'string' ? location.toLowerCase() : '';
    const diversionSuggestions = [];

    // Location-specific diversions
    if (locationStr.includes('high level bridge')) {
      diversionSuggestions.push({
        id: 'hlb_metro',
        type: 'alternative_transport',
        title: 'Use Metro for Tyne Crossing',
        description: 'Direct customers to use Metro between Newcastle and Gateshead',
        routes: ['all'],
        priority: 'high',
        icon: 'train',
        estimatedDelay: 'No additional delay'
      });

      diversionSuggestions.push({
        id: 'hlb_central_station',
        type: 'terminus_change',
        title: 'Terminate at Central Station',
        description: 'Services to/from Eldon Square should start/terminate at Central Station',
        routes: ['10', '11', '12', '21', '56', '57', '58'],
        priority: 'high',
        icon: 'location',
        estimatedDelay: '5-10 minutes'
      });

      diversionSuggestions.push({
        id: 'hlb_gateshead_suspension',
        type: 'service_suspension',
        title: 'Suspend Gateshead Connections',
        description: 'All connections to Gateshead Interchange suspended during closure',
        routes: ['all'],
        priority: 'critical',
        icon: 'stop-circle',
        estimatedDelay: 'Service suspended'
      });

      diversionSuggestions.push({
        id: 'hlb_four_lane_ends',
        type: 'alternative_route',
        title: 'Four Lane Ends Alternative',
        description: 'Direct customers to Four Lane Ends for services 1, 309, 310, 311 to Gateshead',
        routes: ['all'],
        priority: 'medium',
        icon: 'swap-horizontal',
        estimatedDelay: '15-20 minutes'
      });
    }

    if (locationStr.includes('a1')) {
      diversionSuggestions.push({
        id: 'a1_a19_diversion',
        type: 'route_diversion',
        title: 'A19 Diversion Route',
        description: 'Use A19 as primary alternative for north-south travel',
        routes: ['21', 'X21', '685'],
        priority: 'high',
        icon: 'map',
        estimatedDelay: '10-15 minutes'
      });

      diversionSuggestions.push({
        id: 'a1_local_roads',
        type: 'route_diversion',
        title: 'Local Road Alternative',
        description: 'Via A167 and local roads through Washington/Birtley',
        routes: ['21', 'X21'],
        priority: 'medium',
        icon: 'navigate',
        estimatedDelay: '20-25 minutes'
      });
    }

    if (locationStr.includes('central station')) {
      diversionSuggestions.push({
        id: 'cs_haymarket',
        type: 'terminus_change',
        title: 'Use Haymarket Bus Station',
        description: 'Divert applicable services to Haymarket instead of Central Station',
        routes: ['10', '11', '12'],
        priority: 'medium',
        icon: 'business',
        estimatedDelay: '5-8 minutes'
      });

      diversionSuggestions.push({
        id: 'cs_eldon_square',
        type: 'terminus_change',
        title: 'Extend to Eldon Square',
        description: 'Services normally terminating at Central Station continue to Eldon Square',
        routes: ['21', '56', '57', '58'],
        priority: 'low',
        icon: 'arrow-forward',
        estimatedDelay: '3-5 minutes'
      });
    }

    if (locationStr.includes('a19')) {
      diversionSuggestions.push({
        id: 'a19_a1_alternative',
        type: 'route_diversion',
        title: 'A1 Alternative Route',
        description: 'Use A1 corridor for north-south travel',
        routes: ['309', '310', '311'],
        priority: 'high',
        icon: 'map',
        estimatedDelay: '15-20 minutes'
      });

      diversionSuggestions.push({
        id: 'a19_coast_road',
        type: 'route_diversion',
        title: 'Coast Road (A1058)',
        description: 'Use A1058 Coast Road where applicable',
        routes: ['1', '19'],
        priority: 'medium',
        icon: 'water',
        estimatedDelay: '10-12 minutes'
      });
    }

    // Route-specific diversions
    affectedRoutes.forEach(routeId => {
      const routeSpecificSuggestions = getRouteSpecificDiversions(routeId);
      diversionSuggestions.push(...routeSpecificSuggestions);
    });

    // Remove duplicates and sort by priority
    const uniqueSuggestions = diversionSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.id === suggestion.id)
    );

    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    setSuggestions(sortedSuggestions);
    setSelectedSuggestions([]); // Reset selection
  };

  // Get route-specific diversion suggestions
  const getRouteSpecificDiversions = (routeId) => {
    const routeDiversions = {
      '21': [
        {
          id: `${routeId}_x21_alternative`,
          type: 'service_alternative',
          title: 'Use X21 Express Service',
          description: 'Direct passengers to X21 for faster Durham-Newcastle service',
          routes: [routeId],
          priority: 'high',
          icon: 'flash',
          estimatedDelay: 'Potentially faster'
        }
      ],
      'X21': [
        {
          id: `${routeId}_21_alternative`,
          type: 'service_alternative',
          title: 'Use Service 21',
          description: 'Use regular 21 service for local stops not served by X21',
          routes: [routeId],
          priority: 'medium',
          icon: 'location',
          estimatedDelay: '5-10 minutes slower'
        }
      ],
      '1': [
        {
          id: `${routeId}_metro_alternative`,
          type: 'alternative_transport',
          title: 'Metro Yellow Line',
          description: 'Use Metro for similar route coverage',
          routes: [routeId],
          priority: 'high',
          icon: 'train',
          estimatedDelay: 'Similar timing'
        }
      ],
      '10': [
        {
          id: `${routeId}_11_12_alternative`,
          type: 'service_alternative',
          title: 'Services 11 or 12',
          description: 'Use services 11 or 12 for similar coverage',
          routes: [routeId],
          priority: 'medium',
          icon: 'swap-horizontal',
          estimatedDelay: '5-8 minutes'
        }
      ]
    };

    return routeDiversions[routeId] || [];
  };

  // Toggle suggestion selection
  const toggleSuggestion = (suggestionId) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  // Apply selected suggestions
  const applySuggestions = () => {
    if (selectedSuggestions.length === 0) {
      Alert.alert('No Suggestions Selected', 'Please select at least one diversion suggestion.');
      return;
    }

    const selectedSuggestionData = suggestions.filter(s => 
      selectedSuggestions.includes(s.id)
    );

    if (onSuggestionsSelected) {
      onSuggestionsSelected({
        selectedSuggestions: selectedSuggestionData,
        customDiversion,
        location,
        affectedRoutes
      });
    }
  };

  // Render priority badge
  const renderPriorityBadge = (priority) => {
    const colors = {
      critical: { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' },
      high: { bg: '#FEF3C7', text: '#F59E0B', icon: 'warning' },
      medium: { bg: '#DBEAFE', text: '#2563EB', icon: 'information-circle' },
      low: { bg: '#F3F4F6', text: '#6B7280', icon: 'ellipse' }
    };
    
    const color = colors[priority] || colors.low;
    
    return (
      <View style={[styles.priorityBadge, { backgroundColor: color.bg }]}>
        <Ionicons name={color.icon} size={12} color={color.text} />
        <Text style={[styles.priorityText, { color: color.text }]}>
          {priority.toUpperCase()}
        </Text>
      </View>
    );
  };

  // Render suggestion card
  const renderSuggestionCard = (suggestion) => {
    const isSelected = selectedSuggestions.includes(suggestion.id);
    
    return (
      <TouchableOpacity
        key={suggestion.id}
        style={[styles.suggestionCard, isSelected && styles.suggestionCardSelected]}
        onPress={() => toggleSuggestion(suggestion.id)}
      >
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionIcon}>
            <Ionicons name={suggestion.icon} size={20} color="#2563EB" />
          </View>
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
          </View>
          <View style={styles.suggestionMeta}>
            {renderPriorityBadge(suggestion.priority)}
            <Ionicons 
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
              size={24} 
              color={isSelected ? '#10B981' : '#9CA3AF'} 
            />
          </View>
        </View>

        <View style={styles.suggestionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delay:</Text>
            <Text style={styles.detailValue}>{suggestion.estimatedDelay}</Text>
          </View>
          
          {suggestion.routes[0] !== 'all' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Applicable Routes:</Text>
              <Text style={styles.detailValue}>{suggestion.routes.join(', ')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diversion Suggestions</Text>
        <Text style={styles.headerSubtitle}>
          Smart recommendations for {affectedRoutes.length} affected routes
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {suggestions.length > 0 ? (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>
              Recommended Diversions ({suggestions.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Select appropriate diversions for your message
            </Text>
            
            {suggestions.map(renderSuggestionCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              No specific diversions available for this location
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionText}>
              {selectedSuggestions.length} diversions selected
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.applyButton,
              selectedSuggestions.length === 0 && styles.applyButtonDisabled
            ]}
            onPress={applySuggestions}
            disabled={selectedSuggestions.length === 0}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>Apply Diversions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  suggestionsSection: {
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
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  suggestionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  suggestionMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
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
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default DiversionSuggestions;