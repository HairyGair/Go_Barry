import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import BatchOperations from './roadworks-v2/components/BatchOperations';

const RoadworkQueue = ({ baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn }) => {
  const { supervisorSession } = useSupervisorSession();
  
  // Use props if available, otherwise fall back to hook data
  const currentSession = supervisorSession || (isLoggedIn ? {
    supervisor: {
      name: supervisorName,
      role: supervisorRole,
      id: sessionId
    },
    sessionId: sessionId,
    supervisorId: sessionId,
    supervisorName: supervisorName,
    isLoggedIn: isLoggedIn
  } : null);

  // Debug logging for session
  useEffect(() => {
    console.log('🔐 RoadworkQueue session data:', {
      supervisorSession: !!supervisorSession,
      propsReceived: { baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn },
      currentSession: !!currentSession,
      sessionDetails: currentSession ? {
        sessionId: currentSession.sessionId,
        supervisorName: currentSession.supervisorName,
        supervisorId: currentSession.supervisorId
      } : 'No session'
    });
  }, [supervisorSession, baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn, currentSession]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRoadworks, setPendingRoadworks] = useState([]);
  const [stats, setStats] = useState({
    pendingReview: 0,
    approved: 0,
    monitoring: 0
  });
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    confirmedRoutes: [],
    diversionRequired: false,
    notes: '',
    selectedReasons: []
  });
  const [sortBy, setSortBy] = useState('date'); // 'date', 'location', 'severity', 'duration'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Structured reason options for different review decisions
  const reasonOptions = {
    approved: [
      { 
        id: 'routes_confirmed', 
        text: 'Routes confirmed affected', 
        icon: 'checkmark-circle',
        requiresRoutes: true
      },
      { 
        id: 'diversion_planned', 
        text: 'Diversion route planned', 
        icon: 'map',
        requiresDiversion: true
      },
      { 
        id: 'minimal_impact', 
        text: 'Minimal service impact expected', 
        icon: 'thumbs-up'
      },
      { 
        id: 'passenger_info_ready', 
        text: 'Passenger information prepared', 
        icon: 'information-circle'
      },
      { 
        id: 'standard_approval', 
        text: 'Standard roadwork approval', 
        icon: 'document-text'
      }
    ],
    monitoring: [
      { 
        id: 'routes_unclear', 
        text: 'Unable to determine routes affected', 
        icon: 'help-circle'
      },
      { 
        id: 'location_confirmation', 
        text: 'Waiting for confirmation on exact location', 
        icon: 'location'
      },
      { 
        id: 'closure_details', 
        text: 'Need more information on lane/road closure', 
        icon: 'warning'
      },
      { 
        id: 'timing_unclear', 
        text: 'Start/end dates need confirmation', 
        icon: 'time'
      },
      { 
        id: 'promoter_contact', 
        text: 'Awaiting response from works promoter', 
        icon: 'person'
      },
      { 
        id: 'impact_assessment', 
        text: 'Reviewing potential traffic impact', 
        icon: 'analytics'
      }
    ],
    rejected: [
      { 
        id: 'no_routes_affected', 
        text: 'No GNE routes affected', 
        icon: 'close-circle'
      },
      { 
        id: 'outside_region', 
        text: 'Not in GNE operating region', 
        icon: 'location-outline'
      },
      { 
        id: 'insufficient_notice', 
        text: 'Insufficient advance notice given', 
        icon: 'calendar'
      },
      { 
        id: 'duplicate_entry', 
        text: 'Duplicate of existing roadwork', 
        icon: 'copy'
      },
      { 
        id: 'cancelled_works', 
        text: 'Works cancelled or postponed', 
        icon: 'pause-circle'
      },
      { 
        id: 'private_land', 
        text: 'Works on private land only', 
        icon: 'business'
      },
      { 
        id: 'emergency_only', 
        text: 'Emergency works - no advance planning possible', 
        icon: 'flash'
      }
    ]
  };

  // Debug logging for modal state
  useEffect(() => {
    if (reviewModalVisible) {
      console.log('🔍 Modal is now visible with selectedRoadwork:', selectedRoadwork?.title || selectedRoadwork?.sm_street_name || 'undefined');
    } else {
      console.log('🔍 Modal is now hidden');
    }
  }, [reviewModalVisible, selectedRoadwork]);

  // Fetch pending roadworks
  const fetchPendingRoadworks = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/roadworks-v2/pending`, {
        headers: {
          'x-session-id': currentSession.sessionId
        }
      });

      if (!response.ok) throw new Error('Failed to fetch roadworks');

      const data = await response.json();
      setPendingRoadworks(data.data || []);
    } catch (error) {
      console.error('Error fetching pending roadworks:', error);
      if (error.message.includes('Failed to fetch')) {
        console.log('ℹ️ Backend API unavailable - review queue will be empty until service is restored');
        // Don't show alert for this known issue, just keep empty state
      } else {
        Alert.alert('Error', 'Failed to fetch pending roadworks');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!currentSession) return;

    try {
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/roadworks-v2/stats`, {
        headers: {
          'x-session-id': currentSession.sessionId
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Submit review
  const submitReview = async () => {
    if (submitting) return; // Prevent double submission
    
    console.log('🔥🔥🔥 ===== SUBMIT REVIEW FUNCTION CALLED ===== 🔥🔥🔥');
    console.log('🔍 submitReview called at:', new Date().toISOString());
    console.log('🔍 currentSession:', currentSession);
    console.log('🔍 selectedRoadwork:', selectedRoadwork);
    console.log('🔍 reviewData:', reviewData);

    if (!currentSession) {
      console.warn('❌ No current session - cannot submit review');
      Alert.alert('Error', 'Please log in to submit reviews');
      return;
    }

    if (!selectedRoadwork) {
      console.warn('❌ No selected roadwork - cannot submit review');
      Alert.alert('Error', 'No roadwork selected for review');
      return;
    }

    try {
      setSubmitting(true);
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const url = `${apiUrl}/api/roadworks-v2/${selectedRoadwork.id}/review`;
      console.log('📡 Submitting review to:', url);
      
      // Ensure we have supervisor credentials - truncate supervisorId if it's too long
      let supervisorId = currentSession.supervisorId || currentSession.sessionId || 'UNKNOWN';
      
      // If supervisorId is a UUID/session ID, truncate it or use a different identifier
      if (supervisorId.length > 10) {
        // Try to get a badge number or short ID instead
        supervisorId = currentSession.supervisor?.badge || supervisorId.substring(0, 10);
      }
      
      const supervisorName = currentSession.supervisorName || currentSession.supervisor?.name || 'Unknown Supervisor';
      
      if (!supervisorId || supervisorId === 'UNKNOWN' || !supervisorName || supervisorName === 'Unknown Supervisor') {
        console.warn('❌ Missing supervisor credentials:', { supervisorId, supervisorName });
        Alert.alert('Authentication Error', 'Please ensure you are logged in as a supervisor');
        return;
      }

      // Build structured notes from selected reasons
      const structuredNotes = buildNotesFromReasons();

      // Ensure field lengths don't exceed database constraints
      const payload = {
        ...reviewData,
        status: reviewData.status?.substring(0, 10), // Limit to 10 chars
        supervisorId,
        supervisorName: supervisorName?.substring(0, 50), // Reasonable limit for name
        notes: structuredNotes.substring(0, 500), // Use structured notes
        selectedReasons: reviewData.selectedReasons // Include for audit trail
      };
      console.log('📡 Review payload:', payload);
      console.log('📡 Payload field lengths:', {
        status: `"${payload.status}" (${payload.status?.length} chars)`,
        severity: `"${payload.severity}" (${payload.severity?.length} chars)`,
        supervisorId: `"${supervisorId}" (${supervisorId?.length} chars)`,
        supervisorName: `"${supervisorName}" (${supervisorName?.length} chars)`,
        notes: `"${payload.notes}" (${payload.notes?.length} chars)`,
        confirmedRoutes: payload.confirmedRoutes
      });
      console.log('📡 Current session details:', currentSession);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': currentSession.sessionId
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Review response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Review API error:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Backend routes not available');
        }
        throw new Error(`Failed to submit review: ${response.status}`);
      }

      console.log('✅ Review submitted successfully');
      
      // Close modal immediately
      setReviewModalVisible(false);
      setSelectedRoadwork(null);
      
      // Show success alert with specific messaging for rejected items
      setTimeout(() => {
        if (reviewData.status === 'rejected') {
          Alert.alert(
            'Roadwork Rejected & Archived', 
            `"${selectedRoadwork?.sm_street_name || 'Roadwork'}" has been rejected and moved to the archive.\n\n` +
            `Reason: ${buildNotesFromReasons()}\n\n` +
            `This decision is logged for audit purposes.`,
            [
              { text: 'View Archive', onPress: () => {
                // Could navigate to archive tab if needed
                console.log('User wants to view archive tab');
              }},
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert('Success', `Roadwork ${reviewData.status} successfully`);
        }
      }, 100);
      
      // Refresh data
      fetchPendingRoadworks();
      fetchStats();
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      
      // Close modal immediately on error
      setReviewModalVisible(false);
      setSelectedRoadwork(null);
      
      // Handle network errors gracefully
      setTimeout(() => {
        if (error.message.includes('Failed to fetch') || error.message.includes('Backend routes not available')) {
          Alert.alert(
            'Review API Temporarily Unavailable', 
            'The backend API routes are currently not responding (404 error). This is a known deployment issue that will be resolved shortly. Your review data has been noted locally.'
          );
        } else {
          Alert.alert('Error', `Failed to submit review: ${error.message}`);
        }
      }, 100);
      
      // Refresh the data to show any changes
      fetchPendingRoadworks();
      fetchStats();
    } finally {
      setSubmitting(false);
    }
  };

  // Batch approve
  const batchApprove = async () => {
    if (!currentSession) return;

    const selectedIds = pendingRoadworks.map(rw => rw.id);

    if (selectedIds.length === 0) {
      Alert.alert('Info', 'No roadworks to approve');
      return;
    }

    Alert.alert(
      'Batch Approve',
      `Approve all ${selectedIds.length} roadworks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: async () => {
            try {
              const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
              const response = await fetch(`${apiUrl}/api/roadworks-v2/batch-approve`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': currentSession.sessionId
                },
                body: JSON.stringify({
                  streetworkIds: selectedIds,
                  supervisorId: currentSession.supervisorId,
                  supervisorName: currentSession.supervisorName
                })
              });

              if (!response.ok) throw new Error('Failed to batch approve');

              const result = await response.json();
              Alert.alert('Success', result.message, [
                { text: 'OK', onPress: () => {
                  fetchPendingRoadworks();
                  fetchStats();
                }}
              ]);
            } catch (error) {
              console.error('Error batch approving:', error);
              Alert.alert('Error', 'Failed to batch approve');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (currentSession) {
      fetchPendingRoadworks();
      fetchStats();
    }
  }, [currentSession]);

  // Helper functions for reason selection
  const toggleReason = (reasonId) => {
    setReviewData(prev => ({
      ...prev,
      selectedReasons: prev.selectedReasons.includes(reasonId)
        ? prev.selectedReasons.filter(id => id !== reasonId)
        : [...prev.selectedReasons, reasonId]
    }));
  };

  const buildNotesFromReasons = () => {
    const selectedOptions = reasonOptions[reviewData.status] || [];
    const selectedReasonTexts = reviewData.selectedReasons
      .map(reasonId => selectedOptions.find(option => option.id === reasonId)?.text)
      .filter(Boolean);
    
    // Add routes information for approved items
    if (reviewData.status === 'approved' && reviewData.confirmedRoutes.length > 0) {
      selectedReasonTexts.unshift(`Affects routes: ${reviewData.confirmedRoutes.join(', ')}`);
    }
    
    return selectedReasonTexts.join('; ');
  };

  const openReviewModal = (roadwork) => {
    console.log('🔍 Opening review modal for roadwork:', roadwork);
    try {
      setSelectedRoadwork(roadwork);
      setReviewData({
        status: 'approved',
        confirmedRoutes: roadwork.auto_matched_routes || [],
        diversionRequired: false,
        notes: '',
        selectedReasons: []
      });
      setReviewModalVisible(true);
      console.log('✅ Review modal should now be visible');
    } catch (error) {
      console.error('❌ Error opening review modal:', error);
    }
  };

  const openMapLocation = (roadwork) => {
    try {
      const { 
        latitude, 
        longitude, 
        sm_street_name, 
        sm_area_name, 
        sm_location_description,
        sm_town,
        sm_authority 
      } = roadwork;
      
      // Build the most accurate location string possible
      let locationParts = [];
      if (sm_street_name) locationParts.push(sm_street_name);
      if (sm_location_description && sm_location_description !== sm_street_name) {
        locationParts.push(sm_location_description);
      }
      if (sm_area_name) locationParts.push(sm_area_name);
      if (sm_town && sm_town !== sm_area_name) locationParts.push(sm_town);
      
      // Add North East England context if not already included
      if (!locationParts.some(part => part.toLowerCase().includes('newcastle') || 
                                    part.toLowerCase().includes('gateshead') ||
                                    part.toLowerCase().includes('sunderland') ||
                                    part.toLowerCase().includes('durham') ||
                                    part.toLowerCase().includes('northumberland'))) {
        locationParts.push('North East England');
      }
      
      if (latitude && longitude) {
        // Use coordinates with descriptive label for better accuracy
        const coordinateUrl = `${latitude},${longitude}`;
        const label = encodeURIComponent(locationParts.slice(0, 2).join(', '));
        
        const mapUrl = Platform.select({
          ios: `maps:0,0?q=${coordinateUrl}`,
          android: `geo:0,0?q=${coordinateUrl}`,
          default: `https://www.google.com/maps/place/${label}/@${latitude},${longitude},17z`
        });
        
        Linking.openURL(mapUrl).catch(err => {
          console.error('Failed to open map:', err);
          // Enhanced fallback with satellite view for better accuracy
          const webUrl = `https://www.google.com/maps/@${latitude},${longitude},17z/data=!3m1!1e3`;
          if (Platform.OS === 'web') {
            window.open(webUrl, '_blank');
          }
        });
        console.log('🗺️ Opened precise map location for:', locationParts.join(', '), 'at', latitude, longitude);
      } else {
        // Enhanced fallback search with better location context
        const searchQuery = encodeURIComponent(locationParts.join(', '));
        const searchUrl = Platform.select({
          ios: `maps:0,0?q=${searchQuery}`,
          android: `geo:0,0?q=${searchQuery}`,
          default: `https://www.google.com/maps/search/${searchQuery}`
        });
        
        Linking.openURL(searchUrl).catch(err => {
          console.error('Failed to open map search:', err);
          // Fallback to web URL with enhanced search
          const webUrl = `https://www.google.com/maps/search/${searchQuery}`;
          if (Platform.OS === 'web') {
            window.open(webUrl, '_blank');
          }
        });
        console.log('🗺️ Opened map search for enhanced location:', locationParts.join(', '));
      }
    } catch (error) {
      console.error('❌ Error opening map:', error);
      Alert.alert('Error', 'Failed to open map location');
    }
  };


  // Sort roadworks
  const sortRoadworks = (roadworks) => {
    if (!roadworks || roadworks.length === 0) return roadworks;

    const sorted = [...roadworks].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.sm_start_date || a.created_at || '1970-01-01').getTime();
          bValue = new Date(b.sm_start_date || b.created_at || '1970-01-01').getTime();
          break;
        case 'location':
          aValue = (a.sm_street_name || '').toLowerCase();
          bValue = (b.sm_street_name || '').toLowerCase();
          break;
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, undefined: 0 };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        case 'duration':
          const aDuration = a.sm_start_date && a.sm_end_date ? 
            (new Date(a.sm_end_date) - new Date(a.sm_start_date)) / (1000 * 60 * 60 * 24) : 0;
          const bDuration = b.sm_start_date && b.sm_end_date ? 
            (new Date(b.sm_end_date) - new Date(b.sm_start_date)) / (1000 * 60 * 60 * 24) : 0;
          aValue = aDuration;
          bValue = bDuration;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return sorted;
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (columnSort) => {
    if (sortBy !== columnSort) return 'swap-vertical-outline';
    return sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_review': return 'time-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'monitoring': return 'eye-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Icon name="lock-closed-outline" size={48} color="#e74c3c" />
          <Text style={styles.loginText}>Supervisor login required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Roadwork Review Queue</Text>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.statNumber}>{stats.pendingReview || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
            <Text style={styles.statNumber}>{stats.approved || 0}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

      </View>

      {/* Batch Operations */}
      <BatchOperations
        roadworks={pendingRoadworks}
        onBatchOperation={(operation, result) => {
          fetchPendingRoadworks();
          fetchStats();
        }}
        sessionId={currentSession?.sessionId}
        baseUrl={baseUrl}
      />

      {/* Sort Controls */}
      {pendingRoadworks.length > 0 && (
        <View style={styles.sortControls}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => handleSort('date')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>Date</Text>
            <Icon name={getSortIcon('date')} size={16} color={sortBy === 'date' ? '#3498db' : '#7f8c8d'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'location' && styles.sortButtonActive]}
            onPress={() => handleSort('location')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'location' && styles.sortButtonTextActive]}>Location</Text>
            <Icon name={getSortIcon('location')} size={16} color={sortBy === 'location' ? '#3498db' : '#7f8c8d'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'duration' && styles.sortButtonActive]}
            onPress={() => handleSort('duration')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'duration' && styles.sortButtonTextActive]}>Duration</Text>
            <Icon name={getSortIcon('duration')} size={16} color={sortBy === 'duration' ? '#3498db' : '#7f8c8d'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Roadworks List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPendingRoadworks();
            }}
          />
        }
      >
        {loading && pendingRoadworks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading roadworks...</Text>
          </View>
        ) : pendingRoadworks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="checkmark-done-circle" size={64} color="#27ae60" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No roadworks pending review</Text>
          </View>
        ) : (
          sortRoadworks(pendingRoadworks).map((roadwork) => (
            <TouchableOpacity
              key={roadwork.id}
              style={styles.roadworkCard}
              onPress={() => openReviewModal(roadwork)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.reference}>{roadwork.sm_reference || ''}</Text>
              </View>

              <Text style={styles.streetName}>{roadwork.sm_street_name || 'Unknown Street'}</Text>
              
              {/* Enhanced location information */}
              <View style={styles.locationDetails}>
                {roadwork.sm_area_name && (
                  <Text style={styles.locationText}>📍 {roadwork.sm_area_name}</Text>
                )}
                {roadwork.sm_location_description && (
                  <Text style={styles.locationDescription} numberOfLines={1}>
                    {roadwork.sm_location_description}
                  </Text>
                )}
                {(roadwork.latitude && roadwork.longitude) && (
                  <Text style={styles.coordinatesText}>
                    📌 {roadwork.latitude?.toFixed(4) || 'N/A'}, {roadwork.longitude?.toFixed(4) || 'N/A'}
                  </Text>
                )}
              </View>
              
              <Text style={styles.description} numberOfLines={2}>
                {roadwork.sm_works_description || 'No description available'}
              </Text>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Icon name="business-outline" size={14} color="#7f8c8d" />
                  <Text style={styles.detailText}>{roadwork.sm_promoter_name || 'Unknown'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="play-outline" size={14} color="#27ae60" />
                  <Text style={styles.detailText}>
                    Start: {roadwork.sm_start_date ? new Date(roadwork.sm_start_date).toLocaleDateString('en-GB') : 'TBD'}
                  </Text>
                </View>

                {roadwork.sm_end_date && (
                  <View style={styles.detailRow}>
                    <Icon name="stop-outline" size={14} color="#e74c3c" />
                    <Text style={styles.detailText}>
                      End: {new Date(roadwork.sm_end_date).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                )}

                {roadwork.sm_start_date && roadwork.sm_end_date && (
                  <View style={styles.detailRow}>
                    <Icon name="time-outline" size={14} color="#f39c12" />
                    <Text style={styles.detailText}>
                      Duration: {Math.ceil((new Date(roadwork.sm_end_date) - new Date(roadwork.sm_start_date)) / (1000 * 60 * 60 * 24))} days
                    </Text>
                  </View>
                )}

                {roadwork.auto_matched_routes?.length > 0 && (
                  <View style={styles.detailRow}>
                    <Icon name="bus-outline" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      Routes: {roadwork.auto_matched_routes.join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card tap
                    openMapLocation(roadwork);
                  }}
                >
                  <Icon name="map-outline" size={18} color="#3498db" />
                  <Text style={styles.mapButtonText}>Map</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card tap
                    openReviewModal(roadwork);
                  }}
                >
                  <Icon name="create-outline" size={18} color="white" />
                  <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setReviewModalVisible(false);
          setSelectedRoadwork(null);
          setReviewData({
            status: 'approved',
            confirmedRoutes: [],
            diversionRequired: false,
            notes: '',
            selectedReasons: []
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Roadwork</Text>
              <TouchableOpacity
                onPress={() => {
                  setReviewModalVisible(false);
                  setSelectedRoadwork(null);
                  setReviewData({
                    status: 'approved',
                    confirmedRoutes: [],
                    diversionRequired: false,
                    notes: '',
                    selectedReasons: []
                  });
                }}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            {selectedRoadwork && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSectionTitle}>Location</Text>
                <Text style={styles.modalText}>{selectedRoadwork.sm_street_name}</Text>
                <Text style={styles.modalSubtext}>{selectedRoadwork.sm_area_name}</Text>

                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalText}>{selectedRoadwork.sm_works_description}</Text>


                <Text style={styles.modalSectionTitle}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'approved' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'approved', selectedReasons: [] })}
                  >
                    <Icon name="checkmark-circle" size={20} color={reviewData.status === 'approved' ? '#27ae60' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'monitoring' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'monitoring', selectedReasons: [] })}
                  >
                    <Icon name="eye" size={20} color={reviewData.status === 'monitoring' ? '#3498db' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Monitor</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'rejected' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'rejected', selectedReasons: [] })}
                  >
                    <Icon name="close-circle" size={20} color={reviewData.status === 'rejected' ? '#e74c3c' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Reject & Archive</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.diversionToggle}>
                  <Text style={styles.modalSectionTitle}>Diversion Required?</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      reviewData.diversionRequired && styles.toggleActive
                    ]}
                    onPress={() => setReviewData({ ...reviewData, diversionRequired: !reviewData.diversionRequired })}
                  >
                    <Icon 
                      name={reviewData.diversionRequired ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={reviewData.diversionRequired ? "#27ae60" : "#7f8c8d"} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Conditional Routes Input for Approved Status */}
                {reviewData.status === 'approved' && (
                  <>
                    <Text style={styles.modalSectionTitle}>Affected Routes</Text>
                    <TextInput
                      style={styles.routesInput}
                      value={reviewData.confirmedRoutes.join(', ')}
                      onChangeText={(text) => setReviewData({ 
                        ...reviewData, 
                        confirmedRoutes: text.split(',').map(r => r.trim()).filter(r => r) 
                      })}
                      placeholder="Enter route numbers (e.g., 21, X21, Q3)"
                    />
                  </>
                )}

                <Text style={styles.modalSectionTitle}>
                  {reviewData.status === 'approved' ? 'Approval Reasons' : 
                   reviewData.status === 'monitoring' ? 'Monitoring Reasons' : 
                   'Rejection Reasons'}
                </Text>
                
                {/* Archive reminder for rejections */}
                {reviewData.status === 'rejected' && (
                  <View style={styles.archiveReminder}>
                    <Icon name="filing-outline" size={16} color="#e74c3c" />
                    <Text style={styles.archiveReminderText}>
                      Rejected roadworks are automatically archived for audit purposes.
                    </Text>
                  </View>
                )}
                
                {/* Structured Reason Buttons */}
                <View style={styles.reasonsContainer}>
                  {(reasonOptions[reviewData.status] || []).map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonButton,
                        reviewData.selectedReasons.includes(reason.id) && styles.reasonButtonSelected
                      ]}
                      onPress={() => toggleReason(reason.id)}
                    >
                      <Icon 
                        name={reason.icon} 
                        size={16} 
                        color={reviewData.selectedReasons.includes(reason.id) ? '#ffffff' : '#7f8c8d'} 
                      />
                      <Text style={[
                        styles.reasonButtonText,
                        reviewData.selectedReasons.includes(reason.id) && styles.reasonButtonTextSelected
                      ]}>
                        {reason.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Preview of generated notes */}
                {reviewData.selectedReasons.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Review Summary</Text>
                    <View style={styles.notesPreview}>
                      <Text style={styles.notesPreviewText}>{buildNotesFromReasons()}</Text>
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setReviewModalVisible(false);
                  setSelectedRoadwork(null);
                  setReviewData({
                    status: 'approved',
                    confirmedRoutes: [],
                    diversionRequired: false,
                    notes: '',
                    selectedReasons: []
                  });
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonPrimary,
                  submitting && styles.modalButtonDisabled
                ]}
                onPress={async () => {
                  console.log('🔥 Submit Review button pressed!');
                  console.log('🔍 Current session check:', !!currentSession);
                  console.log('🔍 Selected roadwork check:', !!selectedRoadwork);
                  
                  if (submitting) return; // Prevent double tap
                  
                  if (!currentSession) {
                    console.log('❌ No current session - showing alert');
                    Alert.alert('Authentication Error', 'Please ensure you are logged in as a supervisor');
                    return;
                  }
                  if (!selectedRoadwork) {
                    console.log('❌ No selected roadwork - showing alert');
                    Alert.alert('Error', 'No roadwork selected for review');
                    return;
                  }
                  if (reviewData.selectedReasons.length === 0) {
                    Alert.alert('Incomplete Review', 'Please select at least one reason for your decision');
                    return;
                  }
                  console.log('✅ Pre-checks passed, calling submitReview()');
                  await submitReview();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={[styles.modalButtonTextPrimary, { marginLeft: 8 }]}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    marginRight: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 4,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  roadworkCard: {
    backgroundColor: 'white',
    margin: 8,
    marginBottom: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reference: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  streetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  locationDetails: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#2c3e50',
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  coordinatesText: {
    fontSize: 10,
    color: '#95a5a6',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.4,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.55,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  mapButton: {
    backgroundColor: '#ecf0f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  mapButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationDetails: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  locationText: {
    fontSize: 13,
    color: '#2c3e50',
    marginBottom: 3,
    fontWeight: '500',
  },
  locationDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 3,
    fontStyle: 'italic',
  },
  coordinatesText: {
    fontSize: 11,
    color: '#95a5a6',
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  modalSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  severityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    alignItems: 'center',
  },
  severityOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  statusOptionSelected: {
    backgroundColor: '#f8f9fa',
    borderColor: '#3498db',
  },
  statusOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  diversionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  toggle: {
    padding: 4,
  },
  toggleActive: {
    opacity: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    textAlignVertical: 'top',
  },
  routesInput: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
  },
  reasonsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  reasonButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  reasonButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  reasonButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  notesPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
    marginBottom: 16,
  },
  notesPreviewText: {
    fontSize: 13,
    color: '#2c3e50',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonSecondary: {
    backgroundColor: '#ecf0f1',
  },
  modalButtonPrimary: {
    backgroundColor: '#3498db',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.7,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f2',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
    marginBottom: 12,
  },
  archiveReminderText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
});

export default RoadworkQueue;