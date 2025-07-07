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
      roadworksStyles.roadworkCard,
      roadwork.severity === 'critical' && roadworksStyles.roadworkCardCritical,
      roadwork.severity === 'high' && roadworksStyles.roadworkCardWarning,
      compact && { padding: spacing.md },
      isHovered && roadworksStyles.roadworkCardHover,
      Platform.OS === 'web' && { 
        cursor: onPress ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        transitionProperty: 'transform, box-shadow, border-color'
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
            <View style={roadworksStyles.roadworkLocation}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={[roadworksStyles.roadworkLocation, { marginBottom: 0, marginLeft: 4 }]} numberOfLines={1}>
                {roadwork.location}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: statusConfig.bgColor,
            borderWidth: 1,
            borderColor: statusConfig.color
          }
        ]}>
          <Ionicons 
            name={statusConfig.icon} 
            size={14} 
            color={statusConfig.color} 
          />
          <Text style={[roadworksStyles.statusBadgeText, statusConfig.textStyle]}>
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
            { 
              backgroundColor: getSeverityColor(roadwork.severity) + '20',
              borderWidth: 1,
              borderColor: getSeverityColor(roadwork.severity)
            }
          ]}>
            <Ionicons 
              name={roadwork.severity === 'critical' ? 'warning' : roadwork.severity === 'high' ? 'alert' : 'information-circle'} 
              size={14} 
              color={getSeverityColor(roadwork.severity)} 
            />
            <Text style={[roadworksStyles.statusBadgeText, { color: getSeverityColor(roadwork.severity) }]}>
              {roadwork.severity.charAt(0).toUpperCase() + roadwork.severity.slice(1)}
            </Text>
          </View>
        )}

        {/* Impact Score */}
        {(roadwork.details?.impactScore || roadwork.impactScore) && (
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: impact.color + '20',
              borderWidth: 1,
              borderColor: impact.color
            }
          ]}>
            <Ionicons name="speedometer" size={14} color={impact.color} />
            <Text style={[roadworksStyles.statusBadgeText, { color: impact.color }]}>
              {impact.text} Impact
            </Text>
          </View>
        )}

        {/* Source Badge */}
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: roadwork.source === 'StreetManager' 
              ? '#E0E7FF' 
              : '#F3F4F6',
            borderWidth: 1,
            borderColor: roadwork.source === 'StreetManager' 
              ? colors.primary 
              : colors.border
          }
        ]}>
          <Ionicons 
            name={roadwork.source === 'StreetManager' ? 'business' : 'person'} 
            size={14} 
            color={roadwork.source === 'StreetManager' ? colors.primary : colors.textMuted} 
          />
          <Text style={[
            roadworksStyles.statusBadgeText, 
            { color: roadwork.source === 'StreetManager' ? colors.primary : colors.textMuted }
          ]}>
            {roadwork.source || 'Manual'}
          </Text>
        </View>

        {/* Time Remaining */}
        {timeRemaining && (
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: timeRemaining === 'Overdue' 
                ? colors.criticalBg 
                : colors.infoBg,
              borderWidth: 1,
              borderColor: timeRemaining === 'Overdue' 
                ? colors.critical 
                : colors.info
            }
          ]}>
            <Ionicons 
              name="time" 
              size={14} 
              color={timeRemaining === 'Overdue' ? colors.critical : colors.info} 
            />
            <Text style={[
              roadworksStyles.statusBadgeText,
              { color: timeRemaining === 'Overdue' ? colors.critical : colors.info }
            ]}>
              {timeRemaining}
            </Text>
          </View>
        )}
      </View>

      {/* Affected Routes */}
      {roadwork.affectsRoutes && roadwork.affectsRoutes.length > 0 && (
        <View style={roadworksStyles.section}>
          <Text style={[roadworksStyles.statLabel, { marginBottom: spacing.xs, color: colors.textSecondary }]}>
            Affected Routes ({roadwork.affectsRoutes.length})
          </Text>
          <View style={roadworksStyles.roadworkMeta}>
            {roadwork.affectsRoutes.slice(0, compact ? 3 : 6).map((route, index) => (
              <View key={index} style={roadworksStyles.routeChip}>
                <Text style={roadworksStyles.routeChipText}>{route}</Text>
              </View>
            ))}
            {roadwork.affectsRoutes.length > (compact ? 3 : 6) && (
              <View style={[
                roadworksStyles.statusBadge,
                { 
                  backgroundColor: colors.surfaceLight,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: spacing.sm
                }
              ]}>
                <Text style={[roadworksStyles.statusBadgeText, { color: colors.textMuted }]}>
                  +{roadwork.affectsRoutes.length - (compact ? 3 : 6)} more
                </Text>
              </View>
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
          {/* Primary Action: Create Diversion Message */}
          {onCreateDiversion && roadwork.status === 'active' && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonPrimary]}
              onPress={() => onCreateDiversion(roadwork)}
            >
              <Ionicons name="megaphone" size={16} color={colors.textInverse} />
              <Text style={[roadworksStyles.actionButtonText, { color: colors.textInverse }]}>
                Create Diversion Message
              </Text>
            </Pressable>
          )}

          {/* View Details */}
          {onViewDetails && (
            <Pressable
              style={roadworksStyles.actionButton}
              onPress={() => onViewDetails(roadwork)}
            >
              <Ionicons name="information-circle" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.actionButtonText}>
                View Details
              </Text>
            </Pressable>
          )}

          {/* View Map */}
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

          {/* View on One.Network */}
          {(roadwork.sm_permit_reference || roadwork.sm_reference || roadwork.permitReference) && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={async () => {
                const reference = roadwork.sm_permit_reference || roadwork.sm_reference || roadwork.permitReference;
                const oneNetworkUrl = `https://one.network/?${reference}`;
                
                try {
                  if (Platform.OS === 'web') {
                    window.open(oneNetworkUrl, '_blank');
                  } else {
                    await Linking.openURL(oneNetworkUrl);
                  }
                } catch (error) {
                  console.error('Failed to open One.Network URL:', error);
                }
              }}
            >
              <Ionicons name="globe" size={16} color={colors.info} />
              <Text style={[roadworksStyles.actionButtonText, { color: colors.info }]}>
                View on One.Network
              </Text>
            </Pressable>
          )}

          {/* View Diversions */}
          {onViewDiversions && roadwork.hasDiversion && (
            <Pressable
              style={roadworksStyles.actionButton}
              onPress={() => onViewDiversions(roadwork)}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.actionButtonText}>
                View Diversions
              </Text>
            </Pressable>
          )}

          {/* Admin Actions */}
          {isAdmin && onStatusChange && (
            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
              onPress={() => onStatusChange(roadwork)}
            >
              <Ionicons 
                name={roadwork.status === 'monitoring' ? "checkmark-circle" : "create"} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[roadworksStyles.actionButtonText, roadworksStyles.actionButtonTextSecondary]}>
                {roadwork.status === 'monitoring' ? 'Take Action' : 'Edit Status'}
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
            backgroundColor: colors.criticalBg,
            borderWidth: 1,
            borderColor: colors.critical,
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            zIndex: 1
          }
        ]}>
          <Ionicons name="flash" size={14} color={colors.critical} />
          <Text style={[roadworksStyles.statusBadgeText, { color: colors.critical, fontWeight: '700' }]}>EMERGENCY</Text>
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