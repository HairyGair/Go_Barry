// Main disruption management interface
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisruptionList from './DisruptionList';
import DisruptionMap from './DisruptionMap';
import DisruptionCard from './DisruptionCard';
import DisruptionNoteModal from './DisruptionNoteModal';
import { useDisruptions } from '../hooks/useDisruptions';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

export default function DisruptionManager() {
  const { supervisor, supervisorSession } = useSupervisorSession();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedDisruption, setSelectedDisruption] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteDisruption, setNoteDisruption] = useState(null);
  
  const { 
    disruptions,
    stats,
    dismissDisruption,
    addNote 
  } = useDisruptions();

  // Handle disruption selection
  const handleDisruptionSelect = (disruption) => {
    setSelectedDisruption(disruption);
  };

  // Handle dismiss
  const handleDismiss = async (disruption) => {
    if (!supervisor) return;
    
    try {
      await dismissDisruption(disruption._id, supervisor.badge);
    } catch (error) {
      console.error('Failed to dismiss disruption:', error);
    }
  };

  // Handle add note
  const handleAddNote = (disruption) => {
    setNoteDisruption(disruption);
    setShowNoteModal(true);
  };

  // Submit note
  const handleSubmitNote = async (content, type) => {
    if (!supervisor || !noteDisruption) return;

    try {
      await addNote(noteDisruption._id, {
        supervisorBadge: supervisor.badge,
        supervisorName: supervisor.name,
        content,
        type
      });
      setShowNoteModal(false);
      setNoteDisruption(null);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  // Handle push to display
  const handlePushToDisplay = async (disruption) => {
    if (!supervisor || !supervisorSession) return;

    try {
      // Map severity to priority
      const priorityMap = {
        'critical': 'high',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
      };

      // Format the display message
      const displayData = {
        sessionId: supervisorSession.sessionId,
        alertId: disruption._id,
        type: disruption.type,
        title: `${disruption.affectedRoutes?.join(', ') || 'Multiple Routes'} - ${disruption.location?.description || disruption.title}`,
        message: `${disruption.type.toUpperCase()}: ${disruption.description || disruption.title}`,
        priority: priorityMap[disruption.severity?.toLowerCase()] || 'medium',
        severity: disruption.severity,
        location: disruption.location,
        affectedRoutes: disruption.affectedRoutes,
        source: disruption.source,
        duration: 600, // 10 minutes default
        iconCategory: getIconCategory(disruption.type),
        mapIcon: getMapIcon(disruption.type)
      };

      // Push to display API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com'}/api/display/push-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(displayData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Disruption pushed to control room display',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Failed to push to display');
      }
    } catch (error) {
      console.error('Failed to push to display:', error);
      Alert.alert(
        'Error',
        'Failed to push disruption to display',
        [{ text: 'OK' }]
      );
    }
  };

  // Get icon category for display
  const getIconCategory = (type) => {
    const iconMap = {
      'roadwork': 6,
      'incident': 9,
      'event': 7,
      'weather': 11,
      'breakdown': 3
    };
    return iconMap[type] || 9;
  };

  // Get map icon for display
  const getMapIcon = (type) => {
    const iconMap = {
      'roadwork': '🚧',
      'incident': '⚠️',
      'event': '📅',
      'weather': '🌧️',
      'breakdown': '🚌'
    };
    return iconMap[type] || '⚠️';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Disruption Management</Text>
          <Text style={styles.subtitle}>
            Real-time traffic disruptions across the network
          </Text>
        </View>
        
        {/* View mode toggle */}
        {Platform.OS === 'web' && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'list' && styles.viewButtonActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list-outline" 
                size={20} 
                color={viewMode === 'list' ? 'white' : '#6b7280'} 
              />
              <Text style={[
                styles.viewButtonText,
                viewMode === 'list' && styles.viewButtonTextActive
              ]}>
                List
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'map' && styles.viewButtonActive
              ]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons 
                name="map-outline" 
                size={20} 
                color={viewMode === 'map' ? 'white' : '#6b7280'} 
              />
              <Text style={[
                styles.viewButtonText,
                viewMode === 'map' && styles.viewButtonTextActive
              ]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>
              {stats.criticalCount}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f97316' }]}>
              {stats.activeCount}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {stats.byType?.roadwork || 0}
            </Text>
            <Text style={styles.statLabel}>Roadworks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {stats.byType?.incident || 0}
            </Text>
            <Text style={styles.statLabel}>Incidents</Text>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {viewMode === 'list' ? (
          <DisruptionList
            supervisorBadge={supervisor?.badge}
            onDisruptionPress={handleDisruptionSelect}
            onDismiss={handleDismiss}
            onAddNote={handleAddNote}
            onPushToDisplay={handlePushToDisplay}
            showFilters={true}
            limit={100}
          />
        ) : (
          <DisruptionMap
            disruptions={disruptions}
            selectedDisruption={selectedDisruption}
            onDisruptionSelect={handleDisruptionSelect}
          />
        )}
      </View>

      {/* Selected Disruption Detail (for map view) */}
      {viewMode === 'map' && selectedDisruption && (
        <View style={styles.detailPanel}>
          <DisruptionCard
            disruption={selectedDisruption}
            onDismiss={handleDismiss}
            onAddNote={handleAddNote}
            onPushToDisplay={handlePushToDisplay}
            supervisorBadge={supervisor?.badge}
            isCompact={false}
          />
        </View>
      )}

      {/* Note Modal */}
      <DisruptionNoteModal
        visible={showNoteModal}
        disruption={noteDisruption}
        onClose={() => {
          setShowNoteModal(false);
          setNoteDisruption(null);
        }}
        onSubmit={handleSubmitNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#2563eb',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  viewButtonTextActive: {
    color: 'white',
  },
  statsBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  detailPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 500,
    maxHeight: 300,
    backgroundColor: 'transparent',
  },
});
