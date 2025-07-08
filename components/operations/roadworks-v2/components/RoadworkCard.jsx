/*
 * Go Barry - Enhanced Roadwork Card Component
 * Modern card design for individual roadwork items with rich interactions
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const RoadworkCard = ({
  roadwork,
  onPress,
  onStatusChange,
  onViewDiversions,
  onViewMap,
  onCreateDiversion,
  onViewDetails,
  showActions = true,
  isAdmin = false,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get status configuration
  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        color: colors.success, 
        bgColor: colors.successBg,
        textStyle: roadworksStyles.statusBadgeTextActive,
        icon: 'play-circle', 
        label: 'Active' 
      },
      planned: { 
        color: colors.info, 
        bgColor: colors.infoBg,
        textStyle: roadworksStyles.statusBadgeTextPlanned,
        icon: 'calendar', 
        label: 'Planned' 
      },
      completed: { 
        color: colors.textMuted, 
        bgColor: colors.surfaceLight,
        textStyle: roadworksStyles.statusBadgeTextCompleted,
        icon: 'checkmark-done', 
        label: 'Completed' 
      },
      cancelled: { 
        color: colors.textMuted, 
        bgColor: colors.surfaceLight,
        textStyle: roadworksStyles.statusBadgeTextCompleted,
        icon: 'close-circle', 
        label: 'Cancelled' 
      },
      critical: { 
        color: colors.critical, 
        bgColor: colors.criticalBg,
        textStyle: roadworksStyles.statusBadgeTextCritical,
        icon: 'warning', 
        label: 'Critical' 
      },
      monitoring: { 
        color: colors.info, 
        bgColor: colors.infoBg,
        textStyle: roadworksStyles.statusBadgeTextPlanned,
        icon: 'eye', 
        label: 'Monitoring' 
      },
      archived: { 
        color: colors.textMuted, 
        bgColor: colors.surfaceLight,
        textStyle: roadworksStyles.statusBadgeTextCompleted,
        icon: 'filing', 
        label: 'Archived' 
      },
      rejected: { 
        color: colors.error, 
        bgColor: colors.errorBg || '#ffe6e6',
        textStyle: roadworksStyles.statusBadgeTextCritical,
        icon: 'close-circle', 
        label: 'Rejected' 
      }
    };
    return configs[status] || configs.active;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return colors.critical;
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textMuted;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!roadwork.endDate) return null;
    const now = new Date();
    const end = new Date(roadwork.endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} remaining`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
  };

  // Get impact score display
  const getImpactDisplay = () => {
    const score = roadwork.details?.impactScore || roadwork.impactScore || 0;
    if (score >= 80) return { text: 'Very High', color: colors.critical };
    if (score >= 60) return { text: 'High', color: colors.error };
    if (score >= 40) return { text: 'Medium', color: colors.warning };
    if (score >= 20) return { text: 'Low', color: colors.success };
    return { text: 'Minimal', color: colors.textMuted };
  };

  const statusConfig = getStatusConfig(roadwork.status);
  const timeRemaining = getTimeRemaining();
  const impact = getImpactDisplay();

  const cardContent = (
    <View style={[
      styles.alertCard,
      isHovered && styles.alertCardHover,
      Platform.OS === 'web' && { 
        cursor: onPress ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }
    ]}>
      {/* Header with badges and status */}
      <View style={styles.alertHeader}>
        <View style={styles.leftBadges}>
          {/* Source Type Badge */}
          <View style={[
            styles.sourceBadge,
            { backgroundColor: roadwork.source === 'StreetManager' ? '#10b981' : '#f59e0b' }
          ]}>
            <Ionicons 
              name={roadwork.source === 'StreetManager' ? 'business' : 'construct'} 
              size={12} 
              color="white" 
            />
            <Text style={styles.sourceBadgeText}>
              {roadwork.source === 'StreetManager' ? 'Official Roadwork' : 'Roadwork'}
            </Text>
          </View>
          
          {/* Severity Badge */}
          {roadwork.severity && (
            <View style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(roadwork.severity) }
            ]}>
              <Text style={styles.severityBadgeText}>
                {roadwork.severity.charAt(0).toUpperCase() + roadwork.severity.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge - Right aligned */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: statusConfig.bgColor }
        ]}>
          <Ionicons 
            name={statusConfig.icon} 
            size={12} 
            color={statusConfig.color} 
          />
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Title and Location */}
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>
          {roadwork.title || roadwork.sm_street_name || 'Unnamed Roadwork'}
        </Text>
        
        {roadwork.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.locationText}>{roadwork.location}</Text>
          </View>
        )}
        
        {/* Description */}
        {roadwork.description && (
          <Text style={styles.alertDescription} numberOfLines={2}>
            {roadwork.description}
          </Text>
        )}
      </View>
      
      {/* Special Status Indicators */}
      {(roadwork.workStatus === 'in_progress' || roadwork.is_emergency) && (
        <View style={styles.statusIndicators}>
          {roadwork.workStatus === 'in_progress' && (
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>IN PROGRESS TODAY</Text>
            </View>
          )}
          {roadwork.is_emergency && (
            <View style={styles.emergencyIndicator}>
              <Ionicons name="warning" size={12} color="#dc2626" />
              <Text style={styles.emergencyText}>EMERGENCY WORKS</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Authority and Timing Info */}
      {(roadwork.authority || roadwork.sm_permit_reference || roadwork.startDate) && (
        <View style={styles.metadataSection}>
          {roadwork.authority && (
            <View style={styles.metadataRow}>
              <Ionicons name="business-outline" size={14} color="#6b7280" />
              <Text style={styles.metadataText}>{roadwork.authority}</Text>
            </View>
          )}
          {roadwork.sm_permit_reference && (
            <View style={styles.metadataRow}>
              <Ionicons name="document-text-outline" size={14} color="#6b7280" />
              <Text style={styles.metadataText}>{roadwork.sm_permit_reference}</Text>
            </View>
          )}
          {roadwork.startDate && (
            <View style={styles.metadataRow}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.metadataText}>
                {roadwork.duration || '4-6 hours'} • {formatDate(roadwork.startDate)}
              </Text>
            </View>
          )}
        </View>
      )}


      {/* Affected Routes */}
      {roadwork.affectsRoutes && roadwork.affectsRoutes.length > 0 && (
        <View style={styles.routesSection}>
          <Text style={styles.routesLabel}>Routes:</Text>
          <View style={styles.routesContainer}>
            {roadwork.affectsRoutes.slice(0, 8).map((route, index) => (
              <View key={index} style={styles.routeChip}>
                <Text style={styles.routeChipText}>{route}</Text>
              </View>
            ))}
            {roadwork.affectsRoutes.length > 8 && (
              <Text style={styles.moreRoutesText}>
                +{roadwork.affectsRoutes.length - 8} more
              </Text>
            )}
          </View>
        </View>
      )}
      
      {/* Created By Footer */}
      <View style={styles.footerSection}>
        <Text style={styles.createdByText}>
          Created by {roadwork.created_by || roadwork.supervisorName || 'System'}
        </Text>
        <Text style={styles.dateText}>
          {formatDate(roadwork.created_at || roadwork.createdAt)}
        </Text>
        {/* Action Icons */}
        <View style={styles.actionIcons}>
          {isAdmin && onStatusChange && (
            <Pressable 
              style={styles.actionIcon}
              onPress={() => onStatusChange(roadwork)}
            >
              <Ionicons name="create-outline" size={16} color="#6b7280" />
            </Pressable>
          )}
          {isAdmin && (
            <Pressable style={styles.actionIcon}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          )}
        </View>
      </View>


    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(roadwork)}
        onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        onPressIn={() => Platform.OS !== 'web' && setIsHovered(true)}
        onPressOut={() => Platform.OS !== 'web' && setIsHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`Roadwork: ${roadwork.title || roadwork.location}`}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

// Preset configurations for different roadwork card types
export const RoadworkCardPresets = {
  standard: (roadwork, callbacks) => ({
    roadwork,
    showActions: true,
    compact: false,
    ...callbacks
  }),
  
  compact: (roadwork, callbacks) => ({
    roadwork,
    showActions: false,
    compact: true,
    ...callbacks
  }),
  
  dashboard: (roadwork, callbacks) => ({
    roadwork,
    showActions: true,
    compact: false,
    isAdmin: false,
    ...callbacks
  }),
  
  admin: (roadwork, callbacks) => ({
    roadwork,
    showActions: true,
    compact: false,
    isAdmin: true,
    ...callbacks
  })
};

// Custom styles for the new alert-style layout
const styles = {
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertCardHover: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertContent: {
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  progressIndicator: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emergencyIndicator: {
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  emergencyText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metadataSection: {
    marginBottom: 12,
    gap: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: '#6b7280',
  },
  routesSection: {
    marginBottom: 12,
  },
  routesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  routeChipText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '600',
  },
  moreRoutesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  createdByText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
};

export default RoadworkCard;