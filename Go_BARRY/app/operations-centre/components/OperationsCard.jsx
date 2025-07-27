/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Card Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { Pressable, View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { operationsTheme } from '../../../lib/_styles-index.js';

export default function OperationsCard({ 
  id,
  title, 
  subtitle, 
  icon, 
  color, 
  stats,
  onPress,
  isLoading = false,
  textColor = "white", // Default to white text for backward compatibility
  timestamp = null
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const renderCardContent = () => (
    <>
      <View style={styles.cardContent}>
        {/* Horizontal layout with icon on left, content in center, stats on right */}
        <View style={styles.cardLayout}>
          <View style={styles.iconSection}>
            <MaterialCommunityIcons 
              name={icon} 
              size={48} 
              color={textColor} 
            />
          </View>
          
          <View style={styles.contentSection}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
            <Text style={[styles.cardSubtitle, { color: textColor }]}>{subtitle}</Text>
            {timestamp && (
              <Text style={[styles.timestamp, { color: textColor }]}>Updated {timestamp}</Text>
            )}
          </View>
          
          {stats && (
            <View style={styles.statsSection}>
              <Text style={[styles.statValue, { color: textColor }]}>{stats.value}</Text>
              <Text style={[styles.statLabel, { color: textColor }]}>{stats.label}</Text>
            </View>
          )}
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <MaterialCommunityIcons name="loading" size={32} color="white" />
        </View>
      )}
    </>
  );
  
  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.cardPressed
        ]}
      >
        {Array.isArray(color) ? (
          <LinearGradient
            colors={color}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderCardContent()}
          </LinearGradient>
        ) : (
          <View style={[styles.card, { backgroundColor: color }]}>
            {renderCardContent()}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    height: 220,
    marginBottom: 20,
  },
  pressable: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // New horizontal layout
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  
  iconSection: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  
  statsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});
