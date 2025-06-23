// Performance Monitoring Component for Go BARRY
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    bundleSize: 0,
    cacheHits: 0,
    networkRequests: 0,
  });

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };

    // Start FPS monitoring
    measureFPS();

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        }));
      }
    }, 2000);

    // Network monitoring
    let requestCount = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      requestCount += entries.filter(e => e.entryType === 'resource').length;
      setMetrics(prev => ({ ...prev, networkRequests: requestCount }));
    });
    observer.observe({ entryTypes: ['resource'] });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(memoryInterval);
      observer.disconnect();
    };
  }, [enabled]);

  if (!enabled || Platform.OS !== 'web') return null;

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return '#10B981';
    if (value >= thresholds.warning) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.metric}>
        <Text style={styles.label}>FPS</Text>
        <Text style={[styles.value, { color: getStatusColor(metrics.fps, { good: 50, warning: 30 }) }]}>
          {metrics.fps}
        </Text>
      </View>
      
      <View style={styles.metric}>
        <Text style={styles.label}>Memory</Text>
        <Text style={[styles.value, { color: getStatusColor(100 - metrics.memory, { good: 50, warning: 20 }) }]}>
          {metrics.memory}MB
        </Text>
      </View>
      
      <View style={styles.metric}>
        <Text style={styles.label}>Network</Text>
        <Text style={styles.value}>{metrics.networkRequests}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 16,
    zIndex: 9999,
  },
  metric: {
    alignItems: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PerformanceMonitor;