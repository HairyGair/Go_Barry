import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const SkeletonLoader = ({ width, height, borderRadius = 4, style }) => {
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

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton components for common UI elements
export const SkeletonText = ({ lines = 1, width = '100%', lineHeight = 16, spacing = 8 }) => (
  <View>
    {[...Array(lines)].map((_, i) => (
      <SkeletonLoader
        key={i}
        width={i === lines - 1 ? '70%' : width}
        height={lineHeight}
        style={i > 0 ? { marginTop: spacing } : null}
      />
    ))}
  </View>
);

export const SkeletonCard = ({ width = '100%', height = 120 }) => (
  <SkeletonLoader width={width} height={height} borderRadius={8} />
);

export const SkeletonAlert = () => (
  <View style={styles.alertContainer}>
    <View style={styles.alertHeader}>
      <SkeletonLoader width={60} height={24} borderRadius={12} />
      <SkeletonLoader width={80} height={20} />
    </View>
    <SkeletonText lines={2} spacing={6} style={{ marginTop: 8 }} />
    <View style={styles.alertFooter}>
      <SkeletonLoader width={100} height={16} />
      <SkeletonLoader width={80} height={16} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  alertContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

export default SkeletonLoader;