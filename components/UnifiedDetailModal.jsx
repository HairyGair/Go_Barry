// components/UnifiedDetailModal.jsx
// Unified detail modal for both traffic alerts and roadworks with intelligent adaptation
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TomTomTrafficMap from './TomTomTrafficMap';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { API_CONFIG } from '../config/api';

// Message templates for rule-based diversions (shared between alerts and roadworks)
const MESSAGE_TEMPLATES = {
  road_closure: {
    pattern: "Service {routes} diverted via {diversion_route} due to road closure at {location}",
    defaultDiversion: "alternative route"
  },
  roadworks: {
    pattern: "Service {routes} diverted via {diversion_route} due to roadworks on {location}",
    defaultDiversion: "A690 and city centre"
  },
  utility_works: {
    pattern: "Service {routes} may be delayed due to utility works at {location}. Allow extra journey time",
    defaultDiversion: "delays expected"
  },
  highway_maintenance: {
    pattern: "Service {routes} diverted via {diversion_route} due to highway maintenance on {location}",
    defaultDiversion: "maintenance diversion route"
  },
  accident: {
    pattern: "Service {routes} delayed due to incident at {location}. Allow extra journey time",
    defaultDiversion: "delays expected"
  },
  planned_event: {
    pattern: "Service {routes} diverted via {diversion_route} due to event at {location}",
    defaultDiversion: "event diversion route"
  }
};

// Common diversion patterns
const DIVERSION_PATTERNS = {
  "A1": {
    routes: ["21", "X21"],
    diversions: ["A690", "A19", "Local roads via Birtley"]
  },
  "A19": {
    routes: ["1", "2", "307"],
    diversions: ["A1", "A690", "Sunderland Road"]
  },
  "City Centre": {
    routes: ["Q3", "1", "2", "21"],
    diversions: ["Bypass via A167", "Central Station route", "Byker Bridge"]
  },
  "Gateshead": {
    routes: ["Q3", "57", "58"],
    diversions: ["High Level Bridge", "Swing Bridge", "A167"]
  }
};

