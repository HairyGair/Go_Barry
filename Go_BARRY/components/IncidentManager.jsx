// Go_BARRY/components/IncidentManager.jsx
// Phase 2: GTFS-Powered Incident Management System

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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Incident types and subtypes based on Go North East operations
const INCIDENT_TYPES = {
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
  },
  incident: {
    label: 'Traffic Incident',
    icon: 'car-sport',
    color: '#EF4444',
    subtypes: [
      'Road Traffic Accident',
      'Vehicle Breakdown',
      'Emergency Services',
      'Police Incident',
      'Road Closure',
      'Flooding',
      'Ice/Snow',
      'High Winds'
    ]
  },
  event: {
    label: 'Planned Event',
    icon: 'calendar',
    color: '#8B5CF6',
    subtypes: [
      'Football Match',
      'Concert/Festival',
      'Marathon/Race',
      'Parade',
      'Market',
      'Road Race',
      'Demonstration',
      'Other Event'
    ]
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: 'business',
    color: '#10B981',
    subtypes: [
      'Bus Stop Closure',
      'Bus Station Issue',
      'Bridge Closure',
      'Tunnel Closure',
      'Ferry Disruption',
      'Metro Disruption',
      'Rail Disruption',
      'Other Transport'
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

const IncidentManager = ({ baseUrl }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    supervisorRole, 
    hasPermission, 
    logActivity 
  } = useSupervisorSession();

  // State management
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [affectedRoutes, setAffectedRoutes] = useState([]);
  const [gtfsData, setGtfsData] = useState(null);

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
    affectsRoutes: [],
    notes: ''
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

  // Create new incident
  const createIncident = async () => {
    if (!isLoggedIn) {
      alert('Please log in as a supervisor to create incidents');
      return;
    }

    if (!newIncident.type || !newIncident.location) {
      alert('Please fill in required fields (Type and Location)');
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
        status: 'active',
        source: 'manual'
      };

      // For now, store locally (in production this would go to backend)
      setIncidents(prev => [incidentData, ...prev]);
      
      // Log activity
      logActivity(
        'CREATE_INCIDENT', 
        `Created ${newIncident.type} incident at ${newIncident.location}`,
        incidentData.id
      );

      // Reset form
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
        affectsRoutes: [],
        notes: ''
      });

      setShowNewIncident(false);
      alert('Incident created successfully');
    } catch (error) {
      console.error('Failed to create incident:', error);
      alert('Failed to create incident');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>🚨 Incident Management</Text>
          <Text style={styles.subtitle}>GTFS-powered service disruption tracking</Text>
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
          <Text style={styles.statNumber}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Active Incidents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{affectedRoutes.length}</Text>
          <Text style={styles.statLabel}>Affected Routes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{gtfsData?.stops || 0}</Text>
          <Text style={styles.statLabel}>GTFS Stops</Text>
        </View>
      </View>

      {/* Incidents List */}
      <ScrollView style={styles.incidentsList}>
        {loading && incidents.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading incidents...</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Active Incidents</Text>
            <Text style={styles.emptyText}>All clear! No incidents are currently affecting services.</Text>
          </View>
        ) : (
          incidents.map((incident, index) => (
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
                </View>
                
                {hasPermission('create_incidents') && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteIncident(incident.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.incidentLocation}>{incident.location}</Text>
              
              {incident.subtype && (
                <Text style={styles.incidentSubtype}>{incident.subtype}</Text>
              )}
              
              {incident.description && (
                <Text style={styles.incidentDescription}>{incident.description}</Text>
              )}

              {incident.affectsRoutes && incident.affectsRoutes.length > 0 && (
                <View style={styles.routesContainer}>
                  <Text style={styles.routesLabel}>Affected Routes:</Text>
                  <View style={styles.routesList}>
                    {incident.affectsRoutes.map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

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
});

export default IncidentManager;
