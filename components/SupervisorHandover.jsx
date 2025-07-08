// components/SupervisorHandover.jsx
// Shift Handover System - Phase 3, Step 3.2
// Smooth shift transitions with comprehensive handover reports

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { useConvexSync } from '../hooks/useConvexSync';

const SupervisorHandover = () => {
  const [showCreateHandover, setShowCreateHandover] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isCreatingHandover, setIsCreatingHandover] = useState(false);

  const { supervisor, isLoggedIn } = useSupervisorSession();
  const { activeAlerts, activeSupervisors } = useConvexSync();

  // Get handover data from Convex
  const recentHandovers = useQuery(api.sync.getRecentHandovers, { limit: 10 });
  const currentShiftHandover = useQuery(api.sync.getCurrentShiftHandover, { 
    supervisorId: supervisor?.supervisorId 
  });
  const recentIncidents = useQuery(api.sync.getActiveIncidents);
  const recentActions = useQuery(api.sync.getRecentActions, { limit: 100 });

  // Convex mutations
  const createHandover = useMutation(api.sync.createShiftHandover);
  const updateHandover = useMutation(api.sync.updateShiftHandover);
  const acknowledgeHandover = useMutation(api.sync.acknowledgeHandover);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginPrompt}>Please log in to access handover system</Text>
      </View>
    );
  }

  const handleCreateHandover = async () => {
    if (!supervisor || isCreatingHandover) return;

    setIsCreatingHandover(true);
    try {
      // Gather current shift data
      const shiftData = await gatherShiftData();
      
      const handoverData = {
        fromSupervisor: supervisor.supervisorId,
        fromSupervisorName: supervisor.supervisorName,
        shiftDate: new Date().toISOString().split('T')[0],
        shiftTime: getCurrentShift(),
        incidents: shiftData.incidents,
        alerts: shiftData.activeAlerts,
        roadworks: shiftData.roadworks,
        keyDecisions: shiftData.keyDecisions,
        notes: handoverNotes.trim(),
        stats: shiftData.stats,
        recommendations: shiftData.recommendations
      };

      const result = await createHandover(handoverData);
      
      if (result.success) {
        alert('✅ Handover created successfully!\n\nHandover has been logged and is available for incoming supervisors.');
        setHandoverNotes('');
        setShowCreateHandover(false);
      } else {
        throw new Error(result.error || 'Failed to create handover');
      }
    } catch (error) {
      console.error('Failed to create handover:', error);
      alert(`❌ Failed to create handover: ${error.message}`);
    } finally {
      setIsCreatingHandover(false);
    }
  };

  const gatherShiftData = async () => {
    const now = Date.now();
    const shiftStart = getShiftStartTime();
    const shiftActions = recentActions?.filter(action => 
      action.supervisorId === supervisor.supervisorId && 
      action.timestamp >= shiftStart
    ) || [];

    // Active incidents
    const incidents = recentIncidents?.filter(incident => 
      incident.status === 'active'
    ).map(incident => ({
      id: incident.incidentId,
      type: incident.type,
      location: incident.location,
      severity: incident.severity,
      affectedRoutes: incident.affectsRoutes,
      createdAt: incident.createdAt,
      notes: incident.notes?.slice(-3) || [] // Last 3 notes
    })) || [];

    // Current active alerts
    const currentAlerts = activeAlerts?.filter(alert => 
      !alert.dismissedFromDisplay
    ).map(alert => ({
      id: alert.alertId,
      title: alert.title,
      location: alert.location,
      severity: alert.severity,
      affectedRoutes: alert.affectsRoutes,
      timestamp: alert.timestamp
    })) || [];

    // Key decisions/actions during shift
    const keyDecisions = shiftActions
      .filter(action => [
        'create_incident', 'create_roadwork', 'send_display_message',
        'push_incident_to_display', 'promote_message_priority'
      ].includes(action.action))
      .map(action => ({
        action: action.action,
        timestamp: action.timestamp,
        details: action.details,
        impact: getActionImpact(action)
      }));

    // Shift statistics
    const stats = {
      totalActions: shiftActions.length,
      alertsHandled: shiftActions.filter(a => 
        ['acknowledge_alert', 'dismiss_alert'].includes(a.action)
      ).length,
      messagesCreated: shiftActions.filter(a => a.action === 'send_display_message').length,
      incidentsCreated: shiftActions.filter(a => a.action === 'create_incident').length,
      roadworksCreated: shiftActions.filter(a => a.action === 'create_roadwork').length,
      shiftDuration: (now - shiftStart) / (1000 * 60 * 60) // hours
    };

    // Recommendations for next shift
    const recommendations = generateRecommendations(incidents, currentAlerts, keyDecisions);

    return {
      incidents,
      activeAlerts: currentAlerts,
      roadworks: [], // Would get from roadworks API
      keyDecisions,
      stats,
      recommendations
    };
  };

  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 13) return 'Early (05:00-13:00)';
    if (hour >= 13 && hour < 21) return 'Day (13:00-21:00)';
    if (hour >= 21 || hour < 1) return 'Late (21:00-01:00)';
    return 'Night (01:00-05:00)';
  };

  const getShiftStartTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (hour >= 5 && hour < 13) {
      return today.setHours(5, 0, 0, 0); // Early shift
    } else if (hour >= 13 && hour < 21) {
      return today.setHours(13, 0, 0, 0); // Day shift
    } else if (hour >= 21) {
      return today.setHours(21, 0, 0, 0); // Late shift
    } else {
      return new Date(today.getTime() - 24 * 60 * 60 * 1000).setHours(1, 0, 0, 0); // Night shift (previous day)
    }
  };

  const getActionImpact = (action) => {
    switch (action.action) {
      case 'create_incident':
        return `Created incident affecting ${action.details?.affectedRoutes || 0} routes`;
      case 'send_display_message':
        return `Sent ${action.details?.priority || 'P2'} message to display`;
      case 'create_roadwork':
        return 'Created new roadwork entry';
      default:
        return 'Action taken';
    }
  };

  const generateRecommendations = (incidents, alerts, decisions) => {
    const recommendations = [];

    if (incidents.length > 0) {
      recommendations.push({
        type: 'incidents',
        priority: 'high',
        text: `${incidents.length} active incident(s) require attention`,
        action: 'Review incident status and consider escalation'
      });
    }

    if (alerts.length > 3) {
      recommendations.push({
        type: 'alerts',
        priority: 'medium',
        text: `${alerts.length} unresolved alerts on display`,
        action: 'Consider dismissing resolved alerts or escalating persistent issues'
      });
    }

    const recentEmergencies = decisions.filter(d => 
      d.action === 'send_display_message' && 
      d.details?.priority === 'P0'
    );

    if (recentEmergencies.length > 0) {
      recommendations.push({
        type: 'emergency',
        priority: 'high',
        text: `${recentEmergencies.length} emergency message(s) sent this shift`,
        action: 'Monitor for ongoing resolution and follow-up actions needed'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'status',
        priority: 'low',
        text: 'Shift running smoothly',
        action: 'Continue standard monitoring procedures'
      });
    }

    return recommendations;
  };

  const formatHandoverTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Shift Handover System</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateHandover(true)}
          disabled={isCreatingHandover}
        >
          <Text style={styles.createButtonText}>
            {isCreatingHandover ? '⏳ Creating...' : '📝 Create Handover'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Shift Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Current Shift Status</Text>
        <View style={styles.shiftStatusCard}>
          <View style={styles.shiftStatusHeader}>
            <Text style={styles.shiftStatusName}>{supervisor.supervisorName}</Text>
            <Text style={styles.shiftStatusShift}>{getCurrentShift()}</Text>
          </View>
          <View style={styles.shiftStatusStats}>
            <StatItem label="Active Alerts" value={activeAlerts?.length || 0} color="#DC2626" />
            <StatItem label="Online Supervisors" value={activeSupervisors?.length || 0} color="#10B981" />
            <StatItem label="Active Incidents" value={recentIncidents?.length || 0} color="#F59E0B" />
          </View>
        </View>
      </View>

      {/* Recent Handovers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Handovers</Text>
        {recentHandovers && recentHandovers.length > 0 ? (
          recentHandovers.map((handover, index) => (
            <HandoverCard
              key={handover._id}
              handover={handover}
              onPress={() => setSelectedHandover(handover)}
              isRecent={index < 3}
            />
          ))
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No recent handovers found</Text>
            <Text style={styles.noDataSubtext}>Create your first handover to get started</Text>
          </View>
        )}
      </View>

      {/* Quick Status Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Quick Status Overview</Text>
        <QuickStatusOverview 
          activeAlerts={activeAlerts}
          recentIncidents={recentIncidents}
          activeSupervisors={activeSupervisors}
        />
      </View>

      {/* Create Handover Modal */}
      {showCreateHandover && (
        <CreateHandoverModal
          visible={showCreateHandover}
          onClose={() => setShowCreateHandover(false)}
          handoverNotes={handoverNotes}
          setHandoverNotes={setHandoverNotes}
          onCreateHandover={handleCreateHandover}
          isCreating={isCreatingHandover}
          supervisor={supervisor}
          currentShift={getCurrentShift()}
        />
      )}

      {/* Handover Detail Modal */}
      {selectedHandover && (
        <HandoverDetailModal
          visible={!!selectedHandover}
          handover={selectedHandover}
          onClose={() => setSelectedHandover(null)}
          currentSupervisor={supervisor}
          onAcknowledge={acknowledgeHandover}
        />
      )}
    </ScrollView>
  );
};

