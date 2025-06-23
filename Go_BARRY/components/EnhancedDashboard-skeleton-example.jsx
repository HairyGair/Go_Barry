// Example implementation of skeleton loaders in EnhancedDashboard
// This shows how to integrate the skeleton loaders - add this to EnhancedDashboard.jsx

import { SkeletonAlert, SkeletonCard, SkeletonText } from './ui/SkeletonLoader';

// Add this component to EnhancedDashboard for loading states
const DashboardSkeleton = () => (
  <View style={styles.container}>
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View>
              <SkeletonText width={200} lineHeight={24} />
              <View style={{ marginTop: 4 }}>
                <SkeletonText width={300} lineHeight={16} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Supervisor Header Skeleton */}
      <View style={styles.supervisorHeader}>
        <SkeletonCard width="100%" height={40} />
      </View>

      {/* Stats Skeleton */}
      <View style={styles.statsContainer}>
        <View style={styles.enhancedStats}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.enhancedStatCard}>
              <SkeletonText width={80} lineHeight={12} />
              <View style={{ marginVertical: 8 }}>
                <SkeletonText width={40} lineHeight={24} />
              </View>
              <SkeletonText width={60} lineHeight={10} />
            </View>
          ))}
        </View>
      </View>

      {/* System Status Skeleton */}
      <View style={styles.section}>
        <SkeletonText width={120} lineHeight={20} />
        <View style={[styles.statusGrid, { marginTop: 12 }]}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.statusItem}>
              <SkeletonText width={150} lineHeight={16} />
            </View>
          ))}
        </View>
      </View>

      {/* Map Skeleton */}
      <View style={styles.section}>
        <SkeletonText width={250} lineHeight={20} />
        <View style={{ marginTop: 8 }}>
          <SkeletonText width="100%" lineHeight={14} />
        </View>
        <View style={[styles.mapContainer, { marginTop: 12 }]}>
          <SkeletonCard width="100%" height={300} />
        </View>
      </View>

      {/* Alerts List Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonText width={150} lineHeight={20} />
          <SkeletonText width={80} lineHeight={16} />
        </View>
        
        {/* Generate 3 skeleton alert cards */}
        {[...Array(3)].map((_, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <SkeletonAlert />
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

// UPDATE THE MAIN RENDER METHOD:
// Replace the existing loading check with this:

// Main render with skeleton loader
if (loading && !alertsData) {
  return <DashboardSkeleton />;
}

// For partial loading states (e.g., refreshing data)
const AlertsListWithSkeleton = () => {
  if (loading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <SkeletonAlert />
          </View>
        ))}
      </>
    );
  }

  if (filteredAlerts.length > 0) {
    return filteredAlerts.map(alert => (
      <AlertCard key={alert.id || alert.title} alert={alert} />
    ));
  }

  return (
    <View style={styles.noAlertsContainer}>
      <Text style={styles.noAlertsIcon}>{typography.icons.supervisor.shield}</Text>
      <Text style={styles.noAlertsText}>
        {searchQuery ? 'No alerts match your search' : 'No alerts in this category'}
      </Text>
      <Text style={styles.noAlertsSubtext}>
        {searchQuery ? 'Try adjusting your search terms' : 'Traffic conditions are good!'}
      </Text>
    </View>
  );
};