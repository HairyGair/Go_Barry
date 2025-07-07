/*
 * Go Barry - 8x8 VoIP Integration
 * External link integration for 8x8 (opens in new tab)
 * Matches pattern used for Horizon VIX and Blink
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VoIPIntegrationEnhanced = ({ onClose }) => {
  const handleOpen8x8 = () => {
    if (Platform.OS === 'web') {
      window.open('https://apps.8x8.com/', '_blank');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Ionicons name="call" size={24} color="#7C3AED" />
          <Text style={styles.headerTitle}>8x8 VoIP System</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="call" size={80} color="#7C3AED" />
          </View>
          
          <Text style={styles.title}>8x8 VoIP System</Text>
          <Text style={styles.subtitle}>Professional phone system with quick dial</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Make and receive calls</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Access call history</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Emergency numbers</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Voicemail access</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.openButton}
            onPress={handleOpen8x8}
          >
            <Ionicons name="open-outline" size={24} color="#fff" />
            <Text style={styles.openButtonText}>Open 8x8 System</Text>
          </TouchableOpacity>
          
          <Text style={styles.infoText}>Opens a new tab</Text>
        </View>

        {/* Quick Dial Section */}
        <View style={styles.quickDialSection}>
          <Text style={styles.sectionTitle}>Quick Dial Numbers</Text>
          
          <View style={styles.emergencySection}>
            <Text style={styles.emergencyTitle}>Emergency</Text>
            <View style={styles.numberGrid}>
              <TouchableOpacity style={[styles.numberButton, styles.emergencyButton]}>
                <Text style={styles.emergencyNumber}>999</Text>
                <Text style={styles.numberLabel}>Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.numberButton, styles.emergencyButton]}>
                <Text style={styles.emergencyNumber}>112</Text>
                <Text style={styles.numberLabel}>EU Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.numberButton, styles.emergencyButton]}>
                <Text style={styles.emergencyNumber}>101</Text>
                <Text style={styles.numberLabel}>Police Non-Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.internalSection}>
            <Text style={styles.internalTitle}>Internal Numbers</Text>
            <View style={styles.numberGrid}>
              <TouchableOpacity style={styles.numberButton}>
                <Ionicons name="business" size={20} color="#7C3AED" />
                <Text style={styles.numberText}>Control Room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.numberButton}>
                <Ionicons name="people" size={20} color="#7C3AED" />
                <Text style={styles.numberText}>Operations Manager</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.numberButton}>
                <Ionicons name="construct" size={20} color="#7C3AED" />
                <Text style={styles.numberText}>IT Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Footer with instructions */}
      <View style={styles.footer}>
        <View style={styles.tipItem}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.tipText}>Use your 8x8 credentials to log in</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="headset" size={16} color="#666" />
          <Text style={styles.tipText}>Headset recommended for calls</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickDialSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  emergencySection: {
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
  },
  internalSection: {
    marginBottom: 0,
  },
  internalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  numberButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  emergencyButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  numberLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  numberText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default VoIPIntegrationEnhanced;
