// Go_BARRY/components/AIDisruptionManager.jsx
// AI-Powered Disruption Management Interface
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const AIDisruptionManager = ({ baseUrl }) => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [loading, setLoading] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [messagesResult, setMessagesResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Form state for disruption analysis
  const [incidentForm, setIncidentForm] = useState({
    route: '',
    location: '',
    type: 'incident',
    severity: 'medium',
    estimatedDelay: '15',
    description: ''
  });

  const API_BASE_URL = baseUrl || (__DEV__ 
    ? 'http://192.168.1.132:3001'
    : 'https://go-barry.onrender.com');

  const incidentTypes = [
    { label: 'Traffic Incident', value: 'incident' },
    { label: 'Vehicle Breakdown', value: 'breakdown' },
    { label: 'Road Accident', value: 'accident' },
    { label: 'Roadworks', value: 'roadworks' },
    { label: 'Weather Conditions', value: 'weather' }
  ];

  const severityLevels = [
    { label: 'Low Impact', value: 'low' },
    { label: 'Medium Impact', value: 'medium' },
    { label: 'High Impact', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];

  // Load available routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/routes/all`);
        const data = await response.json();
        
        if (data.success && data.data.routes) {
          setAvailableRoutes(data.data.routes);
        }
      } catch (error) {
        console.error('Failed to load routes:', error);
      }
    };
    
    fetchRoutes();
  }, []);

  // Run AI analysis
  const runAIAnalysis = async () => {
    if (!incidentForm.route || !incidentForm.location) {
      Alert.alert('Error', 'Please fill in route and location fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🤖 Running AI disruption analysis...');
      
      const incident = {
        route: incidentForm.route,
        type: incidentForm.type,
        location: incidentForm.location,
        estimatedDelay: parseInt(incidentForm.estimatedDelay),
        severity: incidentForm.severity,
        description: incidentForm.description,
        supervisor_id: 'DEMO_USER',
        supervisor_name: 'Demo User'
      };

      const response = await fetch(`${API_BASE_URL}/api/disruption/workflow/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident: incident,
          generateMessages: true,
          suggestDiversion: true,
          logDisruption: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.workflow);
        setMessagesResult(result.workflow.results.messages);
        setShowResults(true);
        console.log('✅ AI analysis completed');
      } else {
        Alert.alert('Analysis Failed', result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      Alert.alert('Error', 'Failed to run AI analysis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate messages only
  const generateMessages = async () => {
    if (!incidentForm.route || !incidentForm.location) {
      Alert.alert('Error', 'Please fill in route and location fields');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Generating disruption messages...');
      
      const incident = {
        route: incidentForm.route,
        type: incidentForm.type,
        location: incidentForm.location,
        estimatedDelay: parseInt(incidentForm.estimatedDelay),
        severity: incidentForm.severity,
        description: incidentForm.description
      };

      const response = await fetch(`${API_BASE_URL}/api/disruption/messages/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ incident })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessagesResult(result.data);
        setAnalysisResult(null);
        setShowResults(true);
        console.log('✅ Messages generated');
      } else {
        Alert.alert('Generation Failed', result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('❌ Message generation failed:', error);
      Alert.alert('Error', 'Failed to generate messages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setIncidentForm({
      route: '',
      location: '',
      type: 'incident',
      severity: 'medium',
      estimatedDelay: '15',
      description: ''
    });
    setAnalysisResult(null);
    setMessagesResult(null);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Disruption Manager</Text>
        <Text style={styles.subtitle}>Intelligent route diversions & messaging</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'analyze' && styles.activeTab]}
          onPress={() => setActiveTab('analyze')}
        >
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.activeTabText]}>
            AI Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages Only
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Incident Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Details</Text>
          
          {/* Route Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Affected Route *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={incidentForm.route}
                onValueChange={(value) => setIncidentForm(prev => ({ ...prev, route: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Select Route..." value="" />
                {availableRoutes.map((route) => (
                  <Picker.Item 
                    key={route.routeNumber} 
                    label={`Route ${route.routeNumber}`} 
                    value={route.routeNumber} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Incident Location *</Text>
            <TextInput
              style={styles.textInput}
              value={incidentForm.location}
              onChangeText={(text) => setIncidentForm(prev => ({ ...prev, location: text }))}
              placeholder="e.g., Durham Road, Gateshead"
              multiline={false}
            />
          </View>

          {/* Incident Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Incident Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={incidentForm.type}
                onValueChange={(value) => setIncidentForm(prev => ({ ...prev, type: value }))}
                style={styles.picker}
              >
                {incidentTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Severity */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={incidentForm.severity}
                onValueChange={(value) => setIncidentForm(prev => ({ ...prev, severity: value }))}
                style={styles.picker}
              >
                {severityLevels.map((level) => (
                  <Picker.Item key={level.value} label={level.label} value={level.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Estimated Delay */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Estimated Delay (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={incidentForm.estimatedDelay}
              onChangeText={(text) => setIncidentForm(prev => ({ ...prev, estimatedDelay: text }))}
              placeholder="15"
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Details</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={incidentForm.description}
              onChangeText={(text) => setIncidentForm(prev => ({ ...prev, description: text }))}
              placeholder="Optional additional details..."
              multiline={true}
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {activeTab === 'analyze' ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={runAIAnalysis}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Run AI Analysis</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={generateMessages}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Generate Messages</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={clearForm}>
            <Ionicons name="refresh" size={20} color="#6B7280" />
            <Text style={[styles.buttonText, { color: '#6B7280' }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {analysisResult ? 'AI Analysis Results' : 'Generated Messages'}
            </Text>
            <TouchableOpacity onPress={() => setShowResults(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* AI Diversion Analysis */}
            {analysisResult && analysisResult.results.diversionAnalysis && (
              <View style={styles.resultSection}>
                <Text style={styles.resultTitle}>🔄 AI Route Diversion</Text>
                <View style={styles.diversionCard}>
                  <Text style={styles.diversionRoute}>
                    Route {analysisResult.results.diversionAnalysis.route}
                  </Text>
                  
                  <View style={styles.diversionDetails}>
                    <Text style={styles.diversionLabel}>Recommended Diversion:</Text>
                    <Text style={styles.diversionValue}>
                      {analysisResult.results.diversionAnalysis.recommendedDiversion.diversionVia.join(' → ')}
                    </Text>
                  </View>
                  
                  <View style={styles.diversionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Added Distance</Text>
                      <Text style={styles.statValue}>
                        {analysisResult.results.diversionAnalysis.recommendedDiversion.addedDistance}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Estimated Delay</Text>
                      <Text style={styles.statValue}>
                        {analysisResult.results.diversionAnalysis.recommendedDiversion.estimatedDelay}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.diversionDetails}>
                    <Text style={styles.diversionLabel}>AI Reasoning:</Text>
                    <Text style={styles.diversionReasoning}>
                      {analysisResult.results.diversionAnalysis.reasoning}
                    </Text>
                  </View>
                  
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceBarFill, 
                          { width: `${analysisResult.results.diversionAnalysis.aiConfidence}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceValue}>
                      {analysisResult.results.diversionAnalysis.aiConfidence}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Generated Messages */}
            {messagesResult && messagesResult.messages && (
              <View style={styles.resultSection}>
                <Text style={styles.resultTitle}>📝 Generated Messages</Text>
                
                {/* Ticketer Message */}
                <View style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Ionicons name="radio" size={20} color="#3B82F6" />
                    <Text style={styles.messageType}>Ticketer Message</Text>
                  </View>
                  <Text style={styles.messageText}>
                    {messagesResult.messages.ticketerMessage.text}
                  </Text>
                  <Text style={styles.messageCount}>
                    {messagesResult.messages.ticketerMessage.characterCount} characters
                  </Text>
                </View>

                {/* Blink Display */}
                <View style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Ionicons name="tv" size={20} color="#10B981" />
                    <Text style={styles.messageType}>Display Screen</Text>
                  </View>
                  <View style={styles.displayMessage}>
                    <Text style={styles.displayTitle}>
                      {messagesResult.messages.blinkDisplayPDF.title}
                    </Text>
                    <Text style={styles.displayContent}>
                      {messagesResult.messages.blinkDisplayPDF.content}
                    </Text>
                  </View>
                </View>

                {/* Passenger Cloud Message */}
                <View style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Ionicons name="people" size={20} color="#F59E0B" />
                    <Text style={styles.messageType}>Passenger Communication</Text>
                  </View>
                  <Text style={styles.messageText}>
                    {messagesResult.messages.passengerCloudMessage.text}
                  </Text>
                  <Text style={styles.messageCount}>
                    {messagesResult.messages.passengerCloudMessage.characterCount} characters
                  </Text>
                </View>

                {/* Social Media */}
                <View style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Ionicons name="share-social" size={20} color="#8B5CF6" />
                    <Text style={styles.messageType}>Social Media</Text>
                  </View>
                  <Text style={styles.messageText}>
                    {messagesResult.messages.socialMediaPost.text}
                  </Text>
                  <Text style={styles.messageCount}>
                    {messagesResult.messages.socialMediaPost.characterCount} characters
                  </Text>
                </View>
              </View>
            )}
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
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
    color: '#1F2937',
  },
  actionContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  diversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diversionRoute: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
    textAlign: 'center',
  },
  diversionDetails: {
    marginBottom: 12,
  },
  diversionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  diversionValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  diversionReasoning: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  diversionStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'right',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  messageType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  displayMessage: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 6,
  },
  displayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  displayContent: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AIDisruptionManager;