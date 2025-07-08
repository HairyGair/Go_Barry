/*
 * Go Barry - Roadwork Detail Modal
 * Comprehensive view of roadwork information with communication history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing, borderRadius } from '../styles/roadworks.styles';

const RoadworkDetailModal = ({
  roadwork,
  visible,
  onClose,
  onCreateDiversion,
  baseUrl
}) => {
  const [loading, setLoading] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (visible && roadwork) {
      fetchCommunications();
      fetchDisruptions();
    }
  }, [visible, roadwork]);

  const fetchCommunications = async () => {
    if (!baseUrl || !roadwork?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/disruptions/communications/${roadwork.id}`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisruptions = async () => {
    if (!baseUrl || !roadwork?.id) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/disruptions/by-source/${roadwork.id}`);
      if (response.ok) {
        const data = await response.json();
        setDisruptions(data.disruptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch disruptions:', error);
      setDisruptions([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: colors.success,
      planned: colors.info,
      completed: colors.textMuted,
      cancelled: colors.textMuted,
      monitoring: colors.warning
    };
    return statusColors[status] || colors.textMuted;
  };

  const getSeverityColor = (severity) => {
    const severityColors = {
      critical: colors.critical,
      high: colors.error,
      medium: colors.warning,
      low: colors.success
    };
    return severityColors[severity] || colors.textMuted;
  };

  const handleCreateDiversion = () => {
    onClose();
    setTimeout(() => {
      onCreateDiversion && onCreateDiversion(roadwork);
    }, 100);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'information-circle' },
    { id: 'communications', label: 'Messages', icon: 'chatbubbles', badge: communications.length },
    { id: 'disruptions', label: 'Database', icon: 'folder', badge: disruptions.length }
  ];

  if (!roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={roadworksStyles.container}>
        {/* Header */}
        <View style={[roadworksStyles.header, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={roadworksStyles.row}>
            <Pressable
              style={roadworksStyles.actionButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
            
            <View style={roadworksStyles.flex1}>
              <Text style={roadworksStyles.headerTitle} numberOfLines={2}>
                {roadwork.title || roadwork.location}
              </Text>
              <Text style={roadworksStyles.headerSubtitle}>
                {roadwork.location} • {roadwork.source || 'Manual'}
              </Text>
            </View>

            <Pressable
              style={[roadworksStyles.actionButton, roadworksStyles.actionButtonPrimary]}
              onPress={handleCreateDiversion}
            >
              <Ionicons name="megaphone" size={16} color={colors.textInverse} />
              <Text style={[roadworksStyles.actionButtonText, { color: colors.textInverse }]}>
                Create Message
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={roadworksStyles.tabContainer}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                roadworksStyles.tab,
                activeTab === tab.id && roadworksStyles.tabActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? colors.textOnDark : colors.textMuted}
              />
              <Text style={[
                roadworksStyles.tabText,
                activeTab === tab.id && roadworksStyles.tabTextActive
              ]}>
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View style={[
                  roadworksStyles.tabBadge,
                  activeTab === tab.id && roadworksStyles.tabBadgeActive
                ]}>
                  <Text style={[
                    roadworksStyles.tabBadgeText,
                    activeTab === tab.id && roadworksStyles.tabBadgeTextActive
                  ]}>
                    {tab.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={roadworksStyles.scrollContainer}>
          <View style={roadworksStyles.contentContainer}>
            {activeTab === 'overview' && (
              <OverviewTab roadwork={roadwork} />
            )}
            
            {activeTab === 'communications' && (
              <CommunicationsTab 
                communications={communications} 
                loading={loading}
                onRefresh={fetchCommunications}
              />
            )}
            
            {activeTab === 'disruptions' && (
              <DisruptionsTab 
                disruptions={disruptions} 
                loading={loading}
                onRefresh={fetchDisruptions}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Overview Tab Component
const OverviewTab = ({ roadwork }) => {
  const getTimeRemaining = () => {
    if (!roadwork.endDate) return null;
    const now = new Date();
    const end = new Date(roadwork.endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} remaining`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View>
      {/* Status & Priority */}
      <View style={roadworksStyles.section}>
        <Text style={roadworksStyles.filterTitle}>Status & Priority</Text>
        <View style={roadworksStyles.roadworkMeta}>
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: getStatusColor(roadwork.status) + '20',
              borderColor: getStatusColor(roadwork.status)
            }
          ]}>
            <Ionicons 
              name="flag" 
              size={14} 
              color={getStatusColor(roadwork.status)} 
            />
            <Text style={[
              roadworksStyles.statusBadgeText, 
              { color: getStatusColor(roadwork.status) }
            ]}>
              {roadwork.status?.charAt(0).toUpperCase() + roadwork.status?.slice(1)}
            </Text>
          </View>

          {roadwork.severity && (
            <View style={[
              roadworksStyles.statusBadge,
              { 
                backgroundColor: getSeverityColor(roadwork.severity) + '20',
                borderColor: getSeverityColor(roadwork.severity)
              }
            ]}>
              <Ionicons 
                name="warning" 
                size={14} 
                color={getSeverityColor(roadwork.severity)} 
              />
              <Text style={[
                roadworksStyles.statusBadgeText, 
                { color: getSeverityColor(roadwork.severity) }
              ]}>
                {roadwork.severity.charAt(0).toUpperCase() + roadwork.severity.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {roadwork.description && (
        <View style={roadworksStyles.section}>
          <Text style={roadworksStyles.filterTitle}>Description</Text>
          <Text style={roadworksStyles.roadworkDescription}>
            {roadwork.description}
          </Text>
        </View>
      )}

      {/* Timing */}
      <View style={roadworksStyles.section}>
        <Text style={roadworksStyles.filterTitle}>Timing</Text>
        <View style={roadworksStyles.section}>
          {roadwork.startDate && (
            <View style={roadworksStyles.row}>
              <Ionicons name="play" size={16} color={colors.success} />
              <Text style={roadworksStyles.roadworkDescription}>
                Start: {formatDate(roadwork.startDate)}
              </Text>
            </View>
          )}
          {roadwork.endDate && (
            <View style={roadworksStyles.row}>
              <Ionicons name="stop" size={16} color={colors.error} />
              <Text style={roadworksStyles.roadworkDescription}>
                End: {formatDate(roadwork.endDate)}
              </Text>
            </View>
          )}
          {getTimeRemaining() && (
            <View style={roadworksStyles.row}>
              <Ionicons name="time" size={16} color={colors.warning} />
              <Text style={roadworksStyles.roadworkDescription}>
                {getTimeRemaining()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Affected Routes */}
      {roadwork.affectsRoutes && roadwork.affectsRoutes.length > 0 && (
        <View style={roadworksStyles.section}>
          <Text style={roadworksStyles.filterTitle}>
            Affected Routes ({roadwork.affectsRoutes.length})
          </Text>
          <View style={roadworksStyles.roadworkMeta}>
            {roadwork.affectsRoutes.map((route, index) => (
              <View key={index} style={roadworksStyles.routeChip}>
                <Text style={roadworksStyles.routeChipText}>{route}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Authority Information */}
      {roadwork.authority && (
        <View style={roadworksStyles.section}>
          <Text style={roadworksStyles.filterTitle}>Authority</Text>
          <Text style={roadworksStyles.roadworkDescription}>
            {roadwork.authority}
          </Text>
        </View>
      )}
    </View>
  );
};

// Communications Tab Component
const CommunicationsTab = ({ communications, loading, onRefresh }) => {
  if (loading) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading communications...</Text>
      </View>
    );
  }

  if (communications.length === 0) {
    return (
      <View style={roadworksStyles.emptyContainer}>
        <Ionicons name="chatbubbles" size={48} color={colors.textMuted} style={roadworksStyles.emptyIcon} />
        <Text style={roadworksStyles.emptyTitle}>No Messages Yet</Text>
        <Text style={roadworksStyles.emptyDescription}>
          Messages sent via the Message Distribution Centre will appear here
        </Text>
        <Pressable
          style={roadworksStyles.actionButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.textPrimary} />
          <Text style={roadworksStyles.actionButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={roadworksStyles.section}>
      <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
        <Text style={roadworksStyles.filterTitle}>Message History</Text>
        <Pressable
          style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {communications.map((comm, index) => (
        <View key={index} style={roadworksStyles.templateCard}>
          <View style={roadworksStyles.templateHeader}>
            <View style={roadworksStyles.flex1}>
              <Text style={roadworksStyles.templateTitle}>
                {comm.type === 'driver' ? 'Driver Message' : 'Customer Message'}
              </Text>
              <Text style={roadworksStyles.templateScenario}>
                {comm.platform} • {comm.sentBy}
              </Text>
            </View>
            <View style={[
              roadworksStyles.statusBadge,
              { backgroundColor: colors.successBg, borderColor: colors.success }
            ]}>
              <Text style={[roadworksStyles.statusBadgeText, { color: colors.success }]}>
                Sent
              </Text>
            </View>
          </View>

          <Text style={roadworksStyles.roadworkDescription}>
            {comm.content}
          </Text>

          <View style={roadworksStyles.templateFooter}>
            <Text style={roadworksStyles.templateUseCount}>
              {new Date(comm.sentAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {comm.recipientCount > 0 && (
              <Text style={roadworksStyles.templateUseCount}>
                {comm.recipientCount} recipients
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// Disruptions Tab Component
const DisruptionsTab = ({ disruptions, loading, onRefresh }) => {
  if (loading) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading disruption records...</Text>
      </View>
    );
  }

  if (disruptions.length === 0) {
    return (
      <View style={roadworksStyles.emptyContainer}>
        <Ionicons name="folder" size={48} color={colors.textMuted} style={roadworksStyles.emptyIcon} />
        <Text style={roadworksStyles.emptyTitle}>No Database Records</Text>
        <Text style={roadworksStyles.emptyDescription}>
          Disruption database entries will appear here when communications are sent
        </Text>
        <Pressable
          style={roadworksStyles.actionButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.textPrimary} />
          <Text style={roadworksStyles.actionButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={roadworksStyles.section}>
      <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
        <Text style={roadworksStyles.filterTitle}>Database Records</Text>
        <Pressable
          style={[roadworksStyles.actionButton, roadworksStyles.actionButtonSecondary]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {disruptions.map((disruption, index) => (
        <View key={index} style={roadworksStyles.templateCard}>
          <View style={roadworksStyles.templateHeader}>
            <View style={roadworksStyles.flex1}>
              <Text style={roadworksStyles.templateTitle}>
                {disruption.title}
              </Text>
              <Text style={roadworksStyles.templateScenario}>
                Created by {disruption.createdBy} • {disruption.affectedRoutes?.length || 0} routes
              </Text>
            </View>
            <View style={[
              roadworksStyles.statusBadge,
              { backgroundColor: colors.infoBg, borderColor: colors.info }
            ]}>
              <Text style={[roadworksStyles.statusBadgeText, { color: colors.info }]}>
                {disruption.status}
              </Text>
            </View>
          </View>

          <Text style={roadworksStyles.roadworkDescription}>
            {disruption.description}
          </Text>

          <View style={roadworksStyles.templateFooter}>
            <Text style={roadworksStyles.templateUseCount}>
              {new Date(disruption.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {disruption.messageCount > 0 && (
              <Text style={roadworksStyles.templateUseCount}>
                {disruption.messageCount} messages
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const getStatusColor = (status) => {
  const statusColors = {
    active: colors.success,
    planned: colors.info,
    completed: colors.textMuted,
    cancelled: colors.textMuted,
    monitoring: colors.warning
  };
  return statusColors[status] || colors.textMuted;
};

const getSeverityColor = (severity) => {
  const severityColors = {
    critical: colors.critical,
    high: colors.error,
    medium: colors.warning,
    low: colors.success
  };
  return severityColors[severity] || colors.textMuted;
};

export default RoadworkDetailModal;