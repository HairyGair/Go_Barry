// Tooltip and Onboarding System
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Tooltip Component
export const Tooltip = ({ 
  visible, 
  text, 
  position = 'top',
  targetRef,
  onClose 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', marginBottom: 8 };
      case 'bottom':
        return { top: '100%', marginTop: 8 };
      case 'left':
        return { right: '100%', marginRight: 8 };
      case 'right':
        return { left: '100%', marginLeft: 8 };
      default:
        return { bottom: '100%', marginBottom: 8 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.tooltip,
        getPositionStyle(),
        { opacity: fadeAnim }
      ]}
    >
      <Text style={styles.tooltipText}>{text}</Text>
      <TouchableOpacity style={styles.tooltipClose} onPress={onClose}>
        <Ionicons name="close" size={14} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Onboarding System
export const OnboardingProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('@go_barry_onboarding_completed');
      if (!hasCompletedOnboarding && Platform.OS === 'web') {
        setIsOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@go_barry_onboarding_completed', 'true');
      setIsOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const nextStep = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    setCurrentStep(currentStep + 1);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  return (
    <>
      {children}
      {isOnboarding && (
        <OnboardingOverlay
          currentStep={currentStep}
          onNext={nextStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
};

// Onboarding Overlay
const OnboardingOverlay = ({ currentStep, onNext, onSkip, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Go BARRY',
      description: 'Your real-time traffic intelligence platform for Go North East operations.',
      icon: 'rocket',
      target: null,
    },
    {
      id: 'navigation',
      title: 'Quick Actions Menu',
      description: 'Access frequently used features from any screen using the Quick Actions button.',
      icon: 'apps',
      target: '.quick-actions-button',
    },
    {
      id: 'alerts',
      title: 'Traffic Alerts',
      description: 'View and manage real-time traffic alerts. Click any alert for more details.',
      icon: 'warning',
      target: '.alert-item',
    },
    {
      id: 'login',
      title: 'Supervisor Login',
      description: 'Log in with your badge ID to access management features.',
      icon: 'person',
      target: '.login-button',
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start managing traffic intelligence with Go BARRY.',
      icon: 'checkmark-circle',
      target: null,
    },
  ];

  const currentStepData = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.onboardingOverlay}>
        <Animated.View 
          style={[styles.onboardingCard, { opacity: fadeAnim }]}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Icon */}
          <View style={styles.onboardingIcon}>
            <Ionicons name={currentStepData.icon} size={48} color="#3B82F6" />
          </View>

          {/* Content */}
          <Text style={styles.onboardingTitle}>{currentStepData.title}</Text>
          <Text style={styles.onboardingDescription}>{currentStepData.description}</Text>

          {/* Actions */}
          <View style={styles.onboardingActions}>
            {!isLastStep && (
              <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip Tour</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons 
                name={isLastStep ? 'checkmark' : 'arrow-forward'} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Help Button Component
export const HelpButton = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={styles.helpButton} onPress={onPress}>
        <Ionicons name="help-circle" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Interactive Guide Component
export const InteractiveGuide = ({ visible, onClose }) => {
  const guides = [
    {
      title: 'Quick Start Guide',
      items: [
        { icon: 'log-in', text: 'Log in with your supervisor badge ID' },
        { icon: 'grid', text: 'View active traffic alerts on the dashboard' },
        { icon: 'map', text: 'Check the interactive map for incident locations' },
        { icon: 'add-circle', text: 'Report new incidents or roadworks' },
      ],
    },
    {
      title: 'Keyboard Shortcuts',
      items: [
        { icon: 'key', text: 'Ctrl+1-4: Filter alerts by severity' },
        { icon: 'refresh', text: 'Ctrl+R: Refresh data' },
        { icon: 'search', text: 'Ctrl+F: Focus search' },
        { icon: 'person', text: 'Ctrl+S: Open supervisor panel' },
      ],
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.guideOverlay}>
        <View style={styles.guideContent}>
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>Help & Guides</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {guides.map((guide, index) => (
              <View key={index} style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>{guide.title}</Text>
                {guide.items.map((item, idx) => (
                  <View key={idx} style={styles.guideItem}>
                    <Ionicons name={item.icon} size={20} color="#3B82F6" />
                    <Text style={styles.guideItemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.guideButton} onPress={onClose}>
            <Text style={styles.guideButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    maxWidth: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  tooltipClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
  },

  // Onboarding Styles
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    width: Math.min(400, width * 0.9),
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  onboardingIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  onboardingDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  onboardingActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Help Button Styles
  helpButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Guide Styles
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  guideContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.8,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  guideSection: {
    marginBottom: 32,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  guideItemText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  guideButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  guideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default { Tooltip, OnboardingProvider, HelpButton, InteractiveGuide };