// Go_BARRY/components/operations/cards/DailyLostMileageNative.jsx
// Native React component for Daily Lost Mileage management via SharePoint Graph API

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSupervisor } from '../../hooks/useSupervisorSession';

const DailyLostMileageNative = ({ onClose }) => {
  const { supervisor } = useSupervisor();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalLostMiles, setTotalLostMiles] = useState(0);

  // Form state for new reports
  const [newReport, setNewReport] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    route: '',
    lostMiles: '',
    reason: '',
    impact: '',
    reportedBy: supervisor?.badge || ''
  });

  const API_BASE = Platform.OS === 'web' 
    ? (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com';

  useEffect(() => {
    checkAuthenticationAndLoad();
  }, [supervisor]);

  const checkAuthenticationAndLoad = async () => {
    if (!supervisor?.badge) {
      setError('Supervisor not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Checking SharePoint authentication for:', supervisor.badge);
      
      // Check authentication status
      const authResponse = await fetch(`${API_BASE}/api/sharepoint/auth-status/${supervisor.badge}`);
      const authData = await authResponse.json();

      console.log('🔐 Auth response:', authData);

      if (authData.success && authData.isAuthenticated) {
        setIsAuthenticated(true);
        await loadLostMileageReports();
      } else {
        setIsAuthenticated(false);
        setAuthUrl(authData.loginUrl);
        setError('SharePoint authentication required');
      }
    } catch (error) {
      console.error('🔐 Authentication check failed:', error);
      setError('Failed to check authentication: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLostMileageReports = async () => {
    try {
      console.log('📊 Loading Daily Lost Mileage data...');
      setIsLoading(true);

      const response = await fetch(`${API_BASE}/api/sharepoint/documents/dailyLostMileage/data/${supervisor.badge}`);
      const data = await response.json();

      console.log('📊 Data response:', data);

      if (data.success) {
        setReports(data.reports || []);
        setTotalLostMiles(data.totalLostMiles || 0);
        setLastUpdated(data.lastModified);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('📊 Load data failed:', error);
      setError('Failed to load Lost Mileage Reports: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = () => {
    if (authUrl) {
      if (Platform.OS === 'web') {
        window.open(authUrl, '_blank');
      } else {
        console.log('Open auth URL:', authUrl);
      }
    }
  };

  const handleAddReport = async () => {
    try {
      // Validation
      if (!newReport.route || !newReport.lostMiles || !newReport.reason) {
        Alert.alert('Error', 'Please fill in route, lost miles, and reason fields');
        return;
      }

      const lostMilesNum = parseFloat(newReport.lostMiles);
      if (isNaN(lostMilesNum) || lostMilesNum < 0) {
        Alert.alert('Error', 'Lost miles must be a valid positive number');
        return;
      }

      console.log('📝 Submitting new Lost Mileage Report:', newReport);
      
      const response = await fetch(`${API_BASE}/api/sharepoint/documents/dailyLostMileage/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supervisorId: supervisor.badge,
          ...newReport,
          lostMiles: lostMilesNum
        })
      });

      const result = await response.json();
      console.log('📝 Submit response:', result);

      if (result.success) {
        // Clear form
        setNewReport({
          date: new Date().toISOString().split('T')[0],
          route: '',
          lostMiles: '',
          reason: '',
          impact: '',
          reportedBy: supervisor?.badge || ''
        });
        setShowAddForm(false);
        
        // Reload data
        await loadLostMileageReports();
        
        // Show success message
        if (Platform.OS === 'web') {
          Alert.alert('Success', 'Lost Mileage Report submitted successfully');
        }
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('📝 Submit failed:', error);
      Alert.alert('Error', 'Failed to submit report: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#10b981';
      case 'investigating': return '#f59e0b';
      case 'open': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'check-circle';
      case 'investigating': return 'magnify';
      case 'open': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Daily Lost Mileage</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>Connecting to SharePoint...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Daily Lost Mileage</Text>
          <Text style={styles.subtitle}>Authentication Required</Text>
        </View>
        <View style={styles.authContainer}>
          <MaterialCommunityIcons name="shield-lock" size={64} color="#dc2626" />
          <Text style={styles.authTitle}>SharePoint Access Required</Text>
          <Text style={styles.authText}>
            You need to authenticate with Microsoft 365 to access and edit Daily Lost Mileage reports.
          </Text>
          <Pressable style={styles.authButton} onPress={handleAuthenticate}>
            <MaterialCommunityIcons name="microsoft" size={20} color="#ffffff" />
            <Text style={styles.authButtonText}>Authenticate with Microsoft</Text>
          </Pressable>
          <Text style={styles.authNote}>
            This will open a new window for secure Microsoft authentication.
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Daily Lost Mileage</Text>
          <Text style={styles.subtitle}>Error Loading Data</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={checkAuthenticationAndLoad}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="chart-line-variant" size={32} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.title}>📊 Daily Lost Mileage</Text>
            <Text style={styles.subtitle}>
              {reports.length} reports • Total: {totalLostMiles.toFixed(1)} miles • Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <MaterialCommunityIcons name={showAddForm ? "close" : "plus"} size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.refreshButton}
            onPress={loadLostMileageReports}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Add Report Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Add New Lost Mileage Report</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.fieldInput}
                value={newReport.date}
                onChangeText={(text) => setNewReport({...newReport, date: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Route</Text>
              <TextInput
                style={styles.fieldInput}
                value={newReport.route}
                onChangeText={(text) => setNewReport({...newReport, route: text})}
                placeholder="e.g. 21, Q3, X1"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Lost Miles</Text>
              <TextInput
                style={styles.fieldInput}
                value={newReport.lostMiles}
                onChangeText={(text) => setNewReport({...newReport, lostMiles: text})}
                placeholder="e.g. 15.5"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Impact Level</Text>
              <View style={styles.impactButtons}>
                {['Low', 'Medium', 'High'].map((impact) => (
                  <Pressable
                    key={impact}
                    style={[
                      styles.impactButton,
                      { backgroundColor: getImpactColor(impact) },
                      newReport.impact === impact && styles.impactButtonActive
                    ]}
                    onPress={() => setNewReport({...newReport, impact})}
                  >
                    <Text style={styles.impactButtonText}>
                      {impact}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={[styles.fieldInput, styles.reasonInput]}
              value={newReport.reason}
              onChangeText={(text) => setNewReport({...newReport, reason: text})}
              placeholder="Describe the cause of lost mileage (e.g. roadworks, breakdown, traffic)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.submitButton}
              onPress={handleAddReport}
            >
              <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Lost Miles</Text>
          <Text style={styles.summaryValue}>{totalLostMiles.toFixed(1)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Reports</Text>
          <Text style={styles.summaryValue}>{reports.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today's Reports</Text>
          <Text style={styles.summaryValue}>
            {reports.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-line" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Lost Mileage Reports</Text>
            <Text style={styles.emptyText}>
              No reports found. Add a new report using the + button above.
            </Text>
          </View>
        ) : (
          reports.map((report, index) => (
            <View key={report.id || index} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportDate}>{report.date || 'Unknown Date'}</Text>
                  <Text style={styles.reportRoute}>Route: {report.route || 'N/A'}</Text>
                </View>
                <View style={styles.reportMetrics}>
                  <View style={styles.lostMilesBadge}>
                    <Text style={styles.lostMilesText}>{(report.lostMiles || 0).toFixed(1)} miles</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                    <MaterialCommunityIcons 
                      name={getStatusIcon(report.status)} 
                      size={16} 
                      color="#ffffff" 
                    />
                    <Text style={styles.statusText}>{report.status || 'Open'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reportDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{report.reason || 'No reason provided'}</Text>
                </View>
                {report.impact && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Impact:</Text>
                    <View style={[styles.impactBadge, { backgroundColor: getImpactColor(report.impact) }]}>
                      <Text style={styles.impactBadgeText}>{report.impact}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reported By:</Text>
                  <Text style={styles.detailValue}>{report.reportedBy || 'Unknown'}</Text>
                </View>
                {report.lastModified && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(report.lastModified).toLocaleString('en-GB')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <MaterialCommunityIcons name="microsoft-sharepoint" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Live data from SharePoint • Real-time sync enabled
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#dc2626',
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fecaca',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    backgroundColor: '#f8fafc',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  impactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  impactButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  impactButtonActive: {
    opacity: 1,
  },
  impactButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  authText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  authButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  authNote: {
    marginTop: 16,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  reportRoute: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportMetrics: {
    alignItems: 'flex-end',
    gap: 8,
  },
  lostMilesBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lostMilesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default DailyLostMileageNative;