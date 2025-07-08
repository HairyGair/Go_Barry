import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { formatDateUK, formatTime24, formatDateTimeUK } from '../utils/dateTime';

const RoadworksDatabase = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisorSession();

  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('priority');
  const [sortDirection, setSortDirection] = useState('asc');

  const apiBaseUrl = baseUrl || 'https://go-barry.onrender.com';

  // Status and priority configurations
  const ROADWORKS_STATUSES = {
    reported: { label: 'Reported', color: '#EF4444', bgColor: '#FEF2F2', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', bgColor: '#FFF7ED', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', bgColor: '#FAF5FF', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', bgColor: '#F0FDF4', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', bgColor: '#F0F9FF', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', bgColor: '#F9FAFB', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', bgColor: '#F9FAFB', icon: 'close-circle' }
  };

  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadRoadworks();
    }
  }, [isLoggedIn, activeTab]);

  const loadRoadworks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/roadworks`);
      const data = await response.json();
      
      if (data.success) {
        setRoadworks(data.roadworks || []);
      } else {
        Alert.alert('Error', 'Failed to load roadworks data');
        setRoadworks([]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to connect to server: ${error.message}`);
      setRoadworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoadworks();
    setRefreshing(false);
  };

  const getFilteredRoadworks = () => {
    let filtered = roadworks;

    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(rw => ['active', 'monitoring'].includes(rw.status));
        break;
      case 'planned':
        filtered = filtered.filter(rw => ['approved', 'planning'].includes(rw.status));
        break;
      case 'needsAction':
        filtered = filtered.filter(rw => ['reported', 'assessing'].includes(rw.status));
        break;
      case 'all':
        // Show all
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rw => 
        rw.title.toLowerCase().includes(query) ||
        rw.location.toLowerCase().includes(query) ||
        rw.authority?.toLowerCase().includes(query) ||
        rw.affectedRoutes?.some(route => route.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, planned: 4 };
        aValue = priorityOrder[a.priority] || 5;
        bValue = priorityOrder[b.priority] || 5;
      } else if (sortField === 'createdAt' || sortField === 'lastUpdated') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleTakeAction = async (roadworkId, action, notes) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to take action');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          sessionId: sessionId,
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Action completed successfully');
        await loadRoadworks();
        setShowActionModal(false);
        setShowDetailsModal(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to take action');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to take action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRoadwork = (roadwork) => {
    setSelectedRoadwork(roadwork);
    setShowEmailModal(true);
  };

  const handleRemoveRoadwork = async (roadworkId) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to remove roadworks');
      return;
    }

    // Confirm removal
    if (Platform.OS === 'web') {
      if (!confirm('Are you sure you want to remove this roadwork? This action cannot be undone.')) {
        return;
      }
    } else {
      Alert.alert(
        'Remove Roadwork',
        'Are you sure you want to remove this roadwork? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => performRemove(roadworkId) }
        ]
      );
      return;
    }

    await performRemove(roadworkId);
  };

  const performRemove = async (roadworkId) => {
    try {
      setLoading(true);
      console.log(`🗑️ ${roadworkId} - Removing roadwork...`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          reason: 'Removed by supervisor'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork removed successfully');
        Alert.alert('Success', 'Roadwork removed successfully');
        await loadRoadworks();
      } else {
        console.error('❌ Failed to remove roadwork:', data.error);
        Alert.alert('Error', data.error || 'Failed to remove roadwork');
      }
    } catch (error) {
      console.error('❌ Error removing roadwork:', error);
      Alert.alert('Error', `Failed to remove roadwork: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapRoadwork = (roadwork) => {
    if (!roadwork) return;
    
    let mapUrl;
    
    // Check if roadwork has coordinates
    if (roadwork.coordinates && roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
      const { latitude, longitude } = roadwork.coordinates;
      mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&zoom=16&t=m`;
      console.log(`🗺️ Opening map with coordinates: ${latitude}, ${longitude}`);
    } else if (roadwork.location) {
      // Fallback to location search
      const encodedLocation = encodeURIComponent(`${roadwork.location}, UK`);
      mapUrl = `https://www.google.com/maps/search/${encodedLocation}`;
      console.log(`🗺️ Opening map with location search: ${roadwork.location}`);
    } else {
      Alert.alert('Error', 'No location information available for this roadwork');
      return;
    }
    
    // Open in new tab/window
    if (Platform.OS === 'web') {
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    } else {
      Alert.alert('Map Location', `Would open: ${mapUrl}`);
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <TouchableOpacity 
        style={[styles.headerCell, styles.priorityColumn]}
        onPress={() => setSortField('priority')}
      >
        <Text style={styles.headerText}>Priority</Text>
        {sortField === 'priority' && (
          <Ionicons 
            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.titleColumn]}
        onPress={() => setSortField('title')}
      >
        <Text style={styles.headerText}>Title & Location</Text>
        {sortField === 'title' && (
          <Ionicons 
            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.statusColumn]}
        onPress={() => setSortField('status')}
      >
        <Text style={styles.headerText}>Status</Text>
        {sortField === 'status' && (
          <Ionicons 
            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>
      
      <View style={[styles.headerCell, styles.routesColumn]}>
        <Text style={styles.headerText}>Routes</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.timeColumn]}
        onPress={() => setSortField('lastUpdated')}
      >
        <Text style={styles.headerText}>Last Updated</Text>
        {sortField === 'lastUpdated' && (
          <Ionicons 
            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>
      
      <View style={[styles.headerCell, styles.actionColumn]}>
        <Text style={styles.headerText}>Actions</Text>
      </View>
    </View>
  );

  const renderRoadworkRow = (roadwork, index) => {
    const status = ROADWORKS_STATUSES[roadwork.status] || ROADWORKS_STATUSES.reported;
    const priority = PRIORITY_LEVELS[roadwork.priority] || PRIORITY_LEVELS.medium;

    return (
      <TouchableOpacity
        key={roadwork.id}
        style={[
          styles.tableRow,
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
          roadwork.priority === 'critical' && styles.criticalRow
        ]}
        onPress={() => {
          setSelectedRoadwork(roadwork);
          setShowDetailsModal(true);
        }}
      >
        {/* Priority */}
        <View style={[styles.cell, styles.priorityColumn]}>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bgColor }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        </View>

        {/* Title & Location */}
        <View style={[styles.cell, styles.titleColumn]}>
          <Text style={styles.titleText} numberOfLines={1}>{roadwork.title}</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            <Ionicons name="location" size={12} color="#6B7280" /> {roadwork.location}
          </Text>
          <Text style={styles.authorityText} numberOfLines={1}>
            {roadwork.authority || 'Unknown Authority'}
          </Text>
        </View>

        {/* Status */}
        <View style={[styles.cell, styles.statusColumn]}>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          {roadwork.promotedToDisplay && (
            <View style={styles.displayIndicator}>
              <Ionicons name="tv" size={12} color="#10B981" />
              <Text style={styles.displayText}>Display</Text>
            </View>
          )}
        </View>

        {/* Routes */}
        <View style={[styles.cell, styles.routesColumn]}>
          <View style={styles.routesList}>
            {roadwork.affectedRoutes?.slice(0, 4).map((route, idx) => (
              <View key={idx} style={styles.routeTag}>
                <Text style={styles.routeTagText}>{route}</Text>
              </View>
            ))}
            {roadwork.affectedRoutes?.length > 4 && (
              <Text style={styles.moreRoutesText}>
                +{roadwork.affectedRoutes.length - 4}
              </Text>
            )}
          </View>
        </View>

        {/* Last Updated */}
        <View style={[styles.cell, styles.timeColumn]}>
          <Text style={styles.timeText}>
            {formatDateUK(roadwork.lastUpdated)}
          </Text>
          <Text style={styles.timeDetailText}>
            {formatTime24(roadwork.lastUpdated)}
          </Text>
        </View>

        {/* Actions */}
        <View style={[styles.cell, styles.actionColumn]}>
          <View style={styles.actionButtonGroup}>
            {roadwork.status === 'reported' || roadwork.status === 'assessing' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedRoadwork(roadwork);
                  setShowActionModal(true);
                }}
              >
                <Ionicons name="play" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedRoadwork(roadwork);
                  setShowDetailsModal(true);
                }}
              >
                <Ionicons name="eye" size={12} color="#6B7280" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedRoadwork(roadwork);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.emailButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEmailRoadwork(roadwork);
              }}
            >
              <Ionicons name="mail" size={12} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.mapButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMapRoadwork(roadwork);
              }}
            >
              <Ionicons name="location" size={12} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveRoadwork(roadwork.id);
              }}
            >
              <Ionicons name="trash" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const filteredData = getFilteredRoadworks();
    const stats = {
      total: filteredData.length,
      critical: filteredData.filter(rw => rw.priority === 'critical').length,
      needsAction: filteredData.filter(rw => ['reported', 'assessing'].includes(rw.status)).length,
      onDisplay: filteredData.filter(rw => rw.promotedToDisplay).length
    };

    return (
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.needsAction}</Text>
          <Text style={styles.statLabel}>Needs Action</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.onDisplay}</Text>
          <Text style={styles.statLabel}>On Display</Text>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.loginPromptTitle}>Authentication Required</Text>
          <Text style={styles.loginPromptText}>
            Please log in as a supervisor to access the Roadworks Database
          </Text>
        </View>
      </View>
    );
  }

  const filteredRoadworks = getFilteredRoadworks();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Roadworks Database</Text>
          <Text style={styles.headerSubtitle}>
            Professional management interface • {supervisorName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#3B82F6" 
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'active', label: 'Currently Active', count: roadworks.filter(rw => ['active', 'monitoring'].includes(rw.status)).length },
          { key: 'planned', label: 'Arranged/Planned', count: roadworks.filter(rw => ['approved', 'planning'].includes(rw.status)).length },
          { key: 'needsAction', label: 'Needs Action', count: roadworks.filter(rw => ['reported', 'assessing'].includes(rw.status)).length },
          { key: 'all', label: 'All Records', count: roadworks.length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
              tab.key === 'needsAction' && tab.count > 0 && styles.urgentTab
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
              tab.key === 'needsAction' && tab.count > 0 && styles.urgentTabText
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabBadge,
              activeTab === tab.key && styles.activeTabBadge,
              tab.key === 'needsAction' && tab.count > 0 && styles.urgentTabBadge
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === tab.key && styles.activeTabBadgeText,
                tab.key === 'needsAction' && tab.count > 0 && styles.urgentTabBadgeText
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Stats */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, location, authority, or routes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {renderStats()}
      </View>

      {/* Database Table */}
      <ScrollView
        style={styles.tableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading roadworks database...</Text>
          </View>
        ) : filteredRoadworks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct" size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Roadworks Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No roadworks match the selected filter'}
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            {renderTableHeader()}
            {filteredRoadworks.map((roadwork, index) => renderRoadworkRow(roadwork, index))}
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      <RoadworkDetailsModal
        visible={showDetailsModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowDetailsModal(false)}
        onEmail={handleEmailRoadwork}
        onMap={handleMapRoadwork}
      />

      {/* Action Modal */}
      <ActionModal
        visible={showActionModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowActionModal(false)}
        onTakeAction={handleTakeAction}
        loading={loading}
      />

      {/* Email Modal */}
      <EmailModal
        visible={showEmailModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowEmailModal(false)}
        supervisorName={supervisorName}
      />
      
      {/* Edit Modal */}
      <EditModal
        visible={showEditModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowEditModal(false)}
        onSave={async (updatedData) => {
          try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/roadworks/${selectedRoadwork.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...updatedData,
                sessionId: sessionId
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              Alert.alert('Success', 'Roadwork updated successfully');
              await loadRoadworks();
              setShowEditModal(false);
            } else {
              Alert.alert('Error', data.error || 'Failed to update roadwork');
            }
          } catch (error) {
            Alert.alert('Error', `Failed to update roadwork: ${error.message}`);
          } finally {
            setLoading(false);
          }
        }}
        loading={loading}
      />
    </View>
  );
};

