/*
 * Go Barry - Email Integration Enhanced
 * P1 Priority Component - Communications Platform Restructure GOB-COMM-2025-001
 * Outlook Web Access integration with template management and distribution lists
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../design-system/design-system-spec';
import { useSupervisor } from '../hooks/useSupervisorSession';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EmailIntegrationEnhanced = ({ onClose, visible = true }) => {
  const { supervisorName, isAdmin } = useSupervisor();
  
  // State management
  const [currentView, setCurrentView] = useState('compose'); // 'compose', 'templates', 'lists', 'outbox', 'settings'
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [distributionLists, setDistributionLists] = useState([]);
  const [emailStats, setEmailStats] = useState({});
  const [outlookReady, setOutlookReady] = useState(false);
  const [webViewError, setWebViewError] = useState(null);
  
  // Email composition state
  const [emailForm, setEmailForm] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    template: null,
    distributionList: null,
    priority: 'normal',
    schedule: null,
    attachments: []
  });
  
  // Template management
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    loadEmailData();
  }, []);
  
  const loadEmailData = async () => {
    setLoading(true);
    try {
      // Load templates and distribution lists from backend
      const [templatesRes, listsRes, statsRes] = await Promise.all([
        fetch('/api/communications/email/templates'),
        fetch('/api/communications/email/distribution-lists'),
        fetch('/api/communications/email/stats')
      ]);
      
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data?.templates || templatesData.templates || []);
      }
      
      if (listsRes.ok) {
        const listsData = await listsRes.json();
        setDistributionLists(listsData.data?.lists || listsData.lists || []);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setEmailStats(statsData.data || statsData || {});
      }
      
    } catch (error) {
      console.error('Failed to load email data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setEmailForm(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body,
      template: template.id
    }));
    
    // Initialize template variables
    const variables = {};
    template.variables?.forEach(variable => {
      variables[variable] = '';
    });
    setTemplateVariables(variables);
    setCurrentView('compose');
  };
  
  const handleDistributionListSelect = (list) => {
    setEmailForm(prev => ({
      ...prev,
      to: [...prev.to, ...list.members],
      distributionList: list.id
    }));
  };
  
  const processTemplateVariables = () => {
    if (!selectedTemplate) return emailForm;
    
    let processedSubject = emailForm.subject;
    let processedBody = emailForm.body;
    
    Object.keys(templateVariables).forEach(key => {
      const value = templateVariables[key] || '';
      processedSubject = processedSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return {
      ...emailForm,
      subject: processedSubject,
      body: processedBody
    };
  };
  
  const handleSendEmail = async () => {
    const processedEmail = processTemplateVariables();
    
    if (!processedEmail.to.length) {
      Alert.alert('Error', 'Please add at least one recipient');
      return;
    }
    
    if (!processedEmail.subject.trim()) {
      Alert.alert('Error', 'Please add a subject');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/communications/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...processedEmail,
          sender: supervisorName
        })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Email has been sent successfully');
        // Reset form
        setEmailForm({
          to: [],
          cc: [],
          bcc: [],
          subject: '',
          body: '',
          template: null,
          distributionList: null,
          priority: 'normal',
          schedule: null,
          attachments: []
        });
        setSelectedTemplate(null);
        setTemplateVariables({});
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Ionicons name="mail" size={24} color={DesignSystem.colors.primary} />
        <Text style={styles.headerTitle}>Email Integration</Text>
        <Text style={styles.headerSubtitle}>Outlook Web Access</Text>
      </View>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={24} color={DesignSystem.colors.neutral.text.secondary} />
      </Pressable>
    </View>
  );
  
  const renderNavigation = () => (
    <View style={styles.navigation}>
      {[
        { id: 'compose', label: 'Compose', icon: 'create' },
        { id: 'templates', label: 'Templates', icon: 'document-text' },
        { id: 'lists', label: 'Lists', icon: 'people' },
        { id: 'outbox', label: 'Outbox', icon: 'send' },
        { id: 'outlook', label: 'Outlook Web', icon: 'globe' }
      ].map((item) => (
        <Pressable
          key={item.id}
          style={[
            styles.navItem,
            currentView === item.id && styles.navItemActive
          ]}
          onPress={() => setCurrentView(item.id)}
        >
          <Ionicons
            name={item.icon}
            size={16}
            color={currentView === item.id ? DesignSystem.colors.primary : DesignSystem.colors.neutral.text.tertiary}
          />
          <Text style={[
            styles.navText,
            currentView === item.id && styles.navTextActive
          ]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  
  const renderEmailComposer = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Recipients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipients</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>To:</Text>
          <TextInput
            style={styles.textInput}
            value={emailForm.to.join(', ')}
            onChangeText={(text) => setEmailForm(prev => ({ ...prev, to: text.split(',').map(email => email.trim()).filter(Boolean) }))}
            placeholder="Enter email addresses separated by commas"
            placeholderTextColor={DesignSystem.colors.neutral.text.tertiary}
            keyboardType="email-address"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CC:</Text>
          <TextInput
            style={styles.textInput}
            value={emailForm.cc.join(', ')}
            onChangeText={(text) => setEmailForm(prev => ({ ...prev, cc: text.split(',').map(email => email.trim()).filter(Boolean) }))}
            placeholder="CC recipients (optional)"
            placeholderTextColor={DesignSystem.colors.neutral.text.tertiary}
            keyboardType="email-address"
          />
        </View>
      </View>
      
      {/* Subject */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject</Text>
        <TextInput
          style={styles.textInput}
          value={emailForm.subject}
          onChangeText={(text) => setEmailForm(prev => ({ ...prev, subject: text }))}
          placeholder="Email subject"
          placeholderTextColor={DesignSystem.colors.neutral.text.tertiary}
        />
      </View>
      
      {/* Template Variables */}
      {selectedTemplate && selectedTemplate.variables?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template Variables</Text>
          {selectedTemplate.variables.map((variable) => (
            <View key={variable} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{variable}:</Text>
              <TextInput
                style={styles.textInput}
                value={templateVariables[variable] || ''}
                onChangeText={(text) => setTemplateVariables(prev => ({ ...prev, [variable]: text }))}
                placeholder={`Enter ${variable}`}
                placeholderTextColor={DesignSystem.colors.neutral.text.tertiary}
              />
            </View>
          ))}
        </View>
      )}
      
      {/* Message Body */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={emailForm.body}
          onChangeText={(text) => setEmailForm(prev => ({ ...prev, body: text }))}
          placeholder="Email message body"
          placeholderTextColor={DesignSystem.colors.neutral.text.tertiary}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>
      
      {/* Send Button */}
      <Pressable
        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
        onPress={handleSendEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={DesignSystem.colors.neutral.text.primary} />
        ) : (
          <Ionicons name="send" size={20} color={DesignSystem.colors.neutral.text.primary} />
        )}
        <Text style={styles.sendButtonText}>
          {loading ? 'Sending...' : 'Send Email'}
        </Text>
      </Pressable>
    </ScrollView>
  );
  
  const renderTemplates = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Templates</Text>
        
        {templates.map((template) => (
          <Pressable
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={DesignSystem.colors.neutral.text.tertiary} />
            </View>
            <Text style={styles.templateSubject}>{template.subject}</Text>
            <Text style={styles.templateDescription} numberOfLines={2}>
              {template.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </Text>
            {template.variables?.length > 0 && (
              <View style={styles.templateVariables}>
                <Text style={styles.templateVariablesLabel}>Variables:</Text>
                <Text style={styles.templateVariablesText}>
                  {template.variables.join(', ')}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderDistributionLists = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribution Lists</Text>
        
        {distributionLists.map((list) => (
          <Pressable
            key={list.id}
            style={styles.listCard}
            onPress={() => handleDistributionListSelect(list)}
          >
            <View style={styles.listHeader}>
              <Ionicons name="people" size={20} color={DesignSystem.colors.secondary} />
              <Text style={styles.listName}>{list.name}</Text>
            </View>
            <Text style={styles.listDescription}>{list.description}</Text>
            <Text style={styles.listMembers}>
              {list.members.length} member{list.members.length === 1 ? '' : 's'}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderOutlookWeb = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.content}>
          <View style={styles.outlookContainer}>
            <Text style={styles.sectionTitle}>Outlook Web Access</Text>
            <Text style={styles.outlookDescription}>
              Access your full Outlook email interface for advanced features.
            </Text>
            
            <Pressable
              style={styles.outlookButton}
              onPress={() => {
                const outlookUrl = 'https://outlook.office.com';
                if (Platform.OS === 'web') {
                  window.open(outlookUrl, '_blank', 'width=1200,height=800');
                } else {
                  // For mobile, would use Linking
                  console.log('Open Outlook Web Access:', outlookUrl);
                }
              }}
            >
              <Ionicons name="globe" size={20} color={DesignSystem.colors.neutral.text.primary} />
              <Text style={styles.outlookButtonText}>Open Outlook Web Access</Text>
            </Pressable>
            
            {/* Embedded iframe for web */}
            <View style={styles.iframeContainer}>
              <Text style={styles.iframeNote}>
                Note: For security reasons, Outlook Web Access will open in a new window.
                You can use the compose form above for quick emails, or use the full Outlook interface for advanced features.
              </Text>
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outlook Mobile Access</Text>
          <Text style={styles.outlookDescription}>
            Use the Outlook mobile app or web browser to access your full email interface.
          </Text>
        </View>
      </View>
    );
  };
  
  const renderContent = () => {
    switch (currentView) {
      case 'templates':
        return renderTemplates();
      case 'lists':
        return renderDistributionLists();
      case 'outlook':
        return renderOutlookWeb();
      case 'outbox':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Email Outbox</Text>
            <Text style={styles.comingSoon}>Coming Soon - Email tracking and scheduling</Text>
          </View>
        );
      default:
        return renderEmailComposer();
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        {renderNavigation()}
        {loading && currentView === 'compose' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.loadingText}>Loading email data...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border,
    backgroundColor: DesignSystem.colors.neutral.surface,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  headerTitle: {
    ...DesignSystem.typography.sizes.h3,
    color: DesignSystem.colors.neutral.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
  
  headerSubtitle: {
    ...DesignSystem.typography.sizes.caption,
    color: DesignSystem.colors.neutral.text.tertiary,
    marginLeft: DesignSystem.spacing.sm,
  },
  
  closeButton: {
    padding: DesignSystem.spacing.sm,
  },
  
  navigation: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border,
  },
  
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.primary,
  },
  
  navText: {
    ...DesignSystem.typography.sizes.bodySmall,
    color: DesignSystem.colors.neutral.text.tertiary,
    marginLeft: DesignSystem.spacing.xs,
  },
  
  navTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  
  sectionTitle: {
    ...DesignSystem.typography.sizes.h4,
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  
  inputGroup: {
    marginBottom: DesignSystem.spacing.md,
  },
  
  inputLabel: {
    ...DesignSystem.typography.sizes.label,
    color: DesignSystem.colors.neutral.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  
  textInput: {
    ...DesignSystem.layout.card,
    ...DesignSystem.typography.sizes.body,
    color: DesignSystem.colors.neutral.text.primary,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: 48,
  },
  
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.layout.borderRadius.md,
    marginTop: DesignSystem.spacing.lg,
  },
  
  sendButtonDisabled: {
    opacity: 0.6,
  },
  
  sendButtonText: {
    ...DesignSystem.typography.sizes.button,
    color: DesignSystem.colors.neutral.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
  
  templateCard: {
    ...DesignSystem.layout.card,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
  },
  
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.xs,
  },
  
  templateName: {
    ...DesignSystem.typography.sizes.h4,
    color: DesignSystem.colors.neutral.text.primary,
  },
  
  templateSubject: {
    ...DesignSystem.typography.sizes.bodySmall,
    color: DesignSystem.colors.secondary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  
  templateDescription: {
    ...DesignSystem.typography.sizes.bodySmall,
    color: DesignSystem.colors.neutral.text.secondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  
  templateVariables: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  
  templateVariablesLabel: {
    ...DesignSystem.typography.sizes.caption,
    color: DesignSystem.colors.neutral.text.tertiary,
    fontWeight: '600',
    marginRight: DesignSystem.spacing.xs,
  },
  
  templateVariablesText: {
    ...DesignSystem.typography.sizes.caption,
    color: DesignSystem.colors.neutral.text.tertiary,
  },
  
  listCard: {
    ...DesignSystem.layout.card,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
  },
  
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  
  listName: {
    ...DesignSystem.typography.sizes.h4,
    color: DesignSystem.colors.neutral.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
  
  listDescription: {
    ...DesignSystem.typography.sizes.bodySmall,
    color: DesignSystem.colors.neutral.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  
  listMembers: {
    ...DesignSystem.typography.sizes.caption,
    color: DesignSystem.colors.neutral.text.tertiary,
  },
  
  outlookContainer: {
    alignItems: 'center',
  },
  
  outlookDescription: {
    ...DesignSystem.typography.sizes.body,
    color: DesignSystem.colors.neutral.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  
  outlookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.tertiary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.layout.borderRadius.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  
  outlookButtonText: {
    ...DesignSystem.typography.sizes.button,
    color: DesignSystem.colors.neutral.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
  
  iframeContainer: {
    width: '100%',
    minHeight: 400,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iframeNote: {
    ...DesignSystem.typography.sizes.bodySmall,
    color: DesignSystem.colors.neutral.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  
  loadingText: {
    ...DesignSystem.typography.sizes.body,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: DesignSystem.spacing.md,
  },
  
  comingSoon: {
    ...DesignSystem.typography.sizes.body,
    color: DesignSystem.colors.neutral.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EmailIntegrationEnhanced;