import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SmartReplyEngine = ({ 
  alert, 
  context, 
  onSelectReply, 
  onCustomize,
  supervisorHistory 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Generate smart reply suggestions based on alert context
  const generateSuggestions = useCallback(() => {
    setLoading(true);
    
    // Analyze alert type and severity
    const alertType = alert?.type || 'incident';
    const severity = alert?.severity || 'medium';
    const location = alert?.location || 'Unknown location';
    const affectedRoutes = alert?.affected_routes || [];
    
    const suggestions = [];

    // Context-aware templates based on alert type
    if (alertType === 'roadwork') {
      suggestions.push({
        id: 'rw1',
        category: 'immediate',
        icon: '🚧',
        title: 'Roadwork Alert - Drivers',
        preview: `Roadworks at ${location}. Routes ${affectedRoutes.join(', ')} affected.`,
        template: `⚠️ ROADWORK ALERT\n\nLocation: ${location}\nAffected Routes: ${affectedRoutes.join(', ')}\n\nDrivers on these routes should allow extra time and follow signed diversions.\n\nUpdates to follow.`,
        channels: ['drivers', 'control'],
        priority: 'high'
      });
      
      suggestions.push({
        id: 'rw2',
        category: 'update',
        icon: '📍',
        title: 'Diversion Route',
        preview: 'Use alternative route via...',
        template: `🔄 DIVERSION ROUTE\n\nDue to roadworks at ${location}:\n\nRoutes ${affectedRoutes.join(', ')} diverted via [SPECIFY ROUTE]\n\nExpect delays of approx [X] minutes.`,
        channels: ['drivers'],
        priority: 'medium'
      });
    }

    if (alertType === 'incident' || alertType === 'accident') {
      suggestions.push({
        id: 'inc1',
        category: 'immediate',
        icon: '🚨',
        title: 'Incident Alert - All Staff',
        preview: `Major incident at ${location}. Emergency response required.`,
        template: `🚨 INCIDENT ALERT\n\nLocation: ${location}\nType: ${alertType}\nSeverity: ${severity.toUpperCase()}\n\nAffected Routes: ${affectedRoutes.join(', ')}\n\nAll drivers avoid area. Control room coordinating response.`,
        channels: ['all', 'emergency'],
        priority: 'critical'
      });
    }

    // Add quick status updates
    suggestions.push({
      id: 'qs1',
      category: 'status',
      icon: '✅',
      title: 'Situation Resolved',
      preview: 'Alert cleared, normal service resuming',
      template: `✅ ALL CLEAR\n\n${location} - Situation now resolved.\n\nRoutes ${affectedRoutes.join(', ')} returning to normal service.\n\nThank you for your patience.`,
      channels: ['drivers', 'control'],
      priority: 'low'
    });

    // Learn from supervisor history
    if (supervisorHistory?.length > 0) {
      const recentMessages = supervisorHistory.slice(0, 3);
      recentMessages.forEach((msg, idx) => {
        suggestions.push({
          id: `hist${idx}`,
          category: 'recent',
          icon: '🕐',
          title: 'Previously Used',
          preview: msg.preview || msg.content.substring(0, 50) + '...',
          template: msg.content,
          channels: msg.channels || ['drivers'],
          priority: msg.priority || 'medium'
        });
      });
    }

    setSuggestions(suggestions);
    setLoading(false);
  }, [alert, supervisorHistory]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'immediate', label: 'Immediate', icon: 'flash' },
    { id: 'update', label: 'Updates', icon: 'refresh' },
    { id: 'status', label: 'Status', icon: 'checkmark-circle' },
    { id: 'recent', label: 'Recent', icon: 'time' }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating smart replies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Reply Suggestions</Text>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon} 
              size={16} 
              color={selectedCategory === cat.id ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Suggestions List */}
      <ScrollView style={styles.suggestionsScroll}>
        {filteredSuggestions.map(suggestion => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              suggestion.priority === 'critical' && styles.criticalCard,
              suggestion.priority === 'high' && styles.highCard
            ]}
            onPress={() => onSelectReply(suggestion)}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionTitleContainer}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={styles.channelTags}>
                  {suggestion.channels.map(channel => (
                    <View key={channel} style={styles.channelTag}>
                      <Text style={styles.channelTagText}>{channel}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.customizeButton}
                onPress={() => onCustomize(suggestion)}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionPreview}>{suggestion.preview}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="mic-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Voice Input</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onCustomize({})}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Custom Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
    color: '#333',
  },
  categoryScroll: {
    maxHeight: 50,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  suggestionsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  criticalCard: {
    borderColor: '#ff3b30',
    borderWidth: 2,
  },
  highCard: {
    borderColor: '#ff9500',
    borderWidth: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  channelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  channelTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelTagText: {
    fontSize: 11,
    color: '#1976d2',
  },
  customizeButton: {
    padding: 4,
  },
  suggestionPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SmartReplyEngine;