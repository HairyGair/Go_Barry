/*
 * Go Barry - Message Generator
 * Generate platform-specific messages for incidents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/incidents.styles';

const MessageGenerator = ({ 
  incident,
  visible,
  onClose,
  onMessagesSaved
}) => {
  const [messages, setMessages] = useState({
    ticketer: '',
    passengerCloud: '',
    email: ''
  });
  const [copiedField, setCopiedField] = useState(null);

  // Message templates
  const templates = {
    ticketer: {
      diversion: {
        subject: 'Diversion - {location}',
        body: 'Service {routes} diverting via {diversion}. {reason}. Allow extra time.'
      },
      delay: {
        subject: 'Delays - {location}',
        body: 'Service {routes} delayed at {location}. {reason}. Allow extra time.'
      },
      caution: {
        subject: 'Caution - {location}',
        body: 'Service {routes} proceed with caution at {location}. {reason}.'
      }
    },
    passengerCloud: {
      diversion: 'Due to {reason} at {location}, services {routes} are currently diverting. We apologise for any inconvenience and advise allowing extra time for your journey.',
      delay: 'Services {routes} are experiencing delays at {location} due to {reason}. We apologise for the inconvenience.',
      caution: 'Please be advised that services {routes} may experience minor delays at {location} due to {reason}.'
    },
    email: {
      subject: 'Service Update: {type} affecting routes {routes}',
      body: `Dear Team,

We are currently experiencing a {type} at {location} affecting the following services: {routes}.

Details:
- Type: {type}
- Location: {location}
- Affected Routes: {routes}
- Reason: {description}
- Status: {status}
- Reported at: {time}

{actionTaken}

Please ensure all relevant drivers are informed.

Best regards,
{supervisorName}
Go North East Control Room`
    }
  };

  useEffect(() => {
    if (incident) {
      generateMessages();
    }
  }, [incident]);

  const generateMessages = () => {
    if (!incident) return;

    const routesStr = incident.affectsRoutes?.join(', ') || 'multiple services';
    const location = incident.location || 'location';
    const type = incident.type || 'incident';
    const description = incident.description || 'traffic incident';
    const actionTaken = incident.actionTaken || '';
    const time = new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Determine message type
    const needsDiversion = actionTaken.toLowerCase().includes('divert') || 
                          description.toLowerCase().includes('divert');
    const isDelay = type.toLowerCase().includes('congestion') || 
                   description.toLowerCase().includes('delay');
    
    // Generate Ticketer message
    let ticketerTemplate = templates.ticketer.caution;
    if (needsDiversion) {
      ticketerTemplate = templates.ticketer.diversion;
    } else if (isDelay) {
      ticketerTemplate = templates.ticketer.delay;
    }

    const ticketerSubject = ticketerTemplate.subject
      .replace('{location}', truncateLocation(location, 20));
    
    const ticketerBody = ticketerTemplate.body
      .replace('{routes}', routesStr)
      .replace('{location}', truncateLocation(location, 20))
      .replace('{diversion}', extractDiversion(actionTaken))
      .replace('{reason}', truncateReason(description, 30));

    // Generate Passenger Cloud message
    let passengerTemplate = templates.passengerCloud.caution;
    if (needsDiversion) {
      passengerTemplate = templates.passengerCloud.diversion;
    } else if (isDelay) {
      passengerTemplate = templates.passengerCloud.delay;
    }

    const passengerMessage = passengerTemplate
      .replace('{routes}', routesStr)
      .replace('{location}', location)
      .replace('{reason}', description.toLowerCase());

    // Generate Email message
    const emailSubject = templates.email.subject
      .replace('{type}', type)
      .replace('{routes}', routesStr);

    const emailBody = templates.email.body
      .replace(/\{type\}/g, type)
      .replace(/\{location\}/g, location)
      .replace(/\{routes\}/g, routesStr)
      .replace('{description}', description)
      .replace('{status}', incident.status || 'Active')
      .replace('{time}', time)
      .replace('{actionTaken}', actionTaken ? `Action Taken: ${actionTaken}` : '')
      .replace('{supervisorName}', incident.createdBy || 'Control Room Supervisor');

    setMessages({
      ticketer: `${ticketerSubject}\n${ticketerBody}`,
      passengerCloud: passengerMessage,
      email: `Subject: ${emailSubject}\n\n${emailBody}`
    });
  };

  const truncateLocation = (location, maxLength) => {
    if (location.length <= maxLength) return location;
    return location.substring(0, maxLength - 3) + '...';
  };

  const truncateReason = (reason, maxLength) => {
    const simplified = reason.toLowerCase()
      .replace('road traffic collision', 'RTC')
      .replace('emergency services', 'emergency')
      .replace('unplanned roadworks', 'roadworks');
    
    if (simplified.length <= maxLength) return simplified;
    return simplified.substring(0, maxLength - 3) + '...';
  };

  const extractDiversion = (actionTaken) => {
    if (!actionTaken) return 'alternative route';
    const match = actionTaken.match(/via\s+([^.]+)/i);
    return match ? match[1] : 'alternative route';
  };

  const copyToClipboard = async (field) => {
    const text = messages[field];
    if (!text) return;

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        alert('Failed to copy text');
      }
    } else {
      // React Native clipboard
      Alert.alert('Copied', `${field} message copied to clipboard`);
    }
  };

  const handleSave = () => {
    if (onMessagesSaved) {
      onMessagesSaved(messages);
    }
    onClose();
  };

  const renderMessageField = (field, label, icon, color) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <View style={styles.messageLabel}>
          <Ionicons name={icon} size={20} color={color} />
          <Text style={styles.messageLabelText}>{label}</Text>
        </View>
        <Pressable
          style={[
            styles.copyButton,
            copiedField === field && styles.copyButtonSuccess
          ]}
          onPress={() => copyToClipboard(field)}
        >
          <Ionicons 
            name={copiedField === field ? "checkmark" : "copy-outline"} 
            size={16} 
            color={copiedField === field ? colors.success : colors.primary} 
          />
          <Text style={[
            styles.copyButtonText,
            copiedField === field && styles.copyButtonTextSuccess
          ]}>
            {copiedField === field ? 'Copied!' : 'Copy'}
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={[styles.messageInput, styles[`${field}Input`]]}
        value={messages[field]}
        onChangeText={(text) => setMessages({...messages, [field]: text})}
        multiline
        numberOfLines={field === 'email' ? 8 : 4}
        placeholder={`${label} message will appear here...`}
        placeholderTextColor={colors.textTertiary}
      />
      <Text style={styles.characterCount}>
        {messages[field].length} characters
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Messages</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Incident Summary */}
        <View style={styles.incidentSummary}>
          <Text style={styles.summaryTitle}>Incident Details</Text>
          <Text style={styles.summaryText}>Type: {incident?.type}</Text>
          <Text style={styles.summaryText}>Location: {incident?.location}</Text>
          <Text style={styles.summaryText}>
            Routes: {incident?.affectsRoutes?.join(', ') || 'None specified'}
          </Text>
        </View>

        {/* Message Fields */}
        {renderMessageField('ticketer', 'Ticketer (Driver Message)', 'bus', colors.primary)}
        {renderMessageField('passengerCloud', 'Passenger Cloud', 'people', colors.info)}
        {renderMessageField('email', 'Email', 'mail', colors.success)}

        {/* Quick Templates */}
        <View style={styles.templatesContainer}>
          <Text style={styles.templatesTitle}>Quick Actions</Text>
          <View style={styles.templateButtons}>
            <Pressable 
              style={styles.templateButton}
              onPress={() => generateMessages()}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.templateButtonText}>Regenerate</Text>
            </Pressable>
            <Pressable 
              style={styles.templateButton}
              onPress={() => setMessages({ ticketer: '', passengerCloud: '', email: '' })}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles.templateButtonText}>Clear All</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Messages</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  incidentSummary: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  messageContainer: {
    marginBottom: spacing.xl,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  messageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  copyButtonSuccess: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  copyButtonTextSuccess: {
    color: colors.success,
  },
  messageInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ticketerInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  characterCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  templatesContainer: {
    marginTop: spacing.lg,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  templateButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MessageGenerator;