// Component: Handover Card
const HandoverCard = ({ handover, onPress, isRecent }) => (
  <TouchableOpacity style={[styles.handoverCard, isRecent && styles.recentHandoverCard]} onPress={onPress}>
    <View style={styles.handoverCardHeader}>
      <View>
        <Text style={styles.handoverCardFrom}>{handover.fromSupervisorName}</Text>
        <Text style={styles.handoverCardShift}>{handover.shiftTime}</Text>
      </View>
      <View style={styles.handoverCardMeta}>
        <Text style={styles.handoverCardDate}>{handover.shiftDate}</Text>
        {handover.acknowledged && (
          <Text style={styles.acknowledgedBadge}>✅ Acknowledged</Text>
        )}
      </View>
    </View>
    
    <View style={styles.handoverCardSummary}>
      <SummaryItem icon="📋" label="Incidents" value={handover.incidents?.length || 0} />
      <SummaryItem icon="⚠️" label="Alerts" value={handover.alerts?.length || 0} />
      <SummaryItem icon="⚡" label="Actions" value={handover.stats?.totalActions || 0} />
      <SummaryItem icon="💡" label="Recommendations" value={handover.recommendations?.length || 0} />
    </View>
  </TouchableOpacity>
);

// Component: Quick Status Overview
const QuickStatusOverview = ({ activeAlerts, recentIncidents, activeSupervisors }) => {
  const criticalAlerts = activeAlerts?.filter(alert => 
    alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
  )?.length || 0;

  const openIncidents = recentIncidents?.filter(incident => 
    incident.status === 'active'
  )?.length || 0;

  return (
    <View style={styles.statusOverview}>
      <StatusCard
        title="System Status"
        value={criticalAlerts > 0 ? "⚠️ ALERTS" : "✅ NORMAL"}
        subtitle={`${criticalAlerts} critical alerts`}
        color={criticalAlerts > 0 ? "#DC2626" : "#10B981"}
      />
      <StatusCard
        title="Incidents"
        value={openIncidents}
        subtitle="open incidents"
        color={openIncidents > 0 ? "#F59E0B" : "#10B981"}
      />
      <StatusCard
        title="Coverage"
        value={activeSupervisors?.length || 0}
        subtitle="supervisors online"
        color={activeSupervisors?.length > 0 ? "#10B981" : "#DC2626"}
      />
    </View>
  );
};

