// Go_BARRY/app/(tabs)/services.jsx
// Service Information Dashboard for Supervisors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../config/api';

const ServiceInformationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehiclePositions, setVehiclePositions] = useState({});
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Calculate where buses should be based on schedule
  const calculateExpectedPositions = (routeId, frequency) => {
    if (!frequency || !frequency.overall) return [];
    
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Get first departure time in minutes
    const [firstHour, firstMin] = frequency.firstDeparture.split(':').map(Number);
    const firstDepartureMinutes = firstHour * 60 + firstMin;
    
    // Get last departure time in minutes
    const [lastHour, lastMin] = frequency.lastDeparture.split(':').map(Number);
    const lastDepartureMinutes = lastHour * 60 + lastMin;
    
    // Check if service is running
    if (currentMinutes < firstDepartureMinutes || currentMinutes > lastDepartureMinutes) {
      return [{ status: 'Not in service', time: 'Service hours: ' + frequency.firstDeparture + ' - ' + frequency.lastDeparture }];
    }
    
    // Calculate expected positions based on frequency
    const avgFrequency = frequency.overall.avgMinutes || 30;
    const positions = [];
    
    // Work backwards from current time to find recent departures
    for (let i = 0; i < 5; i++) {
      const departureTime = currentMinutes - (i * avgFrequency);
      if (departureTime >= firstDepartureMinutes) {
        const hours = Math.floor(departureTime / 60);
        const minutes = departureTime % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Estimate position based on time since departure
        const minutesAgo = i * avgFrequency;
        let position = 'En route';
        if (minutesAgo === 0) position = 'Just departed';
        else if (minutesAgo < 10) position = 'Near start';
        else if (minutesAgo < avgFrequency / 2) position = 'First half of route';
        else position = 'Second half of route';
        
        positions.push({
          departureTime: timeStr,
          minutesAgo,
          position,
          status: minutesAgo === 0 ? 'Just left' : `${minutesAgo} min ago`
        });
      }
    }
    
    return positions;
  };
  
  // Fetch frequency data for all routes
  const fetchRouteData = async () => {
    try {
      setLoading(true);
      
      // Get list of high-frequency routes first
      const highFreqResponse = await apiRequest('/api/frequency/high-frequency');
      
      if (highFreqResponse.success) {
        const routeMap = {};
        
        // Organize by frequency category
        highFreqResponse.routes.forEach(route => {
          routeMap[route.routeId] = route;
        });
        
        setRouteData(routeMap);
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRouteData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRouteData();
  };

  // Categorize routes
  const categorizeRoutes = () => {
    const categories = {
      'high-frequency': [],
      'frequent': [],
      'moderate': [],
      'hourly': [],
      'infrequent': []
    };
    
    Object.entries(routeData).forEach(([routeId, data]) => {
      const category = data.frequency?.overall?.category;
      if (category && categories[category]) {
        categories[category].push({ routeId, ...data });
      }
    });
    
    return categories;
  };

  const categories = categorizeRoutes();
  
  // Filter routes based on search
  const filterRoutes = (routes) => {
    if (!searchQuery) return routes;
    return routes.filter(route => 
      route.routeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'high-frequency': return '#DC2626';
      case 'frequent': return '#F59E0B';
      case 'moderate': return '#3B82F6';
      case 'hourly': return '#10B981';
      case 'infrequent': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const RouteCard = ({ route }) => {
    const isExpanded = expandedRoute === route.routeId;
    const freq = route.frequency;
    const categoryColor = getCategoryColor(freq?.overall?.category);
    const expectedPositions = calculateExpectedPositions(route.routeId, freq);
    
    return (
      <TouchableOpacity
        style={[styles.routeCard, { borderLeftColor: categoryColor }]}
        onPress={() => setExpandedRoute(isExpanded ? null : route.routeId)}
        activeOpacity={0.7}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeBasicInfo}>
            <Text style={styles.routeId}>Route {route.routeId}</Text>
            <Text style={styles.routeSummary}>{route.summary}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6B7280" 
          />
        </View>
        
        {isExpanded && freq && (
          <View style={styles.routeDetails}>
            {/* Service Status */}
            <View style={styles.serviceStatusSection}>
              <Text style={styles.sectionTitle}>🚌 Service Status</Text>
              <Text style={styles.currentTime}>
                Current time: {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            {/* Expected Bus Positions */}
            <View style={styles.expectedPositionsSection}>
              <Text style={styles.sectionTitle}>🗺️ Expected Bus Locations</Text>
              {expectedPositions.map((pos, index) => (
                <View key={index} style={styles.positionItem}>
                  <View style={styles.positionTimeContainer}>
                    <Text style={styles.positionTime}>{pos.departureTime}</Text>
                    <Text style={styles.positionStatus}>{pos.status}</Text>
                  </View>
                  <View style={styles.positionLocationContainer}>
                    <Ionicons name="location" size={16} color={categoryColor} />
                    <Text style={styles.positionLocation}>{pos.position}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Frequency Details */}
            <View style={styles.frequencySection}>
              <Text style={styles.sectionTitle}>⏰ Frequency Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Hours:</Text>
                <Text style={styles.detailValue}>
                  {freq.firstDeparture} - {freq.lastDeparture}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Trips/Day:</Text>
                <Text style={styles.detailValue}>{freq.totalTrips}</Text>
              </View>
              
              {freq.peak && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Peak Frequency:</Text>
                  <Text style={styles.detailValue}>
                    Every {freq.peak.avgMinutes} min ({freq.peak.tripsInPeriod} trips)
                  </Text>
                </View>
              )}
              
              {freq.midday && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Midday Frequency:</Text>
                  <Text style={styles.detailValue}>
                    Every {freq.midday.avgMinutes} min ({freq.midday.tripsInPeriod} trips)
                  </Text>
                </View>
              )}
              
              {freq.evening && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Evening Frequency:</Text>
                  <Text style={styles.detailValue}>
                    Every {freq.evening.avgMinutes} min ({freq.evening.tripsInPeriod} trips)
                  </Text>
                </View>
              )}
            </View>
            
            {/* Service Category */}
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {freq.overall.category.toUpperCase().replace('-', ' ')}
              </Text>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: categoryColor }]}
                onPress={() => alert(`View real-time tracking for Route ${route.routeId}`)}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Track Buses</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                onPress={() => alert(`View incidents for Route ${route.routeId}`)}
              >
                <Ionicons name="warning" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>View Incidents</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const CategorySection = ({ title, routes, color }) => {
    const filteredRoutes = filterRoutes(routes);
    
    if (selectedCategory !== 'all' && selectedCategory !== title) {
      return null;
    }
    
    if (filteredRoutes.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.categorySection}>
        <View style={[styles.categoryHeader, { borderLeftColor: color }]}>
          <Text style={styles.categoryTitle}>{title.toUpperCase().replace('-', ' ')}</Text>
          <View style={[styles.countBadge, { backgroundColor: color }]}>
            <Text style={styles.countText}>{filteredRoutes.length}</Text>
          </View>
        </View>
        
        {filteredRoutes.map(route => (
          <RouteCard key={route.routeId} route={route} />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading service information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Service Information</Text>
          <Text style={styles.subtitle}>Real-time frequency and schedule data</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#FFFFFF" 
            style={refreshing ? styles.spinning : null}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
            All Routes
          </Text>
        </TouchableOpacity>
        
        {Object.keys(categories).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip, 
              selectedCategory === category && styles.filterChipActive,
              { borderColor: getCategoryColor(category) }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.filterText, 
              selectedCategory === category && styles.filterTextActive
            ]}>
              {category.replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CategorySection
          title="high-frequency"
          routes={categories['high-frequency']}
          color="#DC2626"
        />
        <CategorySection
          title="frequent"
          routes={categories['frequent']}
          color="#F59E0B"
        />
        <CategorySection
          title="moderate"
          routes={categories['moderate']}
          color="#3B82F6"
        />
        <CategorySection
          title="hourly"
          routes={categories['hourly']}
          color="#10B981"
        />
        <CategorySection
          title="infrequent"
          routes={categories['infrequent']}
          color="#6B7280"
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Service frequency data updated every 5 minutes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 50,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeBasicInfo: {
    flex: 1,
  },
  routeId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  routeSummary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  routeDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // New styles for enhanced features
  serviceStatusSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  expectedPositionsSection: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  positionItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  positionTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  positionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  positionLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  positionLocation: {
    fontSize: 13,
    color: '#4B5563',
  },
  frequencySection: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiceInformationDashboard;