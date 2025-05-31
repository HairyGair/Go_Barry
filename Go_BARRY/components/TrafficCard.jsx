// Go_BARRY/components/TrafficCard.jsx
// Fixed version with better text layout and spacing
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const TrafficCard = ({ 
  alert,
  onPress = null,
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alert) {
    return (
      <View style={[styles.card, styles.errorCard, style]}>
        <Text style={styles.errorText}>❌ No alert data available</Text>
      </View>
    );
  }

  const {
    id = 'unknown',
    title = 'Traffic Alert',
    description = 'No description available',
    location = 'Location not specified',
    authority = 'Unknown',
    affectsRoutes = [],
    startDate = null,
    endDate = null,
    status = 'green',
    severity = 'Low',
    type = 'roadwork',
    source = 'unknown',
    lastUpdated = null
  } = alert;

  const getStatusColors = () => {
    switch (status) {
      case 'red':
        return {
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          indicatorColor: '#DC2626'
        };
      case 'amber':
        return {
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          indicatorColor: '#D97706'
        };
      default:
        return {
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          indicatorColor: '#059669'
        };
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      default: return '🟢';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'incident': return '🚨';
      case 'congestion': return '🚦';
      default: return '🚧';
    }
  };

  const getSourceDisplay = () => {
    switch (source) {
      case 'national_highways': return 'National Highways';
      case 'streetmanager': return 'Street Manager';
      case 'traffic_monitoring': return 'Traffic Monitoring';
      case 'police_reports': return 'Police Reports';
      default: return authority || 'Unknown Source';
    }
  };

  const getTypeDisplay = () => {
    switch (type) {
      case 'incident': return 'Traffic Incident';
      case 'congestion': return 'Traffic Congestion';
      case 'roadwork': return 'Roadworks';
      default: return 'Traffic Alert';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const getDurationText = () => {
    if (!startDate || !endDate) return null;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      if (end < now) return 'Completed';
      if (start > now) {
        const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        return `Starts in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
      }
      
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
    } catch {
      return null;
    }
  };

  const colors = getStatusColors();
  const durationText = getDurationText();

  return (
    <View style={[
      styles.card,
      { 
        borderLeftColor: colors.borderColor,
        backgroundColor: colors.backgroundColor 
      },
      style
    ]}>
      {/* Status Indicator Bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.indicatorColor }]} />
      
      {/* Main Content */}
      <TouchableOpacity
        onPress={onPress || (() => setIsExpanded(!isExpanded))}
        style={styles.contentContainer}
        activeOpacity={0.7}
      >
        {/* Header Section - Fixed Layout */}
        <View style={styles.headerSection}>
          {/* Title Row with Better Spacing */}
          <View style={styles.titleRow}>
            <Text style={styles.severityIcon}>{getSeverityIcon()}</Text>
            <Text style={styles.typeIcon}>{getTypeIcon()}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </View>
          
          {/* Status Badge - Moved to Own Row */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.indicatorColor }]}>
              <Text style={styles.statusBadgeText}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Type and Source Row - Separate from Title */}
        <View style={styles.metaRow}>
          <Text style={styles.typeText}>{getTypeDisplay()}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.sourceText}>{getSourceDisplay()}</Text>
        </View>

        {/* Location Row - Improved Spacing */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {location}
          </Text>
        </View>

        {/* Route Badges - Better Layout */}
        {affectsRoutes && affectsRoutes.length > 0 && (
          <View style={styles.routeSection}>
            <Text style={styles.routeLabel}>🚌 Affected Routes:</Text>
            <View style={styles.routeBadgeContainer}>
              {affectsRoutes.slice(0, 6).map((route, index) => (
                <View key={`${route}-${index}`} style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>{route}</Text>
                </View>
              ))}
              {affectsRoutes.length > 6 && (
                <View style={styles.moreRoutesBadge}>
                  <Text style={styles.moreRoutesText}>
                    +{affectsRoutes.length - 6} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Duration/Timing - Better Spacing */}
        {durationText && (
          <View style={styles.durationRow}>
            <Text style={styles.durationIcon}>⏰</Text>
            <Text style={styles.durationText}>
              {durationText}
            </Text>
          </View>
        )}

        {/* Description - Improved Readability */}
        <View style={styles.descriptionSection}>
          <Text 
            style={styles.description} 
            numberOfLines={isExpanded ? undefined : 3}
          >
            {description}
          </Text>
        </View>

        {/* Expand Button - Better Visual Separation */}
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Show Less' : 'Show More'}
          </Text>
          <Text style={styles.expandButtonIcon}>
            {isExpanded ? '🔼' : '🔽'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          
          {/* Detailed Timing */}
          {(startDate || endDate) && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>📅 Timing Details</Text>
              {startDate && (
                <Text style={styles.detailCardText}>
                  Start: {formatDateTime(startDate)}
                </Text>
              )}
              {endDate && (
                <Text style={styles.detailCardText}>
                  End: {formatDateTime(endDate)}
                </Text>
              )}
            </View>
          )}

          {/* All Affected Routes */}
          {affectsRoutes && affectsRoutes.length > 6 && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>🚌 All Affected Routes</Text>
              <View style={styles.allRoutesBadgeContainer}>
                {affectsRoutes.map((route, index) => (
                  <View key={`expanded-${route}-${index}`} style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{route}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Details */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>ℹ️ Additional Information</Text>
            <Text style={styles.detailCardText}>Alert ID: {id}</Text>
            <Text style={styles.detailCardText}>Severity: {severity}</Text>
            <Text style={styles.detailCardText}>Source: {getSourceDisplay()}</Text>
            {lastUpdated && (
              <Text style={styles.detailCardText}>
                Last Updated: {formatDateTime(lastUpdated)}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderLeftWidth: 4,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorCard: {
    borderLeftColor: '#6B7280',
    backgroundColor: '#374151',
  },
  errorText: {
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  statusBar: {
    height: 4,
  },
  contentContainer: {
    padding: 16,
  },
  
  // FIXED: Header Section with Better Layout
  headerSection: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  severityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  statusRow: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // FIXED: Meta Information Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  typeText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    color: '#9CA3AF',
    fontSize: 14,
    marginHorizontal: 8,
  },
  sourceText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  
  // FIXED: Location with Better Spacing
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  locationText: {
    color: '#D1D5DB',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  
  // FIXED: Route Section
  routeSection: {
    marginBottom: 12,
  },
  routeLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  routeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  routeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  moreRoutesBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  moreRoutesText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // FIXED: Duration Row
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  durationIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  durationText: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // FIXED: Description Section
  descriptionSection: {
    marginBottom: 12,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  
  // FIXED: Expand Button
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    marginTop: 8,
  },
  expandButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  expandButtonIcon: {
    fontSize: 12,
  },
  
  // Expanded Content Styles
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    backgroundColor: '#111827',
  },
  detailCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  detailCardTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailCardText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  allRoutesBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

export default TrafficCard;