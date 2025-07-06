/*
 * Go Barry - Incidents Manager V2 Incident Card Component
 * Modern incident display card with priority indicators and actions
 */

import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../styles/incidents.styles';

const IncidentCard = ({ 
  incident,
  onPress = null,
  onEdit = null,
  onResolve = null,
  showActions = true,
  compact = false 
}) => {
  if (!incident) return null;

  const {
    id,
    title = 'Untitled Incident',
    description = '',
    location = 'Location TBC',
    status = 'active',
    priority = 'medium',
    type = 'other',
    affectsRoutes = [],
    createdAt,
    updatedAt,
    source = 'manual'
  } = incident;

  // Get priority color
  const getPriorityColor = () => {
    switch (priority.toLowerCase()) {
      case 'high': return colors.priorityHigh;
      case 'medium': return colors.priorityMedium;
      case 'low': return colors.priorityLow;
      default: return colors.textMuted;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'active': return colors.error;
      case 'resolved': return colors.success;
      case 'pending': return colors.warning;
      default: return colors.textMuted;
    }
  };

  // Get type icon
  const getTypeIcon = () => {
    switch (type.toLowerCase()) {
      case 'rtc': return 'car-sport';
      case 'roadworks': return 'construct';
      case 'weather': return 'partly-sunny';
      case 'breakdown': return 'warning';
      case 'event': return 'calendar';
      default: return 'alert-circle';
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render priority indicator
  const renderPriorityIndicator = () => (
    <View style={[
      styles.priorityIndicator,
      { backgroundColor: getPriorityColor() }
    ]} />
  );

  // Render header with type and status
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.typeIcon, { backgroundColor: `${getPriorityColor()}15` }]}>
          <Ionicons name={getTypeIcon()} size={16} color={getPriorityColor()} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
            {title}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.priority, { color: getPriorityColor() }]}>
              {priority.toUpperCase()}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={[styles.status, { color: getStatusColor() }]}>
              {status.toUpperCase()}
            </Text>
            {source && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.source}>
                  {source.toUpperCase()}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      {showActions && (
        <View style={styles.headerActions}>
          {onEdit && (
            <Pressable style={styles.actionButton} onPress={() => onEdit(incident)}>
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          {onResolve && status !== 'resolved' && (
            <Pressable style={styles.actionButton} onPress={() => onResolve(incident)}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  // Render location and description
  const renderContent = () => (
    <View style={styles.content}>
      {location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>
      )}
      
      {description && !compact && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}
      
      {affectsRoutes.length > 0 && (
        <View style={styles.routesContainer}>
          <Ionicons name="bus-outline" size={14} color={colors.textMuted} />
          <Text style={styles.routesLabel}>Routes:</Text>
          <View style={styles.routesTags}>
            {affectsRoutes.slice(0, 5).map((route, index) => (
              <View key={index} style={styles.routeTag}>
                <Text style={styles.routeTagText}>{route}</Text>
              </View>
            ))}
            {affectsRoutes.length > 5 && (
              <Text style={styles.routesMore}>+{affectsRoutes.length - 5}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  // Render footer with timestamps
  const renderFooter = () => (
    <View style={styles.footer}>
      {createdAt && (
        <Text style={styles.timestamp}>
          Created: {formatTime(createdAt)}
        </Text>
      )}
      {updatedAt && updatedAt !== createdAt && (
        <Text style={styles.timestamp}>
          Updated: {formatTime(updatedAt)}
        </Text>
      )}
    </View>
  );

  const cardStyle = [
    styles.card,
    compact && styles.cardCompact,
    shadows.sm,
    onPress && styles.pressable
  ];

  const content = (
    <>
      {renderPriorityIndicator()}
      <View style={styles.cardContent}>
        {renderHeader()}
        {renderContent()}
        {!compact && renderFooter()}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={cardStyle} onPress={() => onPress(incident)}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {content}
    </View>
  );
};

const styles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  cardCompact: {
    marginVertical: spacing.xs,
  },

  pressable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },

  priorityIndicator: {
    width: 4,
    flexShrink: 0,
  },

  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },

  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },

  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  priority: {
    ...typography.caption,
    fontWeight: '600',
  },

  status: {
    ...typography.caption,
    fontWeight: '600',
  },

  source: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },

  separator: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    marginBottom: spacing.md,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  location: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },

  description: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  routesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  routesLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },

  routesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },

  routeTag: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },

  routeTagText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },

  routesMore: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
};

export default IncidentCard;