const UnifiedDetailModal = ({ 
  visible, 
  onClose, 
  data, // Can be alert or roadwork
  onUpdate,
  onDismiss,
  onPushToDisplay 
}) => {
  const { supervisorSession } = useSupervisorSession();
  const { pushToDisplay, dismissFromDisplay } = useConvexSync();
  
  // Detect data type
  const dataType = useMemo(() => {
    if (!data) return 'unknown';
    
    // Check for roadwork indicators
    if (data.source === 'StreetManager' || 
        data.permitReference || 
        data.workCategory ||
        data.authority ||
        data.dataSource === 'StreetManager Webhook Database') {
      return 'roadwork';
    }
    
    // Check for manual incident indicators
    if (data.source === 'manual_incident' || data.incidentData) {
      return 'incident';
    }
    
    // Default to traffic alert
    return 'alert';
  }, [data]);

  // Local state
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [diversionText, setDiversionText] = useState('');
  const [driverMessage, setDriverMessage] = useState('');
  const [suggestedRoutes, setSuggestedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Initialize state when data changes
  useEffect(() => {
    if (data) {
      setEditedTitle(data.title || '');
      setSelectedRoutes(data.affectsRoutes || data.routes_affected || []);
      setDiversionText('');
      setDriverMessage('');
      setSaveStatus('');
      
      // Get suggested routes from GTFS matcher
      if (data.coordinates) {
        fetchSuggestedRoutes();
      }
      
      // Generate initial diversion message
      generateInitialMessages();
    }
  }, [data]);

  // Enhanced GTFS route matching
  const fetchSuggestedRoutes = async () => {
    try {
      if (!data.coordinates || data.coordinates.length < 2) return;
      
      const [lat, lng] = data.coordinates;
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/gtfs/match/enhanced?` +
        `lat=${lat}&lng=${lng}&radius=1000&includeDirections=true`
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('📍 Enhanced GTFS match results:', result);
        
        if (result.success && result.matches) {
          // Sort by confidence
          const sortedRoutes = result.matches
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
            .map(match => ({
              routeId: match.routeId,
              routeName: match.routeName,
              confidence: match.confidence,
              distance: match.distance,
              direction: match.direction
            }));
            
          setSuggestedRoutes(sortedRoutes);
          
          // Auto-select high confidence routes
          const highConfidenceRoutes = sortedRoutes
            .filter(route => route.confidence > 0.7)
            .map(route => route.routeName);
            
          if (highConfidenceRoutes.length > 0) {
            setSelectedRoutes(prev => [...new Set([...prev, ...highConfidenceRoutes])]);
          }
        }
      }
    } catch (error) {
      console.error('❌ GTFS matching failed:', error);
    }
  };

  // Generate initial messages based on data type and content
  const generateInitialMessages = () => {
    if (!data) return;
    
    // Determine type from data
    const alertType = detectDataType(data);
    const template = MESSAGE_TEMPLATES[alertType] || MESSAGE_TEMPLATES.road_closure;
    
    // Extract location context
    const location = data.location || data.displayLocation || data.street_name || 'location';
    const locationContext = extractLocationContext(location);
    const suggestedDiversion = getSuggestedDiversion(locationContext, alertType);
    
    // Generate driver message
    const routes = (data.affectsRoutes || data.routes_affected || []).join(', ') || 'affected services';
    const message = template.pattern
      .replace('{routes}', routes)
      .replace('{location}', location)
      .replace('{diversion_route}', suggestedDiversion);
      
    setDriverMessage(message);
    setDiversionText(suggestedDiversion);
  };

  // Detect data type from content
  const detectDataType = (data) => {
    const text = `${data.title} ${data.description}`.toLowerCase();
    
    if (dataType === 'roadwork') {
      if (text.includes('utility') || data.workCategory?.includes('utility')) return 'utility_works';
      if (text.includes('highway') || text.includes('maintenance')) return 'highway_maintenance';
      return 'roadworks';
    }
    
    if (text.includes('closure') || text.includes('closed')) return 'road_closure';
    if (text.includes('accident') || text.includes('incident')) return 'accident';
    if (text.includes('event') || text.includes('match') || text.includes('concert')) return 'planned_event';
    
    return 'road_closure'; // default
  };

  // Extract location context for better diversion suggestions
  const extractLocationContext = (location) => {
    if (!location) return 'unknown';
    
    const loc = location.toLowerCase();
    if (loc.includes('a1')) return 'A1';
    if (loc.includes('a19')) return 'A19';
    if (loc.includes('city centre') || loc.includes('newcastle')) return 'City Centre';
    if (loc.includes('gateshead')) return 'Gateshead';
    
    return 'general';
  };

  // Get suggested diversion based on location and type
  const getSuggestedDiversion = (locationContext, alertType) => {
    const pattern = DIVERSION_PATTERNS[locationContext];
    if (pattern && pattern.diversions.length > 0) {
      if (alertType === 'roadworks' || alertType === 'utility_works') {
        return pattern.diversions[0]; // First option for roadworks
      }
      return pattern.diversions[Math.floor(Math.random() * pattern.diversions.length)];
    }
    
    return MESSAGE_TEMPLATES[alertType]?.defaultDiversion || 'alternative route';
  };

  // Handle route selection
  const toggleRouteSelection = (routeName) => {
    setSelectedRoutes(prev => {
      if (prev.includes(routeName)) {
        return prev.filter(r => r !== routeName);
      } else {
        return [...prev, routeName];
      }
    });
  };

  // Update messages when routes change
  useEffect(() => {
    if (selectedRoutes.length > 0 && data) {
      const alertType = detectDataType(data);
      const template = MESSAGE_TEMPLATES[alertType];
      
      const location = data.location || data.displayLocation || data.street_name || 'location';
      const updatedMessage = template.pattern
        .replace('{routes}', selectedRoutes.join(', '))
        .replace('{location}', location)
        .replace('{diversion_route}', diversionText || template.defaultDiversion);
        
      setDriverMessage(updatedMessage);
    }
  }, [selectedRoutes, diversionText, data]);

  // Save changes
  const handleSaveChanges = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to save changes');
      return;
    }
    
    setLoading(true);
    setSaveStatus('Saving...');
    
    try {
      // Different save endpoints based on data type
      let endpoint = '';
      let updateData = {};
      
      if (dataType === 'roadwork') {
        endpoint = `/api/roadworks/${data.id || data.notification_id}`;
        updateData = {
          title: editedTitle,
          routes_affected: selectedRoutes,
          updatedBy: supervisorSession.supervisor.badge,
          timestamp: Date.now()
        };
      } else {
        endpoint = `/api/alerts/${data.id}/update`;
        updateData = {
          title: editedTitle,
          affectsRoutes: selectedRoutes,
          updatedBy: supervisorSession.supervisor.badge,
          timestamp: Date.now()
        };
      }
      
      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setSaveStatus('✅ Saved successfully');
      
      if (onUpdate) {
        onUpdate({
          ...data,
          title: editedTitle,
          affectsRoutes: selectedRoutes,
          routes_affected: selectedRoutes
        });
      }
      
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      setSaveStatus('❌ Save failed');
      Alert.alert('Error', 'Failed to save changes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle dismiss
  const handleDismiss = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to dismiss');
      return;
    }
    
    const itemType = dataType === 'roadwork' ? 'roadwork' : 'alert';
    
    Alert.alert(
      `Dismiss ${itemType}`,
      `Are you sure you want to dismiss this ${itemType}? It will be removed from all displays.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            try {
              // If onDismiss callback provided, use it (for roadworks)
              if (onDismiss) {
                onDismiss(data);
                onClose();
              } else {
                // Otherwise use Convex dismiss (for alerts)
                const result = await dismissFromDisplay({
                  alertId: data.id || data.notification_id,
                  sessionId: supervisorSession.sessionId,
                  reason: 'Not relevant/resolved'
                });
                
                if (result.success) {
                  onClose();
                }
              }
            } catch (error) {
              Alert.alert('Error', `Failed to dismiss ${itemType}`);
            }
          }
        }
      ]
    );
  };

  // Handle push to display
  const handlePushToDisplay = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to push to display');
      return;
    }
    
    try {
      // If onPushToDisplay callback provided, use it (for roadworks)
      if (onPushToDisplay) {
        onPushToDisplay(data);
      } else {
        // Otherwise use Convex push (for alerts)
        const result = await pushToDisplay({
          alertId: data.id || data.notification_id,
          sessionId: supervisorSession.sessionId,
          notes: `${editedTitle} - ${diversionText || 'Major disruption'}`
        });
        
        if (result.success) {
          Alert.alert('Success', 'Item pushed to control room display');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to push to display');
    }
  };

  // Handle status update for roadworks
  const handleUpdateStatus = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to update status');
      return;
    }
    
    if (!newStatus || !statusNotes.trim()) {
      Alert.alert('Error', 'Please select a status and provide notes');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_CONFIG.baseURL}/api/roadworks/${data.id || data.notification_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes,
          sessionId: supervisorSession.sessionId,
          updatedBy: supervisorSession.supervisor.badge
        })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNotes('');
        
        if (onUpdate) {
          onUpdate({
            ...data,
            status: newStatus,
            lastUpdated: Date.now()
          });
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('❌ Status update failed:', error);
      Alert.alert('Error', 'Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Store diversion for future use
  const handleStoreDiversion = async () => {
    if (!diversionText || selectedRoutes.length === 0) {
      Alert.alert('Error', 'Please select routes and enter diversion details');
      return;
    }
    
    try {
      const location = data.location || data.displayLocation || data.street_name || 'Unknown location';
      const diversionData = {
        location: location,
        routes: selectedRoutes,
        diversion: diversionText,
        message: driverMessage,
        alertType: detectDataType(data),
        dataType: dataType,
        createdBy: supervisorSession?.supervisor?.badge,
        timestamp: Date.now()
      };
      
      const response = await fetch(`${API_CONFIG.baseURL}/api/diversions/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diversionData)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Diversion pattern saved for future use');
      } else {
        throw new Error('Failed to store diversion');
      }
    } catch (error) {
      console.error('❌ Failed to store diversion:', error);
      Alert.alert('Error', 'Failed to store diversion pattern');
    }
  };

  // Get header information based on data type
  const getHeaderInfo = () => {
    switch (dataType) {
      case 'roadwork':
        return {
          title: 'Roadwork Details',
          subtitle: `${data.source || 'StreetManager'} • ${data.severity || 'Medium'} • ${data.workCategory || 'Roadwork'}`
        };
      case 'incident':
        return {
          title: 'Incident Details',
          subtitle: `Manual Incident • ${data.severity || 'Medium'} • ${data.type || 'Incident'}`
        };
      default:
        return {
          title: 'Alert Details',
          subtitle: `${data.source || 'Traffic Alert'} • ${data.severity?.toUpperCase() || 'MEDIUM'}`
        };
    }
  };

  if (!visible || !data) return null;

  const headerInfo = getHeaderInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{headerInfo.title}</Text>
            <Text style={styles.headerSubtitle}>{headerInfo.subtitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Editable Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Enter title..."
              multiline
              editable={!!supervisorSession}
            />
            {editedTitle !== data.title && (
              <Text style={styles.changeIndicator}>• Modified</Text>
            )}
          </View>

          {/* Roadwork-specific information */}
          {dataType === 'roadwork' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Details</Text>
                
                {data.permitReference && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Permit Reference:</Text>
                    <Text style={styles.infoValue}>{data.permitReference}</Text>
                  </View>
                )}
                
                {data.authority && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Authority:</Text>
                    <Text style={styles.infoValue}>{data.authority}</Text>
                  </View>
                )}
                
                {data.workCategory && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Work Category:</Text>
                    <Text style={styles.infoValue}>{data.workCategory}</Text>
                  </View>
                )}
                
                {data.work_type && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Work Type:</Text>
                    <Text style={styles.infoValue}>{data.work_type}</Text>
                  </View>
                )}
                
                {data.status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, styles.statusValue]}>{data.status}</Text>
                  </View>
                )}
                
                {data.startDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Start Date:</Text>
                    <Text style={styles.infoValue}>{new Date(data.startDate).toLocaleDateString()}</Text>
                  </View>
                )}
                
                {data.endDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>End Date:</Text>
                    <Text style={styles.infoValue}>{new Date(data.endDate).toLocaleDateString()}</Text>
                  </View>
                )}
                
                {data.reason && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Reason:</Text>
                    <Text style={styles.infoValue}>{data.reason}</Text>
                  </View>
                )}
                
                {data.description && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{data.description}</Text>
                  </View>
                )}
              </View>
              
              {/* Contact Information */}
              {(data.promoter || data.contact_details || data.authority_contact) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  
                  {data.promoter && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Promoter:</Text>
                      <Text style={styles.infoValue}>{data.promoter}</Text>
                    </View>
                  )}
                  
                  {data.contact_details && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Contact Details:</Text>
                      <Text style={styles.infoValue}>{data.contact_details}</Text>
                    </View>
                  )}
                  
                  {data.authority_contact && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Authority Contact:</Text>
                      <Text style={styles.infoValue}>{data.authority_contact}</Text>
                    </View>
                  )}
                  
                  {data.highway_authority && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Highway Authority:</Text>
                      <Text style={styles.infoValue}>{data.highway_authority}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Traffic Management & Impact */}
              {(data.traffic_management || data.lane_rental || data.collaboration_type) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Traffic Management</Text>
                  
                  {data.traffic_management && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Traffic Management:</Text>
                      <Text style={styles.infoValue}>{data.traffic_management}</Text>
                    </View>
                  )}
                  
                  {data.lane_rental && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Lane Rental:</Text>
                      <Text style={styles.infoValue}>{data.lane_rental ? 'Yes' : 'No'}</Text>
                    </View>
                  )}
                  
                  {data.collaboration_type && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Collaboration Type:</Text>
                      <Text style={styles.infoValue}>{data.collaboration_type}</Text>
                    </View>
                  )}
                  
                  {data.area_name && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Area:</Text>
                      <Text style={styles.infoValue}>{data.area_name}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* Location & Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Map</Text>
            <Text style={styles.locationText}>
              📍 {data.location || data.displayLocation || data.street_name || 'Location not specified'}
            </Text>
            {data.coordinates && data.coordinates.length >= 2 && (
              <View style={styles.mapContainer}>
                <TomTomTrafficMap
                  alerts={[data]}
                  currentAlert={data}
                  alertIndex={0}
                  showRoadworks={true}
                  showAffectedRoutes={true}
                />
              </View>
            )}
            {(!data.coordinates || data.coordinates.length < 2) && (
              <View style={styles.noMapContainer}>
                <Text style={styles.noMapText}>No coordinates available for map display</Text>
              </View>
            )}
          </View>

          {/* Route Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possibly Affected Routes</Text>
            
            {/* Current Selection */}
            <View style={styles.routeSelectionContainer}>
              <Text style={styles.routeSelectionTitle}>Selected Routes:</Text>
              <View style={styles.routeChips}>
                {selectedRoutes.map(route => (
                  <TouchableOpacity
                    key={route}
                    style={styles.routeChipSelected}
                    onPress={() => toggleRouteSelection(route)}
                  >
                    <Text style={styles.routeChipSelectedText}>{route}</Text>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                ))}
                {selectedRoutes.length === 0 && (
                  <Text style={styles.noRoutesText}>No routes selected</Text>
                )}
              </View>
            </View>

            {/* GTFS Suggested Routes */}
            {suggestedRoutes.length > 0 && (
              <View style={styles.suggestedRoutesContainer}>
                <Text style={styles.suggestedRoutesTitle}>Suggested by location:</Text>
                <View style={styles.routeChips}>
                  {suggestedRoutes.slice(0, 10).map(route => (
                    <TouchableOpacity
                      key={route.routeName}
                      style={[
                        styles.routeChip,
                        selectedRoutes.includes(route.routeName) && styles.routeChipSelected
                      ]}
                      onPress={() => toggleRouteSelection(route.routeName)}
                    >
                      <Text style={[
                        styles.routeChipText,
                        selectedRoutes.includes(route.routeName) && styles.routeChipSelectedText
                      ]}>
                        {route.routeName}
                      </Text>
                      <Text style={styles.routeConfidence}>
                        {Math.round(route.confidence * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Diversion Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diversion Details</Text>
            <TextInput
              style={styles.diversionInput}
              value={diversionText}
              onChangeText={setDiversionText}
              placeholder="Enter diversion route (e.g., A690, city centre, bypass)"
              multiline
            />
            
            {/* Driver Message */}
            <Text style={styles.messageTitle}>Driver Message Preview:</Text>
            <View style={styles.messagePreview}>
              <Text style={styles.messageText}>{driverMessage}</Text>
            </View>
            
            <TextInput
              style={styles.messageInput}
              value={driverMessage}
              onChangeText={setDriverMessage}
              placeholder="Edit driver message..."
              multiline
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            {supervisorSession && (
              <>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                  disabled={loading}
                >
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
                
                {saveStatus && (
                  <Text style={styles.saveStatus}>{saveStatus}</Text>
                )}

                <View style={styles.actionButtons}>
                  {dataType === 'roadwork' && (
                    <TouchableOpacity
                      style={styles.updateStatusButton}
                      onPress={() => setShowStatusModal(true)}
                    >
                      <Ionicons name="create" size={20} color="#FFFFFF" />
                      <Text style={styles.updateStatusButtonText}>Update Status</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleDismiss}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.dismissButtonText}>
                      Dismiss {dataType === 'roadwork' ? 'Roadwork' : 'Alert'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.displayButton, data?.promotedToDisplay && styles.removeDisplayButton]}
                    onPress={handlePushToDisplay}
                  >
                    <Ionicons name={data?.promotedToDisplay ? "tv-outline" : "tv"} size={20} color="#FFFFFF" />
                    <Text style={styles.displayButtonText}>
                      {data?.promotedToDisplay ? "Remove from Display" : "Show on Display"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.storeButton}
                    onPress={handleStoreDiversion}
                    disabled={!diversionText || selectedRoutes.length === 0}
                  >
                    <Ionicons name="bookmark" size={20} color="#FFFFFF" />
                    <Text style={styles.storeButtonText}>Store Diversion</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {!supervisorSession && (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Please log in as a supervisor to manage this {dataType}
                </Text>
              </View>
            )}
          </View>

          {/* Spacing for scroll */}
          <View style={{ height: 50 }} />
        </ScrollView>
        
        {/* Status Update Modal */}
        {showStatusModal && (
          <Modal
            visible={showStatusModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowStatusModal(false)}
          >
            <View style={styles.statusModalOverlay}>
              <View style={styles.statusModalContainer}>
                <View style={styles.statusModalHeader}>
                  <Text style={styles.statusModalTitle}>Update Status</Text>
                  <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.statusModalContent}>
                  <Text style={styles.statusModalLabel}>Select New Status:</Text>
                  <View style={styles.statusOptions}>
                    {['reported', 'assessing', 'planning', 'approved', 'active', 'monitoring', 'completed'].map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          newStatus === status && styles.statusOptionSelected
                        ]}
                        onPress={() => setNewStatus(status)}
                      >
                        <Text style={[
                          styles.statusOptionText,
                          newStatus === status && styles.statusOptionTextSelected
                        ]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <Text style={styles.statusModalLabel}>Update Notes:</Text>
                  <TextInput
                    style={styles.statusNotesInput}
                    value={statusNotes}
                    onChangeText={setStatusNotes}
                    placeholder="Describe the action taken or reason for status change..."
                    multiline
                    numberOfLines={4}
                  />
                  
                  <View style={styles.statusModalActions}>
                    <TouchableOpacity
                      style={styles.statusCancelButton}
                      onPress={() => setShowStatusModal(false)}
                    >
                      <Text style={styles.statusCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.statusConfirmButton,
                        (!newStatus || !statusNotes.trim()) && styles.statusConfirmButtonDisabled
                      ]}
                      onPress={handleUpdateStatus}
                      disabled={!newStatus || !statusNotes.trim() || loading}
                    >
                      <Text style={styles.statusConfirmButtonText}>
                        {loading ? 'Updating...' : 'Update Status'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  changeIndicator: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  noMapContainer: {
    height: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noMapText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  routeSelectionContainer: {
    marginBottom: 16,
  },
  routeSelectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  routeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  routeChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  routeChipSelectedText: {
    color: '#FFFFFF',
  },
  routeConfidence: {
    fontSize: 10,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  noRoutesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  suggestedRoutesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  suggestedRoutesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  diversionInput: {
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  messagePreview: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  messageInput: {
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveStatus: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  displayButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  removeDisplayButton: {
    backgroundColor: '#F59E0B',
  },
  displayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  storeButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  storeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginPrompt: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  statusValue: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  updateStatusButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  updateStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusModalContent: {
    padding: 20,
  },
  statusModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  statusOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  statusNotesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  statusModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusCancelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusConfirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusConfirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  statusConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default UnifiedDetailModal;