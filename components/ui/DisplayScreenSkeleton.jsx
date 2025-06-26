// DisplayScreen Skeleton Loader Component
// Add this to DisplayScreen.jsx for better loading states

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SkeletonCard, SkeletonText, SkeletonLoader } from './ui/SkeletonLoader';

export const DisplayScreenSkeleton = () => {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonText width={250} lineHeight={32} />
          <View style={{ marginTop: 8 }}>
            <SkeletonText width={200} lineHeight={20} />
          </View>
        </View>

        {/* Event Banner Skeleton */}
        <View style={styles.eventBannerSkeleton}>
          <SkeletonCard width="100%" height={80} />
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Left Side - Alert List */}
          <View style={styles.alertsPanel}>
            {/* Alert Header */}
            <View style={styles.alertHeaderSkeleton}>
              <SkeletonText width={150} lineHeight={24} />
              <SkeletonLoader width={80} height={30} borderRadius={15} />
            </View>

            {/* Alert Items */}
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.alertItemSkeleton}>
                <View style={styles.alertItemHeader}>
                  <SkeletonLoader width={40} height={40} borderRadius={20} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <SkeletonText width="90%" lineHeight={18} />
                    <View style={{ marginTop: 4 }}>
                      <SkeletonText width="60%" lineHeight={14} />
                    </View>
                  </View>
                  <SkeletonLoader width={60} height={24} borderRadius={12} />
                </View>
                <View style={{ marginTop: 8 }}>
                  <SkeletonText lines={2} lineHeight={14} spacing={4} />
                </View>
              </View>
            ))}
          </View>

          {/* Right Side - Map */}
          {isWeb && (
            <View style={styles.mapPanel}>
              <SkeletonCard width="100%" height="100%" />
            </View>
          )}
        </View>

        {/* Bottom Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statsGrid}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.statItem}>
                <SkeletonText width={80} lineHeight={14} />
                <View style={{ marginTop: 4 }}>
                  <SkeletonLoader width={40} height={28} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Active Personnel Skeleton */}
        <View style={styles.personnelBar}>
          <SkeletonText width={120} lineHeight={16} />
          <View style={styles.personnelList}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.personnelItemSkeleton}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
                <SkeletonText width={80} lineHeight={14} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  eventBannerSkeleton: {
    height: 80,
    backgroundColor: '#1E293B',
    padding: 16,
  },
  mainGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  alertsPanel: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 16,
  },
  alertHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertItemSkeleton: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPanel: {
    flex: 1,
    backgroundColor: '#0F172A',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statsBar: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  personnelBar: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  personnelList: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  personnelItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

// Usage in DisplayScreen.jsx:
// import { DisplayScreenSkeleton } from './DisplayScreenSkeleton';
// 
// In render method:
// if (loading) {
//   return <DisplayScreenSkeleton />;
// }