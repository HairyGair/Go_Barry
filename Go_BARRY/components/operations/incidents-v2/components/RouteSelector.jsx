/*
 * Go Barry - Route Selector Grid
 * All 231 routes as clickable buttons with auto-detection support
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/incidents.styles';

const RouteSelector = ({ 
  selectedRoutes = [],
  detectedRoutes = [],
  routeConfidence = {},
  onRoutesChange,
  baseUrl
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allRoutes, setAllRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyDetected, setShowOnlyDetected] = useState(false);

  // Load all routes on mount
  useEffect(() => {
    loadAllRoutes();
  }, [baseUrl]);

  const loadAllRoutes = async () => {
    try {
      setIsLoading(true);
      // Try multiple endpoints for routes data
      let response;
      try {
        response = await fetch(`${baseUrl}/api/routes`);
      } catch (error) {
        console.log('Primary routes endpoint failed, trying alternative...');
        response = await fetch(`${baseUrl}/api/gtfs/routes`);
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes) {
          // Sort routes alphanumerically
          const sortedRoutes = data.routes.sort((a, b) => {
          // Extract numbers and letters
          const aNum = parseInt(a.route_short_name) || 999;
          const bNum = parseInt(b.route_short_name) || 999;
          if (aNum !== bNum) return aNum - bNum;
          
          // If numbers are same, sort by full name
          return a.route_short_name.localeCompare(b.route_short_name);
          });
          
          setAllRoutes(sortedRoutes);
        }
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      // Fallback to common routes
      setAllRoutes(generateFallbackRoutes());
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackRoutes = () => {
    // Common Go North East routes
    const commonRoutes = [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10A', '10B',
      '12', '13', '16', '19', '20', '21', '22', 'X21', '24', '25', '26', '27', '28', '28B', '29',
      '30', '31', '32', '33', '34', '35', '36', '38', '39', '40',
      '47', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58',
      '61', '62', '63', '64', '65', '67', '69',
      '71', '74', '78',
      '82', '83', '84', '85',
      '93', '94', '96', '97',
      'Q3', 'Q3X',
      '100', '307', '309', '310', '317', '327',
      '700', '701', '702',
      'X1', 'X9', 'X10', 'X12', 'X20', 'X21', 'X30', 'X31', 'X45', 'X46', 'X47',
      'X66', 'X70', 'X71', 'X75', 'X76', 'X77', 'X78', 'X79',
      'X82', 'X84', 'X85', 'X87', 'X88'
    ];
    
    return commonRoutes.map(route => ({
      route_short_name: route,
      route_long_name: `Route ${route}`,
      route_id: route
    }));
  };

  // Filter routes based on search and view mode
  const filteredRoutes = useMemo(() => {
    let routes = allRoutes;
    
    // Filter by detected routes if enabled
    if (showOnlyDetected && detectedRoutes.length > 0) {
      routes = routes.filter(route => 
        detectedRoutes.includes(route.route_short_name)
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      routes = routes.filter(route => 
        route.route_short_name.toLowerCase().includes(query) ||
        route.route_long_name?.toLowerCase().includes(query)
      );
    }
    
    return routes;
  }, [allRoutes, searchQuery, showOnlyDetected, detectedRoutes]);

  const toggleRoute = (routeName) => {
    const newSelected = selectedRoutes.includes(routeName)
      ? selectedRoutes.filter(r => r !== routeName)
      : [...selectedRoutes, routeName];
    
    if (onRoutesChange) {
      onRoutesChange(newSelected);
    }
  };

  const selectAll = () => {
    const allVisible = filteredRoutes.map(r => r.route_short_name);
    if (onRoutesChange) {
      onRoutesChange(allVisible);
    }
  };

  const clearAll = () => {
    if (onRoutesChange) {
      onRoutesChange([]);
    }
  };

  const selectDetected = () => {
    if (onRoutesChange) {
      onRoutesChange([...detectedRoutes]);
    }
  };

  const getRouteStyle = (routeName) => {
    const isSelected = selectedRoutes.includes(routeName);
    const isDetected = detectedRoutes.includes(routeName);
    const confidence = routeConfidence[routeName];
    
    if (isSelected) {
      return [styles.routeButton, styles.routeButtonSelected];
    } else if (isDetected) {
      return [styles.routeButton, styles.routeButtonDetected];
    } else {
      return [styles.routeButton, styles.routeButtonDefault];
    }
  };

  const getRouteTextStyle = (routeName) => {
    const isSelected = selectedRoutes.includes(routeName);
    const isDetected = detectedRoutes.includes(routeName);
    
    if (isSelected) {
      return [styles.routeText, styles.routeTextSelected];
    } else if (isDetected) {
      return [styles.routeText, styles.routeTextDetected];
    } else {
      return styles.routeText;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        
        <View style={styles.controls}>
          <Pressable 
            style={styles.controlButton}
            onPress={selectAll}
          >
            <Text style={styles.controlButtonText}>Select All</Text>
          </Pressable>
          
          <Pressable 
            style={styles.controlButton}
            onPress={clearAll}
          >
            <Text style={styles.controlButtonText}>Clear All</Text>
          </Pressable>
          
          {detectedRoutes.length > 0 && (
            <Pressable 
              style={[styles.controlButton, styles.controlButtonHighlight]}
              onPress={selectDetected}
            >
              <Ionicons name="sparkles" size={16} color={colors.warning} />
              <Text style={[styles.controlButtonText, { color: colors.warning }]}>
                Auto-detected ({detectedRoutes.length})
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Toggle for showing only detected routes */}
      {detectedRoutes.length > 0 && (
        <Pressable 
          style={styles.toggleContainer}
          onPress={() => setShowOnlyDetected(!showOnlyDetected)}
        >
          <Ionicons 
            name={showOnlyDetected ? "checkbox" : "square-outline"} 
            size={20} 
            color={colors.primary} 
          />
          <Text style={styles.toggleText}>
            Show only auto-detected routes
          </Text>
        </Pressable>
      )}

      {/* Selected Routes Summary */}
      {selectedRoutes.length > 0 && (
        <View style={styles.selectedSummary}>
          <Text style={styles.selectedText}>
            {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} selected
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.selectedList}
          >
            {selectedRoutes.map((route, index) => (
              <View key={index} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{route}</Text>
                <Pressable onPress={() => toggleRoute(route)}>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Routes Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.routesGrid}
        showsVerticalScrollIndicator={true}
      >
        {filteredRoutes.map((route) => {
          const routeName = route.route_short_name;
          const confidence = routeConfidence[routeName];
          const isDetected = detectedRoutes.includes(routeName);
          
          return (
            <Pressable
              key={route.route_id}
              style={getRouteStyle(routeName)}
              onPress={() => toggleRoute(routeName)}
            >
              <Text style={getRouteTextStyle(routeName)}>
                {routeName}
              </Text>
              {isDetected && confidence && (
                <Text style={styles.confidenceText}>
                  {confidence}%
                </Text>
              )}
            </Pressable>
          );
        })}
        
        {filteredRoutes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No routes found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlButtonHighlight: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedSummary: {
    padding: spacing.md,
    backgroundColor: colors.primaryBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  selectedList: {
    flexDirection: 'row',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    gap: spacing.xs,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  routeButton: {
    minWidth: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeButtonDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  routeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeButtonDetected: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  routeTextSelected: {
    color: '#fff',
  },
  routeTextDetected: {
    color: colors.warning,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.warning,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default RouteSelector;