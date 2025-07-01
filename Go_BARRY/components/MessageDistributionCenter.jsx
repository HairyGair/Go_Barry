// Go_BARRY/components/MessageDistributionCenter.jsx
// Message Distribution Center - Multi-channel communication system
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageDistributionCenter = ({ baseUrl }) => {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);

  const channels = [
    { id: 'all', name: 'All Channels', icon: 'megaphone', color: '#8B5CF6' },
    { id: 'display', name: 'Control Room Display', icon: 'tv', color: '#3B82F6' },
    { id: 'supervisors', name: 'Supervisors', icon: 'people', color: '#10B981' },
    { id: 'drivers', name: 'Drivers', icon: 'car', color: '#F59E0B' },
    { id: 'email', name: 'Email', icon: 'mail', color: '#EF4444' },
    { id: 'sms', name: 'SMS', icon: 'chatbox-ellipses', color: '#EC4899' },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Alert.alert(
      'Send Message',
      `Send to ${channels.find(c => c.id === selectedChannel)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            console.log('Sending message:', message, 'to channel:', selectedChannel);
            setMessage('');
            Alert.alert('Success', 'Message sent successfully!');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
        <Text style={styles.headerTitle}>Message Distribution Center</Text>
      </View>

      {/* Channel Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Channel</Text>
        <View style={styles.channelGrid}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={[
                styles.channelCard,
                selectedChannel === channel.id && styles.channelCardActive,
                { borderColor: channel.color }
              ]}
              onPress={() => setSelectedChannel(channel.id)}
            >
              <Ionicons 
                name={channel.icon} 
                size={24} 
                color={selectedChannel === channel.id ? channel.color : '#6B7280'} 
              />
              <Text style={[
                styles.channelName,
                selectedChannel === channel.id && { color: channel.color }
              ]}>
                {channel.name}
              </Text>
              {selectedChannel === channel.id && (
                <Ionicons name="checkmark-circle" size={20} color={channel.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Message Composition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compose Message</Text>
        <View style={styles.messageBox}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>
      </View>

      {/* Quick Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.templateChip}
            onPress={() => setMessage('Service disruption on route [ROUTE]. Please allow extra time for your journey.')}
          >
            <Text style={styles.templateText}>Service Disruption</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.templateChip}
            onPress={() => setMessage('Roadworks on [LOCATION] causing delays. Alternative routes advised.')}
          >
            <Text style={styles.templateText}>Roadworks Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.templateChip}
            onPress={() => setMessage('Weather conditions affecting services. Please check before travelling.')}
          >
            <Text style={styles.templateText}>Weather Alert</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Send Button */}
      <TouchableOpacity 
        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
        onPress={handleSendMessage}
        disabled={!message.trim()}
      >
        <Ionicons name="send" size={20} color="#FFFFFF" />
        <Text style={styles.sendButtonText}>Send Message</Text>
      </TouchableOpacity>

      {/* Recent Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        <View style={styles.recentMessage}>
          <View style={styles.recentMessageHeader}>
            <Ionicons name="megaphone" size={16} color="#8B5CF6" />
            <Text style={styles.recentMessageChannel}>All Channels</Text>
            <Text style={styles.recentMessageTime}>5 mins ago</Text>
          </View>
          <Text style={styles.recentMessageText}>
            Service disruption on route 21. Delays expected until 14:00.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 8,
    width: Platform.OS === 'web' ? 'calc(50% - 6px)' : '48%',
  },
  channelCardActive: {
    backgroundColor: '#F8FAFC',
  },
  channelName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  messageBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageInput: {
    fontSize: 16,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  templateChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  templateText: {
    fontSize: 14,
    color: '#475569',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recentMessageChannel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  recentMessageTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recentMessageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});

export default MessageDistributionCenter;
