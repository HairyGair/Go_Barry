/*
 * Go Barry - Live Map Details Sidebar
 * Shows alert information and action buttons
 * Phase 1: Basic alert details with acknowledge/dismiss/escalate actions
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { liveMapTheme } from '../styles/liveMapStyles';
import { AlertStateUtils } from '../utils/alertStateManager';

const DetailsSidebar = ({ 
  selectedItem, 
  alertStats = {}, 
  onAction = () => {}, 
  onClose = () => {} 
}) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return AlertStateUtils.formatTimestamp(timestamp);
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return liveMapTheme.alertStates.escalated;
      case 'high': return liveMapTheme.alertStates.new;
      case 'medium': return liveMapTheme.alertStates.acknowledged;
      default: return liveMapTheme.ui.textSecondary;
    }
  };

  // Get state color
  const getStateColor = (state) => {
    return AlertStateUtils.getStateColor(state);
  };

  // Render alert details
  const renderAlertDetails = (alert) => (
    <View style={styles.detailsContainer}>
      {/* Alert Header */}
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={24} 
            color={getSeverityColor(alert.severity)} 
          />
          <Text style={styles.alertTitle} numberOfLines={2}>
            {alert.title || 'Traffic Alert'}
          </Text>
        </View>
        
        <View style={styles.alertBadges}>
          <View style={[styles.stateBadge, { backgroundColor: getStateColor(alert.alertState) }]}>
            <Text style={styles.stateBadgeText}>
              {AlertStateUtils.getStateDisplayText(alert.alertState)?.toUpperCase() || 'NEW'}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
            <Text style={styles.severityBadgeText}>
              {alert.severity?.toUpperCase() || 'MEDIUM'}
            </Text>
          </View>
        </View>
      </View>

      {/* Alert Info */}
      <ScrollView style={styles.alertContent} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={liveMapTheme.ui.accent} />
          <Text style={styles.infoText}>
            {alert.location || 'Location not specified'}
          </Text>
        </View>

        {/* Description */}
        {alert.description && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="text" size={16} color={liveMapTheme.ui.accent} />
            <Text style={styles.infoText}>
              {alert.description}
            </Text>
          </View>
        )}

        {/* Source */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="source-branch" size={16} color={liveMapTheme.ui.accent} />
          <Text style={styles.infoText}>
            {alert.source || 'Unknown source'}
          </Text>
        </View>

        {/* Timestamp */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock" size={16} color={liveMapTheme.ui.accent} />
          <Text style={styles.infoText}>
            {formatTimestamp(alert.timestamp)}
          </Text>
        </View>

        {/* Affected Routes */}
        {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="bus" size={16} color={liveMapTheme.ui.accent} />
            <Text style={styles.infoText}>
              Routes: {alert.affectsRoutes.join(', ')}
            </Text>
          </View>
        )}

        {/* Coordinates */}
        {alert.coordinates && alert.coordinates.length === 2 && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={liveMapTheme.ui.accent} />
            <Text style={styles.infoText}>
              {alert.coordinates[0].toFixed(4)}, {alert.coordinates[1].toFixed(4)}
            </Text>
          </View>
        )}

        {/* Acknowledgment Info */}
        {alert.alertState === 'acknowledged' && alert.acknowledgedBy && (
          <View style={[styles.infoRow, styles.acknowledgmentRow]}>
            <MaterialCommunityIcons name="account-check" size={16} color={liveMapTheme.alertStates.acknowledged} />
            <Text style={[styles.infoText, { color: liveMapTheme.alertStates.acknowledged }]}>
              Acknowledged by {alert.acknowledgedBy}
            </Text>
          </View>
        )}

        {/* Escalation Info */}
        {alert.alertState === 'escalated' && (
          <View style={[styles.infoRow, styles.escalationRow]}>
            <MaterialCommunityIcons name="arrow-up-bold" size={16} color={liveMapTheme.alertStates.escalated} />
            <Text style={[styles.infoText, { color: liveMapTheme.alertStates.escalated }]}>
              Escalated for management
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {AlertStateUtils.canAcknowledge(alert) && (
          <Pressable 
            style={[styles.actionButton, styles.acknowledgeButton]}
            onPress={() => onAction('acknowledge', alert.id)}
          >
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Acknowledge</Text>
          </Pressable>
        )}

        {AlertStateUtils.canEscalate(alert) && (
          <Pressable 
            style={[styles.actionButton, styles.escalateButton]}
            onPress={() => onAction('escalate', alert.id)}
          >
            <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Escalate</Text>
          </Pressable>
        )}

        {AlertStateUtils.canDismiss(alert) && (
          <Pressable 
            style={[styles.actionButton, styles.dismissButton]}
            onPress={() => onAction('dismiss', alert.id)}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Dismiss</Text>
          </Pressable>
        )}
        
        {/* Show state info for alerts that can't be actioned */}
        {alert.alertState === 'escalated' && (
          <View style={styles.infoMessage}>
            <MaterialCommunityIcons name="information" size={16} color={liveMapTheme.alertStates.escalated} />
            <Text style={[styles.infoMessageText, { color: liveMapTheme.alertStates.escalated }]}>
              This alert has been escalated for management
            </Text>
          </View>
        )}
        
        {alert.alertState === 'dismissed' && (
          <View style={styles.infoMessage}>
            <MaterialCommunityIcons name="check-circle" size={16} color={liveMapTheme.ui.textSecondary} />
            <Text style={[styles.infoMessageText, { color: liveMapTheme.ui.textSecondary }]}>
              This alert has been dismissed
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render welcome screen
  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <MaterialCommunityIcons 
        name="map-marker-radius" 
        size={64} 
        color={liveMapTheme.ui.accent} 
      />
      <Text style={styles.welcomeTitle}>Live Map</Text>
      <Text style={styles.welcomeSubtitle}>
        Real-time traffic intelligence for Go North East operations
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{alertStats.total || 0}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{alertStats.new || 0}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{alertStats.acknowledged || 0}</Text>
          <Text style={styles.statLabel}>Acknowledged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{alertStats.escalated || 0}</Text>
          <Text style={styles.statLabel}>Escalated</Text>
        </View>
      </View>

      <View style={styles.helpText}>
        <Text style={styles.helpTitle}>How to use:</Text>
        <Text style={styles.helpItem}>• Click alerts on map to view details</Text>
        <Text style={styles.helpItem}>• Acknowledge alerts you're aware of</Text>
        <Text style={styles.helpItem}>• Escalate alerts that need management</Text>
        <Text style={styles.helpItem}>• Dismiss resolved alerts</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.sidebar}>
      {selectedItem?.type === 'alert' ? renderAlertDetails(selectedItem.data) : renderWelcome()}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 400,
    backgroundColor: liveMapTheme.ui.sidebar,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'column',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  alertHeader: {
    marginBottom: 20,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  alertTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: liveMapTheme.ui.text,
    lineHeight: 24,
  },
  alertBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stateBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alertContent: {
    flex: 1,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: liveMapTheme.ui.text,
    lineHeight: 20,
  },
  acknowledgmentRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  escalationRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acknowledgeButton: {
    backgroundColor: liveMapTheme.alertStates.acknowledged,
  },
  escalateButton: {
    backgroundColor: liveMapTheme.alertStates.escalated,
  },
  dismissButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: liveMapTheme.ui.text,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: liveMapTheme.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: liveMapTheme.ui.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: liveMapTheme.ui.textSecondary,
    textAlign: 'center',
  },
  helpText: {
    alignSelf: 'stretch',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: liveMapTheme.ui.text,
    marginBottom: 12,
  },
  helpItem: {
    fontSize: 14,
    color: liveMapTheme.ui.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default DetailsSidebar;
