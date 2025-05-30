// traffic-watch/components/EnhancedTrafficCard.jsx
// Enhanced TrafficCard component that handles all traffic data types
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Zap,
  Construction,
  Car,
  Navigation
} from 'lucide-react-native';

const EnhancedTrafficCard = ({ alert, onPress = null, style = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  if (!alert) {
    return (
      <View style={[styles.card, styles.errorCard, style]}>
        <Text style={styles.errorText}>No alert data available</Text>
      </View>
    );
  }

  const {
    id = 'unknown',
    title = 'Traffic Alert',
    description = 'No description available',
    location = 'Location not specified',
    type = 'roadwork',
    severity = 'Low',
    status = 'green',
    source = 'unknown',
    affectsRoutes = [],
    
    // Traffic-specific data
    congestionLevel = 0,
    currentSpeed = null,
    freeFlowSpeed = null,
    jamFactor = null,
    delayMinutes = null,
    incidentType = null,
    roadClosed = false,
    estimatedClearTime = null,
    
    // Enhanced metadata
    dataSource = null,
    confidence = null,
    lastUpdated = null
  } = alert;

  // Enhanced color schemes based on alert type and severity
  const getAlertColors = () => {
    switch (type) {
      case 'congestion':
        if (congestionLevel >= 8) return {
          border: 'borderLeftColor: #DC2626', bg: 'backgroundColor: rgba(220, 38, 38, 0.15)',
          indicator: '#DC2626', text: '#FCA5A5'
        };
        if (congestionLevel >= 5) return {
          border: 'borderLeftColor: #D97706', bg: 'backgroundColor: rgba(217, 119, 6, 0.15)',
          indicator: '#D97706', text: '#FCD34D'
        };
        return {
          border: 'borderLeftColor: #059669', bg: 'backgroundColor: rgba(5, 150, 105, 0.15)',
          indicator: '#059669', text: '#6EE7B7'
        };
      
      case 'incident':
        return {
          border: 'borderLeftColor: #DC2626', bg: 'backgroundColor: rgba(220, 38, 38, 0.15)',
          indicator: '#DC2626', text: '#FCA5A5'
        };
      
      default: // roadwork
        switch (status) {
          case 'red': return {
            border: 'borderLeftColor: #DC2626', bg: 'backgroundColor: rgba(220, 38, 38, 0.1)',
            indicator: '#DC2626', text: '#FCA5A5'
          };
          case 'amber': return {
            border: 'borderLeftColor: #D97706', bg: 'backgroundColor: rgba(217, 119, 6, 0.1)',
            indicator: '#D97706', text: '#FCD34D'
          };
          default: return {
            border: 'borderLeftColor: #059669', bg: 'backgroundColor: rgba(5, 150, 105, 0.1)',
            indicator: '#059669', text: '#6EE7B7'
          };
        }
    }
  };

  const getTypeIcon = () => {
    const iconProps = { size: 20, color: '#FFFFFF' };
    switch (type) {
      case 'congestion':
        return <Activity {...iconProps} />;
      case 'incident':
        return <AlertTriangle {...iconProps} />;
      case 'roadwork':
        return <Construction {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getSeverityIcon = () => {
    const iconProps = { size: 16 };
    switch (severity) {
      case 'High':
        return <Zap {...iconProps} color="#EF4444" />;
      case 'Medium':
        return <AlertTriangle {...iconProps} color="#F59E0B" />;
      default:
        return <Info {...iconProps} color="#10B981" />;
    }
  };

  const getSourceDisplay = () => {
    switch (source) {
      case 'here': return 'HERE Traffic';
      case 'mapquest': return 'MapQuest';
      case 'national_highways': return 'National Highways';
      case 'streetmanager': return 'Street Manager';
      default: return 'Traffic System';
    }
  };

  const formatCongestionLevel = () => {
    if (congestionLevel >= 8) return { text: 'Severe', color: '#EF4444' };
    if (congestionLevel >= 5) return { text: 'Moderate', color: '#F59E0B' };
    if (congestionLevel >= 3) return { text: 'Light', color: '#10B981' };
    return { text: 'Free Flow', color: '#10B981' };
  };

  const formatDelay = () => {
    if (delayMinutes > 0) {
      return `${delayMinutes} min delay`;
    }
    return null;
  };

  const formatSpeed = () => {
    if (currentSpeed && freeFlowSpeed) {
      return `${Math.round(currentSpeed)}/${Math.round(freeFlowSpeed)} km/h`;
    }
    return null;
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const colors = getAlertColors();

  return (
    <View style={[styles.card, { borderLeftColor: colors.border }, style]}>
      {/* Status Indicator Bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.indicator }]} />
      
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
              {type === 'congestion' ? 'Traffic Congestion' : 
               type === 'incident' ? incidentType || 'Traffic Incident' :
               'Roadworks'} • {getSourceDisplay()}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.typeIconContainer, { backgroundColor: colors.indicator }]}>
              {getTypeIcon()}
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

        {/* Traffic-specific indicators */}
        {type === 'congestion' && (
          <View style={styles.trafficMetrics}>
            {congestionLevel > 0 && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Congestion:</Text>
                <Text style={[styles.metricValue, { color: formatCongestionLevel().color }]}>
                  {formatCongestionLevel().text} ({congestionLevel}/10)
                </Text>
              </View>
            )}
            
            {formatSpeed() && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Speed:</Text>
                <Text style={styles.metricValue}>{formatSpeed()}</Text>
              </View>
            )}
            
            {formatDelay() && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Delay:</Text>
                <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{formatDelay()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Incident-specific indicators */}
        {type === 'incident' && (
          <View style={styles.incidentMetrics}>
            {roadClosed && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>ROAD CLOSED</Text>
              </View>
            )}
            
            {estimatedClearTime && (
              <View style={styles.metricItem}>
                <Clock size={14} color="#9CA3AF" />
                <Text style={styles.metricValue}>
                  Clear by {new Date(estimatedClearTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>
        )}

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

        {/* Description */}
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
            opacity: animation,
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600]
            })
          }
        ]}
      >
        {isExpanded && (
          <View style={styles.expandedContent}>
            
            {/* Detailed Traffic Metrics */}
            {(type === 'congestion' || type === 'incident') && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Traffic Details</Text>
                
                {jamFactor && (
                  <Text style={styles.detailCardText}>
                    Jam Factor: {Math.round(jamFactor * 100)}% (HERE data)
                  </Text>
                )}
                
                {confidence && (
                  <Text style={styles.detailCardText}>
                    Data Confidence: {Math.round(confidence * 100)}%
                  </Text>
                )}
                
                {type === 'incident' && incidentType && (
                  <Text style={styles.detailCardText}>
                    Incident Type: {incidentType}
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

            {/* System Information */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>System Information</Text>
              <Text style={styles.detailCardText}>Alert ID: {id}</Text>
              <Text style={styles.detailCardText}>Source: {getSourceDisplay()}</Text>
              {dataSource && (
                <Text style={styles.detailCardText}>Data Source: {dataSource}</Text>
              )}
              {lastUpdated && (
                <Text style={styles.detailCardText}>
                  Last Updated: {new Date(lastUpdated).toLocaleString('en-GB')}
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
    shadowOffset: { width: 0, height: 2 },
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
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  trafficMetrics: {
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  incidentMetrics: {
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginRight: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  warningBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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

export default EnhancedTrafficCard;