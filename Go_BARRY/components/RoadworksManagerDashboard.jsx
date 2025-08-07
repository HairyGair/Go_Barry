import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  RefreshControl,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSupervisor } from './hooks/useSupervisorSession';
import RoadworkMapModal from './RoadworkMapModal';
import RoadworkLinestringMap from './RoadworkLinestringMap';
import DisruptionWorkflowModal from './DisruptionWorkflowModal';
import EscalationOptionsModal from './EscalationOptionsModal';
import unifiedCoordinateService from '../services/unifiedCoordinateService';

// Import with fallback for offlineCoordinateCache
let offlineCoordinateCache;
try {
  offlineCoordinateCache = require('../services/offlineCoordinateCache').default;
  console.log('✅ offlineCoordinateCache loaded successfully');
} catch (error) {
  console.warn('⚠️ Failed to load offlineCoordinateCache, using fallback:', error.message);
  offlineCoordinateCache = {
    syncOfflineCache: () => Promise.resolve({ success: false, reason: 'Module not available' }),
    getCacheStats: () => Promise.resolve({ exists: false, count: 0, sizeKB: 0 }),
    getOfflineCoordinates: () => Promise.resolve({ success: true, data: [] }),
    searchOfflineCoordinates: () => Promise.resolve([]),
    clearOfflineCache: () => Promise.resolve({ success: true }),
    cacheOfflineCoordinates: () => Promise.resolve({ success: false })
  };
}
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

import { API_CONFIG } from '../config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Inject optimized gradient CSS for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const existingStyle = document.getElementById('gradient-mesh-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'gradient-mesh-styles';
  style.textContent = `
    .gradient-mesh-bg {
      position: fixed !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(ellipse at 20% 30%, rgba(124, 58, 237, 0.25) 0%, transparent 40%),
        radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.25) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
        #0a0a0f;
      pointer-events: none;
    }
    
    /* Hover lift animations */
    [data-glass-card] {
      position: relative;
      isolation: isolate;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, box-shadow;
    }
    
    [data-glass-card]:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 
        inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.15),
        0 0 40px rgba(59, 130, 246, 0.2),
        0 4px 8px rgba(59, 130, 246, 0.1),
        0 8px 16px rgba(0, 0, 0, 0.15),
        0 16px 32px rgba(0, 0, 0, 0.12),
        0 24px 48px rgba(0, 0, 0, 0.08);
    }
    
    [data-glass-card]::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.03) 0%,
        transparent 100%
      );
      border-radius: 20px;
      pointer-events: none;
      z-index: 1;
    }
    
    /* Button hover animations */
    .glass-action-button {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .glass-action-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .glass-action-button:hover::before {
      width: 300px;
      height: 300px;
    }
    
    .glass-action-button:hover {
      transform: translateY(-2px);
    }
    
    .glass-action-button.map:hover {
      background-color: rgba(59, 130, 246, 0.35) !important;
      border-color: rgba(59, 130, 246, 0.8) !important;
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    
    .glass-action-button.acknowledge:hover {
      background-color: rgba(34, 197, 94, 0.35) !important;
      border-color: rgba(34, 197, 94, 0.8) !important;
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }
    
    .glass-action-button.escalate:hover {
      background-color: rgba(249, 115, 22, 0.35) !important;
      border-color: rgba(249, 115, 22, 0.8) !important;
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }
    
    .glass-action-button.end-display:hover {
      background-color: rgba(220, 38, 38, 0.35) !important;
      border-color: rgba(220, 38, 38, 0.8) !important;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
    }
    
    .glass-action-button.dismiss:hover {
      background-color: rgba(239, 68, 68, 0.35) !important;
      border-color: rgba(239, 68, 68, 0.8) !important;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }
    
    /* Multi-layered shadows */
    [data-glass-card] {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      box-shadow: 
        inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.1),
        0 0 20px rgba(59, 130, 246, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.04),
        0 4px 8px rgba(0, 0, 0, 0.06),
        0 8px 16px rgba(0, 0, 0, 0.08),
        0 16px 32px rgba(0, 0, 0, 0.1);
    }
    
    /* Animated gradient border effect */
    @keyframes gradient-border {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    [data-glass-card]::after {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(
        60deg,
        transparent 30%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 70%
      );
      background-size: 200% 200%;
      animation: gradient-border 8s ease infinite;
      border-radius: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 0;
    }
    
    [data-glass-card]:hover::after {
      opacity: 1;
    }
    
    /* Card gradient effects */
    .card-shine-gradient {
      background: linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 50%);
    }
    
    .card-glow-gradient {
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    }
    
    /* Compartment tab hover effects */
    .compartment-tab {
      transition: all 0.2s ease;
    }
    
    .compartment-tab:hover {
      background-color: rgba(147, 197, 253, 0.15) !important;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .compartment-tab-active:hover {
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 0 24px rgba(59, 130, 246, 0.5);
    }
  `;
  document.head.appendChild(style);
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-UK', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (error) {
    return dateString;
  }
};

  // Enhanced coordinate quality assessment
  const assessCoordinateQuality = (item) => {
    // Check if coordinates exist
    if (!item.coordinates) {
      // Check fallback strategy
      if (item.coordinateFallbackStrategy === 'all_strategies_exhausted') {
        return {
          quality: 'none',
          source: 'none',
          confidence: 'none',
          color: '#ef4444',
          icon: 'map-marker-remove',
          buttonText: 'Location Unknown',
          tooltip: 'Unable to determine location - see suggestions'
        };
      }
      return {
        quality: 'none',
        source: 'none',
        confidence: 'none',
        color: '#6b7280',
        icon: 'map-search',
        buttonText: 'Find Location',
        tooltip: 'No coordinates available - will attempt to geocode location'
      };
    }

    // Determine coordinate source and quality
    const coordinateSource = item.coordinateSource || 'unknown';
    const coordinateAccuracy = item.coordinateAccuracy;
    const fallbackStrategy = item.coordinateFallbackStrategy;
    
    // High precision GPS coordinates
    if (coordinateSource === 'gps' || coordinateSource === 'survey' || 
        coordinateSource === 'street_manager_precise' || coordinateAccuracy === 'high' ||
        coordinateSource.startsWith('street_manager_converted') ||
        coordinateSource === 'database_lat_lng' ||
        fallbackStrategy === 'osgb36_conversion' ||
        fallbackStrategy === 'linestring_parsing') {
      return {
        quality: 'high',
        source: coordinateSource,
        confidence: 'high',
        color: '#22c55e',
        icon: 'crosshairs-gps',
        buttonText: 'View on Map',
        tooltip: 'Precise GPS coordinates available'
      };
    }
    
    // Geocoded or approximate coordinates
    if (coordinateSource === 'geocoded' || coordinateSource === 'address_lookup' ||
        coordinateSource === 'street_manager_geocoded' || coordinateAccuracy === 'medium' ||
        coordinateSource === 'nominatim_geocoded' || coordinateSource === 'geocoded_fallback' ||
        fallbackStrategy === 'geocoding') {
      return {
        quality: 'medium',
        source: coordinateSource,
        confidence: 'medium',
        color: '#f59e0b',
        icon: 'map-marker-radius',
        buttonText: 'View Area',
        tooltip: 'Approximate coordinates from address geocoding'
      };
    }
    
    // Authority area fallback
    if (coordinateSource === 'highway_authority_area' || 
        fallbackStrategy === 'authority_area_centroid') {
      return {
        quality: 'low',
        source: coordinateSource,
        confidence: 'low',
        color: '#a855f7',
        icon: 'map-marker-outline',
        buttonText: 'View Region',
        tooltip: 'Showing general area based on highway authority'
      };
    }
    
    // Has coordinates but uncertain quality
    if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
      const [lat, lng] = item.coordinates;
      // Check if coordinates are in reasonable range for UK
      if (lat >= 50 && lat <= 61 && lng >= -8 && lng <= 2) {
        return {
          quality: 'medium',
          source: 'coordinates_provided',
          confidence: 'medium', 
          color: '#f59e0b',
          icon: 'map-marker',
          buttonText: 'View Location',
          tooltip: 'Coordinates available (quality unknown)'
        };
      }
    }
    
    // Fallback for any other coordinate format
    return {
      quality: 'low',
      source: 'unknown',
      confidence: 'low',
      color: '#ef4444',
      icon: 'map-marker-question',
      buttonText: 'Try Location',
      tooltip: 'Coordinates may be inaccurate'
    };
  };

const calculateDuration = (item) => {
  try {
    const startDate = new Date(item.sm_start_date || item.start_date);
    const endDate = new Date(item.sm_end_date || item.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  } catch (error) {
    return item.durationDays || item.duration_days || 1;
  }
};

const RoadworksManagerDashboard = ({ onClose }) => {
  // Supervisor session integration
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin,
    supervisorSession,
    dismissAlert,
    logActivity
  } = useSupervisor();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadworks, setRoadworks] = useState([]);
  const [filteredRoadworks, setFilteredRoadworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Pagination state for server-side loading
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalRoadworks, setTotalRoadworks] = useState(0);
  const PAGE_SIZE = 50; // Items per page
  const [activeCompartment, setActiveCompartment] = useState('all'); // Active filter compartment
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissNotes, setDismissNotes] = useState('');
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRoadworkForMap, setSelectedRoadworkForMap] = useState(null);
  const [geocodingStates, setGeocodingStates] = useState(new Map());
  const [deletingRoadworks, setDeletingRoadworks] = useState(new Set()); // Track which are being deleted
  
  // Escalation modal state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedRoadworkForEscalation, setSelectedRoadworkForEscalation] = useState(null);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalatingRoadworks, setEscalatingRoadworks] = useState(new Set()); // Track which are being escalated
  
  // Enhanced dismiss state - SIMPLIFIED FOR PERMANENT DELETION
  const [selectedRoadworks, setSelectedRoadworks] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchDismissModal, setShowBatchDismissModal] = useState(false);
  
  // Disruption workflow modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedRoadworkForWorkflow, setSelectedRoadworkForWorkflow] = useState(null);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Convex mutations and queries
  const updateDisplayIncidents = useMutation(api.displayIncidents.updateDisplayIncidents);
  const updateDisplayMessages = useMutation(api.displayIncidents.updateDisplayMessages);
  const removeFromDisplay = useMutation(api.displayIncidents.removeFromDisplay);
  
  // Enhanced Convex query with error handling and fallback
  const convexDisplayIncidents = useQuery(api.displayIncidents.getDisplayIncidents);
  const [displayIncidents, setDisplayIncidents] = useState([]);
  const [convexError, setConvexError] = useState(null);
  
  // Handle Convex query result and errors with REST API fallback
  useEffect(() => {
    if (convexDisplayIncidents !== undefined) {
      // Successful query result
      setDisplayIncidents(Array.isArray(convexDisplayIncidents) ? convexDisplayIncidents : []);
      setConvexError(null);
      console.log(`✅ [RoadworksManagerDashboard] Convex displayIncidents loaded: ${convexDisplayIncidents.length} incidents`);
    } else if (convexDisplayIncidents === null) {
      // Query failed, try REST API fallback
      setConvexError('Convex query failed');
      console.warn('🔴 [RoadworksManagerDashboard] Convex displayIncidents query failed, trying REST API fallback');
      
      // Fallback to REST API
      const fetchDisplayIncidentsFromAPI = async () => {
      try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/display/display-incidents`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.incidents)) {
              setDisplayIncidents(data.incidents);
              console.log(`✅ [RoadworksManagerDashboard] Successfully fetched ${data.incidents.length} display incidents from REST API fallback`);
            } else {
              setDisplayIncidents([]);
              console.warn('⚠️ [RoadworksManagerDashboard] REST API returned invalid data format');
            }
          } else {
            console.warn(`⚠️ [RoadworksManagerDashboard] REST API fallback failed with status: ${response.status}`);
            setDisplayIncidents([]);
          }
        } catch (error) {
          console.error('🔴 [RoadworksManagerDashboard] REST API fallback error:', error);
          setDisplayIncidents([]);
        }
      };
      
      fetchDisplayIncidentsFromAPI();
    }
  }, [convexDisplayIncidents]);

  // Compartment definitions
  const compartments = [
    { id: 'all', label: 'All Roadworks', icon: 'road-variant', color: '#3b82f6' },
    { id: 'this-week', label: 'This Week', icon: 'calendar-week', color: '#10b981' },
    { id: 'today', label: 'Starting Today', icon: 'calendar-today', color: '#f59e0b' },
    { id: 'ending-soon', label: 'Ending Soon', icon: 'timer-sand', color: '#ef4444' },
    { id: 'major', label: 'Major Works', icon: 'alert-octagon', color: '#dc2626' },
    { id: 'high-impact', label: 'High Impact', icon: 'bus-alert', color: '#7c3aed' },
    { id: 'weekend', label: 'Weekend', icon: 'calendar-weekend', color: '#ec4899' },
  ];

  // Helper function to check if date is within range
  const isWithinDays = (dateString, days, fromNow = true) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(today);
    compareDate.setDate(compareDate.getDate() + days);
    
    if (fromNow) {
      return date >= today && date <= compareDate;
    } else {
      return date >= compareDate && date <= today;
    }
  };

  // Filter roadworks by compartment
  const filterByCompartment = (works, compartmentId = activeCompartment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (compartmentId) {
      case 'this-week':
        return works.filter(item => 
          isWithinDays(item.sm_actual_start_date || item.sm_start_date || item.start_date, 7)
        );
      
      case 'today':
        return works.filter(item => {
          const startDate = new Date(item.sm_actual_start_date || item.sm_start_date || item.start_date);
          startDate.setHours(0, 0, 0, 0);
          return startDate.getTime() === today.getTime();
        });
      
      case 'ending-soon':
        return works.filter(item => 
          isWithinDays(item.sm_actual_end_date || item.sm_end_date || item.end_date, 3)
        );
      
      case 'major':
        return works.filter(item => {
          const duration = calculateDuration(item);
          return duration > 14 || 
                 item.sm_traffic_management_type === 'Road closure' ||
                 item.sm_works_category === 'Major';
        });
      
      case 'high-impact':
        return works.filter(item => {
          if (!item.affectedRoutes || item.affectedRoutes.length === 0) return false;
          
          // Count unique route numbers (considering direction as separate impact)
          const routeCount = item.affectedRoutes.length;
          
          // Also check for high severity impacts
          const hasHighSeverity = item.affectedRoutes.some(route => 
            typeof route === 'object' && route.impact && route.impact.severity === 'high'
          );
          
          return routeCount >= 3 || hasHighSeverity;
        });
      
      case 'weekend':
        return works.filter(item => {
          const startDate = new Date(item.sm_actual_start_date || item.sm_start_date || item.start_date);
          const dayOfWeek = startDate.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5; // Fri, Sat, Sun
        });
      
      default:
        return works;
    }
  };

  // Check if a roadwork is currently on display
  const isOnDisplay = (roadworkId) => {
    return displayIncidents.some(incident => 
      incident.type === 'roadwork' && incident.id === roadworkId
    );
  };

  // Handle end display action
  const handleEndDisplay = async (roadwork) => {
    try {
      await removeFromDisplay({
        incidentId: roadwork.id,
        supervisorBadge: supervisorSession?.supervisor?.badge || supervisorSession?.supervisor?.id || supervisorName
      });
      
      // Update local state to mark as not escalated
      setRoadworks(prevRoadworks => 
        prevRoadworks.map(rw => 
          rw.id === roadwork.id 
            ? { ...rw, escalatedToDisplay: false, escalatedAt: null, escalatedBy: null }
            : rw
        )
      );
      setFilteredRoadworks(prevFiltered => 
        prevFiltered.map(rw => 
          rw.id === roadwork.id 
            ? { ...rw, escalatedToDisplay: false, escalatedAt: null, escalatedBy: null }
            : rw
        )
      );
      
      // Log activity
      await logActivity('end_display', {
        roadworkId: roadwork.id,
        location: roadwork.street_name,
        affectedRoutesCount: roadwork.affectedRoutes?.length || 0,
        duration: calculateDuration(roadwork)
      });
      
      // Show success message
      if (Platform.OS === 'web') {
        console.log(`✅ Roadwork removed from display: ${roadwork.street_name}`);
      } else {
        Alert.alert(
          'Success',
          `Roadwork at ${roadwork.street_name} has been removed from the Control Room Display.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to remove from display:', error);
      
      if (Platform.OS === 'web') {
        window.alert(`Failed to remove from display: ${error.message}`);
      } else {
        Alert.alert(
          'Error',
          `Failed to remove from display: ${error.message}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Calculate severity score for sorting
  const calculateSeverityScore = (item) => {
    let score = 0;
    
    // Traffic management type scoring
    if (item.sm_traffic_management_type === 'Road closure') score += 100;
    else if (item.sm_traffic_management_type === 'Two-way signals') score += 50;
    else if (item.sm_traffic_management_type === 'Multi-way signals') score += 40;
    else if (item.sm_traffic_management_type === 'Lane closure') score += 30;
    else if (item.sm_traffic_management_type === 'Some carriageway incursion') score += 20;
    
    // Works category scoring
    if (item.sm_works_category === 'immediate_emergency') score += 80;
    else if (item.sm_works_category === 'major') score += 60;
    else if (item.sm_works_category === 'standard') score += 30;
    else if (item.sm_works_category === 'minor') score += 10;
    
    // Affected routes scoring
    const affectedRoutesCount = item.affectedRoutes?.length || 0;
    score += Math.min(affectedRoutesCount * 10, 50); // Max 50 points for routes
    
    // Duration scoring
    const duration = calculateDuration(item);
    if (duration > 30) score += 30;
    else if (duration > 14) score += 20;
    else if (duration > 7) score += 10;
    
    // Traffic sensitive scoring
    if (item.sm_traffic_sensitive) score += 20;
    
    return score;
  };

  // Enhanced fetch function with better error handling
  const fetchRoadworksEnhanced = async (retryCount = 0, isRefresh = false) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    
    try {
      console.log('🚧 [RoadworksManagerDashboard] Starting to fetch roadworks...');
      setError(null); // Clear any previous errors
      
      // Always use production API - backend is on Render
      const baseUrl = API_CONFIG.baseURL; // This will be https://go-barry.onrender.com
      const url = `${baseUrl}/api/roadworks/unified?days=90&limit=${PAGE_SIZE}&page=${currentPage}`;
      console.log('🌐 [RoadworksManagerDashboard] Fetching from:', url);
      
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (backend may be waking up)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Prevent stale data
        },
        credentials: 'omit', // Don't send credentials cross-origin
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
      
      console.log('📡 [RoadworksManagerDashboard] Response status:', response.status);
      console.log('📡 [RoadworksManagerDashboard] Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Handle different response statuses
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view roadworks.');
      } else if (response.status === 404) {
        throw new Error('Roadworks API endpoint not found. Please contact support.');
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}). The service may be temporarily unavailable.`);
      } else if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Check content type (but don't fail if header is wrong)
      const contentType = response.headers.get('content-type');
      console.log('📡 [RoadworksManagerDashboard] Content-Type:', contentType);
      // Skip strict content-type check - backend returns JSON but may have wrong header
      
      const data = await response.json();
      console.log('📊 [RoadworksManagerDashboard] Data received:', {
        success: data.success,
        dataLength: data.roadworks?.length || data.data?.length || 0,
        hasData: !!(data.roadworks || data.data),
        sampleData: (data.roadworks || data.data)?.[0] // Log first item for debugging
      });
      
      if (data.success && (data.roadworks || data.data)) {
        const roadworksData = data.roadworks || data.data || [];
        const formattedRoadworks = roadworksData.map(item => ({
          ...item,
          // Map Street Manager fields to component fields
          street_name: item.sm_street_name || item.street_name || item.sm_location_description || 'Unknown Location',
          location_description: item.sm_location_description || item.location_description || item.sm_street_name || '',
          start_date: item.sm_start_date || item.start_date || '',
          end_date: item.sm_end_date || item.end_date || '',
          affectedRoutes: item.affectedRoutes || item.affected_routes || [],
          affectedRoutesSummary: item.affectedRoutesSummary || item.affected_routes_summary || '',
          durationDays: item.durationDays || item.duration_days || 1,
          isUrgent: item.isUrgent || item.is_urgent || item.sm_traffic_management_type === 'Road closure',
          // Include coordinates from backend processing
          coordinates: item.coordinates || null,
          coordinateSource: item.coordinateSource || null,
          coordinateAccuracy: item.coordinateAccuracy || null,
          // Add severity scoring for sorting
          severityScore: calculateSeverityScore(item)
        }));
        
        // Sort by severity score (highest first)
        formattedRoadworks.sort((a, b) => b.severityScore - a.severityScore);
        
        console.log(`✅ [RoadworksManagerDashboard] Formatted ${formattedRoadworks.length} roadworks`);
        // Handle pagination metadata
        const metadata = data.metadata || {};
        setHasMorePages(metadata.pagination?.hasMore || false);
        
        // Update total count if we know there are more pages
        if (currentPage === 1 || isRefresh) {
          // On first page, we don't know the total yet
          setTotalRoadworks(metadata.count || formattedRoadworks.length);
        } else if (!hasMorePages) {
          // On last page, we know the exact total
          setTotalRoadworks(roadworks.length + formattedRoadworks.length);
        }
        
        // For page 1 or refresh, replace all roadworks. For subsequent pages, append.
        if (currentPage === 1 || isRefresh) {
          setRoadworks(formattedRoadworks);
          setFilteredRoadworks(formattedRoadworks);
        } else {
          setRoadworks(prev => [...prev, ...formattedRoadworks]);
          setFilteredRoadworks(prev => [...prev, ...formattedRoadworks]);
        }
        
        // Cache the data for offline use
        if (Platform.OS === 'web' && 'localStorage' in window) {
          try {
            localStorage.setItem('roadworks_cache', JSON.stringify({
              data: formattedRoadworks.slice(0, 50), // Cache first 50 for performance
              timestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('Failed to cache roadworks data:', e);
          }
        }
      } else {
        console.error('❌ [RoadworksManagerDashboard] No data in response:', data);
        throw new Error(data.error || 'No roadworks data available');
      }
    } catch (err) {
      console.error('❌ [RoadworksManagerDashboard] Fetch error:', err);
      console.error('❌ [RoadworksManagerDashboard] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        retryCount
      });
      
      // Handle specific error types
      let errorToThrow = err;
      if (err.name === 'AbortError') {
        errorToThrow = new Error('Request timed out. The backend server may be starting up (this can take 30-60 seconds on first request). Please wait a moment and try again.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorToThrow = new Error('Cannot connect to backend server. The server may be starting up. Please wait 30 seconds and click "Retry Connection".');
      }
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && (errorToThrow.message.includes('timed out') || errorToThrow.message.includes('Network'))) {
        console.log(`🔄 Retrying in ${RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchRoadworksEnhanced(retryCount + 1);
      }
      
      // Try to load from cache if available
      if (Platform.OS === 'web' && 'localStorage' in window) {
        try {
          const cached = localStorage.getItem('roadworks_cache');
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(timestamp).getTime();
            const ONE_HOUR = 60 * 60 * 1000;
            
            if (cacheAge < ONE_HOUR) {
              console.log('📦 Loading from cache due to network error');
              setRoadworks(data);
              setFilteredRoadworks(data);
              setError(`Using cached data from ${new Date(timestamp).toLocaleTimeString()}. ${errorToThrow.message}`);
              return;
            }
          }
        } catch (cacheError) {
          console.error('Failed to load from cache:', cacheError);
        }
      }
      
      setError(`Failed to fetch roadworks: ${errorToThrow.message}`);
      throw errorToThrow;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Replace the existing fetchRoadworks function with this enhanced version
  const fetchRoadworks = fetchRoadworksEnhanced;

  // Load more roadworks from server
  const loadMoreRoadworks = async () => {
    if (!hasMorePages || loading) return;
    
    console.log('📥 Loading more roadworks, current page:', currentPage);
    setCurrentPage(prev => prev + 1);
    // This will trigger the useEffect to fetch the next page
  };
  
  // Reset when compartment changes - no need to refetch for client-side filters
  useEffect(() => {
    // Only reset pagination state, don't refetch
    // The filtering happens client-side in the other useEffect
  }, [activeCompartment]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchRoadworks();
    
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Fetch roadworks when page changes (for page 2+)
  useEffect(() => {
    if (currentPage > 1) {
      fetchRoadworks();
    }
  }, [currentPage]);
  
  // Sync critical roadworks to offline cache
  useEffect(() => {
    if (roadworks.length > 0 && Platform.OS === 'web' && offlineCoordinateCache && offlineCoordinateCache.syncOfflineCache) {
      // Sync the most critical roadworks (road closures, major works, high-impact)
      const criticalRoadworks = roadworks.filter(rw => 
        rw.sm_traffic_management_type === 'Road closure' ||
        rw.sm_works_category === 'major' ||
        (rw.affectedRoutes && rw.affectedRoutes.length >= 3)
      ).slice(0, 20); // Cache up to 20 critical roadworks
      
      offlineCoordinateCache.syncOfflineCache(criticalRoadworks)
        .then(() => {
          console.log(`✅ Synced ${criticalRoadworks.length} critical roadworks to offline cache`);
        })
        .catch(error => {
          console.error('Failed to sync offline cache:', error);
        });
    } else if (!offlineCoordinateCache) {
      console.warn('🔶 offlineCoordinateCache not available - skipping offline sync');
    }
  }, [roadworks]);

  // Dismiss reasons with smart categorization
  const dismissReasons = [
    { id: 'work-completed-early', label: 'Work completed early', icon: 'check-circle', color: '#22c55e' },
    { id: 'cancelled-by-contractor', label: 'Cancelled by contractor', icon: 'cancel', color: '#f59e0b' },
    { id: 'minimal-traffic-impact', label: 'Minimal traffic impact', icon: 'speedometer-slow', color: '#06b6d4' },
    { id: 'supervisor-override', label: 'Supervisor override', icon: 'shield-account', color: '#8b5cf6' },
    { id: 'data-error-duplicate', label: 'Data error/duplicate', icon: 'alert-circle', color: '#ef4444' },
    { id: 'not-affecting-routes', label: 'Not affecting routes', icon: 'road-variant', color: '#6b7280' },
    { id: 'already-resolved', label: 'Already resolved', icon: 'check-all', color: '#10b981' },
    { id: 'low-impact', label: 'Low impact', icon: 'minus-circle', color: '#94a3b8' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal', color: '#64748b' }
  ];

  // Permanent delete function
  const handlePermanentDelete = async (roadworkId, reason, notes) => {
    console.log('🗑️ Starting permanent delete for roadwork:', roadworkId, typeof roadworkId);
    const roadwork = roadworks.find(r => r.id === roadworkId);
    if (!roadwork) {
      console.error('❌ Roadwork not found in state:', roadworkId);
      console.log('Available IDs:', roadworks.map(r => ({ id: r.id, type: typeof r.id })));
      return;
    }

    // Add to deleting set
    setDeletingRoadworks(prev => new Set(prev).add(roadworkId));

    try {
      console.log('📡 Calling DELETE API for roadwork:', roadworkId);
      
      // Create an AbortController for timeout - REDUCED to 10 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Call the permanent delete endpoint - use POST instead of DELETE for better compatibility
      const response = await fetch(`${API_CONFIG.baseURL}/api/roadworks/unified/actions/${roadworkId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supervisorId: supervisorSession?.supervisor?.id,
          supervisorName: supervisorName,
          reason,
          notes
        }),
        signal: controller.signal
      }).catch(error => {
        console.error('❌ Fetch failed:', error);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after 10 seconds');
        }
        throw new Error(`Network error: ${error.message}`);
      }).finally(() => {
        clearTimeout(timeoutId);
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success) {
        console.log('✅ Backend deletion confirmed');
        
        // ONLY UPDATE UI AFTER BACKEND CONFIRMS SUCCESS
        setRoadworks(prevRoadworks => {
          const filtered = prevRoadworks.filter(item => String(item.id) !== String(roadworkId));
          console.log(`🔄 Post-delete UI update - roadworks count: ${filtered.length} (was ${prevRoadworks.length})`);
          return filtered;
        });
        setFilteredRoadworks(prevFiltered => {
          const filtered = prevFiltered.filter(item => String(item.id) !== String(roadworkId));
          console.log(`🔄 Post-delete UI update - filtered count: ${filtered.length} (was ${prevFiltered.length})`);
          return filtered;
        });
        
        // Log activity
        await logActivity('permanent_delete_roadwork', {
          roadworkId,
          reason,
          notes,
          location: roadwork.street_name,
          affectedRoutesCount: roadwork.affectedRoutes?.length || 0,
          duration: calculateDuration(roadwork)
        });
        
        // Success notification - don't use Alert on web
        if (Platform.OS === 'web') {
          console.log(`✅ Roadwork deleted: ${roadwork.street_name}`);
          // Optionally show a toast notification here if you have a toast library
        } else {
          Alert.alert(
            'Roadwork Deleted',
            `The roadwork at ${roadwork.street_name} has been permanently deleted.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error(data.error || 'Failed to delete roadwork');
      }
    } catch (error) {
      console.error('Failed to delete roadwork:', error);
      console.error('Error details:', {
        roadworkId,
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Enhanced error handling
      let errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The roadwork may have been deleted - please refresh to check.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage = 'Roadwork not found - it may have already been deleted.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error occurred. Please try again in a few moments.';
      }
      
      if (Platform.OS === 'web') {
        window.alert(`Failed to delete roadwork: ${errorMessage}`);
      } else {
        Alert.alert(
          'Delete Failed', 
          `Failed to delete roadwork: ${errorMessage}`
        );
      }
    } finally {
      // Remove from deleting set
      setDeletingRoadworks(prev => {
        const newSet = new Set(prev);
        newSet.delete(roadworkId);
        return newSet;
      });
    }
  };

  // Batch operations
  const toggleRoadworkSelection = (roadworkId) => {
    setSelectedRoadworks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roadworkId)) {
        newSet.delete(roadworkId);
      } else {
        newSet.add(roadworkId);
      }
      return newSet;
    });
  };

  const selectAllFromContractor = (contractor) => {
    const contractorRoadworks = filteredRoadworks
      .filter(rw => (rw.sm_promoter_organisation || rw.sm_promoter_name) === contractor)
      .map(rw => rw.id);
    
    setSelectedRoadworks(prev => {
      const newSet = new Set(prev);
      contractorRoadworks.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleBatchDismiss = async (reason, notes) => {
    const selectedIds = Array.from(selectedRoadworks);
    if (selectedIds.length === 0) return;
    
    // Show confirmation for batch deletion
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} roadwork alerts? This action cannot be undone.`
      );
      
      if (confirmed) {
        // Clear UI state first
        setSelectedRoadworks(new Set());
        setBatchMode(false);
        setShowBatchDismissModal(false);
        
        // Process deletions - each will update UI individually upon success
        for (const roadworkId of selectedIds) {
          try {
            await handlePermanentDelete(roadworkId, reason, notes);
          } catch (error) {
            console.error(`Failed to delete roadwork ${roadworkId}:`, error);
            // Continue with other deletions even if one fails
          }
        }
      }
    } else {
      Alert.alert(
        'Confirm Batch Deletion',
        `Are you sure you want to permanently delete ${selectedIds.length} roadwork alerts? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              // Clear UI state first
              setSelectedRoadworks(new Set());
              setBatchMode(false);
              setShowBatchDismissModal(false);
              
              // Process deletions - each will update UI individually upon success
              for (const roadworkId of selectedIds) {
                try {
                  await handlePermanentDelete(roadworkId, reason, notes);
                } catch (error) {
                  console.error(`Failed to delete roadwork ${roadworkId}:`, error);
                  // Continue with other deletions even if one fails
                }
              }
            }
          }
        ]
      );
    }
  };

  // Optimized roadwork card with enhancements
  const RoadworkCard = ({ item, index }) => {
    const [isPressed, setIsPressed] = useState(false);
    const isSelected = selectedRoadworks.has(item.id);

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);

    return (
      <Animated.View
        style={[
          styles.roadworkCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: isPressed ? 0.98 : 1
              }
            ]
          },
          isSelected && styles.roadworkCardSelected
        ]}
        {...(Platform.OS === 'web' && { 
          'data-glass-card': true
        })}
      >
        {/* Glass shine effect for web */}
        {Platform.OS === 'web' && (
          <>
            <View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                pointerEvents: 'none',
                zIndex: 2,
              }}
              {...(Platform.OS === 'web' && { className: 'card-shine-gradient' })}
            />
            <View
              style={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 100,
                height: 100,
                borderRadius: 50,
                pointerEvents: 'none',
                zIndex: 1,
              }}
              {...(Platform.OS === 'web' && { className: 'card-glow-gradient' })}
            />
          </>
        )}

        {/* Batch selection checkbox */}
        {batchMode && (
          <TouchableOpacity
            style={styles.selectionCheckbox}
            onPress={() => toggleRoadworkSelection(item.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <MaterialCommunityIcons 
                  name="check" 
                  size={16} 
                  color="#fff" 
                />
              )}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardTouchable}
          onLongPress={() => {
            if (!batchMode) {
              setBatchMode(true);
              toggleRoadworkSelection(item.id);
            }
          }}
        >
          {/* Escalated indicator */}
          {(item.escalatedToDisplay || isOnDisplay(item.id)) && (
            <View style={styles.escalatedBanner}>
              <MaterialCommunityIcons name="monitor-eye" size={16} color="#f97316" />
              <Text style={styles.escalatedText}>On Display • Pushed by {item.escalatedBy || 'Supervisor'}</Text>
            </View>
          )}
          
          {/* Location info */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={24} color="#3b82f6" />
            <Text style={styles.locationText} numberOfLines={2}>
              {item.sm_street_name || item.street_name || item.sm_location_description || 'Unknown Location'}
            </Text>
          </View>

          {/* Work description */}
          <View style={styles.descriptionRow}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#fbbf24" />
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.sm_works_description || 
               item.sm_activity_type || 
               (item.sm_works_category && item.sm_works_category.toLowerCase() !== 'major' ? item.sm_works_category : null) ||
               'Roadworks - Details pending'}
            </Text>
          </View>

          {/* Promoter info */}
          <View style={styles.promoterRow}>
            <MaterialCommunityIcons name="account-hard-hat" size={20} color="#a78bfa" />
            <Text style={styles.promoterText}>
              {item.sm_promoter_organisation || item.sm_promoter_name || 'Unknown Contractor'}
            </Text>
          </View>

          {/* Traffic Management Type */}
          {item.sm_traffic_management_type && (
            <View style={styles.trafficManagementRow}>
              <MaterialCommunityIcons name="traffic-cone" size={20} color="#f59e0b" />
              <Text style={styles.trafficManagementText}>
                {item.sm_traffic_management_type}
              </Text>
            </View>
          )}
          
          {/* LINESTRING Preview Map for multi-point roadworks */}
          {item.allCoordinatePoints && item.allCoordinatePoints.length > 1 && (
            <View style={styles.linestringMapContainer}>
              <Text style={styles.linestringMapLabel}>
                <MaterialCommunityIcons name="map-legend" size={14} color="#60a5fa" />
                {' '}Roadwork Extent ({item.allCoordinatePoints.length} points)
              </Text>
              <RoadworkLinestringMap 
                roadwork={item}
                height={180}
                style={styles.linestringMap}
              />
            </View>
          )}

          {/* Affected routes */}
          {item.affectedRoutes && item.affectedRoutes.length > 0 && (
            <View style={styles.routesSection}>
              <View style={styles.routesHeader}>
                <MaterialCommunityIcons name="bus-multiple" size={16} color="#93c5fd" />
                <Text style={styles.routesLabel}>Affected Routes</Text>
                {item.affectedRoutesSummary && (
                  <Text style={styles.routesSummaryText}>({item.affectedRoutesSummary})</Text>
                )}
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.routesScroll}
              >
                {item.affectedRoutes.slice(0, 6).map((route, idx) => {
                  // Handle both string format (legacy) and object format (new)
                  const routeNumber = typeof route === 'string' ? route : route.routeNumber;
                  const direction = typeof route === 'object' ? route.direction : null;
                  const headsign = typeof route === 'object' ? route.headsign : null;
                  const severity = typeof route === 'object' && route.impact ? route.impact.severity : null;
                  
                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.routeBadge,
                        severity === 'high' && styles.routeBadgeHighImpact
                      ]}
                      {...(Platform.OS === 'web' && headsign && {
                        title: `${routeNumber} to ${headsign}`
                      })}
                    >
                      <View style={styles.routeBadgeContent}>
                        <Text style={[
                          styles.routeText,
                          severity === 'high' && styles.routeTextHighImpact
                        ]}>
                          {routeNumber}
                        </Text>
                        {direction && (
                          <MaterialCommunityIcons 
                            name={direction === 'inbound' ? 'arrow-down' : 'arrow-up'} 
                            size={12} 
                            color={severity === 'high' ? '#fbbf24' : '#60a5fa'} 
                          />
                        )}
                      </View>
                      {direction && (
                        <Text style={styles.routeDirectionText}>
                          {direction === 'inbound' ? 'IN' : 'OUT'}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {item.affectedRoutes.length > 6 && (
                  <View style={[styles.routeBadge, styles.moreRoutesBadge]}>
                    <Text style={styles.routeText}>+{item.affectedRoutes.length - 6}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Duration info */}
          <View style={styles.timeline}>
            <View style={styles.timelineBar} />
            <View style={styles.durationInfo}>
              <Ionicons name="calendar-outline" size={16} color="#93c5fd" />
              <Text style={styles.durationText}>
                {formatDate(item.sm_start_date || item.start_date)} → {formatDate(item.sm_end_date || item.end_date)}
              </Text>
              <View style={styles.daysBadge}>
                <Text style={styles.daysText}>{calculateDuration(item)} days</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMapButtonPress(item)}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' && {
                title: assessCoordinateQuality(item).tooltip
              })}
            >
              <View 
                style={[
                  styles.actionContent, 
                  styles.mapButton,
                  { 
                    backgroundColor: `${assessCoordinateQuality(item).color}20`,
                    borderColor: assessCoordinateQuality(item).color
                  }
                ]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button map' })}
              >
                {geocodingStates.get(item.id) ? (
                  <MaterialCommunityIcons 
                    name="loading" 
                    size={20} 
                    color={assessCoordinateQuality(item).color}
                  />
                ) : (
                  <MaterialCommunityIcons 
                    name={assessCoordinateQuality(item).icon}
                    size={20} 
                    color={assessCoordinateQuality(item).color}
                  />
                )}
                <Text style={[
                  styles.actionText, 
                  { color: assessCoordinateQuality(item).color }
                ]}>
                  {geocodingStates.get(item.id) ? 'Locating...' : assessCoordinateQuality(item).buttonText}
                </Text>
                
                {/* Enhanced coordinate quality badge */}
                <View style={[
                  styles.coordinateQualityBadge,
                  { 
                    borderColor: assessCoordinateQuality(item).color,
                    backgroundColor: `${assessCoordinateQuality(item).color}15`
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name={
                      assessCoordinateQuality(item).quality === 'high' ? 'crosshairs-gps' :
                      assessCoordinateQuality(item).quality === 'medium' ? 'map-marker-radius' :
                      assessCoordinateQuality(item).quality === 'low' ? 'map-marker-question' :
                      'map-search'
                    }
                    size={10} 
                    color={assessCoordinateQuality(item).color}
                  />
                  <Text style={[
                    styles.coordinateQualityText,
                    { color: assessCoordinateQuality(item).color }
                  ]}>
                    {assessCoordinateQuality(item).quality === 'high' ? 'GPS' :
                     assessCoordinateQuality(item).quality === 'medium' ? 'Approx' :
                     assessCoordinateQuality(item).quality === 'low' ? 'Area' :
                     'Search'}
                  </Text>
                </View>
                
                {/* Keep the original small quality indicator for visual balance */}
                <View style={[
                  styles.qualityIndicator,
                  { backgroundColor: assessCoordinateQuality(item).color }
                ]} />
                {item.coordinateValidation && !item.coordinateValidation.valid && (
                  <View style={styles.validationWarning}>
                    <MaterialCommunityIcons 
                      name="alert-circle" 
                      size={12} 
                      color="#fbbf24" 
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleAcknowledge(item)}
              activeOpacity={0.7}
            >
              <View 
                style={[styles.actionContent, styles.acknowledgeButton]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button acknowledge' })}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#22c55e" />
                <Text style={[styles.actionText, { color: '#22c55e' }]}>Acknowledge</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                if (item.escalatedToDisplay || isOnDisplay(item.id)) {
                  handleEndDisplay(item);
                } else {
                  handleEscalate(item);
                }
              }}
              activeOpacity={0.7}
              disabled={escalatingRoadworks.has(item.id)}
            >
              <View 
                style={[
                  styles.actionContent, 
                  (item.escalatedToDisplay || isOnDisplay(item.id)) ? styles.endDisplayButton : styles.escalateButton,
                  escalatingRoadworks.has(item.id) && styles.actionButtonDisabled
                ]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button escalate' })}
              >
                {escalatingRoadworks.has(item.id) ? (
                  <>
                    <ActivityIndicator size="small" color="#f97316" />
                    <Text style={[styles.actionText, { color: '#f97316' }]}>Pushing...</Text>
                  </>
                ) : (item.escalatedToDisplay || isOnDisplay(item.id)) ? (
                  <>
                    <MaterialCommunityIcons name="monitor-off" size={20} color="#dc2626" />
                    <Text style={[styles.actionText, { color: '#dc2626' }]}>End Display</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#f97316" />
                    <Text style={[styles.actionText, { color: '#f97316' }]}>Escalate</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedAlert(item);
                setShowDismissModal(true);
              }}
              activeOpacity={0.7}
              disabled={deletingRoadworks.has(item.id)}
            >
              <View 
                style={[
                  styles.actionContent, 
                  styles.dismissButton,
                  deletingRoadworks.has(item.id) && styles.actionButtonDisabled
                ]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button dismiss' })}
              >
                {deletingRoadworks.has(item.id) ? (
                  <>
                    <ActivityIndicator size="small" color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Deleting...</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete-forever" size={20} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Enhanced map button handler with geocoding fallback
  const handleMapButtonPress = async (item) => {
    const coordinateQuality = assessCoordinateQuality(item);
    
    // If no coordinates, attempt geocoding
    if (coordinateQuality.quality === 'none') {
      setGeocodingStates(prev => new Map(prev.set(item.id, true)));
      
      try {
        // Attempt to geocode using street name and location info
        const locationString = item.sm_street_name || item.street_name || 
                              item.sm_location_description || item.location_description;
        
        if (locationString && locationString !== 'Unknown Location') {
          // TODO: Implement geocoding service
          // For now, just show the map modal without coordinates
          setSelectedRoadworkForMap({
            ...item,
            coordinates: null,
            geocodingAttempted: true,
            originalLocationString: locationString
          });
          setShowMapModal(true);
        } else {
          // No location data available - show regional map
          setSelectedRoadworkForMap({
            ...item,
            coordinates: null,
            showRegionalMap: true,
            fallbackSuggestions: item.fallbackSuggestions
          });
          setShowMapModal(true);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
        // Still show map modal with fallback
        setSelectedRoadworkForMap({
          ...item,
          coordinates: null,
          geocodingError: true
        });
        setShowMapModal(true);
      } finally {
        setGeocodingStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(item.id);
          return newMap;
        });
      }
    } else {
      // Has coordinates - show map directly
      setSelectedRoadworkForMap(item);
      setShowMapModal(true);
      
      await logActivity('view_roadwork_map', {
        roadworkId: item.id,
        location: item.street_name,
        coordinateQuality: coordinateQuality.quality,
        coordinateSource: coordinateQuality.source
      });
    }
  };

  // Handle actions
  const handleAcknowledge = async (roadwork) => {
    // Open the disruption workflow modal
    setSelectedRoadworkForWorkflow(roadwork);
    setShowWorkflowModal(true);
    
    await logActivity('open_disruption_workflow', {
      roadworkId: roadwork.id,
      location: roadwork.street_name
    });
  };

  const handleEscalate = async (roadwork) => {
    setSelectedRoadworkForEscalation(roadwork);
    setShowEscalateModal(true);
  };

  const handleDismissConfirm = async () => {
    if (!selectedAlert || !dismissReason) return;

    if (Platform.OS === 'web') {
      // For web, use a simple confirmation without Alert
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete this roadwork alert?\n\nLocation: ${selectedAlert.street_name}\nThis action cannot be undone.`
      );
      
      if (confirmed) {
        // Store the alert data before closing modal
        const alertToDelete = selectedAlert;
        const alertId = selectedAlert.id;
        
        console.log('🎨 Deleting alert:', alertId, alertToDelete.street_name);
        
        // Clear the form and close modal FIRST
        const reasonToUse = dismissReason;
        const notesToUse = dismissNotes;
        setDismissReason('');
        setDismissNotes('');
        setSelectedAlert(null);
        setShowDismissModal(false);
        
        // Delete from backend - UI will update when backend confirms success
        handlePermanentDelete(alertId, reasonToUse, notesToUse).catch(error => {
          console.error('⚠️ Backend deletion failed:', error);
          // On error, optionally re-add the item or show an error
        });
      }
      // If not confirmed, modal stays open
    } else {
      // For mobile, use React Native Alert
      // Close the modal first
      setShowDismissModal(false);

      // Show confirmation dialog
      Alert.alert(
        'Confirm Permanent Deletion',
        `Are you sure you want to permanently delete this roadwork alert?\n\nLocation: ${selectedAlert.street_name}\nThis action cannot be undone.`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              // Reopen the modal if cancelled
              setShowDismissModal(true);
            }
          },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: async () => {
              const alertId = selectedAlert.id;
              const reasonToUse = dismissReason;
              const notesToUse = dismissNotes;
              
              // Clear the form
              setDismissReason('');
              setDismissNotes('');
              setSelectedAlert(null);
              
              // Delete from backend - UI will update when backend confirms success
              handlePermanentDelete(alertId, reasonToUse, notesToUse).catch(error => {
                console.error('⚠️ Backend deletion failed:', error);
              });
            }
          }
        ]
      );
    }
  };

  // Add contractor selection functionality
  const getUniqueContractors = () => {
    const contractors = new Set();
    filteredRoadworks.forEach(rw => {
      const contractor = rw.sm_promoter_organisation || rw.sm_promoter_name;
      if (contractor) contractors.add(contractor);
    });
    return Array.from(contractors);
  };

  // Filter roadworks by compartment and search
  useEffect(() => {
    console.log('🔄 Filtering roadworks, total:', roadworks.length, 'compartment:', activeCompartment);
    let filtered = roadworks;

    // Apply compartment filter first
    filtered = filterByCompartment(filtered);

    // Then apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.street_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.affectedRoutes?.some(route => {
          const routeStr = typeof route === 'string' ? route : route.routeNumber;
          return routeStr?.toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    console.log('🔍 Filtered result:', filtered.length, 'items');
    setFilteredRoadworks(filtered);
  }, [searchQuery, roadworks, activeCompartment]);

  return (
    <Modal
      visible={true}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Static gradient background for web */}
        {Platform.OS === 'web' && (
          <View style={StyleSheet.absoluteFillObject} className="gradient-mesh-bg" />
        )}
        
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    Roadworks Command Centre
                  </Text>
                  <Text style={styles.subtitle}>
                    <MaterialCommunityIcons name="shield-account" size={16} color="#93c5fd" />
                    {' '}{supervisorName} • {compartments.find(c => c.id === activeCompartment)?.label} • 
                    {activeCompartment === 'all' 
                      ? `${roadworks.length} loaded${hasMorePages ? '+' : ''}` 
                      : `${filteredRoadworks.length} of ${roadworks.length}`
                    }
                  </Text>
                </View>
                
                {/* Batch mode controls */}
                <View style={styles.headerControls}>
                  {batchMode && selectedRoadworks.size > 0 && (
                    <TouchableOpacity
                      style={styles.batchDismissButton}
                      onPress={() => setShowBatchDismissModal(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="delete-multiple" size={20} color="#ef4444" />
                      <Text style={styles.batchDismissText}>Delete ({selectedRoadworks.size})</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.batchModeToggle}
                    onPress={() => {
                      setBatchMode(!batchMode);
                      setSelectedRoadworks(new Set());
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                      name={batchMode ? "close" : "checkbox-multiple-marked"} 
                      size={24} 
                      color={batchMode ? "#ef4444" : "#93c5fd"} 
                    />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="window-close" size={36} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Search bar */}
              <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                  <MaterialCommunityIcons name="magnify" size={24} color="#93c5fd" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search locations, routes, or incidents..."
                    placeholderTextColor="rgba(147, 197, 253, 0.5)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialCommunityIcons name="close-circle" size={22} color="#93c5fd" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Compartment Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.compartmentTabs}
              contentContainerStyle={styles.compartmentTabsContent}
            >
              {compartments.map((compartment) => {
                const isActive = activeCompartment === compartment.id;
                // Calculate count for this specific compartment
                const compartmentCount = filterByCompartment(roadworks, compartment.id).length;
                
                return (
                  <TouchableOpacity
                    key={compartment.id}
                    style={[
                      styles.compartmentTab,
                      isActive && styles.compartmentTabActive,
                      isActive && { borderColor: compartment.color }
                    ]}
                    onPress={() => setActiveCompartment(compartment.id)}
                    activeOpacity={0.7}
                    {...(Platform.OS === 'web' && { 
                      className: isActive ? 'compartment-tab compartment-tab-active' : 'compartment-tab'
                    })}
                  >
                    <MaterialCommunityIcons 
                      name={compartment.icon} 
                      size={18} 
                      color={isActive ? compartment.color : '#93c5fd'} 
                    />
                    <Text style={[
                      styles.compartmentTabText,
                      isActive && styles.compartmentTabTextActive
                    ]}>
                      {compartment.label}
                    </Text>
                    <View style={[
                      styles.compartmentBadge,
                      isActive && styles.compartmentBadgeActive,
                      isActive && { backgroundColor: compartment.color }
                    ]}>
                      <Text style={[
                        styles.compartmentBadgeText,
                        isActive && styles.compartmentBadgeTextActive
                      ]}>
                        {compartmentCount.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Batch Operations Section */}
            {batchMode && (
              <View style={styles.batchOperations}>
                <Text style={styles.batchOperationsTitle}>Batch Operations</Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.contractorOptions}
                  contentContainerStyle={styles.contractorOptionsContent}
                >
                  {getUniqueContractors().slice(0, 5).map(contractor => {
                    const contractorCount = filteredRoadworks.filter(rw => 
                      (rw.sm_promoter_organisation || rw.sm_promoter_name) === contractor
                    ).length;
                    
                    return (
                      <TouchableOpacity
                        key={contractor}
                        style={styles.contractorOption}
                        onPress={() => selectAllFromContractor(contractor)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.contractorOptionText} numberOfLines={1}>
                          {contractor}
                        </Text>
                        <View style={styles.contractorBadge}>
                          <Text style={styles.contractorBadgeText}>{contractorCount}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                
                <View style={styles.batchActions}>
                  <TouchableOpacity
                    style={styles.batchActionButton}
                    onPress={() => {
                      setSelectedRoadworks(new Set(filteredRoadworks.map(rw => rw.id)));
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="select-all" size={16} color="#3b82f6" />
                    <Text style={styles.batchActionText}>Select All</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.batchActionButton}
                    onPress={() => setSelectedRoadworks(new Set())}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="select-off" size={16} color="#6b7280" />
                    <Text style={[styles.batchActionText, { color: '#6b7280' }]}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Memory optimisation notice */}
            {filteredRoadworks.length > 100 && (
              <View style={styles.memoryWarning}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#fbbf24" />
                <Text style={styles.memoryWarningText}>
                  Showing roadworks for next 90 days to optimise performance. Use search to find specific locations.
                </Text>
              </View>
            )}

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading roadworks data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-octagon" size={72} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                  setCurrentPage(1);
                  setHasMorePages(true);
                  fetchRoadworks(0, true);
                }}>
                  <Text style={styles.retryButtonText}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            ) : filteredRoadworks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name={compartments.find(c => c.id === activeCompartment)?.icon || 'road-variant'} 
                  size={72} 
                  color="#6b7280" 
                />
                <Text style={styles.emptyText}>
                  No {compartments.find(c => c.id === activeCompartment)?.label.toLowerCase() || 'roadworks'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Try adjusting your search' : 
                   activeCompartment === 'all' ? 'No active roadworks in the system' :
                   activeCompartment === 'this-week' ? 'No roadworks starting in the next 7 days' :
                   activeCompartment === 'today' ? 'No roadworks starting today' :
                   activeCompartment === 'ending-soon' ? 'No roadworks ending in the next 3 days' :
                   activeCompartment === 'major' ? 'No major works or road closures active' :
                   activeCompartment === 'high-impact' ? 'No roadworks affecting 3+ bus routes' :
                   activeCompartment === 'weekend' ? 'No roadworks scheduled for weekends' :
                   'Check back later for updates'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={async () => {
                      setRefreshing(true);
                      setCurrentPage(1); // Reset to page 1
                      setHasMorePages(true);
                      await fetchRoadworks(0, true); // Pass isRefresh=true
                    }}
                    tintColor="#3b82f6"
                  />
                }
              >
                {filteredRoadworks.map((item, index) => (
                  <View key={`${item.id}-${index}`}>
                    <RoadworkCard item={item} index={index} />
                  </View>
                ))}
                
                {hasMorePages && activeCompartment === 'all' && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMoreRoadworks}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        Load More ({filteredRoadworks.length} loaded)
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SafeAreaView>

          {/* Enhanced Dismiss Modal */}
          {showDismissModal && selectedAlert && (
            <Modal
              visible={showDismissModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowDismissModal(false)}
            >
              <View style={styles.dismissModalOverlay}>
                <ScrollView contentContainerStyle={styles.dismissModalScrollContent}>
                  <View style={styles.dismissModalContent}>
                    <Text style={styles.dismissModalTitle}>Delete Roadwork Alert</Text>
                    
                    {/* Alert Summary */}
                    <View style={styles.alertSummary}>
                      <Text style={styles.alertSummaryTitle}>Alert Summary</Text>
                      <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#93c5fd" />
                        <Text style={styles.summaryText}>{selectedAlert.street_name}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#93c5fd" />
                        <Text style={styles.summaryText}>
                          {calculateDuration(selectedAlert)} days ({formatDate(selectedAlert.sm_start_date)} - {formatDate(selectedAlert.sm_end_date)})
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="bus-multiple" size={16} color="#93c5fd" />
                        <Text style={styles.summaryText}>
                          {selectedAlert.affectedRoutes?.length || 0} affected route(s)
                        </Text>
                      </View>
                      {selectedAlert.sm_traffic_management_type && (
                        <View style={styles.summaryRow}>
                          <MaterialCommunityIcons name="traffic-cone" size={16} color="#f59e0b" />
                          <Text style={[styles.summaryText, { color: '#f59e0b' }]}>
                            {selectedAlert.sm_traffic_management_type}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.dismissWarning}>
                      <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                      <Text style={styles.dismissWarningText}>
                        This action will permanently delete this roadwork alert and cannot be undone.
                      </Text>
                    </View>
                    
                    <Text style={styles.dismissModalLabel}>Select reason for deletion:</Text>
                    <ScrollView style={styles.dismissReasonsContainer}>
                      {dismissReasons.map(reason => (
                        <TouchableOpacity
                          key={reason.id}
                          style={[
                            styles.dismissReasonOption,
                            dismissReason === reason.id && styles.dismissReasonOptionActive
                          ]}
                          onPress={() => setDismissReason(reason.id)}
                        >
                          <View style={styles.dismissReasonContent}>
                            <MaterialCommunityIcons 
                              name={reason.icon} 
                              size={20} 
                              color={dismissReason === reason.id ? reason.color : '#93c5fd'} 
                            />
                            <Text style={[
                              styles.dismissReasonText,
                              dismissReason === reason.id && styles.dismissReasonTextActive,
                              { color: dismissReason === reason.id ? reason.color : '#93c5fd' }
                            ]}>
                              {reason.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.dismissModalLabel}>Additional notes (optional):</Text>
                    <TextInput
                      style={styles.dismissNotesInput}
                      placeholder="Add any additional context..."
                      placeholderTextColor="rgba(147, 197, 253, 0.5)"
                      value={dismissNotes}
                      onChangeText={setDismissNotes}
                      multiline
                      numberOfLines={3}
                    />

                    <View style={styles.dismissModalButtons}>
                      <TouchableOpacity
                        style={styles.dismissModalCancel}
                        onPress={() => {
                          setShowDismissModal(false);
                          setDismissReason('');
                          setDismissNotes('');
                        }}
                      >
                        <Text style={styles.dismissModalCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.dismissModalConfirm,
                          !dismissReason && styles.dismissModalConfirmDisabled
                        ]}
                        onPress={handleDismissConfirm}
                        disabled={!dismissReason}
                      >
                        <Text style={styles.dismissModalConfirmText}>Delete Permanently</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </Modal>
          )}

          {/* Batch Dismiss Modal */}
          {showBatchDismissModal && (
            <Modal
              visible={showBatchDismissModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowBatchDismissModal(false)}
            >
              <View style={styles.dismissModalOverlay}>
                <View style={styles.dismissModalContent}>
                  <Text style={styles.dismissModalTitle}>Batch Delete Alerts</Text>
                  <Text style={styles.batchSummary}>
                    You are about to permanently delete {selectedRoadworks.size} roadwork alerts.
                    This action cannot be undone.
                  </Text>
                  
                  <Text style={styles.dismissModalLabel}>Select reason for deletion:</Text>
                  <ScrollView style={styles.dismissReasonsContainer}>
                    {dismissReasons.map(reason => (
                      <TouchableOpacity
                        key={reason.id}
                        style={[
                          styles.dismissReasonOption,
                          dismissReason === reason.id && styles.dismissReasonOptionActive
                        ]}
                        onPress={() => setDismissReason(reason.id)}
                      >
                        <View style={styles.dismissReasonContent}>
                          <MaterialCommunityIcons 
                            name={reason.icon} 
                            size={20} 
                            color={dismissReason === reason.id ? reason.color : '#93c5fd'} 
                          />
                          <Text style={[
                            styles.dismissReasonText,
                            dismissReason === reason.id && styles.dismissReasonTextActive,
                            { color: dismissReason === reason.id ? reason.color : '#93c5fd' }
                          ]}>
                            {reason.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.dismissModalLabel}>Additional notes (optional):</Text>
                  <TextInput
                    style={styles.dismissNotesInput}
                    placeholder="Add any additional context..."
                    placeholderTextColor="rgba(147, 197, 253, 0.5)"
                    value={dismissNotes}
                    onChangeText={setDismissNotes}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.dismissModalButtons}>
                    <TouchableOpacity
                      style={styles.dismissModalCancel}
                      onPress={() => {
                        setShowBatchDismissModal(false);
                        setDismissReason('');
                        setDismissNotes('');
                      }}
                    >
                      <Text style={styles.dismissModalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.dismissModalConfirm,
                        !dismissReason && styles.dismissModalConfirmDisabled
                      ]}
                      onPress={() => handleBatchDismiss(dismissReason, dismissNotes)}
                      disabled={!dismissReason}
                    >
                      <Text style={styles.dismissModalConfirmText}>Batch Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Map Modal */}
          {showMapModal && selectedRoadworkForMap && (
            <RoadworkMapModal
              visible={showMapModal}
              roadwork={selectedRoadworkForMap}
              onClose={() => {
                setShowMapModal(false);
                setSelectedRoadworkForMap(null);
              }}
            />
          )}

          {/* Disruption Workflow Modal */}
          {showWorkflowModal && selectedRoadworkForWorkflow && (
            <DisruptionWorkflowModal
              visible={showWorkflowModal}
              alert={selectedRoadworkForWorkflow}
              onClose={() => {
                setShowWorkflowModal(false);
                setSelectedRoadworkForWorkflow(null);
              }}
              onComplete={() => {
                // Refresh or update the roadworks list if needed
                setShowWorkflowModal(false);
                setSelectedRoadworkForWorkflow(null);
                // Optionally refresh the roadworks data
                fetchRoadworks(0, true);
              }}
            />
          )}

          {/* Enhanced Escalation Options Modal */}
          <EscalationOptionsModal
            visible={showEscalateModal}
            onClose={() => {
              setShowEscalateModal(false);
              setEscalationReason('');
              setSelectedRoadworkForEscalation(null);
            }}
            roadwork={selectedRoadworkForEscalation}
            onComplete={(result) => {
              console.log('✅ Escalation completed:', result);
              // Remove from escalating set
              if (selectedRoadworkForEscalation) {
                setEscalatingRoadworks(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(selectedRoadworkForEscalation.id);
                  return newSet;
                });
                
                // Refresh roadworks list to remove escalated item
                fetchRoadworks(0, true);
              }
            }}
          />
                            
                            displayedAt: new Date().toISOString(),
                            displayedBy: supervisorName || 'Supervisor',
                            displayMessage: {
                              id: `roadwork-${roadwork.id}-${Date.now()}`,
                              priority: roadwork.sm_traffic_management_type === 'Road closure' ? 0 : 1,
                              expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour default
                              autoZoom: true,
                              zoomLevel: 15,
                              highlightIncident: true,
                              showRoutes: true,
                              pulseAnimation: true,
                              duration: 30000
                            },
                            
                            createdAt: new Date().toISOString()
                          };
                          
                          console.log('📤 Sending to Convex:', displayIncident);
                          
                          // Push to display via Convex
                          await updateDisplayIncidents({
                            incidents: [displayIncident],
                            timestamp: new Date().toISOString()
                          });
                          
                          console.log('✅ Successfully pushed to display');
                          
                          // Create disruption record in database
                          try {
                            const disruptionResponse = await fetch(`${API_CONFIG.baseURL}/api/disruptions/create`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                alert: {
                                  ...roadwork,
                                  id: roadwork.id,
                                  location: roadwork.street_name,
                                  sm_street_name: roadwork.street_name,
                                  sm_town: roadwork.sm_town || roadwork.town,
                                  sm_highway_authority: roadwork.sm_highway_authority || roadwork.highway_authority,
                                  sm_description: roadwork.sm_works_description || roadwork.sm_activity_type,
                                  sm_location_description: roadwork.sm_location_description || roadwork.location_description,
                                  coordinates: roadwork.coordinates,
                                  affectedRoutes: roadwork.affectedRoutes || []
                                },
                                pushedBy: supervisorSession?.supervisor?.badge || supervisorSession?.supervisor?.id || supervisorName,
                                pushedByName: supervisorName,
                                reason: escalationReason || 'Escalated to control room display',
                                sessionId: sessionId
                              })
                            });
                            
                            if (!disruptionResponse.ok) {
                              console.error('Failed to create disruption record:', await disruptionResponse.text());
                            } else {
                              const disruptionData = await disruptionResponse.json();
                              console.log('✅ Disruption record created:', disruptionData.disruption?.id);
                            }
                          } catch (disruptionError) {
                            console.error('Error creating disruption record:', disruptionError);
                            // Don't fail the whole escalation if disruption creation fails
                          }
                          
                          // Log activity
                          await logActivity('push_to_display', {
                            roadworkId: roadwork.id,
                            location: roadwork.street_name,
                            reason: escalationReason,
                            affectedRoutesCount: roadwork.affectedRoutes?.length || 0,
                            duration: calculateDuration(roadwork),
                            trafficManagement: roadwork.sm_traffic_management_type
                          });
                          
                          // Update local state to mark as escalated
                          setRoadworks(prevRoadworks => 
                            prevRoadworks.map(rw => 
                              rw.id === roadwork.id 
                                ? { ...rw, escalatedToDisplay: true, escalatedAt: new Date().toISOString(), escalatedBy: supervisorName }
                                : rw
                            )
                          );
                          setFilteredRoadworks(prevFiltered => 
                            prevFiltered.map(rw => 
                              rw.id === roadwork.id 
                                ? { ...rw, escalatedToDisplay: true, escalatedAt: new Date().toISOString(), escalatedBy: supervisorName }
                                : rw
                            )
                          );
                          
                          // Show success message
                          if (Platform.OS === 'web') {
                            window.alert(`Roadwork at ${roadwork.street_name} has been pushed to the Control Room Display.`);
                          } else {
                            Alert.alert(
                              'Success',
                              `Roadwork at ${roadwork.street_name} has been pushed to the Control Room Display.`,
                              [{ text: 'OK' }]
                            );
                          }
                          
                          // Close modal and reset
                          setShowEscalateModal(false);
                          setEscalationReason('');
                          setSelectedRoadworkForEscalation(null);
                        } catch (error) {
                          console.error('Failed to push to display:', error);
                          
                          if (Platform.OS === 'web') {
                            window.alert(`Failed to push to display: ${error.message}`);
                          } else {
                            Alert.alert(
                              'Error',
                              `Failed to push to display: ${error.message}`,
                              [{ text: 'OK' }]
                            );
                          }
                        } finally {
                          // Remove from escalating set
                          setEscalatingRoadworks(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(roadwork.id);
                            return newSet;
                          });
                        }
                      }}
                    >
                      <Text style={[styles.dismissModalConfirmText, { color: '#f97316' }]}>Push to Display</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  container: {
    flex: 1,
    margin: Platform.OS === 'web' ? 16 : 0,
    borderRadius: Platform.OS === 'web' ? 28 : 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#93c5fd',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
    opacity: 0.8,
  },
  searchWrapper: {
    marginBottom: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.2)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  compartmentTabs: {
    borderBottomWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 0,
    minHeight: 60,
    maxHeight: 60,
  },
  compartmentTabsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  compartmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.4)',
    marginRight: 6,
    gap: 6,
    minWidth: 120,
    height: 42,
    // React Native shadows (iOS)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Android elevation
    elevation: 2,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }),
  },
  compartmentTabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
    borderColor: '#3b82f6',
    borderWidth: 2,
    // React Native shadows (iOS)
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // Android elevation
    elevation: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
    }),
  },
  compartmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93c5fd',
    letterSpacing: 0.1,
  },
  compartmentTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  compartmentBadge: {
    backgroundColor: 'rgba(147, 197, 253, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 32,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  compartmentBadgeActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  compartmentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93c5fd',
  },
  compartmentBadgeTextActive: {
    color: '#1e40af',
    fontWeight: '900',
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  roadworkCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px) saturate(200%)',
      WebkitBackdropFilter: 'blur(20px) saturate(200%)',
      boxShadow: `
        inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.04),
        0 4px 8px rgba(0, 0, 0, 0.06),
        0 8px 16px rgba(0, 0, 0, 0.08),
        0 16px 32px rgba(0, 0, 0, 0.1),
        0 24px 48px rgba(0, 0, 0, 0.12)
      `,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      willChange: 'transform, box-shadow',
    }),
    // React Native shadows (iOS)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    // Android elevation
    elevation: 8,
  },
  cardTouchable: {
    padding: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 24,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
    paddingLeft: 4,
  },
  descriptionText: {
    flex: 1,
    fontSize: 15,
    color: '#fbbf24',
    lineHeight: 20,
  },
  promoterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    paddingLeft: 4,
  },
  promoterText: {
    flex: 1,
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '500',
  },
  trafficManagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    paddingLeft: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: -4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  trafficManagementText: {
    flex: 1,
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  routesSection: {
    marginBottom: 16,
  },
  routesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  routesLabel: {
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '600',
  },
  routesScroll: {
    marginHorizontal: -4,
  },
  routeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    minWidth: 60,
    alignItems: 'center',
  },
  routeBadgeHighImpact: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  routeBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreRoutesBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60a5fa',
  },
  routeTextHighImpact: {
    color: '#fbbf24',
  },
  routeDirectionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93c5fd',
    marginTop: 2,
  },
  routesSummaryText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  timeline: {
    marginBottom: 16,
  },
  timelineBar: {
    height: 4,
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderRadius: 2,
    marginBottom: 12,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    flex: 1,
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '500',
  },
  daysBadge: {
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  daysText: {
    fontSize: 12,
    color: '#93c5fd',
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    borderWidth: 2,
    minHeight: 56,
    // React Native shadows (iOS)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android elevation
    elevation: 3,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    }),
  },
  mapButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
    ...(Platform.OS === 'web' && {
      backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
    }),
  },
  acknowledgeButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: '#22c55e',
  },
  escalateButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    borderColor: '#f97316',
  },
  endDisplayButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderColor: '#dc2626',
  },
  dismissButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  qualityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  validationWarning: {
    position: 'absolute',
    top: 2,
    right: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#93c5fd',
    fontWeight: '500',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  retryButtonText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  dismissModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissModalContent: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: 'rgba(17, 25, 40, 0.95)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dismissModalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
  },
  dismissModalLabel: {
    fontSize: 14,
    color: '#93c5fd',
    marginBottom: 12,
    fontWeight: '600',
  },
  dismissReasonsContainer: {
    maxHeight: 240,
    marginBottom: 24,
  },
  dismissReasonOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(147, 197, 253, 0.05)',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.1)',
  },
  dismissReasonOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  dismissReasonText: {
    fontSize: 16,
    color: '#93c5fd',
    fontWeight: '500',
  },
  dismissReasonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dismissNotesInput: {
    backgroundColor: 'rgba(147, 197, 253, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.1)',
    marginBottom: 28,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  dismissModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissModalCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(147, 197, 253, 0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.1)',
  },
  dismissModalCancelText: {
    fontSize: 16,
    color: '#93c5fd',
    fontWeight: '700',
  },
  dismissModalConfirm: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  dismissModalConfirmDisabled: {
    opacity: 0.4,
  },
  dismissModalConfirmText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '700',
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#60a5fa',
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  memoryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    padding: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  memoryWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#fbbf24',
    lineHeight: 18,
  },
  
  // Enhanced dismiss styles
  roadworkCardSelected: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  
  selectionCheckbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  batchModeToggle: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  
  batchDismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  batchDismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  
  // Enhanced modal styles
  dismissModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  alertSummary: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  alertSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  
  summaryText: {
    fontSize: 14,
    color: '#93c5fd',
    flex: 1,
  },
  
  dismissWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  dismissWarningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
    flex: 1,
  },
  
  dismissReasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  
  batchSummary: {
    fontSize: 16,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  
  // Batch operations styles
  batchOperations: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  batchOperationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  
  contractorOptions: {
    marginBottom: 12,
  },
  
  contractorOptionsContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  
  contractorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
    gap: 8,
    minWidth: 120,
  },
  
  contractorOptionText: {
    fontSize: 13,
    color: '#93c5fd',
    fontWeight: '500',
    flex: 1,
  },
  
  contractorBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  
  contractorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
  
  batchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  batchActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  
  batchActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  coordinateQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    bottom: -8,
    right: -4,
    borderWidth: 1,
  },
  coordinateQualityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Escalated indicator styles
  escalatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.3)',
  },
  escalatedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f97316',
    flex: 1,
  },
  
  // LINESTRING map preview styles
  linestringMapContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  linestringMapLabel: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linestringMap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
});

export default RoadworksManagerDashboard;
