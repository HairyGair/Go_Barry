// Disruption filters component
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DISRUPTION_TYPES = [
  { value: 'roadwork', label: 'Roadworks', icon: 'construct', color: '#f97316' },
  { value: 'incident', label: 'Incidents', icon: 'warning', color: '#ef4444' },
  { value: 'event', label: 'Events', icon: 'calendar', color: '#8b5cf6' },
  { value: 'weather', label: 'Weather', icon: 'rainy', color: '#3b82f6' },
  { value: 'breakdown', label: 'Breakdowns', icon: 'car', color: '#f59e0b' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#10b981' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'planned', label: 'Planned' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'cleared', label: 'Cleared' },
];

export default function DisruptionFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  stats 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Count active filters
  const activeFilterCount = [
    filters.types?.length || 0,
    filters.severities?.length || 0,
    filters.statuses?.length || 0,
    filters.supervisorDismissed ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Toggle filter
  const toggleArrayFilter = (filterKey, value) => {
    const currentValues = filters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(filterKey, newValues);
  };

  // Quick filter buttons
  const QuickFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.quickFilters}
      contentContainerStyle={styles.quickFiltersContent}
    >
      {/* Active filter */}
      <TouchableOpacity
        style={[
          styles.quickFilterButton,
          filters.statuses?.includes('active') && styles.quickFilterActive
        ]}
        onPress={() => toggleArrayFilter('statuses', 'active')}
      >
        <Text style={[
          styles.quickFilterText,
          filters.statuses?.includes('active') && styles.quickFilterTextActive
        ]}>
          Active Only
        </Text>
      </TouchableOpacity>

      {/* Critical severity */}
      <TouchableOpacity
        style={[
          styles.quickFilterButton,
          filters.severities?.includes('critical') && styles.quickFilterActive
        ]}
        onPress={() => toggleArrayFilter('severities', 'critical')}
      >
        <View style={[styles.severityDot, { backgroundColor: '#dc2626' }]} />
        <Text style={[
          styles.quickFilterText,
          filters.severities?.includes('critical') && styles.quickFilterTextActive
        ]}>
          Critical
        </Text>
      </TouchableOpacity>

      {/* Type filters */}
      {DISRUPTION_TYPES.map(type => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.quickFilterButton,
            filters.types?.includes(type.value) && styles.quickFilterActive
          ]}
          onPress={() => toggleArrayFilter('types', type.value)}
        >
          <Ionicons 
            name={`${type.icon}-outline`} 
            size={16} 
            color={filters.types?.includes(type.value) ? 'white' : type.color}
          />
          <Text style={[
            styles.quickFilterText,
            filters.types?.includes(type.value) && styles.quickFilterTextActive
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Show dismissed */}
      <TouchableOpacity
        style={[
          styles.quickFilterButton,
          filters.supervisorDismissed && styles.quickFilterActive
        ]}
        onPress={() => onFilterChange('supervisorDismissed', !filters.supervisorDismissed)}
      >
        <Text style={[
          styles.quickFilterText,
          filters.supervisorDismissed && styles.quickFilterTextActive
        ]}>
          Show Dismissed
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Expanded filters
  const ExpandedFilters = () => (
    <View style={styles.expandedFilters}>
      {/* Severity filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Severity</Text>
        <View style={styles.filterOptions}>
          {SEVERITIES.map(severity => (
            <TouchableOpacity
              key={severity.value}
              style={[
                styles.filterOption,
                filters.severities?.includes(severity.value) && styles.filterOptionActive
              ]}
              onPress={() => toggleArrayFilter('severities', severity.value)}
            >
              <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
              <Text style={[
                styles.filterOptionText,
                filters.severities?.includes(severity.value) && styles.filterOptionTextActive
              ]}>
                {severity.label}
              </Text>
              {stats?.bySeverity?.[severity.value] > 0 && (
                <Text style={styles.filterCount}>
                  {stats.bySeverity[severity.value]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Status</Text>
        <View style={styles.filterOptions}>
          {STATUSES.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.filterOption,
                filters.statuses?.includes(status.value) && styles.filterOptionActive
              ]}
              onPress={() => toggleArrayFilter('statuses', status.value)}
            >
              <Text style={[
                styles.filterOptionText,
                filters.statuses?.includes(status.value) && styles.filterOptionTextActive
              ]}>
                {status.label}
              </Text>
              {stats?.byStatus?.[status.value] > 0 && (
                <Text style={styles.filterCount}>
                  {stats.byStatus[status.value]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons 
            name={isExpanded ? 'filter' : 'filter-outline'} 
            size={20} 
            color="#374151" 
          />
          <Text style={styles.filterTitle}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6b7280" 
          />
        </TouchableOpacity>

        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick filters always visible */}
      <QuickFilters />

      {/* Expanded filters */}
      {isExpanded && <ExpandedFilters />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filterCountBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  filterCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  quickFilters: {
    paddingVertical: 8,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginRight: 8,
  },
  quickFilterActive: {
    backgroundColor: '#2563eb',
  },
  quickFilterText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  quickFilterTextActive: {
    color: 'white',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  expandedFilters: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterSection: {
    marginTop: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  filterOptionTextActive: {
    color: '#1e40af',
    fontWeight: '500',
  },
  filterCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
});
