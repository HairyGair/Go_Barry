/**
 * Go Barry - Traffic Intelligence Platform
 * AppCard - Reusable Homepage Application Card Component
 * 
 * A standardized card component for the Go BARRY homepage that provides:
 * - Consistent visual design across all application cards
 * - Full accessibility support (WCAG 2.1 AA compliant)
 * - Keyboard navigation and screen reader compatibility
 * - Responsive design for web and mobile platforms
 * - Touch feedback and visual states
 * 
 * Features:
 * - Icon with customizable background color
 * - Title and description text
 * - Feature list with icons
 * - Action button with custom text
 * - Accessibility labels and hints
 * - Test ID support for automated testing
 * - Disabled state support
 * 
 * Usage Example:
 * ```jsx
 * <AppCard
 *   icon={<MaterialCommunityIcons name="traffic-cone" size={36} color="#fff" />}
 *   title="Disruptions"
 *   description="Manage network disruptions and incidents"
 *   features={[
 *     { icon: 'exclamation-triangle', text: 'Create incidents' },
 *     { icon: 'road', text: 'Manage roadworks' }
 *   ]}
 *   buttonText="Manage Disruptions"
 *   onPress={() => router.push('/disruptions')}
 *   accessibilityLabel="Open Disruptions Management"
 *   iconBackgroundColor="#FF9800"
 *   testID="disruptions-card"
 * />
 * ```
 * 
 * @author Anthony Gair
 * @since July 2025
 * @version 1.0.0
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

/**
 * AppCard Component Props
 * 
 * @param {ReactElement} icon - Icon component (from @expo/vector-icons or react-native-vector-icons)
 * @param {string} title - Card title text displayed prominently
 * @param {string} description - Detailed description of the application/feature
 * @param {Array<{icon: string, text: string}>} features - List of key features with FontAwesome5 icon names
 * @param {string} buttonText - Text displayed on the action button
 * @param {Function} onPress - Callback function executed when card is pressed
 * @param {string} accessibilityLabel - Accessibility label for screen readers
 * @param {string} iconBackgroundColor - Background color for the icon container (default: '#3b82f6')
 * @param {boolean} disabled - Whether the card is disabled (default: false)
 * @param {string} testID - Test identifier for automated testing
 */
const AppCard = ({
  icon,
  title,
  description,
  features = [],
  buttonText,
  onPress,
  accessibilityLabel,
  iconBackgroundColor = '#3b82f6',
  disabled = false,
  testID,
}) => {
  return (
    // Main card container with touch feedback and comprehensive accessibility
    <TouchableOpacity
      style={[styles.appCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to open this application"
      testID={testID}
    >
      {/* App icon with customizable background color */}
      <View style={[styles.appIcon, { backgroundColor: iconBackgroundColor }]}>
        {icon}
      </View>
      
      {/* Main title - prominently displayed */}
      <Text style={styles.appTitle}>{title}</Text>
      
      {/* Descriptive text explaining the application */}
      <Text style={styles.appDescription}>{description}</Text>
      
      {/* Feature list with icons - highlights key capabilities */}
      <View style={styles.appFeatures}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name={feature.icon} size={14} color="#3b82f6" />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
      
      {/* Action button with state-aware icon */}
      <View style={[styles.appButton, disabled && styles.disabledButton]}>
        <Icon 
          name={disabled ? "lock" : "external-link-alt"} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.appButtonText}>{buttonText}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * StyleSheet for AppCard Component
 * 
 * Provides consistent styling across all homepage cards with:
 * - Responsive design for different screen sizes
 * - High contrast colors for accessibility
 * - Professional Go BARRY visual design
 * - Glass-morphism effect with backdrop blur
 * - Touch feedback optimizations
 * 
 * Design System:
 * - Primary Background: rgba(0,0,0,0.6) with transparency
 * - Border: rgba(255,255,255,0.2) for subtle definition
 * - Accent Color: #3b82f6 (Go BARRY blue)
 * - Feature Icons: #06B6D4 (cyan for feature highlights)
 * - Text Hierarchy: #fff (primary), #d1d5db (secondary), #9ca3af (tertiary)
 */
const styles = StyleSheet.create({
  // Main card container with modern design
  appCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%',
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  // Disabled state with reduced opacity
  disabledCard: {
    opacity: 0.7,                       // Visual indication of disabled state
  },
  // App icon container with rounded corners
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // App title with bold typography
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  // App description with comfortable reading
  appDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  // Features list container
  appFeatures: {
    marginBottom: 20,
  },
  // Individual feature item layout
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  // Feature description text
  featureText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  // Action button with icon and text
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  // Disabled button state
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  // Button text styling
  appButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AppCard;
