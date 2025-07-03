/*
 * Go Barry - Enhanced Roadwork Card Component
 * Modern card design for individual roadwork items with rich interactions
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const RoadworkCard = ({
  roadwork,
  onPress,
  onStatusChange,
  onViewDiversions,
  onViewMap,
  showActions = true,
  isAdmin = false,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get status configuration
  const getStatusConfig = (status) => {
    const configs = {
      active: { color: colors.success, icon: 'play-circle', label: 'Active' },
      planned: { color: colors.warning, icon: 'calendar', label: 'Planned' },
      completed: { color: colors.textMuted, icon: 'checkmark-done', label: 'Completed' },
      cancelled: { color: colors.textMuted, icon: 'close-circle', label: 'Cancelled' },
      critical: { color: colors.critical, icon: 'warning', label: 'Critical' },
      monitoring: { color: colors.info, icon: 'eye', label: 'Monitoring' }
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
      roadworksStyles.roadworkCard,
      compact && { padding: spacing.md },
      isHovered && roadworksStyles.roadworkCardHover,
      Platform.OS === 'web' && { 
        cursor: onPress ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }
    ]}>
      {/* Header */}
      <View style={roadworksStyles.roadworkCardHeader}>
        <View style={roadworksStyles.flex1}>
          <Text style={[
            roadworksStyles.roadworkTitle,
            compact && { fontSize: 16, lineHeight: 22 }
          ]} numberOfLines={compact ? 1 : 2}>
            {roadwork.title || roadwork.location || 'Unnamed Roadwork'}
          </Text>
          
          {roadwork.location && roadwork.title !== roadwork.location && (
            <Text style={roadworksStyles.roadworkLocation} numberOfLines={1}>
              <Ionicons name="location" size={12} color={colors.textSecondary} />
              {' '}{roadwork.location}
            </Text>
          )}
        </View>

        {/* Status Badge */}
        <View style={[
          roadworksStyles.statusBadge,
          { backgroundColor: statusConfig.color }
        ]}>
          <Ionicons 
            name={statusConfig.icon} 
            size={12} 
            color={colors.textPrimary} 
          />
          <Text style={roadworksStyles.statusBadgeText}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Description */}
      {roadwork.description && !compact && (
        <Text 
          style={roadworksStyles.roadworkDescription}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {roadwork.description}
        </Text>
      )}

      {/* Metadata Row */}
      <View style={roadworksStyles.roadworkMeta}>
        {/* Severity Indicator */}
        {roadwork.severity && (
          <View style={[
            roadworksStyles.statusBadge,
            { backgroundColor: getSeverityColor(roadwork.severity) }
          ]}>
            <Text style={roadworksStyles.statusBadgeText}>
              {roadwork.severity.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Impact Score */}
        {(roadwork.details?.impactScore || roadwork.impactScore) && (
          <View style={[
            roadworksStyles.statusBadge,
            { backgroundColor: impact.color }
          ]}>
            <Ionicons name="speedometer" size={12} color={colors.textPrimary} />
            <Text style={roadworksStyles.statusBadgeText}>
              {impact.text}
            </Text>
          </View>
        )}

        {/* Source Badge */}
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: roadwork.source === 'StreetManager' 
              ? colors.primary 
              : colors.interactive 
          }
        ]}>
          <Ionicons 
            name={roadwork.source === 'StreetManager' ? 'business' : 'person-add'} 
            size={12} 
            color={colors.textPrimary} 
          />
          <Text style={roadworksStyles.statusBadgeText}>
            {roadwork.source || 'Manual'}
          </Text>
        </View>

        {/* Time Remaining */}
        {timeRemaining && (
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: timeRemaining === 'Overdue' 
                ? colors.critical 
                : colors.info 
            }
          ]}>
            <Ionicons name="time" size={12} color={colors.textPrimary} />
            <Text style={roadworksStyles.statusBadgeText}>
              {timeRemaining}
            </Text>
          </View>
        )}
      </View>

      {/* Affected Routes */}
      {roadwork.affectsRoutes && roadwork.affectsRoutes.length > 0 && (
        <View style={roadworksStyles.section}>
          <Text style={[roadworksStyles.statLabel, { marginBottom: spacing.xs }]}>
            Affected Routes ({roadwork.affectsRoutes.length})
          </Text>
          <View style={roadworksStyles.roadworkMeta}>
            {roadwork.affectsRoutes.slice(0, compact ? 3 : 6).map((route, index) => (
              <View key={index} style={roadworksStyles.routeChip}>
                <Text style={roadworksStyles.routeChipText}>{route}</Text>
              </View>
            ))}
            {roadwork.affectsRoutes.length > (compact ? 3 : 6) && (
              <Text style={roadworksStyles.textMuted}>
                +{roadwork.affectsRoutes.length - (compact ? 3 : 6)} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Dates */}
      {!compact && (roadwork.startDate || roadwork.endDate) && (
        <View style={roadworksStyles.roadworkMeta}>
          {roadwork.startDate && (
            <View style={roadworksStyles.row}>
              <Ionicons name="play" size={14} color={colors.textMuted} />
              <Text style={roadworksStyles.statTrendText}>
                Start: {formatDate(roadwork.startDate)}
              </Text>
            </View>
          )}
          {roadwork.endDate && (
            <View style={roadworksStyles.row}>
              <Ionicons name="stop" size={14} color={colors.textMuted} />
              <Text style={roadworksStyles.statTrendText}>
                End: {formatDate(roadwork.endDate)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {showActions && !compact && (
        <View style={[roadworksStyles.roadworkMeta, { marginTop: spacing.md }]}>
          {onViewMap && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={() => onViewMap(roadwork)}
            >
              <Ionicons name="map" size={16} color={colors.textSecondary} />
              <Text style={[roadworksStyles.actionButtonText, roadworksStyles.actionButtonTextSecondary]}>
                View Map
              </Text>
            </Pressable>
          )}

          {onViewDiversions && roadwork.hasDiversion && (
            <Pressable
              style={roadworksStyles.actionButton}
              onPress={() => onViewDiversions(roadwork)}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.actionButtonText}>
                Diversions
              </Text>
            </Pressable>
          )}

          {isAdmin && onStatusChange && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={() => onStatusChange(roadwork)}
            >
              <Ionicons name="create" size={16} color={colors.textSecondary} />
              <Text style={[roadworksStyles.actionButtonText, roadworksStyles.actionButtonTextSecondary]}>
                Edit Status
              </Text>
            </Pressable>
          )}

          {/* Expand/Collapse */}
          {roadwork.description && roadwork.description.length > 100 && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[roadworksStyles.actionButtonText, roadworksStyles.actionButtonTextSecondary]}>
                {isExpanded ? 'Show Less' : 'Show More'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Emergency/Critical Indicator */}
      {roadwork.details?.isEmergency && (
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: colors.critical,
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            zIndex: 1
          }
        ]}>
          <Ionicons name="flash" size={12} color={colors.textPrimary} />
          <Text style={roadworksStyles.statusBadgeText}>EMERGENCY</Text>
        </View>
      )}
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

export default RoadworkCard;