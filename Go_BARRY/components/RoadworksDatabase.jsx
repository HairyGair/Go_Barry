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

  const handleMapRoadwork = (roadwork) => {
    if (!roadwork) return;
    
    let mapUrl;
    
    // Check if roadwork has coordinates
    if (roadwork.coordinates && roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
      const { latitude, longitude } = roadwork.coordinates;
      mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&zoom=16&t=m`;
    } else if (roadwork.location) {
      // Fallback to location search
      const encodedLocation = encodeURIComponent(`${roadwork.location}, UK`);
      mapUrl = `https://www.google.com/maps/search/${encodedLocation}`;
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
            {new Date(roadwork.lastUpdated).toLocaleDateString()}
          </Text>
          <Text style={styles.timeDetailText}>
            {new Date(roadwork.lastUpdated).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
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
Start: ${roadwork.plannedStartDate ? new Date(roadwork.plannedStartDate).toLocaleDateString() : 'TBC'}
End: ${roadwork.plannedEndDate ? new Date(roadwork.plannedEndDate).toLocaleDateString() : 'TBC'}

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
              <Text style={styles.detailsSectionTitle}>Location & Authority</Text>
              <Text style={styles.detailsText}>📍 {roadwork.location}</Text>
              <Text style={styles.detailsText}>🏛️ {roadwork.authority || 'Unknown Authority'}</Text>
              {roadwork.contactPerson && (
                <Text style={styles.detailsText}>👤 {roadwork.contactPerson}</Text>
              )}
            </View>

            {roadwork.affectedRoutes && roadwork.affectedRoutes.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Affected Routes ({roadwork.affectedRoutes.length})</Text>
                <View style={styles.routeTags}>
                  {roadwork.affectedRoutes.map((route) => (
                    <View key={route} style={styles.routeTag}>
                      <Text style={styles.routeTagText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Timeline</Text>
              <Text style={styles.detailsText}>📅 Created: {new Date(roadwork.createdAt).toLocaleString()}</Text>
              <Text style={styles.detailsText}>🔄 Updated: {new Date(roadwork.lastUpdated).toLocaleString()}</Text>
              <Text style={styles.detailsText}>👤 Created by: {roadwork.createdByName}</Text>
            </View>

            {/* Quick Actions */}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  urgentTab: {
    borderBottomColor: '#F59E0B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
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
    borderRadius: 12,
    minWidth: 24,
  },
  activeTabBadge: {
    backgroundColor: '#EBF5FF',
  },
  urgentTabBadge: {
    backgroundColor: '#FFF7ED',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabBadgeText: {
    color: '#3B82F6',
  },
  urgentTabBadgeText: {
    color: '#F59E0B',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
  priorityColumn: { width: 80 },
  titleColumn: { flex: 2 },
  statusColumn: { width: 100 },
  routesColumn: { width: 120 },
  timeColumn: { width: 90 },
  actionColumn: { width: 40 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#FAFAFA',
  },
  criticalRow: {
    backgroundColor: '#FEF2F2',
  },
  cell: {
    justifyContent: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  authorityText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  displayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  displayText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  routeTag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  routeTagText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
  moreRoutesText: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeDetailText: {
    fontSize: 11,
    color: '#6B7280',
  },
  actionButtonGroup: {
    flexDirection: 'column',
    gap: 2,
  },
  actionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    justifyContent: 'center',
  },
  mapButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
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
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  roadworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  roadworkLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  actionOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  actionOptionContent: {
    flex: 1,
  },
  actionOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Details Modal specific styles
  detailsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  detailActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Email Modal Styles
  emailTypeSelector: {
    marginBottom: 16,
  },
  emailTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  emailTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  emailTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  emailPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  sendEmailButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RoadworksDatabase;