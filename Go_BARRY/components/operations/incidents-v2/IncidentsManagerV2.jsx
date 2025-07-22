/*
 * Go Barry - Incidents Manager V2
 * Modern redesigned incidents management interface
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../../hooks/useSupervisorSession';
import { incidentsStyles, colors, spacing, shadows } from './styles/incidents.styles';
import StatsCard, { StatCardPresets } from './components/StatsCard';
import IncidentCard from './components/IncidentCard';
import CreateIncidentModal from './components/CreateIncidentModal';
import MessageGenerator from './components/MessageGenerator';
import ActionRemindersModal from './components/ActionRemindersModal';
import QuickActionsToolbar from './components/toolbar/QuickActionsToolbar';
import BulkUpdateModal from './components/toolbar/BulkUpdateModal';
import { exportIncidentsToExcel, exportForDisruptionDatabase } from './utils/excelExport';
import { useIncidentWebSocket, WebSocketStatus } from './hooks/useIncidentWebSocket';
import { enhanceIncidentsLocations } from './services/geocodingService';
import AdoptIncidentModal from './components/AdoptIncidentModal';
import IncidentMap from './components/IncidentMap';
import ActionSuggestions from '../../ai/ActionSuggestions';

const IncidentsManagerV2 = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisor();

  // State management
  const [incidents, setIncidents] = useState([]);
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageGenerator, setShowMessageGenerator] = useState(false);
  const [messageIncident, setMessageIncident] = useState(null);
  const [showTrafficAlerts, setShowTrafficAlerts] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showActionReminders, setShowActionReminders] = useState(false);
  const [createdIncident, setCreatedIncident] = useState(null);
  const [createdMessages, setCreatedMessages] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState(30000); // 30 seconds
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true); // Enable WebSocket by default
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [incidentToAdopt, setIncidentToAdopt] = useState(null);
  const [groupByRoute, setGroupByRoute] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsIncident, setSuggestionsIncident] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    affectedRoutes: [],
    searchQuery: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    high: 0,
    routesAffected: 0,
    averageResolutionTime: 0,
    manual: 0,
    traffic: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid', badge: null },
    { id: 'active', label: 'Active', icon: 'alert-circle', badge: stats.active > 0 ? stats.active : null },
    { id: 'timeline', label: 'Timeline', icon: 'time', badge: null },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', badge: null },
    { id: 'templates', label: 'Templates', icon: 'folder', badge: null },
  ];

  // Check if roadwork affects Go North East routes
  const affectsGNERoutes = (incident) => {
    if (!incident.affectsRoutes || !Array.isArray(incident.affectsRoutes)) {
      return false;
    }
    
    // Check if any affected route is a GNE route (starts with route numbers 1-999 or has GNE prefix)
    return incident.affectsRoutes.some(route => {
      const routeStr = String(route).toUpperCase();
      return routeStr.includes('GNE') || /^[1-9][0-9]{0,2}[A-Z]?$/.test(routeStr);
    });
  };

  // Geographic bounds for North East England
  const isInNorthEastRegion = (lat, lng) => {
    if (!lat || !lng) return false;
    const northEastBounds = {
      north: 56.0,  // Scottish border
      south: 54.0,  // Yorkshire border
      east: -0.5,   // North Sea coast
      west: -3.0    // Cumbrian border
    };
    return lat >= northEastBounds.south && 
           lat <= northEastBounds.north && 
           lng >= northEastBounds.west && 
           lng <= northEastBounds.east;
  };

  // Fetch live traffic incidents from TomTom
  const fetchTrafficIncidents = async () => {
    setLoadingTraffic(true);
    try {
      console.log('🚦 Fetching live traffic incidents from TomTom...');
      console.log('🔗 Using baseUrl:', baseUrl);
      
      // Use the main alerts endpoint
      const url = `${baseUrl}/api/alerts`;
      console.log('📡 Full URL:', url);
      
      // Test basic connectivity first
      console.log('🔍 Testing basic connectivity...');
      try {
        const testResponse = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ Basic connectivity test:', testResponse.ok ? 'SUCCESS' : 'FAILED');
      } catch (testError) {
        console.error('❌ Basic connectivity test failed:', testError);
        // Continue anyway, might be a specific endpoint issue
      }
      
      // Create abort controller for timeout - increased to 45 seconds for traffic data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'same-origin',
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📡 Response data:', data);
      
      if (data.success) {
        console.log(`📊 Raw alerts received: ${(data.alerts || []).length}`);
        
        // Count roadworks before filtering
        const roadworksCount = (data.alerts || []).filter(alert => {
          return alert.type === 'roadwork' || alert.type === 'roadworks' || 
                 alert.type === 'Road Works' || alert.type === 'Road Work' ||
                 (alert.title && alert.title.toLowerCase().includes('road work')) ||
                 (alert.description && alert.description.toLowerCase().includes('road work'));
        }).length;
        
        console.log(`🚧 Filtering out ${roadworksCount} roadworks (handled by Roadworks Manager)`);
        
        // Filter for traffic-type alerts from TomTom and National Highways
        // Include incidents as they represent traffic issues
        const trafficAlerts = (data.alerts || [])
          .filter(alert => {
            // Exclude roadworks - they're handled by Roadworks Manager via StreetManager
            if (alert.type === 'roadwork' || alert.type === 'roadworks') return false;
            if (alert.type === 'Road Works' || alert.type === 'Road Work') return false;
            if (alert.title && alert.title.toLowerCase().includes('road work')) return false;
            if (alert.description && alert.description.toLowerCase().includes('road work')) return false;
            
            // Include traffic incidents from TomTom and National Highways
            if (alert.source === 'tomtom' || alert.source === 'nationalHighways') {
              // But still exclude if it's roadwork-related
              if (alert.type && alert.type.toLowerCase().includes('road')) return false;
              return true;
            }
            
            // Include any traffic or incident type (but not roadworks)
            if (alert.type === 'traffic' || alert.type === 'incident' || alert.type === 'congestion') return true;
            
            return false;
          })
          .map(alert => ({
            id: alert.id || `traffic-${Date.now()}-${Math.random()}`,
            title: alert.title || alert.description || 'Traffic Alert',
            description: alert.description || alert.title || '',
            location: alert.location || 'Unknown Location',
            coordinates: alert.coordinates ? {
              lat: alert.coordinates.lat || alert.coordinates.latitude || alert.coordinates[0],
              lng: alert.coordinates.lng || alert.coordinates.longitude || alert.coordinates.lon || alert.coordinates[1]
            } : null,
            type: alert.type || 'traffic',
            severity: alert.severity || 'Medium',
            priority: alert.severity === 'High' ? 'high' : alert.severity === 'Medium' ? 'medium' : 'low',
            status: alert.status || 'active',
            source: alert.source || 'traffic_alert',
            isTrafficIncident: true,
            affectsRoutes: alert.affectsRoutes || [],
            affectedRoutes: alert.affectsRoutes || [],
            delayMinutes: alert.delayMinutes,
            lengthMeters: alert.lengthMeters,
            intelligenceScore: alert.routeAccuracy || alert.confidenceScore || 50,
            createdAt: alert.startDate || alert.lastUpdated || new Date().toISOString(),
            startTime: alert.startDate || alert.lastUpdated || new Date().toISOString(),
            lastUpdated: alert.lastUpdated || new Date().toISOString()
          }));
        
        // Deduplicate alerts based on location and title
        const seen = new Set();
        const deduplicatedAlerts = trafficAlerts.filter(alert => {
          // Create a normalized key for deduplication
          const titleNorm = (alert.title || '').toLowerCase().trim();
          const locationNorm = (alert.location || '').toLowerCase().trim();
          
          // For generic "North East England" roadworks, use a more specific key
          let key;
          if (locationNorm === 'north east england' && titleNorm.includes('road works')) {
            // Try to extract more specific location from description if available
            const descNorm = (alert.description || '').toLowerCase().trim();
            key = `roadworks-${descNorm || titleNorm}-${alert.id}`;
          } else {
            // Normal deduplication key
            key = `${locationNorm}-${titleNorm}`;
          }
          
          if (seen.has(key)) {
            console.log(`🔄 Duplicate filtered: ${alert.title} at ${alert.location}`);
            return false;
          }
          
          seen.add(key);
          return true;
        });
        
        console.log(`✅ Fetched ${trafficAlerts.length} alerts, ${deduplicatedAlerts.length} after deduplication`);
        
        // Enhance traffic incidents with geocoding
        const enhancedTrafficAlerts = await enhanceIncidentsLocations(deduplicatedAlerts, baseUrl);
        setTrafficIncidents(enhancedTrafficAlerts);
        
        if (trafficAlerts.length > 0 && Platform.OS === 'web') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Traffic Alerts Updated', {
              body: `${trafficAlerts.length} live traffic incidents detected`,
              icon: '/favicon.ico'
            });
          }
        }
        
        return trafficAlerts;
      } else {
        console.error('❌ Failed to fetch traffic incidents:', data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching traffic incidents:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        console.warn('⚠️ Traffic incidents fetch timed out - using cached data if available');
        setErrorMessage(null); // Don't show error for timeouts
        
        // Try again without timeout for debugging
        console.log('🔄 Attempting retry without timeout...');
        try {
          const retryResponse = await fetch(`${baseUrl}/api/alerts`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'same-origin',
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log('✅ Retry successful:', retryData);
            if (retryData.success) {
              const trafficAlerts = (retryData.alerts || [])
                .filter(alert => {
                  // Exclude roadworks - they're handled by Roadworks Manager via StreetManager
                  if (alert.type === 'roadwork' || alert.type === 'roadworks') return false;
                  if (alert.type === 'Road Works' || alert.type === 'Road Work') return false;
                  if (alert.title && alert.title.toLowerCase().includes('road work')) return false;
                  if (alert.description && alert.description.toLowerCase().includes('road work')) return false;
                  
                  // Include traffic incidents from TomTom and National Highways
                  if (alert.source === 'tomtom' || alert.source === 'nationalHighways') {
                    // But still exclude if it's roadwork-related
                    if (alert.type && alert.type.toLowerCase().includes('road')) return false;
                    return true;
                  }
                  
                  // Include any traffic or incident type (but not roadworks)
                  if (alert.type === 'traffic' || alert.type === 'incident' || alert.type === 'congestion') return true;
                  
                  return false;
                })
                .map(alert => ({
                  id: alert.id || `traffic-${Date.now()}-${Math.random()}`,
                  title: alert.title || alert.description || 'Traffic Alert',
                  description: alert.description || alert.title || '',
                  location: alert.location || 'Unknown Location',
                  coordinates: alert.coordinates || null,
                  type: alert.type || 'traffic',
                  severity: alert.severity || 'Medium',
                  priority: alert.severity === 'High' ? 'high' : alert.severity === 'Medium' ? 'medium' : 'low',
                  status: alert.status || 'active',
                  source: alert.source || 'traffic_alert',
                  isTrafficIncident: true,
                  affectsRoutes: alert.affectsRoutes || [],
                  affectedRoutes: alert.affectsRoutes || [],
                  delayMinutes: alert.delayMinutes,
                  lengthMeters: alert.lengthMeters,
                  intelligenceScore: alert.routeAccuracy || alert.confidenceScore || 50,
                  createdAt: alert.startDate || alert.lastUpdated || new Date().toISOString(),
                  startTime: alert.startDate || alert.lastUpdated || new Date().toISOString(),
                  lastUpdated: alert.lastUpdated || new Date().toISOString()
                }));
              
              // Deduplicate retry results too
              const deduplicatedAlerts = trafficAlerts.reduce((unique, alert) => {
                const key = `${alert.location}-${alert.title}`.toLowerCase();
                if (!unique.find(a => `${a.location}-${a.title}`.toLowerCase() === key)) {
                  unique.push(alert);
                }
                return unique;
              }, []);
              
              console.log(`✅ Retry fetched ${trafficAlerts.length} alerts, ${deduplicatedAlerts.length} after deduplication`);
              setTrafficIncidents(deduplicatedAlerts);
              setErrorMessage(null);
              return trafficAlerts;
            }
          }
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
        }
      } else if (error.name === 'TypeError' && error.message === 'Load failed') {
        console.log('🔄 Attempting fallback connectivity test...');
        try {
          const fallbackTest = await fetch('http://localhost:3001/', { method: 'HEAD' });
          console.log('🔄 Fallback test result:', fallbackTest.status);
        } catch (fallbackError) {
          console.error('❌ Fallback test also failed:', fallbackError);
        }
      }
      
      setErrorMessage(`Failed to load traffic data: ${error.message}`);
      return [];
    } finally {
      setLoadingTraffic(false);
    }
  };

  // Fetch incidents data
  const fetchIncidents = useCallback(async (showLoading = true) => {
    console.log('🚨 fetchIncidents called with baseUrl:', baseUrl);
    if (showLoading) setLoading(true);
    
    let manualData = { incidents: [] };
    
    try {
      // Fetch manual incidents
      const manualController = new AbortController();
      const manualTimeout = setTimeout(() => manualController.abort(), 10000);
      
      try {
        const manualUrl = `${baseUrl}/api/incidents`;
        console.log('📡 Fetching manual incidents from:', manualUrl);
        const manualResponse = await fetch(manualUrl, {
          signal: manualController.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId || ''
          }
        });
        clearTimeout(manualTimeout);
        
        console.log('📡 Manual response status:', manualResponse.status);
        if (manualResponse.ok) {
          manualData = await manualResponse.json();
          console.log('📡 Manual data:', manualData);
        } else {
          console.warn('Manual incidents API returned:', manualResponse.status);
        }
      } catch (manualError) {
        console.warn('Manual incidents fetch failed:', manualError.message);
      }
      
      // Process and validate data
      const validManualIncidents = Array.isArray(manualData.incidents) ? manualData.incidents : [];
      
      // Enhance incidents with better location data
      const enhancedManualIncidents = await enhanceIncidentsLocations(validManualIncidents, baseUrl);
      
      // Always update with backend data to stay in sync
      console.log(`📝 Updating incidents state with ${enhancedManualIncidents.length} enhanced incidents from backend`);
      
      // Always fetch traffic incidents on initial load
      if (showTrafficAlerts) {
        await fetchTrafficIncidents();
      }
      
      console.log('🔍 API Results Summary:');
      console.log('🔍 Manual incidents count:', enhancedManualIncidents.length);
      console.log('🔍 Traffic incidents count:', trafficIncidents.length);
      console.log('🔍 Show traffic alerts:', showTrafficAlerts);
      
      setIncidents(enhancedManualIncidents);
      
      // Calculate statistics
      calculateStats(enhancedManualIncidents, showTrafficAlerts ? trafficIncidents : []);
      setLastUpdate(new Date());
      
      // TEMPORARILY DISABLED: Apply North East filtering to stats calculation  
      // For debugging, use all incidents without filtering
      const neManualIncidents = enhancedManualIncidents;
      const neTrafficIncidents = showTrafficAlerts ? trafficIncidents : [];
      
      console.log('🔍 DEBUG: Stats using ALL incidents without GNE filtering');
      
      // Force a stats update with immediate values for debugging
      const immediateStats = {
        total: neManualIncidents.length + neTrafficIncidents.length,
        active: neManualIncidents.filter(i => i.status === 'active').length + 
                neTrafficIncidents.filter(i => i.status === 'active').length,
        high: neManualIncidents.filter(i => i.priority === 'high').length + 
              neTrafficIncidents.filter(i => i.priority === 'high').length,
        traffic: neTrafficIncidents.length,
        manual: neManualIncidents.length,
        routesAffected: 0,
        averageResolutionTime: 0
      };
      setStats(immediateStats);
      
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl, sessionId, showTrafficAlerts, trafficIncidents.length]); // Added proper dependencies


  // Calculate statistics from incidents data
  const calculateStats = (manual, traffic) => {
    console.log('📊 Calculating stats for:', {
      manual: manual.length,
      traffic: traffic.length
    });
    
    const manualActive = manual.filter(i => i.status === 'active');
    const manualHigh = manual.filter(i => i.priority === 'high');
    
    const trafficActive = traffic.filter(i => i.status === 'active');
    const trafficHigh = traffic.filter(i => i.priority === 'high');
    
    // Count affected routes (deduplicated)
    const allAffectedRoutes = new Set();
    [...manual, ...traffic].forEach(i => {
      if (i.affectsRoutes) {
        i.affectsRoutes.forEach(route => allAffectedRoutes.add(route));
      }
    });
    
    const newStats = {
      total: manual.length + traffic.length,
      active: manualActive.length + trafficActive.length,
      high: manualHigh.length + trafficHigh.length,
      routesAffected: allAffectedRoutes.size,
      traffic: traffic.length,
      manual: manual.length,
      averageResolutionTime: 0 // TODO: Calculate from historical data
    };
    
    console.log('📊 New stats calculated:', newStats);
    setStats(newStats);
  };


  // Real-time update state - moved to top with other state variables

  // WebSocket handlers
  const handleWebSocketIncidentCreated = useCallback((incident) => {
    console.log('🆕 WebSocket: New incident created:', incident.id);
    // Add to incidents list if not already present
    setIncidents(prev => {
      const exists = prev.some(i => i.id === incident.id);
      if (exists) return prev;
      return [incident, ...prev];
    });
    // Update stats
    calculateStats([...incidents, incident], trafficIncidents);
  }, [incidents, trafficIncidents]);

  const handleWebSocketIncidentUpdated = useCallback((incident) => {
    console.log('🔄 WebSocket: Incident updated:', incident.id);
    // Update incident in list
    setIncidents(prev => prev.map(i => i.id === incident.id ? incident : i));
  }, []);

  const handleWebSocketIncidentResolved = useCallback((incidentId) => {
    console.log('✅ WebSocket: Incident resolved:', incidentId);
    // Update incident status
    setIncidents(prev => prev.map(i => 
      i.id === incidentId ? { ...i, status: 'resolved', resolvedAt: new Date().toISOString() } : i
    ));
  }, []);

  const handleWebSocketConnectionChange = useCallback((connected) => {
    console.log('🔌 WebSocket connection:', connected ? 'Connected' : 'Disconnected');
    setConnectionStatus(connected ? 'online' : 'offline');
    // If reconnected, fetch latest data
    if (connected && fetchIncidents) {
      fetchIncidents(false);
    }
  }, [fetchIncidents]);

  // Initialize WebSocket connection
  const {
    isConnected: wsConnected,
    connectionStatus: wsStatus,
    lastHeartbeat,
    isPolling,
    emitIncidentCreated,
    emitIncidentUpdated,
    emitIncidentResolved
  } = useIncidentWebSocket({
    sessionId,
    supervisorName,
    onIncidentCreated: handleWebSocketIncidentCreated,
    onIncidentUpdated: handleWebSocketIncidentUpdated,
    onIncidentResolved: handleWebSocketIncidentResolved,
    onConnectionChange: handleWebSocketConnectionChange
  });

  // Initial load and authentication check
  useEffect(() => {
    if (!isLoggedIn || !baseUrl) return;

    // Initial load - fetch both manual and traffic incidents
    fetchIncidents();
    
    // Adaptive refresh frequency based on activity
    const getRefreshInterval = () => {
      const activeCount = stats.active || 0;
      const highPriorityCount = stats.high || 0;
      
      // More frequent updates when there are active/high priority incidents
      if (highPriorityCount > 0) return 30000; // 30 seconds for high priority
      if (activeCount > 3) return 45000; // 45 seconds for multiple active
      if (activeCount > 0) return 60000; // 60 seconds for some active
      return 120000; // 2 minutes for quiet periods
    };

    let intervalId;
    
    const setupInterval = () => {
      if (intervalId) clearInterval(intervalId);
      const frequency = getRefreshInterval();
      
      intervalId = setInterval(() => {
        fetchIncidents(false);
        // Update frequency might change based on new data
        if (getRefreshInterval() !== frequency) {
          setupInterval(); // Reset with new frequency
        }
      }, frequency);
      
      setUpdateFrequency(frequency);
    };

    if (isRealTimeEnabled) {
      setupInterval();
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn, baseUrl, sessionId, showTrafficAlerts, supervisorName, supervisorRole]); // Added missing dependencies

  // Auto-refresh for traffic data
  useEffect(() => {
    if (!autoRefreshEnabled || !showTrafficAlerts || !isLoggedIn) return;
    
    // Initial fetch when toggled on
    fetchTrafficIncidents();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchTrafficIncidents();
    }, 120000); // 2 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, [autoRefreshEnabled, showTrafficAlerts, isLoggedIn]);

  // Memoised filtering function for better performance
  const filteredIncidents = useMemo(() => {
    try {
      // Get all incidents based on filter settings
      const manualIncidents = incidents || [];
      const trafficIncidentsToShow = showTrafficAlerts ? trafficIncidents : [];
      
      // Combine and sort by severity/priority
      let allIncidents = [...manualIncidents, ...trafficIncidentsToShow];
      
      // Transform incidents to consistent format
      allIncidents = allIncidents.map(incident => ({
        ...incident,
        id: incident.id || `incident-${Date.now()}-${Math.random()}`,
        type: incident.type || 'other',
        priority: incident.priority || 'medium',
        status: incident.status || 'active',
        title: incident.title || incident.description || 'Untitled Incident',
        location: incident.location || 'Location TBC',
        affectsRoutes: incident.affectsRoutes || [],
        source: incident.source || 'manual',
        isTrafficIncident: trafficIncidentsToShow.includes(incident),
        delayMinutes: incident.delayMinutes,
        lengthMeters: incident.lengthMeters,
        intelligenceScore: incident.intelligenceScore || 0
      }));

      // Sort by priority and intelligence score
      allIncidents.sort((a, b) => {
        // High priority first
        if (a.priority !== b.priority) {
          if (a.priority === 'high') return -1;
          if (b.priority === 'high') return 1;
        }
        // Then by intelligence score
        return (b.intelligenceScore || 0) - (a.intelligenceScore || 0);
      });

      // Apply GNE filtering for Go North East operations
      const preFilterCount = allIncidents.length;
      
      // TEMPORARILY DISABLED FOR DEBUGGING
      // allIncidents = allIncidents.filter(incident => {
      //   // Check if incident affects GNE routes
      //   const hasGNERoutes = affectsGNERoutes(incident);
      //   
      //   // Check if incident is in North East region
      //   const inNorthEast = incident.coordinates && 
      //                      isInNorthEastRegion(incident.coordinates.lat, incident.coordinates.lng);
      //   
      //   // Include if it affects GNE routes OR is in North East region
      //   const shouldInclude = hasGNERoutes || inNorthEast;
      //   
      //   return shouldInclude;
      // });
      
      console.log(`🎯 GNE filtering: DISABLED FOR DEBUGGING - showing all ${allIncidents.length} incidents`);

      // Filter by active tab
      if (activeTab === 'active') {
        allIncidents = allIncidents.filter(i => i.status === 'active');
      }

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        allIncidents = allIncidents.filter(i => i.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        allIncidents = allIncidents.filter(i => i.priority === filters.priority);
      }
      if (filters.type && filters.type !== 'all') {
        allIncidents = allIncidents.filter(i => i.type === filters.type);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        allIncidents = allIncidents.filter(i => {
          const title = (i.title || '').toLowerCase();
          const location = (i.location || '').toLowerCase();
          const description = (i.description || '').toLowerCase();
          return title.includes(query) || location.includes(query) || description.includes(query);
        });
      }

      console.log('🔍 Final filtered incidents:', allIncidents.length);
      return allIncidents;
    } catch (error) {
      console.error('Error filtering incidents:', error);
      return [];
    }
  }, [incidents, trafficIncidents, activeTab, filters]);

  // Memoised callback functions for better performance
  const handleStatPress = useCallback((statType) => {
    switch (statType) {
      case 'active':
        setActiveTab('active');
        setViewMode('list');
        break;
      default:
        setViewMode('list');
    }
  }, []);

  // Handle view incident on map
  const handleViewMap = useCallback((incident) => {
    console.log('🗺️ View incident on map:', incident);
    console.log('🗺️ Incident location:', incident.location);
    console.log('🗺️ Incident coordinates:', incident.coordinates);
    
    // Enhanced coordinate validation
    const validateCoordinates = (coords) => {
      if (!coords || typeof coords !== 'object') return false;
      
      const lat = coords.lat || coords.latitude;
      const lng = coords.lng || coords.longitude || coords.lon;
      
      // Check if coordinates are valid numbers within reasonable ranges
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      if (isNaN(lat) || isNaN(lng)) return false;
      if (lat < -90 || lat > 90) return false;
      if (lng < -180 || lng > 180) return false;
      
      return { lat, lng };
    };
    
    // Try to use coordinates first
    const validCoords = validateCoordinates(incident.coordinates);
    if (validCoords) {
      // Open in map view instead of external Google Maps
      setSelectedIncident(incident);
      setShowMap(true);
      return;
    }
    
    // If no valid coordinates, try to search by location name
    if (incident.location && incident.location !== 'Unknown Location' && incident.location.trim()) {
      // Still open map view, it will try to geocode the location
      setSelectedIncident(incident);
      setShowMap(true);
      return;
    }
    
    // No valid location data available
    console.warn('🗺️ No valid location data for incident:', {
      id: incident.id,
      coordinates: incident.coordinates,
      location: incident.location
    });
    alert('No location data available for this incident');
  }, []);

  // Handle promote traffic incident to manual incident
  const handlePromoteToIncident = useCallback((trafficIncident) => {
    console.log('📈 Opening adopt modal for traffic incident:', trafficIncident.id);
    setIncidentToAdopt(trafficIncident);
    setShowAdoptModal(true);
  }, []);

  // Handle incident adoption complete
  const handleIncidentAdopted = useCallback((adoptedIncident) => {
    console.log('✅ Traffic incident adopted:', adoptedIncident.id);
    
    // Add to manual incidents
    setIncidents(prev => [adoptedIncident, ...prev]);
    
    // Update stats
    calculateStats([adoptedIncident, ...incidents], trafficIncidents);
    
    // Close modal
    setShowAdoptModal(false);
    setIncidentToAdopt(null);
    
    // Show success message
    if (Platform.OS === 'web') {
      alert(`Traffic incident successfully adopted as manual incident "${adoptedIncident.title}"`);
    }
    
    // Emit via WebSocket if connected
    if (wsConnected && emitIncidentCreated) {
      emitIncidentCreated(adoptedIncident);
    }
  }, [incidents, trafficIncidents, wsConnected, emitIncidentCreated]);

  // Handle push to display
  const handlePushToDisplay = useCallback(async (incident) => {
    console.log('📺 Push incident to display:', incident.id);
    
    try {
      // Push via API
      const response = await fetch(`${baseUrl}/api/display/push-incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        body: JSON.stringify({
          incident: {
            ...incident,
            displayPriority: 'high',
            displayedAt: new Date().toISOString(),
            displayedBy: supervisorName
          },
          displayOptions: {
            autoZoom: true,
            highlightIncident: true,
            showRoutes: true,
            duration: 30000, // Show for 30 seconds
            zoomLevel: 15
          },
          supervisorData: {
            supervisorName: supervisorName,
            supervisorRole: supervisorRole,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Incident pushed to display via API:', result);
        
        // Show success message
        if (Platform.OS === 'web') {
          alert(`Incident "${incident.title || incident.description}" has been pushed to the control room display`);
        } else {
          Alert.alert('Success', 'Incident pushed to control room display');
        }
      } else {
        throw new Error(`API returned ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error pushing to display:', error);
      const errorMsg = 'Failed to push incident to display. Please try again.';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  }, [baseUrl, supervisorName, supervisorRole, sessionId]);

  // Handler for when a new incident is created
  const handleIncidentCreated = useCallback((newIncident) => {
    console.log('🎉 New incident created:', newIncident);
    
    // Add the new incident to the existing list immediately for instant feedback
    setIncidents(prevIncidents => [newIncident, ...prevIncidents]);
    
    // Update stats immediately
    const newManualCount = incidents.length + 1;
    const newTotal = newManualCount + trafficIncidents.length;
    setStats(prevStats => ({
      ...prevStats,
      total: newTotal,
      manual: newManualCount,
      active: prevStats.active + 1 // New incidents are active by default
    }));
    
    // Don't refresh immediately - let the user see their incident
    // The auto-refresh will pick it up later if enabled
    console.log('✅ Incident added to local state without refresh');
    
    // Emit via WebSocket if connected
    if (wsConnected && emitIncidentCreated) {
      console.log('📡 Emitting incident creation via WebSocket');
      emitIncidentCreated(newIncident);
    }
  }, [incidents.length, trafficIncidents.length, wsConnected, emitIncidentCreated]);

  // Handle generate messages
  const handleGenerateMessages = useCallback((incident) => {
    console.log('💬 Generate messages for incident:', incident.id);
    setMessageIncident(incident);
    setShowMessageGenerator(true);
  }, []);

  // Handle view AI suggestions
  const handleViewSuggestions = useCallback((incident) => {
    console.log('🤖 View AI suggestions for incident:', incident.id);
    setSuggestionsIncident(incident);
    setShowSuggestions(true);
  }, []);

  // Handle AI suggestion action selected
  const handleSuggestionAction = useCallback((action) => {
    console.log('🤖 AI suggestion action selected:', action);
    
    // Handle different action types
    if (action.type === 'message' && action.template) {
      // Open message generator with pre-filled template
      setMessageIncident(suggestionsIncident);
      setShowMessageGenerator(true);
      // You might want to pass the template to the message generator
    } else if (action.action.includes('alert') || action.action.includes('notify')) {
      // Could open messaging modal or create alert
      alert(`Action: ${action.action}\nReason: ${action.reason}`);
    } else {
      // Generic action handling
      alert(`Action: ${action.action}\nReason: ${action.reason}`);
    }
    
    // Close suggestions modal
    setShowSuggestions(false);
    setSuggestionsIncident(null);
  }, [suggestionsIncident]);

  // Handle messages saved
  const handleMessagesSaved = useCallback(async (messages) => {
    console.log('💾 Messages saved:', messages);
    
    // Update the incident with the generated messages
    if (messageIncident) {
      try {
        const response = await fetch(`${baseUrl}/api/incidents/${messageIncident.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            lastMessageUpdate: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          console.log('✅ Messages saved to incident');
          // Optionally refresh incidents to show updated message status
          fetchIncidents(false);
        }
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
    
    // Show success message
    if (Platform.OS === 'web') {
      alert('Messages generated successfully! Use the copy buttons to paste into each platform.');
    }
  }, [messageIncident, baseUrl]);

  // Handle showing action reminders after incident creation
  const handleShowActionReminders = useCallback((incident, messages) => {
    console.log('🎯 Showing action reminders for incident:', incident.id);
    setCreatedIncident(incident);
    setCreatedMessages(messages);
    setShowActionReminders(true);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncidents(false);
  }, [fetchIncidents]); // Added fetchIncidents dependency

  // Handle recent location select
  const handleRecentLocationSelect = useCallback((location) => {
    console.log('📍 Using recent location:', location);
    // Open create modal with pre-filled location
    setShowCreateModal(true);
    // You'll need to pass this location data to the CreateIncidentModal
  }, []);

  // Handle my routes toggle
  const handleMyRoutesToggle = useCallback((route) => {
    console.log('🚌 Toggling route filter:', route);
    setFilters(prev => {
      const currentRoutes = prev.affectedRoutes || [];
      const isSelected = currentRoutes.includes(route);
      
      return {
        ...prev,
        affectedRoutes: isSelected 
          ? currentRoutes.filter(r => r !== route)
          : [...currentRoutes, route]
      };
    });
  }, []);

  // Handle copy last incident
  const handleCopyLast = useCallback((lastIncident) => {
    console.log('📋 Copying last incident:', lastIncident.id);
    // Pre-populate create modal with last incident data
    const copiedData = {
      type: lastIncident.type,
      location: lastIncident.location,
      affectedRoutes: lastIncident.affectedRoutes || [],
      priority: lastIncident.priority,
      description: lastIncident.description,
      // Don't copy: id, status, timestamps
    };
    setShowCreateModal(true);
    // You'll need to pass this data to the CreateIncidentModal
  }, []);

  // Handle bulk update
  const handleBulkUpdate = useCallback(() => {
    console.log('📦 Opening bulk update for:', selectedIncidents.length, 'incidents');
    setShowBulkUpdate(true);
  }, [selectedIncidents]);

  // Handle incident selection
  const handleIncidentSelect = useCallback((incident, isSelected) => {
    setSelectedIncidents(prev => {
      if (isSelected) {
        return [...prev, incident];
      } else {
        return prev.filter(i => i.id !== incident.id);
      }
    });
  }, []);

  // Handle bulk update complete
  const handleBulkUpdateComplete = useCallback((updatedIds) => {
    console.log('✅ Bulk update complete:', updatedIds);
    setSelectedIncidents([]);
    setShowBulkUpdate(false);
    fetchIncidents(false); // Refresh to show updates
  }, [fetchIncidents]);
  
  // Handle clear resolved incidents
  const handleClearResolved = useCallback(async () => {
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
    
    if (Platform.OS === 'web') {
      if (!confirm(`Are you sure you want to clear ${resolvedCount} resolved incident${resolvedCount === 1 ? '' : 's'}?`)) {
        return;
      }
    }
    
    try {
      // Clear resolved incidents via API
      const response = await fetch(`${baseUrl}/api/incidents/clear-resolved`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        body: JSON.stringify({
          supervisorName,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        // Remove resolved incidents from local state
        setIncidents(prev => prev.filter(i => i.status !== 'resolved'));
        calculateStats(incidents.filter(i => i.status !== 'resolved'), trafficIncidents);
        
        if (Platform.OS === 'web') {
          alert(`${resolvedCount} resolved incident${resolvedCount === 1 ? '' : 's'} cleared successfully`);
        }
      }
    } catch (error) {
      console.error('Error clearing resolved incidents:', error);
      alert('Failed to clear resolved incidents. Please try again.');
    }
  }, [incidents, baseUrl, sessionId, supervisorName, trafficIncidents]);

  // Handle export to Excel
  const handleExport = useCallback(async () => {
    console.log('📤 Exporting incidents to Excel');
    
    try {
      const incidentsToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;
      const filename = await exportIncidentsToExcel(incidentsToExport, {
        exportedBy: supervisorName,
        filters: filters
      });
      
      if (filename) {
        if (Platform.OS === 'web') {
          alert(`Exported ${incidentsToExport.length} incidents to ${filename}`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export incidents. Please try again.');
    }
  }, [filteredIncidents, incidents, supervisorName, filters]);

  // Handle export for Disruption Database
  const handleDisruptionDbExport = useCallback(async () => {
    console.log('📤 Exporting for Disruption Database');
    
    try {
      const filename = await exportForDisruptionDatabase(incidents, supervisorName);
      
      if (filename) {
        if (Platform.OS === 'web') {
          alert(`Exported resolved incidents and diversions to ${filename}`);
        }
      } else {
        Alert.alert('No Data', 'No resolved incidents or diversions to export');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export for Disruption Database.');
    }
  }, [incidents, supervisorName]);

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={incidentsStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={incidentsStyles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  // Render empty state
  const renderEmptyState = () => {
    // Different empty states based on context
    if (loadingTraffic && showTrafficAlerts && trafficIncidents.length === 0) {
      return (
        <View style={incidentsStyles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.warning} />
          <Text style={incidentsStyles.emptyTitle}>Loading Traffic Data...</Text>
          <Text style={incidentsStyles.emptyDescription}>
            Fetching live traffic incidents from TomTom and National Highways
          </Text>
        </View>
      );
    }
    
    if (showTrafficAlerts && !loadingTraffic && trafficIncidents.length === 0 && incidents.length === 0) {
      return (
        <View style={incidentsStyles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} style={incidentsStyles.emptyIcon} />
          <Text style={incidentsStyles.emptyTitle}>All Clear!</Text>
          <Text style={incidentsStyles.emptyDescription}>
            No traffic incidents detected on Go North East routes. 
            The network is running smoothly.
          </Text>
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton, { marginTop: 20 }]}
            onPress={() => fetchTrafficIncidents()}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={incidentsStyles.secondaryButtonText}>Check Again</Text>
          </Pressable>
        </View>
      );
    }
    
    return (
      <View style={incidentsStyles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} style={incidentsStyles.emptyIcon} />
        <Text style={incidentsStyles.emptyTitle}>No Incidents Found</Text>
        <Text style={incidentsStyles.emptyDescription}>
          No incidents found for the current filters. Try adjusting your search criteria or check back later.
        </Text>
      </View>
    );
  };

  // Render stats cards
  const renderStatsCards = () => (
    <View style={incidentsStyles.statsContainer}>
      <StatsCard
        {...StatCardPresets.total(stats.total, () => handleStatPress('total'))}
        size="large"
      />
      <StatsCard
        {...StatCardPresets.active(stats.active, () => handleStatPress('active'))}
        trend={stats.active > 5 ? '+2 from yesterday' : null}
        trendDirection={stats.active > 5 ? 'up' : 'neutral'}
      />
      <StatsCard
        {...StatCardPresets.routesAffected(stats.routesAffected, () => handleStatPress('routes'))}
      />
      <StatsCard
        {...StatCardPresets.averageResolution(stats.averageResolutionTime, () => handleStatPress('resolution'))}
      />
      <StatsCard
        {...StatCardPresets.traffic(stats.traffic, () => handleStatPress('traffic'))}
      />
    </View>
  );

  // Render incidents list
  const renderIncidentsList = () => {
    if (filteredIncidents.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={incidentsStyles.section}>
        <View style={[incidentsStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={incidentsStyles.sectionTitle}>
            {activeTab === 'overview' ? 'All Incidents' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Incidents`}
          </Text>
          <Text style={incidentsStyles.textMuted}>
            {filteredIncidents.length} incident{filteredIncidents.length === 1 ? '' : 's'}
          </Text>
        </View>
        
        {filteredIncidents.slice(0, 20).map((incident, index) => {
          const isSelected = selectedIncidents.some(i => i.id === incident.id);
          return (
            <IncidentCard
              key={incident.id || `incident-${index}`}
              incident={incident}
              onPress={(inc) => setSelectedIncident(inc)}
              onGenerateMessages={() => handleGenerateMessages(incident)}
              onViewSuggestions={() => handleViewSuggestions(incident)}
              onPromote={incident.isTrafficIncident ? () => handlePromoteToIncident(incident) : null}
              onPushToDisplay={() => handlePushToDisplay(incident)}
              onViewMap={() => handleViewMap(incident)}
              isSelected={isSelected}
              onSelect={(selected) => handleIncidentSelect(incident, selected)}
              onResolutionTimeUpdate={fetchIncidents}
              baseUrl={baseUrl}
              sessionId={sessionId}
              supervisorName={supervisorName}
            />
          );
        })}
        
        {filteredIncidents.length > 20 && (
          <View style={[incidentsStyles.emptyContainer, { padding: spacing.md }]}>
            <Ionicons name="funnel" size={32} color={colors.textMuted} />
            <Text style={incidentsStyles.emptyTitle}>
              {filteredIncidents.length - 20} more incidents available
            </Text>
            <Text style={incidentsStyles.emptyDescription}>
              Use the filters above to narrow down the results and find specific incidents.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // filteredIncidents is now memoised above

  // Debug wrapper to catch text node errors
  const SafeView = ({ children, debug, ...props }) => {
    if (Platform.OS === 'web' && debug) {
      // Check children for text nodes
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          console.error('Text node found in View:', child, 'at', debug);
        }
      });
    }
    return <View {...props}>{children}</View>;
  };

  return (
    <View style={incidentsStyles.container}>
      {/* Quick Actions Toolbar */}
      <QuickActionsToolbar
        onRecentLocationSelect={handleRecentLocationSelect}
        onMyRoutesToggle={handleMyRoutesToggle}
        onCopyLast={handleCopyLast}
        onBulkUpdate={handleBulkUpdate}
        selectedIncidents={selectedIncidents}
        lastIncident={incidents[0]}
        supervisorBadge={sessionId}
        baseUrl={baseUrl}
      />

      {/* Tab Navigation */}
      <View style={incidentsStyles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={incidentsStyles.tabScrollView}
        >
          <View style={incidentsStyles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[
                  incidentsStyles.tab,
                  activeTab === tab.id ? incidentsStyles.tabActive : incidentsStyles.tabInactive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[
                  incidentsStyles.tabText,
                  activeTab === tab.id ? incidentsStyles.tabTextActive : incidentsStyles.tabTextInactive
                ]}>
                  {tab.label}
                </Text>
                {tab.badge && (
                  <View style={incidentsStyles.tabBadge}>
                    <Text style={incidentsStyles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Search Bar */}
      {Platform.OS === 'web' && (
        <View style={incidentsStyles.searchContainer}>
          <View style={incidentsStyles.searchBox}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              placeholder="Search by location, route, or description..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setFilters(prev => ({ ...prev, searchQuery: text }));
              }}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
                backgroundColor: 'transparent',
                marginLeft: 10,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
              }}
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery && (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setFilters(prev => ({ ...prev, searchQuery: '' }));
                }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Action Bar */}
      <View style={incidentsStyles.actionBar}>
        <View style={incidentsStyles.row}>
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.primaryButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={incidentsStyles.primaryButtonText}>Create Incident</Text>
          </Pressable>
          
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={incidentsStyles.secondaryButtonText}>Refresh</Text>
          </Pressable>

          {/* Traffic Alerts Toggle */}
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton, {
              backgroundColor: showTrafficAlerts ? colors.warningBg : colors.bgSecondary,
              borderColor: showTrafficAlerts ? colors.warning : colors.border,
            }]}
            onPress={() => setShowTrafficAlerts(!showTrafficAlerts)}
          >
            <Ionicons 
              name="car" 
              size={16} 
              color={showTrafficAlerts ? colors.warning : colors.textSecondary} 
            />
            <Text style={[incidentsStyles.secondaryButtonText, {
              color: showTrafficAlerts ? colors.warning : colors.textSecondary,
            }]}>
              Traffic Alerts
            </Text>
          </Pressable>

          {/* Export Button */}
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton]}
            onPress={handleExport}
          >
            <Ionicons name="download" size={20} color={colors.primary} />
            <Text style={incidentsStyles.secondaryButtonText}>Export</Text>
          </Pressable>

          {/* Disruption DB Export (for resolved incidents) */}
          {stats.manual > 0 && (
            <Pressable
              style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton]}
              onPress={handleDisruptionDbExport}
              title="Export resolved incidents and diversions for Disruption Database"
            >
              <Ionicons name="server" size={16} color={colors.warning} />
              <Text style={[incidentsStyles.secondaryButtonText, { fontSize: 12 }]}>
                Disruption DB
              </Text>
            </Pressable>
          )}
          
          {/* Clear All Resolved Button */}
          {incidents.some(i => i.status === 'resolved') && (
            <Pressable
              style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton]}
              onPress={handleClearResolved}
              title="Clear all resolved incidents"
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[incidentsStyles.secondaryButtonText, { fontSize: 12 }]}>
                Clear Resolved
              </Text>
            </Pressable>
          )}
          
          {/* Group by Route Toggle */}
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton, {
              backgroundColor: groupByRoute ? colors.primaryBg : colors.bgSecondary,
              borderColor: groupByRoute ? colors.primary : colors.border,
            }]}
            onPress={() => setGroupByRoute(!groupByRoute)}
          >
            <Ionicons 
              name="git-network-outline" 
              size={16} 
              color={groupByRoute ? colors.primary : colors.textSecondary} 
            />
            <Text style={[incidentsStyles.secondaryButtonText, {
              color: groupByRoute ? colors.primary : colors.textSecondary,
            }]}>
              Group Routes
            </Text>
          </Pressable>
          
          {/* Map View Button */}
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton]}
            onPress={() => setShowMap(true)}
          >
            <Ionicons name="map" size={16} color={colors.primary} />
            <Text style={incidentsStyles.secondaryButtonText}>Map View</Text>
          </Pressable>

          {/* Real-time Status Indicator */}
          <View style={[incidentsStyles.row, { marginLeft: spacing.md }]}>
          {/* WebSocket Status */}
          {Platform.OS === 'web' && useWebSocket && (
            <WebSocketStatus status={wsStatus} lastHeartbeat={lastHeartbeat} />
          )}
          <Pressable
            style={[incidentsStyles.actionButton, incidentsStyles.secondaryButton, {
                backgroundColor: isRealTimeEnabled ? colors.successBg : colors.errorBg,
                borderColor: isRealTimeEnabled ? colors.success : colors.error,
            }]}
            onPress={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
          >
            <Ionicons 
              name={isRealTimeEnabled ? "radio-button-on" : "radio-button-off"} 
              size={16} 
              color={isRealTimeEnabled ? colors.success : colors.error} 
            />
            <Text style={[incidentsStyles.secondaryButtonText, {
              color: isRealTimeEnabled ? colors.success : colors.error,
              fontSize: 12
            }]}>
              {isRealTimeEnabled ? 
                (wsConnected ? 'Live' : `Polling (${Math.round(updateFrequency/1000)}s)`) : 
                'Manual'
              }
            </Text>
          </Pressable>
          
          {showTrafficAlerts && autoRefreshEnabled && (
            <Text style={[incidentsStyles.textMuted, { fontSize: 11, marginLeft: spacing.xs }]}>
              Traffic auto-refresh: 2 min
            </Text>
          )}
          <View style={incidentsStyles.liveUpdateContainer}>
            <View style={incidentsStyles.pulsingDot} />
            {lastUpdate && (
              <Text style={[incidentsStyles.textMuted, { fontSize: 11, marginLeft: spacing.xs }]}>
                {(() => {
                  try {
                    return `Updated: ${lastUpdate.toLocaleTimeString('en-GB')}`;
                  } catch {
                    return 'Updated: --:--:--';
                  }
                })()}
              </Text>
            )}
          </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'overview' && (
          <>
            {renderStatsCards()}
            {renderIncidentsList()}
          </>
        )}
        
        {activeTab === 'active' && renderIncidentsList()}

        {['timeline', 'analytics', 'templates'].includes(activeTab) && (
          <View style={incidentsStyles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={colors.textMuted} />
            <Text style={incidentsStyles.emptyTitle}>Coming Soon</Text>
            <Text style={incidentsStyles.emptyDescription}>
              The {activeTab} feature is under development and will be available in a future update.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateIncident={handleIncidentCreated}
        supervisorName={supervisorName}
        supervisorRole={supervisorRole}
        sessionId={sessionId}
        baseUrl={baseUrl}
        onShowActionReminders={handleShowActionReminders}
      />

      {/* Message Generator */}
      {showMessageGenerator && (
        <MessageGenerator
          incident={messageIncident}
          visible={showMessageGenerator}
          onClose={() => {
            setShowMessageGenerator(false);
            setMessageIncident(null);
          }}
          onMessagesSaved={handleMessagesSaved}
        />
      )}

      {/* Action Reminders Modal */}
      <ActionRemindersModal
        visible={showActionReminders}
        onClose={() => {
          setShowActionReminders(false);
          setCreatedIncident(null);
          setCreatedMessages(null);
        }}
        incident={createdIncident}
        messages={createdMessages}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        visible={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedIncidents={selectedIncidents}
        onUpdate={handleBulkUpdateComplete}
        baseUrl={baseUrl}
      />

      {/* Adopt Incident Modal */}
      <AdoptIncidentModal
        visible={showAdoptModal}
        onClose={() => {
          setShowAdoptModal(false);
          setIncidentToAdopt(null);
        }}
        trafficIncident={incidentToAdopt}
        onAdopt={handleIncidentAdopted}
        supervisorName={supervisorName}
        sessionId={sessionId}
        baseUrl={baseUrl}
      />
      
      {/* Incidents Map Modal */}
      <IncidentMap
        visible={showMap}
        onClose={() => setShowMap(false)}
        incidents={filteredIncidents}
        selectedIncident={selectedIncident}
        onIncidentSelect={(incident) => {
          setSelectedIncident(incident);
          // Optionally close map and scroll to incident
        }}
      />
      
      {/* AI Action Suggestions Modal */}
      {showSuggestions && suggestionsIncident && (
        <Modal
          visible={showSuggestions}
          onRequestClose={() => {
            setShowSuggestions(false);
            setSuggestionsIncident(null);
          }}
          transparent
          animationType="slide"
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end'
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80%',
              ...shadows.lg
            }}>
              <ActionSuggestions
                incident={suggestionsIncident}
                onActionSelect={handleSuggestionAction}
                supervisorBadge={sessionId}
              />
              <Pressable
                style={{
                  padding: spacing.lg,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderTopColor: colors.borderLight
                }}
                onPress={() => {
                  setShowSuggestions(false);
                  setSuggestionsIncident(null);
                }}
              >
                <Text style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: '600'
                }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default IncidentsManagerV2;