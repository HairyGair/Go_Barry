// traffic-watch/components/TrafficCard.jsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Info, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TrafficCard = ({ 
  alert,
  onPress = null,
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;

  // Handle missing alert prop
  if (!alert) {
    return (
      <View style={[styles.card, styles.errorCard, style]}>
        <Text style={styles.errorText}>No alert data available</Text>
      </View>
    );
  }

  // Extract data with fallbacks
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

  // Color schemes based on status
  const getStatusColors = () => {
    switch (status) {
      case 'red':
        return {
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          indicatorColor: '#DC2626',
          textColor: '#FCA5A5'
        };
      case 'amber':
        return {
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          indicatorColor: '#D97706',
          textColor: '#FCD34D'
        };
      default:
        return {
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          indicatorColor: '#059669',
          textColor: '#6EE7B7'
        };
    }
  };

  const getSeverityIcon = () => {
    const iconProps = { size: 16 };
    switch (severity) {
      case 'High':
        return <AlertTriangle {...iconProps} color="#EF4444" />;
      case 'Medium':
        return <Info {...iconProps} color="#F59E0B" />;
      default:
        return <Info {...iconProps} color="#10B981" />;
    }
  };

  const getSourceDisplay = () => {
    switch (source) {
      case 'national_highways':
        return 'National Highways';
      case 'streetmanager':
        return 'Street Manager';
      default:
        return authority || 'Unknown Source';
    }
  };

  const getTypeDisplay = () => {
    return type === 'incident' ? 'Incident' : 'Roadworks';
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

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
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
        onPress={onPress || toggleExpanded}
        style={styles.contentContainer}
        activeOpacity={0.7}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              {getSeverityIcon()}
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
            
            <Text style={styles.subtitle}>
              {getTypeDisplay()} • {getSourceDisplay()}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: colors.indicatorColor }]}>
              <Text style={styles.statusBadgeText}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={14} color="#9CA3AF" />
          <Text style={styles.locationText} numberOfLines={2}>
            {location}
          </Text>
        </View>

        {/* Route Badges */}
        {affectsRoutes && affectsRoutes.length > 0 && (
          <View style={styles.routeContainer}>
            <Text style={styles.routeLabel}>Affects routes:</Text>
            <View style={styles.routeBadgeContainer}>
              {affectsRoutes.slice(0, 8).map((route, index) => (
                <View key={`${route}-${index}`} style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>{route}</Text>
                </View>
              ))}
              {affectsRoutes.length > 8 && (
                <View style={styles.moreRoutesBadge}>
                  <Text style={styles.moreRoutesText}>
                    +{affectsRoutes.length - 8} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Duration/Timing */}
        {durationText && (
          <View style={styles.durationRow}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.durationText}>
              {durationText}
            </Text>
          </View>
        )}

        {/* Description Preview */}
        <Text 
          style={styles.description} 
          numberOfLines={isExpanded ? undefined : 2}
        >
          {description}
        </Text>

        {/* Expand Button */}
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Show Less' : 'Show More'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color="#60A5FA" />
          ) : (
            <ChevronDown size={16} color="#60A5FA" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded Details */}
      <Animated.View
        style={[
          styles.expandedContainer,
          {
            opacity: animationValue,
            maxHeight: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500]
            })
          }
        ]}
      >
        {isExpanded && (
          <View style={styles.expandedContent}>
            
            {/* Detailed Timing */}
            {(startDate || endDate) && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Timing Details</Text>
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
            {affectsRoutes && affectsRoutes.length > 8 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>All Affected Routes</Text>
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
              <Text style={styles.detailCardTitle}>Additional Information</Text>
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderLeftWidth: 4,
    borderRadius: 8,
    marginVertical: 8,
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
  },
  statusBar: {
    height: 4,
  },
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  routeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  moreRoutesBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  moreRoutesText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginLeft: 8,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  expandButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    marginRight: 4,
  },
  expandedContainer: {
    overflow: 'hidden',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
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
    fontWeight: '500',
    marginBottom: 8,
  },
  detailCardText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
  allRoutesBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default TrafficCard;