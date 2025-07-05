// Unified disruption card component for Go BARRY
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simple date formatter to replace date-fns
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Type color mapping
const TYPE_COLORS = {
  roadwork: '#f97316', // orange
  incident: '#ef4444', // red
  event: '#8b5cf6', // purple
  weather: '#3b82f6', // blue
  breakdown: '#f59e0b', // amber
};

// Severity color mapping
const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

export default function DisruptionCard({ 
  disruption, 
  onPress, 
  onDismiss,
  onAddNote,
  supervisorBadge,
  isCompact = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handlePress = () => {
    if (onPress) {
      onPress(disruption);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleMapPress = () => {
    if (disruption.location?.coordinates && Platform.OS === 'web') {
      const { lat, lng } = disruption.location.coordinates;
      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      Linking.openURL(mapUrl);
    }
  };

  const isDismissed = disruption.dismissedBy?.includes(supervisorBadge);
  const typeColor = TYPE_COLORS[disruption.type] || '#6b7280';
  const severityColor = SEVERITY_COLORS[disruption.severity] || '#6b7280';

  // Format time display
  const getTimeDisplay = () => {
    if (!disruption.startTime) return '';
    
    const startDate = new Date(disruption.startTime);
    const now = new Date();
    const diffHours = Math.floor((now - startDate) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just started';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return formatDate(disruption.startTime).split(' ')[0]; // Just the date part
    }
  };

  // Format duration display
  const getDurationDisplay = () => {
    if (disruption.endTime && disruption.startTime) {
      const start = new Date(disruption.startTime);
      const end = new Date(disruption.endTime);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    return 'Ongoing';
  };

  if (isCompact) {
    return (
      <TouchableOpacity 
        onPress={handlePress}
        style={[styles.compactCard, isDismissed && styles.dismissedCard]}
      >
        <View style={styles.compactHeader}>
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {disruption.title}
            </Text>
            <Text style={styles.compactLocation} numberOfLines={1}>
              {disruption.location?.description || 'Unknown location'}
            </Text>
          </View>
          <View style={styles.compactMeta}>
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <Text style={styles.severityText}>{disruption.severity}</Text>
            </View>
            {disruption.affectedRoutes?.length > 0 && (
              <Text style={styles.routeCount}>
                {disruption.affectedRoutes.length} routes
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[styles.card, isDismissed && styles.dismissedCard]}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeIcon, { backgroundColor: typeColor }]}>
            <Ionicons 
              name={getTypeIcon(disruption.type)} 
              size={20} 
              color="white" 
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {disruption.title}
            </Text>
            <Text style={styles.source}>
              {disruption.source} • {getTimeDisplay()}
            </Text>
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>{disruption.severity}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color="#6b7280" />
        <Text style={styles.location} numberOfLines={1}>
          {disruption.location?.description || 'Unknown location'}
        </Text>
        {disruption.location?.coordinates && Platform.OS === 'web' && (
          <TouchableOpacity onPress={handleMapPress} style={styles.mapButton}>
            <Ionicons name="map-outline" size={16} color="#2563eb" />
            <Text style={styles.mapText}>Map</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Routes */}
      {disruption.affectedRoutes?.length > 0 && (
        <View style={styles.routesRow}>
          <Ionicons name="bus-outline" size={16} color="#6b7280" />
          <View style={styles.routesContainer}>
            {disruption.affectedRoutes.slice(0, 5).map((route, index) => (
              <View key={index} style={styles.routeBadge}>
                <Text style={styles.routeText}>{route}</Text>
              </View>
            ))}
            {disruption.affectedRoutes.length > 5 && (
              <Text style={styles.moreRoutes}>
                +{disruption.affectedRoutes.length - 5} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusText}>
            {disruption.status} • {getDurationDisplay()}
          </Text>
          {disruption.estimatedDelay && (
            <Text style={styles.delayText}>
              ~{disruption.estimatedDelay} min delay
            </Text>
          )}
        </View>
        
        {/* Actions */}
        <View style={styles.actions}>
          {isDismissed ? (
            <View style={styles.dismissedBadge}>
              <Text style={styles.dismissedText}>Dismissed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => onDismiss?.(disruption)}
              style={styles.actionButton}
            >
              <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={() => onAddNote?.(disruption)}
            style={styles.actionButton}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
            {disruption.notes?.length > 0 && (
              <View style={styles.noteBadge}>
                <Text style={styles.noteBadgeText}>{disruption.notes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{disruption.description}</Text>
          
          {disruption.notes?.length > 0 && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Supervisor Notes:</Text>
              {disruption.notes.slice(-2).map((note, index) => (
                <View key={note.id || index} style={styles.note}>
                  <Text style={styles.noteHeader}>
                    {note.supervisorName} • {formatDate(note.timestamp)}
                  </Text>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Helper function to get appropriate icon for disruption type
function getTypeIcon(type) {
  switch (type) {
    case 'roadwork':
      return 'construct-outline';
    case 'incident':
      return 'warning-outline';
    case 'event':
      return 'calendar-outline';
    case 'weather':
      return 'rainy-outline';
    case 'breakdown':
      return 'car-outline';
    default:
      return 'alert-circle-outline';
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissedCard: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  source: {
    fontSize: 12,
    color: '#6b7280',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 6,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  mapText: {
    fontSize: 12,
    color: '#2563eb',
    marginLeft: 4,
  },
  routesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: 6,
  },
  routeBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  moreRoutes: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  delayText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
    position: 'relative',
  },
  noteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2563eb',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dismissedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  dismissedText: {
    fontSize: 12,
    color: '#6b7280',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  notesSection: {
    marginTop: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  note: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  noteHeader: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  noteContent: {
    fontSize: 13,
    color: '#374151',
  },
  
  // Compact styles
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  compactLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  compactMeta: {
    alignItems: 'flex-end',
  },
  routeCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
});
