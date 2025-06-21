// Go_BARRY/components/admin/SupervisorManager.jsx
// Supervisor management component for admin panel

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://go-barry.onrender.com';

const SupervisorManager = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load supervisors
  useEffect(() => {
    loadSupervisors();
    const interval = setInterval(loadSupervisors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSupervisors = async () => {
    try {
      const [supervisorsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/supervisors`),
        fetch(`${API_BASE}/api/supervisor/active-sessions`)
      ]);

      if (supervisorsRes.ok) {
        const data = await supervisorsRes.json();
        setSupervisors(data.supervisors || []);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setActiveSessions(data.activeSessions || []);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async (sessionId) => {
    Alert.alert(
      'Force Logout',
      'Are you sure you want to force logout this supervisor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/api/supervisor/force-logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
              });

              if (response.ok) {
                Alert.alert('Success', 'Supervisor logged out successfully');
                loadSupervisors();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout supervisor');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Active Sessions ({activeSessions.length})</Text>
      
      <View style={styles.sessionsGrid}>
        {activeSessions.map(session => (
          <View key={session.sessionId} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View>
                <Text style={styles.sessionName}>{session.supervisorName}</Text>
                <Text style={styles.sessionBadge}>Badge: {session.badge}</Text>
                <Text style={styles.sessionDuty}>Duty: {session.duty || 'Unknown'}</Text>
              </View>
              <View style={styles.sessionStatus}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.sessionStatusText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoText}>
                Login: {new Date(session.loginTime).toLocaleTimeString()}
              </Text>
              <Text style={styles.sessionInfoText}>
                Last Activity: {new Date(session.lastActivity).toLocaleTimeString()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.forceLogoutButton}
              onPress={() => forceLogout(session.sessionId)}
            >
              <Ionicons name="log-out" size={16} color="#EF4444" />
              <Text style={styles.forceLogoutText}>Force Logout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>All Supervisors ({supervisors.length})</Text>
      
      <View style={styles.supervisorsList}>
        {supervisors.map(supervisor => {
          const isOnline = activeSessions.some(s => s.supervisorId === supervisor.id);
          
          return (
            <View key={supervisor.id} style={styles.supervisorItem}>
              <View style={styles.supervisorInfo}>
                <View style={[styles.statusIndicator, { 
                  backgroundColor: isOnline ? '#10B981' : '#E5E7EB' 
                }]} />
                <View>
                  <Text style={styles.supervisorName}>{supervisor.name}</Text>
                  <Text style={styles.supervisorDetails}>
                    {supervisor.role} • Badge: {supervisor.badge}
                  </Text>
                  {supervisor.isAdmin && (
                    <Text style={styles.adminBadge}>ADMIN ACCESS</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.supervisorActions}>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="create" size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Supervisor</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sessionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  sessionCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionBadge: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionDuty: {
    fontSize: 12,
    color: '#6B7280',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  sessionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  forceLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 6,
  },
  forceLogoutText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  supervisorsList: {
    gap: 8,
    marginBottom: 24,
  },
  supervisorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  supervisorDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  adminBadge: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },
  supervisorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SupervisorManager;
