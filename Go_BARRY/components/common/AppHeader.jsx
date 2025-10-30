import React, { useState } from 'react';
import { View, Image, Text, Pressable, StyleSheet, Platform, TextInput } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const AppHeader = ({ onLoginSuccess }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { supervisorName, logout, login, isLoading, isLoggedIn } = useSupervisor();
  
  // Login form state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDuty, setSelectedDuty] = useState('');
  const [loginError, setLoginError] = useState('');

  // Supervisor options for the login form
  const SUPERVISOR_OPTIONS = [
    { badge: 'AG001', name: 'Anthony Gair', isAdmin: true },
    { badge: 'BP001', name: 'Barry Perryman', isAdmin: true },
    { badge: 'AW001', name: 'Alex Woodcock' },
    { badge: 'AC001', name: 'Andrew Cowley' },
    { badge: 'CF001', name: 'Claire Fiddler' },
    { badge: 'DH001', name: 'David Hall' },
    { badge: 'JD001', name: 'James Daglish' },
    { badge: 'JP001', name: 'John Paterson' },
    { badge: 'SG001', name: 'Simon Glass' },
  ];
  
  // Duty options
  const DUTY_OPTIONS = [
    { id: '100', name: 'Duty 100 (6am-3:30pm)', shift: 'Early' },
    { id: '200', name: 'Duty 200 (7:30am-5pm)', shift: 'Day' },
    { id: '400', name: 'Duty 400 (12:30pm-10pm)', shift: 'Late' },
    { id: '500', name: 'Duty 500 (2:45pm-12:15am)', shift: 'Night' },
    { id: 'xops', name: 'XOps', shift: 'Operations' },
  ];
  
  const isOperationsCentre = pathname === '/operations-centre' || pathname === '/operations';
  const isHomePage = pathname === '/' || pathname === '/index';
  const isCommunicationsHub = pathname === '/communications-hub';
  const isVoIPPage = pathname === '/voip';
  const isDisruptionsPage = pathname === '/disruptions' || pathname.startsWith('/disruptions/') || pathname === '/disruption-centre' || pathname.startsWith('/disruption-centre/');
  
  const handleLogout = async () => {
    await logout();
    // Use setTimeout to ensure navigation happens after logout state update
    setTimeout(() => {
      router.replace('/');
    }, 0);
  };

  const handleLogin = async () => {
    if (!selectedSupervisor || !password || !selectedDuty) {
      setLoginError('Please select supervisor, duty and enter password');
      return;
    }

    setLoginError('');

    // Create login data object as expected by the hook
    const loginData = {
      badge: selectedSupervisor,
      password: password,
      duty: selectedDuty,
      rememberMe: false
    };
    
    const result = await login(loginData);
    
    if (!result.success) {
      setLoginError(result.error || 'Login failed');
    } else {
      // Clear form and hide login
      setSelectedSupervisor('');
      setPassword('');
      setSelectedDuty('');
      setShowLoginForm(false);
      setLoginError('');
      
      // Login successful - the context should update automatically
      console.log('✅ Login successful, context should update');
      
      // Call callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };
  
  // Get current time and system status
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [systemStatus, setSystemStatus] = React.useState('checking');
  
  React.useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Check actual system status
  React.useEffect(() => {
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

  return (
    <View style={[
      styles.header, 
      (isOperationsCentre || isCommunicationsHub || isVoIPPage || isDisruptionsPage) && styles.appHeader,
      isHomePage && styles.homeHeader
    ]}>
      <View style={styles.leftSection}>
        <Image 
          source={require('../../assets/gobarry-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {isHomePage && (
          <View style={styles.homeInfo}>
            <Text style={styles.homeTitle}>Go BARRY</Text>
            <Text style={styles.homeSubtitle}>Bus Alerts & Roadworks Reporting for You</Text>
          </View>
        )}
      </View>
      
      {(isOperationsCentre || isCommunicationsHub || isDisruptionsPage || isVoIPPage) && supervisorName && (
        <View style={styles.rightSection}>
          <Pressable onPress={() => setTimeout(() => router.replace(isVoIPPage ? '/communications-hub' : '/'), 0)} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backText}>{isVoIPPage ? 'Communications' : 'Home'}</Text>
          </Pressable>
          
          <View style={styles.userInfo}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
            <Text style={styles.userName}>{supervisorName}</Text>
          </View>
          
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      )}
      
      {isHomePage && (
        <View style={styles.rightSection}>
          {/* Date & Time */}
          <View style={styles.dateTimeSection}>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString('en-GB', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </Text>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          
          {/* System Status */}
          <View style={styles.statusSection}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: systemStatus === 'operational' ? '#10b981' : 
                systemStatus === 'issues' ? '#ef4444' : '#f59e0b' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: systemStatus === 'operational' ? '#10b981' : 
                systemStatus === 'issues' ? '#ef4444' : '#f59e0b' }
            ]}>
              {systemStatus === 'operational' ? 'Systems Operational' :
               systemStatus === 'issues' ? 'System Issues' : 'Checking Status...'}
            </Text>
          </View>
          
          {/* User Info or Quick Links */}
          {supervisorName ? (
            <View style={styles.homeUserSection}>
              <View style={styles.userInfo}>
                <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
                <Text style={styles.userName}>{supervisorName}</Text>
              </View>
              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.loginSection}>
              {!showLoginForm ? (
                <Pressable 
                  style={styles.loginButton}
                  onPress={() => setShowLoginForm(true)}
                >
                  <MaterialCommunityIcons name="login" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Supervisor Login</Text>
                </Pressable>
              ) : (
                <View style={styles.headerLoginForm}>
                  <View style={styles.loginFormGroup}>
                    <Text style={styles.loginLabel}>Supervisor</Text>
                    {Platform.OS === 'web' ? (
                      <select
                        style={styles.headerSelect}
                        value={selectedSupervisor}
                        onChange={(e) => setSelectedSupervisor(e.target.value)}
                      >
                        <option value="">Select Supervisor</option>
                        {SUPERVISOR_OPTIONS.map(supervisor => (
                          <option key={supervisor.badge} value={supervisor.badge}>
                            {supervisor.name} ({supervisor.badge})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <TextInput
                        style={styles.headerInput}
                        placeholder="Supervisor ID"
                        value={selectedSupervisor}
                        onChangeText={setSelectedSupervisor}
                      />
                    )}
                  </View>
                  
                  <View style={styles.loginFormGroup}>
                    <Text style={styles.loginLabel}>Password</Text>
                    <TextInput
                      style={styles.headerInput}
                      placeholder="Password"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      onSubmitEditing={handleLogin}
                    />
                  </View>
                  
                  <View style={styles.loginFormGroup}>
                    <Text style={styles.loginLabel}>Duty</Text>
                    {Platform.OS === 'web' ? (
                      <select
                        style={styles.headerSelect}
                        value={selectedDuty}
                        onChange={(e) => setSelectedDuty(e.target.value)}
                      >
                        <option value="">Select Duty</option>
                        {DUTY_OPTIONS.map(duty => (
                          <option key={duty.id} value={duty.id}>
                            {duty.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <TextInput
                        style={styles.headerInput}
                        placeholder="Duty"
                        value={selectedDuty}
                        onChangeText={setSelectedDuty}
                      />
                    )}
                  </View>
                  
                  <View style={styles.loginActions}>
                    <Pressable 
                      style={styles.loginActionButton}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <MaterialCommunityIcons 
                        name={isLoading ? "loading" : "check"} 
                        size={16} 
                        color="#fff" 
                      />
                      <Text style={styles.loginActionText}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Text>
                    </Pressable>
                    
                    <Pressable 
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowLoginForm(false);
                        setLoginError('');
                        setSelectedSupervisor('');
                        setPassword('');
                        setSelectedDuty('');
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#94a3b8" />
                    </Pressable>
                  </View>
                  
                  {loginError ? (
                    <Text style={styles.loginError}>{loginError}</Text>
                  ) : null}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
    }),
  },
  appHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 8 : 8,
    paddingBottom: 8,
    height: 50,
  },
  homeHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 10 : 10,
    paddingBottom: 10,
    height: 80,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    height: 32,
    width: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backText: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  homeInfo: {
    marginLeft: 16,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  homeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  dateTimeSection: {
    alignItems: 'flex-end',
    marginRight: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#10b981',
  },
  homeUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerLoginForm: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 600,
  },
  loginFormGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  loginLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSelect: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 160,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineStyle: 'none',
      },
    }),
  },
  headerInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  loginActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loginActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loginError: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    fontSize: 11,
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});

export default AppHeader;