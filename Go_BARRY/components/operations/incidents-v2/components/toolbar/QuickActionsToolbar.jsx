/*
 * Go Barry - Quick Actions Toolbar
 * Provides quick access to common incident management tasks
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../../styles/incidents.styles';

const QuickActionsToolbar = ({
  onRecentLocationSelect,
  onMyRoutesToggle,
  onCopyLast,
  onBulkUpdate,
  selectedIncidents = [],
  lastIncident = null,
  supervisorBadge,
  baseUrl
}) => {
  const [recentLocations, setRecentLocations] = useState([]);
  const [myRoutes, setMyRoutes] = useState([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showRoutesDropdown, setShowRoutesDropdown] = useState(false);

  // Load recent locations from localStorage (session only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const stored = sessionStorage.getItem(`gobarry_recent_locations_${supervisorBadge}`);
      if (stored) {
        try {
          const locations = JSON.parse(stored);
          setRecentLocations(locations.slice(0, 10)); // Keep last 10
        } catch (e) {
          console.error('Error loading recent locations:', e);
        }
      }
    }
  }, [supervisorBadge]);

  // Load my routes from backend
  useEffect(() => {
    if (supervisorBadge && baseUrl) {
      fetchMyRoutes();
    }
  }, [supervisorBadge, baseUrl]);

  const fetchMyRoutes = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/supervisors/${supervisorBadge}/routes`);
      if (response.ok) {
        const data = await response.json();
        setMyRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching my routes:', error);
    }
  };

  // Add new location to recent list
  const addRecentLocation = (location) => {
    if (Platform.OS !== 'web') return;
    
    const newLocation = {
      id: `loc_${Date.now()}`,
      postcode: location.postcode,
      description: location.description,
      coordinates: location.coordinates,
      timestamp: new Date().toISOString()
    };

    const updated = [newLocation, ...recentLocations.filter(l => 
      l.postcode !== location.postcode
    )].slice(0, 10);

    setRecentLocations(updated);
    sessionStorage.setItem(
      `gobarry_recent_locations_${supervisorBadge}`,
      JSON.stringify(updated)
    );
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recent Locations */}
        <View style={styles.actionGroup}>
          <Pressable
            style={[styles.actionButton, showRecentDropdown && styles.actionButtonActive]}
            onPress={() => setShowRecentDropdown(!showRecentDropdown)}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Recent Locations</Text>
            <Ionicons 
              name={showRecentDropdown ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={colors.textSecondary} 
            />
          </Pressable>

          {showRecentDropdown && recentLocations.length > 0 && (
            <View style={[styles.dropdown, shadows.md]}>
              {recentLocations.map((location) => (
                <Pressable
                  key={location.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onRecentLocationSelect(location);
                    setShowRecentDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownItemTitle}>
                      {location.description || location.postcode}
                    </Text>
                    <Text style={styles.dropdownItemSubtitle}>
                      {location.postcode} • {formatTimeAgo(location.timestamp)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* My Routes */}
        <View style={styles.actionGroup}>
          <Pressable
            style={[styles.actionButton, showRoutesDropdown && styles.actionButtonActive]}
            onPress={() => setShowRoutesDropdown(!showRoutesDropdown)}
          >
            <Ionicons name="bus" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>My Routes</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{myRoutes.length}</Text>
            </View>
          </Pressable>

          {showRoutesDropdown && myRoutes.length > 0 && (
            <View style={[styles.dropdown, styles.routesDropdown, shadows.md]}>
              <View style={styles.routesGrid}>
                {myRoutes.map((route) => (
                  <Pressable
                    key={route}
                    style={[styles.routeButton, styles.routeButtonActive]}
                    onPress={() => onMyRoutesToggle(route)}
                  >
                    <Text style={styles.routeButtonText}>{route}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.routesHint}>
                Click routes to filter incidents
              </Text>
            </View>
          )}
        </View>

        {/* Copy Last */}
        {lastIncident && (
          <Pressable
            style={styles.actionButton}
            onPress={() => onCopyLast(lastIncident)}
          >
            <Ionicons name="copy" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Copy Last</Text>
          </Pressable>
        )}

        {/* Bulk Update */}
        {selectedIncidents.length > 0 && (
          <Pressable
            style={[styles.actionButton, styles.actionButtonHighlight]}
            onPress={onBulkUpdate}
          >
            <Ionicons name="checkmark-done" size={16} color={colors.textInverse} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextHighlight]}>
              Update {selectedIncidents.length} Selected
            </Text>
          </Pressable>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>
              {recentLocations.filter(l => {
                const date = new Date(l.timestamp);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>
              {recentLocations.length}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: colors.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },

  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  actionGroup: {
    position: 'relative',
    zIndex: 1,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    height: 36,
  },

  actionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },

  actionButtonHighlight: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  actionButtonText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  actionButtonTextHighlight: {
    color: colors.textInverse,
  },

  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },

  badgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: 11,
  },

  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    ...Platform.select({
      web: {
        zIndex: 1000,
      }
    }),
  },

  routesDropdown: {
    width: 320,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  dropdownItemContent: {
    flex: 1,
  },

  dropdownItemTitle: {
    ...typography.small,
    color: colors.text,
    fontWeight: '500',
  },

  dropdownItemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },

  routeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },

  routeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  routeButtonText: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '600',
  },

  routesHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },

  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: spacing.lg,
  },

  statItem: {
    alignItems: 'center',
  },

  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  statValue: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },

  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
};

export default QuickActionsToolbar;
