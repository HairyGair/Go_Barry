import React from 'react';
import { View, Image, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { supervisorName, logout } = useSupervisor();
  
  const isOperationsCentre = pathname === '/operations-centre' || pathname === '/operations';
  const isHomePage = pathname === '/' || pathname === '/index';
  const isCommunicationsHub = pathname === '/communications-hub';
  const isVoIPPage = pathname === '/voip';
  
  const handleLogout = async () => {
    await logout();
    router.replace('/');
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
      isOperationsCentre && styles.operationsHeader,
      isHomePage && styles.homeHeader,
      isCommunicationsHub && styles.communicationsHeader,
      isVoIPPage && styles.voipHeader
    ]}>
      <View style={styles.leftSection}>
        <Image 
          source={require('../../assets/gobarry-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {isOperationsCentre && (
          <View style={styles.operationsInfo}>
            <Text style={styles.operationsTitle}>Operations Centre</Text>
            <Text style={styles.operationsSubtitle}>Daily Operational Tools</Text>
          </View>
        )}
        {isHomePage && (
          <View style={styles.homeInfo}>
            <Text style={styles.homeTitle}>Go BARRY</Text>
            <Text style={styles.homeSubtitle}>Bus Alerts & Roadworks Reporting for You</Text>
          </View>
        )}
        {isCommunicationsHub && (
          <View style={styles.communicationsInfo}>
            <Text style={styles.communicationsTitle}>Communications Hub</Text>
            <Text style={styles.communicationsSubtitle}>Unified messaging and communication center</Text>
          </View>
        )}
        {isVoIPPage && (
          <View style={styles.voipInfo}>
            <Text style={styles.voipTitle}>8x8 VoIP System</Text>
            <Text style={styles.voipSubtitle}>Phone system with quick dial</Text>
          </View>
        )}
      </View>
      
      {isOperationsCentre && (
        <View style={styles.rightSection}>
          <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backText}>Home</Text>
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
      
      {isCommunicationsHub && (
        <View style={styles.rightSection}>
          <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backText}>Home</Text>
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
      
      {isVoIPPage && (
        <View style={styles.rightSection}>
          <Pressable onPress={() => router.replace('/communications-hub')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backText}>Communications</Text>
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
            <View style={styles.quickLinks}>
              <Pressable style={styles.quickLink}>
                <MaterialCommunityIcons name="phone" size={18} color="#64748b" />
                <Text style={styles.quickLinkText}>Support</Text>
              </Pressable>
              <Pressable style={styles.quickLink}>
                <MaterialCommunityIcons name="information" size={18} color="#64748b" />
                <Text style={styles.quickLinkText}>About</Text>
              </Pressable>
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
  operationsHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 10 : 10,
    paddingBottom: 10,
    height: 70,
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
  communicationsHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 10 : 10,
    paddingBottom: 10,
    height: 70,
  },
  voipHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 10 : 10,
    paddingBottom: 10,
    height: 70,
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
    height: 40,
    width: 120,
  },
  operationsInfo: {
    marginLeft: 16,
  },
  operationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  operationsSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
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
  quickLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  quickLinkText: {
    fontSize: 14,
    color: '#64748b',
  },
  communicationsInfo: {
    marginLeft: 16,
  },
  communicationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  communicationsSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  voipInfo: {
    marginLeft: 16,
  },
  voipTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  voipSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
});

export default AppHeader;