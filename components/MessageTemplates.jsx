// Go_BARRY/components/MessageTemplates.jsx
// Automated Messaging Templates for Supervisor Quick Response
// Integrates with existing supervisor authentication and WebSocket system

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const isWeb = Platform.OS === 'web';

const MessageTemplates = ({ 
  supervisorId,
  sessionId,
  selectedAlert = null,
  onMessageSent,
  onClose
}) => {
  // State management
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [processedMessage, setProcessedMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []); // Empty dependency array

  // Load suggestions when selectedAlert changes
  useEffect(() => {
    if (selectedAlert) {
      loadSuggestions(selectedAlert);
    }
  }, [selectedAlert]); // Only depend on selectedAlert

  // Load templates from API
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/supervisor/templates`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
        setCategories(data.categories || []);
      } else {
        console.error('Failed to load templates:', data.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load template suggestions for current alert
  const loadSuggestions = useCallback(async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supervisor/templates/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertData: alert
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template);
    
    // Initialize variables with alert data if available
    const initialVariables = {};
    if (template.variables && selectedAlert) {
      template.variables.forEach(variable => {
        switch (variable) {
          case 'route':
            initialVariables[variable] = selectedAlert.affectsRoutes?.[0] || '';
            break;
          case 'location':
            initialVariables[variable] = selectedAlert.location || '';
            break;
          case 'reason':
            initialVariables[variable] = selectedAlert.title || '';
            break;
          default:
            initialVariables[variable] = '';
        }
      });
    }
    
    setTemplateVariables(initialVariables);
    
    // Update preview directly here instead of calling updatePreview
    let preview = template.message;
    if (template.variables) {
      template.variables.forEach(variable => {
        const value = initialVariables[variable] || `{${variable}}`;
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        preview = preview.replace(regex, value);
      });
    }
    setProcessedMessage(preview);
  }, [selectedAlert]); // Only depend on selectedAlert

  // Update message preview - simplified to avoid dependency loops
  const updatePreview = useCallback((template, variables) => {
    if (!template) return;
    
    let preview = template.message;
    if (template.variables) {
      template.variables.forEach(variable => {
        const value = variables[variable] || `{${variable}}`;
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        preview = preview.replace(regex, value);
      });
    }
    
    setProcessedMessage(preview);
  }, []); // No dependencies to avoid loops

  // Handle variable change
  const handleVariableChange = useCallback((variable, value) => {
    const newVariables = { ...templateVariables, [variable]: value };
    setTemplateVariables(newVariables);
    
    // Update preview directly here
    if (selectedTemplate) {
      let preview = selectedTemplate.message;
      if (selectedTemplate.variables) {
        selectedTemplate.variables.forEach(varName => {
          const varValue = newVariables[varName] || `{${varName}}`;
          const regex = new RegExp(`\\{${varName}\\}`, 'g');
          preview = preview.replace(regex, varValue);
        });
      }
      setProcessedMessage(preview);
    }
  }, [templateVariables, selectedTemplate]); // Fixed dependencies

  // Send template message
  const sendTemplateMessage = useCallback(async () => {
    if (!selectedTemplate || !sessionId) return;
    
    // Check for missing variables
    const missingVariables = selectedTemplate.variables?.filter(
      variable => !templateVariables[variable]?.trim()
    ) || [];
    
    if (missingVariables.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in: ${missingVariables.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/api/supervisor/templates/${selectedTemplate.id}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variables: templateVariables,
            sessionId,
            channels: ['display', 'web'],
            recipients: 'all_displays'
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Message Sent',
          'Template message sent successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedTemplate(null);
                setTemplateVariables({});
                setProcessedMessage('');
                onMessageSent?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate, sessionId, templateVariables, onMessageSent]);

  // Get filtered templates
  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // Get category color
  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  // Template card component
  const TemplateCard = ({ template, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.templateCard,
        isSelected && styles.templateCardSelected
      ]}
      onPress={() => onSelect(template)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateTitle}>{template.title}</Text>
        <View style={styles.templateBadges}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(template.priority) }
          ]}>
            <Text style={styles.badgeText}>{template.priority.toUpperCase()}</Text>
          </View>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(template.category) }
          ]}>
            <Text style={styles.badgeText}>
              {categories.find(c => c.id === template.category)?.name || template.category}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.templateMessage} numberOfLines={2}>
        {template.message}
      </Text>
      
      {template.variables && template.variables.length > 0 && (
        <View style={styles.variablesContainer}>
          <Text style={styles.variablesLabel}>Variables:</Text>
          <Text style={styles.variablesText}>
            {template.variables.map(v => `{${v}}`).join(', ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Variable input component
  const VariableInput = ({ variable, value, onValueChange }) => (
    <View style={styles.variableInput}>
      <Text style={styles.variableLabel}>{variable}:</Text>
      <TextInput
        style={styles.variableTextInput}
        value={value}
        onChangeText={onValueChange}
        placeholder={`Enter ${variable}...`}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  if (loading && templates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Message Templates</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Alert context */}
      {selectedAlert && (
        <View style={styles.alertContext}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{selectedAlert.title}</Text>
            <Text style={styles.alertLocation}>{selectedAlert.location}</Text>
            {selectedAlert.affectsRoutes && (
              <Text style={styles.alertRoutes}>
                Routes: {selectedAlert.affectsRoutes.join(', ')}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>
            <Ionicons name="bulb" size={16} color="#F59E0B" /> Suggested Templates
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.suggestionCard}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.suggestionTitle}>{template.title}</Text>
                <View style={[
                  styles.suggestionPriority,
                  { backgroundColor: getPriorityColor(template.priority) }
                ]}>
                  <Text style={styles.suggestionPriorityText}>
                    {template.priority.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'all' && styles.categoryButtonTextActive
            ]}>
              All ({templates.length})
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => {
            const count = templates.filter(t => t.category === category.id).length;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  { borderColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}>
                  {category.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Templates list */}
      <ScrollView style={styles.templatesList} showsVerticalScrollIndicator={false}>
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={handleTemplateSelect}
          />
        ))}
        
        {filteredTemplates.length === 0 && (
          <View style={styles.noTemplatesContainer}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noTemplatesText}>No templates found</Text>
          </View>
        )}
      </ScrollView>

      {/* Template editor */}
      {selectedTemplate && (
        <View style={styles.templateEditor}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>{selectedTemplate.title}</Text>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setShowPreview(true)}
            >
              <Ionicons name="eye" size={20} color="#3B82F6" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>

          {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
            <ScrollView style={styles.variablesContainer} showsVerticalScrollIndicator={false}>
              {selectedTemplate.variables.map(variable => (
                <VariableInput
                  key={variable}
                  variable={variable}
                  value={templateVariables[variable] || ''}
                  onValueChange={(value) => handleVariableChange(variable, value)}
                />
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: getPriorityColor(selectedTemplate.priority) }
            ]}
            onPress={sendTemplateMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Preview modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModal}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Message Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.previewContent}>
              <Text style={styles.previewMessage}>{processedMessage}</Text>
            </ScrollView>
            
            <View style={styles.previewFooter}>
              <Text style={styles.previewInfo}>
                Priority: {selectedTemplate?.priority?.toUpperCase()} | 
                Channels: Display, Web
              </Text>
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
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  alertContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    gap: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  alertLocation: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  alertRoutes: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  suggestionPriority: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  suggestionPriorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  templatesList: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  templateCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  templateBadges: {
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  templateMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  variablesContainer: {
    maxHeight: 120,
  },
  variablesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  variablesText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  noTemplatesContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noTemplatesText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  templateEditor: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    maxHeight: 300,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  previewButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  variableInput: {
    marginBottom: 12,
  },
  variableLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
  },
  variableTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  previewContent: {
    maxHeight: 300,
    marginBottom: 20,
  },
  previewMessage: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MessageTemplates;