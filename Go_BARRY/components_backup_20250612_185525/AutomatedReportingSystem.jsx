// Go_BARRY/components/AutomatedReportingSystem.jsx
// Phase 4: Automated Reporting & Daily Reports

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const isWeb = Platform.OS === 'web';

// Report types configuration
const REPORT_TYPES = {
  startOfService: {
    name: 'Start of Service Report',
    description: 'Daily operational summary sent at 00:15am',
    schedule: '00:15',
    frequency: 'daily',
    automated: true,
    recipients: ['smt@gonortheast.co.uk', 'operations@gonortheast.co.uk'],
    icon: 'sunrise',
    color: '#F59E0B'
  },
  disruption: {
    name: 'Disruption Summary',
    description: 'Summary of all disruptions and incidents',
    schedule: 'on-demand',
    frequency: 'manual',
    automated: false,
    recipients: ['comms@gonortheast.co.uk', 'supervisors@gonortheast.co.uk'],
    icon: 'warning',
    color: '#EF4444'
  },
  performance: {
    name: 'Performance Report',
    description: 'Weekly service performance metrics',
    schedule: 'Monday 08:00',
    frequency: 'weekly',
    automated: true,
    recipients: ['barry.perryman@gonortheast.co.uk', 'smt@gonortheast.co.uk'],
    icon: 'analytics',
    color: '#3B82F6'
  },
  alerts: {
    name: 'Alert Activity Report',
    description: 'Daily summary of alert processing and responses',
    schedule: '23:30',
    frequency: 'daily',
    automated: true,
    recipients: ['supervisors@gonortheast.co.uk'],
    icon: 'notifications',
    color: '#10B981'
  }
};

