/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Roadworks Manager Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { darkTheme, getStatusColor as getStatusColorHelper } from './styles/darkTheme';

const API_BASE = 'https://go-barry.onrender.com';

export default function RoadworksManager() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourcesStatus, setSourcesStatus] = useState({});
  const [stats, setStats] = useState({});
  
  // Modal states
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); // dismiss, acknowledge, save
  const [actionNote, setActionNote] = useState('');

  const sources = [
    { value: 'all', label: 'All Sources', icon: 'filter-variant' },
    { value: 'street_manager', label: 'Street Manager', icon: 'office-building' },
    { value: 'durham_council', label: 'Durham Council', icon: 'domain' },
    { value: 'manual', label: 'Manual Entry', icon: 'pencil' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'planned', label: 'Planned' },
    { value: 'completed', label: 'Completed' }
  ];

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      setTimeout(() => {
        router.replace('/');
      }, 0);
    }
  }, [supervisorSession, isAdmin, router]);

  useEffect(() => {
    if (supervisorSession && isAdmin) {
      loadRoadworks();
      loadSourcesStatus();
      loadStats();
    }
  }, [selectedSource, selectedStatus, supervisorSession, isAdmin]);

  const loadRoadworks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        source: selectedSource,
        status: selectedStatus,
        limit: '100'
      });

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`${API_BASE}/api/roadworks/unified?${params}`);
      const data = await response.json();

      if (data.success) {
        setRoadworks(data.roadworks || []);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const loadSourcesStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roadworks/sources`);
      const data = await response.json();

      if (data.success) {
        setSourcesStatus(data.sources || {});
      }
    } catch (error) {
      // Silently fail
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roadworks/stats?timeframe=7d`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh the backend data
      await fetch(`${API_BASE}/api/roadworks/refresh`, { method: 'POST' });
      await loadRoadworks();
      await loadSourcesStatus();
      await loadStats();
    } catch (error) {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoadworkAction = async (roadwork, action) => {
    setSelectedRoadwork(roadwork);
    setActionType(action);
    setActionNote('');
    setActionModalVisible(true);
  };

  const executeAction = async () => {
    if (!selectedRoadwork || !actionType) return;

    try {
      const endpoint = `${API_BASE}/api/roadworks/${selectedRoadwork.id}/${actionType}`;
      const body = {
        supervisorToken: supervisorSession?.token,
        [actionType === 'dismiss' ? 'reason' : actionType === 'acknowledge' ? 'note' : 'notes']: actionNote
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', `Roadwork ${actionType}ed successfully`);
        setActionModalVisible(false);
        await loadRoadworks();
        await loadStats();
      } else {
        Alert.alert('Error', data.error || `Failed to ${actionType} roadwork`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${actionType} roadwork`);
    }
  };

  const getSourceIcon = (source) => {
    const sourceMap = {
      street_manager: 'office-building',
      durham_council: 'domain',
      manual: 'pencil'
    };
    return sourceMap[source] || 'file-document';
  };

  const getSeverityColor = (severity) => {
    return getStatusColorHelper(severity);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fa709a" />
        <Text style={styles.loadingText}>Loading roadworks...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.container}>
        {/* Header with Stats */}
        <View style={styles.header}>
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="hammer-wrench" size={32} color="#fa709a" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Roadworks Manager</Text>
              <Text style={styles.pageSubtitle}>Unified roadworks management</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{roadworks.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.dismissals || 0}</Text>
              <Text style={styles.statLabel}>Dismissed (7d)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.acknowledgments || 0}</Text>
              <Text style={styles.statLabel}>Acknowledged (7d)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.saves || 0}</Text>
              <Text style={styles.statLabel}>Saved (7d)</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={darkTheme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search roadworks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={loadRoadworks}
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {sources.map(source => (
              <Pressable
                key={source.value}
                style={[styles.filterTab, selectedSource === source.value && styles.filterTabActive]}
                onPress={() => setSelectedSource(source.value)}
              >
                <MaterialCommunityIcons 
                  name={source.icon} 
                  size={16} 
                  color={selectedSource === source.value ? '#FFFFFF' : darkTheme.textSecondary} 
                />
                <Text style={[styles.filterTabText, selectedSource === source.value && styles.filterTabTextActive]}>
                  {source.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {statuses.map(status => (
              <Pressable
                key={status.value}
                style={[styles.statusTab, selectedStatus === status.value && styles.statusTabActive]}
                onPress={() => setSelectedStatus(status.value)}
              >
                <Text style={[styles.statusTabText, selectedStatus === status.value && styles.statusTabTextActive]}>
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Sources Status */}
        <View style={styles.sourcesStatus}>
          {Object.entries(sourcesStatus).map(([source, status]) => (
            <View key={source} style={styles.sourceStatus}>
              <MaterialCommunityIcons name={getSourceIcon(source)} size={16} color={darkTheme.text} />
              <Text style={styles.sourceName}>{source.replace('_', ' ')}</Text>
              <View style={[styles.sourceIndicator, { backgroundColor: status.success ? darkTheme.success : darkTheme.error }]} />
              <Text style={styles.sourceCount}>{status.count || 0}</Text>
            </View>
          ))}
        </View>

        {/* Roadworks List */}
        <ScrollView 
          style={styles.roadworksList} 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fa709a" />
          }
        >
          {roadworks.map((roadwork) => (
            <View key={roadwork.id} style={styles.roadworkItem}>
              <View style={styles.roadworkHeader}>
                <View style={styles.roadworkMeta}>
                  <MaterialCommunityIcons name={getSourceIcon(roadwork.source)} size={16} color={darkTheme.text} />
                  <Text style={styles.roadworkSource}>{roadwork.source.replace('_', ' ')}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(roadwork.severity) }]}>
                    <Text style={styles.severityText}>{roadwork.severity}</Text>
                  </View>
                </View>
                <Text style={styles.roadworkDate}>{formatDate(roadwork.startDate)}</Text>
              </View>

              <Text style={styles.roadworkTitle}>{roadwork.title}</Text>
              <Text style={styles.roadworkLocation}>📍 {roadwork.location}</Text>
              
              {roadwork.description && (
                <Text style={styles.roadworkDescription} numberOfLines={2}>
                  {roadwork.description}
                </Text>
              )}

              <View style={styles.roadworkFooter}>
                <View style={styles.roadworkInfo}>
                  <Text style={styles.promoter}>{roadwork.promoter}</Text>
                  <Text style={styles.authority}>{roadwork.authority}</Text>
                </View>

                <View style={styles.actionButtons}>
                  {roadwork.managementActions?.canDismiss && (
                    <Pressable
                      style={[styles.actionButton, styles.dismissButton]}
                      onPress={() => handleRoadworkAction(roadwork, 'dismiss')}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Dismiss</Text>
                    </Pressable>
                  )}

                  {roadwork.managementActions?.canAcknowledge && (
                    <Pressable
                      style={[styles.actionButton, styles.acknowledgeButton]}
                      onPress={() => handleRoadworkAction(roadwork, 'acknowledge')}
                    >
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>ACK</Text>
                    </Pressable>
                  )}

                  {roadwork.managementActions?.canSave && (
                    <Pressable
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={() => handleRoadworkAction(roadwork, 'save')}
                    >
                      <MaterialCommunityIcons name="bookmark" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Save</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}

          {roadworks.length === 0 && (
            <View style={styles.noRoadworks}>
              <MaterialCommunityIcons name="hammer-wrench" size={48} color={darkTheme.textMuted} />
              <Text style={styles.noRoadworksText}>No roadworks found</Text>
              <Text style={styles.noRoadworksSubtext}>Try adjusting your filters</Text>
            </View>
          )}
        </ScrollView>

        {/* Action Modal */}
        <Modal
          visible={actionModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Roadwork
              </Text>
              
              <Text style={styles.modalSubtitle}>
                {selectedRoadwork?.title}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder={
                  actionType === 'dismiss' ? 'Reason for dismissal...' :
                  actionType === 'acknowledge' ? 'Acknowledgment note...' :
                  'Save notes...'
                }
                value={actionNote}
                onChangeText={setActionNote}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={darkTheme.textMuted}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={executeAction}
                >
                  <Text style={styles.confirmButtonText}>
                    {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 112, 154, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.accents.roadworks,
  },
  statLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: darkTheme.surface,
    padding: 16,
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: darkTheme.text,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: darkTheme.background,
  },
  filterTabActive: {
    backgroundColor: darkTheme.accents.roadworks,
  },
  filterTabIcon: {
    marginRight: 6,
  },
  filterTabText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: darkTheme.background,
  },
  statusTabActive: {
    backgroundColor: darkTheme.success,
  },
  statusTabText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  sourcesStatus: {
    flexDirection: 'row',
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  sourceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    marginRight: 6,
  },
  sourceName: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
    marginRight: 6,
  },
  sourceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sourceCount: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  roadworksList: {
    flex: 1,
    padding: 16,
  },
  roadworkItem: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  roadworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roadworkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadworkSource: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
    marginLeft: 8,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  roadworkDate: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  roadworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 4,
  },
  roadworkLocation: {
    fontSize: 14,
    color: darkTheme.info,
    marginBottom: 8,
  },
  roadworkDescription: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  roadworkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  roadworkInfo: {
    flex: 1,
  },
  promoter: {
    fontSize: 12,
    color: darkTheme.text,
    fontWeight: '500',
  },
  authority: {
    fontSize: 11,
    color: darkTheme.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  dismissButton: {
    backgroundColor: darkTheme.error,
  },
  acknowledgeButton: {
    backgroundColor: darkTheme.success,
  },
  saveButton: {
    backgroundColor: darkTheme.info,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  noRoadworks: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noRoadworksText: {
    marginTop: 12,
    fontSize: 18,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  noRoadworksSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: darkTheme.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: darkTheme.text,
    marginBottom: 20,
    backgroundColor: darkTheme.background,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: darkTheme.background,
    marginRight: 6,
  },
  confirmButton: {
    backgroundColor: darkTheme.accents.roadworks,
    marginLeft: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.textSecondary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
