/*
 * Go Barry - Advanced Filter Panel Component
 * Modern filtering interface with multiple criteria and saved filters
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const FilterPanel = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onSaveFilter,
  savedFilters = [],
  visible = true,
  availableRoutes = [],
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    severity: true,
    source: false,
    routes: false,
    dates: false
  });

  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update filter value
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  // Toggle array filter (for multi-select)
  const toggleArrayFilter = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery('');
    onClearFilters();
  };

  // Apply search with debounce
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    // Simple debounce - in production, use proper debounce
    setTimeout(() => {
      updateFilter('searchQuery', text);
    }, 300);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.severity && filters.severity !== 'all') count++;
    if (filters.source && filters.source !== 'all') count++;
    if (filters.dateRange && filters.dateRange !== 'all') count++;
    if (filters.trafficManagement && filters.trafficManagement !== 'all') count++;
    if (filters.affectedRoutes && filters.affectedRoutes.length > 0) count++;
    if (filters.searchQuery && filters.searchQuery.length > 0) count++;
    return count;
  };

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: 'list' },
    { value: 'active', label: 'Active', icon: 'play-circle', color: colors.success },
    { value: 'planned', label: 'Planned', icon: 'calendar', color: colors.warning },
    { value: 'completed', label: 'Completed', icon: 'checkmark-done', color: colors.textMuted },
    { value: 'monitoring', label: 'Monitoring', icon: 'eye', color: colors.info },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle', color: colors.textMuted }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severity', icon: 'speedometer' },
    { value: 'critical', label: 'Critical', icon: 'warning', color: colors.critical },
    { value: 'high', label: 'High', icon: 'alert', color: colors.error },
    { value: 'medium', label: 'Medium', icon: 'information-circle', color: colors.warning },
    { value: 'low', label: 'Low', icon: 'checkmark-circle', color: colors.success }
  ];

  const sourceOptions = [
    { value: 'all', label: 'All Sources', icon: 'library' },
    { value: 'StreetManager', label: 'Street Manager', icon: 'business', color: colors.primary },
    { value: 'manual', label: 'Manual Entry', icon: 'person-add', color: colors.interactive },
    { value: 'api', label: 'API Import', icon: 'cloud-download', color: colors.info }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Dates', icon: 'calendar' },
    { value: 'today', label: 'Today', icon: 'today' },
    { value: 'week', label: 'This Week', icon: 'calendar' },
    { value: 'month', label: 'This Month', icon: 'calendar' },
    { value: 'upcoming', label: 'Upcoming', icon: 'time' },
    { value: 'overdue', label: 'Overdue', icon: 'warning', color: colors.error }
  ];

  const trafficManagementOptions = [
    { value: 'all', label: 'All Traffic Management', icon: 'car' },
    { value: 'roadClosure', label: 'Road Closure', icon: 'ban', color: colors.critical },
    { value: 'laneRestriction', label: 'Lane Restriction', icon: 'contract', color: colors.warning },
    { value: 'signalsControl', label: 'Traffic Signals', icon: 'radio-button-on', color: colors.info },
    { value: 'diversion', label: 'Diversion', icon: 'swap-horizontal', color: colors.primary },
    { value: 'noRestriction', label: 'No Restriction', icon: 'checkmark-circle', color: colors.success }
  ];

  const renderFilterSection = (title, options, filterKey, icon, allowMultiple = false) => {
    const isExpanded = expandedSections[filterKey];
    const currentValue = filters[filterKey];
    
    return (
      <View style={roadworksStyles.section}>
        <Pressable
          style={roadworksStyles.filterHeader}
          onPress={() => toggleSection(filterKey)}
        >
          <View style={roadworksStyles.row}>
            <Ionicons name={icon} size={16} color={colors.textSecondary} />
            <Text style={roadworksStyles.filterTitle}>{title}</Text>
            {allowMultiple && currentValue && currentValue.length > 0 && (
              <View style={roadworksStyles.tabBadge}>
                <Text style={roadworksStyles.tabBadgeText}>{currentValue.length}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={colors.textMuted} 
          />
        </Pressable>

        {isExpanded && (
          <View style={roadworksStyles.filterRow}>
            {options.map((option) => {
              const isSelected = allowMultiple 
                ? currentValue && currentValue.includes(option.value)
                : currentValue === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    roadworksStyles.filterChip,
                    isSelected && roadworksStyles.filterChipActive
                  ]}
                  onPress={() => {
                    if (allowMultiple) {
                      toggleArrayFilter(filterKey, option.value);
                    } else {
                      updateFilter(filterKey, option.value);
                    }
                  }}
                >
                  <View style={roadworksStyles.row}>
                    <Ionicons 
                      name={option.icon} 
                      size={14} 
                      color={isSelected 
                        ? colors.textPrimary 
                        : (option.color || colors.textMuted)
                      } 
                    />
                    <Text style={[
                      roadworksStyles.filterChipText,
                      isSelected && roadworksStyles.filterChipTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderRouteFilter = () => {
    const isExpanded = expandedSections.routes;
    const selectedRoutes = filters.affectedRoutes || [];
    
    return (
      <View style={roadworksStyles.section}>
        <Pressable
          style={roadworksStyles.filterHeader}
          onPress={() => toggleSection('routes')}
        >
          <View style={roadworksStyles.row}>
            <Ionicons name="bus" size={16} color={colors.textSecondary} />
            <Text style={roadworksStyles.filterTitle}>Affected Routes</Text>
            {selectedRoutes.length > 0 && (
              <View style={roadworksStyles.tabBadge}>
                <Text style={roadworksStyles.tabBadgeText}>{selectedRoutes.length}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={colors.textMuted} 
          />
        </Pressable>

        {isExpanded && (
          <View style={roadworksStyles.section}>
            {/* Quick route selections */}
            <View style={roadworksStyles.filterRow}>
              <Pressable
                style={[
                  roadworksStyles.filterChip,
                  selectedRoutes.length === 0 && roadworksStyles.filterChipActive
                ]}
                onPress={() => updateFilter('affectedRoutes', [])}
              >
                <Text style={[
                  roadworksStyles.filterChipText,
                  selectedRoutes.length === 0 && roadworksStyles.filterChipTextActive
                ]}>
                  All Routes
                </Text>
              </Pressable>
              
              <Pressable
                style={roadworksStyles.filterChip}
                onPress={() => updateFilter('affectedRoutes', availableRoutes.slice(0, 10))}
              >
                <Text style={roadworksStyles.filterChipText}>Select Popular</Text>
              </Pressable>
            </View>

            {/* Route list */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing.sm }}
            >
              <View style={roadworksStyles.filterRow}>
                {availableRoutes.slice(0, 20).map((route) => {
                  const isSelected = selectedRoutes.includes(route);
                  return (
                    <Pressable
                      key={route}
                      style={[
                        roadworksStyles.routeChip,
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => toggleArrayFilter('affectedRoutes', route)}
                    >
                      <Text style={[
                        roadworksStyles.routeChipText,
                        !isSelected && { color: colors.textSecondary }
                      ]}>
                        {route}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  if (!visible) return null;

  const activeFilterCount = getActiveFilterCount();

  return (
    <View style={roadworksStyles.filterContainer}>
      {/* Header */}
      <View style={roadworksStyles.filterHeader}>
        <View style={roadworksStyles.row}>
          <Ionicons name="funnel" size={20} color={colors.primary} />
          <Text style={roadworksStyles.filterTitle}>Advanced Filters</Text>
          {activeFilterCount > 0 && (
            <View style={[roadworksStyles.tabBadge, { backgroundColor: colors.primary }]}>
              <Text style={roadworksStyles.tabBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
        
        <View style={roadworksStyles.row}>
          {activeFilterCount > 0 && (
            <Pressable
              style={[roadworksStyles.quickActionButton]}
              onPress={handleClearAll}
            >
              <Ionicons name="refresh" size={16} color={colors.textMuted} />
              <Text style={roadworksStyles.quickActionText}>Clear All</Text>
            </Pressable>
          )}
          
          {onClose && (
            <Pressable
              style={roadworksStyles.quickActionButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={roadworksStyles.section}>
          <View style={[
            roadworksStyles.filterChip,
            { 
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm
            }
          ]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[
                roadworksStyles.filterChipText,
                { 
                  flex: 1,
                  color: colors.textPrimary,
                  fontSize: 16,
                  paddingVertical: Platform.OS === 'ios' ? 8 : 4
                }
              ]}
              placeholder="Search roadworks..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Sections */}
        {renderFilterSection('Status', statusOptions, 'status', 'radio-button-on')}
        {renderFilterSection('Severity', severityOptions, 'severity', 'speedometer')}
        {renderFilterSection('Source', sourceOptions, 'source', 'library')}
        {renderFilterSection('Date Range', dateRangeOptions, 'dateRange', 'calendar')}
        {renderFilterSection('Traffic Management', trafficManagementOptions, 'trafficManagement', 'car')}
        {renderRouteFilter()}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <View style={roadworksStyles.section}>
            <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.sm }]}>
              Saved Filters
            </Text>
            <View style={roadworksStyles.filterRow}>
              {savedFilters.map((savedFilter, index) => (
                <Pressable
                  key={index}
                  style={roadworksStyles.filterChip}
                  onPress={() => onFiltersChange(savedFilter.filters)}
                >
                  <View style={roadworksStyles.row}>
                    <Ionicons name="bookmark" size={14} color={colors.textMuted} />
                    <Text style={roadworksStyles.filterChipText}>
                      {savedFilter.name}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[roadworksStyles.filterRow, { marginTop: spacing.lg }]}>
          {onSaveFilter && activeFilterCount > 0 && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={() => onSaveFilter(filters)}
            >
              <Ionicons name="bookmark" size={16} color={colors.textSecondary} />
              <Text style={[roadworksStyles.actionButtonText, roadworksStyles.actionButtonTextSecondary]}>
                Save Filter
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default FilterPanel;