const AutomatedReportingSystem = ({ baseUrl }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    isAdmin,
    logActivity 
  } = useSupervisorSession();

  // State management
  const [reportHistory, setReportHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(null);
  const [reportSchedule, setReportSchedule] = useState([]);
  const [systemStats, setSystemStats] = useState({});

  // API base URL
  const API_BASE = baseUrl || (isWeb 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  // Load data on mount
  useEffect(() => {
    loadReportHistory();
    loadReportSchedule();
    loadSystemStats();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSystemStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadReportHistory = async () => {
    setLoading(true);
    try {
      // Mock report history - in production this would come from backend
      const now = new Date();
      const mockHistory = [
        {
          id: 'report_001',
          type: 'startOfService',
          title: 'Start of Service Report - ' + now.toDateString(),
          generatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          generatedBy: 'System (Automated)',
          status: 'sent',
          recipients: 8,
          size: '245KB',
          summary: {
            totalAlerts: 12,
            activeIncidents: 3,
            affectedRoutes: 7,
            resolvedIssues: 9
          }
        },
        {
          id: 'report_002',
          type: 'disruption',
          title: 'Disruption Summary - Newcastle City Centre',
          generatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          generatedBy: 'Alex Woodcock',
          status: 'sent',
          recipients: 5,
          size: '156KB',
          summary: {
            totalDisruptions: 2,
            affectedRoutes: 4,
            estimatedDelay: '15-20 minutes',
            diversionsActive: 1
          }
        },
        {
          id: 'report_003',
          type: 'alerts',
          title: 'Alert Activity Report - Yesterday',
          generatedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
          generatedBy: 'System (Automated)',
          status: 'sent',
          recipients: 12,
          size: '89KB',
          summary: {
            totalAlerts: 45,
            dismissed: 38,
            acknowledged: 7,
            responseTime: '3.2 minutes'
          }
        }
      ];
      setReportHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load report history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportSchedule = async () => {
    try {
      // Mock upcoming schedule
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const schedule = [
        {
          id: 'schedule_001',
          type: 'startOfService',
          title: 'Start of Service Report',
          scheduledFor: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 15).toISOString(),
          status: 'scheduled',
          automated: true
        },
        {
          id: 'schedule_002',
          type: 'alerts',
          title: 'Alert Activity Report',
          scheduledFor: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30).toISOString(),
          status: 'scheduled',
          automated: true
        }
      ];
      setReportSchedule(schedule);
    } catch (error) {
      console.error('Failed to load report schedule:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Mock system statistics
      setSystemStats({
        reportsGenerated: 156,
        automatedReports: 134,
        manualReports: 22,
        totalRecipients: 45,
        averageGenerationTime: '2.3 seconds',
        successRate: 99.2,
        lastAutomatedReport: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        nextScheduledReport: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  // Generate report manually
  const generateReport = async (reportType) => {
    if (!isLoggedIn) {
      alert('Please log in as a supervisor to generate reports');
      return;
    }

    setGeneratingReport(reportType);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportConfig = REPORT_TYPES[reportType];
      const reportData = {
        id: 'report_' + Date.now(),
        type: reportType,
        title: `${reportConfig.name} - ${new Date().toLocaleString()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: supervisorName,
        status: 'generating',
        recipients: reportConfig.recipients.length,
        size: '0KB'
      };

      // Add to history
      setReportHistory(prev => [reportData, ...prev]);

      // Log activity
      logActivity(
        'GENERATE_REPORT',
        `Generated ${reportConfig.name}`,
        reportData.id
      );

      // Simulate sending
      setTimeout(() => {
        setReportHistory(prev => 
          prev.map(report => 
            report.id === reportData.id 
              ? { ...report, status: 'sent', size: Math.floor(Math.random() * 300) + 50 + 'KB' }
              : report
          )
        );
      }, 1000);

      alert(`${reportConfig.name} generated and sent successfully`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  // Download report (simulation)
  const downloadReport = (report) => {
    if (isWeb) {
      // In a real implementation, this would download the actual report file
      alert(`Downloading ${report.title} (${report.size})`);
    } else {
      Alert.alert('Download', `Would download ${report.title} (${report.size})`);
    }
    
    logActivity('DOWNLOAD_REPORT', `Downloaded ${report.title}`, report.id);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#10B981';
      case 'generating': return '#F59E0B';
      case 'scheduled': return '#3B82F6';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text style={styles.unauthorizedTitle}>Supervisor Access Required</Text>
        <Text style={styles.unauthorizedText}>
          Please log in as a supervisor to access reporting system
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📊 Automated Reporting</Text>
          <Text style={styles.subtitle}>Daily reports & operational summaries</Text>
        </View>
      </View>

      {/* System Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{systemStats.reportsGenerated}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{systemStats.automatedReports}</Text>
          <Text style={styles.statLabel}>Automated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{systemStats.successRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Report Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          <View style={styles.reportTypesGrid}>
            {Object.entries(REPORT_TYPES).map(([typeId, reportType]) => (
              <View key={typeId} style={styles.reportTypeCard}>
                <View style={styles.reportTypeHeader}>
                  <Ionicons 
                    name={reportType.icon} 
                    size={24} 
                    color={reportType.color} 
                  />
                  <View style={styles.reportTypeInfo}>
                    <Text style={styles.reportTypeName}>{reportType.name}</Text>
                    <Text style={styles.reportTypeDesc}>{reportType.description}</Text>
                  </View>
                </View>
                
                <View style={styles.reportTypeDetails}>
                  <Text style={styles.reportTypeSchedule}>
                    {reportType.automated ? `Auto: ${reportType.schedule}` : 'Manual'}
                  </Text>
                  <Text style={styles.reportTypeFrequency}>{reportType.frequency}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    { backgroundColor: reportType.color },
                    generatingReport === typeId && styles.generateButtonDisabled
                  ]}
                  onPress={() => generateReport(typeId)}
                  disabled={generatingReport === typeId}
                >
                  {generatingReport === typeId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="document-text" size={16} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Automated Reports</Text>
          {reportSchedule.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No scheduled reports</Text>
            </View>
          ) : (
            reportSchedule.map((scheduled) => (
              <View key={scheduled.id} style={styles.scheduledItem}>
                <View style={styles.scheduledInfo}>
                  <Text style={styles.scheduledTitle}>{scheduled.title}</Text>
                  <Text style={styles.scheduledTime}>
                    {new Date(scheduled.scheduledFor).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.scheduledStatus}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(scheduled.status) }
                  ]}>
                    {scheduled.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Report History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report History</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : reportHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No reports generated yet</Text>
            </View>
          ) : (
            reportHistory.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportMeta}>
                      Generated by {report.generatedBy} • {report.size}
                    </Text>
                    <Text style={styles.reportTime}>
                      {new Date(report.generatedAt).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.reportActions}>
                    <View style={[
                      styles.reportStatus,
                      { backgroundColor: getStatusColor(report.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.reportStatusText,
                        { color: getStatusColor(report.status) }
                      ]}>
                        {report.status.toUpperCase()}
                      </Text>
                    </View>
                    
                    {report.status === 'sent' && (
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadReport(report)}
                      >
                        <Ionicons name="download" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {report.summary && (
                  <View style={styles.reportSummary}>
                    <Text style={styles.summaryTitle}>Summary:</Text>
                    <View style={styles.summaryGrid}>
                      {Object.entries(report.summary).map(([key, value]) => (
                        <View key={key} style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Text>
                          <Text style={styles.summaryValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.reportFooter}>
                  <Text style={styles.reportRecipients}>
                    📧 {report.recipients} recipients
                  </Text>
                  <Text style={styles.reportType}>
                    {REPORT_TYPES[report.type]?.name || report.type}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.systemInfo}>
            <View style={styles.systemInfoItem}>
              <Text style={styles.systemInfoLabel}>Last Automated Report:</Text>
              <Text style={styles.systemInfoValue}>
                {systemStats.lastAutomatedReport 
                  ? new Date(systemStats.lastAutomatedReport).toLocaleString()
                  : 'N/A'
                }
              </Text>
            </View>
            <View style={styles.systemInfoItem}>
              <Text style={styles.systemInfoLabel}>Next Scheduled Report:</Text>
              <Text style={styles.systemInfoValue}>
                {systemStats.nextScheduledReport 
                  ? new Date(systemStats.nextScheduledReport).toLocaleString()
                  : 'N/A'
                }
              </Text>
            </View>
            <View style={styles.systemInfoItem}>
              <Text style={styles.systemInfoLabel}>Average Generation Time:</Text>
              <Text style={styles.systemInfoValue}>{systemStats.averageGenerationTime}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  reportTypesGrid: {
    gap: 12,
  },
  reportTypeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  reportTypeInfo: {
    flex: 1,
  },
  reportTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  reportTypeDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  reportTypeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeSchedule: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  reportTypeFrequency: {
    fontSize: 12,
    color: '#6B7280',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  scheduledItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  scheduledStatus: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  reportTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reportStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    padding: 4,
  },
  reportSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    minWidth: 100,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reportRecipients: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  systemInfo: {
    gap: 12,
  },
  systemInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  systemInfoLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  systemInfoValue: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AutomatedReportingSystem;
