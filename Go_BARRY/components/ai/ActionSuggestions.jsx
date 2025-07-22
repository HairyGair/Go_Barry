import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../ui/LinearGradient';

const ActionSuggestions = ({ incident, onActionSelect, supervisorBadge }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState('actions');
  const [showMessageDetail, setShowMessageDetail] = useState(null);

  useEffect(() => {
    if (incident) {
      fetchSuggestions();
    }
  }, [incident]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://go-barry.onrender.com/api/suggestions/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident,
          supervisorBadge
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('❌ Fetch suggestions error:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSelect = (action) => {
    if (onActionSelect) {
      onActionSelect({
        ...action,
        source: 'ai_suggestion',
        timestamp: new Date().toISOString()
      });
    }
  };

  const renderActions = () => {
    if (!suggestions?.recommendedActions?.length) {
      return <Text style={styles.emptyText}>No actions available</Text>;
    }

    return suggestions.recommendedActions.map((action, index) => (
      <TouchableOpacity
        key={index}
        style={styles.actionCard}
        onPress={() => handleActionSelect(action)}
      >
        <View style={styles.actionHeader}>
          <View style={[styles.actionTypeBadge, { backgroundColor: getActionColor(action.type) }]}>
            <Text style={styles.actionTypeText}>{action.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.priorityText}>Priority {action.priority}</Text>
        </View>
        <Text style={styles.actionTitle}>{action.action}</Text>
        <Text style={styles.actionReason}>{action.reason}</Text>
      </TouchableOpacity>
    ));
  };

  const renderMessages = () => {
    if (!suggestions?.messages?.length) {
      return <Text style={styles.emptyText}>No message templates available</Text>;
    }

    return suggestions.messages.map((message, index) => (
      <TouchableOpacity
        key={index}
        style={styles.messageCard}
        onPress={() => setShowMessageDetail(message)}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.relevanceText}>{message.relevance}</Text>
        </View>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {message.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.categoryText}>{message.category}</Text>
          <Text style={styles.usageText}>{message.usage_count} uses</Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderSimilarIncidents = () => {
    if (!suggestions?.similarIncidents?.length) {
      return <Text style={styles.emptyText}>No similar incidents found</Text>;
    }

    return suggestions.similarIncidents.map((incident, index) => (
      <View key={index} style={styles.incidentCard}>
        <View style={styles.incidentHeader}>
          <Text style={styles.similarityBadge}>{incident.similarity} match</Text>
          <Text style={styles.effectivenessText}>{incident.effectiveness} effective</Text>
        </View>
        <Text style={styles.incidentLocation}>{incident.location}</Text>
        <Text style={styles.incidentDescription}>{incident.description}</Text>
        {incident.resolution && (
          <View style={styles.resolutionBox}>
            <Text style={styles.resolutionLabel}>Resolution:</Text>
            <Text style={styles.resolutionText}>{incident.resolution}</Text>
            {incident.resolution_time && (
              <Text style={styles.resolutionTime}>Resolved in {incident.resolution_time}</Text>
            )}
          </View>
        )}
      </View>
    ));
  };

  const renderDiversions = () => {
    if (!suggestions?.diversions?.length) {
      return <Text style={styles.emptyText}>No diversion templates available</Text>;
    }

    return suggestions.diversions.map((diversion, index) => (
      <View key={index} style={styles.diversionCard}>
        <Text style={styles.diversionTitle}>{diversion.title}</Text>
        <Text style={styles.diversionRoute}>Route {diversion.route_id}</Text>
        <Text style={styles.diversionDescription}>{diversion.description}</Text>
        <View style={styles.diversionDetails}>
          <Text style={styles.delayText}>+{diversion.estimated_delay} mins</Text>
          <Text style={styles.effectivenessText}>{diversion.effectiveness}% effective</Text>
        </View>
      </View>
    ));
  };

  const renderAffectedRoutes = () => {
    if (!suggestions?.affectedRoutes?.length) {
      return <Text style={styles.emptyText}>No routes identified</Text>;
    }

    return (
      <View style={styles.routesContainer}>
        {suggestions.affectedRoutes.map((route, index) => (
          <View key={index} style={styles.routeBadge}>
            <Text style={styles.routeNumber}>{route.route_short_name}</Text>
            <Text style={styles.routeName}>{route.route_long_name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'immediate': return '#FF6B6B';
      case 'historical': return '#4ECDC4';
      case 'route': return '#45B7D1';
      case 'timing': return '#FFA07A';
      default: return '#95A5A6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Analyzing incident...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSuggestions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0066CC', '#004499']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="bulb" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>AI Action Suggestions</Text>
          {suggestions?.confidence && (
            <Text style={styles.confidenceText}>Confidence: {suggestions.confidence}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Section Tabs */}
      <View style={styles.tabs}>
        {['actions', 'messages', 'similar', 'routes', 'diversions'].map((section) => (
          <TouchableOpacity
            key={section}
            style={[styles.tab, selectedSection === section && styles.activeTab]}
            onPress={() => setSelectedSection(section)}
          >
            <Text style={[styles.tabText, selectedSection === section && styles.activeTabText]}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedSection === 'actions' && renderActions()}
        {selectedSection === 'messages' && renderMessages()}
        {selectedSection === 'similar' && renderSimilarIncidents()}
        {selectedSection === 'routes' && renderAffectedRoutes()}
        {selectedSection === 'diversions' && renderDiversions()}
      </ScrollView>

      {/* Message Detail Modal */}
      <Modal
        visible={!!showMessageDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showMessageDetail?.title}</Text>
              <TouchableOpacity onPress={() => setShowMessageDetail(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{showMessageDetail?.content}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.useTemplateButton}
                  onPress={() => {
                    handleActionSelect({
                      type: 'message',
                      action: 'Use message template',
                      template: showMessageDetail
                    });
                    setShowMessageDetail(null);
                  }}
                >
                  <Text style={styles.useTemplateText}>Use This Template</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 5,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
    flex: 1,
  },
  confidenceText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  // Action styles
  actionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionTypeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  actionReason: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Message styles
  messageCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  relevanceText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 12,
    color: '#999',
  },
  usageText: {
    fontSize: 12,
    color: '#999',
  },
  // Incident styles
  incidentCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  similarityBadge: {
    backgroundColor: '#E8F5F5',
    color: '#0066CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  effectivenessText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  incidentLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resolutionBox: {
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  resolutionText: {
    fontSize: 14,
    color: '#333',
  },
  resolutionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  // Route styles
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeBadge: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    elevation: 2,
    minWidth: 80,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    textAlign: 'center',
  },
  routeName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  // Diversion styles
  diversionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  diversionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  diversionRoute: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 8,
  },
  diversionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  diversionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  delayText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalActions: {
    marginTop: 20,
  },
  useTemplateButton: {
    backgroundColor: '#0066CC',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  useTemplateText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActionSuggestions;