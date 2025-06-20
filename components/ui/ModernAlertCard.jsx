import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Bus, 
  X,
  ChevronRight,
  Construction,
  Car,
  AlertCircle,
  Info
} from 'lucide-react-native';

// Modern Alert Card Component
export function ModernAlertCard({ alert, onDismiss, onViewDetails, style }) {
  const [expanded, setExpanded] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get severity color and icon
  const getSeverityStyle = () => {
    switch (alert.severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return { color: '#DC2626', icon: AlertTriangle, label: 'HIGH IMPACT' };
      case 'medium':
        return { color: '#F59E0B', icon: AlertCircle, label: 'MODERATE' };
      case 'low':
        return { color: '#3B82F6', icon: Info, label: 'LOW IMPACT' };
      default:
        return { color: '#6B7280', icon: AlertCircle, label: 'ALERT' };
    }
  };

  // Get incident type icon
  const getTypeIcon = () => {
    const type = alert.type?.toLowerCase() || '';
    if (type.includes('roadwork') || type.includes('construction')) return Construction;
    if (type.includes('accident') || type.includes('collision')) return Car;
    return AlertTriangle;
  };

  const severity = getSeverityStyle();
  const TypeIcon = getTypeIcon();
  const SeverityIcon = severity.icon;
  
  // Calculate time ago
  const getTimeAgo = () => {
    if (!alert.lastUpdated) return 'Just now';
    const mins = Math.floor((new Date() - new Date(alert.lastUpdated)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Severity indicator bar */}
      <View style={[styles.severityBar, { backgroundColor: severity.color }]} />
      
      {/* Card Content */}
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${severity.color}15` }]}>
              <TypeIcon size={24} color={severity.color} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.metaRow}>
                <Text style={[styles.severityLabel, { color: severity.color }]}>
                  {severity.label}
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.source}>{alert.source || 'Traffic System'}</Text>
              </View>
              <View style={styles.timeRow}>
                <Clock size={14} color="#9CA3AF" />
                <Text style={styles.timeText}>{getTimeAgo()}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={(e) => {
              e.stopPropagation();
              onDismiss?.(alert);
            }}
          >
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={expanded ? undefined : 2}>
            {alert.title || 'Traffic Incident'}
          </Text>
          
          <View style={styles.locationRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1}>
              {alert.enhancedLocation || alert.location || 'Unknown location'}
            </Text>
          </View>

          {alert.nearbyLandmarks && alert.nearbyLandmarks.length > 0 && (
            <Text style={styles.landmark}>
              Near {alert.nearbyLandmarks[0].name} ({alert.nearbyLandmarks[0].distance}m)
            </Text>
          )}

          {(expanded || alert.description) && (
            <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
              {alert.description}
            </Text>
          )}
        </View>

        {/* Affected Routes */}
        {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
          <View style={styles.routesContainer}>
            <Bus size={16} color="#6B7280" style={styles.busIcon} />
            <View style={styles.routePills}>
              {alert.affectsRoutes.slice(0, expanded ? undefined : 5).map((route, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.routePill,
                    ['21', 'X21', '1', '2', 'Q3'].includes(route) && styles.routePillMajor
                  ]}
                >
                  <Text style={[
                    styles.routePillText,
                    ['21', 'X21', '1', '2', 'Q3'].includes(route) && styles.routePillTextMajor
                  ]}>
                    {route}
                  </Text>
                </View>
              ))}
              {!expanded && alert.affectsRoutes.length > 5 && (
                <Text style={styles.moreRoutes}>+{alert.affectsRoutes.length - 5} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Route Impact (if available) */}
        {alert.routeImpacts && alert.routeImpacts.length > 0 && expanded && (
          <View style={styles.impactContainer}>
            <Text style={styles.impactTitle}>Route Impacts:</Text>
            {alert.routeImpacts.map((impact, index) => (
              <View key={index} style={styles.impactRow}>
                <Text style={styles.impactRoute}>{impact.routeName}:</Text>
                <Text style={[
                  styles.impactDelay,
                  { color: impact.delayMinutes > 10 ? '#DC2626' : '#F59E0B' }
                ]}>
                  +{impact.delayMinutes} min delay
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={(e) => {
              e.stopPropagation();
              onViewDetails?.(alert);
            }}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  severityBar: {
    height: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dot: {
    color: '#D1D5DB',
    marginHorizontal: 6,
    fontSize: 12,
  },
  source: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  dismissButton: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  landmark: {
    fontSize: 13,
    color: '#3B82F6',
    marginLeft: 22,
    marginTop: 2,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 8,
  },
  routesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  busIcon: {
    marginRight: 8,
  },
  routePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  routePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  routePillMajor: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  routePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  routePillTextMajor: {
    color: '#3B82F6',
  },
  moreRoutes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    marginTop: 4,
  },
  impactContainer: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  impactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  impactRoute: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
  },
  impactDelay: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 4,
  },
});

export default ModernAlertCard;
