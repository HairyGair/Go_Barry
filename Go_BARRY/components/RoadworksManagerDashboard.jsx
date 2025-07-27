import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useSupervisor } from './hooks/useSupervisorSession';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RoadworksManagerDashboard = React.memo(({ onClose }) => {
  const { supervisorName, supervisor } = useSupervisor();
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [routeImpacts, setRouteImpacts] = useState([]);
  const [futureWorks, setFutureWorks] = useState([]);
  
  // Debug wrapper for setCriticalAlerts to track when alerts are cleared
  const setCriticalAlertsWithDebug = (alerts) => {
    const timestamp = new Date().toLocaleTimeString();
    if (Array.isArray(alerts) && alerts.length === 0) {
      console.warn(`🚨 [${timestamp}] ALERTS CLEARED - This might be causing the disappearing issue!`);
      console.trace('Stack trace for alert clearing:');
    } else if (Array.isArray(alerts)) {
      console.log(`✅ [${timestamp}] Alerts updated: ${alerts.length} alerts`);
    }
    setCriticalAlerts(alerts);
  };
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('critical');
  const [filters, setFilters] = useState({
    severity: 'ALL',
    area: 'ALL',
    timeframe: '7'
  });
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Severity colors
  const severityColors = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#65a30d'
  };

  // Area options
  const areas = ['ALL', 'Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'North Tyneside', 'Northumberland'];

  // Helper functions
  const determineSeverity = (roadwork) => {
    const location = (roadwork.location || roadwork.street || '').toLowerCase();
    const description = (roadwork.description || roadwork.workType || '').toLowerCase();
    
    // Critical: Major roads, closures, diversions
    if (location.includes('a1') || location.includes('a19') || location.includes('motorway') || 
        description.includes('closure') || description.includes('diversion')) {
      return 'CRITICAL';
    }
    
    // High: B roads, major streets
    if (location.includes('high street') || location.includes('main road') || 
        description.includes('major') || description.includes('long term')) {
      return 'HIGH';
    }
    
    // Medium: Local roads with moderate impact
    if (description.includes('roadwork') || description.includes('maintenance')) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  };

  const generateMockRoutes = (location) => {
    // Generate mock affected routes based on location
    const routes = [];
    const locationLower = (location || '').toLowerCase();
    
    if (locationLower.includes('newcastle') || locationLower.includes('a1')) {
      routes.push({ number: '1', confidence: 85 }, { number: '10', confidence: 78 });
    }
    if (locationLower.includes('sunderland') || locationLower.includes('a19')) {
      routes.push({ number: '2', confidence: 92 }, { number: '20', confidence: 71 });
    }
    if (locationLower.includes('durham')) {
      routes.push({ number: '21', confidence: 88 }, { number: 'X21', confidence: 65 });
    }
    
    // Default routes if none matched
    if (routes.length === 0) {
      routes.push({ number: '56', confidence: 75 }, { number: '57', confidence: 68 });
    }
    
    return routes;
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format: "Mon 26 Jul, 09:30"
      const options = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      
      return date.toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate duration between dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Unknown duration';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Unknown duration';
      
      const diffMs = end - start;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Invalid duration';
      if (diffDays === 0) return 'Same day';
      if (diffDays === 1) return '1 day';
      if (diffDays < 7) return `${diffDays} days`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week' : `${weeks} weeks`;
      }
      
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month' : `${months} months`;
    } catch (error) {
      return 'Unknown duration';
    }
  };

  // Enhanced location string processing for better map accuracy
  const enhanceLocationString = (location) => {
    if (!location) return 'Unknown Location, UK';
    
    let enhanced = location;
    
    // Remove "Unknown" references
    enhanced = enhanced.replace(/, Unknown/g, '');
    enhanced = enhanced.replace(/Unknown,?/g, '');
    enhanced = enhanced.trim();
    
    // Enhance specific road types for better search
    enhanced = enhanced.replace(/\bA1\b/g, 'A1 Road');
    enhanced = enhanced.replace(/\bA19\b/g, 'A19 Road');
    enhanced = enhanced.replace(/\bA69\b/g, 'A69 Road');
    enhanced = enhanced.replace(/\bB\d+\b/g, match => `${match} Road`);
    
    // Add specific North East context for common areas
    const areaEnhancements = {
      'PONTELAND ROAD': 'Ponteland Road, Newcastle upon Tyne',
      'WEST ROAD': 'West Road, Newcastle upon Tyne',
      'GREAT NORTH ROAD': 'Great North Road, Newcastle upon Tyne',
      'NORTHUMBERLAND STREET': 'Northumberland Street, Newcastle upon Tyne',
      'GREY STREET': 'Grey Street, Newcastle upon Tyne',
      'CLAYTON STREET': 'Clayton Street, Newcastle upon Tyne',
      'GOSFORTH': 'Gosforth, Newcastle upon Tyne',
      'JESMOND': 'Jesmond, Newcastle upon Tyne',
      'BYKER': 'Byker, Newcastle upon Tyne',
      'WALKER': 'Walker, Newcastle upon Tyne',
      'WALLSEND': 'Wallsend, North Tyneside',
      'WHITLEY BAY': 'Whitley Bay, North Tyneside',
      'SOUTH SHIELDS': 'South Shields, South Tyneside',
      'GATESHEAD': 'Gateshead, Tyne and Wear',
      'SUNDERLAND': 'Sunderland, Tyne and Wear',
      'DURHAM': 'Durham, County Durham'
    };
    
    // Check for area enhancements
    for (const [area, fullName] of Object.entries(areaEnhancements)) {
      if (enhanced.toUpperCase().includes(area)) {
        enhanced = fullName;
        break;
      }
    }
    
    // Add UK context if not already present
    if (!enhanced.toLowerCase().includes('uk') && 
        !enhanced.toLowerCase().includes('england') &&
        !enhanced.toLowerCase().includes('tyne and wear') &&
        !enhanced.toLowerCase().includes('county durham') &&
        !enhanced.toLowerCase().includes('north tyneside') &&
        !enhanced.toLowerCase().includes('south tyneside')) {
      enhanced += ', UK';
    }
    
    return enhanced;
  };

  // Determine optimal zoom level based on location specificity
  const determineOptimalZoom = (location) => {
    const locationLower = location.toLowerCase();
    
    // Very specific locations (street names with numbers, junctions) - highest zoom
    if (/\d+/.test(location) || locationLower.includes('junction') || locationLower.includes('roundabout')) {
      return 17; // Street level
    }
    
    // Specific street names - high zoom
    if (locationLower.includes('road') || locationLower.includes('street') || 
        locationLower.includes('lane') || locationLower.includes('avenue') ||
        locationLower.includes('close') || locationLower.includes('way')) {
      return 16; // Street level
    }
    
    // Named areas/districts - medium zoom
    if (locationLower.includes('gosforth') || locationLower.includes('jesmond') ||
        locationLower.includes('byker') || locationLower.includes('walker') ||
        locationLower.includes('wallsend') || locationLower.includes('whitley bay')) {
      return 15; // District level
    }
    
    // Major roads (A roads) - medium zoom
    if (locationLower.includes('a1') || locationLower.includes('a19') || 
        locationLower.includes('a69') || /\ba\d+/.test(locationLower)) {
      return 14; // Major road level
    }
    
    // Towns/cities - lower zoom
    if (locationLower.includes('newcastle') || locationLower.includes('gateshead') ||
        locationLower.includes('sunderland') || locationLower.includes('durham')) {
      return 13; // City level
    }
    
    // Default for general locations
    return 15;
  };


  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔄 [${timestamp}] useEffect triggered - loading data. Filters:`, filters);
    loadData();
    // No auto-refresh to prevent alerts disappearing
  }, [filters]);

  // Memoize critical state to prevent loss during parent re-renders
  const memoizedCriticalAlerts = useMemo(() => criticalAlerts, [criticalAlerts]);
  const memoizedRouteImpacts = useMemo(() => routeImpacts, [routeImpacts]);
  const memoizedFutureWorks = useMemo(() => futureWorks, [futureWorks]);

  const loadData = async () => {
    if (loading) return;
    setLoading(true);
    
    // Don't clear existing alerts while loading new ones
    const previousAlerts = criticalAlerts;
    
    try {
      // Load critical alerts first
      await loadCriticalAlerts();
      
      // Then load route impacts (which depend on critical alerts) and future works in parallel
      await Promise.all([
        loadRouteImpacts(),
        loadFutureWorks()
      ]);
    } catch (error) {
      console.error('Error loading roadworks data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCriticalAlerts = async () => {
    try {
      const getBaseUrl = () => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          return 'http://localhost:3001';
        }
        return 'https://go-barry.onrender.com';
      };
      const baseUrl = getBaseUrl();
      
      console.log('Loading StreetManager alerts...');
      
      // Go directly to unified endpoint filtered for StreetManager only
      const roadworksResponse = await fetch(`${baseUrl}/api/roadworks/unified?source=StreetManager`);
      if (!roadworksResponse.ok) {
        console.error('Failed to fetch roadworks:', roadworksResponse.status);
        // Don't clear existing alerts on error
        return;
      }
      
      const roadworksData = await roadworksResponse.json();
      console.log('Unified roadworks data:', roadworksData);
      
      if (roadworksData.success && roadworksData.roadworks && roadworksData.roadworks.length > 0) {
        // Already filtered for StreetManager at API level
        const streetManagerOnly = roadworksData.roadworks;
        
        console.log(`Found ${streetManagerOnly.length} StreetManager webhook notifications from Supabase`);
        
        if (streetManagerOnly.length > 0) {
          // Take more alerts and sort by severity
          const sortedWorks = streetManagerOnly.sort((a, b) => {
            const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            const aSeverity = a.severity || 'Low';
            const bSeverity = b.severity || 'Low';
            return (severityOrder[aSeverity] || 3) - (severityOrder[bSeverity] || 3);
          });
          
          const alerts = sortedWorks.slice(0, 20).map(work => ({
            id: work.id || work.permit_reference_number || `streetmanager-${Date.now()}-${Math.random()}`,
            location: work.location || work.location_description || work.street_name || 'Unknown location',
            description: work.description || work.activity_name || work.work_type || 'StreetManager roadworks',
            severity: work.severity || determineSeverity({
              location: work.location || work.location_description || work.street_name,
              description: work.description || work.activity_name,
              workType: work.work_category || work.category
            }),
            startDate: work.startDate || work.proposedStartDate || work.actualStartDate || work.lastUpdated || work.webhook_received_at,
            endDate: work.endDate || work.proposedEndDate || work.actualEndDate || null,
            expectedImpact: work.traffic_management_type || work.impact || 'Potential traffic impact',
            affectedRoutes: work.affectedRoutes || generateMockRoutes(work.location || work.location_description || work.street_name),
            status: work.status || work.activity_status || 'pending_review',
            source: 'streetmanager_webhook',
            permitReference: work.permitReference || work.permit_reference_number,
            workCategory: work.workCategory || work.work_category,
            authority: work.authority || work.highway_authority,
            // Enhanced coordinate data from webhook
            coordinates: work.coordinates,
            coordinateSource: work.coordinateSource || 'none'
          }));
          
          console.log(`Loaded ${alerts.length} StreetManager webhook alerts for proactive planning`);
          
          // Debug coordinate extraction success
          const alertsWithCoords = alerts.filter(alert => alert.coordinates && alert.coordinates.length === 2);
          const coordPercentage = alerts.length > 0 ? Math.round((alertsWithCoords.length / alerts.length) * 100) : 0;
          console.log(`📍 Coordinate extraction: ${alertsWithCoords.length}/${alerts.length} alerts (${coordPercentage}%) have precise coordinates`);
          
          // Log coordinate sources for debugging
          alerts.forEach(alert => {
            if (alert.coordinates && alert.coordinateSource) {
              console.log(`🗺️ Alert ${alert.id}: coordinates from ${alert.coordinateSource}`);
            }
          });
          
          setCriticalAlertsWithDebug(alerts);
        } else {
          console.log('No StreetManager webhook data found - keeping existing alerts');
          // Keep existing alerts if none found
        }
      } else {
        console.log('No roadworks data available - keeping existing alerts');
        // Keep existing alerts on empty response
      }
      
    } catch (error) {
      console.error('Error loading alerts:', error);
      // Don't clear alerts on error - keep existing
    }
  };

  const loadRouteImpacts = async () => {
    try {
      console.log('Calculating route impacts from StreetManager webhook data...');
      
      // Use the critical alerts we already loaded to calculate route impacts
      if (criticalAlerts.length > 0) {
        // Group alerts by affected routes
        const routeMap = new Map();
        
        criticalAlerts.forEach(alert => {
          if (alert.affectedRoutes && alert.affectedRoutes.length > 0) {
            alert.affectedRoutes.forEach(route => {
              if (!routeMap.has(route.number)) {
                routeMap.set(route.number, {
                  routeNumber: route.number,
                  routeName: getRouteDescription(route.number),
                  totalDisruptions: 0,
                  criticalDisruptions: 0,
                  estimatedDelay: 0
                });
              }
              
              const routeData = routeMap.get(route.number);
              routeData.totalDisruptions++;
              if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
                routeData.criticalDisruptions++;
              }
              routeData.estimatedDelay += (alert.severity === 'CRITICAL' ? 15 : 10);
            });
          }
        });
        
        // Convert to array and sort by impact
        const impacts = Array.from(routeMap.values())
          .sort((a, b) => b.criticalDisruptions - a.criticalDisruptions)
          .slice(0, 10);
        
        console.log(`Calculated impacts for ${impacts.length} routes`);
        setRouteImpacts(impacts);
      } else {
        setRouteImpacts([]);
      }
      
    } catch (error) {
      console.error('Error calculating route impacts:', error);
      // Don't clear existing impacts on error
    }
  };
  
  const getRouteDescription = (routeNumber) => {
    const descriptions = {
      '1': 'Newcastle - Gateshead',
      '2': 'Sunderland - Washington',
      '10': 'Newcastle City Centre',
      '11': 'Newcastle - Byker',
      '20': 'Durham - Sunderland',
      '21': 'Newcastle - Chester-le-Street',
      'X1': 'Newcastle - Middlesbrough',
      'X21': 'Newcastle - West Auckland'
    };
    return descriptions[routeNumber] || 'Regional Service';
  };

  const loadFutureWorks = async () => {
    try {
      console.log('Loading future StreetManager works...');
      
      const getBaseUrl = () => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          return 'http://localhost:3001';
        }
        return 'https://go-barry.onrender.com';
      };
      const baseUrl = getBaseUrl();
      
      // Get StreetManager webhook data from Supabase to find future works
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`${baseUrl}/api/roadworks/unified?source=streetmanager&limit=1000`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Failed to fetch future works: ${response.status} ${response.statusText}`);
        setFutureWorks([{
          id: 'error-1',
          title: 'Error Loading Future Works',
          location: `HTTP ${response.status}`,
          startDate: new Date().toISOString(),
          source: 'error'
        }]);
        return;
      }
      
      const data = await response.json();
      console.log('📅 Future works API response:', {
        success: data.success,
        totalRoadworks: data.roadworks?.length || 0,
        sourceFilter: 'streetmanager'
      });
      
      if (data.success && data.roadworks) {
        // Filter for works starting in the future (already StreetManager only)
        const now = new Date();
        const futureStreetManagerWorks = data.roadworks
          .filter(work => {
            const hasStartDate = work.startDate;
            const isFuture = hasStartDate && new Date(work.startDate) > now;
            if (hasStartDate) {
              console.log(`📅 Work ${work.id}: ${work.startDate} (future: ${isFuture})`);
            }
            return isFuture;
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 10)
          .map(work => ({
            id: work.id || work.permitReference || `future-${Date.now()}-${Math.random()}`,
            location: work.location || work.streetName || 'Unknown location',
            description: work.description || work.title || 'StreetManager planned work',
            plannedStart: work.startDate,
            duration: work.endDate ? 
              Math.ceil((new Date(work.endDate) - new Date(work.startDate)) / (1000 * 60 * 60 * 24)) : 
              'Unknown',
            impact: work.severity || 'Medium',
            permitReference: work.permitReference,
            authority: work.authority
          }));
        
        console.log(`📅 Found ${futureStreetManagerWorks.length} future StreetManager works`);
        
        if (futureStreetManagerWorks.length === 0) {
          // Try fallback to sample data for development/testing
          console.log('📋 No future works found, checking for sample data...');
          try {
            const sampleResponse = await fetch(`${baseUrl}/api/streetmanager/sample-future-works`);
            if (sampleResponse.ok) {
              const sampleData = await sampleResponse.json();
              if (sampleData.success && sampleData.roadworks?.length > 0) {
                console.log(`📊 Using ${sampleData.roadworks.length} sample future works`);
                setFutureWorks(sampleData.roadworks.map(work => ({
                  ...work,
                  duration: work.endDate ? 
                    Math.ceil((new Date(work.endDate) - new Date(work.startDate)) / (1000 * 60 * 60 * 24)) : 
                    'Unknown'
                })));
                return;
              }
            }
          } catch (sampleError) {
            console.log('📋 Sample data not available:', sampleError.message);
          }
          
          // Provide helpful fallback message if no sample data either
          setFutureWorks([{
            id: 'no-future-works',
            title: 'No Future Works Scheduled',
            location: 'Check back later for planned roadworks',
            startDate: new Date().toISOString(),
            source: 'info',
            description: 'StreetManager data shows no works scheduled to start in the future',
            impact: 'Info',
            duration: 'N/A',
            authority: 'Go BARRY System'
          }]);
        } else {
          setFutureWorks(futureStreetManagerWorks);
        }
      } else {
        console.warn('API response failed or no roadworks data:', data);
        setFutureWorks([{
          id: 'no-data-error',
          title: 'Data Loading Issue', 
          location: 'Check system connectivity',
          startDate: new Date().toISOString(),
          source: 'error',
          description: 'Unable to load future works from StreetManager'
        }]);
      }
      
    } catch (error) {
      console.error('Error loading future works:', error);
      
      // Provide more specific error handling based on error type
      let errorMessage = 'Unknown error occurred';
      let errorDetails = error.message;
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network Connection Issue';
        errorDetails = 'Check internet connection or backend availability';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request Timeout';
        errorDetails = 'Backend took longer than 8 seconds to respond';
      } else if (error.name === 'TimeoutError') {
        errorMessage = 'Request Timeout';
        errorDetails = 'Backend is taking too long to respond';
      }
      
      setFutureWorks([{
        id: 'fetch-error',
        title: errorMessage,
        location: 'System Error',
        startDate: new Date().toISOString(),
        source: 'error',
        description: errorDetails,
        impact: 'System',
        duration: 'Unknown',
        authority: 'Go BARRY System'
      }]);
    }
  };

  // Supervisor action handlers
  const handleAcknowledge = (alertId) => {
    Alert.alert(
      'Acknowledge Alert',
      'Mark this alert as acknowledged?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Acknowledge', 
          onPress: () => {
            // Update alert status - in real app would call API
            console.log(`Alert ${alertId} acknowledged by ${supervisorName}`);
            Alert.alert('Success', 'Alert acknowledged');
          }
        }
      ]
    );
  };

  const handlePlanDiversion = (alertId) => {
    setSelectedAlert(criticalAlerts.find(a => a.id === alertId));
    setShowDiversionModal(true);
  };

  const handleEscalate = (alertId) => {
    Alert.alert(
      'Escalate to Control Room',
      'This will immediately notify the control room of this critical situation.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Escalate', 
          style: 'destructive',
          onPress: () => {
            console.log(`Alert ${alertId} escalated by ${supervisorName}`);
            Alert.alert('Escalated', 'Control room has been notified');
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle dismiss alert
  const handleDismissAlert = async (alert) => {
    Alert.alert(
      'Dismiss Alert',
      'This will remove the alert from your view. It can be restored from the dismissed alerts list if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            try {
              const getBaseUrl = () => {
                if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                  return 'http://localhost:3001';
                }
                return 'https://go-barry.onrender.com';
              };
              const baseUrl = getBaseUrl();
              
              const response = await fetch(`${baseUrl}/api/streetmanager/actions/${alert.id}/dismiss`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: supervisor?.sessionId || 'temp-session',
                  dismissedBy: supervisor?.name || 'Supervisor',
                  reason: 'Dismissed by supervisor',
                  timestamp: new Date().toISOString()
                })
              });

              if (response.ok) {
                // Remove from current alerts
                setCriticalAlertsWithDebug(prev => prev.filter(a => a.id !== alert.id));
                Alert.alert('Success', 'Alert dismissed');
              } else {
                Alert.alert('Error', 'Failed to dismiss alert');
              }
            } catch (error) {
              console.error('Error dismissing alert:', error);
              Alert.alert('Error', 'Failed to dismiss alert');
            }
          }
        }
      ]
    );
  };

  // Handle map view
  const handleMapView = (alert) => {
    console.log('Map view clicked for alert:', alert.id, alert.location, 'Coordinates:', alert.coordinates, 'Source:', alert.coordinateSource);
    
    let mapUrl = '';
    let searchLocation = alert.location;
    let coordinateInfo = '';
    
    // If we have coordinates, use them for maximum precision
    if (alert.coordinates && alert.coordinates.length === 2) {
      const [lat, lng] = alert.coordinates;
      // Use coordinates with high zoom and hybrid view for maximum detail
      mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=h&layer=c`;
      coordinateInfo = `Precise coordinates (${alert.coordinateSource || 'webhook'}): ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      console.log('Using precise coordinates with zoom 18 and hybrid view:', mapUrl, 'Source:', alert.coordinateSource);
    } else {
      // Enhanced location parsing for better accuracy
      searchLocation = enhanceLocationString(alert.location);
      
      // Determine zoom level based on location specificity
      const zoomLevel = determineOptimalZoom(searchLocation);
      
      const searchQuery = encodeURIComponent(searchLocation.trim());
      mapUrl = `https://www.google.com/maps/search/${searchQuery}&z=${zoomLevel}`;
      coordinateInfo = `Location search (zoom ${zoomLevel}): ${searchLocation}`;
      
      console.log('Using enhanced location search:', searchLocation, 'Zoom:', zoomLevel, 'URL:', mapUrl);
    }
    
    // Try to open immediately first
    console.log('🔄 Attempting immediate window.open...');
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.open exists:', typeof window !== 'undefined' && !!window.open);
    
    try {
      if (typeof window !== 'undefined' && window.open) {
        console.log('✅ Calling window.open directly...');
        const newWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow && !newWindow.closed) {
          console.log('✅ Map opened successfully!');
          Alert.alert('Success', 'Map opened in new tab');
          return;
        } else {
          console.warn('❌ window.open failed or was blocked');
        }
      }
    } catch (error) {
      console.error('❌ Direct window.open failed:', error);
    }
    
    // If direct open failed, show dialog with options
    Alert.alert(
      'View on Map',
      `Location: ${searchLocation}\n\n${coordinateInfo}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy URL', 
          onPress: () => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(mapUrl).then(() => {
                Alert.alert('Copied!', 'Map URL copied to clipboard. You can paste it into your browser.');
              }).catch(err => {
                console.error('Failed to copy: ', err);
                Alert.alert('URL', `Please copy this URL manually:\n\n${mapUrl}`);
              });
            } else {
              Alert.alert('URL', `Please copy this URL manually:\n\n${mapUrl}`);
            }
          }
        },
        { 
          text: 'Try Again', 
          onPress: () => {
            console.log('🔄 Trying window.open again from dialog...');
            try {
              if (typeof window !== 'undefined') {
                const newWindow = window.open(mapUrl, '_blank');
                if (newWindow) {
                  console.log('✅ Second attempt successful!');
                } else {
                  console.warn('❌ Second attempt also failed');
                  Alert.alert('Popup Blocked', 'Your browser is blocking popups. Please:\n1. Allow popups for this site\n2. Or use "Copy URL" and paste into browser');
                }
              }
            } catch (error) {
              console.error('❌ Second attempt error:', error);
              Alert.alert('Error', 'Unable to open map. Please use "Copy URL" option.');
            }
          }
        }
      ]
    );
  };

  const handleAlertAction = async (alert, action) => {
    try {
      const getBaseUrl = () => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          return 'http://localhost:3001';
        }
        return 'https://go-barry.onrender.com';
      };
      const baseUrl = getBaseUrl();
      
      // Map frontend actions to backend endpoints
      let endpoint = '';
      let requestBody = {
        sessionId: supervisor?.sessionId || 'temp-session',
        notes: actionNotes || `${action} by ${supervisor?.name || 'Supervisor'}`,
        timestamp: new Date().toISOString()
      };
      
      if (action === 'acknowledge') {
        endpoint = `/api/streetmanager/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'reviewed';
      } else if (action === 'monitor') {
        endpoint = `/api/streetmanager/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'monitoring';
      } else if (action === 'escalate') {
        endpoint = `/api/streetmanager/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'escalated';
        requestBody.notes = `ESCALATED: ${actionNotes || 'Requires immediate attention'}`;
      } else if (action === 'plan_diversion') {
        endpoint = `/api/streetmanager/actions/${alert.id}/diversion`;
        requestBody.diversionRoute = actionNotes || 'Diversion plan to be determined';
      }
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        Alert.alert('Success', `Alert ${action} successfully`);
        setActionModalVisible(false);
        setActionNotes('');
        loadData(); // Refresh data
      } else {
        throw new Error('Failed to submit action');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit action. Please try again.');
    }
  };

  const openActionModal = (alert) => {
    setSelectedAlert(alert);
    setActionModalVisible(true);
  };

  const renderCriticalAlert = (alert, index) => (
    <View key={index} style={[styles.alertCard, { borderLeftColor: severityColors[alert.severity] }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <Text style={styles.alertTitle}>{alert.location}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityColors[alert.severity] }]}>
            <Text style={styles.severityText}>{alert.severity}</Text>
          </View>
        </View>
        <Text style={styles.alertSubtitle}>{alert.description}</Text>
      </View>

      <View style={styles.impactSection}>
        <Text style={styles.impactTitle}>Routes Affected:</Text>
        <View style={styles.routesContainer}>
          {alert.affectedRoutes?.map((route, idx) => (
            <View key={idx} style={styles.routeBadge}>
              <Text style={styles.routeNumber}>{route.number}</Text>
              <Text style={styles.confidenceScore}>{route.confidence}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.dateSection}>
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>START</Text>
            <Text style={[styles.dateValue, !alert.startDate && styles.dateUnknown]}>
              {alert.startDate ? formatDateTime(alert.startDate) : 'Awaiting dates'}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>END</Text>
            <Text style={[styles.dateValue, !alert.endDate && styles.dateUnknown]}>
              {alert.endDate ? formatDateTime(alert.endDate) : 'To be confirmed'}
            </Text>
          </View>
        </View>
        <View style={styles.durationBar}>
          <Text style={styles.durationText}>
            {alert.startDate && alert.endDate ? 
              `Duration: ${calculateDuration(alert.startDate, alert.endDate)}` :
              `Last updated: ${alert.startDate ? formatDateTime(alert.startDate) : 'Recently'}`
            }
          </Text>
        </View>
      </View>
      
      <View style={styles.alertDetails}>
        <Text style={styles.detailText}>Impact: {alert.expectedImpact}</Text>
        {alert.permitReference && (
          <Text style={styles.detailText}>Permit: {alert.permitReference}</Text>
        )}
      </View>

      <View style={styles.actionButtonsContainer}>
        {/* Primary Actions Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acknowledgeButton]}
            onPress={() => handleAlertAction(alert, 'acknowledge')}
          >
            <Text style={styles.actionButtonText}>Acknowledge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.planButton]}
            onPress={() => openActionModal(alert)}
          >
            <Text style={styles.actionButtonText}>Plan Diversion</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.monitorButton]}
            onPress={() => handleAlertAction(alert, 'monitor')}
          >
            <Text style={styles.actionButtonText}>Monitor</Text>
          </TouchableOpacity>
        </View>
        
        {/* Secondary Actions Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => handleMapView(alert)}
          >
            <Text style={styles.actionButtonText}>📍 Map View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.escalateButton]}
            onPress={() => handleAlertAction(alert, 'escalate')}
          >
            <Text style={styles.actionButtonText}>Escalate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dismissButton]}
            onPress={() => handleDismissAlert(alert)}
          >
            <Text style={styles.actionButtonText}>✕ Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRouteImpact = (route, index) => (
    <View key={index} style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>Service {route.number}</Text>
        <View style={styles.impactMetrics}>
          <Text style={styles.impactCount}>{route.activeDisruptions} active</Text>
          <Text style={styles.confidenceAvg}>Avg: {route.avgConfidence}%</Text>
        </View>
      </View>
      
      <Text style={styles.routeDescription}>{route.description}</Text>
      
      <View style={styles.disruptionsList}>
        {route.disruptions?.slice(0, 3).map((disruption, idx) => (
          <View key={idx} style={styles.disruptionItem}>
            <Text style={styles.disruptionLocation}>{disruption.location}</Text>
            <Text style={styles.disruptionImpact}>{disruption.impact}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => {/* Navigate to detailed route view */}}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFutureWork = (work, index) => (
    <View key={index} style={styles.futureWorkCard}>
      <View style={styles.futureWorkHeader}>
        <Text style={styles.futureWorkTitle}>{work.location}</Text>
        <Text style={styles.futureWorkDate}>
          {new Date(work.plannedStartDate).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.futureWorkDescription}>{work.description}</Text>
      
      <View style={styles.planningActions}>
        <TouchableOpacity style={styles.planAheadButton}>
          <Text style={styles.planAheadText}>Plan Ahead</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.setReminderButton}>
          <Text style={styles.setReminderText}>Set Reminder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'critical':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Critical Alerts Requiring Attention</Text>
            {criticalAlerts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyState}>No StreetManager roadworks for proactive planning</Text>
                <Text style={styles.emptySubtext}>
                  Roadworks Manager shows StreetManager webhook data for advance planning.
                  Control room disruptions are managed separately in the Disruption Database.
                  Check console for data source debugging.
                </Text>
              </View>
            ) : (
              criticalAlerts.map(renderCriticalAlert)
            )}
          </View>
        );
      
      case 'routes':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Route Impact Overview</Text>
            {routeImpacts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyState}>No route impacts detected</Text>
                <Text style={styles.emptySubtext}>
                  Route impact analysis from StreetManager webhook data will appear here for proactive planning
                </Text>
              </View>
            ) : (
              routeImpacts.map(renderRouteImpact)
            )}
          </View>
        );
      
      case 'planning':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Advance Planning ({filters.timeframe} days ahead)</Text>
            {futureWorks.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyState}>No future StreetManager roadworks</Text>
                <Text style={styles.emptySubtext}>
                  Future roadworks from StreetManager webhooks will appear here for advance planning.
                  This helps supervisors prepare diversions before works begin.
                </Text>
              </View>
            ) : (
              futureWorks.map(renderFutureWork)
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Roadworks Manager</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>StreetManager webhook data for proactive planning • Disruptions managed separately</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Severity:</Text>
          <View style={styles.filterButtons}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.filterButton,
                  filters.severity === severity && styles.activeFilterButton
                ]}
                onPress={() => setFilters({...filters, severity})}
              >
                <Text style={[
                  styles.filterButtonText,
                  filters.severity === severity && styles.activeFilterButtonText
                ]}>
                  {severity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Area:</Text>
          <View style={styles.filterButtons}>
            {areas.slice(0, 4).map(area => (
              <TouchableOpacity
                key={area}
                style={[
                  styles.filterButton,
                  filters.area === area && styles.activeFilterButton
                ]}
                onPress={() => setFilters({...filters, area})}
              >
                <Text style={[
                  styles.filterButtonText,
                  filters.area === area && styles.activeFilterButtonText
                ]}>
                  {area}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'critical' && styles.activeTab]}
          onPress={() => setActiveTab('critical')}
        >
          <Text style={[styles.tabText, activeTab === 'critical' && styles.activeTabText]}>
            Critical Alerts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
            Route Impacts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'planning' && styles.activeTab]}
          onPress={() => setActiveTab('planning')}
        >
          <Text style={[styles.tabText, activeTab === 'planning' && styles.activeTabText]}>
            Advance Planning
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Plan Diversion</Text>
            <Text style={styles.modalSubtitle}>
              {selectedAlert?.location}
            </Text>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about the diversion plan..."
              multiline
              numberOfLines={4}
              value={actionNotes}
              onChangeText={setActionNotes}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={() => handleAlertAction(selectedAlert, 'plan_diversion')}
              >
                <Text style={styles.modalSubmitText}>Submit Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 80,
  },
  filterButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#1e40af',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1e40af',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  alertHeader: {
    marginBottom: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  impactSection: {
    marginBottom: 12,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginRight: 4,
  },
  confidenceScore: {
    fontSize: 10,
    color: '#6b7280',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateSection: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dateUnknown: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  durationBar: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  acknowledgeButton: {
    backgroundColor: '#10b981',
  },
  planButton: {
    backgroundColor: '#f59e0b',
  },
  monitorButton: {
    backgroundColor: '#6366f1',
  },
  escalateButton: {
    backgroundColor: '#ef4444',
  },
  mapButton: {
    backgroundColor: '#059669',
  },
  dismissButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  impactMetrics: {
    flexDirection: 'row',
  },
  impactCount: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    marginRight: 8,
  },
  confidenceAvg: {
    fontSize: 12,
    color: '#6b7280',
  },
  routeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  disruptionsList: {
    marginBottom: 12,
  },
  disruptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  disruptionLocation: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  disruptionImpact: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  viewDetailsButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  futureWorkCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  futureWorkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  futureWorkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  futureWorkDate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  futureWorkDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  planningActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planAheadButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  planAheadText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  setReminderButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  setReminderText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RoadworksManagerDashboard;