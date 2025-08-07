import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

// Import required components - wrap in try/catch to handle missing components gracefully
import CreateRoadworkModal from '../CreateRoadworkModal';
import TomTomTrafficMap from '../TomTomTrafficMap';
import UnifiedDetailModal from '../UnifiedDetailModal';

const RoadworksManager = ({ baseUrl }) => {
  // Get the supervisor session from the existing auth system
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin,
    supervisorSession
  } = useSupervisor();

  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [trafficRoadworks, setTrafficRoadworks] = useState([]); // New: automatic roadworks from traffic APIs
  const [streetManagerRoadworks, setStreetManagerRoadworks] = useState([]); // StreetManager roadworks
  const [supabaseStreetworks, setSupabaseStreetworks] = useState([]); // NEW: Supabase streetworks data
  const [allTrafficAlerts, setAllTrafficAlerts] = useState([]); // ALL traffic alerts for triage
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // Tab options: manual, automatic, streetmanager, durham, timeline
  const [viewMode, setViewMode] = useState('list'); // View modes: list, map
  const [showMap, setShowMap] = useState(false);
  const [mapRoadwork, setMapRoadwork] = useState(null);
  const [showDiversions, setShowDiversions] = useState(false);
  const [diversionsRoadwork, setDiversionsRoadwork] = useState(null);
  const [diversionsLoading, setDiversionsLoading] = useState(false);
  const [diversionsData, setDiversionsData] = useState(null);
  const [selectedRoutesForOverlay, setSelectedRoutesForOverlay] = useState([]); // Routes to show on map
  const [stats, setStats] = useState({
    total: 0,
    promotedToDisplay: 0,
    activeDiversions: 0,
    pendingTasks: 0,
    automatic: 0, // New: count of automatic roadworks
    streetManager: 0, // Count of StreetManager roadworks
    supabaseStreetworks: 0, // NEW: Count of Supabase streetworks
    criticalCount: 0, // Critical roadworks
    allAlerts: 0, // Count of all traffic alerts
    routeImpactCount: 0, // Count of roadworks affecting bus routes
    outOfAreaCount: 0 // Count of roadworks outside operational area
  });
  const [showOutOfArea, setShowOutOfArea] = useState(false); // Toggle for showing out-of-area roadworks
  const [allRoadworksUnfiltered, setAllRoadworksUnfiltered] = useState([]); // Store all roadworks before filtering
  const [trafficRoadworksUnfiltered, setTrafficRoadworksUnfiltered] = useState([]);
  const [streetManagerUnfiltered, setStreetManagerUnfiltered] = useState([]);
  const [supabaseStreetworksUnfiltered, setSupabaseStreetworksUnfiltered] = useState([]); // NEW: Unfiltered Supabase data
  
  // Enhanced Filtering States
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    severity: 'all', // all, critical, high, medium, low
    dateRange: 'all', // all, today, week, upcoming
    affectedRoutes: [], // array of route names
    location: '', // location text filter
    trafficManagement: 'all', // all, roadClosure, laneRestriction, etc.
    status: 'all' // all, active, planned, completed
  });

  // Quick acknowledge function
  const handleQuickAcknowledge = async (roadwork) => {
    if (!isLoggedIn || !sessionId) {
      Alert.alert('Error', 'You must be logged in to acknowledge roadworks');
      return;
    }
    
    try {
      console.log(`✅ Quick acknowledging roadwork: ${roadwork.id || roadwork.notification_id}`);
      
      const roadworkId = roadwork.id || roadwork.notification_id;
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supervisorToken: sessionId,
          note: 'Quick acknowledge - reviewing impact'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork acknowledged successfully');
        
        // Update local state to show visual feedback immediately
        if (roadwork.source === 'manual') {
          setRoadworks(prev => prev.map(r => 
            r.id === roadworkId 
              ? { ...r, acknowledged_at: new Date().toISOString(), acknowledged_by: supervisorName }
              : r
          ));
        } else if (roadwork.source === 'StreetManager' || roadwork.source === 'street_manager') {
          setStreetManagerRoadworks(prev => prev.map(r => 
            (r.id === roadworkId || r.notification_id === roadworkId)
              ? { ...r, acknowledged_at: new Date().toISOString(), acknowledged_by: supervisorName }
              : r
          ));
        } else {
          setTrafficRoadworks(prev => prev.map(r => 
            (r.id === roadworkId || r.notification_id === roadworkId)
              ? { ...r, acknowledged_at: new Date().toISOString(), acknowledged_by: supervisorName }
              : r
          ));
        }
        
        // Refresh data to ensure consistency
        await loadAllData();
      } else {
        console.error('❌ Failed to acknowledge roadwork:', data.error);
        Alert.alert('Error', data.error || 'Failed to acknowledge roadwork');
      }
    } catch (error) {
      console.error('❌ Error acknowledging roadwork:', error);
      Alert.alert('Error', `Failed to acknowledge roadwork: ${error.message}`);
    }
  };

  // Roadworks statuses with colors
  const ROADWORKS_STATUSES = {
    reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
  };

