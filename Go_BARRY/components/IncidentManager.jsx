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
import { useConvexSync } from '../hooks/useConvexSync';
import TomTomTrafficMap from './TomTomTrafficMap';

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

// Helper function to format diversions for copying
function formatDiversionsForCopy(data) {
  let text = 'AI DIVERSION SUGGESTIONS\n';
  text += '======================\n\n';
  
  text += `Priority: ${data.suggestions.severity.toUpperCase()}\n`;
  text += `Location: ${data.incident.location}\n`;
  text += `Affected Routes: ${data.incident.affectedRoutes?.join(', ') || 'None'}\n\n`;
  
  // Add TomTom routes
  if (data.formatted.tomtomRoutes?.length > 0) {
    text += 'LIVE TRAFFIC ROUTES (TomTom):\n';
    data.formatted.tomtomRoutes.forEach(route => {
      text += `• ${route.summary}\n`;
      text += `  Time: ${route.duration}, Distance: ${route.distance}\n`;
      if (route.trafficDelay !== 'No delays') {
        text += `  ⚠️ ${route.trafficDelay}\n`;
      }
      if (route.via !== 'Direct route') {
        text += `  Via: ${route.via}\n`;
      }
      text += '\n';
    });
  }
  
  if (data.formatted.diversions.length > 0) {
    text += 'ROUTE DIVERSIONS:\n';
    data.formatted.diversions.forEach(div => {
      text += `• Route ${div.route} → ${div.primaryAlternative}\n`;
      text += `  ${div.instructions}\n\n`;
    });
  }
  
  if (data.formatted.keyAdvice?.length > 0) {
    text += 'KEY ADVICE:\n';
    data.formatted.keyAdvice.forEach(advice => {
      text += `• ${advice}\n`;
    });
    text += '\n';
  }
  
  if (data.formatted.interchanges?.length > 0) {
    text += 'NEARBY INTERCHANGES:\n';
    data.formatted.interchanges.forEach(int => {
      text += `• ${int.name} (${int.distance})\n`;
      text += `  Routes: ${int.availableRoutes}\n`;
    });
  }
  
  return text;
}

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

  // Convex real-time incident management
  const {
    activeIncidents,
    allIncidents,
    createIncident: createIncidentMutation,
    updateIncident: updateIncidentMutation,
    addIncidentNote: addIncidentNoteMutation,
    sendTicketerMessage: sendTicketerMessageMutation,
    pushIncidentToDisplay: pushIncidentToDisplayMutation,
    incidentsLoading
  } = useConvexSync();

  // Use Convex incidents instead of local state
  const incidents = activeIncidents || [];
  const [trafficIncidents, setTrafficIncidents] = useState([]); // New: automatic incidents from traffic APIs
  const [loading, setLoading] = useState(false);
  const [sendingTicketer, setSendingTicketer] = useState(null);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [showIncidentDetails, setShowIncidentDetails] = useState(null);
  const [showAddNote, setShowAddNote] = useState(null);
  const [affectedRoutes, setAffectedRoutes] = useState([]);
  const [gtfsData, setGtfsData] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // New: tab to switch between manual and automatic
  const [showMap, setShowMap] = useState(false);
  const [mapIncident, setMapIncident] = useState(null);
  const [showDiversions, setShowDiversions] = useState(false);
  const [diversionsIncident, setDiversionsIncident] = useState(null);
  const [diversionsLoading, setDiversionsLoading] = useState(false);
  const [diversionsData, setDiversionsData] = useState(null);

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
    status: 'active',
    receivedVia: '' // How supervisor received the information
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

  // Filter incidents by status (Convex already provides activeIncidents)
  const closedIncidents = useMemo(() => 
    allIncidents ? allIncidents.filter(incident => incident.status === 'closed') : [],
    [allIncidents]
  );

  // Load GTFS data and existing incidents
  useEffect(() => {
    loadIncidents();
    loadTrafficIncidents(); // Also load automatic incidents
    loadGTFSData();
  }, []);

  const loadIncidents = async () => {
    // Manual incidents are now loaded via Convex - no need to fetch separately
    console.log('Manual incidents loaded via Convex real-time sync');
  };

  const loadTrafficIncidents = async () => {
    try {
      console.log('🚨 Loading automatic incident alerts from traffic APIs...');
      const response = await fetch(`${API_BASE}/api/incident-alerts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.incidents && Array.isArray(data.incidents)) {
          // Filter out manual incidents to avoid duplicates
          const automaticOnly = data.incidents.filter(inc => inc.source !== 'manual_incident');
          setTrafficIncidents(automaticOnly || []);
          console.log(`✅ Loaded ${automaticOnly.length} automatic incident alerts`);
        } else {
          console.log('⚠️ No incidents data in response:', data);
          setTrafficIncidents([]);
        }
      } else {
        console.error('❌ Server error:', response.status, response.statusText);
        setTrafficIncidents([]);
      }
    } catch (error) {
      console.error('Failed to load traffic incidents:', error);
      setTrafficIncidents([]);
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
      status: 'active',
      receivedVia: ''
    });
    setAffectedRoutes([]);
    setLocationSuggestions([]);
  };

  // Create new incident with enhanced data using Convex
  const createIncident = async () => {
    if (!isLoggedIn) {
      showNotification('Please log in as a supervisor to create incidents', 'error');
      return;
    }

    if (!newIncident.type || !newIncident.location || !newIncident.receivedVia) {
      showNotification('Please fill in required fields (Type, Location, and Information Source)', 'error');
      return;
    }

    setLoading(true);
    try {
      const incidentId = 'incident_' + Date.now();
      const now = Date.now();
      
      // Prepare notes array if initial notes exist
      const initialNotes = newIncident.notes ? [{
        id: 'note_' + now,
        text: newIncident.notes,
        addedBy: supervisorName,
        addedAt: now
      }] : [];

      // Create incident using Convex mutation
      try {
        const result = await createIncidentMutation({
          incidentId,
          type: newIncident.type,
          subtype: newIncident.subtype || undefined,
          location: newIncident.location,
          coordinates: newIncident.coordinates || undefined,
          description: newIncident.description || undefined,
          severity: newIncident.severity,
          priority: newIncident.priority,
          affectsRoutes: newIncident.affectsRoutes || [],
          createdBy: supervisorName,
          createdByRole: supervisorRole || 'Supervisor',
          receivedVia: newIncident.receivedVia || undefined,
          notes: initialNotes || undefined,
          ticketerMessage: newIncident.ticketerMessage || undefined
        });
        
        // Log the coordinates for debugging
        if (newIncident.coordinates) {
          console.log('✅ Incident created with coordinates:', newIncident.coordinates);
        }

        // Check if result exists (mutation succeeded)
        if (result && (result.success || result.incidentId)) {
        // Log activity
        logActivity(
          'CREATE_INCIDENT', 
          `Created ${newIncident.type} incident at ${newIncident.location}`,
          incidentId
        );

        console.log(`✅ Created incident ${incidentId} in Convex - real-time sync active`);

        // Auto-push to display if Critical
        if (newIncident.priority === 'CRITICAL' && isConnected) {
          await pushIncidentToDisplayMutation({
            incidentId,
            pushedBy: supervisorName
          });
          showNotification('Critical incident pushed to display automatically', 'success');
        }

        // Reset form
        resetForm();
        setShowNewIncident(false);
        showNotification('Incident created and synced to all supervisors', 'success');
      } else {
        throw new Error('Failed to create incident in Convex');
      }
      } catch (mutationError) {
        console.error('Convex mutation error:', mutationError);
        throw mutationError;
      }
    } catch (error) {
      console.error('Failed to create incident:', error);
      showNotification('Failed to create incident: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add note to incident using Convex
  const addNoteToIncident = async (incidentId) => {
    if (!newNote.trim()) {
      showNotification('Please enter a note', 'error');
      return;
    }

    try {
      const result = await addIncidentNoteMutation({
        incidentId,
        noteText: newNote.trim(),
        addedBy: supervisorName
      });

      if (result.success) {
        logActivity('ADD_NOTE', `Added note to incident ${incidentId}`, incidentId);
        setNewNote('');
        setShowAddNote(null);
        showNotification('Note added and synced to all supervisors', 'success');
        console.log(`✅ Added note to incident ${incidentId} via Convex`);
      } else {
        throw new Error('Failed to add note via Convex');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      showNotification('Failed to add note', 'error');
    }
  };

  // Update incident status using Convex
  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        ...(newStatus === 'closed' && { closedBy: supervisorName })
      };

      const result = await updateIncidentMutation({
        incidentId,
        updates,
        updatedBy: supervisorName
      });

      if (result.success) {
        logActivity('UPDATE_STATUS', `Updated incident ${incidentId} status to ${newStatus}`, incidentId);
        showNotification(`Incident ${newStatus === 'closed' ? 'closed' : 'updated'} and synced to all supervisors`, 'success');
        console.log(`✅ Updated incident ${incidentId} status to ${newStatus} via Convex`);
      } else {
        throw new Error('Failed to update incident status via Convex');
      }
    } catch (error) {
      console.error('Failed to update incident status:', error);
      showNotification('Failed to update incident status', 'error');
    }
  };

  // Push incident to display using Convex
  const pushIncidentToDisplay = async (incident) => {
    if (!isConnected) {
      showNotification('Not connected to display system', 'error');
      return;
    }

    const reason = isWeb 
      ? prompt('Reason for pushing incident to display:')
      : 'Incident pushed to display';
      
    if (!reason) return;

    try {
      // Push to display via Convex
      const result = await pushIncidentToDisplayMutation({
        incidentId: incident.incidentId || incident.id,
        pushedBy: supervisorName
      });

      if (result.success) {
        // Also use legacy display lock for compatibility
        lockOnDisplay(incident.incidentId || incident.id, reason);
        showNotification(`"${incident.location}" incident pushed to display and synced`, 'success');
        console.log(`📺 Pushed incident ${incident.incidentId || incident.id} to display via Convex`);
      } else {
        throw new Error('Failed to push incident via Convex');
      }
    } catch (error) {
      console.error('Failed to push incident to display:', error);
      showNotification('Failed to push incident to display', 'error');
    }
  };

  // Send Ticketer message for incident
  const sendTicketerMessageForIncident = async (incident, message) => {
    if (!message || !message.trim()) {
      showNotification('Please enter a Ticketer message', 'error');
      return;
    }

    setSendingTicketer(incident.incidentId || incident.id);
    try {
      const result = await sendTicketerMessageMutation({
        incidentId: incident.incidentId || incident.id,
        message: message.trim(),
        sentBy: supervisorName
      });

      if (result.success) {
        logActivity('SEND_TICKETER', `Sent Ticketer message for incident ${incident.incidentId || incident.id}`, incident.incidentId || incident.id);
        showNotification('Ticketer message sent and logged', 'success');
        console.log(`📱 Sent Ticketer message for incident ${incident.incidentId || incident.id} via Convex`);
      } else {
        throw new Error('Failed to send Ticketer message via Convex');
      }
    } catch (error) {
      console.error('Failed to send Ticketer message:', error);
      showNotification('Failed to send Ticketer message', 'error');
    } finally {
      setSendingTicketer(null);
    }
  };

  // Handle image upload (placeholder for future implementation)
  const handleImageUpload = async () => {
    // Placeholder for image upload functionality
    showNotification('Image upload feature coming soon', 'info');
  };

  // Open incident location on map
  const openIncidentMap = (incident) => {
    console.log('🗺️ Opening map for incident:', incident.location, incident.coordinates);
    setMapIncident(incident);
    setShowMap(true);
  };

  // Fetch AI diversion suggestions
  const fetchDiversions = async (incident) => {
    console.log('🧠 Fetching AI diversions for incident:', incident.id);
    setDiversionsIncident(incident);
    setShowDiversions(true);
    setDiversionsLoading(true);
    setDiversionsData(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/incidents/${incident.id}/diversions`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDiversionsData(data);
          console.log('✅ Received diversions:', data.formatted);
        } else {
          throw new Error(data.error || 'Failed to get diversions');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching diversions:', error);
      showNotification('Failed to get diversion suggestions', 'error');
      setDiversionsData({
        error: error.message,
        formatted: {
          summary: 'Unable to generate diversions',
          keyAdvice: ['Please check route information manually']
        }
      });
    } finally {
      setDiversionsLoading(false);
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

    // Update status to closed instead of deleting (Convex will handle the sync)
    await updateIncidentStatus(incidentId, 'closed');
    logActivity('DELETE_INCIDENT', `Deleted incident ${incidentId}`, incidentId);
    showNotification('Incident closed successfully', 'success');
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
        
        {isLoggedIn && (
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
          <Text style={styles.statNumber}>{incidents.length + trafficIncidents.length}</Text>
          <Text style={styles.statLabel}>Total Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#7C3AED' }]}>{trafficIncidents.length}</Text>
          <Text style={styles.statLabel}>From Traffic APIs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Manual</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statLabel}>Display {isConnected ? 'Connected' : 'Offline'}</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => setActiveTab('manual')}
        >
          <Ionicons name="create" size={16} color={activeTab === 'manual' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
            Manual ({incidents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'automatic' && styles.activeTab]}
          onPress={() => setActiveTab('automatic')}
        >
          <Ionicons name="radio" size={16} color={activeTab === 'automatic' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'automatic' && styles.activeTabText]}>
            From Traffic APIs ({trafficIncidents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Incidents List */}
      <ScrollView style={styles.incidentsList}>
        {(loading || incidentsLoading) && incidents.length === 0 && trafficIncidents.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading incidents...</Text>
          </View>
        ) : activeTab === 'manual' ? (
          incidents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Manual Incidents</Text>
              <Text style={styles.emptyText}>All clear! No supervisor-created incidents active.</Text>
            </View>
          ) : (
            incidents.map((incident, index) => (
            <View key={incident.incidentId || incident.id || index} style={styles.incidentCard}>
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
                  
                  {incident.coordinates && (
                    <TouchableOpacity
                      style={styles.mapButton}
                      onPress={() => openIncidentMap(incident)}
                    >
                      <Ionicons name="map" size={16} color="#10B981" />
                    </TouchableOpacity>
                  )}
                  
                  {isLoggedIn && (
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

              {/* Map Button for automatic incidents */}
              {incident.coordinates && (
                <View style={styles.incidentActions}>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openIncidentMap(incident)}
                  >
                    <Ionicons name="map" size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
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

              {/* Ticketer Message Display */}
              {incident.ticketerSent && incident.ticketerMessage && (
                <View style={styles.ticketerContainer}>
                  <View style={styles.ticketerHeader}>
                    <Ionicons name="chatbubbles" size={14} color="#059669" />
                    <Text style={styles.ticketerLabel}>Sent to Drivers:</Text>
                    <Text style={styles.ticketerTime}>
                      {new Date(incident.ticketerSentAt).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.ticketerMessage}>{incident.ticketerMessage}</Text>
                  <Text style={styles.ticketerSentBy}>Sent by: {incident.ticketerSentBy}</Text>
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.addNoteButton}
                  onPress={() => setShowAddNote(incident.incidentId || incident.id)}
                >
                  <Ionicons name="create" size={14} color="#6B7280" />
                  <Text style={styles.quickActionText}>Add Note</Text>
                </TouchableOpacity>

                {!incident.ticketerSent && (
                  <TouchableOpacity
                    style={styles.ticketerButton}
                    onPress={() => {
                      const message = isWeb 
                        ? prompt('Enter Ticketer message for drivers:')
                        : 'Service disruption due to incident';
                      if (message) {
                        sendTicketerMessageForIncident(incident, message);
                      }
                    }}
                    disabled={sendingTicketer === (incident.incidentId || incident.id)}
                  >
                    {sendingTicketer === (incident.incidentId || incident.id) ? (
                      <ActivityIndicator size={14} color="#3B82F6" />
                    ) : (
                      <Ionicons name="chatbubbles" size={14} color="#3B82F6" />
                    )}
                    <Text style={styles.quickActionText}>Ticketer</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.closeIncidentButton}
                  onPress={() => updateIncidentStatus(incident.incidentId || incident.id, 'closed')}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.quickActionText}>Close</Text>
                </TouchableOpacity>
                
                {incident.affectsRoutes && incident.affectsRoutes.length > 0 && (
                  <TouchableOpacity
                    style={styles.diversionButton}
                    onPress={() => fetchDiversions(incident)}
                  >
                    <Ionicons name="bulb" size={14} color="#7C3AED" />
                    <Text style={styles.quickActionText}>AI Diversions</Text>
                  </TouchableOpacity>
                )}

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
        )
        ) : (
          trafficIncidents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="radio" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Automatic Incident Alerts</Text>
              <Text style={styles.emptyText}>Waiting for incident data from TomTom and National Highways</Text>
            </View>
          ) : (
            trafficIncidents.map((incident, index) => (
              <View key={incident.id || index} style={[styles.incidentCard, styles.automaticIncidentCard]}>
                <View style={styles.incidentHeader}>
                  <View style={styles.incidentType}>
                    <Ionicons 
                      name="alert-circle" 
                      size={20} 
                      color={incident.severity === 'High' ? '#DC2626' : incident.severity === 'Medium' ? '#F59E0B' : '#3B82F6'} 
                    />
                    <Text style={styles.incidentTypeText}>
                      {incident.type === 'incident' ? 'Traffic Incident' : incident.type || 'Alert'}
                    </Text>
                  </View>
                  
                  <View style={styles.automaticBadge}>
                    <Text style={styles.automaticBadgeText}>
                      {incident.source === 'tomtom' ? 'TomTom' : 
                       incident.source === 'national_highways' ? 'National Highways' :
                       incident.source}
                    </Text>
                  </View>
                </View>

                <Text style={styles.incidentLocation}>{incident.location}</Text>
                
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

                <View style={styles.incidentFooter}>
                  <Text style={styles.incidentTime}>
                    Updated: {new Date(incident.lastUpdated || incident.timestamp).toLocaleString()}
                  </Text>
                  <Text style={[styles.severityBadge, {
                    backgroundColor: incident.severity === 'High' ? '#FEF2F2' : 
                                   incident.severity === 'Medium' ? '#FFF7ED' : '#EFF6FF',
                    color: incident.severity === 'High' ? '#DC2626' : 
                          incident.severity === 'Medium' ? '#F59E0B' : '#3B82F6'
                  }]}>
                    {incident.severity || 'Unknown'} Severity
                  </Text>
                </View>
              </View>
            ))
          )
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

            {/* How Information Was Received */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>How did you receive this information? *</Text>
              <View style={styles.receivedViaGrid}>
                {[
                  { key: 'radio_call', label: 'Radio Call', icon: 'radio' },
                  { key: 'call_centre', label: 'Call Centre Call', icon: 'call' },
                  { key: 'other', label: 'Other', icon: 'help-circle' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.receivedViaButton,
                      newIncident.receivedVia === option.key && styles.receivedViaButtonSelected
                    ]}
                    onPress={() => setNewIncident(prev => ({ ...prev, receivedVia: option.key }))}
                  >
                    <Ionicons name={option.icon} size={20} color={newIncident.receivedVia === option.key ? '#3B82F6' : '#6B7280'} />
                    <Text style={[
                      styles.receivedViaButtonText,
                      newIncident.receivedVia === option.key && styles.receivedViaButtonTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                  (!newIncident.type || !newIncident.location || !newIncident.receivedVia) && styles.submitButtonDisabled
                ]}
                onPress={createIncident}
                disabled={!newIncident.type || !newIncident.location || !newIncident.receivedVia || loading}
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
                  {showIncidentDetails.coordinates && (
                    <TouchableOpacity
                      style={styles.mapActionButton}
                      onPress={() => {
                        setShowIncidentDetails(null);
                        openIncidentMap(showIncidentDetails);
                      }}
                    >
                      <Ionicons name="map" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Show on Map</Text>
                    </TouchableOpacity>
                  )}
                  
                  {showIncidentDetails.affectsRoutes && showIncidentDetails.affectsRoutes.length > 0 && (
                    <TouchableOpacity
                      style={styles.diversionActionButton}
                      onPress={() => {
                        setShowIncidentDetails(null);
                        fetchDiversions(showIncidentDetails);
                      }}
                    >
                      <Ionicons name="bulb" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>AI Diversions</Text>
                    </TouchableOpacity>
                  )}
                  
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
                {showIncidentDetails.receivedVia && (
                  <Text style={styles.metaText}>Information received via: {
                    showIncidentDetails.receivedVia === 'radio_call' ? 'Radio Call' :
                    showIncidentDetails.receivedVia === 'call_centre' ? 'Call Centre Call' :
                    showIncidentDetails.receivedVia === 'other' ? 'Other' :
                    showIncidentDetails.receivedVia
                  }</Text>
                )}
                {showIncidentDetails.updatedAt && (
                  <Text style={styles.metaText}>Last updated: {new Date(showIncidentDetails.updatedAt).toLocaleString()}</Text>
                )}
                <Text style={styles.metaText}>Status: {showIncidentDetails.status}</Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Map Modal */}
      {showMap && mapIncident && (
        <Modal
          visible={showMap}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Incident Location</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMap(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <TomTomTrafficMap
                alerts={[{
                  id: mapIncident.id,
                  title: mapIncident.type,
                  location: mapIncident.location,
                  coordinates: mapIncident.coordinates ? 
                    [mapIncident.coordinates.latitude || mapIncident.coordinates[0], 
                     mapIncident.coordinates.longitude || mapIncident.coordinates[1]] : null,
                  severity: mapIncident.severity || 'Medium'
                }]}
                currentAlert={{
                  id: mapIncident.id,
                  title: mapIncident.type,
                  location: mapIncident.location,
                  coordinates: mapIncident.coordinates
                }}
                alertIndex={0}
              />
            </View>
            
            <View style={styles.mapDetails}>
              <Text style={styles.mapDetailTitle}>{mapIncident.type}</Text>
              <Text style={styles.mapDetailLocation}>{mapIncident.location}</Text>
              {mapIncident.description && (
                <Text style={styles.mapDetailDescription}>{mapIncident.description}</Text>
              )}
              {mapIncident.coordinates && (
                <Text style={styles.mapDetailCoords}>
                  Coordinates: {mapIncident.coordinates.latitude?.toFixed(4) || mapIncident.coordinates[0]?.toFixed(4)}, 
                  {mapIncident.coordinates.longitude?.toFixed(4) || mapIncident.coordinates[1]?.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Diversions Modal */}
      {showDiversions && diversionsIncident && (
        <Modal
          visible={showDiversions}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDiversions(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Diversion Suggestions</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDiversions(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Incident Summary */}
              <View style={styles.diversionIncidentSummary}>
                <Text style={styles.diversionIncidentType}>
                  {diversionsIncident.type} at {diversionsIncident.location}
                </Text>
                <View style={styles.diversionAffectedRoutes}>
                  <Text style={styles.diversionLabel}>Affected Routes:</Text>
                  <View style={styles.routesList}>
                    {diversionsIncident.affectsRoutes?.map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {diversionsLoading ? (
                <View style={styles.diversionLoadingContainer}>
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text style={styles.diversionLoadingText}>Analyzing routes and generating diversions...</Text>
                </View>
              ) : diversionsData ? (
                <View>
                  {/* Summary */}
                  <View style={styles.diversionSection}>
                    <Text style={styles.diversionSummary}>{diversionsData.formatted.summary}</Text>
                    <View style={[styles.severityIndicator, { backgroundColor: 
                      diversionsData.suggestions.severity === 'critical' ? '#FEE2E2' :
                      diversionsData.suggestions.severity === 'high' ? '#FEF3C7' :
                      diversionsData.suggestions.severity === 'medium' ? '#DBEAFE' : '#D1FAE5'
                    }]}>
                      <Text style={[styles.severityText, { color:
                        diversionsData.suggestions.severity === 'critical' ? '#DC2626' :
                        diversionsData.suggestions.severity === 'high' ? '#F59E0B' :
                        diversionsData.suggestions.severity === 'medium' ? '#3B82F6' : '#10B981'
                      }]}>
                        {diversionsData.suggestions.severity.toUpperCase()} PRIORITY
                      </Text>
                    </View>
                  </View>
                  
                  {/* TomTom Traffic-Aware Routes */}
                  {diversionsData.formatted.tomtomRoutes?.length > 0 && (
                    <View style={styles.diversionSection}>
                      <Text style={styles.diversionSectionTitle}>
                        <Ionicons name="navigate" size={16} color="#374151" /> Live Traffic Routes
                      </Text>
                      {diversionsData.formatted.tomtomRoutes.map((route, idx) => (
                        <View key={idx} style={[styles.tomtomRouteCard, 
                          route.type === 'primary' && styles.tomtomRoutePrimary
                        ]}>
                          <View style={styles.tomtomRouteHeader}>
                            <Text style={styles.tomtomRouteType}>
                              {route.type === 'primary' ? '🎯 Primary Route' : 
                               route.type === 'alternative' ? '🔄 Alternative' : 
                               '🚑 Evacuation Route'}
                            </Text>
                            <View style={styles.tomtomRouteTime}>
                              <Ionicons name="time" size={14} color="#059669" />
                              <Text style={styles.tomtomRouteDuration}>{route.duration}</Text>
                            </View>
                          </View>
                          <Text style={styles.tomtomRouteSummary}>{route.summary}</Text>
                          
                          <View style={styles.tomtomRouteDetails}>
                            <View style={styles.tomtomRouteMetric}>
                              <Ionicons name="speedometer" size={12} color="#6B7280" />
                              <Text style={styles.tomtomRouteMetricText}>{route.distance}</Text>
                            </View>
                            {route.trafficDelay !== 'No delays' && (
                              <View style={[styles.tomtomRouteMetric, styles.trafficDelay]}>
                                <Ionicons name="warning" size={12} color="#EF4444" />
                                <Text style={[styles.tomtomRouteMetricText, { color: '#EF4444' }]}>
                                  {route.trafficDelay}
                                </Text>
                              </View>
                            )}
                            <View style={styles.tomtomRouteMetric}>
                              <Ionicons name="analytics" size={12} color="#10B981" />
                              <Text style={styles.tomtomRouteMetricText}>{route.confidence}</Text>
                            </View>
                          </View>
                          
                          {route.via !== 'Direct route' && (
                            <Text style={styles.tomtomRouteVia}>Via: {route.via}</Text>
                          )}
                        </View>
                      ))}
                      <Text style={styles.tomtomDisclaimer}>
                        🚦 Routes calculated with live TomTom traffic data
                      </Text>
                    </View>
                  )}
                  
                  {/* Route-Specific Diversions */}
                  {diversionsData.formatted.diversions.length > 0 && (
                    <View style={styles.diversionSection}>
                      <Text style={styles.diversionSectionTitle}>
                        <Ionicons name="swap-horizontal" size={16} color="#374151" /> Route Diversions
                      </Text>
                      {diversionsData.formatted.diversions.map((div, idx) => (
                        <View key={idx} style={styles.routeDiversionCard}>
                          <View style={styles.routeDiversionHeader}>
                            <Text style={styles.routeDiversionRoute}>Route {div.route}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#6B7280" />
                            <Text style={styles.routeDiversionAlternative}>
                              {div.primaryAlternative || 'See instructions'}
                            </Text>
                          </View>
                          <Text style={styles.routeDiversionInstructions}>
                            {div.instructions || 'Check interchange options below'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Key Advice */}
                  {diversionsData.formatted.keyAdvice?.length > 0 && (
                    <View style={styles.diversionSection}>
                      <Text style={styles.diversionSectionTitle}>
                        <Ionicons name="information-circle" size={16} color="#374151" /> Key Advice
                      </Text>
                      {diversionsData.formatted.keyAdvice.map((advice, idx) => (
                        <View key={idx} style={styles.adviceCard}>
                          <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
                          <Text style={styles.adviceText}>{advice}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Nearby Interchanges */}
                  {diversionsData.formatted.interchanges?.length > 0 && (
                    <View style={styles.diversionSection}>
                      <Text style={styles.diversionSectionTitle}>
                        <Ionicons name="git-branch" size={16} color="#374151" /> Nearby Interchanges
                      </Text>
                      {diversionsData.formatted.interchanges.map((interchange, idx) => (
                        <View key={idx} style={styles.interchangeCard}>
                          <View style={styles.interchangeHeader}>
                            <Text style={styles.interchangeName}>{interchange.name}</Text>
                            <Text style={styles.interchangeDistance}>{interchange.distance}</Text>
                          </View>
                          <Text style={styles.interchangeRoutes}>
                            Routes: {interchange.availableRoutes}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Copy Instructions Button */}
                  <TouchableOpacity
                    style={styles.copyDiversionButton}
                    onPress={() => {
                      // Format diversions for copying
                      const text = formatDiversionsForCopy(diversionsData);
                      if (Platform.OS === 'web') {
                        navigator.clipboard.writeText(text);
                        showNotification('Diversion suggestions copied to clipboard', 'success');
                      } else {
                        // On mobile, show in alert
                        Alert.alert('Diversion Suggestions', text);
                      }
                    }}
                  >
                    <Ionicons name="copy" size={20} color="#FFFFFF" />
                    <Text style={styles.copyDiversionText}>Copy Instructions</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.diversionErrorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.diversionErrorText}>Unable to generate diversions</Text>
                </View>
              )}
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
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EBF5FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
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
  automaticIncidentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  automaticBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  automaticBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
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
  mapButton: {
    backgroundColor: '#ECFDF5',
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
  diversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  // Ticketer message styles
  ticketerContainer: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  ticketerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ticketerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
  ticketerTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  ticketerMessage: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    marginBottom: 4,
  },
  ticketerSentBy: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  ticketerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  receivedViaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  receivedViaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  receivedViaButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  receivedViaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  receivedViaButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  diversionActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
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
  // Map Modal Styles
  mapContainer: {
    height: 400,
    backgroundColor: '#F8FAFC',
  },
  mapDetails: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mapDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapDetailLocation: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  mapDetailDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  mapDetailCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: isWeb ? 'monospace' : 'System',
  },
  // Diversion Modal Styles
  diversionIncidentSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  diversionIncidentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  diversionAffectedRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diversionLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  diversionLoadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  diversionLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#7C3AED',
    textAlign: 'center',
  },
  diversionSection: {
    marginBottom: 20,
  },
  diversionSummary: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
  },
  severityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  diversionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDiversionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  routeDiversionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  routeDiversionRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  routeDiversionAlternative: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  routeDiversionInstructions: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  interchangeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  interchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  interchangeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  interchangeDistance: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  interchangeRoutes: {
    fontSize: 13,
    color: '#6B7280',
  },
  copyDiversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  copyDiversionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diversionErrorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  diversionErrorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  // TomTom Route Styles
  tomtomRouteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  tomtomRoutePrimary: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  tomtomRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tomtomRouteType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  tomtomRouteTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tomtomRouteDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  tomtomRouteSummary: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 10,
    fontWeight: '500',
  },
  tomtomRouteDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  tomtomRouteMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tomtomRouteMetricText: {
    fontSize: 12,
    color: '#6B7280',
  },
  trafficDelay: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tomtomRouteVia: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tomtomDisclaimer: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default IncidentManager;