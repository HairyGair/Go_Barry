// This file contains the patch for adding edit functionality to IncidentManager.jsx

// 1. Add this state after the existing state declarations (around line 360):
// const [showEditModal, setShowEditModal] = useState(false);
// const [incidentToEdit, setIncidentToEdit] = useState(null);

// 2. Add this function to handle incident editing (after other handler functions):
const handleEditIncident = async (incidentId, updatedData) => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE}/api/incidents/${incidentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...updatedData,
        supervisorName: supervisorName,
        sessionId: sessionId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Incident updated successfully', 'success');
      loadIncidents();
      setShowEditModal(false);
      setIncidentToEdit(null);
    } else {
      showNotification(data.error || 'Failed to update incident', 'error');
    }
  } catch (error) {
    showNotification(`Failed to update incident: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

// 3. Add edit button in incident card actions (around line 3175, after the map button):
/*
{isLoggedIn && (
  <TouchableOpacity
    style={styles.editButton}
    onPress={() => {
      setIncidentToEdit(incident);
      setShowEditModal(true);
    }}
  >
    <Ionicons name="pencil" size={16} color="#8B5CF6" />
  </TouchableOpacity>
)}
*/

// 4. Add EditIncidentModal before the closing View tag (around line 4000):
/*
<EditIncidentModal
  visible={showEditModal}
  incident={incidentToEdit}
  onClose={() => {
    setShowEditModal(false);
    setIncidentToEdit(null);
  }}
  onSave={handleEditIncident}
  loading={loading}
  INCIDENT_TYPES={INCIDENT_TYPES}
/>
*/

// 5. EditIncidentModal Component - Add this at the end of the file before export:
const EditIncidentModal = ({ visible, incident, onClose, onSave, loading, INCIDENT_TYPES }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (incident && visible) {
      setFormData({
        type: incident.type || '',
        subtype: incident.subtype || '',
        location: incident.location || '',
        description: incident.description || '',
        severity: incident.severity || 'Medium',
        affectsRoutes: incident.affectsRoutes || [],
        notes: incident.notes || ''
      });
    }
  }, [incident, visible]);

  const handleSave = () => {
    if (!formData.type || !formData.location) {
      Alert.alert('Error', 'Type and location are required');
      return;
    }
    onSave(incident.id, formData);
  };

  const handleAddRoute = () => {
    Alert.prompt(
      'Add Route',
      'Enter route number:',
      (route) => {
        if (route && route.trim()) {
          setFormData({
            ...formData,
            affectsRoutes: [...formData.affectsRoutes, route.trim()]
          });
        }
      }
    );
  };

  const handleRemoveRoute = (route) => {
    setFormData({
      ...formData,
      affectsRoutes: formData.affectsRoutes.filter(r => r !== route)
    });
  };

  if (!visible || !incident) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Incident</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
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
                    formData.type === key && styles.typeCardSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: key, subtype: '' }))}
                >
                  <Ionicons name={type.icon} size={24} color={type.color} />
                  <Text style={styles.typeCardText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subtype */}
          {formData.type && INCIDENT_TYPES[formData.type] && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Subtype</Text>
              <View style={styles.subtypeGrid}>
                {INCIDENT_TYPES[formData.type].subtypes.map((subtype, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subtypeButton,
                      formData.subtype === subtype && styles.subtypeButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, subtype }))}
                  >
                    <Text style={[
                      styles.subtypeButtonText,
                      formData.subtype === subtype && styles.subtypeButtonTextSelected
                    ]}>
                      {subtype}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Location of incident"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Severity */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Severity</Text>
            <View style={styles.severityGrid}>
              {['Low', 'Medium', 'High', 'Critical'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    formData.severity === severity && styles.severityButtonSelected
                  ]}
                  onPress={() => setFormData({ ...formData, severity })}
                >
                  <Text style={[
                    styles.severityButtonText,
                    formData.severity === severity && styles.severityButtonTextSelected
                  ]}>
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the incident..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Affected Routes */}
          <View style={styles.formSection}>
            <View style={styles.routesHeader}>
              <Text style={styles.formLabel}>Affected Routes</Text>
              <TouchableOpacity
                style={styles.addRouteButton}
                onPress={handleAddRoute}
              >
                <Ionicons name="add-circle" size={20} color="#3B82F6" />
                <Text style={styles.addRouteButtonText}>Add Route</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.routesList}>
              {formData.affectsRoutes?.map((route) => (
                <TouchableOpacity
                  key={route}
                  style={styles.editableRouteBadge}
                  onPress={() => handleRemoveRoute(route)}
                >
                  <Text style={styles.routeBadgeText}>{route}</Text>
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveEditButton,
                (!formData.type || !formData.location) && styles.submitButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!formData.type || !formData.location || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// 6. Add these styles to the StyleSheet.create() section:
/*
editButton: {
  backgroundColor: '#8B5CF6',
  padding: 8,
  borderRadius: 8,
  marginLeft: 8,
},
textInput: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  color: '#1F2937',
  backgroundColor: '#FFFFFF',
},
severityGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},
severityButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},
severityButtonSelected: {
  backgroundColor: '#3B82F6',
  borderColor: '#3B82F6',
},
severityButtonText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#6B7280',
},
severityButtonTextSelected: {
  color: '#FFFFFF',
},
routesHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
addRouteButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
addRouteButtonText: {
  fontSize: 14,
  color: '#3B82F6',
  fontWeight: '500',
},
editableRouteBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#E0E7FF',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  gap: 6,
},
saveEditButton: {
  backgroundColor: '#10B981',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
*/