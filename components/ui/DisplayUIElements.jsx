// Enhanced UI Elements for Go BARRY Display Screen
// Custom icons, interactive buttons, and smooth animations for control room interface

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

// Custom Go BARRY Logo Icon
export const GoBarryLogo = ({ size = 60, animated = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated, pulseAnim]);

  return (
    <Animated.View style={[
      styles.logoContainer,
      { width: size, height: size, transform: [{ scale: pulseAnim }] }
    ]}>
      <View style={styles.logoBackground}>
        {/* Go North East inspired design */}
        <View style={styles.logoShape}>
          <Text style={[styles.logoText, { fontSize: size * 0.2 }]}>GO</Text>
          <Text style={[styles.logoSubtext, { fontSize: size * 0.15 }]}>BARRY</Text>
        </View>
        <View style={styles.logoAccent} />
      </View>
    </Animated.View>
  );
};

// Interactive Status Button with Hover Effects
export const StatusButton = ({ 
  status = 'connected', 
  label, 
  onPress, 
  size = 'medium',
  pulsing = false 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulsing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [pulsing, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10B981';
      case 'disconnected': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'updating': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small': return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 };
      case 'large': return { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 };
      default: return { paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 };
    }
  };

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }, { scale: pulseAnim }]
    }}>
      <TouchableOpacity
        style={[
          styles.statusButton,
          { backgroundColor: getStatusColor() },
          getSizeStyles()
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#FFFFFF' }]} />
        </View>
        <Text style={[styles.statusButtonText, { fontSize: getSizeStyles().fontSize }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Priority Level Indicator with Gradient
export const PriorityIndicator = ({ 
  level = 'MONITOR', 
  count = 0, 
  animated = true,
  size = 'medium' 
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && count > 0) {
      // Bounce animation for new alerts
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow effect for critical alerts
      if (level === 'CRITICAL') {
        const glow = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        glow.start();
        return () => glow.stop();
      }
    }
  }, [count, level, animated, bounceAnim, glowAnim]);

  const getPriorityConfig = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#DC2626',
          textColor: '#DC2626',
          icon: '⚠️'
        };
      case 'URGENT':
        return {
          backgroundColor: '#FED7AA',
          borderColor: '#EA580C',
          textColor: '#EA580C',
          icon: '🔥'
        };
      case 'MONITOR':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#CA8A04',
          textColor: '#CA8A04',
          icon: '👁️'
        };
      default:
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#10B981',
          textColor: '#10B981',
          icon: '✅'
        };
    }
  };

  const config = getPriorityConfig();
  const sizeMultiplier = size === 'large' ? 1.3 : size === 'small' ? 0.8 : 1;

  return (
    <Animated.View style={[
      styles.priorityContainer,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        transform: [{ scale: bounceAnim }],
        shadowOpacity: glowAnim,
        shadowColor: config.borderColor,
        width: 80 * sizeMultiplier,
        height: 80 * sizeMultiplier,
      }
    ]}>
      <Text style={[
        styles.priorityIcon,
        { fontSize: 16 * sizeMultiplier }
      ]}>
        {config.icon}
      </Text>
      <Text style={[
        styles.priorityNumber,
        { color: config.textColor, fontSize: 24 * sizeMultiplier }
      ]}>
        {count}
      </Text>
      <Text style={[
        styles.priorityLabel,
        { color: config.textColor, fontSize: 8 * sizeMultiplier }
      ]}>
        {level}
      </Text>
    </Animated.View>
  );
};

// Interactive Refresh Button with Loading State
export const RefreshButton = ({ 
  onPress, 
  loading = false, 
  size = 'medium',
  variant = 'primary' 
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    }
  }, [loading, rotateAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: '#6B7280',
          borderColor: '#9CA3AF',
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
          borderColor: '#059669',
        };
      default:
        return {
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small': return { width: 32, height: 32, borderRadius: 6 };
      case 'large': return { width: 48, height: 48, borderRadius: 12 };
      default: return { width: 40, height: 40, borderRadius: 8 };
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.refreshButton,
          getVariantStyles(),
          getSizeStyles(),
          loading && styles.refreshButtonLoading
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Animated.View style={{
          transform: [{ rotate: rotation }]
        }}>
          <Text style={styles.refreshIcon}>
            {loading ? '⟳' : '↻'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Connection Status Indicator
export const ConnectionStatus = ({ 
  connected = false, 
  label = 'System',
  showPulse = true 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showPulse && connected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }

    // Fade in/out based on connection
    Animated.timing(fadeAnim, {
      toValue: connected ? 1 : 0.6,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [connected, showPulse, pulseAnim, fadeAnim]);

  return (
    <Animated.View style={[
      styles.connectionContainer,
      { opacity: fadeAnim }
    ]}>
      <Animated.View style={[
        styles.connectionDot,
        {
          backgroundColor: connected ? '#10B981' : '#EF4444',
          transform: [{ scale: pulseAnim }]
        }
      ]} />
      <Text style={[
        styles.connectionLabel,
        { color: connected ? '#10B981' : '#EF4444' }
      ]}>
        {label}
      </Text>
      <Text style={styles.connectionStatus}>
        {connected ? 'ONLINE' : 'OFFLINE'}
      </Text>
    </Animated.View>
  );
};

// Loading Spinner with Go BARRY Branding
export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 40;
    }
  };

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[
        styles.spinner,
        {
          width: getSize(),
          height: getSize(),
          transform: [{ rotate: rotation }]
        }
      ]}>
        <View style={styles.spinnerRing} />
      </Animated.View>
      <Text style={styles.loadingMessage}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Logo Styles
  logoContainer: {
    position: 'relative',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E31E24',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logoShape: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoSubtext: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: -2,
  },
  logoAccent: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40%',
    height: '40%',
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    opacity: 0.6,
  },

  // Status Button Styles
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Priority Indicator Styles
  priorityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    padding: 8,
  },
  priorityIcon: {
    marginBottom: 4,
  },
  priorityNumber: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  priorityLabel: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Refresh Button Styles
  refreshButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonLoading: {
    opacity: 0.7,
  },
  refreshIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Connection Status Styles
  connectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  connectionStatus: {
    fontSize: 8,
    color: '#9CA3AF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Loading Spinner Styles
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#3B82F6',
  },
  spinnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  loadingMessage: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
