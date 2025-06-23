// Go_BARRY/components/SupervisorLogin.jsx
// Enhanced supervisor login with improved UX features
// Version 2.0 - Added quick badge login, SSO, visual enhancements, persistence, shortcuts, and analytics

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Image,
  Switch
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSupervisorSession, DUTY_OPTIONS } from './hooks/useSupervisorSession';
import { useConvexSync } from '../hooks/useConvexSync';
import PasswordSetupModal from './PasswordSetupModal';
import typography from '../theme/typography';

// Badge mapping for quick login
const BADGE_MAP = {
  'AW001': 'alex_woodcock',
  'AC002': 'andrew_cowley',
  'AG003': 'anthony_gair',
  'CF004': 'claire_fiddler',
  'DH005': 'david_hall',
  'JD006': 'james_daglish',
  'JP007': 'john_paterson',
  'SG008': 'simon_glass',
  'BP009': 'barry_perryman'
};

// Duty colors for visual enhancement
const DUTY_COLORS = {
  'duty_100': '#FCD34D', // Early - Yellow
  'duty_200': '#60A5FA', // Day - Blue
  'duty_400': '#A78BFA', // Late - Purple
  'duty_500': '#8B5CF6', // Night - Deep Purple
  'xops': '#34D399'      // XOps - Green
};

