import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const EmailTemplateManager = ({ onSelectTemplate, onClose }) => {
  const { supervisor } = useSupervisorSession();
  const { emailTemplates, saveEmailTemplate, deleteEmailTemplate } = useConvexSync();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'notification',
    variables: []
  });

  // Default templates if none exist
  const defaultTemplates = [
    {
      id: 'default-1',
      name: 'Service Disruption Alert',
      category: 'alert',
      subject: 'Service Disruption - {{route}}',
      body: `Dear Team,

We are experiencing a service disruption on route {{route}} due to {{reason}}.

Location: {{location}}
Expected duration: {{duration}}
Severity: {{severity}}

Actions taken:
- {{action1}}
- {{action2}}

Please inform drivers and update passengers accordingly.

Best regards,
{{supervisorName}}
Go North East Traffic Control`,
      variables: ['route', 'reason', 'location', 'duration', 'severity', 'action1', 'action2', 'supervisorName'],
      isDefault: true
    },
    {
      id: 'default-2',
      name: 'Traffic Update',
      category: 'notification',
      subject: 'Traffic Update - {{area}}',
      body: `Traffic Alert for {{area}}:

{{description}}

Affected routes: {{routes}}
Impact level: {{impact}}
Expected clearance: {{clearanceTime}}

Alternative routes suggested:
{{alternatives}}

Please monitor and update as necessary.

Traffic Control Team`,
      variables: ['area', 'description', 'routes', 'impact', 'clearanceTime', 'alternatives'],
      isDefault: true
    },
    {
      id: 'default-3',
      name: 'Emergency Response',
      category: 'alert',
      subject: 'URGENT: Emergency Response Required - {{location}}',
      body: `EMERGENCY ALERT

Incident Type: {{incidentType}}
Location: {{location}}
Time: {{time}}
Severity: CRITICAL

Immediate Actions Required:
{{immediateActions}}

Emergency Services Status: {{emergencyStatus}}

All supervisors please acknowledge receipt and confirm actions taken.

Contact Emergency Coordinator: {{contactNumber}}

RESPOND IMMEDIATELY`,
      variables: ['incidentType', 'location', 'time', 'immediateActions', 'emergencyStatus', 'contactNumber'],
      isDefault: true
    },
    {
      id: 'default-4',
      name: 'Daily Operations Report',
      category: 'report',
      subject: 'Daily Operations Report - {{date}}',
      body: `Daily Operations Summary for {{date}}

Service Performance:
- On-time performance: {{onTimePercentage}}%
- Services operated: {{servicesRun}}/{{servicesScheduled}}
- Cancellations: {{cancellations}}

Key Incidents:
{{incidents}}

Traffic Conditions:
{{trafficSummary}}

Tomorrow's Outlook:
{{tomorrowOutlook}}

Supervisor on duty: {{supervisorName}}`,
      variables: ['date', 'onTimePercentage', 'servicesRun', 'servicesScheduled', 'cancellations', 'incidents', 'trafficSummary', 'tomorrowOutlook', 'supervisorName'],
      isDefault: true
    }
  ];

  // Get all templates (custom + defaults)
  const allTemplates = [...(emailTemplates || []), ...defaultTemplates];

  // Extract variables from template text
  const extractVariables = (text) => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      alert('Please fill in all required fields');
      return;
    }

    // Extract variables from subject and body
    const subjectVars = extractVariables(newTemplate.subject);
    const bodyVars = extractVariables(newTemplate.body);
    const allVars = [...new Set([...subjectVars, ...bodyVars])];

    try {
      await saveEmailTemplate({
        ...newTemplate,
        variables: allVars,
        createdBy: supervisor.id,
        createdAt: new Date().toISOString(),
        isDefault: false
      });

      setShowCreateModal(false);
      setNewTemplate({
        name: '',
        subject: '',
        body: '',
        category: 'notification',
        variables: []
      });
      alert('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (templateId.startsWith('default-')) {
      alert('Cannot delete default templates');
      return;
    }

    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteEmailTemplate(templateId);
        alert('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  // Preview template
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
  };

  // Use template
  const handleUseTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Templates</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#059669" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {['alert', 'notification', 'report', 'custom'].map(category => {
          const categoryTemplates = allTemplates.filter(t => t.category === category);
          if (categoryTemplates.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)} Templates
              </Text>
              {categoryTemplates.map(template => (
                <View key={template.id} style={styles.templateCard}>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateSubject}>{template.subject}</Text>
                      {template.variables && template.variables.length > 0 && (
                        <Text style={styles.variableCount}>
                          {template.variables.length} variables
                        </Text>
                      )}
                    </View>
                    {template.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handlePreviewTemplate(template)}
                    >
                      <Ionicons name="eye" size={20} color="#666" />
                      <Text style={styles.actionText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.useButton]}
                      onPress={() => handleUseTemplate(template)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      <Text style={[styles.actionText, styles.useText]}>Use</Text>
                    </TouchableOpacity>
                    {!template.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteTemplate(template.id)}
                      >
                        <Ionicons name="trash" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Create Template Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Email Template</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Template Name *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.name}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Weekly Status Update"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryButtons}>
                {['alert', 'notification', 'report', 'custom'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      newTemplate.category === cat && styles.categoryButtonActive
                    ]}
                    onPress={() => setNewTemplate(prev => ({ ...prev, category: cat }))}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      newTemplate.category === cat && styles.categoryButtonTextActive
                    ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Subject Line *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.subject}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, subject: text }))}
                placeholder="Use {{variable}} for dynamic content"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Body *</Text>
              <TextInput
                style={[styles.input, styles.bodyInput]}
                value={newTemplate.body}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, body: text }))}
                placeholder="Type your email template here. Use {{variable}} for dynamic content."
                multiline
              />
            </View>

            <View style={styles.variableHelp}>
              <Ionicons name="information-circle" size={20} color="#059669" />
              <Text style={styles.variableHelpText}>
                Use {'{{variableName}}'} to create placeholders that will be replaced with actual values when sending
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCreateTemplate}
            >
              <Text style={styles.saveButtonText}>Create Template</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={!!selectedTemplate}
        animationType="slide"
        onRequestClose={() => setSelectedTemplate(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Template Preview</Text>
            <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {selectedTemplate && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Name:</Text>
                <Text style={styles.previewValue}>{selectedTemplate.name}</Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Subject:</Text>
                <Text style={styles.previewValue}>{selectedTemplate.subject}</Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Body:</Text>
                <Text style={styles.previewBody}>{selectedTemplate.body}</Text>
              </View>
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Variables:</Text>
                  <View style={styles.variablesList}>
                    {selectedTemplate.variables.map((variable, index) => (
                      <View key={index} style={styles.variableChip}>
                        <Text style={styles.variableChipText}>{`{{${variable}}}`}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.useTemplateButton}
                onPress={() => {
                  handleUseTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
              >
                <Text style={styles.useTemplateButtonText}>Use This Template</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  templateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  variableCount: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  useButton: {
    backgroundColor: '#e6f7ed',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  useText: {
    color: '#059669',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  bodyInput: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  variableHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  variableHelpText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    color: '#333',
  },
  previewBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  variableChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  variableChipText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  useTemplateButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  useTemplateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailTemplateManager;