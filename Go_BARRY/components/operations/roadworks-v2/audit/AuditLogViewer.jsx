/*
 * Go Barry - Audit Log Viewer
 * Interface for viewing and searching supervisor action audit logs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';
import AuditLogEntry from './AuditLogEntry';
import AuditLogFilters from './AuditLogFilters';
import AuditLogStats from './AuditLogStats';

const AuditLogViewer = ({ baseUrl, sessionId, supervisorName, isAdmin = false }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    actionType: 'all',
    severity: 'all',
    timeframe: '7d',
    supervisorBadge: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit log entries
  const fetchAuditLog = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
        search: searchQuery
      });

      const response = await fetch(`${baseUrl}/api/roadworks-v2/audit-log?${params}`, {
        headers: {
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditEntries(data.entries || []);
        setPagination(prev => ({
          ...prev,
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }));
      } else if (response.status === 403) {
        throw new Error('Access denied - Admin privileges required');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError) {
      console.error('Failed to fetch audit log:', fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/audit-log/statistics?timeframe=${filters.timeframe}`, {
        headers: {
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (statsError) {
      console.warn('Failed to fetch audit statistics:', statsError);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAuditLog(1);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAuditLog(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAuditLog(newPage);
    }
  };

  // Export audit log
  const handleExport = async () => {
    try {
      Alert.alert(
        'Export Audit Log',
        'This will generate a CSV file with the current audit log data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              const response = await fetch(`${baseUrl}/api/roadworks-v2/audit-log/export`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId,
                  'x-supervisor': supervisorName
                },
                body: JSON.stringify({ filters, searchQuery })
              });

              if (response.ok) {
                Alert.alert('Success', 'Audit log export has been generated and will be sent via email');
              } else {
                throw new Error('Export failed');
              }
            }
          }
        ]
      );
    } catch (exportError) {
      Alert.alert('Error', 'Failed to export audit log');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLog();
      fetchStatistics();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && filters.timeframe) {
      fetchStatistics();
    }
  }, [filters.timeframe, isAdmin]);

  // Access control
  if (!isAdmin) {
    return (
      <View style={roadworksStyles.accessDeniedContainer}>
        <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
        <Text style={roadworksStyles.accessDeniedTitle}>Admin Access Required</Text>
        <Text style={roadworksStyles.accessDeniedDescription}>
          The audit log is restricted to administrators only. Contact your system administrator for access.
        </Text>
      </View>
    );
  }

  if (loading && auditEntries.length === 0) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading audit log...</Text>
      </View>
    );
  }

  if (error && auditEntries.length === 0) {
    return (
      <View style={roadworksStyles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={roadworksStyles.errorTitle}>Error Loading Audit Log</Text>
        <Text style={roadworksStyles.errorDescription}>{error}</Text>
        <Pressable
          style={roadworksStyles.retryButton}
          onPress={() => fetchAuditLog()}
        >
          <Text style={roadworksStyles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={roadworksStyles.container}>
      {/* Header */}
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <View>
            <Text style={roadworksStyles.sectionTitle}>Audit Log</Text>
            <Text style={roadworksStyles.textMuted}>
              Supervisor actions and system events • {pagination.total} entries
            </Text>
          </View>
          
          <View style={roadworksStyles.auditActions}>
            <Pressable
              style={[roadworksStyles.actionButton, { backgroundColor: colors.info }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="funnel" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.actionButtonText}>Filters</Text>
            </Pressable>
            
            <Pressable
              style={[roadworksStyles.actionButton, { backgroundColor: colors.success, marginLeft: spacing.sm }]}
              onPress={handleExport}
            >
              <Ionicons name="download" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.actionButtonText}>Export</Text>
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={roadworksStyles.searchContainer}>
          <View style={[roadworksStyles.searchBox, { flex: 1 }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={roadworksStyles.searchInput}
              placeholder="Search audit log..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          
          <Pressable
            style={[roadworksStyles.searchButton, { marginLeft: spacing.sm }]}
            onPress={handleSearch}
          >
            <Ionicons name="search" size={16} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Statistics */}
        {statistics && (
          <AuditLogStats 
            statistics={statistics}
            timeframe={filters.timeframe}
          />
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Audit Entries */}
      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {auditEntries.length === 0 ? (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="document-text" size={48} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Audit Entries Found</Text>
            <Text style={roadworksStyles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms or filters' : 'No audit log entries match the current criteria'}
            </Text>
          </View>
        ) : (
          <View style={roadworksStyles.auditEntriesContainer}>
            {auditEntries.map((entry, index) => (
              <AuditLogEntry
                key={entry.id || index}
                entry={entry}
                index={index}
              />
            ))}
          </View>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <View style={roadworksStyles.paginationContainer}>
            <Pressable
              style={[
                roadworksStyles.paginationButton,
                pagination.page === 1 && roadworksStyles.paginationButtonDisabled
              ]}
              onPress={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={16} color={
                pagination.page === 1 ? colors.textMuted : colors.primary
              } />
              <Text style={[
                roadworksStyles.paginationButtonText,
                pagination.page === 1 && roadworksStyles.paginationButtonTextDisabled
              ]}>
                Previous
              </Text>
            </Pressable>

            <View style={roadworksStyles.paginationInfo}>
              <Text style={roadworksStyles.paginationText}>
                Page {pagination.page} of {pagination.totalPages}
              </Text>
              <Text style={roadworksStyles.paginationSubtext}>
                {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </Text>
            </View>

            <Pressable
              style={[
                roadworksStyles.paginationButton,
                pagination.page === pagination.totalPages && roadworksStyles.paginationButtonDisabled
              ]}
              onPress={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <Text style={[
                roadworksStyles.paginationButtonText,
                pagination.page === pagination.totalPages && roadworksStyles.paginationButtonTextDisabled
              ]}>
                Next
              </Text>
              <Ionicons name="chevron-forward" size={16} color={
                pagination.page === pagination.totalPages ? colors.textMuted : colors.primary
              } />
            </Pressable>
          </View>
        )}

        {/* Loading indicator for pagination */}
        {loading && auditEntries.length > 0 && (
          <View style={roadworksStyles.paginationLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={roadworksStyles.paginationLoadingText}>Loading...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AuditLogViewer;