const SupervisorLogin = ({ visible, onClose, onLoginSuccess }) => {
  const { 
    login, 
    setPassword: setFirstTimePassword,
    needsPasswordSetup, 
    isLoading, 
    error: sessionError,
    supervisorSession,
    isLoggedIn,
    updateSessionTimeout
  } = useSupervisorSession();

  const { recentLogins = [], trackLogin = async () => ({ success: false }) } = useConvexSync();
  
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [quickLoginMode, setQuickLoginMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginAnalytics, setShowLoginAnalytics] = useState(false);

  // Refs for keyboard navigation
  const badgeInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const supervisorRefs = useRef({});
  const dutyRefs = useRef({});
  
  // Enhanced supervisor list with photos and recent login info
  const supervisors = [
    { id: 'alex_woodcock', name: 'Alex Woodcock', role: 'Supervisor', badge: 'AW001', photo: null },
    { id: 'andrew_cowley', name: 'Andrew Cowley', role: 'Supervisor', badge: 'AC002', photo: null },
    { id: 'anthony_gair', name: 'Anthony Gair', role: 'Developer/Admin', badge: 'AG003', isAdmin: true, photo: null },
    { id: 'claire_fiddler', name: 'Claire Fiddler', role: 'Supervisor', badge: 'CF004', photo: null },
    { id: 'david_hall', name: 'David Hall', role: 'Supervisor', badge: 'DH005', photo: null },
    { id: 'james_daglish', name: 'James Daglish', role: 'Supervisor', badge: 'JD006', photo: null },
    { id: 'john_paterson', name: 'John Paterson', role: 'Supervisor', badge: 'JP007', photo: null },
    { id: 'simon_glass', name: 'Simon Glass', role: 'Supervisor', badge: 'SG008', photo: null },
    { id: 'barry_perryman', name: 'Barry Perryman', role: 'Line Manager', badge: 'BP009', isAdmin: true, photo: null }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleKeyPress = (e) => {
      // Number keys for supervisor selection
      if (e.key >= '1' && e.key <= '9' && !quickLoginMode) {
        const index = parseInt(e.key) - 1;
        if (supervisors[index]) {
          handleSupervisorSelect(supervisors[index]);
        }
      }
      
      // Tab navigation
      if (e.key === 'Tab') {
        e.preventDefault();
        if (quickLoginMode && badgeInputRef.current) {
          badgeInputRef.current.focus();
        } else if (selectedSupervisor && passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }

      // Enter to submit
      if (e.key === 'Enter') {
        if (quickLoginMode && badgeNumber && password) {
          handleQuickLogin();
        } else if (selectedSupervisor && selectedDuty && password) {
          handleLogin();
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible, quickLoginMode, badgeNumber, password, selectedSupervisor, selectedDuty]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSelectedSupervisor(null);
      setSelectedDuty(null);
      setPassword('');
      setLocalError('');
      setBadgeNumber('');
      setQuickLoginMode(false);
    }
  }, [visible]);

  // Auto-close when logged in
  useEffect(() => {
    if (isLoggedIn && visible && supervisorSession?.supervisor?.duty && !needsPasswordSetup) {
      onClose();
    }
  }, [isLoggedIn, supervisorSession, visible, onClose, needsPasswordSetup]);

  // Auto-select last duty based on time and history
  useEffect(() => {
    if (selectedSupervisor && !selectedDuty) {
      const hour = new Date().getHours();
      let suggestedDuty = null;

      // Check recent login history
      const recentLogin = recentLogins && Array.isArray(recentLogins) 
        ? recentLogins.find(l => l.supervisorId === selectedSupervisor.id)
        : null;
      if (recentLogin) {
        suggestedDuty = DUTY_OPTIONS.find(d => d.id === recentLogin.dutyId);
      } else {
        // Suggest based on time
        if (hour >= 6 && hour < 12) suggestedDuty = DUTY_OPTIONS.find(d => d.id === 'duty_100');
        else if (hour >= 7 && hour < 17) suggestedDuty = DUTY_OPTIONS.find(d => d.id === 'duty_200');
        else if (hour >= 12 && hour < 22) suggestedDuty = DUTY_OPTIONS.find(d => d.id === 'duty_400');
        else suggestedDuty = DUTY_OPTIONS.find(d => d.id === 'duty_500');
      }

      if (suggestedDuty) {
        setSelectedDuty(suggestedDuty);
      }
    }
  }, [selectedSupervisor, recentLogins]);

  const handleBadgeNumberChange = (text) => {
    setBadgeNumber(text.toUpperCase());
    
    // Auto-select supervisor when valid badge entered
    if (BADGE_MAP[text.toUpperCase()]) {
      const supervisorId = BADGE_MAP[text.toUpperCase()];
      const supervisor = supervisors.find(s => s.id === supervisorId);
      if (supervisor) {
        setSelectedSupervisor(supervisor);
      }
    }
  };

  const handleQuickLogin = async () => {
    if (!BADGE_MAP[badgeNumber]) {
      setLocalError('Invalid badge number');
      return;
    }

    const supervisorId = BADGE_MAP[badgeNumber];
    const supervisor = supervisors.find(s => s.id === supervisorId);
    
    // For quick login, use the most recent duty or default
    const recentLogin = recentLogins && Array.isArray(recentLogins)
      ? recentLogins.find(l => l.supervisorId === supervisorId)
      : null;
    const duty = recentLogin 
      ? DUTY_OPTIONS.find(d => d.id === recentLogin.dutyId) 
      : DUTY_OPTIONS.find(d => d.id === 'xops');

    if (!supervisor || !duty) {
      setLocalError('Login configuration error');
      return;
    }

    await performLogin(supervisor, duty);
  };

  const handleSupervisorSelect = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setLocalError('');
  };

  const handleDutySelect = (duty) => {
    setSelectedDuty(duty);
    setLocalError('');
  };

  const handleLogin = async () => {
    setLocalError('');

    if (!selectedSupervisor) {
      setLocalError('Please select a supervisor');
      return;
    }

    if (!selectedDuty) {
      setLocalError('Please select a duty');
      return;
    }

    if (!password && !needsPasswordSetup) {
      setLocalError('Please enter your password');
      return;
    }

    await performLogin(selectedSupervisor, selectedDuty);
  };

  const performLogin = async (supervisor, duty) => {
    try {
      const result = await login({
        supervisorId: supervisor.id,
        password: password,
        duty: duty,
        rememberMe: rememberMe
      });

      if (result.success) {
        // Track successful login (if available)
        try {
          await trackLogin({
            supervisorId: supervisor.id,
            supervisorName: supervisor.name,
            dutyId: duty.id,
            timestamp: new Date().toISOString(),
            success: true
          });
        } catch (err) {
          console.warn('Login tracking failed:', err);
        }

        // Update session timeout if remember me is checked
        if (rememberMe) {
          updateSessionTimeout(60 * 60 * 1000); // 1 hour instead of 10 minutes
        }

        Alert.alert(
          'Login Successful',
          `Welcome, ${supervisor.name}!`,
          [{ text: 'OK', onPress: () => {
            onClose();
            onLoginSuccess?.();
          }}]
        );
      } else if (result.needsPasswordSetup) {
        console.log('First-time user - showing password setup');
      } else {
        setLocalError(result.error || 'Login failed');
        
        // Track failed login (if available)
        try {
          await trackLogin({
            supervisorId: supervisor.id,
            supervisorName: supervisor.name,
            dutyId: duty.id,
            timestamp: new Date().toISOString(),
            success: false,
            error: result.error
          });
        } catch (err) {
          console.warn('Login tracking failed:', err);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('An unexpected error occurred');
    }
  };

  const handlePasswordSetup = async (newPassword) => {
    const result = await setFirstTimePassword(newPassword);
    if (result.success) {
      onClose();
      onLoginSuccess?.();
    }
    return result;
  };

  const handleSSOLogin = (provider) => {
    Alert.alert(
      'SSO Integration',
      `${provider} SSO integration will be available soon. Please use badge login for now.`,
      [{ text: 'OK' }]
    );
  };

  const renderQuickLogin = () => (
    <View style={styles.quickLoginSection}>
      <Text style={styles.sectionTitle}>Quick Badge Login</Text>
      <View style={styles.quickLoginForm}>
        <View style={styles.badgeInputWrapper}>
          <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            ref={badgeInputRef}
            style={styles.badgeInput}
            placeholder="Enter badge number (e.g., AG003)"
            placeholderTextColor="#9CA3AF"
            value={badgeNumber}
            onChangeText={handleBadgeNumberChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={5}
          />
        </View>
        
        {selectedSupervisor && (
          <View style={styles.quickLoginInfo}>
            <Ionicons name="person-circle" size={24} color="#3B82F6" />
            <Text style={styles.quickLoginName}>{selectedSupervisor.name}</Text>
          </View>
        )}

        <View style={styles.passwordInputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            ref={passwordInputRef}
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.quickLoginButton,
            (!badgeNumber || !password || isLoading) && styles.loginButtonDisabled
          ]}
          onPress={handleQuickLogin}
          disabled={!badgeNumber || !password || isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging in...' : 'Quick Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchModeButton}
          onPress={() => setQuickLoginMode(false)}
        >
          <Text style={styles.switchModeText}>Use traditional login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentLogins = () => {
    if (!recentLogins || !Array.isArray(recentLogins)) return null;
    const recent = recentLogins.slice(0, 3);
    if (recent.length === 0) return null;

    return (
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Recently Logged In</Text>
        <View style={styles.recentList}>
          {recent.map((login, index) => {
            const supervisor = supervisors.find(s => s.id === login.supervisorId);
            if (!supervisor) return null;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.recentCard}
                onPress={() => {
                  setSelectedSupervisor(supervisor);
                  const duty = DUTY_OPTIONS.find(d => d.id === login.dutyId);
                  if (duty) setSelectedDuty(duty);
                }}
              >
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.recentName}>{supervisor.name}</Text>
                <Text style={styles.recentTime}>
                  {new Date(login.timestamp).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSupervisorSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        1. Select Supervisor 
        <Text style={styles.shortcutHint}> (Press 1-9)</Text>
      </Text>
      {renderRecentLogins()}
      <ScrollView style={styles.supervisorList} showsVerticalScrollIndicator={false}>
        {supervisors.map((supervisor, index) => (
          <TouchableOpacity
            key={supervisor.id}
            ref={el => supervisorRefs.current[supervisor.id] = el}
            style={[
              styles.supervisorCard,
              selectedSupervisor?.id === supervisor.id && styles.supervisorCardSelected
            ]}
            onPress={() => handleSupervisorSelect(supervisor)}
          >
            <View style={styles.supervisorInfo}>
              <View style={styles.supervisorAvatar}>
                {supervisor.photo ? (
                  <Image source={{ uri: supervisor.photo }} style={styles.avatarImage} />
                ) : (
                  <Ionicons 
                    name="person-circle" 
                    size={40} 
                    color={selectedSupervisor?.id === supervisor.id ? '#3B82F6' : '#6B7280'} 
                  />
                )}
                <Text style={styles.numberBadge}>{index + 1}</Text>
              </View>
              <View style={styles.supervisorDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.supervisorName}>{supervisor.name}</Text>
                  <Text style={styles.badgeNumber}>{supervisor.badge}</Text>
                </View>
                <Text style={styles.supervisorRole}>{supervisor.role}</Text>
              </View>
            </View>
            {supervisor.isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.badgeText}>ADMIN</Text>
              </View>
            )}
            {selectedSupervisor?.id === supervisor.id && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDutySelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>2. Select Duty</Text>
      <View style={styles.dutyGrid}>
        {DUTY_OPTIONS.map((duty) => (
          <TouchableOpacity
            key={duty.id}
            ref={el => dutyRefs.current[duty.id] = el}
            style={[
              styles.dutyCard,
              selectedDuty?.id === duty.id && styles.dutyCardSelected,
              { borderColor: selectedDuty?.id === duty.id ? DUTY_COLORS[duty.id] : 'transparent' }
            ]}
            onPress={() => handleDutySelect(duty)}
          >
            <View 
              style={[
                styles.dutyColorBar,
                { backgroundColor: DUTY_COLORS[duty.id] }
              ]} 
            />
            <Text style={[
              styles.dutyName,
              selectedDuty?.id === duty.id && styles.dutyNameSelected
            ]}>
              {duty.name}
            </Text>
            <Text style={[
              styles.dutyShift,
              selectedDuty?.id === duty.id && styles.dutyShiftSelected
            ]}>
              {duty.shift}
            </Text>
            {selectedDuty?.id === duty.id && (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={DUTY_COLORS[duty.id]} 
                style={styles.dutyCheck}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPasswordInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>3. Enter Password</Text>
      <View style={styles.passwordContainer}>
        <View style={styles.passwordInputWrapper}>
          <TextInput
            ref={passwordInputRef}
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLocalError('');
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Remember me option */}
        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={rememberMe ? '#3B82F6' : '#9CA3AF'}
          />
          <Text style={styles.rememberMeText}>
            Remember me for 1 hour (instead of 10 minutes)
          </Text>
        </View>
        
        <Text style={styles.passwordHint}>
          All supervisors require a password. First-time users will be prompted to set one.
        </Text>
      </View>
    </View>
  );

  const renderSSOOptions = () => (
    <View style={styles.ssoSection}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <Text style={styles.ssoTitle}>Single Sign-On</Text>
      <View style={styles.ssoButtons}>
        <TouchableOpacity 
          style={[styles.ssoButton, styles.microsoftButton]}
          onPress={() => handleSSOLogin('Microsoft')}
        >
          <FontAwesome5 name="microsoft" size={20} color="#FFFFFF" />
          <Text style={styles.ssoButtonText}>Microsoft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.ssoButton, styles.googleButton]}
          onPress={() => handleSSOLogin('Google')}
        >
          <FontAwesome5 name="google" size={20} color="#FFFFFF" />
          <Text style={styles.ssoButtonText}>Google</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.ssoHint}>
        SSO integration coming soon - use badge login for now
      </Text>
    </View>
  );

  const error = localError || sessionError;

  return (
    <>
      <Modal
        visible={visible && !needsPasswordSetup}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Supervisor Login</Text>
              <View style={styles.headerButtons}>
                {supervisorSession?.isAdmin && (
                  <TouchableOpacity 
                    onPress={() => setShowLoginAnalytics(true)}
                    style={styles.analyticsButton}
                  >
                    <Ionicons name="analytics" size={24} color="#6B7280" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Quick Login / Traditional Toggle */}
              {!quickLoginMode ? (
                <TouchableOpacity
                  style={styles.quickLoginToggle}
                  onPress={() => setQuickLoginMode(true)}
                >
                  <Ionicons name="flash" size={20} color="#3B82F6" />
                  <Text style={styles.quickLoginToggleText}>Switch to Quick Badge Login</Text>
                </TouchableOpacity>
              ) : null}

              {/* Login Forms */}
              {quickLoginMode ? (
                renderQuickLogin()
              ) : (
                <>
                  {renderSupervisorSelection()}
                  {selectedSupervisor && renderDutySelection()}
                  {selectedSupervisor && selectedDuty && renderPasswordInput()}

                  {/* Login Button */}
                  {selectedSupervisor && selectedDuty && (
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (!password || isLoading) && styles.loginButtonDisabled
                      ]}
                      onPress={handleLogin}
                      disabled={!password || isLoading}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* SSO Options */}
              {renderSSOOptions()}

              {/* Info */}
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {quickLoginMode 
                    ? 'Enter your badge number and password for quick access'
                    : 'Select your name, duty, and enter your password to access supervisor controls'
                  }
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Setup Modal */}
      {selectedSupervisor && (
        <PasswordSetupModal
          visible={needsPasswordSetup}
          supervisorName={selectedSupervisor.name}
          onSetPassword={handlePasswordSetup}
          onCancel={() => {
            setSelectedSupervisor(null);
            setSelectedDuty(null);
            setPassword('');
            setBadgeNumber('');
          }}
        />
      )}

      {/* Login Analytics Modal (Admin Only) */}
      {showLoginAnalytics && supervisorSession?.isAdmin && (
        <LoginAnalyticsModal 
          visible={showLoginAnalytics}
          onClose={() => setShowLoginAnalytics(false)}
        />
      )}
    </>
  );
};

// Separate component for login analytics (admin only)
const LoginAnalyticsModal = ({ visible, onClose }) => {
  const { loginHistory = [] } = useConvexSync();
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.analyticsModal}>
        <View style={styles.analyticsContent}>
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsTitle}>Login Analytics</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.analyticsScroll}>
            <Text style={styles.analyticsSubtitle}>Recent Login Attempts</Text>
            {loginHistory && loginHistory.length > 0 ? (
              loginHistory.map((attempt, index) => (
              <View key={index} style={styles.analyticsRow}>
                <View style={styles.analyticsInfo}>
                  <Text style={styles.analyticsName}>{attempt.supervisorName}</Text>
                  <Text style={styles.analyticsTime}>
                    {new Date(attempt.timestamp).toLocaleString('en-GB')}
                  </Text>
                </View>
                <View style={[
                  styles.analyticsStatus,
                  { backgroundColor: attempt.success ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  <Text style={[
                    styles.analyticsStatusText,
                    { color: attempt.success ? '#065F46' : '#991B1B' }
                  ]}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </Text>
                </View>
              </View>
              ))
            ) : (
              <Text style={styles.analyticsEmpty}>No login history available</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1001,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 700,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  quickLoginToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  quickLoginToggleText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  quickLoginSection: {
    marginBottom: 24,
  },
  quickLoginForm: {
    gap: 12,
  },
  badgeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginLeft: 12,
  },
  badgeInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    letterSpacing: 1,
  },
  quickLoginInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  quickLoginName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  quickLoginButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchModeButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchModeText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  recentSection: {
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  recentList: {
    gap: 4,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  recentName: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  recentTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  shortcutHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  supervisorList: {
    maxHeight: 280,
  },
  supervisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  supervisorCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supervisorAvatar: {
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  numberBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  supervisorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  badgeNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  supervisorRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  dutyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dutyCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  dutyCardSelected: {
    backgroundColor: '#EFF6FF',
  },
  dutyColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  dutyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    marginTop: 4,
  },
  dutyNameSelected: {
    color: '#1E40AF',
  },
  dutyShift: {
    fontSize: 12,
    color: '#6B7280',
  },
  dutyShiftSelected: {
    color: '#3B82F6',
  },
  dutyCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  passwordContainer: {
    gap: 12,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 12,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151',
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ssoSection: {
    marginVertical: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 12,
  },
  ssoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  ssoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  ssoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  microsoftButton: {
    backgroundColor: '#0078D4',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  ssoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ssoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  analyticsModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  analyticsContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '70%',
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  analyticsScroll: {
    maxHeight: 400,
  },
  analyticsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  analyticsInfo: {
    flex: 1,
  },
  analyticsName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  analyticsTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  analyticsStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  analyticsEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default SupervisorLogin;