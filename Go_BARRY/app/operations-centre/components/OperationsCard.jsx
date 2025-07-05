/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Card Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { Pressable, View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../lib/_styles-index.js';

export default function OperationsCard({ 
  id,
  title, 
  subtitle, 
  icon, 
  color, 
  stats,
  onPress,
  isLoading = false 
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
        <View style={[styles.card, { backgroundColor: color }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name={icon} 
                size={32} 
                color="white" 
              />
              {stats && (
                <View style={styles.cardStat}>
                  <Text style={styles.statValue}>{stats.value}</Text>
                  <Text style={styles.statLabel}>{stats.label}</Text>
                </View>
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
          </View>
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <MaterialCommunityIcons name="loading" size={24} color="white" />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: Platform.OS === 'web' ? '31%' : '48%',
    height: 180,
    marginBottom: 16,
  },
  pressable: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.9,
  },
  card: {
    flex: 1,
    borderRadius: operationsTheme.borderRadius.lg,
    padding: 20,
    ...operationsTheme.shadows.md,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardStat: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardInfo: {
    marginTop: 'auto',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
