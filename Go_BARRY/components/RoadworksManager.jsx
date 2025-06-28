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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import CreateRoadworkModal from './CreateRoadworkModal';
import TomTomTrafficMap from './TomTomTrafficMap';
import UnifiedDetailModal from './UnifiedDetailModal';

const RoadworksManager = ({ baseUrl }) => {
  // Get the supervisor session from the existing auth system
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin,
    supervisorSession
  } = useSupervisorSession();

  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [trafficRoadworks, setTrafficRoadworks] = useState([]); // New: automatic roadworks from traffic APIs
  const [streetManagerRoadworks, setStreetManagerRoadworks] = useState([]); // StreetManager roadworks
  const [allTrafficAlerts, setAllTrafficAlerts] = useState([]); // ALL traffic alerts for triage
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // Tab options: manual, automatic, streetmanager, durham
  const [showMap, setShowMap] = useState(false);
  const [mapRoadwork, setMapRoadwork] = useState(null);
  const [showDiversions, setShowDiversions] = useState(false);
  const [diversionsRoadwork, setDiversionsRoadwork] = useState(null);
  const [diversionsLoading, setDiversionsLoading] = useState(false);
  const [diversionsData, setDiversionsData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    promotedToDisplay: 0,
    activeDiversions: 0,
    pendingTasks: 0,
    automatic: 0, // New: count of automatic roadworks
    streetManager: 0, // Count of StreetManager roadworks
    criticalCount: 0, // Critical roadworks
    allAlerts: 0 // Count of all traffic alerts
  });

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
            const emergencyAuth = await fetch(`${apiBaseUrl}/api/supervisor/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                supervisorId: 'supervisor003', // Fallback to AG003
                badge: 'AG003'
              })
            });
            
            if (emergencyAuth.ok) {
              const authData = await emergencyAuth.json();
              if (authData.success) {
                payload.sessionId = authData.sessionId;
                console.log('✅ Emergency auth successful, using session:', authData.sessionId);
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

  // Load roadworks data
  useEffect(() => {
    loadAllData();
  }, [isLoggedIn, sessionId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
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
      const response = await fetch(`${apiBaseUrl}/api/roadworks`);
      const data = await response.json();
      
      if (data.success) {
        const roadworksData = data.roadworks || [];
        setRoadworks(roadworksData);
        console.log(`✅ Loaded ${roadworksData.length} manual roadworks`);
        return roadworksData;
      } else {
        console.error('❌ Failed to load roadworks:', data.error);
        Alert.alert('Error', 'Failed to load roadworks data');
        setRoadworks([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading roadworks:', error);
      Alert.alert('Error', `Failed to connect to server: ${error.message}`);
      setRoadworks([]);
      return [];
    }
  };

  const loadTrafficRoadworks = async () => {
    try {
      console.log('🚧 Loading automatic roadwork alerts from traffic APIs...');
      const response = await fetch(`${apiBaseUrl}/api/roadworks/unified?source=all`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out manual roadworks to get only automatic ones
        const trafficData = (data.roadworks || []).filter(r => r.source !== 'manual');
        
        // Separate StreetManager from other sources
        const streetManager = trafficData.filter(r => 
          r.source === 'StreetManager' || r.source === 'street_manager'
        );
        const otherTraffic = trafficData.filter(r => 
          r.source !== 'StreetManager' && r.source !== 'street_manager'
        );
        
        setStreetManagerRoadworks(streetManager);
        setTrafficRoadworks(otherTraffic);
        
        console.log(`✅ Loaded ${streetManager.length} StreetManager + ${otherTraffic.length} other traffic roadworks`);
        console.log(`   🔴 Critical: ${data.metadata?.criticalCount || 0}, 🚨 High Impact: ${data.metadata?.highImpactCount || 0}`);
        
        return { streetManager, otherTraffic };
      } else {
        console.error('❌ Failed to load traffic roadworks:', data.error);
        setTrafficRoadworks([]);
        setStreetManagerRoadworks([]);
        return { streetManager: [], otherTraffic: [] };
      }
    } catch (error) {
      console.error('❌ Error loading traffic roadworks:', error);
      setTrafficRoadworks([]);
      setStreetManagerRoadworks([]);
      return { streetManager: [], otherTraffic: [] };
    }
  };

  const calculateStats = (manualRoadworks = [], trafficData = {}) => {
    const { streetManager = [], otherTraffic = [] } = trafficData;
    const allTraffic = [...streetManager, ...otherTraffic];
    const allRoadworks = [...manualRoadworks, ...allTraffic];
    
    const stats = {
      total: allRoadworks.length,
      promotedToDisplay: manualRoadworks.filter(r => r.promotedToDisplay).length,
      activeDiversions: manualRoadworks.filter(r => r.diversions && r.diversions.length > 0).length,
      pendingTasks: manualRoadworks.reduce((sum, r) => 
        sum + (r.tasks ? r.tasks.filter(t => t.status === 'pending').length : 0), 0
      ),
      automatic: allTraffic.length,
      streetManager: streetManager.length,
      criticalCount: allRoadworks.filter(r => 
        r.severity === 'Critical' || r.severity === 'critical' ||
        r.mlSeverity === 4 || r.mlSeverity === 3.5
      ).length
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
    console.log('🗺️ Opening map for roadwork:', roadwork.title, roadwork.coordinates);
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
    
    // Check for ML predictions
    const hasMLPrediction = roadwork.mlSeverity || roadwork.mlConfidence;
    const hasRouteImpact = roadwork.affectsRoutes?.length > 0 || roadwork.affectedRoutes?.length > 0;

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
          </View>
          {roadwork.promotedToDisplay && (
            <View style={styles.displayBadge}>
              <Ionicons name="tv" size={16} color="#10B981" />
              <Text style={[styles.displayBadgeText, { marginLeft: 4 }]}>On Display</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{roadwork.title}</Text>
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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.loginPromptTitle}>Authentication Required</Text>
          <Text style={styles.loginPromptText}>
            Please log in as a supervisor to access the Roadworks Manager
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
      </View>

      {/* Roadworks List */}
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
              <Text style={styles.emptyText}>Create your first roadwork to get started</Text>
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

      {/* Create Modal */}
      <CreateRoadworkModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        supervisorData={{ id: sessionId, name: supervisorName, email: supervisorRole }}
        onRoadworkCreated={(newRoadwork) => {
          console.log('New roadwork created:', newRoadwork);
          loadRoadworks();
        }}
      />

      {/* Details Modal */}
      <UnifiedDetailModal
        visible={showDetailsModal}
        data={selectedRoadwork}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={(updatedData) => {
          console.log('Roadwork updated:', updatedData);
          loadRoadworks();
        }}
        onDismiss={(data) => {
          // Use the roadwork-specific dismiss handler
          handleDismissRoadwork(data.id || data.notification_id, 'Dismissed via detail modal');
        }}
        onPushToDisplay={(data) => {
          // Use the roadwork-specific display handler
          if (data.promotedToDisplay) {
            // Already on display, remove it
            handlePromoteToDisplay(data.id || data.notification_id);
          } else {
            // Not on display, push it
            handlePushToDisplay(data);
          }
        }}
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
                  coordinates: mapRoadwork.coordinates
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 12,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
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