/*
 * Go Barry - Start of Service Report Generator
 * Generates daily operational reports using disruption database data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const StartOfServiceReportGenerator = ({ onClose, baseUrl }) => {
  const { supervisorName, supervisorId } = useSupervisor();
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const API_BASE = baseUrl || (Platform.OS === 'web' 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  useEffect(() => {
    loadActiveDisruptions();
  }, []);

  const loadActiveDisruptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/disruptions/active`);
      if (response.ok) {
        const data = await response.json();
        setDisruptions(data.filter(d => d.type === 'roadwork' && d.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to load disruptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const reportDate = new Date();
      const formattedDate = reportDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const reportContent = generateReportContent(disruptions, formattedDate);
      
      setReportData({
        title: `Start Of Service Report | All Depots | ${formattedDate}`,
        content: reportContent,
        generatedAt: reportDate.toISOString(),
        generatedBy: supervisorName,
        disruptionCount: disruptions.length
      });

      // In a real implementation, this would send the report via email
      // For now, we'll just show it for review
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      Alert.alert('Error', 'Failed to generate Start of Service Report');
    } finally {
      setGenerating(false);
    }
  };

  const generateReportContent = (disruptions, formattedDate) => {
    const header = `Start Of Service Report | All Depots | ${formattedDate}`;
    const subtitle = "Note: Diversions are subject to change at short notice. Updates may appear in driver messaging.";
    
    let content = `${header}\n${subtitle}\n\n`;

    if (disruptions.length === 0) {
      content += "No active roadworks or diversions affecting services at this time.\n\n";
      content += "All routes operating normally.\n";
      return content;
    }

    disruptions.forEach((disruption, index) => {
      content += formatDisruptionForReport(disruption, index + 1);
      content += "\n\n\n";
    });

    return content.trim();
  };

  const formatDisruptionForReport = (disruption, refNumber) => {
    const ref = disruption.sourceId || `1${refNumber.toString().padStart(3, '0')}`;
    const title = disruption.title || 'Roadworks';
    const location = disruption.location?.description || disruption.location || 'Location TBC';
    const routes = disruption.affectedRoutes?.join(', ') || 'Routes TBC';
    const timing = getDiversionTiming(disruption);
    
    let report = `Ref: ${ref} | ${title} | ${timing} | ${routes}`;
    
    if (disruption.description) {
      report += `\n${disruption.description}`;
    }
    
    // Add diversion instructions if available
    if (disruption.diversionInstructions) {
      report += `\n\n${disruption.diversionInstructions}`;
    } else {
      // Default template for missing diversion instructions
      report += `\n\nDIVERT - Follow signed diversions and local traffic management.`;
      report += `\nMonitor radio for updates.`;
    }

    return report;
  };

  const getDiversionTiming = (disruption) => {
    if (disruption.timing) {
      return disruption.timing;
    }
    
    const startTime = disruption.startTime ? new Date(disruption.startTime) : null;
    const endTime = disruption.endTime ? new Date(disruption.endTime) : null;
    
    if (startTime && endTime) {
      const today = new Date();
      if (startTime.toDateString() === today.toDateString()) {
        return `${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} until ${endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    
    return 'All Day';
  };

  const copyReportToClipboard = () => {
    if (Platform.OS === 'web' && reportData) {
      navigator.clipboard.writeText(reportData.content).then(() => {
        Alert.alert('Copied', 'Report copied to clipboard');
      }).catch(() => {
        Alert.alert('Error', 'Failed to copy to clipboard');
      });
    }
  };

  const sendReport = async () => {
    if (!reportData) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/reports/start-of-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportData.title,
          content: reportData.content,
          generatedBy: supervisorName,
          supervisorId: supervisorId,
          disruptionCount: reportData.disruptionCount
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Start of Service Report sent successfully');
        onClose();
      } else {
        throw new Error('Failed to send report');
      }
    } catch (error) {
      console.error('Failed to send report:', error);
      Alert.alert('Error', 'Failed to send Start of Service Report');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Ionicons name="sunrise" size={24} color="#F59E0B" />
          <Text style={styles.headerTitle}>Start of Service Report</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Report Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.statusLabel}>Active Disruptions</Text>
              <Text style={styles.statusValue}>{disruptions.length}</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="time" size={20} color="#3B82F6" />
              <Text style={styles.statusLabel}>Report Date</Text>
              <Text style={styles.statusValue}>
                {new Date().toLocaleDateString('en-GB')}
              </Text>
            </View>
          </View>
        </View>

        {/* Disruptions List */}
        <View style={styles.disruptionsSection}>
          <Text style={styles.sectionTitle}>Active Roadworks & Diversions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading disruptions...</Text>
            </View>
          ) : disruptions.length === 0 ? (
            <View style={styles.noDisruptions}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.noDisruptionsText}>No active disruptions</Text>
              <Text style={styles.noDisruptionsSubtext}>All routes operating normally</Text>
            </View>
          ) : (
            <View style={styles.disruptionsList}>
              {disruptions.map((disruption, index) => (
                <View key={disruption.id} style={styles.disruptionCard}>
                  <View style={styles.disruptionHeader}>
                    <Text style={styles.disruptionRef}>
                      Ref: {disruption.sourceId || `1${(index + 1).toString().padStart(3, '0')}`}
                    </Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(disruption.severity) }]}>
                      <Text style={styles.severityText}>{disruption.severity}</Text>
                    </View>
                  </View>
                  <Text style={styles.disruptionTitle}>{disruption.title}</Text>
                  <Text style={styles.disruptionLocation}>{disruption.location?.description || disruption.location}</Text>
                  <Text style={styles.disruptionRoutes}>
                    Routes: {disruption.affectedRoutes?.join(', ') || 'TBC'}
                  </Text>
                  {!disruption.diversionInstructions && (
                    <View style={styles.warningBanner}>
                      <Ionicons name="warning" size={16} color="#F59E0B" />
                      <Text style={styles.warningText}>Diversion instructions needed</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Generated Report Preview */}
        {reportData && (
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Generated Report</Text>
            <View style={styles.reportPreview}>
              <Text style={styles.reportTitle}>{reportData.title}</Text>
              <ScrollView style={styles.reportContent} nestedScrollEnabled>
                <Text style={styles.reportText}>{reportData.content}</Text>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.generateButton]}
            onPress={generateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="document-text" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Text>
          </TouchableOpacity>

          {reportData && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.copyButton]}
                onPress={copyReportToClipboard}
              >
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Copy to Clipboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.sendButton]}
                onPress={sendReport}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Send Report</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'medium': return '#3B82F6';
    case 'low': return '#10B981';
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusItem: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  disruptionsSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  noDisruptions: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noDisruptionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  noDisruptionsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  disruptionsList: {
    gap: 12,
  },
  disruptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disruptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disruptionRef: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  disruptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  disruptionLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  disruptionRoutes: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
  },
  reportSection: {
    marginBottom: 24,
  },
  reportPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  reportContent: {
    maxHeight: 300,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  reportText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    lineHeight: 18,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  generateButton: {
    backgroundColor: '#F59E0B',
  },
  copyButton: {
    backgroundColor: '#6B7280',
  },
  sendButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StartOfServiceReportGenerator;