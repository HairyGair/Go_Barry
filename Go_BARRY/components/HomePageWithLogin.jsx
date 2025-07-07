/*
 * Go Barry - Traffic Intelligence Platform
 * Home Page with Login Functionality
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor, DUTY_OPTIONS } from './hooks/useSupervisorSession';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppCard from './AppCard';
import { Picker } from '@react-native-picker/picker';
import AppHeader from './common/AppHeader';

// Supervisor database - matching the one in useSupervisorSession
const SUPERVISOR_OPTIONS = [
  { id: 'alex_woodcock', name: 'Alex Woodcock', badge: 'AW001' },
  { id: 'andrew_cowley', name: 'Andrew Cowley', badge: 'AC002' },
  { id: 'anthony_gair', name: 'Anthony Gair', badge: 'AG003', isAdmin: true },
  { id: 'claire_fiddler', name: 'Claire Fiddler', badge: 'CF004' },
  { id: 'david_hall', name: 'David Hall', badge: 'DH005' },
  { id: 'james_daglish', name: 'James Daglish', badge: 'JD006' },
  { id: 'john_paterson', name: 'John Paterson', badge: 'JP007' },
  { id: 'simon_glass', name: 'Simon Glass', badge: 'SG008' },
  { id: 'barry_perryman', name: 'Barry Perryman', badge: 'BP009', isAdmin: true },
];

const HomePageWithLogin = () => {
  const router = useRouter();
  const {
    isLoggedIn,
    login,
    logout,
    supervisorName,
    isAdmin,
    isLoading,
    error,
    needsPasswordSetup,
    setPassword
  } = useSupervisor();

  const [showLogin, setShowLogin] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedDuty, setSelectedDuty] = useState('');
  const [password, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [systemStatus, setSystemStatus] = useState('checking');

  // Check system status
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('https://go-barry.onrender.com/api/health');
        setSystemStatus(response.ok ? 'operational' : 'issues');
      } catch (error) {
        setSystemStatus('offline');
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear errors when form changes
  useEffect(() => {
    setLoginError('');
  }, [selectedSupervisor, selectedDuty, password]);

  const handleLogin = async () => {
    if (!selectedSupervisor || !selectedDuty || !password) {
      setLoginError('Please fill in all fields');
      return;
    }

    const result = await login({
      supervisorId: selectedSupervisor,
      duty: selectedDuty,
      password: password,
      rememberMe: rememberMe
    });

    if (!result.success && !result.needsPasswordSetup) {
      setLoginError(result.error || 'Login failed');
    } else {
      // Clear form on successful login
      setSelectedSupervisor('');
      setSelectedDuty('');
      setPasswordInput('');
      setShowLogin(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setLoginError('Passwords do not match');
      return;
    }

    const result = await setPassword(newPassword);
    
    if (!result.success) {
      setLoginError(result.error || 'Failed to set password');
    } else {
      // Clear form on success
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const navigateToApp = (path) => {
    console.log(`[Navigation] Navigating to: ${path}`);
    router.push(path);
  };

  const renderLoginForm = () => {
    if (needsPasswordSetup) {
      return (
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Set Your Password</Text>
          <Text style={styles.helpText}>
            This is your first time logging in. Please set a password for your account.
          </Text>
          
          {loginError ? (
            <View style={styles.errorMessage}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>New Password</Text>
            <TextInput
              style={styles.formInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 6 chars)"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Confirm Password</Text>
            <TextInput
              style={styles.formInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleSetPassword}
            disabled={isLoading}
          >
            <Icon name="key" size={16} color="#fff" />
            <Text style={styles.loginBtnText}>Set Password</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Supervisor Login</Text>
        
        {loginError ? (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Supervisor</Text>
          <View style={styles.selectWrapper}>
            <TouchableOpacity
              style={styles.formSelect}
              onPress={() => {
                // In a real app, you'd show a picker here
                // For now, just cycle through options
                const currentIndex = SUPERVISOR_OPTIONS.findIndex(s => s.id === selectedSupervisor);
                const nextIndex = (currentIndex + 1) % SUPERVISOR_OPTIONS.length;
                setSelectedSupervisor(SUPERVISOR_OPTIONS[nextIndex].id);
              }}
            >
              <Text style={styles.selectText}>
                {selectedSupervisor ? 
                  SUPERVISOR_OPTIONS.find(s => s.id === selectedSupervisor)?.name + ' (' + 
                  SUPERVISOR_OPTIONS.find(s => s.id === selectedSupervisor)?.badge + ')' 
                  : 'Choose a supervisor...'}
              </Text>
              <Icon name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Duty</Text>
          <View style={styles.selectWrapper}>
            <TouchableOpacity
              style={styles.formSelect}
              onPress={() => {
                // Cycle through duty options
                const currentIndex = DUTY_OPTIONS.findIndex(d => d.id === selectedDuty);
                const nextIndex = (currentIndex + 1) % DUTY_OPTIONS.length;
                setSelectedDuty(DUTY_OPTIONS[nextIndex].id);
              }}
            >
              <Text style={styles.selectText}>
                {selectedDuty ? 
                  DUTY_OPTIONS.find(d => d.id === selectedDuty)?.name 
                  : 'Choose your duty...'}
              </Text>
              <Icon name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput
            style={styles.formInput}
            value={password}
            onChangeText={setPasswordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>
        
        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Icon name="check" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Remember me for 10 hours</Text>
        </View>
        
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="sign-in-alt" size={16} color="#fff" />
              <Text style={styles.loginBtnText}>Login</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Application cards configuration
  const appCards = [
    {
      id: 'control-room',
      icon: <Icon name="tv" size={36} color="#fff" />,
      title: 'Control Room Display',
      description: '24/7 traffic monitoring display designed for control room environments and large screens.',
      features: [
        { icon: 'eye', text: 'Real-time traffic alerts' },
        { icon: 'map', text: 'Live traffic map' }
      ],
      buttonText: 'Open Control Room',
      onPress: () => navigateToApp('/display'),
      accessibilityLabel: 'Control Room Display - 24/7 traffic monitoring for control room environments',
      iconBackgroundColor: '#E31E24',
      testID: 'control-room-card'
    },
    {
      id: 'communications',
      icon: <Icon name="comments" size={36} color="#fff" />,
      title: 'Communications Hub',
      description: 'Unified messaging center for email, phone, and ticketing systems with automated reports.',
      features: [
        { icon: 'envelope', text: 'Email & messaging' },
        { icon: 'phone', text: '8x8 VoIP integration' },
        { icon: 'file-alt', text: 'Automated reports' },
        { icon: 'folder-open', text: 'SharePoint access' }
      ],
      buttonText: isLoggedIn ? 'Access Communications' : 'Login Required',
      onPress: () => {
        if (!isLoggedIn) {
          setShowLogin(true);
        } else {
          navigateToApp('/communications-hub');
        }
      },
      accessibilityLabel: 'Communications Hub - Unified messaging center for all communication channels',
      iconBackgroundColor: '#8B5CF6',
      testID: 'communications-card'
    },
    {
      id: 'operations',
      icon: <Icon name="tools" size={36} color="#fff" />,
      title: 'Operations',
      description: 'Daily operational tools including duty boards, performance monitoring, and live traffic overview.',
      features: [
        { icon: 'clipboard-list', text: 'Duty boards' },
        { icon: 'chart-line', text: 'Performance statistics' },
        { icon: 'map', text: 'Live traffic map' },
        { icon: 'database', text: 'Disruption database' }
      ],
      buttonText: isLoggedIn ? 'Access Operations' : 'Login Required',
      onPress: () => {
        if (!isLoggedIn) {
          setShowLogin(true);
        } else {
          navigateToApp('/operations');
        }
      },
      accessibilityLabel: 'Operations - Daily operational tools including duty boards and incident management',
      iconBackgroundColor: '#059669',
      testID: 'operations-card'
    },
    {
      id: 'disruptions',
      icon: <Icon name="traffic-cone" size={36} color="#fff" />,
      title: 'Disruptions',
      description: 'Manage network disruptions, incidents, and roadworks in real-time with intelligent route matching.',
      features: [
        { icon: 'exclamation-triangle', text: 'Create and track incidents' },
        { icon: 'road', text: 'Manage roadworks and diversions' },
        { icon: 'route', text: 'Real-time GTFS route matching' },
        { icon: 'bell', text: 'Automated supervisor notifications' }
      ],
      buttonText: 'Manage Disruptions',
      onPress: () => {
        if (!isLoggedIn) {
          setShowLogin(true);
        } else {
          navigateToApp('/disruptions');
        }
      },
      accessibilityLabel: 'Open Disruptions Management - Create and manage network incidents and roadworks',
      iconBackgroundColor: '#FF9800',
      testID: 'disruptions-card'
    },
    {
      id: 'admin',
      icon: <Icon name="cog" size={36} color="#fff" />,
      title: 'Admin Dashboard',
      description: 'System administration tools for managing supervisors, monitoring health, and configuring settings.',
      features: [
        { icon: 'users-cog', text: 'Supervisor management' },
        { icon: 'chart-line', text: 'System monitoring' }
      ],
      buttonText: !isLoggedIn ? 'Admin Login Required' : 
                 isAdmin ? 'Open Admin Dashboard' : 'Admin Access Only',
      onPress: () => {
        if (!isLoggedIn) {
          setShowLogin(true);
        } else if (isAdmin) {
          navigateToApp('/admin');
        }
      },
      accessibilityLabel: 'Admin Dashboard - System administration tools for managing supervisors and monitoring',
      iconBackgroundColor: '#8b5cf6',
      disabled: !isAdmin,
      testID: 'admin-card'
    }
  ];

  const renderApps = () => {
    return (
      <View style={styles.appsGrid}>
        {appCards.map((card) => (
          <AppCard key={card.id} {...card} />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.scrollContent}>
        {/* Main Content */}
        <View style={styles.mainContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isLoggedIn ? `Welcome, ${supervisorName}` : 'Welcome to Go Barry'}
          </Text>
          <Text style={styles.welcomeDescription}>
            {isLoggedIn ? 
              'Select the application you want to access.' : 
              showLogin ?
              'Please log in with your supervisor credentials.' :
              'Select the application you want to access. Supervisor tools require authentication.'}
          </Text>
        </View>

        {/* Always show app options, with Control Room accessible without login */}
        {renderApps()}

        {/* Show login form when needed */}
        {!isLoggedIn && showLogin && (
          <View style={styles.loginSection}>
            {renderLoginForm()}
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  headerLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerLoginForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerInputGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  headerInputLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSelectWrapper: {
    position: 'relative',
  },
  headerSelect: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 140,
    cursor: 'pointer',
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineStyle: 'none',
      },
    }),
  },
  headerPasswordInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 120,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineStyle: 'none',
      },
    }),
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  headerLoginBtnDisabled: {
    opacity: 0.6,
  },
  headerLoginBtnText: {
    color: '#E31E24',
    fontWeight: '700',
    fontSize: 14,
  },
  headerLoginError: {
    color: '#ffe0e0',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  mainContent: {
    padding: 20,
    paddingTop: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#64748b',
    maxWidth: 600,
    textAlign: 'center',
    lineHeight: 24,
  },
  centerButton: {
    alignItems: 'center',
  },
  showLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  showLoginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginSection: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    marginTop: 32,
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  helpText: {
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  selectWrapper: {
    position: 'relative',
  },
  formSelect: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#1f2937',
    fontSize: 16,
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
});

export default HomePageWithLogin;