// Component: Create Handover Modal
const CreateHandoverModal = ({ 
  visible, onClose, handoverNotes, setHandoverNotes, 
  onCreateHandover, isCreating, supervisor, currentShift 
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
          <Text style={styles.modalCloseButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Create Shift Handover</Text>
        <View style={styles.modalHeaderSpacer} />
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.handoverForm}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Shift Information</Text>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftInfoText}>Supervisor: {supervisor?.supervisorName}</Text>
              <Text style={styles.shiftInfoText}>Shift: {currentShift}</Text>
              <Text style={styles.shiftInfoText}>Date: {new Date().toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Handover Notes</Text>
            <Text style={styles.formHint}>
              Summarize key events, decisions, and important information for the next supervisor
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter handover notes..."
              value={handoverNotes}
              onChangeText={setHandoverNotes}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.autoGeneratedSection}>
            <Text style={styles.formLabel}>Auto-Generated Data</Text>
            <Text style={styles.autoGeneratedText}>
              ✅ Current active alerts and incidents{'\n'}
              ✅ Actions taken during your shift{'\n'}
              ✅ Performance statistics{'\n'}
              ✅ Recommendations for next shift
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.createHandoverButton, isCreating && styles.disabledButton]}
          onPress={onCreateHandover}
          disabled={isCreating}
        >
          <Text style={styles.createHandoverButtonText}>
            {isCreating ? '⏳ Creating Handover...' : '📝 Create Handover'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Component: Handover Detail Modal
const HandoverDetailModal = ({ visible, handover, onClose, currentSupervisor, onAcknowledge }) => {
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    if (acknowledging) return;
    
    setAcknowledging(true);
    try {
      await onAcknowledge({
        handoverId: handover._id,
        acknowledgedBy: currentSupervisor.supervisorId,
        acknowledgedByName: currentSupervisor.supervisorName
      });
      alert('✅ Handover acknowledged successfully!');
      onClose();
    } catch (error) {
      alert(`❌ Failed to acknowledge: ${error.message}`);
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Handover Details</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <HandoverDetailContent handover={handover} />
        </ScrollView>

        <View style={styles.modalFooter}>
          {!handover.acknowledged && (
            <TouchableOpacity
              style={[styles.acknowledgeButton, acknowledging && styles.disabledButton]}
              onPress={handleAcknowledge}
              disabled={acknowledging}
            >
              <Text style={styles.acknowledgeButtonText}>
                {acknowledging ? '⏳ Acknowledging...' : '✅ Acknowledge Handover'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Utility Components
const StatItem = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SummaryItem = ({ icon, label, value }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryIcon}>{icon}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const StatusCard = ({ title, value, subtitle, color }) => (
  <View style={styles.statusCard}>
    <Text style={styles.statusCardTitle}>{title}</Text>
    <Text style={[styles.statusCardValue, { color }]}>{value}</Text>
    <Text style={styles.statusCardSubtitle}>{subtitle}</Text>
  </View>
);

const HandoverDetailContent = ({ handover }) => (
  <View style={styles.handoverDetail}>
    {/* Basic Info */}
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>📋 Handover Information</Text>
      <View style={styles.detailGrid}>
        <DetailItem label="From" value={handover.fromSupervisorName} />
        <DetailItem label="Shift" value={handover.shiftTime} />
        <DetailItem label="Date" value={handover.shiftDate} />
        <DetailItem label="Created" value={new Date(handover.createdAt).toLocaleString()} />
      </View>
    </View>

    {/* Notes */}
    {handover.notes && (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📝 Supervisor Notes</Text>
        <Text style={styles.handoverNotes}>{handover.notes}</Text>
      </View>
    )}

    {/* Statistics */}
    {handover.stats && (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📊 Shift Statistics</Text>
        <View style={styles.statsGrid}>
          <StatItem label="Total Actions" value={handover.stats.totalActions} color="#0984E3" />
          <StatItem label="Alerts Handled" value={handover.stats.alertsHandled} color="#10B981" />
          <StatItem label="Messages Created" value={handover.stats.messagesCreated} color="#F59E0B" />
          <StatItem label="Incidents" value={handover.stats.incidentsCreated} color="#DC2626" />
        </View>
      </View>
    )}

    {/* Recommendations */}
    {handover.recommendations && handover.recommendations.length > 0 && (
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>💡 Recommendations</Text>
        {handover.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <View style={[styles.recommendationPriority, { backgroundColor: getPriorityColor(rec.priority) }]}>
              <Text style={styles.recommendationPriorityText}>{rec.priority}</Text>
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationText}>{rec.text}</Text>
              <Text style={styles.recommendationAction}>{rec.action}</Text>
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Helper function outside component
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#DC2626';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  createButton: {
    backgroundColor: '#0984e3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  shiftStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0984e3',
  },
  shiftStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shiftStatusName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  shiftStatusShift: {
    fontSize: 14,
    color: '#636e72',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shiftStatusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  handoverCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recentHandoverCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00b894',
  },
  handoverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  handoverCardFrom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  handoverCardShift: {
    fontSize: 14,
    color: '#636e72',
  },
  handoverCardMeta: {
    alignItems: 'flex-end',
  },
  handoverCardDate: {
    fontSize: 14,
    color: '#636e72',
  },
  acknowledgedBadge: {
    fontSize: 12,
    color: '#00b894',
    marginTop: 2,
  },
  handoverCardSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#636e72',
  },
  statusOverview: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statusCardTitle: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
  },
  statusCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusCardSubtitle: {
    fontSize: 12,
    color: '#b2bec3',
  },
  noDataCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#b2bec3',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginLeft: 16,
  },
  modalHeaderSpacer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  handoverForm: {
    gap: 24,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 12,
  },
  shiftInfo: {
    gap: 4,
  },
  shiftInfoText: {
    fontSize: 14,
    color: '#2d3436',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  autoGeneratedSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  autoGeneratedText: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  createHandoverButton: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ced4da',
  },
  createHandoverButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  acknowledgeButton: {
    backgroundColor: '#00b894',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  handoverDetail: {
    gap: 24,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '600',
  },
  handoverNotes: {
    fontSize: 14,
    color: '#2d3436',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  recommendationPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  recommendationPriorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationAction: {
    fontSize: 13,
    color: '#636e72',
  },
});

export default SupervisorHandover;
