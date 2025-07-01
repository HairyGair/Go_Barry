/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Header Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../styles/theme.exports.js';
import { UK_LOCALE } from '../constants/locale.exports.js';

export default function OperationsHeader({ supervisorName, onLogout }) {
  const router = useRouter();
  
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backText}>{UK_LOCALE.HOME}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{UK_LOCALE.OPERATIONS_CENTRE}</Text>
          <Text style={styles.headerSubtitle}>{UK_LOCALE.DAILY_OPERATIONAL_TOOLS}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <Pressable style={styles.userInfo}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
            <Text style={styles.userName}>{supervisorName}</Text>
          </Pressable>
          
          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
            <Text style={styles.logoutText}>{UK_LOCALE.LOGOUT}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: operationsTheme.colors.headerBg,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    color: operationsTheme.colors.textLight,
    fontSize: 14,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: operationsTheme.colors.textLight,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
