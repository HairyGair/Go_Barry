// Go_BARRY/components/IncidentManager.jsx
// Sector 4: Incident Manager - Manual incident creation & detailed tracking

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { useSupervisorSync } from './hooks/useSupervisorSync';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Helper function for priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH': return '#EF4444';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#10B981';
    default: return '#6B7280';
  }
};

// Updated Incident types and subtypes based on Go North East operations
const INCIDENT_TYPES = {
  rtc: {
    label: 'RTC',
    icon: 'car-sport',
    color: '#DC2626',
    subtypes: [
      'RTC',
      'RTC (LANE CLOSURE)',
      'RTC (ROAD CLOSURE)'
    ]
  },
  breakdown: {
    label: 'Vehicle Issues',
    icon: 'car',
    color: '#F59E0B',
    subtypes: [
      'BROKEN DOWN VEHICLE',
      'PARKING ISSUE'
    ]
  },
  traffic: {
    label: 'Traffic Conditions',
    icon: 'speedometer',
    color: '#EF4444',
    subtypes: [
      'HEAVY TRAFFIC',
      'HEAVY TRAFFIC (EVENT)',
      'HEAVY TRAFFIC (LANE CLOSURE)',
      'DEBRIS IN ROAD',
      'SPILLAGE'
    ]
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: 'build',
    color: '#10B981',
    subtypes: [
      'INFRASTRUCTURE',
      'TRAFFIC LIGHT FAILURE',
      'RAILWAY BARRIER FAILURE',
      'UNSAFE BUILDING',
      'UTILITIES INCIDENT'
    ]
  },
  emergency: {
    label: 'Emergency Services',
    icon: 'medical',
    color: '#7C3AED',
    subtypes: [
      'POLICE INCIDENT',
      'BUILDING FIRE'
    ]
  },
  environmental: {
    label: 'Environmental',
    icon: 'leaf',
    color: '#059669',
    subtypes: [
      'OVERGROWN / FALLEN TREE'
    ]
  },
  social: {
    label: 'Social Issues',
    icon: 'people',
    color: '#DC2626',
    subtypes: [
      'ANTI-SOCIAL BEHAVIOUR',
      'SCHOOL CLOSURE'
    ]
  },
  network: {
    label: 'Network Issues',
    icon: 'globe',
    color: '#6B7280',
    subtypes: [
      'OFF-NETWORK INCIDENT'
    ]
  },
  other: {
    label: 'Other',
    icon: 'help-circle',
    color: '#9CA3AF',
    subtypes: [
      'OTHER',
      'UNKNOWN INCIDENT'
    ]
  },
  roadwork: {
    label: 'Roadworks',
    icon: 'construct',
    color: '#F59E0B',
    subtypes: [
      'Gas Works',
      'Water Works', 
      'Electric Works',
      'Telecoms',
      'Road Resurfacing',
      'Bridge Works',
      'Traffic Signals',
      'Other Utilities'
    ]
  }
};

// Common locations in Go North East area for quick selection
const COMMON_LOCATIONS = [
  'Newcastle City Centre',
  'Gateshead Interchange',
  'Metro Centre',
  'Sunderland City Centre',
  'Durham City Centre',
  'Consett',
  'Hexham',
  'Cramlington',
  'A1 Western Bypass',
  'A19',
  'A1(M)',
  'A69',
  'Tyne Bridge',
  'Redheugh Bridge',
  'Swing Bridge',
  'High Level Bridge'
];

