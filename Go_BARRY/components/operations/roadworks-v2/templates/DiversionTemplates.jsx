/*
 * Go Barry - Diversion Templates Management
 * Reusable diversion templates for common roadwork scenarios
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';
import TemplateCard from './TemplateCard';
import CreateTemplateModal from './CreateTemplateModal';

const DiversionTemplates = ({ baseUrl, sessionId, supervisorName }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    successfulTemplates: 0,
    averageRating: 0,
    mostUsedRoute: null
  });
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'rating', 'usage'

  // Fetch all templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/diversion-templates`, {
        headers: {
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        }
      });

      if (response.ok) {
        const data = await response.json();
        const templatesData = data.templates || [];
        setTemplates(templatesData);
        
        // Extract unique routes from affected_routes arrays
        const uniqueRoutes = [...new Set(
          templatesData.flatMap(t => t.affected_routes || [])
        )].filter(Boolean).sort();
        setRoutes(uniqueRoutes);
        
        // Calculate stats
        calculateTemplateStats(templatesData);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      Alert.alert('Error', 'Failed to load diversion templates');
    } finally {
      setLoading(false);
    }
  };

  // Calculate template statistics
  const calculateTemplateStats = (templatesData) => {
    const total = templatesData.length;
    const successful = templatesData.filter(t => (t.success_rating || 0) >= 0.7).length;
    const avgRating = total > 0 ? templatesData.reduce((sum, t) => sum + (t.success_rating || 0), 0) / total : 0;
    
    // Find most used route
    const routeUsage = {};
    templatesData.forEach(t => {
      (t.affected_routes || []).forEach(route => {
        routeUsage[route] = (routeUsage[route] || 0) + (t.usage_count || 0);
      });
    });
    
    const mostUsedRoute = Object.keys(routeUsage).reduce((a, b) => 
      routeUsage[a] > routeUsage[b] ? a : b, null
    );
    
    setStats({
      totalTemplates: total,
      successfulTemplates: successful,
      averageRating: avgRating,
      mostUsedRoute
    });
  };

  // Handle template creation
  const handleCreateTemplate = async (templateData) => {
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/diversion-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          ...templateData,
          created_by: supervisorName
        })
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', 'Diversion template created successfully');
        setShowCreateModal(false);
        fetchTemplates(); // Refresh list
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      Alert.alert('Error', 'Failed to create diversion template');
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${baseUrl}/api/roadworks-v2/diversion-templates/${templateId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'x-session-id': sessionId
                  }
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Template deleted successfully');
                fetchTemplates();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          }
        }
      ]
    );
  };

  // Filter and sort templates
  const getFilteredTemplates = () => {
    let filtered = templates.filter(template => {
      const matchesSearch = searchQuery === '' || 
        (template.route_description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.diversion_route || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.diversion_details?.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRoute = selectedRoute === 'all' || 
        (template.affected_routes || []).includes(selectedRoute);
      
      return matchesSearch && matchesRoute;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.success_rating || 0) - (a.success_rating || 0);
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'recent':
        default:
          return new Date(b.last_used || b.created_at) - new Date(a.last_used || a.created_at);
      }
    });

    return filtered;
  };

  // Handle template rating update
  const handleRateTemplate = async (templateId, rating) => {
    try {
      const response = await fetch(`${baseUrl}/api/diversion-templates/${templateId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        Alert.alert('Success', 'Template rating updated');
        fetchTemplates(); // Refresh to show updated rating
      } else {
        throw new Error('Failed to update rating');
      }
    } catch (error) {
      console.error('Failed to rate template:', error);
      Alert.alert('Error', 'Failed to update template rating');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading diversion templates...</Text>
      </View>
    );
  }

  return (
    <View style={roadworksStyles.container}>
      {/* Header */}
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <View>
            <Text style={roadworksStyles.sectionTitle}>Diversion Templates</Text>
            <Text style={roadworksStyles.textMuted}>
              {stats.totalTemplates} templates • {stats.successfulTemplates} successful • Avg rating {stats.averageRating.toFixed(1)}/5
            </Text>
          </View>
          
          <Pressable
            style={[roadworksStyles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={16} color={colors.textPrimary} />
            <Text style={roadworksStyles.actionButtonText}>Create Template</Text>
          </Pressable>
        </View>

        {/* Statistics Cards */}
        {stats.totalTemplates > 0 && (
          <View style={[roadworksStyles.statsContainer, { marginBottom: spacing.md }]}>
            <View style={roadworksStyles.statCard}>
              <Text style={roadworksStyles.statValue}>{stats.totalTemplates}</Text>
              <Text style={roadworksStyles.statLabel}>Total Templates</Text>
            </View>
            <View style={roadworksStyles.statCard}>
              <Text style={roadworksStyles.statValue}>{stats.successfulTemplates}</Text>
              <Text style={roadworksStyles.statLabel}>High Success</Text>
            </View>
            <View style={roadworksStyles.statCard}>
              <Text style={roadworksStyles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={roadworksStyles.statLabel}>Avg Rating</Text>
            </View>
            {stats.mostUsedRoute && (
              <View style={roadworksStyles.statCard}>
                <Text style={roadworksStyles.statValue}>{stats.mostUsedRoute}</Text>
                <Text style={roadworksStyles.statLabel}>Top Route</Text>
              </View>
            )}
          </View>
        )}

        {/* Search and Filters */}
        <View style={roadworksStyles.searchContainer}>
          <View style={[roadworksStyles.searchBox, { flex: 1 }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={roadworksStyles.searchInput}
              placeholder="Search templates..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={[roadworksStyles.filterDropdown, { marginLeft: spacing.sm }]}>
            <Pressable
              style={roadworksStyles.filterButton}
              onPress={() => {/* Show route picker */}}
            >
              <Text style={roadworksStyles.filterButtonText}>
                {selectedRoute === 'all' ? 'All Routes' : `Route ${selectedRoute}`}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={[roadworksStyles.filterDropdown, { marginLeft: spacing.sm }]}>
            <Pressable
              style={roadworksStyles.filterButton}
              onPress={() => {
                const sortOptions = ['recent', 'rating', 'usage'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <Text style={roadworksStyles.filterButtonText}>
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'rating' ? 'Rating' : 'Usage'}
              </Text>
              <Ionicons name="swap-vertical" size={12} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Templates List */}
      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {getFilteredTemplates().length === 0 ? (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="folder-open" size={48} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Templates Found</Text>
            <Text style={roadworksStyles.emptyDescription}>
              {searchQuery || selectedRoute !== 'all' 
                ? 'Try adjusting your filters'
                : 'Create your first diversion template to get started'}
            </Text>
          </View>
        ) : (
          <View style={roadworksStyles.gridContainer}>
            {getFilteredTemplates().map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onPress={() => setSelectedTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onRate={(rating) => handleRateTemplate(template.id, rating)}
                onDuplicate={() => {
                  setSelectedTemplate({ 
                    ...template, 
                    route_description: `${template.route_description} (Copy)`,
                    id: null // Clear ID for new template
                  });
                  setShowCreateModal(true);
                }}
                showActions={true}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Template Modal */}
      <CreateTemplateModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
        }}
        onSave={handleCreateTemplate}
        initialData={selectedTemplate}
        routes={routes}
      />
    </View>
  );
};

export default DiversionTemplates;