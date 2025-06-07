// Go_BARRY/components/TrainingHelpSystem.jsx
// Phase 5: Training & Continuous Improvement - Help System & Training Materials

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const isWeb = Platform.OS === 'web';

// Training modules and help content
const TRAINING_MODULES = {
  gettingStarted: {
    title: 'Getting Started with BARRY',
    icon: 'play-circle',
    color: '#10B981',
    duration: '10 minutes',
    topics: [
      'Logging in as a supervisor',
      'Understanding the dashboard',
      'Navigating between screens',
      'Basic system overview'
    ],
    videoUrl: 'https://training.gonortheast.co.uk/barry/getting-started',
    completed: false
  },
  incidentManagement: {
    title: 'Incident Management',
    icon: 'alert-circle',
    color: '#EF4444',
    duration: '15 minutes',
    topics: [
      'Creating new incidents',
      'GTFS-powered route detection',
      'Location search and selection',
      'Incident types and categories'
    ],
    videoUrl: 'https://training.gonortheast.co.uk/barry/incidents',
    completed: false
  },
  aiDisruption: {
    title: 'AI-Assisted Disruptions',
    icon: 'bulb',
    color: '#8B5CF6',
    duration: '12 minutes',
    topics: [
      'AI diversion suggestions',
      'Smart route recommendations',
      'Automated message generation',
      'Learning from feedback'
    ],
    videoUrl: 'https://training.gonortheast.co.uk/barry/ai-disruption',
    completed: false
  },
  messaging: {
    title: 'Message Distribution',
    icon: 'chatbubbles',
    color: '#3B82F6',
    duration: '18 minutes',
    topics: [
      'Multi-channel messaging',
      'Ticketer integration',
      'Passenger Cloud updates',
      'Email distribution lists'
    ],
    videoUrl: 'https://training.gonortheast.co.uk/barry/messaging',
    completed: false
  },
  reporting: {
    title: 'Automated Reporting',
    icon: 'document-text',
    color: '#F59E0B',
    duration: '8 minutes',
    topics: [
      'Start of Service reports',
      'Custom report generation',
      'Email automation',
      'Performance metrics'
    ],
    videoUrl: 'https://training.gonortheast.co.uk/barry/reporting',
    completed: false
  }
};

const HELP_CATEGORIES = {
  quickStart: {
    title: 'Quick Start Guide',
    icon: 'rocket',
    color: '#10B981',
    articles: [
      {
        title: 'How to log in as a supervisor',
        content: 'Select your name from the supervisor list, enter password if required (Line Manager only), then choose your duty.',
        tags: ['login', 'supervisor', 'authentication']
      },
      {
        title: 'Creating your first incident',
        content: 'Go to Disruption Control Room > Incident Manager > New Incident. Select type, location, and let GTFS auto-detect affected routes.',
        tags: ['incident', 'gtfs', 'routes']
      },
      {
        title: 'Sending messages to drivers',
        content: 'Use Message Distribution Center to send messages to Ticketer, Passenger Cloud, and email channels simultaneously.',
        tags: ['messaging', 'ticketer', 'drivers']
      }
    ]
  },
  troubleshooting: {
    title: 'Troubleshooting',
    icon: 'construct',
    color: '#EF4444',
    articles: [
      {
        title: 'Session expires on browser refresh',
        content: 'This has been fixed in v3.0. Sessions now persist across browser refreshes using secure local storage.',
        tags: ['session', 'browser', 'login']
      },
      {
        title: 'GTFS routes not showing',
        content: 'Check System Health Monitor for GTFS status. Routes auto-detect within 250m of incident location.',
        tags: ['gtfs', 'routes', 'location']
      },
      {
        title: 'Messages not sending',
        content: 'Check Message Distribution > Channel Status. Ensure channels are online and properly configured.',
        tags: ['messaging', 'channels', 'status']
      }
    ]
  },
  features: {
    title: 'Feature Guides',
    icon: 'layers',
    color: '#3B82F6',
    articles: [
      {
        title: 'AI Diversion Suggestions',
        content: 'AI analyzes incident location and suggests diversions based on knowledge base and historical data.',
        tags: ['ai', 'diversion', 'suggestions']
      },
      {
        title: 'Automated Daily Reports',
        content: 'Start of Service reports automatically generate at 00:15am and email to SMT/Operations.',
        tags: ['reports', 'automation', 'email']
      },
      {
        title: 'Multi-Channel Messaging',
        content: 'Send messages to drivers (Ticketer), passengers (website), and management (email) in one action.',
        tags: ['messaging', 'channels', 'automation']
      }
    ]
  },
  api: {
    title: 'Technical Reference',
    icon: 'code',
    color: '#6B7280',
    articles: [
      {
        title: 'API Endpoints',
        content: 'BARRY exposes REST APIs at /api/incidents, /api/messaging, /api/routes for integration.',
        tags: ['api', 'integration', 'endpoints']
      },
      {
        title: 'GTFS Data Integration',
        content: 'System uses Go North East GTFS data for route matching, stop lookup, and service planning.',
        tags: ['gtfs', 'data', 'integration']
      },
      {
        title: 'Browser Compatibility',
        content: 'Optimized for Chrome, Firefox, Safari, and Edge. Mobile-responsive design works on tablets.',
        tags: ['browser', 'compatibility', 'mobile']
      }
    ]
  }
};