const IncidentManager = ({ baseUrl, sector = 4 }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    supervisorRole, 
    hasPermission, 
    logActivity 
  } = useSupervisorSession();

  // WebSocket sync for display control
  const {
    isConnected,
    lockOnDisplay,
    broadcastMessage
  } = useSupervisorSync({
    clientType: 'supervisor',
    supervisorId: supervisorName,
    autoConnect: isLoggedIn
  });

  // State management
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [showIncidentDetails, setShowIncidentDetails] = useState(null);
  const [showAddNote, setShowAddNote] = useState(null);
  const [affectedRoutes, setAffectedRoutes] = useState([]);
  const [gtfsData, setGtfsData] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // New incident form state
  const [newIncident, setNewIncident] = useState({
    type: '',
    subtype: '',
    location: '',
    coordinates: null,
    area: '',
    description: '',
    startTime: '',
    endTime: '',
    severity: 'Medium',
    priority: 'MEDIUM',
    affectsRoutes: [],
    notes: '',
    images: [],
    status: 'active'
  });

  // Auto-complete states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // API base URL with fallback
  const API_BASE = baseUrl || (isWeb 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  // Filter incidents by status
  const activeIncidents = useMemo(() => 
    incidents.filter(incident => incident.status !== 'closed'),
    [incidents]
  );

  const closedIncidents = useMemo(() => 
    incidents.filter(incident => incident.status === 'closed'),
    [incidents]
  );

  // Load GTFS data and existing incidents
  useEffect(() => {
    loadIncidents();
    loadGTFSData();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/incidents`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
      }
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGTFSData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/routes/gtfs-stats`);
      if (response.ok) {
        const data = await response.json();
        setGtfsData(data);
      }
    } catch (error) {
      console.error('Failed to load GTFS data:', error);
    }
  };

  // Location search with GTFS integration
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setSearchingLocation(true);
    try {
      // Search both geocoding and GTFS stops
      const [geocodeResponse, gtfsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/geocode/${encodeURIComponent(query)}`),
        fetch(`${API_BASE}/api/routes/search-stops?query=${encodeURIComponent(query)}`)
      ]);

      const suggestions = [];

      // Add geocoded locations
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.success) {
          suggestions.push({
            type: 'geocoded',
            name: geocodeData.location,
            coordinates: geocodeData.coordinates,
            source: 'Geocoding'
          });
        }
      }

      // Add GTFS stops
      if (gtfsResponse.ok) {
        const gtfsData = await gtfsResponse.json();
        if (gtfsData.success && gtfsData.stops) {
          gtfsData.stops.forEach(stop => {
            suggestions.push({
              type: 'bus_stop',
              name: `${stop.stop_name} (Stop ${stop.stop_code})`,
              coordinates: { latitude: stop.stop_lat, longitude: stop.stop_lon },
              source: 'Bus Stop',
              stopCode: stop.stop_code
            });
          });
        }
      }

      // Add common locations that match
      COMMON_LOCATIONS.forEach(location => {
        if (location.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            type: 'common',
            name: location,
            source: 'Common Location'
          });
        }
      });

      setLocationSuggestions(suggestions.slice(0, 10));
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Get affected routes when location changes
  const getAffectedRoutes = async (coordinates) => {
    if (!coordinates) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/routes/find-near-coordinate?lat=${coordinates.latitude}&lng=${coordinates.longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAffectedRoutes(data.routes || []);
          setNewIncident(prev => ({
            ...prev,
            affectsRoutes: data.routes?.slice(0, 5) || []
          }));
        }
      }
    } catch (error) {
      console.error('Failed to find affected routes:', error);
    }
  };

  // Show notification helper
  const showNotification = (message, type = 'info') => {
    if (isWeb) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    } else {
      Alert.alert(
        type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info',
        message
      );
    }
  };

  // Reset form
  const resetForm = () => {
    setNewIncident({
      type: '',
      subtype: '',
      location: '',
      coordinates: null,
      area: '',
      description: '',
      startTime: '',
      endTime: '',
      severity: 'Medium',
      priority: 'MEDIUM',
      affectsRoutes: [],
      notes: '',
      images: [],
      status: 'active'
    });
    setAffectedRoutes([]);
    setLocationSuggestions([]);
  };

  // Create new incident with enhanced data
  const createIncident = async () => {
    if (!isLoggedIn) {
      showNotification('Please log in as a supervisor to create incidents', 'error');
      return;
    }

    if (!newIncident.type || !newIncident.location) {
      showNotification('Please fill in required fields (Type and Location)', 'error');
      return;
    }

    setLoading(true);
    try {
      const incidentData = {
        ...newIncident,
        id: 'incident_' + Date.now(),
        createdBy: supervisorName,
        createdByRole: supervisorRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        source: 'manual',
        notes: newIncident.notes ? [{
          id: 'note_' + Date.now(),
          text: newIncident.notes,
          addedBy: supervisorName,
          addedAt: new Date().toISOString()
        }] : [],
        images: newIncident.images || []
      };

      // Store incident (enhanced for Sector 4)
      setIncidents(prev => [incidentData, ...prev]);
      
      // Log activity
      logActivity(
        'CREATE_INCIDENT', 
        `Created ${newIncident.type} incident at ${newIncident.location}`,
        incidentData.id
      );

      // Auto-push to display if Critical
      if (newIncident.priority === 'CRITICAL' && isConnected) {
        lockOnDisplay(incidentData.id, 'Critical incident auto-pushed to display');
        showNotification('Critical incident pushed to display automatically', 'success');
      }

      // Reset form
      resetForm();
      setShowNewIncident(false);
      showNotification('Incident created successfully', 'success');
    } catch (error) {
      console.error('Failed to create incident:', error);
      showNotification('Failed to create incident', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add note to incident
  const addNoteToIncident = async (incidentId) => {
    if (!newNote.trim()) {
      showNotification('Please enter a note', 'error');
      return;
    }

    const noteData = {
      id: 'note_' + Date.now(),
      text: newNote.trim(),
      addedBy: supervisorName,
      addedAt: new Date().toISOString()
    };

    setIncidents(prev => prev.map(incident => {
      if (incident.id === incidentId) {
        return {
          ...incident,
          notes: [...(incident.notes || []), noteData],
          updatedAt: new Date().toISOString()
        };
      }
      return incident;
    }));

    logActivity('ADD_NOTE', `Added note to incident ${incidentId}`, incidentId);
    setNewNote('');
    setShowAddNote(null);
    showNotification('Note added successfully', 'success');
  };

  // Update incident status
  const updateIncidentStatus = async (incidentId, newStatus) => {
    setIncidents(prev => prev.map(incident => {
      if (incident.id === incidentId) {
        return {
          ...incident,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          closedBy: newStatus === 'closed' ? supervisorName : undefined,
          closedAt: newStatus === 'closed' ? new Date().toISOString() : undefined
        };
      }
      return incident;
    }));

    logActivity('UPDATE_STATUS', `Updated incident ${incidentId} status to ${newStatus}`, incidentId);
    showNotification(`Incident ${newStatus === 'closed' ? 'closed' : 'updated'} successfully`, 'success');
  };

  // Push incident to display
  const pushIncidentToDisplay = async (incident) => {
    if (!isConnected) {
      showNotification('Not connected to display system', 'error');
      return;
    }

    const reason = isWeb 
      ? prompt('Reason for pushing incident to display:')
      : 'Incident pushed to display';
      
    if (!reason) return;

    const success = lockOnDisplay(incident.id, reason);
    
    if (success) {
      showNotification(`"${incident.location}" incident pushed to display`, 'success');
    } else {
      showNotification('Failed to push incident to display', 'error');
    }
  };

  // Handle image upload (placeholder for future implementation)
  const handleImageUpload = async () => {
    // Placeholder for image upload functionality
    showNotification('Image upload feature coming soon', 'info');
  };

  // Delete incident
  const deleteIncident = async (incidentId) => {
    if (!isLoggedIn) return;

    const confirmDelete = isWeb ? 
      window.confirm('Are you sure you want to delete this incident?') :
      await new Promise(resolve => {
        Alert.alert(
          'Delete Incident',
          'Are you sure you want to delete this incident?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      });

    if (!confirmDelete) return;

    setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    logActivity('DELETE_INCIDENT', `Deleted incident ${incidentId}`, incidentId);
    showNotification('Incident deleted successfully', 'success');
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text style={styles.unauthorizedTitle}>Supervisor Access Required</Text>
        <Text style={styles.unauthorizedText}>
          Please log in as a supervisor to access incident management
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sector 4: Incident Manager</Text>
          <Text style={styles.subtitle}>Manual incident creation & detailed tracking</Text>
        </View>
        
        {hasPermission('create_incidents') && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowNewIncident(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New Incident</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeIncidents.length}</Text>
          <Text style={styles.statLabel}>Active Incidents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{closedIncidents.length}</Text>
          <Text style={styles.statLabel}>Closed Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{affectedRoutes.length}</Text>
          <Text style={styles.statLabel}>Affected Routes</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statLabel}>Display {isConnected ? 'Connected' : 'Offline'}</Text>
        </View>
      </View>

      {/* Incidents List */}
      <ScrollView style={styles.incidentsList}>
        {loading && activeIncidents.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading incidents...</Text>
          </View>
        ) : activeIncidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Active Incidents</Text>
            <Text style={styles.emptyText}>All clear! No incidents are currently affecting services.</Text>
          </View>
        ) : (
          activeIncidents.map((incident, index) => (
            <View key={incident.id || index} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <View style={styles.incidentType}>
                  <Ionicons 
                    name={INCIDENT_TYPES[incident.type]?.icon || 'alert-circle'} 
                    size={20} 
                    color={INCIDENT_TYPES[incident.type]?.color || '#6B7280'} 
                  />
                  <Text style={styles.incidentTypeText}>
                    {INCIDENT_TYPES[incident.type]?.label || incident.type}
                  </Text>
                  {incident.priority === 'CRITICAL' && (
                    <View style={styles.criticalBadge}>
                      <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.incidentActions}>
                  {incident.priority === 'CRITICAL' && isConnected && (
                    <TouchableOpacity
                      style={styles.pushToDisplayButton}
                      onPress={() => pushIncidentToDisplay(incident)}
                    >
                      <Ionicons name="tv" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => setShowIncidentDetails(incident)}
                  >
                    <Ionicons name="eye" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  
                  {hasPermission('create_incidents') && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteIncident(incident.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.incidentLocation}>{incident.location}</Text>
              
              {incident.subtype && (
                <Text style={styles.incidentSubtype}>{incident.subtype}</Text>
              )}
              
              {incident.description && (
                <Text style={styles.incidentDescription} numberOfLines={2}>{incident.description}</Text>
              )}

              {incident.affectsRoutes && incident.affectsRoutes.length > 0 && (
                <View style={styles.routesContainer}>
                  <Text style={styles.routesLabel}>Affected Routes:</Text>
                  <View style={styles.routesList}>
                    {incident.affectsRoutes.slice(0, 6).map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                    {incident.affectsRoutes.length > 6 && (
                      <Text style={styles.moreRoutesText}>+{incident.affectsRoutes.length - 6} more</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.addNoteButton}
                  onPress={() => setShowAddNote(incident.id)}
                >
                  <Ionicons name="create" size={14} color="#6B7280" />
                  <Text style={styles.quickActionText}>Add Note</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.closeIncidentButton}
                  onPress={() => updateIncidentStatus(incident.id, 'closed')}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.quickActionText}>Close</Text>
                </TouchableOpacity>

                {incident.notes && incident.notes.length > 0 && (
                  <View style={styles.notesIndicator}>
                    <Ionicons name="document-text" size={14} color="#F59E0B" />
                    <Text style={styles.notesCount}>{incident.notes.length} notes</Text>
                  </View>
                )}
              </View>

              <View style={styles.incidentFooter}>
                <Text style={styles.incidentTime}>
                  Created: {new Date(incident.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.incidentCreator}>
                  by {incident.createdBy}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New Incident Modal */}
      <Modal
        visible={showNewIncident}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewIncident(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Incident</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNewIncident(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Incident Type */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Incident Type *</Text>
              <View style={styles.typeGrid}>
                {Object.entries(INCIDENT_TYPES).map(([key, type]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.typeCard,
                      newIncident.type === key && styles.typeCardSelected
                    ]}
                    onPress={() => setNewIncident(prev => ({ ...prev, type: key, subtype: '' }))}
                  >
                    <Ionicons name={type.icon} size={24} color={type.color} />
                    <Text style={styles.typeCardText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subtype */}
            {newIncident.type && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Subtype</Text>
                <View style={styles.subtypeGrid}>
                  {INCIDENT_TYPES[newIncident.type].subtypes.map((subtype, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.subtypeButton,
                        newIncident.subtype === subtype && styles.subtypeButtonSelected
                      ]}
                      onPress={() => setNewIncident(prev => ({ ...prev, subtype }))}
                    >
                      <Text style={[
                        styles.subtypeButtonText,
                        newIncident.subtype === subtype && styles.subtypeButtonTextSelected
                      ]}>
                        {subtype}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Location Search */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location *</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for location, bus stop, or area..."
                  value={newIncident.location}
                  onChangeText={(text) => {
                    setNewIncident(prev => ({ ...prev, location: text }));
                    searchLocation(text);
                  }}
                />
                {searchingLocation && (
                  <ActivityIndicator size="small" color="#3B82F6" />
                )}
              </View>

              {/* Location Suggestions */}
              {locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {locationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setNewIncident(prev => ({
                          ...prev,
                          location: suggestion.name,
                          coordinates: suggestion.coordinates
                        }));
                        setLocationSuggestions([]);
                        if (suggestion.coordinates) {
                          getAffectedRoutes(suggestion.coordinates);
                        }
                      }}
                    >
                      <Ionicons 
                        name={suggestion.type === 'bus_stop' ? 'bus' : 'location'} 
                        size={16} 
                        color="#6B7280" 
                      />
                      <Text style={styles.suggestionText}>{suggestion.name}</Text>
                      <Text style={styles.suggestionSource}>{suggestion.source}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Priority Level */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Priority Level</Text>
              <View style={styles.priorityGrid}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newIncident.priority === priority && styles.priorityButtonSelected,
                      { backgroundColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewIncident(prev => ({ ...prev, priority }))}
                  >
                    <Text style={styles.priorityButtonText}>{priority}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newIncident.priority === 'CRITICAL' && (
                <Text style={styles.criticalWarning}>
                  ⚠️ Critical incidents will be automatically pushed to display
                </Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the incident and its impact..."
                value={newIncident.description}
                onChangeText={(text) => setNewIncident(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Initial Notes */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Initial Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add any initial notes about this incident..."
                value={newIncident.notes}
                onChangeText={(text) => setNewIncident(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Image Upload Placeholder */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Images</Text>
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={handleImageUpload}
              >
                <Ionicons name="camera" size={24} color="#6B7280" />
                <Text style={styles.imageUploadText}>Add Photos (Coming Soon)</Text>
              </TouchableOpacity>
            </View>

            {/* Affected Routes */}
            {affectedRoutes.length > 0 && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Affected Routes (Auto-detected)</Text>
                <View style={styles.routesList}>
                  {affectedRoutes.map((route, index) => (
                    <View key={index} style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>{route}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.formHelper}>
                  Based on location proximity using GTFS data
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewIncident(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newIncident.type || !newIncident.location) && styles.submitButtonDisabled
                ]}
                onPress={createIncident}
                disabled={!newIncident.type || !newIncident.location || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Incident</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Incident Details Modal */}
      {showIncidentDetails && (
        <Modal
          visible={!!showIncidentDetails}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowIncidentDetails(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Incident Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowIncidentDetails(null)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Type & Location</Text>
                <View style={styles.detailRow}>
                  <Ionicons 
                    name={INCIDENT_TYPES[showIncidentDetails.type]?.icon || 'alert-circle'} 
                    size={20} 
                    color={INCIDENT_TYPES[showIncidentDetails.type]?.color || '#6B7280'} 
                  />
                  <Text style={styles.detailValue}>
                    {INCIDENT_TYPES[showIncidentDetails.type]?.label || showIncidentDetails.type}
                  </Text>
                  {showIncidentDetails.priority === 'CRITICAL' && (
                    <View style={styles.criticalBadge}>
                      <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailLocation}>{showIncidentDetails.location}</Text>
                {showIncidentDetails.subtype && (
                  <Text style={styles.detailSubtype}>{showIncidentDetails.subtype}</Text>
                )}
              </View>

              {showIncidentDetails.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{showIncidentDetails.description}</Text>
                </View>
              )}

              {showIncidentDetails.affectsRoutes && showIncidentDetails.affectsRoutes.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Affected Routes</Text>
                  <View style={styles.routesList}>
                    {showIncidentDetails.affectsRoutes.map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Notes Section */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.detailLabel}>Notes & Updates</Text>
                  <TouchableOpacity
                    style={styles.addNoteIconButton}
                    onPress={() => setShowAddNote(showIncidentDetails.id)}
                  >
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                
                {showIncidentDetails.notes && showIncidentDetails.notes.length > 0 ? (
                  showIncidentDetails.notes.map((note, index) => (
                    <View key={note.id || index} style={styles.noteItem}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteAuthor}>{note.addedBy}</Text>
                        <Text style={styles.noteTime}>
                          {new Date(note.addedAt).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.noteText}>{note.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noNotesText}>No notes added yet</Text>
                )}
              </View>

              {/* Status Actions */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Actions</Text>
                <View style={styles.actionButtons}>
                  {showIncidentDetails.priority === 'CRITICAL' && isConnected && (
                    <TouchableOpacity
                      style={styles.pushDisplayButton}
                      onPress={() => pushIncidentToDisplay(showIncidentDetails)}
                    >
                      <Ionicons name="tv" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Push to Display</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      updateIncidentStatus(showIncidentDetails.id, 'closed');
                      setShowIncidentDetails(null);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Close Incident</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Incident Information</Text>
                <Text style={styles.metaText}>Created: {new Date(showIncidentDetails.createdAt).toLocaleString()}</Text>
                <Text style={styles.metaText}>Created by: {showIncidentDetails.createdBy} ({showIncidentDetails.createdByRole})</Text>
                {showIncidentDetails.updatedAt && (
                  <Text style={styles.metaText}>Last updated: {new Date(showIncidentDetails.updatedAt).toLocaleString()}</Text>
                )}
                <Text style={styles.metaText}>Status: {showIncidentDetails.status}</Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <Modal
          visible={!!showAddNote}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddNote(null)}
        >
          <View style={styles.noteModalOverlay}>
            <View style={styles.noteModalContent}>
              <View style={styles.noteModalHeader}>
                <Text style={styles.noteModalTitle}>Add Note</Text>
                <TouchableOpacity onPress={() => setShowAddNote(null)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.noteInput}
                placeholder="Enter your note..."
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={4}
                autoFocus
              />
              
              <View style={styles.noteModalActions}>
                <TouchableOpacity
                  style={styles.noteCancelButton}
                  onPress={() => {
                    setNewNote('');
                    setShowAddNote(null);
                  }}
                >
                  <Text style={styles.noteCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.noteSubmitButton}
                  onPress={() => addNoteToIncident(showAddNote)}
                  disabled={!newNote.trim()}
                >
                  <Text style={styles.noteSubmitText}>Add Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  incidentsList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incidentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  criticalBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  criticalBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  incidentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pushToDisplayButton: {
    backgroundColor: '#059669',
    borderRadius: 4,
    padding: 6,
  },
  detailsButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    padding: 6,
  },
  deleteButton: {
    padding: 4,
  },
  incidentLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  incidentSubtype: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  routesContainer: {
    marginBottom: 12,
  },
  routesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  moreRoutesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closeIncidentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  notesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  notesCount: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  incidentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  incidentCreator: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  subtypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtypeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subtypeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  subtypeButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  subtypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    flex: 1,
    minWidth: (width - 80) / 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.7,
  },
  priorityButtonSelected: {
    opacity: 1,
  },
  priorityButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  criticalWarning: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  suggestionSource: {
    fontSize: 12,
    color: '#6B7280',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 24,
  },
  imageUploadText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Incident Details Modal Styles
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  detailLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailSubtype: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addNoteIconButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 6,
  },
  noteItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  noteTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  noNotesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pushDisplayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  // Add Note Modal Styles
  noteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  noteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  noteCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  noteCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  noteSubmitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  noteSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IncidentManager;