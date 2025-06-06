// Go_BARRY/app/(tabs)/about.jsx
// Clean version with no external icon dependencies
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native';

export default function AboutScreen() {
  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚦 BARRY</Text>
        <Text style={styles.subtitle}>Bus Alerts and Roadworks Reporting for You</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What is BARRY?</Text>
        <Text style={styles.description}>
          BARRY is a comprehensive traffic intelligence platform designed specifically for Go North East 
          bus operations. It provides real-time monitoring of roadworks, traffic incidents, and route 
          disruptions across the North East region of England.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🚨</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Real-time Alerts</Text>
            <Text style={styles.featureDescription}>
              Live traffic incidents, roadworks, and disruptions affecting your routes
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📍</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Route Impact Analysis</Text>
            <Text style={styles.featureDescription}>
              Automatically identifies which Go North East routes are affected
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🔄</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Multi-source Intelligence</Text>
            <Text style={styles.featureDescription}>
              Combines data from National Highways, Street Manager, and traffic APIs
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🌍</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>North East Focus</Text>
            <Text style={styles.featureDescription}>
              Specifically filtered for Newcastle, Sunderland, Durham, and surrounding areas
            </Text>
          </View>
        </View>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        
        <View style={styles.sourceCard}>
          <Text style={styles.sourceName}>🛣️ National Highways</Text>
          <Text style={styles.sourceDescription}>
            Official data for major road incidents, planned closures, and motorway disruptions
          </Text>
        </View>

        <View style={styles.sourceCard}>
          <Text style={styles.sourceName}>🚧 Street Manager</Text>
          <Text style={styles.sourceDescription}>
            Local authority roadworks, utility works, and street-level disruptions
          </Text>
        </View>

        <View style={styles.sourceCard}>
          <Text style={styles.sourceName}>📡 HERE Traffic API</Text>
          <Text style={styles.sourceDescription}>
            Real-time traffic flow, congestion analysis, and incident detection
          </Text>
        </View>

        <View style={styles.sourceCard}>
          <Text style={styles.sourceName}>🗺️ MapQuest Traffic</Text>
          <Text style={styles.sourceDescription}>
            Detailed incident descriptions and construction event information
          </Text>
        </View>
      </View>

      {/* Technical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Details</Text>
        
        <View style={styles.techCard}>
          <Text style={styles.techLabel}>Frontend:</Text>
          <Text style={styles.techValue}>React Native with Expo</Text>
        </View>

        <View style={styles.techCard}>
          <Text style={styles.techLabel}>Backend:</Text>
          <Text style={styles.techValue}>Node.js with Express</Text>
        </View>

        <View style={styles.techCard}>
          <Text style={styles.techLabel}>Data Processing:</Text>
          <Text style={styles.techValue}>Real-time API integration</Text>
        </View>

        <View style={styles.techCard}>
          <Text style={styles.techLabel}>Update Frequency:</Text>
          <Text style={styles.techValue}>5-minute cache with manual refresh</Text>
        </View>

        <View style={styles.techCard}>
          <Text style={styles.techLabel}>Coverage Area:</Text>
          <Text style={styles.techValue}>North East England (Tyne and Wear, Durham, Northumberland)</Text>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Support</Text>
        
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleLinkPress('mailto:support@gonortheast.co.uk')}
        >
          <Text style={styles.contactIcon}>📧</Text>
          <Text style={styles.contactText}>support@gonortheast.co.uk</Text>
          <Text style={styles.contactArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleLinkPress('https://www.gonortheast.co.uk')}
        >
          <Text style={styles.contactIcon}>🌐</Text>
          <Text style={styles.contactText}>www.gonortheast.co.uk</Text>
          <Text style={styles.contactArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>📊 Data Sources</Text>
          <Text style={styles.legalText}>
            Traffic data is provided by third-party APIs and may not always be complete or accurate. 
            Go North East is not responsible for the accuracy of external data sources.
          </Text>
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>⚠️ Usage</Text>
          <Text style={styles.legalText}>
            This application is intended for internal Go North East operations staff. 
            Data should not be relied upon for safety-critical decisions without verification.
          </Text>
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>🔒 Privacy</Text>
          <Text style={styles.legalText}>
            No personal data is collected or stored by this application. All traffic data is 
            sourced from public APIs and external services.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 Go North East. Built for operational excellence.
        </Text>
        <Text style={styles.footerSubtext}>
          BARRY v1.0.0 - Traffic Intelligence Platform
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  sourceCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sourceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  techCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  techLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  techValue: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  contactArrow: {
    color: '#60A5FA',
    fontSize: 16,
  },
  legalCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  legalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  legalText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});