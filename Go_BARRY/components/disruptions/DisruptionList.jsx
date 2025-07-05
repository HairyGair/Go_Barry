// Disruption list component with filtering and sorting
import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity
} from 'react-native';
import DisruptionCard from './DisruptionCard';
import DisruptionFilters from './DisruptionFilters';
import { useDisruptions, useDisruptionFilters } from '../hooks/useDisruptions';

export default function DisruptionList({ 
  supervisorBadge,
  onDisruptionPress,
  onDismiss,
  onAddNote,
  showFilters = true,
  compactMode = false,
  limit = 50
}) {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    filters, 
    updateFilter, 
    clearFilters, 
    activeFilterCount 
  } = useDisruptionFilters();
  
  const { 
    disruptions, 
    stats, 
    dismissDisruption,
    addNote,
    selectedDisruptionId,
    setSelectedDisruptionId
  } = useDisruptions(filters, limit);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Convex will auto-refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle dismissal
  const handleDismiss = async (disruption) => {
    if (!supervisorBadge) return;
    
    try {
      await dismissDisruption(disruption._id, supervisorBadge);
    } catch (error) {
      console.error('Failed to dismiss disruption:', error);
    }
  };

  // Handle note addition
  const handleAddNote = (disruption) => {
    setSelectedDisruptionId(disruption._id);
    if (onAddNote) {
      onAddNote(disruption);
    }
  };

  // Render disruption card
  const renderDisruption = ({ item }) => (
    <DisruptionCard
      disruption={item}
      onPress={onDisruptionPress}
      onDismiss={onDismiss || handleDismiss}
      onAddNote={handleAddNote}
      supervisorBadge={supervisorBadge}
      isCompact={compactMode}
    />
  );

  // Loading state
  if (!disruptions && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading disruptions...</Text>
      </View>
    );
  }

  // Empty state
  if (disruptions && disruptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No disruptions found</Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      {showFilters && (
        <DisruptionFilters
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          stats={stats}
        />
      )}

      {/* Stats Bar */}
      {stats && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {disruptions?.length || 0} disruptions
          </Text>
          {stats.criticalCount > 0 && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>
                {stats.criticalCount} critical
              </Text>
            </View>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={disruptions}
        renderItem={renderDisruption}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
          />
        }
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Updated every 30 seconds
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  criticalBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
