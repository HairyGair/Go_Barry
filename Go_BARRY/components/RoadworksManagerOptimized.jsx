import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisor } from './hooks/useSupervisorSession';
import RoadworkMapModal from './RoadworkMapModal';
import { API_CONFIG } from '../config/api';
import debounce from 'lodash/debounce';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_HEIGHT = 280; // Approximate height of each roadwork card

const RoadworksManagerOptimized = ({ onClose }) => {
  const { supervisorName, logActivity } = useSupervisor();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [roadworks, setRoadworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [activeCompartment, setActiveCompartment] = useState('all');
  
  const PAGE_SIZE = 20; // Reduced for better performance
  const listRef = useRef(null);
  
  // Compartment definitions
  const compartments = [
    { id: 'all', label: 'All', icon: 'road-variant', color: '#3b82f6' },
    { id: 'today', label: 'Today', icon: 'calendar-today', color: '#f59e0b' },
    { id: 'week', label: 'This Week', icon: 'calendar-week', color: '#10b981' },
    { id: 'major', label: 'Major', icon: 'alert-octagon', color: '#dc2626' },
    { id: 'high-impact', label: 'High Impact', icon: 'bus-alert', color: '#7c3aed' },
  ];

  // Debounced server-side search
  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        fetchRoadworks(1, true);
        return;
      }
      
      setSearchLoading(true);
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}/api/roadworks/search?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          setRoadworks(data.roadworks || []);
          setTotalCount(data.totalCount || 0);
          setHasMorePages(false); // Search results don't paginate
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  // Enhanced fetch with offline support
  const fetchRoadworks = useCallback(async (page = 1, reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_CONFIG.baseURL}/api/roadworks/unified?` +
        `page=${page}&limit=${PAGE_SIZE}&compartment=${activeCompartment}`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const newRoadworks = data.roadworks || data.data || [];
      
      if (reset || page === 1) {
        setRoadworks(newRoadworks);
      } else {
        setRoadworks(prev => [...prev, ...newRoadworks]);
      }
      
      setHasMorePages(data.metadata?.pagination?.hasMore || false);
      setTotalCount(data.metadata?.totalCount || newRoadworks.length);
      setCurrentPage(page);
      
      // Cache for offline use
      if (Platform.OS === 'web' && 'caches' in window) {
        const cache = await caches.open('roadworks-v1');
        await cache.put(url, response.clone());
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      
      // Try offline cache
      if (Platform.OS === 'web' && 'caches' in window) {
        try {
          const cache = await caches.open('roadworks-v1');
          const cachedResponse = await cache.match(
            `${API_CONFIG.baseURL}/api/roadworks/unified`
          );
          
          if (cachedResponse) {
            const data = await cachedResponse.json();
            setRoadworks(data.roadworks || data.data || []);
            setError('Using offline data (last synced: unknown)');
            return;
          }
        } catch (cacheErr) {
          console.error('Cache retrieval failed:', cacheErr);
        }
      }
      
      setError('Failed to load roadworks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCompartment, loading]);

  // Initial load
  useEffect(() => {
    fetchRoadworks(1, true);
  }, [activeCompartment]);

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      fetchRoadworks(1, true);
    }
  }, [searchQuery]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMorePages && !searchQuery) {
      fetchRoadworks(currentPage + 1);
    }
  }, [loading, hasMorePages, currentPage, searchQuery]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchRoadworks(1, true);
  }, []);

  // Optimized roadwork card component
  const RoadworkCard = React.memo(({ item, onPress, onMapPress }) => {
    const severity = item.sm_traffic_management_type === 'Road closure' ? 'high' : 
                     item.affectedRoutes?.length > 3 ? 'medium' : 'low';
    
    return (
      <TouchableOpacity 
        style={[styles.card, styles[`card${severity.charAt(0).toUpperCase() + severity.slice(1)}`]]}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.street_name || item.sm_street_name || 'Unknown Location'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => onMapPress(item)}
          >
            <MaterialCommunityIcons name="map" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.sm_works_description || item.sm_activity_type || 'Roadworks'}
        </Text>
        
        {item.sm_traffic_management_type && (
          <View style={styles.trafficType}>
            <MaterialCommunityIcons name="traffic-cone" size={16} color="#f59e0b" />
            <Text style={styles.trafficTypeText}>{item.sm_traffic_management_type}</Text>
          </View>
        )}
        
        {item.affectedRoutes?.length > 0 && (
          <View style={styles.routesContainer}>
            <MaterialCommunityIcons name="bus" size={16} color="#6b7280" />
            <Text style={styles.routesText}>
              Routes: {item.affectedRoutes.slice(0, 3).join(', ')}
              {item.affectedRoutes.length > 3 && ` +${item.affectedRoutes.length - 3}`}
            </Text>
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.sm_start_date || item.start_date).toLocaleDateString()} - 
            {new Date(item.sm_end_date || item.end_date).toLocaleDateString()}
          </Text>
          <View style={[styles.severityBadge, styles[`severity${severity.charAt(0).toUpperCase() + severity.slice(1)}`]]}>
            <Text style={styles.severityText}>{severity}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item, index) => `${item.id}-${index}`, []);

  // Get item layout for optimization
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Render item
  const renderItem = useCallback(({ item }) => (
    <RoadworkCard 
      item={item}
      onPress={(roadwork) => {
        // Handle roadwork selection
        logActivity('view_roadwork', { id: roadwork.id });
      }}
      onMapPress={(roadwork) => {
        setSelectedRoadwork(roadwork);
        setShowMapModal(true);
      }}
    />
  ), []);

  // List header component
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Roadworks Manager</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations, routes..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchLoading && <ActivityIndicator size="small" color="#3b82f6" />}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={22} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.compartmentTabs}>
        {compartments.map(comp => (
          <TouchableOpacity
            key={comp.id}
            style={[
              styles.compartmentTab,
              activeCompartment === comp.id && styles.compartmentTabActive
            ]}
            onPress={() => setActiveCompartment(comp.id)}
          >
            <MaterialCommunityIcons 
              name={comp.icon} 
              size={18} 
              color={activeCompartment === comp.id ? comp.color : '#6b7280'} 
            />
            <Text style={[
              styles.compartmentText,
              activeCompartment === comp.id && { color: comp.color }
            ]}>
              {comp.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert" size={16} color="#f59e0b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  ), [searchQuery, searchLoading, activeCompartment, error, onClose]);

  // List footer component
  const ListFooterComponent = useMemo(() => {
    if (!hasMorePages || searchQuery) return null;
    
    return (
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <Text style={styles.footerText}>
            Showing {roadworks.length} of {totalCount || '?'} roadworks
          </Text>
        )}
      </View>
    );
  }, [loading, hasMorePages, searchQuery, roadworks.length, totalCount]);

  // Empty component
  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="road-variant" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No roadworks found' : 'No active roadworks'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={listRef}
          data={roadworks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={!loading && ListEmptyComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
        />
        
        {showMapModal && selectedRoadwork && (
          <RoadworkMapModal
            visible={showMapModal}
            roadwork={selectedRoadwork}
            onClose={() => {
              setShowMapModal(false);
              setSelectedRoadwork(null);
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  compartmentTabs: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  compartmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#334155',
  },
  compartmentTabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  compartmentText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: ITEM_HEIGHT - 16,
  },
  cardHigh: {
    borderColor: '#dc2626',
  },
  cardMedium: {
    borderColor: '#f59e0b',
  },
  cardLow: {
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  mapButton: {
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
  },
  descriptionText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  trafficType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trafficTypeText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 6,
  },
  routesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routesText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityHigh: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  severityMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  severityLow: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
});

export default RoadworksManagerOptimized;