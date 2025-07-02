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
            <Icon name={feature.icon} size={14} color="#06B6D4" />
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
  // Main card container with glass-morphism effect
  appCard: {
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent background
    borderRadius: 24,                   // Large rounded corners for modern look
    padding: 40,                        // Generous internal padding
    width: Platform.OS === 'web' ? 400 : '100%', // Responsive width
    maxWidth: 400,                      // Maximum width constraint
    borderWidth: 1,                     // Subtle border
    borderColor: 'rgba(255,255,255,0.2)', // Translucent border for depth
  },
  // Disabled state with reduced opacity
  disabledCard: {
    opacity: 0.7,                       // Visual indication of disabled state
  },
  // App icon container with rounded corners
  appIcon: {
    width: 80,                          // Fixed icon container size
    height: 80,
    borderRadius: 20,                   // Rounded rectangle shape
    alignItems: 'center',               // Center icon horizontally
    justifyContent: 'center',           // Center icon vertically
    marginBottom: 24,                   // Space below icon
  },
  // App title with bold typography
  appTitle: {
    fontSize: 24,                       // Large, prominent title size
    fontWeight: '700',                  // Bold weight for hierarchy
    color: '#fff',                      // High contrast white text
    marginBottom: 16,                   // Space below title
  },
  // App description with comfortable reading
  appDescription: {
    fontSize: 16,                       // Readable body text size
    color: '#d1d5db',                   // Dimmed white for hierarchy
    lineHeight: 24,                     // Generous line height for readability
    marginBottom: 32,                   // Space below description
  },
  // Features list container
  appFeatures: {
    marginBottom: 32,                   // Space below features list
  },
  // Individual feature item layout
  featureItem: {
    flexDirection: 'row',               // Horizontal layout (icon + text)
    alignItems: 'center',               // Vertically center icon and text
    gap: 12,                            // Space between icon and text
    marginBottom: 8,                    // Space between feature items
  },
  // Feature description text
  featureText: {
    fontSize: 14,                       // Smaller text for features
    color: '#9ca3af',                   // Muted color for supporting info
  },
  // Action button with icon and text
  appButton: {
    flexDirection: 'row',               // Horizontal layout (icon + text)
    alignItems: 'center',               // Vertically center content
    justifyContent: 'center',           // Horizontally center content
    gap: 8,                             // Space between icon and text
    backgroundColor: '#3b82f6',         // Go BARRY primary blue
    padding: 16,                        // Comfortable button padding
    borderRadius: 12,                   // Rounded button corners
  },
  // Disabled button state
  disabledButton: {
    backgroundColor: '#6b7280',         // Grayed out background for disabled
  },
  // Button text styling
  appButtonText: {
    color: '#fff',                      // High contrast white text
    fontSize: 16,                       // Clear, readable button text
    fontWeight: '600',                  // Semi-bold for emphasis
  },
});

export default AppCard;
