// Go_BARRY/components/operations/cards/OnTimeRequestParser.jsx
// Alternative approach: Parse SharePoint Excel data directly
// This would require the SharePoint API integration

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';

const OnTimeRequestParser = ({ onClose }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data structure for On Time Requests
  const generateMockData = () => {
    const mockRequests = [
      {
        id: 1,
        driverName: 'John Smith',
        badge: 'DR001',
        shift: 'Early Turn',
        requestedFinish: '14:30',
        scheduledFinish: '15:00',
        reason: 'Medical appointment',
        status: 'Pending',
        submittedAt: '2025-07-06T08:30:00Z',
        route: '21'
      },
      {
        id: 2,
        driverName: 'Sarah Johnson',
        badge: 'DR002',
        shift: 'Late Turn',
        requestedFinish: '22:15',
        scheduledFinish: '23:00',
        reason: 'Family commitment',
        status: 'Approved',
        submittedAt: '2025-07-06T09:15:00Z',
        route: 'Q3'
      },
      {
        id: 3,
        driverName: 'Mike Wilson',
        badge: 'DR003',
        shift: 'Early Turn',
        requestedFinish: '13:45',
        scheduledFinish: '14:30',
        reason: 'Personal emergency',
        status: 'Denied',
        submittedAt: '2025-07-06T10:00:00Z',
        route: '56'
      }
    ];
    return mockRequests;
  };

  useEffect(() => {
    fetchOnTimeRequests();
  }, []);

  const fetchOnTimeRequests = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual SharePoint API integration
      // For now, use mock data
      setTimeout(() => {
        setRequests(generateMockData());
        setIsLoading(false);
      }, 1000);
      
      // Future implementation would look like:
      // const response = await fetch('/api/sharepoint/on-time-requests');
      // const data = await response.json();
      // setRequests(data.requests);
    } catch (err) {
      setError('Failed to fetch on-time requests');
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOnTimeRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#10b981';
      case 'denied': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return '✅';
      case 'denied': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 On Time Request</Text>
          <Text style={styles.subtitle}>Loading requests...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching data from SharePoint...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 On Time Request</Text>
          <Text style={styles.subtitle}>Error loading data</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 On Time Request</Text>
        <Text style={styles.subtitle}>
          {requests.length} active requests • Last updated: {formatTime(new Date())}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{request.driverName}</Text>
                <Text style={styles.driverBadge}>Badge: {request.badge}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.statusText}>
                  {getStatusIcon(request.status)} {request.status}
                </Text>
              </View>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Route:</Text>
                <Text style={styles.detailValue}>{request.route}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shift:</Text>
                <Text style={styles.detailValue}>{request.shift}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scheduled Finish:</Text>
                <Text style={styles.detailValue}>{request.scheduledFinish}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested Finish:</Text>
                <Text style={[styles.detailValue, styles.requestedTime]}>
                  {request.requestedFinish}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reason:</Text>
                <Text style={styles.detailValue}>{request.reason}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted:</Text>
                <Text style={styles.detailValue}>{formatTime(request.submittedAt)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 This is a parsed view of the SharePoint data. 
          For full functionality, use the embedded SharePoint view.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
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
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  driverBadge: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetails: {
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
  },
  requestedTime: {
    color: '#dc2626',
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
  footerText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default OnTimeRequestParser;