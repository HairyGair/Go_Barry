// components/mobile/MobilePerformanceOptimizer.jsx
// Performance optimization component for React Native mobile interface
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    batteryLevel: 100
  });

  useEffect(() => {
    const startTime = Date.now();
    
    // Monitor render completion
    InteractionManager.runAfterInteractions(() => {
      const renderTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, renderTime }));
    });

    // Memory monitoring (iOS/Android specific)
    if (Platform.OS !== 'web') {
      const memoryInterval = setInterval(() => {
        // Estimate memory usage based on React Native performance
        const estimatedMemory = (global.performance?.memory?.usedJSHeapSize || 0) / 1024 / 1024;
        setPerformanceMetrics(prev => ({ ...prev, memoryUsage: estimatedMemory }));
      }, 5000);

      return () => clearInterval(memoryInterval);
    }
  }, []);

  return performanceMetrics;
};

// Offline data cache hook
export const useOfflineCache = (key, fetcher, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch fresh data
      const freshData = await fetcher();
      setData(freshData);
      setIsOffline(false);
      
      // Cache the data for offline use
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.warn(`Failed to fetch ${key}, trying offline cache:`, error.message);
      
      try {
        // Try to load from cache
        const cachedString = await AsyncStorage.getItem(`cache_${key}`);
        if (cachedString) {
          const cached = JSON.parse(cachedString);
          const ageMinutes = (Date.now() - cached.timestamp) / 1000 / 60;
          
          if (ageMinutes < 30) { // Use cache if less than 30 minutes old
            setData(cached.data);
            setIsOffline(true);
            console.log(`Using cached ${key} data (${ageMinutes.toFixed(1)} min old)`);
          }
        }
      } catch (cacheError) {
        console.error(`Failed to load cached ${key}:`, cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, isOffline, refetch: fetchData };
};

// Touch optimization hook for better mobile interaction
export const useTouchOptimization = () => {
  const [touchState, setTouchState] = useState({
    lastTap: 0,
    tapCount: 0,
    longPressActive: false
  });

  const handleTouchStart = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - touchState.lastTap;
    
    if (timeDiff < 300) {
      // Double tap detected
      setTouchState(prev => ({ 
        ...prev, 
        tapCount: prev.tapCount + 1,
        lastTap: now 
      }));
    } else {
      setTouchState(prev => ({ 
        ...prev, 
        tapCount: 1,
        lastTap: now 
      }));
    }
  }, [touchState.lastTap]);

  const handleLongPress = useCallback(() => {
    setTouchState(prev => ({ ...prev, longPressActive: true }));
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({ ...prev, longPressActive: false }));
  }, []);

  return {
    touchState,
    handleTouchStart,
    handleLongPress,
    handleTouchEnd
  };
};

// Network status monitoring
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // For React Native, we'll use a simple approach
      setIsConnected(true);
      setConnectionType('wifi');
    } else {
      // Web network monitoring
      const updateOnlineStatus = () => {
        setIsConnected(navigator.onLine);
        setConnectionType(navigator.connection?.effectiveType || 'unknown');
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  return { isConnected, connectionType };
};

export default {
  usePerformanceMonitor,
  useOfflineCache,
  useTouchOptimization,
  useNetworkStatus
};
