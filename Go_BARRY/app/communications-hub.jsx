// Go_BARRY/app/communications-hub.jsx
// Go Barry v3.0 - Communications Hub
// Card-based interface for messaging, alerts, and communications

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppHeader from '../components/common/AppHeader';

// Import only communications-related components
import MessageDistributionEnhanced from '../components/communications/MessageDistributionEnhanced';
import EmailIntegrationEnhanced from '../components/communications/EmailIntegrationEnhanced';
import VoIPIntegrationEnhanced from '../components/communications/voip/VoIPIntegrationEnhanced';
import SharePointIntegration from '../components/communications/sharepoint/SharePointIntegration';
import AutomatedReportingSystem from '../components/AutomatedReportingSystem';

import { useSupervisor } from '../components/hooks/useSupervisorSession';
import { API_CONFIG } from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

// Communications cards configuration
const COMMUNICATIONS_CARDS = [
  {
    id: 'messaging',
    title: 'Message Distribution',
    subtitle: 'Unified Ticketer & Email messaging',
    description: 'Send messages via multiple channels with templates and tracking',
    icon: 'chatbubbles',
    color: '#8B5CF6',
    gradient: ['#9B59B6', '#8E44AD'],
    features: [
      'Ticketer integration',
      'Email templates',
      'Smart replies',
      'Message tracking'
    ],
    stats: { label: 'Sent Today', value: '156' }
  },
  {
    id: 'email',
    title: 'Email Integration',
    subtitle: 'Outlook Web Access & Quick Compose',
    description: 'Access your Outlook inbox and send emails directly',
    icon: 'mail',
    color: '#10B981',
    gradient: ['#27AE60', '#229954'],
    features: [
      'Outlook integration',
      'Quick compose',
      'Email templates',
      'Distribution lists'
    ],
    stats: { label: 'Unread', value: '12' }
  },
  {
    id: 'voip',
    title: '8x8 VoIP System',
    subtitle: 'Phone system with quick dial',
    description: 'Make calls and access emergency numbers quickly',
    icon: 'call',
    color: '#7C3AED',
    gradient: ['#8E44AD', '#7D3C98'],
    features: [
      '8x8 integration',
      'Quick dial',
      'Emergency numbers',
      'Call history'
    ],
    stats: { label: 'Active', value: 'Ready' }
  },
  {
    id: 'reports',
    title: 'Automated Reports',
    subtitle: 'Daily reports & summaries',
    description: 'Generate and send automated operational reports',
    icon: 'document-text',
    color: '#F59E0B',
    gradient: ['#F39C12', '#E67E22'],
    features: [
      'Daily summaries',
      'Custom reports',
      'Auto-generation',
      'Email scheduling'
    ],
    stats: { label: 'Generated', value: '8' }
  },
  {
    id: 'sharepoint',
    title: 'SharePoint Access',
    subtitle: 'Team documents & files',
    description: 'Access team documents and shared resources',
    icon: 'folder-open',
    color: '#059669',
    gradient: ['#16A085', '#138D75'],
    features: [
      'Document library',
      'Team folders',
      'Quick access',
      'File sharing'
    ],
    stats: { label: 'Files', value: '234' }
  }
];

const CommunicationsHub = () => {
  const router = useRouter();
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    supervisorId,
    logout
  } = useSupervisor();

  const [activeComponent, setActiveComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, router]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleCardPress = (cardId) => {
    setLoading(true);
    setActiveComponent(cardId);
    setTimeout(() => setLoading(false), 300);
  };

  const handleBack = () => {
    setActiveComponent(null);
  };

  const renderActiveComponent = () => {
    const componentProps = {
      baseUrl: API_CONFIG.baseURL,
      onClose: handleBack
    };

    switch (activeComponent) {
      case 'messaging':
        return <MessageDistributionEnhanced {...componentProps} />;
      case 'email':
        return <EmailIntegrationEnhanced {...componentProps} />;
      case 'voip':
        return <VoIPIntegrationEnhanced {...componentProps} />;
      case 'reports':
        return <AutomatedReportingSystem {...componentProps} />;
      case 'sharepoint':
        return <SharePointIntegration {...componentProps} />;
      default:
        return null;
    }
  };

  // If a component is active, show it full screen
  if (activeComponent) {
    return (
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderActiveComponent()
        )}
      </View>
    );
  }

  // Otherwise show the card grid
  return (
    <View style={styles.container}>
      <AppHeader />
      {/* Header */}
      <View style={styles.commHeader}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.backText}>Home</Text>
            </Pressable>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>💬</Text>
              <Text style={styles.headerTitle}>Communications Hub</Text>
            </View>
            <Text style={styles.headerSubtitle}>Unified messaging and communication center</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={24} color="#8B5CF6" />
              <Text style={styles.userName}>{supervisorName}</Text>
              <Text style={styles.userRole}>{supervisorRole}</Text>
            </View>
            
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statLabel}>Messages Sent</Text>
            <Text style={styles.statValue}>342</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="mail-unread" size={20} color="#F59E0B" />
            <Text style={styles.statLabel}>Unread Emails</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="call" size={20} color="#7C3AED" />
            <Text style={styles.statLabel}>Calls Today</Text>
            <Text style={styles.statValue}>28</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document" size={20} color="#059669" />
            <Text style={styles.statLabel}>Reports</Text>
            <Text style={styles.statValue}>8</Text>
          </View>
        </View>

        {/* Communications Cards Grid */}
        <View style={styles.cardsGrid}>
          {COMMUNICATIONS_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { borderTopColor: card.color }]}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardHeader, { backgroundColor: card.color + '15' }]}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name={card.icon} size={32} color={card.color} />
                </View>
                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatValue, { color: card.color }]}>{card.stats.value}</Text>
                  <Text style={styles.cardStatLabel}>{card.stats.label}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
                
                <View style={styles.cardFeatures}>
                  {card.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark" size={14} color={card.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={[styles.cardAction, { backgroundColor: card.color }]}>
                  <Text style={styles.cardActionText}>Open</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="flash" size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Send Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Group Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="calendar" size={24} color="#10B981" />
              <Text style={styles.quickActionText}>Schedule Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="settings" size={24} color="#059669" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerNav}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => router.push('/display')}
          >
            <Ionicons name="tv" size={24} color="#3B82F6" />
            <Text style={styles.footerButtonText}>Control Room Display</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => router.push('/operations-centre')}
          >
            <Ionicons name="construct" size={24} color="#059669" />
            <Text style={styles.footerButtonText}>Operations Centre</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  commHeader: {
    backgroundColor: '#1F2937',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  currentTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  card: {
    width: Platform.OS === 'web' ? 'calc(50% - 10px)' : '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderTopWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardStat: {
    alignItems: 'flex-end',
  },
  cardStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cardActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  footerNav: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
});

export default CommunicationsHub;