// Email Modal Component
const EmailModal = ({ visible, roadwork, onClose, supervisorName }) => {
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailType, setEmailType] = useState('internal');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (roadwork && visible) {
      // Auto-populate email content based on roadwork
      const subject = `Roadworks Update: ${roadwork.title}`;
      setEmailSubject(subject);
      
      if (emailType === 'internal') {
        const internalBody = `ROADWORKS NOTIFICATION

Location: ${roadwork.location}
Authority: ${roadwork.authority || 'Unknown'}
Status: ${roadwork.status}
Priority: ${roadwork.priority}

Description:
${roadwork.description || 'No description provided'}

Affected Routes: ${roadwork.affectedRoutes?.join(', ') || 'None specified'}

Dates:
Start: ${roadwork.plannedStartDate ? formatDateUK(roadwork.plannedStartDate) : 'TBC'}
End: ${roadwork.plannedEndDate ? formatDateUK(roadwork.plannedEndDate) : 'TBC'}

Contact: ${roadwork.contactPerson || 'N/A'}
Phone: ${roadwork.contactPhone || 'N/A'}

Reported by: ${supervisorName}
Ref: ${roadwork.id}`;
        setEmailBody(internalBody);
      } else {
        const customerBody = `Service Update - ${roadwork.title}

Dear Customers,

We wish to inform you of roadworks affecting our services:

Location: ${roadwork.location}
Expected Duration: ${roadwork.estimatedDuration || 'To be confirmed'}

Affected Services: ${roadwork.affectedRoutes?.join(', ') || 'Various services'}

We apologize for any inconvenience caused and recommend allowing extra time for your journey.

For live updates, please check our website or app.

Thank you for your patience.

Go North East Customer Services`;
        setEmailBody(customerBody);
      }
    }
  }, [roadwork, visible, emailType, supervisorName]);

  const handleSendEmail = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSending(true);
    
    // Simulate email sending (in production, integrate with actual email service)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Email sent successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!visible || !roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 700, maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Email Roadworks Information</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.roadworkTitle}>{roadwork.title}</Text>
            <Text style={styles.roadworkLocation}>{roadwork.location}</Text>

            <View style={styles.emailTypeSelector}>
              <Text style={styles.sectionTitle}>Email Type</Text>
              <View style={styles.emailTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.emailTypeButton,
                    emailType === 'internal' && styles.emailTypeButtonActive
                  ]}
                  onPress={() => setEmailType('internal')}
                >
                  <Text style={[
                    styles.emailTypeButtonText,
                    emailType === 'internal' && styles.emailTypeButtonTextActive
                  ]}>
                    Internal Staff
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.emailTypeButton,
                    emailType === 'customer' && styles.emailTypeButtonActive
                  ]}
                  onPress={() => setEmailType('customer')}
                >
                  <Text style={[
                    styles.emailTypeButtonText,
                    emailType === 'customer' && styles.emailTypeButtonTextActive
                  ]}>
                    Customer Communication
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To *</Text>
              <TextInput
                style={styles.textInput}
                value={emailTo}
                onChangeText={setEmailTo}
                placeholder={emailType === 'internal' ? 'drivers@gonortheast.co.uk, supervisors@gonortheast.co.uk' : 'customers@gonortheast.co.uk'}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Email subject"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message *</Text>
              <TextInput
                style={[styles.textInput, styles.emailTextArea]}
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Email message"
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={12}
              />
            </View>

            <View style={styles.emailPreview}>
              <Text style={styles.previewTitle}>Quick Actions:</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    const mapLink = roadwork.coordinates ? 
                      `https://www.google.com/maps?q=${roadwork.coordinates.latitude},${roadwork.coordinates.longitude}` :
                      `https://www.google.com/maps/search/${encodeURIComponent(roadwork.location + ', UK')}`;
                    setEmailBody(emailBody + '\n\nMap Location: ' + mapLink);
                  }}
                >
                  <Ionicons name="location" size={16} color="#3B82F6" />
                  <Text style={styles.quickActionText}>Add Map Link</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    const contactInfo = roadwork.contactPerson ? 
                      `\n\nContact Information:\nName: ${roadwork.contactPerson}\nPhone: ${roadwork.contactPhone || 'N/A'}\nEmail: ${roadwork.contactEmail || 'N/A'}` :
                      '';
                    setEmailBody(emailBody + contactInfo);
                  }}
                >
                  <Ionicons name="person" size={16} color="#3B82F6" />
                  <Text style={styles.quickActionText}>Add Contact Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendEmailButton, sending && styles.buttonDisabled]}
              onPress={handleSendEmail}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                  <Text style={styles.sendEmailButtonText}>Send Email</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Action Modal Component
