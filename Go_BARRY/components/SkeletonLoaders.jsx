// components/SkeletonLoaders.jsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Base skeleton component with shimmer effect
const SkeletonBase = ({ width, height, borderRadius = 4, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

// Alert card skeleton
export const AlertCardSkeleton = () => (
  <View style={styles.alertCardContainer}>
    <View style={styles.alertHeader}>
      <SkeletonBase width={40} height={40} borderRadius={20} />
      <View style={styles.alertTitleContainer}>
        <SkeletonBase width={200} height={18} borderRadius={4} />
        <SkeletonBase width={150} height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
    <SkeletonBase width="100%" height={40} borderRadius={4} style={{ marginTop: 12 }} />
    <View style={styles.alertFooter}>
      <SkeletonBase width={80} height={24} borderRadius={12} />
      <SkeletonBase width={100} height={24} borderRadius={12} />
    </View>
  </View>
);

// Traffic flow indicator skeleton
export const TrafficFlowSkeleton = () => (
  <View style={styles.flowContainer}>
    <View style={styles.flowMain}>
      <SkeletonBase width={60} height={60} borderRadius={30} />
      <View style={styles.flowCenter}>
        <SkeletonBase width={80} height={32} borderRadius={4} />
        <SkeletonBase width={60} height={20} borderRadius={10} style={{ marginTop: 8 }} />
      </View>
      <SkeletonBase width={60} height={40} borderRadius={8} />
    </View>
  </View>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton = () => (
  <View style={styles.statsContainer}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.statBox}>
        <SkeletonBase width={60} height={40} borderRadius={4} />
        <SkeletonBase width={80} height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    ))}
  </View>
);

// List skeleton
export const ListSkeleton = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <AlertCardSkeleton key={index} />
    ))}
  </View>
);

// Network health skeleton
export const NetworkHealthSkeleton = () => (
  <View style={styles.healthContainer}>
    <SkeletonBase width={150} height={20} borderRadius={4} style={{ alignSelf: 'center' }} />
    <SkeletonBase 
      width={140} 
      height={140} 
      borderRadius={70} 
      style={{ alignSelf: 'center', marginVertical: 20 }} 
    />
    <View style={styles.healthMetrics}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.healthMetric}>
          <SkeletonBase width={40} height={40} borderRadius={4} />
          <SkeletonBase width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

// Map skeleton
export const MapSkeleton = () => (
  <View style={styles.mapContainer}>
    <LinearGradient
      colors={['#f3f4f6', '#e5e7eb', '#f3f4f6']}
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.mapOverlay}>
      <SkeletonBase width={120} height={100} borderRadius={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  alertCardContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  flowContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  flowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  healthContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  healthMetric: {
    alignItems: 'center',
  },
  mapContainer: {
    height: 400,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});

export default {
  Base: SkeletonBase,
  AlertCard: AlertCardSkeleton,
  TrafficFlow: TrafficFlowSkeleton,
  DashboardStats: DashboardStatsSkeleton,
  List: ListSkeleton,
  NetworkHealth: NetworkHealthSkeleton,
  Map: MapSkeleton,
};