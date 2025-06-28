// components/AlertDetailModal.jsx
// Enhanced alert detail view with map, route selection, and diversion management
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

// Message templates for rule-based diversions
const MESSAGE_TEMPLATES = {
  road_closure: {
    pattern: "Service {routes} diverted via {diversion_route} due to road closure at {location}",
    defaultDiversion: "alternative route"
  },
  roadworks: {
    pattern: "Service {routes} diverted via {diversion_route} due to roadworks on {location}",
    defaultDiversion: "A690 and city centre"
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

// Common diversion patterns based on location
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

const AlertDetailModal = ({ 
  visible, 
  onClose, 
  alert, 
  onUpdateAlert,
  onDismissAlert,
  onPushToDisplay 
}) => {
  const { supervisorSession } = useSupervisorSession();
  const { pushToDisplay, dismissFromDisplay } = useConvexSync();
  
  // Local state
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [diversionText, setDiversionText] = useState('');
  const [driverMessage, setDriverMessage] = useState('');
  const [suggestedRoutes, setSuggestedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Initialize state when alert changes
  useEffect(() => {
    if (alert) {
      setEditedTitle(alert.title || '');
      setSelectedRoutes(alert.affectsRoutes || []);
      setDiversionText('');
      setDriverMessage('');
      setSaveStatus('');
      
      // Get suggested routes from GTFS matcher
      if (alert.coordinates) {
        fetchSuggestedRoutes();
      }
      
      // Generate initial diversion message
      generateInitialMessages();
    }
  }, [alert]);

  // Enhanced GTFS route matching
  const fetchSuggestedRoutes = async () => {
    try {
      if (!alert.coordinates || alert.coordinates.length < 2) return;
      
      const [lat, lng] = alert.coordinates;
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/gtfs/match/enhanced?` +
        `lat=${lat}&lng=${lng}&radius=1000&includeDirections=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Enhanced GTFS match results:', data);
        
        // Sort by proximity and confidence
        const sortedRoutes = (data.matches || [])
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
    } catch (error) {
      console.error('❌ GTFS matching failed:', error);
    }
  };

  // Generate initial messages based on alert type and location
  const generateInitialMessages = () => {
    if (!alert) return;
    
    // Determine alert type from title/description
    const alertType = detectAlertType(alert);
    const template = MESSAGE_TEMPLATES[alertType] || MESSAGE_TEMPLATES.road_closure;
    
    // Extract location context
    const locationContext = extractLocationContext(alert.location);
    const suggestedDiversion = getSuggestedDiversion(locationContext, alertType);
    
    // Generate driver message
    const routes = alert.affectsRoutes?.join(', ') || 'affected services';
    const message = template.pattern
      .replace('{routes}', routes)
      .replace('{location}', alert.location || 'location')
      .replace('{diversion_route}', suggestedDiversion);
      
    setDriverMessage(message);
    setDiversionText(suggestedDiversion);
  };

  // Detect alert type from content
  const detectAlertType = (alert) => {
    const text = `${alert.title} ${alert.description}`.toLowerCase();
    
    if (text.includes('closure') || text.includes('closed')) return 'road_closure';
    if (text.includes('roadwork') || text.includes('works')) return 'roadworks';
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

  // Get suggested diversion based on location and alert type
  const getSuggestedDiversion = (locationContext, alertType) => {
    const pattern = DIVERSION_PATTERNS[locationContext];
    if (pattern && pattern.diversions.length > 0) {
      // Return most appropriate diversion for alert type
      if (alertType === 'roadworks') {
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
    if (selectedRoutes.length > 0 && alert) {
      const alertType = detectAlertType(alert);
      const template = MESSAGE_TEMPLATES[alertType];
      
      const updatedMessage = template.pattern
        .replace('{routes}', selectedRoutes.join(', '))
        .replace('{location}', alert.location || 'location')
        .replace('{diversion_route}', diversionText || template.defaultDiversion);
        
      setDriverMessage(updatedMessage);
    }
  }, [selectedRoutes, diversionText, alert]);

  // Save changes to alert
  const handleSaveChanges = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to save changes');
      return;
    }
    
    setLoading(true);
    setSaveStatus('Saving...');
    
    try {
      // Update alert title if changed
      if (editedTitle !== alert.title) {
        // Call backend API to update alert
        const response = await fetch(`${API_CONFIG.baseURL}/api/alerts/${alert.id}/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editedTitle,
            updatedBy: supervisorSession.supervisor.badge,
            timestamp: Date.now()
          })
        });
        
        if (!response.ok) throw new Error('Failed to update alert title');
      }
      
      // Update affected routes if changed
      if (JSON.stringify(selectedRoutes) !== JSON.stringify(alert.affectsRoutes)) {
        const response = await fetch(`${API_CONFIG.baseURL}/api/alerts/${alert.id}/routes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affectsRoutes: selectedRoutes,
            updatedBy: supervisorSession.supervisor.badge,
            timestamp: Date.now()
          })
        });
        
        if (!response.ok) throw new Error('Failed to update affected routes');
      }
      
      setSaveStatus('✅ Saved successfully');
      
      if (onUpdateAlert) {
        onUpdateAlert({
          ...alert,
          title: editedTitle,
          affectsRoutes: selectedRoutes
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

  // Handle dismiss alert
  const handleDismissAlert = async () => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in to dismiss alerts');
      return;
    }
    
    Alert.alert(
      'Dismiss Alert',
      'Are you sure you want to dismiss this alert? It will be removed from all displays.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dismissFromDisplay({
                alertId: alert.alertId || alert.id,
                sessionId: supervisorSession.sessionId,
                reason: 'Not relevant/resolved'
              });
              
              if (result.success) {
                if (onDismissAlert) onDismissAlert(alert);
                onClose();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to dismiss alert');
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
      const result = await pushToDisplay({
        alertId: alert.alertId || alert.id,
        sessionId: supervisorSession.sessionId,
        notes: `${editedTitle} - ${diversionText || 'Major disruption'}`
      });
      
      if (result.success) {
        Alert.alert('Success', 'Alert pushed to control room display');
        if (onPushToDisplay) onPushToDisplay(alert);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to push to display');
    }
  };

  // Store diversion for future use
  const handleStoreDiversion = async () => {
    if (!diversionText || selectedRoutes.length === 0) {
      Alert.alert('Error', 'Please select routes and enter diversion details');
      return;
    }
    
    try {
      const diversionData = {
        location: alert.location,
        routes: selectedRoutes,
        diversion: diversionText,
        message: driverMessage,
        alertType: detectAlertType(alert),
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

  if (!visible || !alert) return null;

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
            <Text style={styles.headerTitle}>Alert Details</Text>
            <Text style={styles.headerSubtitle}>
              {alert.source} • {alert.severity?.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Editable Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert Title</Text>
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Enter alert title..."
              multiline
              editable={!!supervisorSession}
            />
            {editedTitle !== alert.title && (
              <Text style={styles.changeIndicator}>• Modified</Text>
            )}
          </View>

          {/* Location & Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Map</Text>
            <Text style={styles.locationText}>📍 {alert.location}</Text>
            {alert.coordinates && alert.coordinates.length >= 2 && (
              <View style={styles.mapContainer}>
                <TomTomTrafficMap
                  alerts={[alert]}
                  currentAlert={alert}
                  alertIndex={0}
                  showRoadworks={true}
                  showAffectedRoutes={true}
                />
              </View>
            )}
            {(!alert.coordinates || alert.coordinates.length < 2) && (
              <View style={styles.noMapContainer}>
                <Text style={styles.noMapText}>No coordinates available for map display</Text>
              </View>
            )}
          </View>

          {/* Route Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Affected Routes</Text>
            
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
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleDismissAlert}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.dismissButtonText}>Dismiss Alert</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.displayButton}
                    onPress={handlePushToDisplay}
                  >
                    <Ionicons name="tv" size={20} color="#FFFFFF" />
                    <Text style={styles.displayButtonText}>Push to Display</Text>
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
                  Please log in as a supervisor to manage this alert
                </Text>
              </View>
            )}
          </View>

          {/* Spacing for scroll */}
          <View style={{ height: 50 }} />
        </ScrollView>
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
});

export default AlertDetailModal;