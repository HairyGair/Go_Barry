// Go_BARRY/components/SupervisorCard.jsx
// Supervisor presence card for display screen - shows active supervisors

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SupervisorCard = ({ 
  supervisors = [], 
  connectedCount = 0, 
  onCardPress = null,
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  // Pulse animation for active supervisors
  useEffect(() => {
    if (connectedCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [connectedCount, pulseAnimation]);

  const handleCardPress = () => {
    setIsExpanded(!isExpanded);
    if (onCardPress) {
      onCardPress(isExpanded);
    }
  };

  // Get status color based on supervisor count
  const getStatusColor = () => {
    if (connectedCount === 0) return '#6B7280'; // Gray - no supervisors
    if (connectedCount === 1) return '#F59E0B'; // Amber - single supervisor
    return '#10B981'; // Green - multiple supervisors
  };

  // Get status text
  const getStatusText = () => {
    if (connectedCount === 0) return 'No Supervisors Online';
    if (connectedCount === 1) return '1 Supervisor Online';
    return `${connectedCount} Supervisors Online`;
  };

  // Mock supervisor data if none provided
  const displaySupervisors = supervisors.length > 0 ? supervisors : [];

  // Helper function to format login time
  const formatLoginTime = (loginTime) => {
    if (!loginTime) return 'Unknown';
    const minutes = Math.floor((Date.now() - new Date(loginTime).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Helper function to get duty display name
  const getDutyDisplay = (duty) => {
    if (!duty) return 'Unknown Duty';
    if (typeof duty === 'string') return duty;
    return duty.name || duty.id || 'Unknown Duty';
  };

  return (
    <Animated.View 
      style={[
        styles.supervisorCard,
        { 
          borderLeftColor: getStatusColor(),
          transform: [{ scale: pulseAnimation }]
        },
        style
      ]}
    >
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <View style={styles.headerInfo}>
            <Text style={styles.cardTitle}>Supervisor Control</Text>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {connectedCount > 0 && (
            <View style={[styles.onlineBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.onlineCount}>{connectedCount}</Text>
            </View>
          )}
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9CA3AF" 
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {connectedCount === 0 ? (
            <View style={styles.noSupervisorsContent}>
              <Ionicons name="person-outline" size={32} color="#6B7280" />
              <Text style={styles.noSupervisorsText}>
                Waiting for supervisors to log in...
              </Text>
              <Text style={styles.noSupervisorsSubtext}>
                Alert acknowledgment and priority controls are unavailable
              </Text>
            </View>
          ) : (
            <View style={styles.supervisorsList}>
              {displaySupervisors.map((supervisor, index) => (
                <View key={supervisor.id || index} style={styles.supervisorItem}>
                  <View style={[
                    styles.supervisorAvatar,
                    { backgroundColor: supervisor.isAdmin ? '#7C3AED' : '#3B82F6' }
                  ]}>
                    <Ionicons 
                      name={supervisor.isAdmin ? "shield" : "person"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                  </View>
                  
                  <View style={styles.supervisorInfo}>
                    <View style={styles.supervisorNameRow}>
                      <Text style={styles.supervisorName}>
                        {supervisor.name || `Supervisor ${index + 1}`}
                      </Text>
                      {supervisor.isAdmin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>LINE MGR</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.supervisorRole}>
                      {supervisor.role || 'Traffic Supervisor'}
                    </Text>
                    <Text style={styles.supervisorDutyInfo}>
                      {getDutyDisplay(supervisor.duty)} • 
                      Online {formatLoginTime(supervisor.loginTime)}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.supervisorStatusDot,
                    { backgroundColor: supervisor.status === 'active' ? '#10B981' : '#F59E0B' }
                  ]} />
                </View>
              ))}
              
              {/* System Status */}
              <View style={styles.systemStatus}>
                <View style={styles.systemStatusItem}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.systemStatusText}>Alert Management: Active</Text>
                </View>
                <View style={styles.systemStatusItem}>
                  <Ionicons name="settings" size={14} color="#10B981" />
                  <Text style={styles.systemStatusText}>Priority Controls: Available</Text>
                </View>
                <View style={styles.systemStatusItem}>
                  <Ionicons name="sync" size={14} color="#10B981" />
                  <Text style={styles.systemStatusText}>Real-time Sync: Connected</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  supervisorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  
  headerInfo: {
    flex: 1,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  onlineBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  
  onlineCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  
  noSupervisorsContent: {
    alignItems: 'center',
    padding: 24,
  },
  
  noSupervisorsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  
  noSupervisorsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  supervisorsList: {
    padding: 16,
  },
  
  supervisorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  
  supervisorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  supervisorInfo: {
    flex: 1,
  },
  
  supervisorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  
  adminBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  supervisorRole: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 2,
  },
  
  supervisorDutyInfo: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
  },
  
  supervisorDetails: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  supervisorStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  systemStatus: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  
  systemStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  systemStatusText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default SupervisorCard;