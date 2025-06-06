// Go_BARRY/components/AIDisruptionManager.jsx
// Phase 3: AI-Assisted Diversion & Messaging System

import React, { useState, useEffect } from 'react';
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

// Common diversion routes and closure points for Go North East
const DIVERSION_KNOWLEDGE_BASE = {
  'Newcastle City Centre': {
    diversions: [
      {
        reason: 'Grainger Street closure',
        suggestion: 'Use Clayton Street and Collingwood Street',
        affectedServices: ['Q3', '10', '21', '22'],
        estimatedDelay: '5-10 minutes'
      },
      {
        reason: 'Grey Street closure',
        suggestion: 'Via Blackett Street and Grainger Street',
        affectedServices: ['Q3', '56', '57'],
        estimatedDelay: '3-7 minutes'
      }
    ]
  },
  'Gateshead': {
    diversions: [
      {
        reason: 'High Street closure',
        suggestion: 'Use Swinburne Street and Jackson Street',
        affectedServices: ['21', '28', '29'],
        estimatedDelay: '8-12 minutes'
      }
    ]
  },
  'Tyne Bridge': {
    diversions: [
      {
        reason: 'Bridge closure',
        suggestion: 'Use Redheugh Bridge or King Edward VII Bridge',
        affectedServices: ['Q3', '21', '22', '28', '29'],
        estimatedDelay: '15-25 minutes'
      }
    ]
  },
  'A1 Western Bypass': {
    diversions: [
      {
        reason: 'Carriageway closure',
        suggestion: 'Use A189 Coast Road or A19',
        affectedServices: ['X84', 'X85', '57', '58'],
        estimatedDelay: '20-30 minutes'
      }
    ]
  }
};

// Message templates for different channels
const MESSAGE_TEMPLATES = {
  driver: {
    roadwork: "SERVICE ALERT: {route} - Roadworks at {location}. Use diversion via {diversion}. Est. delay {delay}. Update passengers.",
    incident: "URGENT: {route} - Traffic incident at {location}. Expect delays of {delay}. Follow diversion via {diversion}.",
    closure: "ROUTE CHANGE: {route} - {location} closed. Temporary diversion via {diversion}. Monitor for updates."
  },
  passenger: {
    roadwork: "🚧 {route} Service Update: Delays expected due to roadworks at {location}. We're using a temporary diversion. Extra journey time: {delay}.",
    incident: "⚠️ {route} Service Alert: Traffic incident at {location} is causing delays of approximately {delay}. Thank you for your patience.",
    closure: "🔄 {route} Route Change: Due to road closure at {location}, we're using a temporary diversion. Please allow extra time."
  },
  social: {
    roadwork: "🚧 SERVICE UPDATE: {route} services experiencing delays due to roadworks at {location}. Alternative routes in use. Extra time needed: {delay} #GoNorthEast",
    incident: "⚠️ TRAVEL ALERT: {route} services delayed due to incident at {location}. Our drivers are using diversions where possible. Delay: {delay} #TrafficUpdate",
    closure: "🔄 ROUTE CHANGE: {route} services using temporary diversion due to closure at {location}. Please check live times for updates #ServiceAlert"
  }
};

