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
  onViewMap = null,
  onPushToDisplay = null,
  onPromoteToIncident = null,
  onGenerateMessages = null,
  onUpdateStatus = null,
  onViewSuggestions = null,
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
    source = 'manual',
    isTrafficIncident = false,
    delayMinutes,
    lengthMeters,
    intelligenceScore,
    lastUpdated
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
    const incidentType = type.toLowerCase();
    if (incidentType.includes('traffic')) return 'car-sport';
    if (incidentType.includes('congestion')) return 'speedometer';
    if (incidentType.includes('roadwork')) return 'construct';
    if (incidentType.includes('weather')) return 'partly-sunny';
    if (incidentType.includes('breakdown')) return 'warning';
    if (incidentType.includes('event')) return 'calendar';
    if (incidentType.includes('accident')) return 'medical';
    return 'alert-circle';
  };

  // Get type color based on severity and type
  const getTypeColor = () => {
    const incidentType = type.toLowerCase();
    if (incidentType.includes('traffic') || incidentType.includes('congestion')) return colors.rtc;
    if (incidentType.includes('roadwork')) return colors.roadworks;
    if (incidentType.includes('weather')) return colors.weather;
    if (incidentType.includes('breakdown')) return colors.breakdown;
    if (incidentType.includes('event')) return colors.event;
    return colors.other;
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
        <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor()}15` }]}>
          <Ionicons name={getTypeIcon()} size={16} color={getTypeColor()} />
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
            {/* Live indicator for traffic incidents */}
            {isTrafficIncident && (
              <>
                <Text style={styles.separator}>•</Text>
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </>
            )}
            {/* Intelligence Score for Traffic Incidents */}
            {incident.intelligenceScore && (
              <>
                <Text style={styles.separator}>•</Text>
                <View style={styles.intelligenceScore}>
                  <Ionicons name="analytics" size={12} color={colors.textMuted} />
                  <Text style={styles.intelligenceText}>{incident.intelligenceScore}</Text>
                </View>
              </>
            )}
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
          {onViewSuggestions && (
            <Pressable 
              style={[styles.actionButton, styles.suggestionsButton]} 
              onPress={() => onViewSuggestions(incident)}
              title="AI Suggestions"
            >
              <Ionicons name="bulb-outline" size={16} color={colors.ai} />
            </Pressable>
          )}
          {onGenerateMessages && !isTrafficIncident && (
            <Pressable 
              style={[styles.actionButton, styles.messageButton]} 
              onPress={() => onGenerateMessages(incident)}
              title="Generate Messages"
            >
              <Ionicons name="chatbubbles-outline" size={16} color={colors.info} />
            </Pressable>
          )}
          {onViewMap && (incident.coordinates || incident.location) && (
            <Pressable 
              style={[styles.actionButton, styles.mapButton]} 
              onPress={() => onViewMap(incident)}
              title="View on Map"
            >
              <Ionicons name="map-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
          {onPushToDisplay && (
            <Pressable 
              style={[styles.actionButton, styles.displayButton]} 
              onPress={() => onPushToDisplay(incident)}
              title="Push to Control Room Display"
            >
              <Ionicons name="tv-outline" size={16} color={colors.warning} />
            </Pressable>
          )}
          {/* Show different actions for traffic vs manual incidents */}
          {isTrafficIncident && onPromoteToIncident ? (
            <Pressable 
              style={[styles.actionButton, styles.promoteButton]} 
              onPress={() => onPromoteToIncident(incident)}
              title="Create Manual Incident"
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.success} />
            </Pressable>
          ) : (
            <>
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
              {onUpdateStatus && (
                <Pressable 
                  style={[styles.actionButton, { backgroundColor: `${getStatusColor()}15` }]} 
                  onPress={() => onUpdateStatus(incident)}
                  title="Update Status"
                >
                  <Ionicons name="flag-outline" size={16} color={getStatusColor()} />
                </Pressable>
              )}
            </>
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
      
      {/* Traffic incident specific info */}
      {isTrafficIncident && (delayMinutes || lengthMeters) && (
        <View style={styles.trafficInfo}>
          {delayMinutes && (
            <View style={styles.trafficStat}>
              <Ionicons name="time-outline" size={14} color={colors.error} />
              <Text style={styles.trafficStatText}>{delayMinutes} min delay</Text>
            </View>
          )}
          {lengthMeters && (
            <View style={styles.trafficStat}>
              <Ionicons name="resize-outline" size={14} color={colors.warning} />
              <Text style={styles.trafficStatText}>{lengthMeters}m affected</Text>
            </View>
          )}
        </View>
      )}
      
      {affectsRoutes.length > 0 && (
        <View style={styles.routesContainer}>
          <Ionicons name="bus-outline" size={14} color={colors.textMuted} />
          <Text style={styles.routesLabel}>Routes:</Text>
          <View style={styles.routesTags}>
            {affectsRoutes.slice(0, 5).map((route, index) => {
              const routeStr = String(route);
              const isExpress = routeStr.startsWith('X');
              const isNight = routeStr.startsWith('N');
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.routeTag,
                    isExpress && styles.expressRouteTag,
                    isNight && styles.nightRouteTag
                  ]}
                >
                  <Text style={[
                    styles.routeTagText,
                    isExpress && styles.expressRouteText
                  ]}>
                    {route}
                  </Text>
                </View>
              );
            })}
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
    onPress && styles.pressable,
    isTrafficIncident && styles.trafficIncidentCard,
    priority === 'high' && styles.highPriorityCard,
    priority === 'medium' && styles.mediumPriorityCard,
    priority === 'low' && styles.lowPriorityCard,
    status === 'resolved' && styles.resolvedCard
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

  intelligenceScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  intelligenceText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
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

  mapButton: {
    backgroundColor: `${colors.primary}15`,
  },

  messageButton: {
    backgroundColor: `${colors.info}15`,
  },

  displayButton: {
    backgroundColor: `${colors.warning}15`,
  },

  suggestionsButton: {
    backgroundColor: `${colors.ai || '#9C27B0'}15`,
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
    backgroundColor: '#00B9E4', // Go North East brand blue
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#0088B3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  routeTagText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
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

  trafficIncidentCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: `${colors.warning}05`,
  },

  liveIndicator: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  liveText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },

  trafficInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  trafficStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  trafficStatText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  promoteButton: {
    backgroundColor: `${colors.success}15`,
  },
  
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderColor: colors.error,
  },
  
  mediumPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  
  lowPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  
  resolvedCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: `${colors.success}05`,
  },
  
  expressRouteTag: {
    backgroundColor: '#E4B400', // Gold for express routes
    borderColor: '#C09600',
  },
  
  expressRouteText: {
    fontWeight: '800',
  },
  
  nightRouteTag: {
    backgroundColor: '#1B1B3A', // Dark blue for night routes
    borderColor: '#0F0F26',
  },
};

export default IncidentCard;