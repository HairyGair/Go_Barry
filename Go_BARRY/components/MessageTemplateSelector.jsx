// components/MessageTemplateSelector.jsx
// Template-Based Message System - Phase 1, Step 1.2
// Streamlines common communication scenarios

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const MessageTemplateSelector = ({ visible, onClose, onSendMessage }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templateVariables, setTemplateVariables] = useState({});
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [priority, setPriority] = useState('P2');
  
  const { supervisor } = useSupervisorSession();

  // Categories from the templates file
  const categories = [
    { id: 'all', name: 'All Templates', color: '#6C757D' },
    { id: 'delays', name: 'Service Delays', color: '#F59E0B' },
    { id: 'disruptions', name: 'Service Disruptions', color: '#EF4444' },
    { id: 'weather', name: 'Weather Related', color: '#8B5CF6' },
    { id: 'updates', name: 'Service Updates', color: '#10B981' },
    { id: 'emergency', name: 'Emergency', color: '#DC2626' }
  ];

  const priorities = [
    { id: 'P0', label: 'Emergency (P0)', color: '#DC2626', description: 'Immediate display, override everything' },
    { id: 'P1', label: 'Critical (P1)', color: '#EF4444', description: 'High priority, 30-second rotation' },
    { id: 'P2', label: 'Important (P2)', color: '#F59E0B', description: 'Standard priority, 60-second rotation' },
    { id: 'P3', label: 'Info (P3)', color: '#10B981', description: 'Low priority, 5-minute rotation' }
  ];

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/templates/messages');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        // Fallback to predefined templates
        setTemplates(predefinedTemplates);
      }
    } catch (error) {
      console.log('Using predefined templates:', error.message);
      setTemplates(predefinedTemplates);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIsCustomMode(false);
    
    // Initialize template variables
    const variables = {};
    template.variables?.forEach(variable => {
      variables[variable] = '';
    });
    setTemplateVariables(variables);
    setPriority(template.priority === 'critical' ? 'P0' : 
                template.priority === 'warning' ? 'P1' : 'P2');
  };

  const handleVariableChange = (variable, value) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generateMessage = () => {
    if (isCustomMode) {
      return customMessage;
    }
    
    if (!selectedTemplate) return '';
    
    let message = selectedTemplate.message;
    
    // Replace variables in template
    Object.entries(templateVariables).forEach(([variable, value]) => {
      message = message.replace(new RegExp(`{${variable}}`, 'g'), value || `[${variable}]`);
    });
    
    return message;
  };

  const handleSend = async () => {
    const message = generateMessage();
    if (!message.trim()) return;

    const messageData = {
      content: message,
      priority,
      templateId: isCustomMode ? null : selectedTemplate?.id,
      templateVariables: isCustomMode ? null : templateVariables,
      createdBy: supervisor?.supervisorId || 'unknown',
      supervisorName: supervisor?.supervisorName || 'Unknown',
      channels: selectedTemplate?.channels || ['display'],
      timestamp: Date.now()
    };

    // Track template usage
    if (!isCustomMode && selectedTemplate) {
      await trackTemplateUsage(selectedTemplate.id);
    }

    onSendMessage(messageData);
    onClose();
  };

  const trackTemplateUsage = async (templateId) => {
    try {
      await fetch('https://go-barry.onrender.com/api/templates/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateId, 
          supervisorId: supervisor?.supervisorId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.log('Failed to track template usage:', error.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message Templates</Text>
          <TouchableOpacity 
            onPress={() => setIsCustomMode(!isCustomMode)}
            style={styles.modeButton}
          >
            <Text style={styles.modeButtonText}>
              {isCustomMode ? '📝 Template' : '✏️ Custom'}
            </Text>
          </TouchableOpacity>
        </View>

        {isCustomMode ? (
          // Custom message mode
          <View style={styles.customContainer}>
            <Text style={styles.sectionTitle}>Custom Message</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Type your custom message..."
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={4}
            />
          </View>
        ) : (
          // Template mode
          <View style={styles.templateContainer}>
            {/* Category Filter */}
            <View style={styles.categoryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      { borderColor: category.color },
                      selectedCategory === category.id && { backgroundColor: category.color }
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.selectedCategoryText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Template List */}
            <ScrollView style={styles.templateList}>
              {filteredTemplates.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateItem,
                    selectedTemplate?.id === template.id && styles.selectedTemplate
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(template.priority) }
                    ]}>
                      <Text style={styles.priorityText}>{template.priority}</Text>
                    </View>
                  </View>
                  <Text style={styles.templateMessage}>{template.message}</Text>
                  {template.usageCount > 0 && (
                    <Text style={styles.usageCount}>Used {template.usageCount} times</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Variable Inputs */}
            {selectedTemplate && selectedTemplate.variables?.length > 0 && (
              <View style={styles.variablesContainer}>
                <Text style={styles.sectionTitle}>Fill Template Variables</Text>
                {selectedTemplate.variables.map(variable => (
                  <View key={variable} style={styles.variableInput}>
                    <Text style={styles.variableLabel}>{variable}:</Text>
                    <TextInput
                      style={styles.variableField}
                      placeholder={`Enter ${variable}`}
                      value={templateVariables[variable] || ''}
                      onChangeText={(value) => handleVariableChange(variable, value)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Priority Selection */}
        <View style={styles.priorityContainer}>
          <Text style={styles.sectionTitle}>Message Priority</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {priorities.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.priorityButton,
                  { borderColor: p.color },
                  priority === p.id && { backgroundColor: p.color }
                ]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[
                  styles.priorityLabel,
                  priority === p.id && styles.selectedPriorityLabel
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Message Preview</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {generateMessage() || 'Select a template or type a custom message...'}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          style={[styles.sendButton, !generateMessage().trim() && styles.disabledButton]}
          onPress={handleSend}
          disabled={!generateMessage().trim()}
        >
          <Text style={styles.sendButtonText}>
            Send to Display Screen ({priority})
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Predefined templates fallback
const predefinedTemplates = [
  {
    id: 'route_delay_minor',
    category: 'delays',
    title: 'Minor Route Delay',
    message: 'Service {route} experiencing minor delays up to {duration} minutes due to {reason}. Alternative routes available.',
    priority: 'warning',
    variables: ['route', 'duration', 'reason'],
    usageCount: 0
  },
  {
    id: 'emergency_diversion',
    category: 'emergency',
    title: 'Emergency Diversion',
    message: 'URGENT: Service {route} diverted via {diversionRoute} due to emergency at {location}. Additional journey time {extraTime} minutes.',
    priority: 'critical',
    variables: ['route', 'diversionRoute', 'location', 'extraTime'],
    usageCount: 0
  },
  {
    id: 'weather_advisory',
    category: 'weather',
    title: 'Weather Advisory',
    message: 'Due to {weatherCondition}, expect delays on routes in {affectedAreas}. Services running with reduced frequency.',
    priority: 'warning',
    variables: ['weatherCondition', 'affectedAreas'],
    usageCount: 0
  }
];

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return '#DC2626';
    case 'warning': return '#F59E0B';
    case 'info': return '#10B981';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C757D',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 16,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  templateContainer: {
    flex: 1,
    padding: 16,
  },
  customContainer: {
    flex: 1,
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  templateList: {
    flex: 1,
    marginBottom: 16,
  },
  templateItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#0984E3',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  templateMessage: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
  },
  usageCount: {
    fontSize: 11,
    color: '#B2BEC3',
    marginTop: 4,
  },
  variablesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  variableInput: {
    marginBottom: 8,
  },
  variableLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  variableField: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  selectedPriorityLabel: {
    color: '#fff',
  },
  previewContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  previewBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  previewText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#0984E3',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CED4DA',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default MessageTemplateSelector;
