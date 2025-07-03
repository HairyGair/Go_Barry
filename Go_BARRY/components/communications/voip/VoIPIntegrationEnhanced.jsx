/*
 * Go Barry - 8x8 VoIP Integration Enhanced
 * P1 Priority Component - Communications Platform Restructure GOB-COMM-2025-001
 * Web login approach for 8x8 VoIP with quick dial and call tracking
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
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../../design-system/design-system-spec';
import { useSupervisor } from '../../hooks/useSupervisorSession';
import { useConvexSync } from '../../../hooks/useConvexSync';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VoIPIntegrationEnhanced = ({ onClose, visible = true }) => {
  const { supervisorName, supervisorId, isAdmin } = useSupervisor();
  const { logCommunication } = useConvexSync();
  
  // State management
  const [currentView, setCurrentView] = useState('dialer'); // 'dialer', 'contacts', 'history', 'emergency', 'settings'
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [webViewError, setWebViewError] = useState(null);
  
  // Call state
  const [callState, setCallState] = useState({
    isActive: false,
    callId: null,
    direction: null, // 'inbound' | 'outbound'
    number: '',
    duration: 0,
    status: 'idle' // 'idle' | 'ringing' | 'connected' | 'ended'
  });
  
  // Data state
  const [contacts, setContacts] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [emergencyNumbers, setEmergencyNumbers] = useState([]);
  const [dialerNumber, setDialerNumber] = useState('');
  
  // Quick dial numbers
  const quickDialNumbers = [
    { id: '1', name: 'Control Room', number: '+441912775555', icon: 'business' },
    { id: '2', name: 'Emergency Depot', number: '+441912775556', icon: 'build' },
    { id: '3', name: 'Police (Non-Emergency)', number: '101', icon: 'shield' },
    { id: '4', name: 'Transport Coordinator', number: '+441912775557', icon: 'person' },
    { id: '5', name: 'IT Support', number: '+441912775558', icon: 'laptop' },
    { id: '6', name: 'Operations Manager', number: '+441912775559', icon: 'briefcase' }
  ];
  
  // Emergency numbers
  const emergencyNumbersList = [
    { id: 'e1', name: 'Emergency Services', number: '999', description: 'Police, Fire, Ambulance' },
    { id: 'e2', name: 'Police Non-Emergency', number: '101', description: 'Non-urgent police matters' },
    { id: 'e3', name: 'NHS Direct', number: '111', description: 'Non-emergency medical advice' },
    { id: 'e4', name: 'Go North East Emergency', number: '+441912775999', description: '24/7 Emergency Line' }
  ];
  
  // Load data on mount
  useEffect(() => {
    setEmergencyNumbers(emergencyNumbersList);
    fetchCallHistory();
    fetchContacts();
  }, []);
  
  // Fetch call history from API
  const fetchCallHistory = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/communications/voip/history', {
        headers: {
          'Authorization': `Bearer ${supervisorId}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    }
  };
  
  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/communications/voip/contacts', {
        headers: {
          'Authorization': `Bearer ${supervisorId}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };
  
  // Handle dialer input
  const handleDialerInput = (digit) => {
    if (digit === 'delete') {
      setDialerNumber(prev => prev.slice(0, -1));
    } else {
      setDialerNumber(prev => prev + digit);
    }
  };
  
  // Make a call
  const makeCall = async (number) => {
    if (!number) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    setLoading(true);
    try {
      // Log the call attempt
      await logCommunication({
        type: 'voip',
        action: 'outbound_call',
        recipient: number,
        supervisorId,
        timestamp: new Date().toISOString(),
        metadata: {
          dialMethod: 'manual',
          callType: 'voice'
        }
      });
      
      // Open 8x8 web interface in new tab/window
      if (Platform.OS === 'web') {
        const encodedNumber = encodeURIComponent(number);
        const url = `https://8x8.com/webphone?dial=${encodedNumber}`;
        window.open(url, '_blank', 'width=400,height=600');
      } else {
        Alert.alert(
          'Call Started',
          `Initiating call to ${number}`,
          [{ text: 'OK' }]
        );
      }
      
      // Update call state
      setCallState({
        isActive: true,
        callId: Date.now().toString(),
        direction: 'outbound',
        number: number,
        duration: 0,
        status: 'ringing'
      });
      
      // Clear dialer
      setDialerNumber('');
      
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>8x8 VoIP Integration</Text>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close VoIP Integration"
        >
          <Ionicons name="close" size={24} color={DesignSystem.colors.neutral.text.primary} />
        </Pressable>
      </View>
      
      <View style={styles.tabContainer}>
        {['dialer', 'contacts', 'history', 'emergency', 'settings'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, currentView === tab && styles.activeTab]}
            onPress={() => setCurrentView(tab)}
          >
            <Ionicons
              name={
                tab === 'dialer' ? 'keypad' :
                tab === 'contacts' ? 'people' :
                tab === 'history' ? 'time' :
                tab === 'emergency' ? 'warning' :
                'settings'
              }
              size={20}
              color={currentView === tab ? DesignSystem.colors.primary : DesignSystem.colors.neutral.text.secondary}
            />
            <Text style={[styles.tabText, currentView === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  
  // Render dialer view
  const renderDialer = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.dialerContainer}>
      {/* Quick Dial Section */}
      <View style={styles.quickDialSection}>
        <Text style={styles.sectionTitle}>Quick Dial</Text>
        <View style={styles.quickDialGrid}>
          {quickDialNumbers.map((contact) => (
            <Pressable
              key={contact.id}
              style={styles.quickDialButton}
              onPress={() => makeCall(contact.number)}
            >
              <Ionicons name={contact.icon} size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.quickDialName}>{contact.name}</Text>
              <Text style={styles.quickDialNumber}>{contact.number}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Dialer Section */}
      <View style={styles.dialerSection}>
        <TextInput
          style={styles.dialerInput}
          value={dialerNumber}
          onChangeText={setDialerNumber}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          editable={!loading}
        />
        
        <View style={styles.dialPad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <Pressable
              key={digit}
              style={styles.dialButton}
              onPress={() => handleDialerInput(digit)}
              disabled={loading}
            >
              <Text style={styles.dialButtonText}>{digit}</Text>
              {digit === '1' && <Text style={styles.dialButtonSubtext}></Text>}
              {digit === '2' && <Text style={styles.dialButtonSubtext}>ABC</Text>}
              {digit === '3' && <Text style={styles.dialButtonSubtext}>DEF</Text>}
              {digit === '4' && <Text style={styles.dialButtonSubtext}>GHI</Text>}
              {digit === '5' && <Text style={styles.dialButtonSubtext}>JKL</Text>}
              {digit === '6' && <Text style={styles.dialButtonSubtext}>MNO</Text>}
              {digit === '7' && <Text style={styles.dialButtonSubtext}>PQRS</Text>}
              {digit === '8' && <Text style={styles.dialButtonSubtext}>TUV</Text>}
              {digit === '9' && <Text style={styles.dialButtonSubtext}>WXYZ</Text>}
            </Pressable>
          ))}
        </View>
        
        <View style={styles.dialActions}>
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDialerInput('delete')}
            disabled={loading || !dialerNumber}
          >
            <Ionicons name="backspace" size={24} color={DesignSystem.colors.neutral.text.secondary} />
          </Pressable>
          
          <Pressable
            style={[styles.actionButton, styles.callButton, loading && styles.disabledButton]}
            onPress={() => makeCall(dialerNumber)}
            disabled={loading || !dialerNumber}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="call" size={24} color="white" />
                <Text style={styles.callButtonText}>Call</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
  
  // Render contacts view
  const renderContacts = () => (
    <FlatList
      style={styles.content}
      data={contacts}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={DesignSystem.colors.neutral.text.secondary} />
          <Text style={styles.emptyText}>No contacts available</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.contactItem}
          onPress={() => makeCall(item.number)}
        >
          <View style={styles.contactIcon}>
            <Text style={styles.contactInitial}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactNumber}>{item.number}</Text>
            {item.department && (
              <Text style={styles.contactDepartment}>{item.department}</Text>
            )}
          </View>
          <Ionicons name="call" size={20} color={DesignSystem.colors.primary} />
        </Pressable>
      )}
    />
  );
  
  // Render call history view
  const renderHistory = () => (
    <FlatList
      style={styles.content}
      data={callHistory}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={DesignSystem.colors.neutral.text.secondary} />
          <Text style={styles.emptyText}>No call history</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.historyItem}
          onPress={() => makeCall(item.number)}
        >
          <Ionicons
            name={item.direction === 'inbound' ? 'call-received' : 'call-made'}
            size={20}
            color={item.direction === 'inbound' ? DesignSystem.colors.status.success : DesignSystem.colors.primary}
          />
          <View style={styles.historyInfo}>
            <Text style={styles.historyNumber}>{item.number}</Text>
            <Text style={styles.historyTime}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.historyDuration}>
              Duration: {item.duration}s
            </Text>
          </View>
          <Ionicons name="call" size={20} color={DesignSystem.colors.primary} />
        </Pressable>
      )}
    />
  );
  
  // Render emergency numbers view
  const renderEmergency = () => (
    <ScrollView style={styles.content}>
      <View style={styles.emergencyHeader}>
        <Ionicons name="warning" size={32} color={DesignSystem.colors.status.error} />
        <Text style={styles.emergencyTitle}>Emergency Numbers</Text>
      </View>
      
      {emergencyNumbers.map((emergency) => (
        <Pressable
          key={emergency.id}
          style={styles.emergencyItem}
          onPress={() => {
            Alert.alert(
              'Emergency Call',
              `Call ${emergency.name} at ${emergency.number}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => makeCall(emergency.number), style: 'destructive' }
              ]
            );
          }}
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="call" size={24} color="white" />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyName}>{emergency.name}</Text>
            <Text style={styles.emergencyNumber}>{emergency.number}</Text>
            <Text style={styles.emergencyDescription}>{emergency.description}</Text>
          </View>
        </Pressable>
      ))}
      
      <View style={styles.emergencyNote}>
        <Ionicons name="information-circle" size={20} color={DesignSystem.colors.neutral.text.secondary} />
        <Text style={styles.emergencyNoteText}>
          Always dial 999 for life-threatening emergencies
        </Text>
      </View>
    </ScrollView>
  );
  
  // Render settings view
  const renderSettings = () => (
    <ScrollView style={styles.content}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>8x8 Account</Text>
        
        {isAuthenticated ? (
          <View style={styles.accountInfo}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Status:</Text>
              <Text style={styles.accountValue}>Connected</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>User:</Text>
              <Text style={styles.accountValue}>{supervisorName}</Text>
            </View>
            <Pressable
              style={styles.logoutButton}
              onPress={() => {
                setIsAuthenticated(false);
                Alert.alert('Logged Out', 'You have been logged out of 8x8');
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>
              Login to 8x8 to enable VoIP features
            </Text>
            <Pressable
              style={styles.loginButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('https://8x8.com/login', '_blank');
                } else {
                  Alert.alert('Login Required', 'Please login to 8x8 on the web');
                }
              }}
            >
              <Text style={styles.loginButtonText}>Login to 8x8</Text>
            </Pressable>
          </View>
        )}
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Call Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Default Country Code</Text>
          <Text style={styles.settingValue}>+44 (UK)</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Call Recording</Text>
          <Text style={styles.settingValue}>Enabled for Quality</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-Answer</Text>
          <Text style={styles.settingValue}>Disabled</Text>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <Pressable style={styles.helpItem}>
          <Ionicons name="help-circle" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.helpText}>8x8 User Guide</Text>
        </Pressable>
        <Pressable style={styles.helpItem}>
          <Ionicons name="headset" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.helpText}>IT Support: ext. 5558</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
  
  // Main render
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        {currentView === 'dialer' && renderDialer()}
        {currentView === 'contacts' && renderContacts()}
        {currentView === 'history' && renderHistory()}
        {currentView === 'emergency' && renderEmergency()}
        {currentView === 'settings' && renderSettings()}
        
        {/* Active call banner */}
        {callState.isActive && (
          <View style={styles.activeCallBanner}>
            <View style={styles.callInfo}>
              <Text style={styles.callStatus}>{callState.status}</Text>
              <Text style={styles.callNumber}>{callState.number}</Text>
              <Text style={styles.callDuration}>00:{String(callState.duration).padStart(2, '0')}</Text>
            </View>
            <Pressable
              style={styles.endCallButton}
              onPress={() => {
                setCallState({
                  isActive: false,
                  callId: null,
                  direction: null,
                  number: '',
                  duration: 0,
                  status: 'idle'
                });
                Alert.alert('Call Ended', 'The call has been terminated');
              }}
            >
              <Ionicons name="close-circle" size={32} color={DesignSystem.colors.status.error} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral.background
  },
  header: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary
  },
  closeButton: {
    padding: DesignSystem.spacing.sm
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    gap: 4
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.primary
  },
  tabText: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.secondary
  },
  activeTabText: {
    color: DesignSystem.colors.primary,
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  
  // Dialer styles
  dialerContainer: {
    padding: DesignSystem.spacing.md
  },
  quickDialSection: {
    marginBottom: DesignSystem.spacing.xl
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.md
  },
  quickDialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm
  },
  quickDialButton: {
    width: (screenWidth - DesignSystem.spacing.md * 2 - DesignSystem.spacing.sm * 2) / 3,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  quickDialName: {
    fontSize: 12,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.primary,
    marginTop: DesignSystem.spacing.xs,
    textAlign: 'center'
  },
  quickDialNumber: {
    fontSize: 10,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: 2
  },
  dialerSection: {
    alignItems: 'center'
  },
  dialerInput: {
    width: '100%',
    height: 48,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  dialPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 10,
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.lg
  },
  dialButton: {
    width: 80,
    height: 80,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  dialButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary
  },
  dialButtonSubtext: {
    fontSize: 10,
    color: DesignSystem.colors.neutral.text.secondary,
    position: 'absolute',
    bottom: 20
  },
  dialActions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
    width: '100%',
    justifyContent: 'center'
  },
  actionButton: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm
  },
  deleteButton: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  callButton: {
    backgroundColor: DesignSystem.colors.status.success,
    minWidth: 120
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.5
  },
  
  // Contact styles
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md
  },
  contactInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.primary
  },
  contactNumber: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: 2
  },
  contactDepartment: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.tertiary,
    marginTop: 2
  },
  
  // History styles
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border,
    gap: DesignSystem.spacing.md
  },
  historyInfo: {
    flex: 1
  },
  historyNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.primary
  },
  historyTime: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: 2
  },
  historyDuration: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.tertiary,
    marginTop: 2
  },
  
  // Emergency styles
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.neutral.surface,
    marginBottom: DesignSystem.spacing.md
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.status.error
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.neutral.surface,
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.borderRadius.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.status.error
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.spacing.md
  },
  emergencyInfo: {
    flex: 1
  },
  emergencyName: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.status.error,
    marginTop: 4
  },
  emergencyDescription: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: 4
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.lg,
    marginHorizontal: DesignSystem.spacing.md
  },
  emergencyNoteText: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary
  },
  
  // Settings styles
  settingsSection: {
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border
  },
  accountInfo: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.borderRadius.md
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.sm
  },
  accountLabel: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.primary
  },
  logoutButton: {
    marginTop: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.status.error,
    borderRadius: DesignSystem.layout.borderRadius.sm
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  loginPrompt: {
    alignItems: 'center',
    padding: DesignSystem.spacing.lg
  },
  loginText: {
    fontSize: 16,
    color: DesignSystem.colors.neutral.text.secondary,
    marginBottom: DesignSystem.spacing.md,
    textAlign: 'center'
  },
  loginButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.borderRadius.md
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: DesignSystem.spacing.sm
  },
  settingLabel: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.primary
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm
  },
  helpText: {
    fontSize: 14,
    color: DesignSystem.colors.primary
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl * 2
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: DesignSystem.spacing.md
  },
  
  // Active call banner
  activeCallBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DesignSystem.colors.status.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : DesignSystem.spacing.md
  },
  callInfo: {
    flex: 1
  },
  callStatus: {
    fontSize: 12,
    color: 'white',
    textTransform: 'uppercase',
    opacity: 0.8
  },
  callNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white'
  },
  callDuration: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8
  },
  endCallButton: {
    padding: DesignSystem.spacing.sm
  }
});

export default VoIPIntegrationEnhanced;