const TrainingHelpSystem = () => {
  const { 
    isLoggedIn, 
    supervisorName, 
    logActivity 
  } = useSupervisorSession();

  // State management
  const [activeTab, setActiveTab] = useState('training');
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('quickStart');
  const [showArticle, setShowArticle] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load training progress on mount
  useEffect(() => {
    loadTrainingProgress();
  }, []);

  const loadTrainingProgress = async () => {
    try {
      // In production, this would load from backend/storage
      const progress = {
        gettingStarted: { completed: true, completedAt: '2024-01-15' },
        incidentManagement: { completed: false },
        aiDisruption: { completed: false },
        messaging: { completed: true, completedAt: '2024-01-20' },
        reporting: { completed: false }
      };
      setTrainingProgress(progress);
    } catch (error) {
      console.error('Failed to load training progress:', error);
    }
  };

  const markModuleComplete = (moduleId) => {
    setTrainingProgress(prev => ({
      ...prev,
      [moduleId]: {
        completed: true,
        completedAt: new Date().toISOString().split('T')[0]
      }
    }));

    if (isLoggedIn) {
      logActivity(
        'COMPLETE_TRAINING',
        `Completed training module: ${TRAINING_MODULES[moduleId].title}`,
        moduleId
      );
    }
  };

  const openTrainingVideo = (moduleId) => {
    const module = TRAINING_MODULES[moduleId];
    
    if (isWeb && module.videoUrl) {
      window.open(module.videoUrl, '_blank');
    } else if (module.videoUrl) {
      Linking.openURL(module.videoUrl);
    } else {
      alert(`Training video for ${module.title} would open here`);
    }

    if (isLoggedIn) {
      logActivity(
        'VIEW_TRAINING',
        `Viewed training: ${module.title}`,
        moduleId
      );
    }
  };

  const searchArticles = (query) => {
    if (!query) return [];
    
    const results = [];
    Object.entries(HELP_CATEGORIES).forEach(([categoryId, category]) => {
      category.articles.forEach((article, index) => {
        const matches = 
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        if (matches) {
          results.push({
            ...article,
            categoryId,
            categoryTitle: category.title,
            articleIndex: index
          });
        }
      });
    });
    
    return results;
  };

  const calculateTrainingProgress = () => {
    const totalModules = Object.keys(TRAINING_MODULES).length;
    const completedModules = Object.values(trainingProgress).filter(p => p.completed).length;
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  const overallProgress = calculateTrainingProgress();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📚 Training & Help</Text>
          <Text style={styles.subtitle}>Learn BARRY & get help when needed</Text>
        </View>
        
        {isLoggedIn && (
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{overallProgress}%</Text>
            <Text style={styles.progressLabel}>Training Complete</Text>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'training' && styles.activeTab]}
          onPress={() => setActiveTab('training')}
        >
          <Ionicons 
            name="school" 
            size={20} 
            color={activeTab === 'training' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'training' && styles.activeTabText
          ]}>
            Training Modules
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.activeTab]}
          onPress={() => setActiveTab('help')}
        >
          <Ionicons 
            name="help-circle" 
            size={20} 
            color={activeTab === 'help' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'help' && styles.activeTabText
          ]}>
            Help & Support
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Training Modules Tab */}
        {activeTab === 'training' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Modules</Text>
            
            {Object.entries(TRAINING_MODULES).map(([moduleId, module]) => {
              const progress = trainingProgress[moduleId];
              const isCompleted = progress?.completed;
              
              return (
                <View key={moduleId} style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={styles.moduleIcon}>
                      <Ionicons name={module.icon} size={24} color={module.color} />
                    </View>
                    
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDuration}>{module.duration}</Text>
                    </View>
                    
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    )}
                  </View>

                  <View style={styles.moduleTopics}>
                    {module.topics.map((topic, index) => (
                      <Text key={index} style={styles.moduleTopic}>• {topic}</Text>
                    ))}
                  </View>

                  <View style={styles.moduleActions}>
                    <TouchableOpacity
                      style={styles.watchButton}
                      onPress={() => openTrainingVideo(moduleId)}
                    >
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.watchButtonText}>Watch Video</Text>
                    </TouchableOpacity>
                    
                    {!isCompleted && (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => markModuleComplete(moduleId)}
                      >
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                        <Text style={styles.completeButtonText}>Mark Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isCompleted && progress.completedAt && (
                    <Text style={styles.completedDate}>
                      Completed on {new Date(progress.completedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Help & Support Tab */}
        {activeTab === 'help' && (
          <>
            {/* Help Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Help Categories</Text>
              <View style={styles.categoriesGrid}>
                {Object.entries(HELP_CATEGORIES).map(([categoryId, category]) => (
                  <TouchableOpacity
                    key={categoryId}
                    style={[
                      styles.categoryCard,
                      selectedCategory === categoryId && styles.selectedCategoryCard
                    ]}
                    onPress={() => setSelectedCategory(categoryId)}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={24} 
                      color={category.color} 
                    />
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryCount}>
                      {category.articles.length} articles
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Help Articles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {HELP_CATEGORIES[selectedCategory]?.title || 'Articles'}
              </Text>
              
              {HELP_CATEGORIES[selectedCategory]?.articles.map((article, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.articleCard}
                  onPress={() => setShowArticle({ ...article, categoryId: selectedCategory })}
                >
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articlePreview} numberOfLines={2}>
                    {article.content}
                  </Text>
                  <View style={styles.articleTags}>
                    {article.tags.slice(0, 3).map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Contact IT Support</Text>
            <Text style={styles.supportText}>
              For technical issues or feature requests, contact the IT team.
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Ionicons name="mail" size={20} color="#3B82F6" />
              <Text style={styles.supportButtonText}>it.support@gonortheast.co.uk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Article Modal */}
      <Modal
        visible={!!showArticle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowArticle(null)}
      >
        {showArticle && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showArticle.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowArticle(null)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.articleContent}>{showArticle.content}</Text>
              
              <View style={styles.articleTagsContainer}>
                <Text style={styles.tagsLabel}>Related Topics:</Text>
                <View style={styles.articleTags}>
                  {showArticle.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressCard: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  progressLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  tabContainer: {
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
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  moduleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleIcon: {
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  moduleDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedBadge: {
    marginLeft: 12,
  },
  moduleTopics: {
    marginBottom: 16,
  },
  moduleTopic: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  completeButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
  },
  completedDate: {
    fontSize: 12,
    color: '#10B981',
    fontStyle: 'italic',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedCategoryCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  articleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  articlePreview: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  supportCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  articleContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  articleTagsContainer: {
    marginTop: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
});

export default TrainingHelpSystem;