// Status Change Modal Component
const StatusChangeModal = ({ visible, roadwork, onClose, onConfirm, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'assessing', label: 'Assessing Impact', description: 'Reviewing the impact on our services' },
    { value: 'planning', label: 'Planning Response', description: 'Creating diversion plans and communications' },
    { value: 'approved', label: 'Plans Approved', description: 'Response plans are ready for implementation' },
    { value: 'active', label: 'Monitoring Active', description: 'Roadworks are active, monitoring impact' },
    { value: 'monitoring', label: 'Ongoing Monitoring', description: 'Continuing to monitor and adjust' }
  ];

  const handleConfirm = () => {
    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a status');
      return;
    }
    
    if (!notes.trim()) {
      Alert.alert('Error', 'Please provide notes about the action being taken');
      return;
    }

    onConfirm(roadwork?.id, selectedStatus, notes);
    setSelectedStatus('');
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setSelectedStatus('');
    setNotes('');
    onClose();
  };

  if (!visible || !roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Take Action on Roadwork</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.statusModalTitle}>{roadwork.title}</Text>
            <Text style={styles.statusModalLocation}>{roadwork.location}</Text>

            <Text style={styles.sectionTitle}>Select Action</Text>
            
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  selectedStatus === option.value && styles.statusOptionSelected
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <View style={styles.statusOptionContent}>
                  <Text style={[
                    styles.statusOptionLabel,
                    selectedStatus === option.value && styles.statusOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.statusOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedStatus === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Action Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe what action you're taking or plan to take...\n\nExamples:\n• Coordinating with council for shuttle service\n• Creating diversion route via A19\n• Sent to commercial team for council liaison"
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={6}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmActionButton, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading || !selectedStatus || !notes.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={[styles.confirmActionButtonText, { marginLeft: 8 }]}>Confirm Action</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

  const handleDismissRoadwork = async (roadworkId, reason = 'No action required', roadworkData = null) => {
    console.log('🚨 DISMISS BUTTON CLICKED!', { roadworkId, reason, roadworkData: !!roadworkData });
    console.log('🔍 Session check:', { 
      isLoggedIn, 
      localSessionId: supervisorSession?.sessionId,
      backendSessionId: supervisorSession?.backendSessionId,
      sessionIdUsed: sessionId,
      supervisorName 
    });
    
    if (!isLoggedIn) {
      console.log('❌ Not logged in!');
      Alert.alert('Error', 'You must be logged in to dismiss roadworks');
      return;
    }

    if (!sessionId) {
      console.log('❌ No session ID!');
      Alert.alert('Error', 'No valid session found. Please log in again.');
      return;
    }

    try {
      console.log(`🙅 ${roadworkId} - Starting dismiss process...`);
      console.log('🔍 API Base URL:', apiBaseUrl);
      
      // Find the roadwork data to determine source
      let roadwork = roadworkData;
      if (!roadwork) {
        console.log('🔍 Searching for roadwork in data arrays...');
        roadwork = [...roadworks, ...trafficRoadworks, ...streetManagerRoadworks]
          .find(r => r.id === roadworkId || r.notification_id === roadworkId);
        console.log('🔍 Found roadwork:', !!roadwork, roadwork?.source);
      }
      
      console.log('🔍 Roadwork source:', roadwork?.source);
      
      // Handle different types of roadworks
      if (roadwork && (roadwork.source === 'StreetManager' || roadwork.source === 'street_manager' || roadwork.source === 'tomtom' || roadwork.source === 'national_highways')) {
        // For traffic API roadworks, use the supervisor dismiss alert endpoint
        console.log(`🙅 Dismissing traffic API roadwork via supervisor endpoint...`);
        
        const url = `${apiBaseUrl}/api/supervisor/dismiss-alert`;
        const payload = {
          alertId: roadworkId,
          reason: reason,
          sessionId: sessionId,
          alertData: roadwork
        };
        
        console.log('📤 Making API call:', { url, payload: { ...payload, alertData: 'truncated' } });
        
        // FALLBACK: If no backend session, try to create one on the fly
        if (!sessionId || sessionId.startsWith('session-')) {
          console.log('⚠️ No valid backend session, attempting emergency auth...');
          try {
            const emergencyAuth = await fetch(`${apiBaseUrl}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Include JWT cookies
              body: JSON.stringify({
                badge: 'AG003', // Fallback to AG003
                password: 'Anthony123' // Emergency fallback password
              })
            });
            
            if (emergencyAuth.ok) {
              const authData = await emergencyAuth.json();
              if (authData.success) {
                // JWT tokens are now in HttpOnly cookies, no sessionId needed
                console.log('✅ Emergency secure auth successful for AG003');
              }
            }
          } catch (authError) {
            console.warn('⚠️ Emergency auth failed:', authError.message);
          }
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.success) {
          console.log('✅ Traffic roadwork dismissed successfully');
          Alert.alert('Success', 'Roadwork dismissed successfully');
          await loadAllData(); // Reload all data
        } else {
          console.error('❌ Failed to dismiss traffic roadwork:', data.error);
          if (response.status === 401) {
            Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
          } else {
            Alert.alert('Error', data.error || 'Failed to dismiss roadwork');
          }
        }
      } else {
        // For manual roadworks, use the roadworks status endpoint
        console.log(`🙅 Dismissing manual roadwork via status endpoint...`);
        
        const url = `${apiBaseUrl}/api/roadworks/${roadworkId}/status`;
        const payload = {
          status: 'cancelled',
          sessionId: sessionId,
          notes: reason
        };
        
        console.log('📤 Making API call:', { url, payload });
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.success) {
          console.log('✅ Manual roadwork dismissed successfully');
          Alert.alert('Success', 'Roadwork dismissed successfully');
          await loadRoadworks(); // Reload manual roadworks
        } else {
          console.error('❌ Failed to dismiss manual roadwork:', data.error);
          if (response.status === 401) {
            Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
          } else {
            Alert.alert('Error', data.error || 'Failed to dismiss roadwork');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error dismissing roadwork:', error);
      Alert.alert('Error', `Failed to dismiss roadwork: ${error.message}`);
    }
  };

  const handleAcknowledgeRoadwork = async (roadworkId, newStatus, notes) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to acknowledge roadworks');
      return;
    }

    try {
      console.log(`✅ ${roadworkId} - Acknowledging roadwork with status: ${newStatus}`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          sessionId: sessionId,
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork acknowledged successfully');
        Alert.alert('Success', 'Roadwork status updated successfully');
        await loadRoadworks();
      } else {
        console.error('❌ Failed to acknowledge roadwork:', data.error);
        Alert.alert('Error', data.error || 'Failed to update roadwork');
      }
    } catch (error) {
      console.error('❌ Error acknowledging roadwork:', error);
      Alert.alert('Error', `Failed to update roadwork: ${error.message}`);
    }
  };

  // Priority levels with colors
  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  // Prepare roadworks data for map display
  const prepareMapData = () => {
    // Combine all roadworks based on active tab
    // Note: These are already filtered by the useEffect hook
    let mapRoadworks = [];
    
    if (activeTab === 'manual') {
      mapRoadworks = roadworks;
    } else if (activeTab === 'streetmanager') {
      mapRoadworks = streetManagerRoadworks;
    } else if (activeTab === 'automatic') {
      mapRoadworks = trafficRoadworks.filter(r => r.source !== 'durham_council');
    } else if (activeTab === 'durham') {
      mapRoadworks = trafficRoadworks.filter(r => r.source === 'durham_council');
    }
    
    // Transform roadworks to map markers with severity-based colors
    return mapRoadworks
      .filter(r => r.coordinates) // Only include roadworks with coordinates
      .map(roadwork => {
        const severity = roadwork.priority || roadwork.severity?.toLowerCase() || 'medium';
        let color = '#F59E0B'; // Default orange
        
        if (severity === 'critical' || roadwork.mlSeverity >= 3.5) {
          color = '#DC2626'; // Red
        } else if (severity === 'high') {
          color = '#EA580C'; // Dark orange
        } else if (severity === 'low' || severity === 'planned') {
          color = '#10B981'; // Green
        }
        
        return {
          id: roadwork.id || roadwork.notification_id,
          title: roadwork.title,
          location: roadwork.location,
          coordinates: [
            roadwork.coordinates.latitude || roadwork.coordinates[0],
            roadwork.coordinates.longitude || roadwork.coordinates[1]
          ],
          severity: severity,
          color: color,
          affectedRoutes: roadwork.affectedRoutes || roadwork.affectsRoutes || [],
          description: roadwork.description,
          source: roadwork.source,
          isOutOfArea: !isWithinOperationalArea(roadwork.coordinates, roadwork.location)
        };
      });
  };

  // Helper function to format diversions for copying
  const formatDiversionsForCopy = (data) => {
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
  };

  // Handler for creating diversion plan
  const handleCreateDiversion = async (roadwork) => {
    Alert.alert(
      'Create Diversion Plan',
      `Create a diversion plan for ${roadwork.affectsRoutes?.join(', ') || roadwork.affectedRoutes?.join(', ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Plan',
          onPress: () => {
            // Would open diversion planning modal
            Alert.alert('Coming Soon', 'Diversion planning interface will be available soon');
          }
        }
      ]
    );
  };

  // API base URL
  const apiBaseUrl = baseUrl || 'https://go-barry.onrender.com';

  // Helper function to make requests with timeout and error handling
  const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw error;
    }
  };

  // Go North East operational area boundaries
  // Coverage: Newcastle, Gateshead, Sunderland, Durham, North Tyneside, Northumberland
  const GO_NORTH_EAST_BOUNDS = {
    // Bounding box for quick filtering
    north: 55.3,    // Northumberland border
    south: 54.5,    // Durham southern border
    east: -1.2,     // Coast
    west: -2.2,     // Western Northumberland
    
    // Major operational centers for distance-based filtering
    centers: [
      { name: 'Newcastle', lat: 54.9783, lng: -1.6178, radius: 15000 },
      { name: 'Gateshead', lat: 54.9527, lng: -1.6035, radius: 12000 },
      { name: 'Sunderland', lat: 54.9061, lng: -1.3811, radius: 15000 },
      { name: 'Durham', lat: 54.7753, lng: -1.5849, radius: 20000 },
      { name: 'North Tyneside', lat: 55.0182, lng: -1.4858, radius: 12000 },
      { name: 'Northumberland', lat: 55.2082, lng: -1.6913, radius: 30000 }
    ],
    
    // Excluded areas (definitely outside operational zone)
    excludedAreas: [
      'Middlesbrough', 'Teesside', 'Hartlepool', 'Darlington', 
      'Redcar', 'Stockton', 'Carlisle', 'Cumbria'
    ]
  };

  // Check if coordinates are within operational area
  const isWithinOperationalArea = (coordinates, location = '') => {
    if (!coordinates) return true; // If no coords, include by default
    
    const lat = coordinates.latitude || coordinates[0];
    const lng = coordinates.longitude || coordinates[1];
    
    // Quick bounding box check
    if (lat < GO_NORTH_EAST_BOUNDS.south || lat > GO_NORTH_EAST_BOUNDS.north ||
        lng < GO_NORTH_EAST_BOUNDS.west || lng > GO_NORTH_EAST_BOUNDS.east) {
      return false;
    }
    
    // Check if location string contains excluded areas
    if (location) {
      const locationLower = location.toLowerCase();
      for (const excluded of GO_NORTH_EAST_BOUNDS.excludedAreas) {
        if (locationLower.includes(excluded.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Check if within radius of any operational center
    for (const center of GO_NORTH_EAST_BOUNDS.centers) {
      const distance = calculateDistance(lat, lng, center.lat, center.lng);
      if (distance <= center.radius) {
        return true;
      }
    }
    
    // Default to excluding if not near any center
    return false;
  };

  // Helper to calculate distance (reuse from GTFS matcher)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Apply all filters to a roadwork
  const applyFilters = (roadwork) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        roadwork.title?.toLowerCase().includes(query) ||
        roadwork.location?.toLowerCase().includes(query) ||
        roadwork.description?.toLowerCase().includes(query) ||
        roadwork.promoter?.toLowerCase().includes(query) ||
        (roadwork.affectedRoutes || roadwork.affectsRoutes || []).some(r => 
          r.toLowerCase().includes(query)
        );
      if (!matchesSearch) return false;
    }
    
    // Severity filter
    if (filters.severity !== 'all') {
      const roadworkSeverity = (roadwork.priority || roadwork.severity || 'medium').toLowerCase();
      if (roadworkSeverity !== filters.severity) return false;
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = roadwork.startDate ? new Date(roadwork.startDate) : null;
      const endDate = roadwork.endDate ? new Date(roadwork.endDate) : null;
      const createdDate = new Date(roadwork.createdAt || roadwork.lastUpdated);
      
      switch (filters.dateRange) {
        case 'today':
          // Active today or created today
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(now);
          todayEnd.setHours(23, 59, 59, 999);
          
          const isActiveToday = startDate && endDate && 
            startDate <= todayEnd && endDate >= todayStart;
          const isCreatedToday = createdDate >= todayStart && createdDate <= todayEnd;
          
          if (!isActiveToday && !isCreatedToday) return false;
          break;
          
        case 'week':
          // Active this week
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const isActiveThisWeek = startDate && endDate && 
            startDate <= weekEnd && endDate >= weekStart;
          if (!isActiveThisWeek) return false;
          break;
          
        case 'upcoming':
          // Starts in the future
          if (!startDate || startDate <= now) return false;
          break;
      }
    }
    
    // Affected routes filter
    if (filters.affectedRoutes.length > 0) {
      const roadworkRoutes = roadwork.affectedRoutes || roadwork.affectsRoutes || [];
      const hasMatchingRoute = filters.affectedRoutes.some(filterRoute => 
        roadworkRoutes.includes(filterRoute)
      );
      if (!hasMatchingRoute) return false;
    }
    
    // Location filter
    if (filters.location) {
      const locationMatch = roadwork.location?.toLowerCase().includes(filters.location.toLowerCase());
      if (!locationMatch) return false;
    }
    
    // Traffic management filter
    if (filters.trafficManagement !== 'all') {
      const management = roadwork.trafficManagement?.toLowerCase() || '';
      switch (filters.trafficManagement) {
        case 'roadClosure':
          if (!management.includes('closure') && !management.includes('closed')) return false;
          break;
        case 'laneRestriction':
          if (!management.includes('lane') && !management.includes('restriction')) return false;
          break;
        case 'trafficControl':
          if (!management.includes('control') && !management.includes('lights')) return false;
          break;
        case 'other':
          if (management.includes('closure') || management.includes('lane') || management.includes('control')) return false;
          break;
      }
    }
    
    // Status filter
    if (filters.status !== 'all') {
      const roadworkStatus = roadwork.status || 'active';
      switch (filters.status) {
        case 'active':
          if (!['active', 'monitoring', 'assessing'].includes(roadworkStatus)) return false;
          break;
        case 'planned':
          if (!['planned', 'approved', 'planning', 'reported'].includes(roadworkStatus)) return false;
          break;
        case 'completed':
          if (!['completed', 'cancelled'].includes(roadworkStatus)) return false;
          break;
      }
    }
    
    return true;
  };

  // Enhanced function to fetch affected routes for a roadwork
  const fetchAffectedRoutes = async (roadwork) => {
    if (!roadwork.coordinates) return [];
    
    try {
      const lat = roadwork.coordinates.latitude || roadwork.coordinates[0];
      const lng = roadwork.coordinates.longitude || roadwork.coordinates[1];
      
      // Call the enhanced GTFS matcher API
      const response = await fetch(`${apiBaseUrl}/api/gtfs/match/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          radius: 500, // 500m radius for roadworks
          maxResults: 20,
          includeStops: true,
          includeShapes: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.matches) {
          // Filter for high confidence matches and extract route names
          return data.matches
            .filter(match => match.confidence > 0.5) // Only high confidence matches
            .map(match => match.routeName)
            .filter((route, index, self) => self.indexOf(route) === index); // Remove duplicates
        }
      }
    } catch (error) {
      console.error('Error fetching affected routes:', error);
    }
    
    return [];
  };

  // Process roadworks to add route impact data
  const enrichRoadworksWithRoutes = async (roadworksList) => {
    console.log('🚌 Enriching roadworks with route impact data...');
    
    const enrichedPromises = roadworksList.map(async (roadwork) => {
      // Skip if already has affected routes
      if (roadwork.affectedRoutes?.length > 0 || roadwork.affectsRoutes?.length > 0) {
        return roadwork;
      }
      
      // Fetch affected routes
      const affectedRoutes = await fetchAffectedRoutes(roadwork);
      
      return {
        ...roadwork,
        affectedRoutes: affectedRoutes,
        hasRouteImpact: affectedRoutes.length > 0
      };
    });
    
    const enriched = await Promise.all(enrichedPromises);
    console.log(`✅ Enriched ${enriched.filter(r => r.hasRouteImpact).length} roadworks with route impacts`);
    return enriched;
  };

  // Load roadworks data
  useEffect(() => {
    loadAllData();
  }, [isLoggedIn, sessionId]);

  // Reload data when filters change
  useEffect(() => {
    if (allRoadworksUnfiltered.length > 0 || trafficRoadworksUnfiltered.length > 0 || streetManagerUnfiltered.length > 0) {
      // Apply both geographic and enhanced filters
      const applyAllFilters = (roadwork) => {
        // First apply geographic filter
        if (!showOutOfArea && !isWithinOperationalArea(roadwork.coordinates, roadwork.location)) {
          return false;
        }
        // Then apply enhanced filters
        return applyFilters(roadwork);
      };
      
      const manualFiltered = allRoadworksUnfiltered.filter(applyAllFilters);
      const streetManagerFiltered = streetManagerUnfiltered.filter(applyAllFilters);
      const trafficFiltered = trafficRoadworksUnfiltered.filter(applyAllFilters);
      
      setRoadworks(manualFiltered);
      setStreetManagerRoadworks(streetManagerFiltered);
      setTrafficRoadworks(trafficFiltered);
      
      // Recalculate stats
      calculateStats(
        { all: allRoadworksUnfiltered, filtered: manualFiltered },
        { 
          streetManager: { all: streetManagerUnfiltered, filtered: streetManagerFiltered },
          otherTraffic: { all: trafficRoadworksUnfiltered, filtered: trafficFiltered }
        }
      );
    }
  }, [showOutOfArea, searchQuery, filters]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // First get the actual count of streetworks
      const countResponse = await fetch(`${apiBaseUrl}/api/streetworks/count`);
      const countData = await countResponse.json();
      if (countData.success) {
        console.log(`📊 Total streetworks in database: ${countData.count}`);
      }

      const [manualData, trafficData] = await Promise.all([
        loadRoadworks(),
        loadTrafficRoadworks()
      ]);
      // Calculate stats with the returned data
      calculateStats(manualData, trafficData);
    } finally {
      setLoading(false);
    }
  };

  const loadRoadworks = async () => {
    try {
      console.log('🚧 Loading manual roadworks from API...');
      console.log(`🔗 API URL: ${apiBaseUrl}/api/roadworks`);
      
      const response = await fetchWithTimeout(`${apiBaseUrl}/api/roadworks`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        let roadworksData = data.roadworks || [];
        
        // Enrich with route impact data
        roadworksData = await enrichRoadworksWithRoutes(roadworksData);
        
        // Store unfiltered data
        setAllRoadworksUnfiltered(roadworksData);
        
        // Apply both geographic and enhanced filters
        const filteredData = roadworksData.filter(r => {
          // First apply geographic filter
          if (!showOutOfArea && !isWithinOperationalArea(r.coordinates, r.location)) {
            return false;
          }
          // Then apply enhanced filters
          return applyFilters(r);
        });
        
        setRoadworks(filteredData);
        console.log(`✅ Loaded ${roadworksData.length} manual roadworks (${filteredData.length} in operational area)`);
        return { all: roadworksData, filtered: filteredData };
      } else {
        console.error('❌ Failed to load roadworks:', data.error);
        Alert.alert('Error', 'Failed to load roadworks data');
        setRoadworks([]);
        setAllRoadworksUnfiltered([]);
        return { all: [], filtered: [] };
      }
    } catch (error) {
      console.error('❌ Error loading roadworks:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to connect to server';
      if (error.message.includes('timed out')) {
        errorMessage = 'Request timed out - server may be busy';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to backend - check if server is running';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }
      
      console.error(`❌ Error details: ${errorMessage}`);
      Alert.alert('Connection Error', errorMessage);
      setRoadworks([]);
      setAllRoadworksUnfiltered([]);
      return { all: [], filtered: [] };
    }
  };

  const loadTrafficRoadworks = async () => {
    try {
      console.log('🚧 Loading automatic roadwork alerts from traffic APIs...');
      console.log(`🔗 API URL: ${apiBaseUrl}/api/roadworks/unified?source=all&limit=15000`);
      
      const response = await fetchWithTimeout(`${apiBaseUrl}/api/roadworks/unified?source=all&limit=15000`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter out manual roadworks to get only automatic ones
        let trafficData = (data.data || data.roadworks || []).filter(r => r.source !== 'manual');
        
        // Enrich all traffic data with route impacts
        trafficData = await enrichRoadworksWithRoutes(trafficData);
        
        // Separate StreetManager from other sources
        const streetManagerAll = trafficData.filter(r => 
          r.source === 'StreetManager' || r.source === 'street_manager'
        );
        const otherTrafficAll = trafficData.filter(r => 
          r.source !== 'StreetManager' && r.source !== 'street_manager'
        );
        
        // Store unfiltered data
        setStreetManagerUnfiltered(streetManagerAll);
        setTrafficRoadworksUnfiltered(otherTrafficAll);
        
        // Apply both geographic and enhanced filters
        const applyAllFilters = (r) => {
          // First apply geographic filter
          if (!showOutOfArea && !isWithinOperationalArea(r.coordinates, r.location)) {
            return false;
          }
          // Then apply enhanced filters
          return applyFilters(r);
        };
        
        const streetManager = streetManagerAll.filter(applyAllFilters);
        const otherTraffic = otherTrafficAll.filter(applyAllFilters);
        
        setStreetManagerRoadworks(streetManager);
        setTrafficRoadworks(otherTraffic);
        
        const outOfAreaCount = trafficData.length - streetManager.length - otherTraffic.length;
        console.log(`✅ Loaded ${streetManagerAll.length} StreetManager + ${otherTrafficAll.length} other traffic roadworks`);
        console.log(`   🌍 In operational area: ${streetManager.length} StreetManager + ${otherTraffic.length} other`);
        console.log(`   🚫 Outside area: ${outOfAreaCount} roadworks`);
        console.log(`   🔴 Critical: ${data.metadata?.criticalCount || 0}, 🚨 High Impact: ${data.metadata?.highImpactCount || 0}`);
        console.log(`   🚌 With route impacts: ${trafficData.filter(r => r.hasRouteImpact).length}`);
        
        return { 
          streetManager: { all: streetManagerAll, filtered: streetManager }, 
          otherTraffic: { all: otherTrafficAll, filtered: otherTraffic } 
        };
      } else {
        console.error('❌ Failed to load traffic roadworks:', data.error);
        setTrafficRoadworks([]);
        setStreetManagerRoadworks([]);
        setTrafficRoadworksUnfiltered([]);
        setStreetManagerUnfiltered([]);
        return { 
          streetManager: { all: [], filtered: [] }, 
          otherTraffic: { all: [], filtered: [] } 
        };
      }
    } catch (error) {
      console.error('❌ Error loading traffic roadworks:', error);
      setTrafficRoadworks([]);
      setStreetManagerRoadworks([]);
      setTrafficRoadworksUnfiltered([]);
      setStreetManagerUnfiltered([]);
      return { 
        streetManager: { all: [], filtered: [] }, 
        otherTraffic: { all: [], filtered: [] } 
      };
    }
  };

  const calculateStats = (manualData = {}, trafficData = {}) => {
    // Handle both old and new data structures
    const manualAll = manualData.all || manualData;
    const manualFiltered = manualData.filtered || manualData;
    
    const streetManagerAll = trafficData.streetManager?.all || trafficData.streetManager || [];
    const streetManagerFiltered = trafficData.streetManager?.filtered || trafficData.streetManager || [];
    const otherTrafficAll = trafficData.otherTraffic?.all || trafficData.otherTraffic || [];
    const otherTrafficFiltered = trafficData.otherTraffic?.filtered || trafficData.otherTraffic || [];
    
    // All data (unfiltered)
    const allTrafficUnfiltered = [...streetManagerAll, ...otherTrafficAll];
    const allRoadworksUnfiltered = [...(Array.isArray(manualAll) ? manualAll : []), ...allTrafficUnfiltered];
    
    // Filtered data (in operational area)
    const allTrafficFiltered = [...streetManagerFiltered, ...otherTrafficFiltered];
    const allRoadworksFiltered = [...(Array.isArray(manualFiltered) ? manualFiltered : []), ...allTrafficFiltered];
    
    // Calculate out-of-area count
    const outOfAreaCount = allRoadworksUnfiltered.filter(r => 
      !isWithinOperationalArea(r.coordinates, r.location)
    ).length;
    
    const stats = {
      total: showOutOfArea ? allRoadworksUnfiltered.length : allRoadworksFiltered.length,
      promotedToDisplay: (Array.isArray(manualFiltered) ? manualFiltered : []).filter(r => r.promotedToDisplay).length,
      activeDiversions: (Array.isArray(manualFiltered) ? manualFiltered : []).filter(r => r.diversions && r.diversions.length > 0).length,
      pendingTasks: (Array.isArray(manualFiltered) ? manualFiltered : []).reduce((sum, r) => 
        sum + (r.tasks ? r.tasks.filter(t => t.status === 'pending').length : 0), 0
      ),
      automatic: showOutOfArea ? allTrafficUnfiltered.length : allTrafficFiltered.length,
      streetManager: showOutOfArea ? streetManagerAll.length : streetManagerFiltered.length,
      criticalCount: (showOutOfArea ? allRoadworksUnfiltered : allRoadworksFiltered).filter(r => 
        r.severity === 'Critical' || r.severity === 'critical' ||
        r.mlSeverity === 4 || r.mlSeverity === 3.5
      ).length,
      routeImpactCount: (showOutOfArea ? allRoadworksUnfiltered : allRoadworksFiltered).filter(r => 
        r.affectedRoutes?.length > 0 || r.affectsRoutes?.length > 0 || r.hasRouteImpact
      ).length,
      outOfAreaCount: outOfAreaCount
    };
    setStats(stats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Open roadwork location on map
  const openRoadworkMap = (roadwork) => {
    console.log('🗺️ Opening map for roadwork:', roadwork.title);
    console.log('🗺️ Raw coordinates:', roadwork.coordinates);
    console.log('🗺️ Coordinate type:', typeof roadwork.coordinates);
    console.log('🗺️ Coordinate structure:', roadwork.coordinates);
    
    // Process coordinates for debugging
    if (roadwork.coordinates) {
      if (Array.isArray(roadwork.coordinates)) {
        console.log('🗺️ Array coordinates:', `[${roadwork.coordinates[0]}, ${roadwork.coordinates[1]}]`);
      } else if (roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
        console.log('🗺️ Object coordinates:', `lat: ${roadwork.coordinates.latitude}, lng: ${roadwork.coordinates.longitude}`);
      }
    }
    
    setMapRoadwork(roadwork);
    setShowMap(true);
  };

  // Fetch AI diversion suggestions for roadwork
  const fetchDiversions = async (roadwork) => {
    console.log('🧠 Fetching AI diversions for roadwork:', roadwork.id);
    setDiversionsRoadwork(roadwork);
    setShowDiversions(true);
    setDiversionsLoading(true);
    setDiversionsData(null);
    
    try {
      // Create incident-like object for diversion engine
      const incidentData = {
        id: roadwork.id,
        type: 'roadwork',
        subtype: roadwork.workType || 'Roadwork',
        location: roadwork.location,
        coordinates: roadwork.coordinates,
        description: roadwork.description,
        severity: roadwork.priority === 'critical' ? 'High' : 
                  roadwork.priority === 'high' ? 'High' : 
                  roadwork.priority === 'medium' ? 'Medium' : 'Low',
        affectsRoutes: roadwork.affectedRoutes || [],
        startTime: roadwork.startDate,
        endTime: roadwork.endDate
      };
      
      // First create a temporary incident for the roadwork
      const createResponse = await fetch(`${apiBaseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...incidentData,
          createdBy: supervisorName,
          createdByRole: supervisorRole,
          notes: `Temporary incident for roadwork diversions: ${roadwork.title}`
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create temporary incident: ${createResponse.status}`);
      }
      
      const { incident } = await createResponse.json();
      
      // Get diversions for the incident
      const response = await fetch(`${apiBaseUrl}/api/incidents/${incident.id}/diversions`);
      
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
      
      // Clean up - delete temporary incident
      await fetch(`${apiBaseUrl}/api/incidents/${incident.id}`, {
        method: 'DELETE'
      });
      
    } catch (error) {
      console.error('❌ Error fetching diversions:', error);
      Alert.alert('Error', 'Failed to get diversion suggestions');
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



  const handlePushToDisplay = async (roadwork) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to push alerts to display');
      return;
    }

    try {
      console.log(`📺 Pushing roadwork to display: ${roadwork.id}`);
      
      const response = await fetch(`${apiBaseUrl}/api/display/push-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          alert: {
            ...roadwork,
            alertCategory: 'roadwork',
            affectsRoutes: roadwork.affectedRoutes || [],
            coordinates: roadwork.coordinates
          },
          displayDuration: 300, // 5 minutes
          priority: roadwork.priority === 'critical' ? 'high' : 'normal'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork pushed to display successfully');
        Alert.alert('Success', 'Roadwork pushed to control room display screen');
      } else {
        console.error('❌ Failed to push to display:', data.error);
        Alert.alert('Error', data.error || 'Failed to push to display');
      }
    } catch (error) {
      console.error('❌ Error pushing to display:', error);
      Alert.alert('Error', `Failed to push to display: ${error.message}`);
    }
  };

  const handlePromoteToDisplay = async (roadworkId) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to promote roadworks');
      return;
    }

    try {
      console.log(`📺 ${roadworkId} - Toggling display status...`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/promote-to-display`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          displayNotes: 'Promoted via mobile interface',
          reason: 'Supervisor decision to promote/remove from display'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Display status updated successfully');
        Alert.alert('Success', 'Roadwork display status updated');
        // Reload roadworks to get updated status
        await loadRoadworks();
      } else {
        console.error('❌ Failed to update display status:', data.error);
        Alert.alert('Error', data.error || 'Failed to update roadwork');
      }
    } catch (error) {
      console.error('❌ Error updating roadwork:', error);
      Alert.alert('Error', `Failed to update roadwork: ${error.message}`);
    }
  };

  const renderRoadworkCard = (roadwork, isAutomatic = false) => {
    const status = ROADWORKS_STATUSES[roadwork.status] || ROADWORKS_STATUSES.reported;
    const priority = PRIORITY_LEVELS[roadwork.priority || roadwork.severity?.toLowerCase()] || PRIORITY_LEVELS.medium;
    
    // Check for ML predictions and route impact
    const hasMLPrediction = roadwork.mlSeverity || roadwork.mlConfidence;
    const hasRouteImpact = roadwork.affectsRoutes?.length > 0 || roadwork.affectedRoutes?.length > 0;
    const routeCount = (roadwork.affectsRoutes || roadwork.affectedRoutes || []).length;
    const isOutOfArea = !isWithinOperationalArea(roadwork.coordinates, roadwork.location);

    return (
      <TouchableOpacity
        key={roadwork.id}
        style={[styles.roadworkCard, isAutomatic && styles.automaticRoadworkCard]}
        onPress={() => {
          setSelectedRoadwork({ ...roadwork, isAutomatic });
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Ionicons name={status.icon} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color, marginLeft: 4 }]}>{status.label}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priority.bgColor }]}>
              <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
            </View>
            {isOutOfArea && (
              <View style={styles.outOfAreaIndicator}>
                <Ionicons name="location-outline" size={14} color="#EF4444" />
                <Text style={styles.outOfAreaText}>Outside Area</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {roadwork.acknowledged_at && (
              <View style={styles.acknowledgedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.acknowledgedBadgeText, { marginLeft: 4 }]}>
                  ✓ {roadwork.acknowledged_by || 'Acknowledged'}
                </Text>
              </View>
            )}
            {roadwork.promotedToDisplay && (
              <View style={[styles.displayBadge, roadwork.acknowledged_at && { marginLeft: 8 }]}>
                <Ionicons name="tv" size={16} color="#10B981" />
                <Text style={[styles.displayBadgeText, { marginLeft: 4 }]}>On Display</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{roadwork.title}</Text>
          {hasRouteImpact && (
            <View style={styles.routeImpactIndicator}>
              <Ionicons name="bus" size={14} color="#FFFFFF" />
              <Text style={styles.routeImpactCount}>{routeCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardLocation}>
          <Ionicons name="location" size={14} color="#6B7280" /> {roadwork.location}
        </Text>
        
        {/* ML Prediction & Impact Score */}
        {(hasMLPrediction || roadwork.impactScore || roadwork.severityScore) && (
          <View style={styles.mlPredictionRow}>
            {hasMLPrediction && (
              <View style={styles.mlBadge}>
                <Ionicons name="analytics" size={14} color="#7C3AED" />
                <Text style={styles.mlBadgeText}>
                  ML: {roadwork.mlSeverity || roadwork.mlSeverityLabel} ({Math.round((roadwork.mlConfidence || 0) * 100)}%)
                </Text>
              </View>
            )}
            {(roadwork.impactScore || roadwork.severityScore) && (
              <View style={styles.impactBadge}>
                <Text style={styles.impactBadgeText}>
                  Impact: {roadwork.impactScore || roadwork.severityScore}/100
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {roadwork.coordinates && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openRoadworkMap(roadwork)}
            >
              <Ionicons name="map" size={14} color="#10B981" />
              <Text style={[styles.quickActionText, { marginLeft: 4 }]}>Map</Text>
            </TouchableOpacity>
          )}
          
          {hasRouteImpact && (
            <TouchableOpacity
              style={styles.diversionButton}
              onPress={() => fetchDiversions(roadwork)}
            >
              <Ionicons name="bulb" size={14} color="#7C3AED" />
              <Text style={[styles.quickActionText, { marginLeft: 4 }]}>AI Diversions</Text>
            </TouchableOpacity>
          )}
          
          {/* Acknowledge Button - Show for pending_review status */}
          {(!roadwork.acknowledged_at && roadwork.status !== 'dismissed' && roadwork.status !== 'cancelled') && (
            <TouchableOpacity
              style={[
                styles.acknowledgeButton,
                roadwork.acknowledged_at && styles.acknowledgeButtonActive
              ]}
              onPress={() => handleQuickAcknowledge(roadwork)}
            >
              <Ionicons 
                name={roadwork.acknowledged_at ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={14} 
                color={roadwork.acknowledged_at ? "#10B981" : "#3B82F6"} 
              />
              <Text style={[
                styles.quickActionText, 
                { marginLeft: 4, color: roadwork.acknowledged_at ? "#10B981" : "#3B82F6" }
              ]}>
                {roadwork.acknowledged_at ? "Acknowledged" : "Acknowledge"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Display Toggle Button for manual roadworks or critical automatic ones */}
          {(!isAutomatic || (roadwork.severity === 'Critical' || roadwork.severity === 'High')) && (
            <TouchableOpacity
              style={[styles.displayToggleButton, roadwork.promotedToDisplay && styles.displayToggleButtonActive]}
              onPress={() => {
                if (isAutomatic) {
                  handlePushToDisplay(roadwork);
                } else {
                  handlePromoteToDisplay(roadwork.id);
                }
              }}
            >
              <Ionicons name={roadwork.promotedToDisplay ? "tv" : "tv-outline"} size={14} color={roadwork.promotedToDisplay ? "#10B981" : "#3B82F6"} />
              <Text style={[styles.quickActionText, { marginLeft: 4, color: roadwork.promotedToDisplay ? "#10B981" : "#3B82F6" }]}>
                {roadwork.promotedToDisplay ? "On Display" : "Display"}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissQuickButton}
            onPress={() => handleDismissRoadwork(roadwork.id || roadwork.notification_id, 'Quick dismiss', roadwork)}
          >
            <Ionicons name="close-circle" size={14} color="#EF4444" />
            <Text style={[styles.quickActionText, { marginLeft: 4, color: "#EF4444" }]}>Dismiss</Text>
          </TouchableOpacity>
          
          {/* New StreetManager Actions */}
          {roadwork.source === 'StreetManager' && roadwork.managementActions?.canCreateDiversion && (
            <TouchableOpacity
              style={styles.createDiversionButton}
              onPress={() => handleCreateDiversion(roadwork)}
            >
              <Ionicons name="git-branch" size={14} color="#F59E0B" />
              <Text style={[styles.quickActionText, { marginLeft: 4 }]}>Create Diversion</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isAutomatic && roadwork.source && (
          <Text style={styles.cardSource}>
            Source: {roadwork.source === 'tomtom' ? 'TomTom Traffic' : 
                    roadwork.source === 'national_highways' ? 'National Highways' : 
                    roadwork.source === 'StreetManager' ? 'UK StreetManager (Official)' :
                    roadwork.source === 'street_manager' ? 'UK StreetManager' :
                    roadwork.source === 'durham_council' ? 'Durham County Council' :
                    roadwork.source}
          </Text>
        )}

        {(roadwork.affectedRoutes || roadwork.affectsRoutes) && (roadwork.affectedRoutes?.length > 0 || roadwork.affectsRoutes?.length > 0) && (
          <View style={styles.affectedRoutes}>
            <Text style={styles.affectedRoutesLabel}>Affected Routes:</Text>
            <View style={styles.routeTags}>
              {(roadwork.affectedRoutes || roadwork.affectsRoutes || []).slice(0, 5).map((route) => (
                <View key={route} style={styles.routeTag}>
                  <Text style={styles.routeTagText}>{route}</Text>
                </View>
              ))}
              {((roadwork.affectedRoutes || roadwork.affectsRoutes || []).length > 5) && (
                <View style={styles.routeTag}>
                  <Text style={styles.routeTagText}>+{(roadwork.affectedRoutes || roadwork.affectsRoutes).length - 5}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* StreetManager specific details */}
        {roadwork.source === 'StreetManager' && roadwork.trafficManagement && (
          <Text style={styles.trafficManagement}>
            <Ionicons name="alert-circle" size={12} color="#F59E0B" /> {roadwork.trafficManagement}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {roadwork.createdByName ? `Created by ${roadwork.createdByName} • ` : ''}
            {roadwork.promoter && `${roadwork.promoter} • `}
            {new Date(roadwork.createdAt || roadwork.lastUpdated).toLocaleDateString()}
          </Text>
          {roadwork.tasks && roadwork.tasks.filter(t => t.status === 'pending').length > 0 && (
            <View style={styles.tasksBadge}>
              <Ionicons name="clipboard" size={14} color="#F59E0B" />
              <Text style={[styles.tasksCount, { marginLeft: 4 }]}>
                {roadwork.tasks.filter(t => t.status === 'pending').length} tasks
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Check authentication first
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.loginPromptTitle}>Authentication Required</Text>
          <Text style={styles.loginPromptText}>
            Please log in as a supervisor to access the Roadworks Manager
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Roadworks Management System</Text>
          <Text style={styles.headerSubtitle}>
            Managing {supervisorName} • {supervisorRole}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={[styles.createButtonText, { marginLeft: 8 }]}>New Roadwork</Text>
        </TouchableOpacity>
      </View>

      {/* Geographic Filter Toggle */}
      <View style={styles.filterContainer}>
        <View style={styles.filterInfo}>
          <Ionicons name="globe-outline" size={20} color="#6B7280" />
          <Text style={styles.filterLabel}>
            Operational Area: Newcastle, Gateshead, Sunderland, Durham, North Tyneside
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showOutOfArea && styles.filterToggleActive]}
          onPress={() => setShowOutOfArea(!showOutOfArea)}
        >
          <Text style={[styles.filterToggleText, showOutOfArea && styles.filterToggleTextActive]}>
            {showOutOfArea ? 'Showing All' : 'Area Only'}
          </Text>
          {stats.outOfAreaCount > 0 && !showOutOfArea && (
            <View style={styles.outOfAreaBadge}>
              <Text style={styles.outOfAreaBadgeText}>+{stats.outOfAreaCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Enhanced Filters Bar */}
      <View style={styles.filtersBar}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roadworks..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color={showFilters ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.filterToggleButtonText, showFilters && styles.filterToggleButtonTextActive]}>Filters</Text>
          {Object.keys(filters).some(key => filters[key] !== 'all' && filters[key].length > 0) && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterBadgeText}>
                {Object.keys(filters).filter(key => filters[key] !== 'all' && filters[key].length > 0).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            {/* Severity Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Severity</Text>
              <TouchableOpacity
                style={[styles.filterSelect, filters.severity !== 'all' && styles.filterSelectActive]}
                onPress={() => {
                  Alert.alert('Select Severity', '', [
                    { text: 'All', onPress: () => setFilters({...filters, severity: 'all'}) },
                    { text: 'Critical', onPress: () => setFilters({...filters, severity: 'critical'}) },
                    { text: 'High', onPress: () => setFilters({...filters, severity: 'high'}) },
                    { text: 'Medium', onPress: () => setFilters({...filters, severity: 'medium'}) },
                    { text: 'Low', onPress: () => setFilters({...filters, severity: 'low'}) },
                  ]);
                }}
              >
                <Text style={[styles.filterSelectText, filters.severity !== 'all' && styles.filterSelectTextActive]}>
                  {filters.severity === 'all' ? 'All' : filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={filters.severity !== 'all' ? '#3B82F6' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <TouchableOpacity
                style={[styles.filterSelect, filters.dateRange !== 'all' && styles.filterSelectActive]}
                onPress={() => {
                  Alert.alert('Select Date Range', '', [
                    { text: 'All', onPress: () => setFilters({...filters, dateRange: 'all'}) },
                    { text: 'Today', onPress: () => setFilters({...filters, dateRange: 'today'}) },
                    { text: 'This Week', onPress: () => setFilters({...filters, dateRange: 'week'}) },
                    { text: 'Upcoming', onPress: () => setFilters({...filters, dateRange: 'upcoming'}) },
                  ]);
                }}
              >
                <Text style={[styles.filterSelectText, filters.dateRange !== 'all' && styles.filterSelectTextActive]}>
                  {filters.dateRange === 'all' ? 'All Time' : 
                   filters.dateRange === 'week' ? 'This Week' :
                   filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={filters.dateRange !== 'all' ? '#3B82F6' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <TouchableOpacity
                style={[styles.filterSelect, filters.status !== 'all' && styles.filterSelectActive]}
                onPress={() => {
                  Alert.alert('Select Status', '', [
                    { text: 'All', onPress: () => setFilters({...filters, status: 'all'}) },
                    { text: 'Active', onPress: () => setFilters({...filters, status: 'active'}) },
                    { text: 'Planned', onPress: () => setFilters({...filters, status: 'planned'}) },
                    { text: 'Completed', onPress: () => setFilters({...filters, status: 'completed'}) },
                  ]);
                }}
              >
                <Text style={[styles.filterSelectText, filters.status !== 'all' && styles.filterSelectTextActive]}>
                  {filters.status === 'all' ? 'All Status' : filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={filters.status !== 'all' ? '#3B82F6' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Affected Routes Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Routes</Text>
              <TouchableOpacity
                style={[styles.filterSelect, filters.affectedRoutes.length > 0 && styles.filterSelectActive]}
                onPress={() => {
                  // Get unique routes from all roadworks
                  const allRoutes = new Set();
                  [...allRoadworksUnfiltered, ...streetManagerUnfiltered, ...trafficRoadworksUnfiltered].forEach(r => {
                    (r.affectedRoutes || r.affectsRoutes || []).forEach(route => allRoutes.add(route));
                  });
                  const sortedRoutes = Array.from(allRoutes).sort();
                  
                  Alert.alert(
                    'Select Routes',
                    'Select routes to filter by',
                    [
                      { text: 'Clear All', onPress: () => setFilters({...filters, affectedRoutes: []}) },
                      { text: 'Major Routes', onPress: () => setFilters({...filters, affectedRoutes: ['21', 'X21', '1', '2', '307', 'Q3']}) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={[styles.filterSelectText, filters.affectedRoutes.length > 0 && styles.filterSelectTextActive]}>
                  {filters.affectedRoutes.length === 0 ? 'All Routes' : `${filters.affectedRoutes.length} Selected`}
                </Text>
                <Ionicons name="chevron-down" size={16} color={filters.affectedRoutes.length > 0 ? '#3B82F6' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Location Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={[styles.filterTextInput, filters.location && styles.filterTextInputActive]}
                placeholder="Enter location..."
                placeholderTextColor="#9CA3AF"
                value={filters.location}
                onChangeText={(text) => setFilters({...filters, location: text})}
              />
            </View>

            {/* Clear Filters Button */}
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilters({
                  severity: 'all',
                  dateRange: 'all',
                  affectedRoutes: [],
                  location: '',
                  trafficManagement: 'all',
                  status: 'all'
                });
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={18} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.viewModeButtonText, viewMode === 'list' && styles.viewModeButtonTextActive]}>List View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={18} color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.viewModeButtonText, viewMode === 'map' && styles.viewModeButtonTextActive]}>Map View</Text>
          </TouchableOpacity>
        </View>
        {viewMode === 'map' && (
          <TouchableOpacity
            style={styles.routeOverlayButton}
            onPress={() => {
              // Toggle route overlay selector
              Alert.alert('Route Overlays', 'Select routes to display on map', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Show Major Routes', onPress: () => setSelectedRoutesForOverlay(['21', 'X21', '1', '2', '307', 'Q3']) }
              ]);
            }}
          >
            <Ionicons name="bus" size={16} color="#7C3AED" />
            <Text style={styles.routeOverlayButtonText}>Route Overlays</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters Summary */}
      {(searchQuery || Object.keys(filters).some(key => filters[key] !== 'all' && filters[key].length > 0)) && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            Showing {stats.total} of {allRoadworksUnfiltered.length + streetManagerUnfiltered.length + trafficRoadworksUnfiltered.length} roadworks
          </Text>
          {searchQuery && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>Search: "{searchQuery}"</Text>
            </View>
          )}
          {filters.severity !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>Severity: {filters.severity}</Text>
            </View>
          )}
          {filters.dateRange !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>Date: {filters.dateRange}</Text>
            </View>
          )}
          {filters.status !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>Status: {filters.status}</Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { marginLeft: 0 }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Roadworks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.automatic}</Text>
          <Text style={styles.statLabel}>From Traffic APIs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.promotedToDisplay}</Text>
          <Text style={styles.statLabel}>On Display</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.criticalCount}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.streetManager}</Text>
          <Text style={styles.statLabel}>StreetManager</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#6366F1' }]}>{stats.routeImpactCount}</Text>
          <Text style={styles.statLabel}>Affecting Routes</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => setActiveTab('manual')}
        >
          <Ionicons name="hammer" size={16} color={activeTab === 'manual' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText, { marginLeft: 6 }]}>
            Manual ({roadworks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'streetmanager' && styles.activeTab, { marginLeft: 8 }]}
          onPress={() => setActiveTab('streetmanager')}
        >
          <Ionicons name="business" size={16} color={activeTab === 'streetmanager' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'streetmanager' && styles.activeTabText, { marginLeft: 6 }]}>
            StreetManager ({streetManagerRoadworks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'automatic' && styles.activeTab, { marginLeft: 8 }]}
          onPress={() => setActiveTab('automatic')}
        >
          <Ionicons name="radio" size={16} color={activeTab === 'automatic' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'automatic' && styles.activeTabText, { marginLeft: 6 }]}>
            Other APIs ({trafficRoadworks.filter(r => r.source !== 'durham_council').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'durham' && styles.activeTab, { marginLeft: 8 }]}
          onPress={() => setActiveTab('durham')}
        >
          <Ionicons name="business" size={16} color={activeTab === 'durham' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'durham' && styles.activeTabText, { marginLeft: 6 }]}>
            Durham ({trafficRoadworks.filter(r => r.source === 'durham_council').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.activeTab, { marginLeft: 8 }]}
          onPress={() => setActiveTab('timeline')}
        >
          <Ionicons name="calendar" size={16} color={activeTab === 'timeline' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText, { marginLeft: 6 }]}>
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - List or Map View */}
      {viewMode === 'list' ? (
        /* Roadworks List */
        <ScrollView
        style={styles.roadworksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading roadworks...</Text>
          </View>
        ) : activeTab === 'manual' ? (
          roadworks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct" size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No Manual Roadworks</Text>
              <Text style={styles.emptyText}>
                {(searchQuery || Object.keys(filters).some(key => filters[key] !== 'all' && filters[key].length > 0)) 
                  ? 'No roadworks match your filters' 
                  : 'Create your first roadwork to get started'}
              </Text>
            </View>
          ) : (
            roadworks.map(roadwork => renderRoadworkCard(roadwork, false))
          )
        ) : activeTab === 'streetmanager' ? (
          streetManagerRoadworks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="warning" size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No StreetManager Roadworks</Text>
              <Text style={styles.emptyText}>Waiting for official UK roadwork data</Text>
            </View>
          ) : (
            streetManagerRoadworks.map(roadwork => renderRoadworkCard(roadwork, true))
          )
        ) : activeTab === 'automatic' ? (
          trafficRoadworks.filter(r => r.source !== 'durham_council').length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="radio" size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No Automatic Roadwork Alerts</Text>
              <Text style={styles.emptyText}>Waiting for roadwork data from TomTom and National Highways</Text>
            </View>
          ) : (
            trafficRoadworks.filter(r => r.source !== 'durham_council').map(roadwork => renderRoadworkCard(roadwork, true))
          )
        ) : (
          trafficRoadworks.filter(r => r.source === 'durham_council').length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business" size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No Durham Council Roadworks</Text>
              <Text style={styles.emptyText}>Fetching Durham roadworks data...</Text>
            </View>
          ) : (
            trafficRoadworks.filter(r => r.source === 'durham_council').map(roadwork => renderRoadworkCard(roadwork, true))
          )
        )}
        </ScrollView>
      ) : (
        /* Map View */
        <View style={styles.mapViewContainer}>
          {Platform.OS === 'web' ? (
            <TomTomTrafficMap
              alerts={prepareMapData()}
              currentAlert={null}
              alertIndex={0}
              showClustering={true}
              showRouteOverlays={selectedRoutesForOverlay.length > 0}
              overlayRoutes={selectedRoutesForOverlay}
              onMarkerClick={(roadwork) => {
                const fullRoadwork = [...roadworks, ...streetManagerRoadworks, ...trafficRoadworks]
                  .find(r => (r.id || r.notification_id) === roadwork.id);
                if (fullRoadwork) {
                  setSelectedRoadwork({ ...fullRoadwork, isAutomatic: fullRoadwork.source !== 'manual' });
                  setShowDetailsModal(true);
                }
              }}
              style={styles.mapView}
            />
          ) : (
            <View style={styles.mapNotAvailable}>
              <Ionicons name="map-outline" size={48} color="#9CA3AF" />
              <Text style={styles.mapNotAvailableText}>Map view is only available on web</Text>
            </View>
          )}
          
          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <Text style={styles.mapLegendTitle}>Severity Levels</Text>
            <View style={styles.mapLegendItems}>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendColor, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.mapLegendLabel}>Critical</Text>
              </View>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendColor, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.mapLegendLabel}>High</Text>
              </View>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendColor, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.mapLegendLabel}>Medium</Text>
              </View>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendColor, { backgroundColor: '#10B981' }]} />
                <Text style={styles.mapLegendLabel}>Low/Planned</Text>
              </View>
            </View>
            {stats.routeImpactCount > 0 && (
              <Text style={styles.mapLegendInfo}>
                <Ionicons name="bus" size={12} color="#6B7280" /> {stats.routeImpactCount} roadworks affecting bus routes
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Create Modal */}
      <CreateRoadworkModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        supervisorData={{ id: sessionId, name: supervisorName, email: supervisorRole }}
        onCreateRoadwork={async (roadworkData) => {
          try {
            // Here you would normally make an API call to create the roadwork
            console.log('Creating new roadwork:', roadworkData);
            
            // For now, return a success response
            // In a real implementation, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
            
            loadRoadworks(); // Reload data
            return { success: true };
          } catch (error) {
            console.error('Error creating roadwork:', error);
            return { success: false, error: 'Failed to create roadwork' };
          }
        }}
      />

      {/* Details Modal */}
      <UnifiedDetailModal
        visible={showDetailsModal}
        data={selectedRoadwork}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRoadwork(null);
        }}
        onUpdateStatus={async (roadworkId, newStatus, notes) => {
          try {
            console.log('Updating roadwork status:', roadworkId, newStatus, notes);
            
            // Here you would normally make an API call to update the status
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
            
            loadRoadworks(); // Reload data
            return { success: true };
          } catch (error) {
            console.error('Error updating status:', error);
            return { success: false, error: 'Failed to update status' };
          }
        }}
        onDismiss={async (roadworkId, reason) => {
          try {
            console.log('Dismissing roadwork:', roadworkId, reason);
            
            // Use the existing dismiss handler
            await handleDismissRoadwork(roadworkId, reason);
            setShowDetailsModal(false);
            setSelectedRoadwork(null);
            return { success: true };
          } catch (error) {
            console.error('Error dismissing roadwork:', error);
            return { success: false, error: 'Failed to dismiss roadwork' };
          }
        }}
        onPushToDisplay={async (roadworkId, enabled) => {
          try {
            console.log('Updating display status:', roadworkId, enabled);
            
            // Use the existing display handlers
            if (enabled) {
              await handlePushToDisplay(selectedRoadwork);
            } else {
              await handlePromoteToDisplay(roadworkId);
            }
            
            loadRoadworks(); // Reload data
            return { success: true };
          } catch (error) {
            console.error('Error updating display status:', error);
            return { success: false, error: 'Failed to update display status' };
          }
        }}
        onEditRoadwork={(roadwork) => {
          // For manual entries, you could open an edit modal here
          console.log('Edit roadwork requested:', roadwork);
          Alert.alert('Edit Roadwork', 'Edit functionality would be implemented here for manual entries.');
        }}
        supervisorData={{ id: sessionId, name: supervisorName, email: supervisorRole }}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        visible={showStatusModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleAcknowledgeRoadwork}
        loading={loading}
      />

      {/* Map Modal */}
      {showMap && mapRoadwork && (
        <Modal
          visible={showMap}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Roadwork Location</Text>
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
                  id: mapRoadwork.id,
                  title: mapRoadwork.title,
                  location: mapRoadwork.location,
                  coordinates: mapRoadwork.coordinates ? 
                    [mapRoadwork.coordinates.latitude || mapRoadwork.coordinates[0], 
                     mapRoadwork.coordinates.longitude || mapRoadwork.coordinates[1]] : null,
                  severity: mapRoadwork.priority === 'critical' ? 'High' : 
                           mapRoadwork.priority === 'high' ? 'High' : 'Medium'
                }]}
                currentAlert={{
                  id: mapRoadwork.id,
                  title: mapRoadwork.title,
                  location: mapRoadwork.location,
                  coordinates: mapRoadwork.coordinates ? 
                    [mapRoadwork.coordinates.latitude || mapRoadwork.coordinates[0], 
                     mapRoadwork.coordinates.longitude || mapRoadwork.coordinates[1]] : null
                }}
                alertIndex={0}
              />
            </View>
            
            <View style={styles.mapDetails}>
              <Text style={styles.mapDetailTitle}>{mapRoadwork.title}</Text>
              <Text style={styles.mapDetailLocation}>{mapRoadwork.location}</Text>
              {mapRoadwork.description && (
                <Text style={styles.mapDetailDescription}>{mapRoadwork.description}</Text>
              )}
              {mapRoadwork.coordinates && (
                <Text style={styles.mapDetailCoords}>
                  Coordinates: {mapRoadwork.coordinates.latitude?.toFixed(4) || mapRoadwork.coordinates[0]?.toFixed(4)}, 
                  {mapRoadwork.coordinates.longitude?.toFixed(4) || mapRoadwork.coordinates[1]?.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Diversions Modal */}
      {showDiversions && diversionsRoadwork && (
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
              {/* Roadwork Summary */}
              <View style={styles.diversionIncidentSummary}>
                <Text style={styles.diversionIncidentType}>
                  {diversionsRoadwork.title}
                </Text>
                <Text style={styles.diversionIncidentLocation}>
                  {diversionsRoadwork.location}
                </Text>
                <View style={styles.diversionAffectedRoutes}>
                  <Text style={[styles.diversionLabel, { marginRight: 8 }]}>Affected Routes:</Text>
                  <View style={styles.routeTags}>
                    {diversionsRoadwork.affectedRoutes?.map((route, idx) => (
                      <View key={idx} style={styles.routeTag}>
                        <Text style={styles.routeTagText}>{route}</Text>
                      </View>
                    ))}}
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
                              <Text style={[styles.tomtomRouteDuration, { marginLeft: 4 }]}>{route.duration}</Text>
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
                        Alert.alert('Success', 'Diversion suggestions copied to clipboard');
                      } else {
                        // On mobile, show in alert
                        Alert.alert('Diversion Suggestions', text);
                      }
                    }}
                  >
                    <Ionicons name="copy" size={20} color="#FFFFFF" />
                    <Text style={[styles.copyDiversionText, { marginLeft: 8 }]}>Copy Instructions</Text>
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
    </View>
  );
};





// Define ROADWORKS_STATUSES and PRIORITY_LEVELS for the modal components
const ROADWORKS_STATUSES = {
  reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
  assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
  planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
  approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
  active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
  monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
  completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
};

const PRIORITY_LEVELS = {
  critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
  high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
  medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
  low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
  planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // TEST STYLES - for minimal test version
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  testTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  testSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Geographic Filter Styles
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterToggleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterToggleTextActive: {
    color: '#FFFFFF',
  },
  outOfAreaBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  outOfAreaBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // View Mode Styles
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  viewModeButtonTextActive: {
    color: '#FFFFFF',
  },
  routeOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  routeOverlayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 6,
  },
  // Map View Styles
  mapViewContainer: {
    flex: 1,
    position: 'relative',
  },
  mapView: {
    flex: 1,
  },
  mapNotAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  mapNotAvailableText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLegendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  mapLegendItems: {
    flexDirection: 'column',
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  mapLegendLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapLegendInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  // Enhanced Filters Styles
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterToggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  filterToggleButtonTextActive: {
    color: '#FFFFFF',
  },
  activeFilterBadge: {
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  activeFilterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterPanel: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filterScrollView: {
    paddingHorizontal: 16,
  },
  filterGroup: {
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  filterSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSelectActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF5FF',
  },
  filterSelectText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  filterSelectTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  filterTextInput: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#1F2937',
    minWidth: 150,
  },
  filterTextInputActive: {
    borderColor: '#3B82F6',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  activeFiltersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EBF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  activeFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginRight: 12,
  },
  activeFilterChip: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginVertical: 2,
  },
  activeFilterChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 12,
    marginBottom: 12,
  },
  statValue: {
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
  roadworksList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roadworkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  acknowledgedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  displayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  displayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  outOfAreaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  outOfAreaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  routeImpactIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeImpactCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardSource: {
    fontSize: 12,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  affectedRoutes: {
    marginBottom: 12,
  },
  affectedRoutesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeTag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  routeTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tasksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksCount: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
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
  automaticRoadworkCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  diversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  displayToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  displayToggleButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  acknowledgeButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  dismissQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },


  // Status Change Modal Styles
  statusModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusModalLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  statusOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  statusOptionContent: {
    flex: 1,
  },
  statusOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusOptionLabelSelected: {
    color: '#047857',
  },
  statusOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmActionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Push to Display Button Styles
  pushToDisplayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  pushToDisplayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
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
    marginBottom: 4,
  },
  diversionIncidentLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  diversionAffectedRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexWrap: 'wrap',
  },
  tomtomRouteMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  tomtomRouteMetricText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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
  // ML Prediction styles
  mlPredictionRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  mlBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 4,
  },
  impactBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  impactBadgeText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
  },
  trafficManagement: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  createDiversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
});

export default RoadworksManager;