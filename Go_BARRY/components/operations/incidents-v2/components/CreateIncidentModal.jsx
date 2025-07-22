/*
 * Go Barry - Create Incident Modal
 * Modal for creating new incidents manually
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing } from '../styles/incidents.styles';
import IncidentMapPicker from './maps/IncidentMapPicker';
import RouteSelector from './RouteSelector';
import IncidentTemplates from './IncidentTemplates';
import LocationSearch from './LocationSearch';

const CreateIncidentModal = ({ 
  visible, 
  onClose, 
  onCreateIncident, 
  supervisorName,
  supervisorRole,
  sessionId,
  baseUrl,
  initialData = null,
  onShowActionReminders
}) => {
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('form'); // 'form', 'templates', 'map', 'routes'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [detectedRoutes, setDetectedRoutes] = useState([]);
  const [routeConfidence, setRouteConfidence] = useState({});
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'Traffic Incident',
    subtype: initialData?.subtype || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    severity: initialData?.severity || 'Medium',
    notes: initialData?.notes || '',
    affectsRoutes: initialData?.affectsRoutes ? initialData.affectsRoutes.join(', ') : ''
  });

  const incidentTypes = [
    'Traffic Incident',
    'Road Closure',
    'Road Traffic Collision',
    'Emergency Services Blocking',
    'Obstruction',
    'Utilities',
    'Traffic Light Failure',
    'Power Lines Down',
    'Flooding',
    'Weather Conditions',
    'Vehicle Breakdown',
    'Unplanned Roadworks',
    'Event Traffic',
    'Other'
  ];

  const severityLevels = ['Low', 'Medium', 'High'];

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.location || !formData.description) {
      if (Platform.OS === 'web') {
        alert('Please fill in location and description');
      } else {
        Alert.alert('Required Fields', 'Please fill in location and description');
      }
      return;
    }

    // Validate type is selected
    if (!formData.type) {
      if (Platform.OS === 'web') {
        alert('Please select an incident type');
      } else {
        Alert.alert('Required Field', 'Please select an incident type');
      }
      return;
    }

    setLoading(true);
    try {
      // Parse routes
      const routesArray = formData.affectsRoutes
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const incidentData = {
        type: formData.type,
        subtype: formData.subtype,
        location: formData.location,
        description: formData.description,
        severity: formData.severity,
        notes: formData.notes,
        affectsRoutes: selectedRoutes.length > 0 ? selectedRoutes : routesArray,
        createdBy: supervisorName,
        createdByRole: supervisorRole,
        startTime: new Date().toISOString(),
        status: 'active',
        coordinates: selectedLocation ? {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        } : null,
        detectedRoutes: detectedRoutes,
        routeConfidence: routeConfidence
      };

      // Add retry logic for 429 errors
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        response = await fetch(`${baseUrl}/api/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(incidentData),
          timeout: 15000 // 15 second timeout
        });

        if (response.status !== 429) break;
        
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} due to 429 error`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to create incident: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        setFormData({
          type: 'Traffic Incident',
          subtype: '',
          location: '',
          description: '',
          severity: 'Medium',
          notes: '',
          affectsRoutes: ''
        });
        setSelectedLocation(null);
        setSelectedRoutes([]);
        setDetectedRoutes([]);
        setRouteConfidence({});
        setActiveView('form');
        
        // Notify parent component
        if (onCreateIncident) {
          onCreateIncident(result.incident);
        }
        
        // Close modal
        onClose();
        
        // Show action reminders if callback provided
        if (onShowActionReminders) {
          // Generate messages for the reminders
          const messages = {
            ticketer: `${incidentData.actionTaken?.includes('divert') ? 'DIVERSION' : 'CAUTION'} - ${incidentData.location}\n\nRoutes ${incidentData.affectsRoutes.join(', ')}\n\n${incidentData.description}\n\n${incidentData.notes || 'Proceed with caution'}`,
            passengerCloud: `Due to ${incidentData.type.toLowerCase()} at ${incidentData.location}, services ${incidentData.affectsRoutes.join(', ')} ${incidentData.notes?.includes('divert') ? 'are currently on diversion' : 'may experience delays'}. We apologise for any inconvenience.`,
            email: `INCIDENT ALERT: ${incidentData.type} at ${incidentData.location}\n\nAffected Routes: ${incidentData.affectsRoutes.join(', ')}\n\nDescription: ${incidentData.description}\n\nAction Taken: ${incidentData.notes || 'Monitoring situation'}\n\nPlease inform drivers on affected routes.`
          };
          
          onShowActionReminders(result.incident, messages);
        }
        
        if (Platform.OS === 'web') {
          // Don't show success alert if action reminders will be shown
          if (!onShowActionReminders) {
            alert('Incident created successfully');
          }
        } else {
          if (!onShowActionReminders) {
            Alert.alert('Success', 'Incident created successfully');
          }
        }
      } else {
        throw new Error(result.error || 'Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      if (Platform.OS === 'web') {
        alert(`Error: ${error.message}`);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData({
      ...formData,
      location: location.description
    });
  };

  const handleRoutesDetected = (routes, confidence) => {
    setDetectedRoutes(routes);
    setRouteConfidence(confidence);
    // Pre-select high confidence routes
    const highConfidenceRoutes = routes.filter(route => 
      confidence[route] && confidence[route] >= 70
    );
    if (highConfidenceRoutes.length > 0) {
      setSelectedRoutes(highConfidenceRoutes);
    }
  };

  const handleTemplateSelect = (templateData) => {
    // Update form with template data
    setFormData({
      ...formData,
      type: templateData.type,
      description: templateData.description,
      notes: templateData.actionTaken || formData.notes
    });
    
    // Switch back to form view
    setActiveView('form');
    
    // Show a quick notification
    if (Platform.OS === 'web') {
      // Could add a toast notification here
    }
  };

  const modalStyles = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      ...(Platform.OS === 'web' ? {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)'
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
      })
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text
    },
    closeButton: {
      padding: spacing.sm
    },
    form: {
      flex: 1
    },
    inputGroup: {
      marginBottom: spacing.lg
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top'
    },
    picker: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border
    },
    createButton: {
      backgroundColor: colors.primary
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600'
    },
    cancelButtonText: {
      color: colors.text
    },
    createButtonText: {
      color: '#fff'
    },
    required: {
      color: colors.danger
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: spacing.lg
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: spacing.xs,
      position: 'relative'
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary
    },
    tabTextActive: {
      color: colors.primary
    },
    tabBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4
    },
    tabBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#fff'
    },
    mapContainer: {
      flex: 1,
      minHeight: 400
    },
    routesContainer: {
      flex: 1,
      minHeight: 400
    },
    quickAction: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm
    },
    quickActionText: {
      flex: 1,
      fontSize: 14,
      color: colors.text
    },
    quickActionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: 6
    },
    quickActionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff'
    },
    detectedText: {
      fontSize: 12,
      color: colors.warning,
      marginTop: spacing.xs,
      marginLeft: spacing.md + 20 + spacing.sm
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Create New Incident</Text>
            <Pressable 
              style={modalStyles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* View Tabs */}
          <View style={modalStyles.tabs}>
            <Pressable
              style={[modalStyles.tab, activeView === 'form' && modalStyles.tabActive]}
              onPress={() => setActiveView('form')}
            >
              <Ionicons 
                name="document-text" 
                size={16} 
                color={activeView === 'form' ? colors.primary : colors.textSecondary} 
              />
              <Text style={[modalStyles.tabText, activeView === 'form' && modalStyles.tabTextActive]}>
                Details
              </Text>
            </Pressable>
            
            <Pressable
              style={[modalStyles.tab, activeView === 'templates' && modalStyles.tabActive]}
              onPress={() => setActiveView('templates')}
            >
              <Ionicons 
                name="flash" 
                size={16} 
                color={activeView === 'templates' ? colors.primary : colors.textSecondary} 
              />
              <Text style={[modalStyles.tabText, activeView === 'templates' && modalStyles.tabTextActive]}>
                Templates
              </Text>
            </Pressable>
            
            <Pressable
              style={[modalStyles.tab, activeView === 'map' && modalStyles.tabActive]}
              onPress={() => setActiveView('map')}
            >
              <Ionicons 
                name="map" 
                size={16} 
                color={activeView === 'map' ? colors.primary : colors.textSecondary} 
              />
              <Text style={[modalStyles.tabText, activeView === 'map' && modalStyles.tabTextActive]}>
                Map Location
              </Text>
              {selectedLocation && (
                <View style={modalStyles.tabBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
            
            <Pressable
              style={[modalStyles.tab, activeView === 'routes' && modalStyles.tabActive]}
              onPress={() => setActiveView('routes')}
            >
              <Ionicons 
                name="bus" 
                size={16} 
                color={activeView === 'routes' ? colors.primary : colors.textSecondary} 
              />
              <Text style={[modalStyles.tabText, activeView === 'routes' && modalStyles.tabTextActive]}>
                Routes
              </Text>
              {selectedRoutes.length > 0 && (
                <View style={modalStyles.tabBadge}>
                  <Text style={modalStyles.tabBadgeText}>{selectedRoutes.length}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {activeView === 'form' && (
            <ScrollView style={modalStyles.form} showsVerticalScrollIndicator={false}>
            {/* Type */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Type</Text>
              <View style={modalStyles.picker}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                  enabled={!loading}
                >
                  {incidentTypes.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Subtype */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Subtype (Optional)</Text>
              <TextInput
                style={modalStyles.input}
                value={formData.subtype}
                onChangeText={(text) => setFormData({...formData, subtype: text})}
                placeholder="e.g., Multi-vehicle collision"
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            {/* Location */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>
                Location <Text style={modalStyles.required}>*</Text>
              </Text>
              <LocationSearch
                value={formData.location}
                onLocationSelect={(location) => {
                  setFormData({...formData, location: location.description});
                  if (location.coordinates) {
                    setSelectedLocation({
                      lat: location.coordinates.lat,
                      lng: location.coordinates.lng,
                      description: location.description
                    });
                  }
                }}
                placeholder="Search for a location..."
                baseUrl={baseUrl}
              />
            </View>

            {/* Description */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>
                Description <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={[modalStyles.input, modalStyles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe the incident details..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            {/* Severity */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Severity</Text>
              <View style={modalStyles.picker}>
                <Picker
                  selectedValue={formData.severity}
                  onValueChange={(value) => setFormData({...formData, severity: value})}
                  enabled={!loading}
                >
                  {severityLevels.map(level => (
                    <Picker.Item key={level} label={level} value={level} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Location Quick Action */}
            <View style={modalStyles.inputGroup}>
              <View style={modalStyles.quickAction}>
                <Ionicons name="map" size={20} color={colors.primary} />
                <Text style={modalStyles.quickActionText}>
                  {selectedLocation ? 'Location set via map' : 'Set location on map'}
                </Text>
                <Pressable
                  style={modalStyles.quickActionButton}
                  onPress={() => setActiveView('map')}
                >
                  <Text style={modalStyles.quickActionButtonText}>
                    {selectedLocation ? 'Change' : 'Set'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Routes Quick Action */}
            <View style={modalStyles.inputGroup}>
              <View style={modalStyles.quickAction}>
                <Ionicons name="bus" size={20} color={colors.primary} />
                <Text style={modalStyles.quickActionText}>
                  {selectedRoutes.length > 0 
                    ? `${selectedRoutes.length} routes selected` 
                    : 'Select affected routes'}
                </Text>
                <Pressable
                  style={modalStyles.quickActionButton}
                  onPress={() => setActiveView('routes')}
                >
                  <Text style={modalStyles.quickActionButtonText}>
                    {selectedRoutes.length > 0 ? 'Edit' : 'Select'}
                  </Text>
                </Pressable>
              </View>
              {detectedRoutes.length > 0 && (
                <Text style={modalStyles.detectedText}>
                  {detectedRoutes.length} routes auto-detected
                </Text>
              )}
            </View>

            {/* Notes */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Additional Notes</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                placeholder="Any additional information..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
            </ScrollView>
          )}

          {activeView === 'templates' && (
            <View style={modalStyles.form}>
              <IncidentTemplates
                onSelectTemplate={handleTemplateSelect}
                selectedRoutes={selectedRoutes}
                location={formData.location || (selectedLocation ? selectedLocation.description : '')}
              />
            </View>
          )}

          {activeView === 'map' && (
            <View style={modalStyles.mapContainer}>
              <IncidentMapPicker
                onLocationSelect={handleLocationSelect}
                onRoutesDetected={handleRoutesDetected}
                baseUrl={baseUrl}
                initialLocation={selectedLocation}
              />
            </View>
          )}

          {activeView === 'routes' && (
            <View style={modalStyles.routesContainer}>
              <RouteSelector
                selectedRoutes={selectedRoutes}
                detectedRoutes={detectedRoutes}
                routeConfidence={routeConfidence}
                onRoutesChange={setSelectedRoutes}
                baseUrl={baseUrl}
              />
            </View>
          )}

          <View style={modalStyles.footer}>
            <Pressable 
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>
            
            <Pressable 
              style={[modalStyles.button, modalStyles.createButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={[modalStyles.buttonText, modalStyles.createButtonText]}>
                    Create Incident
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateIncidentModal;