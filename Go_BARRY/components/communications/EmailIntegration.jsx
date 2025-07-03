import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const EmailIntegration = ({ onClose }) => {
  const { supervisor } = useSupervisorSession();
  const { emailTemplates, distributionLists, logCommunication } = useConvexSync();
  const [activeView, setActiveView] = useState('compose'); // compose, templates, lists, sent
  const [showOutlookModal, setShowOutlookModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    template: null,
    priority: 'normal',
    attachments: []
  });

  // Quick access email addresses
  const quickContacts = [
    { name: 'Traffic Control', email: 'traffic.control@gonortheast.com', group: true },
    { name: 'All Supervisors', email: 'supervisors@gonortheast.com', group: true },
    { name: 'Operations Manager', email: 'ops.manager@gonortheast.com' },
    { name: 'Driver Support', email: 'driver.support@gonortheast.com', group: true },
    { name: 'Emergency Response', email: 'emergency@gonortheast.com', group: true }
  ];

  // Handle Outlook Web Access button
  const openOutlookWebAccess = () => {
    if (Platform.OS === 'web') {
      // Open Outlook Web Access in a new window/tab
      window.open('https://outlook.office365.com/mail/', '_blank', 'width=1200,height=800');
    } else {
      setShowOutlookModal(true);
    }
  };

  // Quick compose function
  const handleQuickCompose = async () => {
    if (!emailData.to.length || !emailData.subject) {
      alert('Please add recipients and subject');
      return;
    }

    setIsLoading(true);
    try {
      // Log the email activity
      await logCommunication({
        type: 'email',
        supervisorId: supervisor.id,
        recipients: emailData.to,
        subject: emailData.subject,
        status: 'sent',
        timestamp: new Date().toISOString()
      });

      // Open compose window with pre-filled data
      const mailtoLink = `mailto:${emailData.to.join(',')}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      
      if (Platform.OS === 'web') {
        window.open(mailtoLink);
      }

      // Reset form
      setEmailData({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        template: null,
        priority: 'normal',
        attachments: []
      });

      alert('Email composed successfully!');
    } catch (error) {
      console.error('Email compose error:', error);
      alert('Failed to compose email');
    } finally {
      setIsLoading(false);
    }
  };

  // Add recipient
  const addRecipient = (email, field = 'to') => {
    setEmailData(prev => ({
      ...prev,
      [field]: [...prev[field], email]
    }));
  };

  // Remove recipient
  const removeRecipient = (email, field = 'to') => {
    setEmailData(prev => ({
      ...prev,
      [field]: prev[field].filter(e => e !== email)
    }));
  };

  // Apply template
  const applyTemplate = (template) => {
    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body,
      template: template.id
    }));
    setActiveView('compose');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Integration</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* View Tabs */}
      <View style={styles.tabs}>
        {['compose', 'templates', 'lists', 'sent'].map(view => (
          <TouchableOpacity
            key={view}
            style={[styles.tab, activeView === view && styles.activeTab]}
            onPress={() => setActiveView(view)}
          >
            <Text style={[styles.tabText, activeView === view && styles.activeTabText]}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeView === 'compose' && (
          <View style={styles.composeView}>
            {/* Quick Access Buttons */}
            <View style={styles.quickAccess}>
              <TouchableOpacity 
                style={styles.outlookButton}
                onPress={openOutlookWebAccess}
              >
                <Ionicons name="mail-outline" size={20} color="#fff" />
                <Text style={styles.outlookButtonText}>Open Outlook Web</Text>
              </TouchableOpacity>
            </View>

            {/* Recipients */}
            <View style={styles.field}>
              <Text style={styles.label}>To:</Text>
              <View style={styles.recipientContainer}>
                {emailData.to.map((email, index) => (
                  <View key={index} style={styles.recipientChip}>
                    <Text style={styles.recipientText}>{email}</Text>
                    <TouchableOpacity onPress={() => removeRecipient(email, 'to')}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Quick Contacts */}
            <View style={styles.quickContacts}>
              <Text style={styles.sectionTitle}>Quick Contacts</Text>
              <View style={styles.contactsGrid}>
                {quickContacts.map((contact, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.contactButton}
                    onPress={() => addRecipient(contact.email)}
                  >
                    <Ionicons 
                      name={contact.group ? "people" : "person"} 
                      size={16} 
                      color="#059669" 
                    />
                    <Text style={styles.contactName}>{contact.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.field}>
              <Text style={styles.label}>Subject:</Text>
              <TextInput
                style={styles.input}
                value={emailData.subject}
                onChangeText={(text) => setEmailData(prev => ({ ...prev, subject: text }))}
                placeholder="Enter subject..."
              />
            </View>

            {/* Body */}
            <View style={styles.field}>
              <Text style={styles.label}>Message:</Text>
              <TextInput
                style={[styles.input, styles.bodyInput]}
                value={emailData.body}
                onChangeText={(text) => setEmailData(prev => ({ ...prev, body: text }))}
                placeholder="Type your message..."
                multiline
              />
            </View>

            {/* Priority */}
            <View style={styles.field}>
              <Text style={styles.label}>Priority:</Text>
              <View style={styles.priorityOptions}>
                {['low', 'normal', 'high'].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      emailData.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setEmailData(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityText,
                      emailData.priority === priority && styles.priorityTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
              onPress={handleQuickCompose}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Quick Compose</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeView === 'templates' && (
          <View style={styles.templatesView}>
            <Text style={styles.sectionTitle}>Email Templates</Text>
            {/* Placeholder templates */}
            {[
              { id: 1, name: 'Service Disruption Alert', subject: 'Service Disruption - [ROUTE]', body: 'Dear Team,\n\nWe are experiencing a service disruption on route [ROUTE] due to [REASON].\n\nExpected duration: [DURATION]\n\nPlease inform drivers and update passengers accordingly.\n\nBest regards,\n[NAME]' },
              { id: 2, name: 'Traffic Update', subject: 'Traffic Update - [AREA]', body: 'Traffic alert for [AREA]:\n\n[DETAILS]\n\nAffected routes: [ROUTES]\n\nPlease plan accordingly.' },
              { id: 3, name: 'Emergency Response', subject: 'URGENT: Emergency Response Required', body: 'EMERGENCY ALERT\n\nLocation: [LOCATION]\nIncident: [INCIDENT]\nAction Required: [ACTION]\n\nPlease respond immediately.' }
            ].map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => applyTemplate(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateSubject}>{template.subject}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeView === 'lists' && (
          <View style={styles.listsView}>
            <Text style={styles.sectionTitle}>Distribution Lists</Text>
            {quickContacts.filter(c => c.group).map((list, index) => (
              <View key={index} style={styles.listCard}>
                <Ionicons name="people" size={24} color="#059669" />
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listEmail}>{list.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addRecipient(list.email)}
                >
                  <Ionicons name="add-circle" size={24} color="#059669" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeView === 'sent' && (
          <View style={styles.sentView}>
            <Text style={styles.sectionTitle}>Recent Emails</Text>
            <Text style={styles.emptyText}>Email history will appear here</Text>
          </View>
        )}
      </ScrollView>

      {/* Outlook Modal for mobile */}
      <Modal
        visible={showOutlookModal}
        animationType="slide"
        onRequestClose={() => setShowOutlookModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Outlook Web Access</Text>
            <TouchableOpacity onPress={() => setShowOutlookModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalText}>
            Outlook Web Access is not available in mobile view. 
            Please use the web version or the quick compose feature.
          </Text>
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
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#059669',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  composeView: {
    padding: 16,
  },
  quickAccess: {
    marginBottom: 20,
  },
  outlookButton: {
    flexDirection: 'row',
    backgroundColor: '#0078d4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipientContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recipientText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  quickContacts: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  contactName: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  bodyInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  priorityButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  priorityText: {
    fontSize: 14,
    color: '#666',
  },
  priorityTextActive: {
    color: '#fff',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  templatesView: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
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
  },
  listsView: {
    padding: 16,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  sentView: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
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
  modalText: {
    padding: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default EmailIntegration;