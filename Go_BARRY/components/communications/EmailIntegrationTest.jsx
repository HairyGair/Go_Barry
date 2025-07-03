import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmailIntegration from './EmailIntegration';

// Test component to demonstrate Email Integration
const EmailIntegrationTest = () => {
  const [showEmailComponent, setShowEmailComponent] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Integration Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          This test demonstrates the Email Integration component with the following features:
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✅ Outlook Web Access integration</Text>
          <Text style={styles.featureItem}>✅ Quick compose functionality</Text>
          <Text style={styles.featureItem}>✅ Email templates (4 default templates)</Text>
          <Text style={styles.featureItem}>✅ Distribution lists (4 default lists)</Text>
          <Text style={styles.featureItem}>✅ Priority settings</Text>
          <Text style={styles.featureItem}>✅ Activity tracking</Text>
          <Text style={styles.featureItem}>✅ Responsive design</Text>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowEmailComponent(true)}
        >
          <Ionicons name="mail" size={24} color="#fff" />
          <Text style={styles.testButtonText}>Open Email Integration</Text>
        </TouchableOpacity>

        <View style={styles.integrationInfo}>
          <Text style={styles.infoTitle}>Integration Details:</Text>
          <Text style={styles.infoText}>
            • Opens Outlook Web Access in new window/tab on web{'\n'}
            • Falls back to mailto: links for quick compose{'\n'}
            • Tracks all email activities in Convex{'\n'}
            • Templates support variable substitution{'\n'}
            • Distribution lists include all supervisors
          </Text>
        </View>
      </ScrollView>

      {showEmailComponent && (
        <View style={styles.modalContainer}>
          <EmailIntegration onClose={() => setShowEmailComponent(false)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  featureList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  integrationInfo: {
    backgroundColor: '#e6f7ed',
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
});

export default EmailIntegrationTest;