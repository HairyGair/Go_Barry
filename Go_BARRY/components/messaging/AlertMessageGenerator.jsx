// components/messaging/AlertMessageGenerator.jsx
// Alert-to-Message Generator for Go BARRY Message Distribution Centre
// Converts active alerts and roadworks into formatted messages

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';
import RouteImpactAnalyzer from './RouteImpactAnalyzer';
import DiversionSuggestions from './DiversionSuggestions';

const AlertMessageGenerator = ({ visible, onClose, onMessageGenerated, alertType = 'roadwork' }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [customRoutes, setCustomRoutes] = useState('');
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [showRouteAnalysis, setShowRouteAnalysis] = useState(false);
  const [showDiversionSuggestions, setShowDiversionSuggestions] = useState(false);
  const [selectedDiversions, setSelectedDiversions] = useState([]);

  // Load alerts when modal opens
  useEffect(() => {
    if (visible) {
      loadAlerts();
    }
  }, [visible, alertType]);

  // Load active alerts/roadworks
  const loadAlerts = async () => {
    setLoading(true);
    try {
      const endpoint = alertType === 'roadwork' 
        ? '/api/messages/active-roadworks'
        : '/api/messages/active-alerts';
      
      // Make API call to backend
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        const alertData = alertType === 'roadwork' ? data.roadworks : data.alerts;
        setAlerts(alertData);
      } else {
        console.error('API error:', data.error);
        // Fall back to mock data if API fails
        const mockAlerts = alertType === 'roadwork' ? [
        {
          id: 'RW001',
          location: 'High Level Bridge, Newcastle',
          description: 'Police incident causing full closure',
          severity: 'high',
          startDate: new Date(),
          endDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          authority: 'Northumbria Police',
          coordinates: { lat: 54.9693, lng: -1.6102 },
          status: 'active'
        },
        {
          id: 'RW002', 
          location: 'A1 Northbound, Team Valley',
          description: 'Lane closures for emergency repairs',
          severity: 'medium',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          authority: 'National Highways',
          coordinates: { lat: 54.9245, lng: -1.6048 },
          status: 'active'
        },
        {
          id: 'RW003',
          location: 'Central Station Bridge',
          description: 'Planned maintenance work',
          severity: 'low',
          startDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
          endDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
          authority: 'Newcastle City Council',
          coordinates: { lat: 54.9675, lng: -1.6125 },
          status: 'scheduled'
        }
      ] : [
        {
          id: 'INC001',
          location: 'A19 Southbound, Tyne Tunnel approach',
          description: 'Multi-vehicle collision',
          severity: 'high',
          timestamp: new Date(),
          duration: '2-3 hours estimated',
          source: 'Traffic England',
          coordinates: { lat: 54.9785, lng: -1.5234 },
          status: 'active'
        },
        {
          id: 'INC002',
          location: 'Newcastle City Centre, Grey Street',
          description: 'Gas leak emergency',
          severity: 'high',
          timestamp: new Date(),
          duration: 'Unknown',
          source: 'Emergency Services',
          coordinates: { lat: 54.9738, lng: -1.6131 },
          status: 'active'
        }
      ];

        setAlerts(mockAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      Alert.alert('Error', 'Failed to load active alerts');
    } finally {
      setLoading(false);
    }
  };

  // Generate route suggestions based on alert location
  const generateRouteSuggestions = (alert) => {
    // Mock route analysis - replace with actual GTFS integration
    const routeMap = {
      'High Level Bridge': ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
      'A1': ['21', 'X21', '309', '310', '311', '685'],
      'Central Station': ['10', '11', '12', '21', '56', '57', '58'],
      'A19': ['1', '309', '310', '311', '19'],
      'Grey Street': ['1', '12', '21', 'Q3', '56', '57']
    };

    // Find matching routes based on location keywords
    const suggestions = [];
    Object.entries(routeMap).forEach(([location, routes]) => {
      if (alert.location.toLowerCase().includes(location.toLowerCase())) {
        suggestions.push(...routes);
      }
    });

    // Remove duplicates and sort
    const uniqueSuggestions = [...new Set(suggestions)].sort((a, b) => {
      // Prioritize numeric routes, then alphanumeric
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return a.localeCompare(b);
    });

    return uniqueSuggestions.slice(0, 12); // Limit to 12 suggestions
  };

  // Generate message content based on alert (Enhanced for Phase 5)
  const generateMessageContent = (alert, routes) => {
    const isRoadwork = alertType === 'roadwork';
    const urgencyMap = { high: 'URGENT', medium: 'IMPORTANT', low: 'NOTICE' };
    const urgencyLevel = urgencyMap[alert.severity] || 'NOTICE';
    
    let subject, content;

    if (isRoadwork) {
      subject = `${urgencyLevel}: ${alert.location} - ${alert.description}`;
      
      content = `${urgencyLevel} ROADWORK NOTIFICATION

Location: ${alert.location}
Description: ${alert.description}
Authority: ${alert.authority}
Duration: ${alert.startDate.toLocaleString('en-GB')} to ${alert.endDate.toLocaleString('en-GB')}
Severity: ${alert.severity.toUpperCase()}

${routes.length > 0 ? `Affected Routes: ${routes.join(', ')}` : 'Routes: To be confirmed'}

${alert.severity === 'high' ? 
  'IMMEDIATE ACTION REQUIRED: All affected services should implement diversions immediately.' :
  'Please monitor and implement diversions as necessary.'
}

${generateDiversionInstructions(alert)}

${generateSmartDiversionText()}

We will provide updates as more information becomes available.

Thank you.`;
    } else {
      subject = `${urgencyLevel}: Traffic Incident - ${alert.location}`;
      
      content = `${urgencyLevel} TRAFFIC INCIDENT ALERT

Location: ${alert.location}
Incident: ${alert.description}
Reported: ${alert.timestamp.toLocaleString('en-GB')}
Estimated Duration: ${alert.duration}
Source: ${alert.source}

${routes.length > 0 ? `Potentially Affected Routes: ${routes.join(', ')}` : 'Route Impact: Under assessment'}

${alert.severity === 'high' ? 
  'SIGNIFICANT DELAYS EXPECTED: Consider alternative routes and inform passengers.' :
  'Monitor situation and adjust services as needed.'
}

${generateSmartDiversionText()}

Please advise drivers to expect delays and use alternative routes where possible.

Updates will follow as the situation develops.

Thank you.`;
    }

    return { subject, content };
  };

  // Generate smart diversion text based on selected diversions (Phase 5 Enhancement)
  const generateSmartDiversionText = () => {
    if (selectedDiversions.length === 0) {
      return '';
    }

    let diversionText = '\nRECOMMENDED DIVERSIONS:\n';
    
    selectedDiversions.forEach(diversion => {
      diversionText += `• ${diversion.title}: ${diversion.description}\n`;
      if (diversion.estimatedDelay && diversion.estimatedDelay !== 'Similar timing') {
        diversionText += `  Expected delay: ${diversion.estimatedDelay}\n`;
      }
    });

    return diversionText;
  };

  // Generate diversion instructions
  const generateDiversionInstructions = (alert) => {
    const location = alert.location.toLowerCase();
    
    if (location.includes('high level bridge')) {
      return `Diversion Instructions:
- Services to/from Eldon Square: Start/terminate at Central Station
- Gateshead connections: Suspended during closure
- Alternative: Direct customers to Four Lane Ends for Metro connections
- Pedestrians: Advise against walking over bridge during closure`;
    }
    
    if (location.includes('a1')) {
      return `Diversion Instructions:
- Use A19 as primary alternative route
- Monitor traffic conditions on A184 and A167
- Allow extra journey time
- Keep passengers informed of delays`;
    }
    
    if (location.includes('central station')) {
      return `Diversion Instructions:
- Services may need to terminate at alternative stops
- Check accessibility of station entrance/exit points
- Coordinate with Metro services for passenger transfers`;
    }
    
    return `Diversion Instructions:
- Assess alternative routes based on local knowledge
- Monitor traffic conditions continuously
- Keep passengers informed of any changes
- Coordinate with traffic management as needed`;
  };

  // Handle alert selection
  const handleAlertSelect = (alert) => {
    setSelectedAlert(alert);
    const suggestions = generateRouteSuggestions(alert);
    setSuggestedRoutes(suggestions);
    setSelectedRoutes([]); // Reset selected routes
    setCustomRoutes('');
    setSelectedDiversions([]); // Reset diversions
  };

  // Handle enhanced route analysis results
  const handleRouteAnalysisComplete = (analysisData) => {
    setSelectedRoutes(analysisData.selectedRoutes);
    setShowRouteAnalysis(false);
    
    // Show diversion suggestions based on analysis
    if (analysisData.selectedRoutes.length > 0) {
      setShowDiversionSuggestions(true);
    }
  };

  // Handle diversion suggestions selection
  const handleDiversionSuggestionsSelected = (diversionData) => {
    setSelectedDiversions(diversionData.selectedSuggestions);
    setShowDiversionSuggestions(false);
  };

  // Handle route selection
  const toggleRouteSelection = (route) => {
    setSelectedRoutes(prev => 
      prev.includes(route) 
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  // Generate final message
  const handleGenerateMessage = () => {
    if (!selectedAlert) {
      Alert.alert('Error', 'Please select an alert first');
      return;
    }

    // Combine selected routes with custom routes
    const customRouteList = customRoutes
      .split(',')
      .map(r => r.trim())
      .filter(r => r);
    
    const allRoutes = [...new Set([...selectedRoutes, ...customRouteList])];
    
    const messageData = generateMessageContent(selectedAlert, allRoutes);
    setGeneratedMessage({
      ...messageData,
      routes: allRoutes,
      alertId: selectedAlert.id,
      alertType,
      priority: selectedAlert.severity === 'high' ? 'urgent' : 'normal',
      category: alertType === 'roadwork' ? 'roadworks' : 'incident'
    });
    
    setShowMessagePreview(true);
  };

  // Confirm and use message
  const handleUseMessage = () => {
    if (generatedMessage && onMessageGenerated) {
      onMessageGenerated(generatedMessage);
    }
    handleClose();
  };

  // Close modal and reset state
  const handleClose = () => {
    setSelectedAlert(null);
    setGeneratedMessage(null);
    setSuggestedRoutes([]);
    setSelectedRoutes([]);
    setCustomRoutes('');
    setShowMessagePreview(false);
    onClose();
  };

  // Render alert card
  const renderAlertCard = (alert) => (
    <TouchableOpacity
      key={alert.id}
      style={[
        styles.alertCard,
        selectedAlert?.id === alert.id && styles.alertCardSelected
      ]}
      onPress={() => handleAlertSelect(alert)}
    >
      <View style={styles.alertHeader}>
        <View style={[
          styles.severityIndicator,
          { backgroundColor: 
            alert.severity === 'high' ? '#FEE2E2' :
            alert.severity === 'medium' ? '#FEF3C7' : '#DBEAFE'
          }
        ]}>
          <Ionicons
            name={alert.severity === 'high' ? 'warning' : 'information-circle'}
            size={16}
            color={
              alert.severity === 'high' ? '#DC2626' :
              alert.severity === 'medium' ? '#F59E0B' : '#2563EB'
            }
          />
        </View>
        <Text style={styles.alertStatus}>{alert.status.toUpperCase()}</Text>
      </View>
      
      <Text style={styles.alertLocation}>{alert.location}</Text>
      <Text style={styles.alertDescription}>{alert.description}</Text>
      
      <View style={styles.alertMeta}>
        {alertType === 'roadwork' ? (
          <>
            <Text style={styles.alertTime}>
              {alert.startDate.toLocaleString('en-GB')} - {alert.endDate.toLocaleString('en-GB')}
            </Text>
            <Text style={styles.alertAuthority}>{alert.authority}</Text>
          </>
        ) : (
          <>
            <Text style={styles.alertTime}>
              Reported: {alert.timestamp.toLocaleString('en-GB')}
            </Text>
            <Text style={styles.alertDuration}>Duration: {alert.duration}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render enhanced route selection (Phase 5)
  const renderRouteSelection = () => (
    <View style={styles.routeSelection}>
      <Text style={styles.sectionTitle}>Select Affected Routes</Text>
      
      {/* Smart Analysis Button */}
      <TouchableOpacity
        style={styles.smartAnalysisButton}
        onPress={() => setShowRouteAnalysis(true)}
      >
        <Ionicons name="analytics" size={20} color="#2563EB" />
        <Text style={styles.smartAnalysisText}>Smart Route Analysis</Text>
        <View style={styles.aiLabel}>
          <Text style={styles.aiLabelText}>AI</Text>
        </View>
      </TouchableOpacity>
      
      {suggestedRoutes.length > 0 && (
        <View style={styles.routeSection}>
          <Text style={styles.routeSubtitle}>Suggested Routes (based on location)</Text>
          <View style={styles.routeGrid}>
            {suggestedRoutes.map((route) => (
              <TouchableOpacity
                key={route}
                style={[
                  styles.routeChip,
                  selectedRoutes.includes(route) && styles.routeChipSelected
                ]}
                onPress={() => toggleRouteSelection(route)}
              >
                <Text style={[
                  styles.routeChipText,
                  selectedRoutes.includes(route) && styles.routeChipTextSelected
                ]}>
                  {route}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.routeSection}>
        <Text style={styles.routeSubtitle}>Additional Routes (comma-separated)</Text>
        <TextInput
          style={styles.routeInput}
          value={customRoutes}
          onChangeText={setCustomRoutes}
          placeholder="e.g., 335, X12, 74"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Diversion Suggestions Button */}
      {selectedRoutes.length > 0 && (
        <TouchableOpacity
          style={styles.diversionButton}
          onPress={() => setShowDiversionSuggestions(true)}
        >
          <Ionicons name="swap-horizontal" size={20} color="#10B981" />
          <Text style={styles.diversionButtonText}>
            Get Diversion Suggestions ({selectedDiversions.length} selected)
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.routeNote}>
        Selected routes: {selectedRoutes.length > 0 ? selectedRoutes.join(', ') : 'None'}
      </Text>

      {selectedDiversions.length > 0 && (
        <View style={styles.selectedDiversions}>
          <Text style={styles.diversionTitle}>Selected Diversions:</Text>
          {selectedDiversions.map((diversion, index) => (
            <Text key={index} style={styles.diversionItem}>
              • {diversion.title}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Render message preview modal
  const renderMessagePreview = () => (
    <Modal
      visible={showMessagePreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMessagePreview(false)}
    >
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Generated Message Preview</Text>
            <TouchableOpacity onPress={() => setShowMessagePreview(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {generatedMessage && (
            <ScrollView style={styles.previewContent}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Subject:</Text>
                <Text style={styles.previewSubject}>{generatedMessage.subject}</Text>
              </View>
              
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Message Content:</Text>
                <ScrollView style={styles.previewMessageContainer}>
                  <Text style={styles.previewMessage}>{generatedMessage.content}</Text>
                </ScrollView>
              </View>
              
              <View style={styles.previewMeta}>
                <Text style={styles.previewMetaText}>
                  Routes: {generatedMessage.routes.join(', ') || 'None specified'}
                </Text>
                <Text style={styles.previewMetaText}>
                  Priority: {generatedMessage.priority}
                </Text>
                <Text style={styles.previewMetaText}>
                  Category: {generatedMessage.category}
                </Text>
              </View>
            </ScrollView>
          )}
          
          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setShowMessagePreview(false)}
            >
              <Text style={styles.previewButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewButton, styles.previewButtonPrimary]}
              onPress={handleUseMessage}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.previewButtonTextPrimary}>Use This Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {alertType === 'roadwork' ? 'Create Message from Roadwork' : 'Create Message from Incident'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Select an active {alertType} and generate a formatted message
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading active {alertType}s...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Active {alertType === 'roadwork' ? 'Roadworks' : 'Incidents'}
              </Text>
              {alerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>
                    No active {alertType}s found
                  </Text>
                </View>
              ) : (
                alerts.map(renderAlertCard)
              )}
            </View>

            {selectedAlert && (
              <>
                {renderRouteSelection()}
                
                <View style={styles.generateSection}>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={handleGenerateMessage}
                  >
                    <Ionicons name="create" size={20} color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>Generate Message</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        )}

        {renderMessagePreview()}

        {/* Route Impact Analysis Modal */}
        <Modal
          visible={showRouteAnalysis}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowRouteAnalysis(false)}
        >
          <RouteImpactAnalyzer
            location={selectedAlert?.location}
            onRoutesAnalyzed={handleRouteAnalysisComplete}
            visible={showRouteAnalysis}
            radius={1000}
          />
        </Modal>

        {/* Diversion Suggestions Modal */}
        <Modal
          visible={showDiversionSuggestions}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowDiversionSuggestions(false)}
        >
          <DiversionSuggestions
            location={selectedAlert?.location}
            affectedRoutes={selectedRoutes}
            onSuggestionsSelected={handleDiversionSuggestionsSelected}
            visible={showDiversionSuggestions}
          />
        </Modal>
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  alertCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  alertStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  alertLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  alertMeta: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  alertAuthority: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeSelection: {
    marginBottom: 24,
  },
  routeSection: {
    marginBottom: 16,
  },
  routeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  routeChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  routeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  routeChipTextSelected: {
    color: '#FFFFFF',
  },
  routeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  routeNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  generateSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Preview modal styles
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewContent: {
    padding: 20,
    flex: 1,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewMessageContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  previewMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  previewMeta: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  previewMetaText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  previewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  previewButtonPrimary: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  previewButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Phase 5 Smart Analysis Styles
  smartAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  smartAnalysisText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    flex: 1,
  },
  aiLabel: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Diversion Button Styles
  diversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  diversionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  
  // Selected Diversions Display
  selectedDiversions: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  diversionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  diversionItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
});

export default AlertMessageGenerator;