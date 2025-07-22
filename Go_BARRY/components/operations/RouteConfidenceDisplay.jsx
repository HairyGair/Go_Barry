import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RouteConfidenceDisplay = ({ routeMatching, multiModalImpacts }) => {
  if (!routeMatching) {
    return null;
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#10b981'; // Green - Very high
    if (confidence >= 0.7) return '#3b82f6'; // Blue - High
    if (confidence >= 0.5) return '#f59e0b'; // Orange - Medium
    if (confidence >= 0.3) return '#ef4444'; // Red - Low
    return '#6b7280'; // Gray - Very low
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.9) return 'check-circle';
    if (confidence >= 0.7) return 'check';
    if (confidence >= 0.5) return 'help-outline';
    return 'warning';
  };

  const getMatchTypeIcon = (matchType) => {
    switch (matchType) {
      case 'direct': return 'gps-fixed';
      case 'stop_proximity': return 'directions-bus';
      case 'shape_proximity': return 'timeline';
      case 'regional': return 'landscape';
      case 'cascade': return 'hub';
      default: return 'place';
    }
  };

  const renderRouteMatch = (match, index) => {
    const color = getConfidenceColor(match.confidence);
    const percentage = Math.round(match.confidence * 100);

    return (
      <View key={`${match.route}-${index}`} style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeNumber}>{match.route}</Text>
            <MaterialIcons 
              name={getMatchTypeIcon(match.matchType)} 
              size={16} 
              color="#6b7280" 
            />
          </View>
          <View style={styles.confidenceInfo}>
            <MaterialIcons 
              name={getConfidenceIcon(match.confidence)} 
              size={20} 
              color={color} 
            />
            <Text style={[styles.confidenceText, { color }]}>
              {percentage}%
            </Text>
          </View>
        </View>
        
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${percentage}%`, 
                backgroundColor: color 
              }
            ]} 
          />
        </View>

        <View style={styles.matchDetails}>
          <Text style={styles.matchType}>{match.matchType}</Text>
          {match.distance && (
            <Text style={styles.distance}>{match.distance}m away</Text>
          )}
        </View>

        {match.connections && match.connections.length > 0 && (
          <View style={styles.connections}>
            {match.connections.map((conn, idx) => (
              <View key={idx} style={styles.connectionTag}>
                <MaterialIcons 
                  name={conn.type === 'metro' ? 'subway' : conn.type === 'ferry' ? 'directions-boat' : 'hub'} 
                  size={12} 
                  color="#6b7280" 
                />
                <Text style={styles.connectionText}>{conn.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const highConfidenceRoutes = routeMatching.highConfidence || [];
  const mediumConfidenceRoutes = routeMatching.mediumConfidence || [];
  const hasMultiModal = multiModalImpacts?.hasMultiModalImpact;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="route" size={20} color="#1f2937" />
        <Text style={styles.title}>Route Impact Analysis</Text>
      </View>

      {hasMultiModal && (
        <View style={styles.multiModalAlert}>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
          <View style={styles.multiModalContent}>
            <Text style={styles.multiModalTitle}>Multi-Modal Impact Detected</Text>
            <Text style={styles.multiModalText}>
              Affects {multiModalImpacts.metro?.length || 0} Metro stations, {' '}
              {multiModalImpacts.ferry?.length || 0} Ferry terminals, {' '}
              {multiModalImpacts.interchanges?.length || 0} Interchanges
            </Text>
          </View>
        </View>
      )}

      {highConfidenceRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>High Confidence Routes</Text>
          {highConfidenceRoutes.map((match, index) => renderRouteMatch(match, index))}
        </View>
      )}

      {mediumConfidenceRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medium Confidence Routes</Text>
          {mediumConfidenceRoutes.map((match, index) => renderRouteMatch(match, index))}
        </View>
      )}

      {routeMatching.summary && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {routeMatching.summary.totalMatches} total routes analyzed • {' '}
            Average confidence: {Math.round(routeMatching.summary.averageConfidence * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  multiModalAlert: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  multiModalContent: {
    flex: 1,
    marginLeft: 8,
  },
  multiModalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  multiModalText: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  confidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
  },
  connections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  connectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default RouteConfidenceDisplay;