const ActionModal = ({ visible, roadwork, onClose, onTakeAction, loading }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [notes, setNotes] = useState('');

  const actionOptions = [
    { value: 'assessing', label: 'Start Assessment', description: 'Begin reviewing impact on services' },
    { value: 'planning', label: 'Begin Planning', description: 'Start creating response plans' },
    { value: 'approved', label: 'Approve Plans', description: 'Approve and ready for implementation' },
    { value: 'cancelled', label: 'Dismiss/Cancel', description: 'No action required or cancelled' }
  ];

  const handleSubmit = () => {
    if (!selectedAction || !notes.trim()) {
      Alert.alert('Error', 'Please select an action and provide notes');
      return;
    }
    onTakeAction(roadwork?.id, selectedAction, notes);
    setSelectedAction('');
    setNotes('');
  };

  if (!visible || !roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Take Action</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.roadworkTitle}>{roadwork.title}</Text>
            <Text style={styles.roadworkLocation}>{roadwork.location}</Text>

            <Text style={styles.sectionTitle}>Select Action</Text>
            {actionOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.actionOption,
                  selectedAction === option.value && styles.actionOptionSelected
                ]}
                onPress={() => setSelectedAction(option.value)}
              >
                <View style={styles.actionOptionContent}>
                  <Text style={[
                    styles.actionOptionLabel,
                    selectedAction === option.value && styles.actionOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.actionOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedAction === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Action Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe what action you're taking..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Confirm Action</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Edit Modal Component
const EditModal = ({ visible, roadwork, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (roadwork && visible) {
      setFormData({
        title: roadwork.title || '',
        description: roadwork.description || '',
        location: roadwork.location || '',
        authority: roadwork.authority || '',
        contactPerson: roadwork.contactPerson || '',
        contactPhone: roadwork.contactPhone || '',
        contactEmail: roadwork.contactEmail || '',
        plannedStartDate: roadwork.plannedStartDate || '',
        plannedEndDate: roadwork.plannedEndDate || '',
        estimatedDuration: roadwork.estimatedDuration || '',
        roadworkType: roadwork.roadworkType || 'general',
        trafficManagement: roadwork.trafficManagement || 'traffic_control',
        priority: roadwork.priority || 'medium',
        affectedRoutes: roadwork.affectedRoutes || []
      });
    }
  }, [roadwork, visible]);

  const handleSave = () => {
    if (!formData.title || !formData.location) {
      Alert.alert('Error', 'Title and location are required');
      return;
    }
    onSave(formData);
  };

  const handleAddRoute = () => {
    Alert.prompt(
      'Add Route',
      'Enter route number:',
      (route) => {
        if (route && route.trim()) {
          setFormData({
            ...formData,
            affectedRoutes: [...formData.affectedRoutes, route.trim()]
          });
        }
      }
    );
  };

  const handleRemoveRoute = (route) => {
    setFormData({
      ...formData,
      affectedRoutes: formData.affectedRoutes.filter(r => r !== route)
    });
  };

  if (!visible || !roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 800, maxHeight: '95%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Roadwork</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="E.g., RTC - Gateshead Bridge Emergency Repairs"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputHelp}>Give a descriptive title that explains what's happening</Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Detailed description of the roadwork..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Street name or area"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.priorityButtons}>
                {['critical', 'high', 'medium', 'low', 'planned'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priorityButton,
                      formData.priority === level && styles.priorityButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, priority: level })}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      formData.priority === level && styles.priorityButtonTextActive
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Authority */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Authority/Organisation</Text>
              <TextInput
                style={styles.textInput}
                value={formData.authority}
                onChangeText={(text) => setFormData({ ...formData, authority: text })}
                placeholder="E.g., Newcastle City Council"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Contact Details */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                placeholder="Name of contact"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.contactPhone}
                  onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Contact Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.contactEmail}
                  onChangeText={(text) => setFormData({ ...formData, contactEmail: text })}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Timing */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Planned Start Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.plannedStartDate ? formatDateTimeUK(formData.plannedStartDate) : ''}
                  onChangeText={(text) => setFormData({ ...formData, plannedStartDate: text })}
                  placeholder="DD/MM/YYYY HH:MM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Planned End Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.plannedEndDate ? formatDateTimeUK(formData.plannedEndDate) : ''}
                  onChangeText={(text) => setFormData({ ...formData, plannedEndDate: text })}
                  placeholder="DD/MM/YYYY HH:MM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Duration</Text>
              <TextInput
                style={styles.textInput}
                value={formData.estimatedDuration}
                onChangeText={(text) => setFormData({ ...formData, estimatedDuration: text })}
                placeholder="E.g., 3 days, 2 weeks"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Affected Routes */}
            <View style={styles.inputGroup}>
              <View style={styles.routesHeader}>
                <Text style={styles.inputLabel}>Affected Routes</Text>
                <TouchableOpacity
                  style={styles.addRouteButton}
                  onPress={handleAddRoute}
                >
                  <Ionicons name="add-circle" size={20} color="#3B82F6" />
                  <Text style={styles.addRouteButtonText}>Add Route</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.routeTags}>
                {formData.affectedRoutes?.map((route) => (
                  <TouchableOpacity
                    key={route}
                    style={styles.editableRouteTag}
                    onPress={() => handleRemoveRoute(route)}
                  >
                    <Text style={styles.routeTagText}>{route}</Text>
                    <Ionicons name="close-circle" size={16} color="#DC2626" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Work Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Roadwork Type</Text>
              <View style={styles.typeButtons}>
                {[
                  { value: 'general', label: 'General' },
                  { value: 'emergency', label: 'Emergency' },
                  { value: 'major_works', label: 'Major Works' },
                  { value: 'road_closure', label: 'Road Closure' },
                  { value: 'utilities', label: 'Utilities' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.roadworkType === type.value && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, roadworkType: type.value })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.roadworkType === type.value && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced Details Modal Component
const RoadworkDetailsModal = ({ visible, roadwork, onClose, onEmail, onMap }) => {
  if (!visible || !roadwork) return null;

  const status = {
    reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
  }[roadwork.status] || { label: 'Unknown', color: '#6B7280', icon: 'help' };

  const priority = {
    critical: { label: 'Critical', color: '#DC2626' },
    high: { label: 'High', color: '#EA580C' },
    medium: { label: 'Medium', color: '#D97706' },
    low: { label: 'Low', color: '#65A30D' },
    planned: { label: 'Planned', color: '#7C3AED' }
  }[roadwork.priority] || { label: 'Unknown', color: '#6B7280' };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Roadwork Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailsHeader}>
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                <Ionicons name={status.icon} size={16} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: `${priority.color}20` }]}>
                <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
              </View>
            </View>

            <Text style={styles.detailsTitle}>{roadwork.title}</Text>
            <Text style={styles.detailsDescription}>{roadwork.description}</Text>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Quick Actions</Text>
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailActionButton}
                  onPress={() => {
                    onClose();
                    onEmail(roadwork);
                  }}
                >
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                  <Text style={styles.detailActionText}>Email Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: '#059669' }]}
                  onPress={() => onMap(roadwork)}
                >
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                  <Text style={styles.detailActionText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  refreshButton: {
    padding: 8,
  },
  refreshing: {
    transform: [{ rotate: '360deg' }],
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EBF5FF',
  },
  urgentTab: {
    backgroundColor: '#FFF7ED',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  urgentTabText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
  },
  activeTabBadge: {
    backgroundColor: '#3B82F6',
  },
  urgentTabBadge: {
    backgroundColor: '#F59E0B',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  urgentTabBadgeText: {
    color: '#FFFFFF',
  },
  controlsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeSortText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  roadworksList: {
    gap: 16,
  },
  roadworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  criticalCard: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  priorityIndicator: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roadworkId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  displayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  displayBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  authorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  authorityText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  routesSection: {
    marginBottom: 16,
  },
  routesLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeTag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  moreRoutesTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreRoutesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryActionButton: {
    backgroundColor: '#10B981',
  },
  secondaryActionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dangerActionButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  roadworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roadworkLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  actionOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionOptionContent: {
    flex: 1,
  },
  actionOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionOptionLabelSelected: {
    color: '#047857',
  },
  actionOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Details Modal specific styles
  detailsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  detailActionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  detailActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Email Modal Styles
  emailTypeSelector: {
    marginBottom: 20,
  },
  emailTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  emailTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emailTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  emailTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emailTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emailTextArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  emailPreview: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  sendEmailButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Edit Modal Styles
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRouteButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  editableRouteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RoadworksDatabase;

