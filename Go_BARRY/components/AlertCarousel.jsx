import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useConvexSyncSimple } from '../hooks/useConvexSyncSimple';

const AlertCarousel = ({ theme = 'light', onAlertChange = null }) => {
  const convexData = useConvexSyncSimple();
  const activeAlerts = convexData?.activeAlerts || convexData?.allIncidents || [];
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [displayAlerts, setDisplayAlerts] = useState([]);
  const [isNewAlert, setIsNewAlert] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const DISPLAY_DURATION = 20000; // 20 seconds per alert
  const MAX_ALERTS_IN_DOM = 3; // Memory optimization

  // Process and prioritize alerts
  useEffect(() => {
    if (!activeAlerts || activeAlerts.length === 0) {
      setDisplayAlerts([]);
      return;
    }

    // Sort alerts by priority and timestamp
    const prioritized = [...activeAlerts].sort((a, b) => {
      const priorityOrder = {
        'EMERGENCY': 0,
        'CRITICAL': 1,
        'MAJOR': 2,
        'MINOR': 3
      };
      
      const aPriority = priorityOrder[a.severity] ?? 4;
      const bPriority = priorityOrder[b.severity] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Same priority - sort by age (newer first)
      return new Date(b.startTime) - new Date(a.startTime);
    });

    // Keep only the most recent alerts to prevent memory issues
    const limited = prioritized.slice(0, 50);
    setDisplayAlerts(limited);
  }, [activeAlerts]);

  // Get current alert
  const currentAlert = displayAlerts[currentAlertIndex];

  // Notify parent component of alert changes
  useEffect(() => {
    if (onAlertChange && currentAlert) {
      onAlertChange(currentAlertIndex, currentAlert);
    }
  }, [currentAlertIndex, currentAlert, onAlertChange]);

  // Calculate alert age
  const getAlertAge = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMinutes = Math.floor((now - start) / 60000);
    
    if (diffMinutes < 1) return 'Just Now';
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffMinutes < 120) return '1 hour ago';
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  // Animate progress bar
  useEffect(() => {
    if (!currentAlert) return;

    // Reset and start progress animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: DISPLAY_DURATION,
      useNativeDriver: false
    }).start();

    // Check if this is a new alert (less than 1 minute old)
    const alertAge = new Date() - new Date(currentAlert.startTime);
    const isNew = alertAge < 60000;
    setIsNewAlert(isNew);

    // Pulse animation for new alerts
    if (isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ]),
        { iterations: 3 }
      ).start();
    }

    // Auto-advance to next alert
    const timer = setTimeout(() => {
      setCurrentAlertIndex((prev) => 
        prev + 1 >= displayAlerts.length ? 0 : prev + 1
      );
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [currentAlertIndex, currentAlert, displayAlerts.length]);

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      'EMERGENCY': '#dc2626',
      'CRITICAL': '#dc2626',
      'MAJOR': '#f59e0b',
      'MINOR': '#eab308'
    };
    return colors[severity] || '#6b7280';
  };

  // Get alert icon
  const getAlertIcon = (type) => {
    const icons = {
      'ROADWORK': '🚧',
      'INCIDENT': '🚨',
      'EMERGENCY': '🚨',
      'WEATHER': '🌧️',
      'EVENT': '📅'
    };
    return icons[type] || '⚠️';
  };

  if (!currentAlert) {
    return (
      <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
        <Text style={[styles.noAlertsText, theme === 'dark' && styles.textDark]}>
          No active traffic alerts
        </Text>
      </View>
    );
  }

  const severityColor = getSeverityColor(currentAlert.severity);
  const animatedScale = isNewAlert ? pulseAnim : 1;

  return (
    <Animated.View style={[
      styles.container,
      theme === 'dark' && styles.containerDark,
      { 
        borderColor: severityColor,
        borderWidth: 3,
        transform: [{ scale: animatedScale }]
      }
    ]}>
      {/* Alert Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{getAlertIcon(currentAlert.type)}</Text>
          <View>
            <Text style={[
              styles.severity,
              { color: severityColor }
            ]}>
              {currentAlert.severity}
            </Text>
            <Text style={[styles.age, theme === 'dark' && styles.textSecondaryDark]}>
              {getAlertAge(currentAlert.startTime)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.alertCount, theme === 'dark' && styles.textDark]}>
            {currentAlertIndex + 1} of {displayAlerts.length}
          </Text>
        </View>
      </View>

      {/* Alert Content */}
      <View style={styles.content}>
        <Text style={[styles.title, theme === 'dark' && styles.textDark]}>
          {currentAlert.title}
        </Text>
        <Text style={[styles.location, theme === 'dark' && styles.textSecondaryDark]}>
          📍 {currentAlert.location}
        </Text>
        {currentAlert.affectedRoutes && currentAlert.affectedRoutes.length > 0 && (
          <View style={styles.routesContainer}>
            <Text style={[styles.routesLabel, theme === 'dark' && styles.textSecondaryDark]}>
              Affected Routes:
            </Text>
            <View style={styles.routeBadges}>
              {currentAlert.affectedRoutes.slice(0, 8).map((route, index) => (
                <View key={index} style={[
                  styles.routeBadge,
                  theme === 'dark' && styles.routeBadgeDark
                ]}>
                  <Text style={[
                    styles.routeText,
                    theme === 'dark' && styles.textDark
                  ]}>
                    {route}
                  </Text>
                </View>
              ))}
              {currentAlert.affectedRoutes.length > 8 && (
                <Text style={[styles.moreRoutes, theme === 'dark' && styles.textSecondaryDark]}>
                  +{currentAlert.affectedRoutes.length - 8} more
                </Text>
              )}
            </View>
          </View>
        )}
        <Text style={[styles.description, theme === 'dark' && styles.textDark]}>
          {currentAlert.description}
        </Text>
        {currentAlert.estimatedEndTime && (
          <Text style={[styles.endTime, theme === 'dark' && styles.textSecondaryDark]}>
            Expected to clear: {new Date(currentAlert.estimatedEndTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
            }),
            backgroundColor: severityColor
          }
        ]} />
      </View>

      {/* Alert Indicators */}
      <View style={styles.indicatorContainer}>
        {displayAlerts.slice(0, 10).map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentAlertIndex && styles.activeIndicator,
              index === currentAlertIndex && { backgroundColor: severityColor },
              theme === 'dark' && styles.indicatorDark
            ]}
          />
        ))}
        {displayAlerts.length > 10 && (
          <Text style={[styles.moreIndicators, theme === 'dark' && styles.textSecondaryDark]}>
            +{displayAlerts.length - 10}
          </Text>
        )}
      </View>

      {/* New Alert Badge */}
      {isNewAlert && (
        <View style={[styles.newBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 250
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    shadowOpacity: 0.3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  icon: {
    fontSize: 48
  },
  severity: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  age: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  alertCount: {
    fontSize: 16,
    color: '#1a1a1a'
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 34
  },
  location: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 12
  },
  routesContainer: {
    marginBottom: 12
  },
  routesLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 6
  },
  routeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center'
  },
  routeBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  routeBadgeDark: {
    backgroundColor: '#374151'
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  moreRoutes: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic'
  },
  description: {
    fontSize: 20,
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 12
  },
  endTime: {
    fontSize: 18,
    color: '#666666',
    fontStyle: 'italic'
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%'
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    right: 24,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center'
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db'
  },
  activeIndicator: {
    width: 16
  },
  indicatorDark: {
    backgroundColor: '#4b5563'
  },
  moreIndicators: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4
  },
  newBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  noAlertsText: {
    fontSize: 24,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 40
  },
  textDark: {
    color: '#f5f5f5'
  },
  textSecondaryDark: {
    color: '#a0a0a0'
  }
});

// Add CSS animation for progress bar
if (typeof document !== 'undefined' && !document.getElementById('alert-carousel-progress-style')) {
  const style = document.createElement('style');
  style.id = 'alert-carousel-progress-style';
  style.textContent = `
    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

export default AlertCarousel;
