// components/messaging/TemplateManager.jsx
// Template management component for Go BARRY Message Distribution Centre

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMessageTemplates } from '../hooks/useMessageTemplates';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const TemplateManager = () => {
  const { supervisor } = useSupervisorSession();
  const {
    templates,
    categories,
    selectedCategory,
    setSelectedCategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    isLoading,
    error,
    initializeDefaultTemplates,
  } = useMessageTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'custom',
    subject: '',
    content: '',
    routes: '',
    isUrgent: false,
  });

  // Initialize default templates on mount
  useEffect(() => {
    if (supervisor) {
      initializeDefaultTemplates(supervisor.badge, supervisor.name);
    }
  }, [supervisor]);

  // Filter templates by search query
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create template
  const handleCreate = async () => {
    if (!formData.name || !formData.subject || !formData.content) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createTemplate({
        ...formData,
        routes: formData.routes ? formData.routes.split(',').map(r => r.trim()) : [],
        supervisorBadge: supervisor.badge,
        supervisorName: supervisor.name,
      });
      
      setShowCreateModal(false);
      resetForm();
      Alert.alert('Success', 'Template created successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to create template');
    }
  };

  // Handle update template
  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    try {
      await updateTemplate(selectedTemplate.templateId, {
        ...formData,
        routes: formData.routes ? formData.routes.split(',').map(r => r.trim()) : [],
        supervisorBadge: supervisor.badge,
      });
      
      setShowEditModal(false);
      resetForm();
      Alert.alert('Success', 'Template updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update template');
    }
  };

  // Handle delete template
  const handleDelete = async (template) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(template.templateId, supervisor.badge);
              Alert.alert('Success', 'Template deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  // Handle use template
  const handleUseTemplate = async (template) => {
    await useTemplate(template.templateId);
    // This would typically trigger the message composition with this template
    Alert.alert('Template Selected', `Using template: ${template.name}`);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'custom',
      subject: '',
      content: '',
      routes: '',
      isUrgent: false,
    });
    setSelectedTemplate(null);
  };

  // Open edit modal
  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      content: template.content,
      routes: template.routes ? template.routes.join(', ') : '',
      isUrgent: template.isUrgent,
    });
    setShowEditModal(true);
  };

  // Open preview modal
  const openPreviewModal = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  // Render category tabs
  const renderCategoryTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.value}
          style={[
            styles.categoryTab,
            selectedCategory === category.value && styles.categoryTabActive,
          ]}
          onPress={() => setSelectedCategory(category.value)}
        >
          <Text
            style={[
              styles.categoryTabText,
              selectedCategory === category.value && styles.categoryTabTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render template card
  const renderTemplateCard = (template) => (
    <View key={template.templateId} style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateSubject} numberOfLines={1}>
            {template.subject}
          </Text>
          <View style={styles.templateMeta}>
            <Text style={styles.templateCategory}>{template.category}</Text>
            {template.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
            {template.routes && template.routes.length > 0 && (
              <Text style={styles.routeCount}>
                {template.routes.length} routes
              </Text>
            )}
          </View>
        </View>
        <View style={styles.templateStats}>
          <Text style={styles.useCount}>Used {template.useCount} times</Text>
          {template.lastUsed && (
            <Text style={styles.lastUsed}>
              Last: {new Date(template.lastUsed).toLocaleDateString('en-GB')}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.templateActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUseTemplate(template)}
        >
          <Ionicons name="send" size={20} color="#2563eb" />
          <Text style={styles.actionButtonText}>Use</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openPreviewModal(template)}
        >
          <Ionicons name="eye" size={20} color="#6b7280" />
          <Text style={styles.actionButtonText}>Preview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(template)}
        >
          <Ionicons name="pencil" size={20} color="#6b7280" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(template)}
        >
          <Ionicons name="trash" size={20} color="#dc2626" />
          <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render create/edit modal
  const renderFormModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Template' : 'Create New Template'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowCreateModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Template Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., A1 Closure Northbound"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category *</Text>
              <View style={styles.categoryPicker}>
                {categories.slice(1).map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      formData.category === cat.value && styles.categoryOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.value })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.category === cat.value && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject Line *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="e.g., URGENT: A1 Northbound Closed"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message Content *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Enter the message content..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Affected Routes (comma-separated)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.routes}
                onChangeText={(text) => setFormData({ ...formData, routes: text })}
                placeholder="e.g., 21, X21, 309, 310"
              />
            </View>
            
            <TouchableOpacity
              style={styles.urgentToggle}
              onPress={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
            >
              <Ionicons
                name={formData.isUrgent ? "checkbox" : "square-outline"}
                size={24}
                color="#2563eb"
              />
              <Text style={styles.urgentToggleText}>Mark as Urgent</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={isEdit ? handleUpdate : handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>
                  {isEdit ? 'Update Template' : 'Create Template'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render preview modal
  const renderPreviewModal = () => (
    <Modal
      visible={showPreviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Template Preview</Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          {selectedTemplate && (
            <ScrollView style={styles.previewContent}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Template Name:</Text>
                <Text style={styles.previewValue}>{selectedTemplate.name}</Text>
              </View>
              
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Category:</Text>
                <Text style={styles.previewValue}>{selectedTemplate.category}</Text>
              </View>
              
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Subject:</Text>
                <Text style={styles.previewValue}>{selectedTemplate.subject}</Text>
              </View>
              
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Content:</Text>
                <Text style={styles.previewContent}>{selectedTemplate.content}</Text>
              </View>
              
              {selectedTemplate.routes && selectedTemplate.routes.length > 0 && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Affected Routes:</Text>
                  <Text style={styles.previewValue}>
                    {selectedTemplate.routes.join(', ')}
                  </Text>
                </View>
              )}
              
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Created by:</Text>
                <Text style={styles.previewValue}>
                  {selectedTemplate.createdByName} on{' '}
                  {new Date(selectedTemplate.createdAt).toLocaleString('en-GB')}
                </Text>
              </View>
              
              {selectedTemplate.lastModifiedBy && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Last modified by:</Text>
                  <Text style={styles.previewValue}>
                    {selectedTemplate.lastModifiedBy} on{' '}
                    {new Date(selectedTemplate.lastModifiedAt).toLocaleString('en-GB')}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => {
                setShowPreviewModal(false);
                handleUseTemplate(selectedTemplate);
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>Use Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Template Manager</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Template</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {renderCategoryTabs()}
      
      {isLoading && !templates.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : filteredTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No templates found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search' : 'Create your first template'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.templateList}>
          {filteredTemplates.map(renderTemplateCard)}
        </ScrollView>
      )}
      
      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryTabs: {
    maxHeight: 40,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  categoryTabActive: {
    backgroundColor: '#2563eb',
  },
  categoryTabText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  templateList: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  templateSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  templateCategory: {
    fontSize: 12,
    color: '#2563eb',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  urgentBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  urgentText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
  },
  routeCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  templateStats: {
    alignItems: 'flex-end',
  },
  useCount: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
  },
  lastUsed: {
    fontSize: 10,
    color: '#9ca3af',
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  formTextArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryOptionText: {
    color: '#6b7280',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  urgentToggleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonPrimary: {
    backgroundColor: '#2563eb',
  },
  modalButtonTextSecondary: {
    color: '#374151',
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: '500',
  },
  
  // Preview styles
  previewContent: {
    padding: 20,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default TemplateManager;
