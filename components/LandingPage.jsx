// Enhanced Landing Page with Better Navigation & CTAs
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from './ui/LinearGradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const LandingPage = () => {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState('checking');
  const [hoveredCard, setHoveredCard] = useState(null);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Check system status
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/health');
      setSystemStatus(response.ok ? 'operational' : 'issues');
    } catch (error) {
      setSystemStatus('offline');
    }
  };

  const applications = [
    {
      id: 'control-room',
      title: 'Control Room Display',
      subtitle: '24/7 Traffic Monitoring',
      description: 'Real-time traffic intelligence for control room operations',
      icon: 'tv',
      color: '#E31E24',
      route: '/display',
      features: [
        'Live traffic alerts with auto-refresh',
        'Interactive traffic map visualization',
        'Fullscreen optimized display',
        'Read-only monitoring mode',
      ],
      primaryAction: 'Open Control Room',
      secondaryAction: 'View Demo',
      recommended: false,
    },
    {
      id: 'supervisor',
      title: 'Supervisor Dashboard',
      subtitle: 'Interactive Management',
      description: 'Complete toolkit for traffic supervisors and coordinators',
      icon: 'shield-checkmark',
      color: '#3B82F6',
      route: '/browser-main',
      features: [
        'Alert management & dismissal',
        'Team coordination tools',
        'Incident reporting system',
        'Mobile responsive design',
      ],
      primaryAction: 'Access Dashboard',
      secondaryAction: 'Learn More',
      recommended: true,
    },
  ];

  const quickLinks = [
    { icon: 'document-text', label: 'Documentation', route: '/docs' },
    { icon: 'school', label: 'Training', route: '/training' },
    { icon: 'help-circle', label: 'Support', route: '/support' },
    { icon: 'stats-chart', label: 'System Status', route: '/status' },
  ];

  const renderStatusBadge = () => {
    const configs = {
      operational: { color: '#10B981', text: 'System Operational', icon: 'checkmark-circle' },
      issues: { color: '#F59E0B', text: 'Minor Issues', icon: 'warning' },
      offline: { color: '#EF4444', text: 'System Offline', icon: 'close-circle' },
      checking: { color: '#6B7280', text: 'Checking Status...', icon: 'sync' },
    };

    const config = configs[systemStatus];

    return (
      <View style={[styles.statusBadge, { borderColor: config.color }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
      </View>
    );
  };

  const ApplicationCard = ({ app, index }) => {
    const animatedScale = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(animatedScale, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.appCard,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: animatedScale },
            ],
          },
        ]}
        onMouseEnter={() => isWeb && setHoveredCard(app.id)}
        onMouseLeave={() => isWeb && setHoveredCard(null)}
      >
        {app.recommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => router.push(app.route)}
          style={styles.cardContent}
        >
          <View style={[styles.iconContainer, { backgroundColor: app.color }]}>
            <Ionicons name={app.icon} size={40} color="#fff" />
          </View>

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{app.title}</Text>
            <Text style={styles.cardSubtitle}>{app.subtitle}</Text>
          </View>

          <Text style={styles.cardDescription}>{app.description}</Text>

          <View style={styles.featuresContainer}>
            {app.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: app.color }]}
              onPress={() => router.push(app.route)}
            >
              <Text style={styles.primaryButtonText}>{app.primaryAction}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{app.secondaryAction}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isWeb && hoveredCard === app.id && (
          <View style={styles.hoverOverlay}>
            <Text style={styles.hoverText}>Click to launch</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>GB</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>Go BARRY</Text>
              <Text style={styles.brandSubtitle}>Traffic Intelligence Platform</Text>
            </View>
          </View>
          {renderStatusBadge()}
        </View>
      </View>

      {/* Hero Section */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.heroSection}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.heroTitle}>Welcome to Go BARRY</Text>
          <Text style={styles.heroSubtitle}>
            Real-time traffic intelligence for Go North East operations
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>231</Text>
              <Text style={styles.statLabel}>Bus Routes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Monitoring</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>9</Text>
              <Text style={styles.statLabel}>Supervisors</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Applications Grid */}
      <View style={styles.applicationsSection}>
        <Text style={styles.sectionTitle}>Choose Your Application</Text>
        <Text style={styles.sectionSubtitle}>
          Select the interface that matches your role and requirements
        </Text>

        <View style={styles.applicationsGrid}>
          {applications.map((app, index) => (
            <ApplicationCard key={app.id} app={app} index={index} />
          ))}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksSection}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickLinkItem}
              onPress={() => router.push(link.route)}
            >
              <Ionicons name={link.icon} size={24} color="#64748B" />
              <Text style={styles.quickLinkText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by Go BARRY | Traffic Intelligence for Go North East
        </Text>
        <Text style={styles.footerSubtext}>
          © 2025 Go North East. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#E31E24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  applicationsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
  },
  applicationsGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  appCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    width: width > 768 ? 400 : '100%',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  cardDescription: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  hoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  hoverText: {
    color: '#60A5FA',
    fontSize: 18,
    fontWeight: '600',
  },
  quickLinksSection: {
    padding: 24,
    backgroundColor: '#1E293B',
    marginTop: 40,
  },
  quickLinksTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    flexWrap: 'wrap',
  },
  quickLinkItem: {
    alignItems: 'center',
    gap: 8,
  },
  quickLinkText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 8,
  },
  footerSubtext: {
    color: '#475569',
    fontSize: 12,
  },
});

export default LandingPage;