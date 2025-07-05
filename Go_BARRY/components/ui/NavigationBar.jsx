// Enhanced Navigation Bar Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const NavigationBar = ({ 
  title, 
  subtitle, 
  showBack = true, 
  actions = [],
  breadcrumbs = []
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { supervisorSession } = useSupervisorSession();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Quick action items
  const quickActions = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid',
      route: '/browser-main-optimized',
      color: '#10B981',
    },
    {
      id: 'alerts',
      label: 'Active Alerts',
      icon: 'warning',
      route: '/display',
      color: '#EF4444',
    },
    {
      id: 'create-incident',
      label: 'Report Incident',
      icon: 'add-circle',
      route: '/incident/new',
      color: '#F59E0B',
      requiresAuth: true,
    },
    {
      id: 'roadworks',
      label: 'Roadworks',
      icon: 'construct',
      route: '/roadworks',
      color: '#8B5CF6',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-circle',
      route: '/help',
      color: '#3B82F6',
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showQuickActions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showQuickActions]);

  const handleQuickAction = (action) => {
    if (action.requiresAuth && !supervisorSession) {
      alert('Please log in to access this feature');
      return;
    }
    
    setShowQuickActions(false);
    router.push(action.route);
  };

  const isWeb = Platform.OS === 'web';

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topBar}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {showBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            {/* Logo */}
            <TouchableOpacity
              style={styles.logo}
              onPress={() => router.push('/')}
            >
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>GB</Text>
              </View>
              <Text style={styles.brandText}>Go BARRY</Text>
            </TouchableOpacity>
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Right Section - Actions */}
          <View style={styles.rightSection}>
            {/* Custom Actions */}
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon} size={20} color="#fff" />
                {action.label && (
                  <Text style={styles.actionLabel}>{action.label}</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Quick Actions Menu */}
            <TouchableOpacity
              style={[styles.quickActionsButton, showQuickActions && styles.quickActionsButtonActive]}
              onPress={() => setShowQuickActions(!showQuickActions)}
            >
              <Ionicons name="apps" size={24} color="#fff" />
              <Text style={styles.quickActionsLabel}>Quick Actions</Text>
            </TouchableOpacity>

            {/* User Info */}
            {supervisorSession && (
              <View style={styles.userInfo}>
                <Ionicons name="person-circle" size={24} color="#10B981" />
                <Text style={styles.userName}>{supervisorSession.supervisor.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <View style={styles.breadcrumbs}>
            <Ionicons name="home" size={14} color="#94A3B8" />
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                {crumb.route ? (
                  <TouchableOpacity onPress={() => router.push(crumb.route)}>
                    <Text style={[styles.breadcrumbText, styles.breadcrumbLink]}>
                      {crumb.label}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.breadcrumbText}>{crumb.label}</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions Dropdown */}
      {showQuickActions && (
        <Animated.View
          style={[
            styles.quickActionsDropdown,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Help Text */}
          <View style={styles.quickActionsHelp}>
            <Ionicons name="information-circle" size={16} color="#64748B" />
            <Text style={styles.quickActionsHelpText}>
              Access frequently used features quickly from any screen
            </Text>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  brandText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  quickActionsButtonActive: {
    backgroundColor: '#2563EB',
  },
  quickActionsLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    gap: 8,
  },
  breadcrumbText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  breadcrumbLink: {
    color: '#60A5FA',
    textDecorationLine: 'underline',
  },
  quickActionsDropdown: {
    position: 'absolute',
    top: 64,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 320,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 90,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    textAlign: 'center',
  },
  quickActionsHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  quickActionsHelpText: {
    color: '#64748B',
    fontSize: 12,
    flex: 1,
  },
});

export default NavigationBar;