const AIDisruptionManager = ({ baseUrl }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    hasPermission, 
    logActivity 
  } = useSupervisorSession();

  // State management
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDiversionModal, setShowDiversionModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // AI suggestions state
  const [suggestedDiversions, setSuggestedDiversions] = useState([]);
  const [suggestedMessages, setSuggestedMessages] = useState({});
  const [selectedDiversion, setSelectedDiversion] = useState(null);
  
  // Custom inputs
  const [customDiversion, setCustomDiversion] = useState('');
  const [customMessages, setCustomMessages] = useState({
    driver: '',
    passenger: '',
    social: ''
  });

  // Learning system
  const [diversionFeedback, setDiversionFeedback] = useState([]);

  // API base URL
  const API_BASE = baseUrl || (isWeb 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  // Load incidents on mount
  useEffect(() => {
    loadActiveIncidents();
  }, []);

  const loadActiveIncidents = async () => {
    setLoading(true);
    try {
      // For now, use mock data. In production, this would come from the backend
      const mockIncidents = [
        {
          id: 'inc_001',
          type: 'roadwork',
          location: 'Newcastle City Centre - Grainger Street',
          coordinates: { latitude: 54.9738, longitude: -1.6131 },
          affectsRoutes: ['Q3', '10', '21', '22'],
          severity: 'High',
          description: 'Gas works causing lane closure',
          startTime: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'inc_002', 
          type: 'incident',
          location: 'A19 Southbound - Silverlink',
          coordinates: { latitude: 55.0344, longitude: -1.4862 },
          affectsRoutes: ['1', '2', '307'],
          severity: 'Medium',
          description: 'Traffic accident blocking one lane',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ];
      setIncidents(mockIncidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI Diversion Suggestion Engine
  const generateDiversionSuggestions = (incident) => {
    const suggestions = [];
    
    // Check knowledge base for location-specific diversions
    const locationKey = Object.keys(DIVERSION_KNOWLEDGE_BASE).find(location => 
      incident.location.toLowerCase().includes(location.toLowerCase())
    );
    
    if (locationKey) {
      const knownDiversions = DIVERSION_KNOWLEDGE_BASE[locationKey].diversions;
      suggestions.push(...knownDiversions);
    }
    
    // Rule-based suggestions based on incident type and location
    if (incident.type === 'roadwork') {
      suggestions.push({
        reason: 'Roadworks detected',
        suggestion: 'Use alternative parallel route where available',
        affectedServices: incident.affectsRoutes,
        estimatedDelay: '10-15 minutes',
        confidence: 'medium'
      });
    }
    
    if (incident.location.includes('Bridge')) {
      suggestions.push({
        reason: 'Bridge closure/restriction',
        suggestion: 'Use alternative river crossing',
        affectedServices: incident.affectsRoutes,
        estimatedDelay: '15-25 minutes',
        confidence: 'high'
      });
    }
    
    if (incident.location.includes('A1') || incident.location.includes('A19')) {
      suggestions.push({
        reason: 'Major route disruption',
        suggestion: 'Use local roads with extended journey time',
        affectedServices: incident.affectsRoutes,
        estimatedDelay: '20-30 minutes',
        confidence: 'high'
      });
    }
    
    return suggestions;
  };

  // AI Message Generation
  const generateMessages = (incident, diversion) => {
    const messages = {};
    
    Object.entries(MESSAGE_TEMPLATES).forEach(([channel, templates]) => {
      const template = templates[incident.type] || templates.incident;
      
      messages[channel] = template
        .replace('{route}', incident.affectsRoutes.join('/'))
        .replace('{location}', incident.location)
        .replace('{diversion}', diversion?.suggestion || 'alternative route')
        .replace('{delay}', diversion?.estimatedDelay || '10-15 minutes');
    });
    
    return messages;
  };

  // Handle diversion selection
  const selectDiversion = (incident) => {
    setSelectedIncident(incident);
    const suggestions = generateDiversionSuggestions(incident);
    setSuggestedDiversions(suggestions);
    setSelectedDiversion(null);
    setCustomDiversion('');
    setShowDiversionModal(true);
  };

  // Handle message generation
  const generateMessagesForIncident = (incident, diversion) => {
    setSelectedIncident(incident);
    setSelectedDiversion(diversion);
    const messages = generateMessages(incident, diversion);
    setSuggestedMessages(messages);
    setCustomMessages(messages);
    setShowMessageModal(true);
  };

  // Save diversion feedback for learning
  const saveDiversionFeedback = (incident, diversion, wasUsed, effectiveness) => {
    const feedback = {
      incidentId: incident.id,
      incidentType: incident.type,
      location: incident.location,
      suggestedDiversion: diversion.suggestion,
      wasUsed,
      effectiveness,
      timestamp: new Date().toISOString(),
      supervisorId: supervisorName
    };
    
    setDiversionFeedback(prev => [...prev, feedback]);
    
    logActivity(
      'DIVERSION_FEEDBACK',
      `Rated diversion "${diversion.suggestion}" as ${effectiveness} for ${incident.location}`,
      incident.id
    );
  };

  // Apply diversion
  const applyDiversion = () => {
    if (!selectedIncident || (!selectedDiversion && !customDiversion)) {
      alert('Please select or enter a diversion');
      return;
    }

    const finalDiversion = selectedDiversion || {
      suggestion: customDiversion,
      estimatedDelay: '10-15 minutes',
      reason: 'Custom diversion'
    };

    logActivity(
      'APPLY_DIVERSION',
      `Applied diversion for ${selectedIncident.location}: ${finalDiversion.suggestion}`,
      selectedIncident.id
    );

    setShowDiversionModal(false);
    
    // Automatically open message generation
    generateMessagesForIncident(selectedIncident, finalDiversion);
  };

  // Send messages
  const sendMessages = () => {
    if (!selectedIncident) return;

    // In production, this would integrate with actual messaging systems
    logActivity(
      'SEND_MESSAGES',
      `Sent disruption messages for ${selectedIncident.location}`,
      selectedIncident.id
    );

    alert('Messages sent successfully to all channels');
    setShowMessageModal(false);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text style={styles.unauthorizedTitle}>Supervisor Access Required</Text>
        <Text style={styles.unauthorizedText}>
          Please log in as a supervisor to access AI disruption management
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🤖 AI Disruption Manager</Text>
          <Text style={styles.subtitle}>Smart diversions & automated messaging</Text>
        </View>
      </View>

      {/* AI Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Active Incidents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{suggestedDiversions.length}</Text>
          <Text style={styles.statLabel}>AI Suggestions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{diversionFeedback.length}</Text>
          <Text style={styles.statLabel}>Learning Data</Text>
        </View>
      </View>

      {/* Incidents List */}
      <ScrollView style={styles.incidentsList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading incidents...</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>No incidents requiring AI assistance at this time.</Text>
          </View>
        ) : (
          incidents.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <View style={styles.incidentInfo}>
                  <Text style={styles.incidentLocation}>{incident.location}</Text>
                  <Text style={styles.incidentType}>
                    {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                  </Text>
                </View>
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>{incident.severity}</Text>
                </View>
              </View>

              <Text style={styles.incidentDescription}>{incident.description}</Text>

              <View style={styles.routesContainer}>
                <Text style={styles.routesLabel}>Affected Routes:</Text>
                <View style={styles.routesList}>
                  {incident.affectsRoutes.map((route, index) => (
                    <View key={index} style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.diversionButton}
                  onPress={() => selectDiversion(incident)}
                >
                  <Ionicons name="map" size={20} color="#3B82F6" />
                  <Text style={styles.diversionButtonText}>AI Diversion</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => generateMessagesForIncident(incident, null)}
                >
                  <Ionicons name="chatbubbles" size={20} color="#10B981" />
                  <Text style={styles.messageButtonText}>AI Messages</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Diversion Selection Modal */}
      <Modal
        visible={showDiversionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDiversionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Diversion Suggestions</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDiversionModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedIncident && (
              <View style={styles.incidentSummary}>
                <Text style={styles.summaryTitle}>{selectedIncident.location}</Text>
                <Text style={styles.summaryDescription}>{selectedIncident.description}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>AI-Generated Suggestions</Text>
            
            {suggestedDiversions.map((diversion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.diversionCard,
                  selectedDiversion === diversion && styles.diversionCardSelected
                ]}
                onPress={() => setSelectedDiversion(diversion)}
              >
                <View style={styles.diversionHeader}>
                  <Text style={styles.diversionReason}>{diversion.reason}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {diversion.confidence || 'medium'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.diversionSuggestion}>{diversion.suggestion}</Text>
                <Text style={styles.diversionDelay}>
                  Estimated delay: {diversion.estimatedDelay}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Custom Diversion</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Enter custom diversion route..."
              value={customDiversion}
              onChangeText={setCustomDiversion}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDiversionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  (!selectedDiversion && !customDiversion) && styles.applyButtonDisabled
                ]}
                onPress={applyDiversion}
                disabled={!selectedDiversion && !customDiversion}
              >
                <Text style={styles.applyButtonText}>Apply & Generate Messages</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Message Generation Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI-Generated Messages</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMessageModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Driver Message */}
            <View style={styles.messageSection}>
              <View style={styles.messageHeader}>
                <Ionicons name="car" size={20} color="#3B82F6" />
                <Text style={styles.messageChannelTitle}>Driver/Crew (Ticketer)</Text>
              </View>
              <TextInput
                style={styles.messageTextArea}
                value={customMessages.driver}
                onChangeText={(text) => setCustomMessages(prev => ({ ...prev, driver: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Passenger Message */}
            <View style={styles.messageSection}>
              <View style={styles.messageHeader}>
                <Ionicons name="people" size={20} color="#10B981" />
                <Text style={styles.messageChannelTitle}>Passenger Info (Website/App)</Text>
              </View>
              <TextInput
                style={styles.messageTextArea}
                value={customMessages.passenger}
                onChangeText={(text) => setCustomMessages(prev => ({ ...prev, passenger: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Social Media Message */}
            <View style={styles.messageSection}>
              <View style={styles.messageHeader}>
                <Ionicons name="share-social" size={20} color="#8B5CF6" />
                <Text style={styles.messageChannelTitle}>Social Media</Text>
              </View>
              <TextInput
                style={styles.messageTextArea}
                value={customMessages.social}
                onChangeText={(text) => setCustomMessages(prev => ({ ...prev, social: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => alert('Preview functionality would show formatted messages')}
              >
                <Ionicons name="eye" size={20} color="#6B7280" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessages}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send All Messages</Text>
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  incidentType: {
    fontSize: 14,
    color: '#6B7280',
  },
  severityBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  routesContainer: {
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  diversionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  diversionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
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
  incidentSummary: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  diversionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  diversionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  diversionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diversionReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confidenceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  diversionSuggestion: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  diversionDelay: {
    fontSize: 12,
    color: '#6B7280',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  messageChannelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  messageTextArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
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
  applyButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AIDisruptionManager;
