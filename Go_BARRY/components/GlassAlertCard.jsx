// components/GlassAlertCard.jsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import TrafficFlowIndicatorEnhanced from './TrafficFlowIndicatorEnhanced';

const GlassAlertCard = ({ alert, onPress, onDismiss, showFlowData = true }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'incident': return 'warning';
      case 'roadwork': return 'construct';
      case 'congestion': return 'car';
      default: return 'alert-circle';
    }
  };

  const severityColor = getSeverityColor(alert.severity);
  const statusIcon = getStatusIcon(alert.type);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={() => onPress?.(alert)}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <CardContent />
        </BlurView>
      ) : (
        <View style={[styles.glassContainer, styles.androidGlass]}>
          <CardContent />
        </View>
      )}
    </Pressable>
  );

  function CardContent() {
    return (
      <>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: severityColor + '20' }]}>
              <Ionicons name={statusIcon} size={24} color={severityColor} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {alert.title || alert.location}
              </Text>
              <Text style={styles.subtitle}>
                {alert.location} • {alert.source}
              </Text>
            </View>
          </View>
          
          {onDismiss && (
            <Pressable
              style={styles.dismissButton}
              onPress={() => onDismiss(alert)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color="#6b7280" />
            </Pressable>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.description} numberOfLines={2}>
            {alert.description}
          </Text>
          
          {/* Status Pills */}
          <View style={styles.statusRow}>
            <View style={[styles.severityPill, { backgroundColor: severityColor + '20' }]}>
              <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
              <Text style={[styles.severityText, { color: severityColor }]}>
                {alert.severity}
              </Text>
            </View>
            
            {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
              <View style={styles.routesPill}>
                <Ionicons name="bus" size={14} color="#ee7203" />
                <Text style={styles.routesText}>
                  {alert.affectsRoutes.slice(0, 3).join(', ')}
                  {alert.affectsRoutes.length > 3 && ` +${alert.affectsRoutes.length - 3}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Flow Data */}
        {showFlowData && alert.type === 'incident' && (
          <View style={styles.flowContainer}>
            <TrafficFlowIndicatorEnhanced 
              alertId={alert.id} 
              showDetails={false}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>
            <Ionicons name="time-outline" size={12} color="#6b7280" />
            {' '}
            {new Date(alert.lastUpdated || alert.timestamp).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          
          {alert.estimatedDelay && (
            <Text style={styles.delay}>
              <Ionicons name="hourglass-outline" size={12} color="#f59e0b" />
              {' '}
              {alert.estimatedDelay} min delay
            </Text>
          )}
        </View>
      </>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  blurContainer: {
    padding: 16,
  },
  glassContainer: {
    padding: 16,
  },
  androidGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  dismissButton: {
    marginLeft: 8,
  },
  body: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 114, 3, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  routesText: {
    fontSize: 12,
    color: '#ee7203',
    fontWeight: '500',
  },
  flowContainer: {
    marginHorizontal: -16,
    marginBottom: -8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  delay: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
});

export default GlassAlertCard;