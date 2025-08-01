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
import { geocodeLocation } from '../services/geocoding';

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

// Coordinate quality assessment
const assessCoordinateQuality = (item) => {
  // Check if coordinates exist
  if (!item.coordinates) {
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
  
  // High precision GPS coordinates
  if (coordinateSource === 'gps' || coordinateSource === 'survey' || 
      coordinateSource === 'street_manager_precise' || coordinateAccuracy === 'high') {
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
      coordinateSource === 'street_manager_geocoded' || coordinateAccuracy === 'medium') {
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
  const [displayLimit, setDisplayLimit] = useState(50); // Start with 50 items
  const [activeCompartment, setActiveCompartment] = useState('all'); // Active filter compartment
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissNotes, setDismissNotes] = useState('');
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRoadworkForMap, setSelectedRoadworkForMap] = useState(null);
  const [geocodingStates, setGeocodingStates] = useState(new Map());
  
  // Enhanced dismiss state
  const [selectedRoadworks, setSelectedRoadworks] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [pendingDismissals, setPendingDismissals] = useState(new Map());
  const [dismissalAnimations, setDismissalAnimations] = useState(new Map());
  const [smartSuggestion, setSmartSuggestion] = useState('');
  const [showBatchDismissModal, setShowBatchDismissModal] = useState(false);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

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
        return works.filter(item => 
          item.affectedRoutes && item.affectedRoutes.length >= 3
        );
      
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

  // Fetch roadworks data with default 90-day window
  const fetchRoadworks = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/roadworks/unified?days=90');
      const data = await response.json();
      
      if (data.success && data.data) {
        const formattedRoadworks = data.data.map(item => ({
          ...item,
          // Map Street Manager fields to component fields
          street_name: item.sm_street_name || item.street_name || item.sm_location_description || 'Unknown Location',
          location_description: item.sm_location_description || item.location_description || item.sm_street_name || '',
          start_date: item.sm_start_date || item.start_date || '',
          end_date: item.sm_end_date || item.end_date || '',
          affectedRoutes: item.affectedRoutes || item.affected_routes || [],
          durationDays: item.durationDays || item.duration_days || 1,
          isUrgent: item.isUrgent || item.is_urgent || item.sm_traffic_management_type === 'Road closure',
          // Include coordinates from backend processing
          coordinates: item.coordinates || null,
          coordinateSource: item.coordinateSource || null,
          coordinateAccuracy: item.coordinateAccuracy || null
        }));
        setRoadworks(formattedRoadworks);
        setFilteredRoadworks(formattedRoadworks);
      }
    } catch (err) {
      setError('Failed to fetch roadworks data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoadworks();
    
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Enhanced dismiss reasons with smart categorization
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

  // Smart suggestion logic
  const getSmartSuggestion = (alert) => {
    if (!alert) return '';
    
    const duration = calculateDuration(alert);
    const endDate = new Date(alert.sm_end_date || alert.end_date);
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const affectedRoutes = alert.affectedRoutes || [];
    
    if (daysUntilEnd <= 1 && daysUntilEnd >= 0) {
      return 'work-completed-early';
    }
    
    if (affectedRoutes.length >= 5) {
      return 'Warning: This affects multiple routes. Consider carefully.';
    }
    
    if (duration > 14 || alert.sm_traffic_management_type === 'Road closure') {
      return 'Warning: Major roadwork - requires confirmation.';
    }
    
    if (affectedRoutes.length === 0) {
      return 'not-affecting-routes';
    }
    
    return '';
  };

  // Toast notification system
  const showToast = (message, action = null) => {
    setToastMessage({ message, action });
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(action ? 5000 : 2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setToastMessage(null);
    });
  };

  // Enhanced dismiss with undo functionality
  const handleDismissWithUndo = async (roadworkId, reason, notes) => {
    const roadwork = roadworks.find(r => r.id === roadworkId);
    if (!roadwork) return;

    // Create slide-out animation
    const slideAnim = new Animated.Value(0);
    setDismissalAnimations(prev => new Map(prev.set(roadworkId, slideAnim)));
    
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Remove from display immediately
    setRoadworks(prev => prev.filter(item => item.id !== roadworkId));
    setFilteredRoadworks(prev => prev.filter(item => item.id !== roadworkId));
    
    // Store for potential undo
    setPendingDismissals(prev => new Map(prev.set(roadworkId, {
      roadwork,
      reason,
      notes,
      timestamp: Date.now()
    })));

    // Show undo toast
    showToast('Alert dismissed', () => undoDismissal(roadworkId));
    
    // Set timeout for permanent deletion
    const timeoutId = setTimeout(() => {
      performPermanentDismissal(roadworkId, reason, notes);
    }, 5000);
    
    setUndoTimeout(prev => {
      if (prev) clearTimeout(prev);
      return timeoutId;
    });
  };

  // Undo dismissal
  const undoDismissal = (roadworkId) => {
    const pending = pendingDismissals.get(roadworkId);
    if (!pending) return;
    
    // Restore to lists
    setRoadworks(prev => [...prev, pending.roadwork].sort((a, b) => 
      new Date(a.sm_start_date || a.start_date) - new Date(b.sm_start_date || b.start_date)
    ));
    
    // Clear pending dismissal
    setPendingDismissals(prev => {
      const newMap = new Map(prev);
      newMap.delete(roadworkId);
      return newMap;
    });
    
    // Clear animation
    setDismissalAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(roadworkId);
      return newMap;
    });
    
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    
    showToast('Dismissal cancelled');
  };

  // Perform permanent dismissal
  const performPermanentDismissal = async (roadworkId, reason, notes) => {
    const pending = pendingDismissals.get(roadworkId);
    if (!pending) return;
    
    try {
      // Log detailed dismissal with analytics
      await dismissAlert(roadworkId, {
        reason,
        notes,
        supervisor: supervisorName,
        timestamp: new Date().toISOString(),
        affectedRoutes: pending.roadwork.affectedRoutes?.length || 0,
        duration: calculateDuration(pending.roadwork),
        location: pending.roadwork.street_name,
        trafficManagementType: pending.roadwork.sm_traffic_management_type,
        promoter: pending.roadwork.sm_promoter_organisation
      });
      
      await logActivity('dismiss_roadwork_permanent', {
        roadworkId,
        reason,
        notes,
        location: pending.roadwork.street_name,
        affectedRoutesCount: pending.roadwork.affectedRoutes?.length || 0,
        duration: calculateDuration(pending.roadwork),
        dismissalStats: {
          totalDismissalsToday: 1, // This would be calculated from actual data
          reasonUsage: reason
        }
      });
      
      showToast('Alert permanently dismissed');
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      // Restore on error
      undoDismissal(roadworkId);
      Alert.alert('Error', 'Failed to dismiss alert. Please try again.');
    }
    
    // Clean up
    setPendingDismissals(prev => {
      const newMap = new Map(prev);
      newMap.delete(roadworkId);
      return newMap;
    });
    
    setDismissalAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(roadworkId);
      return newMap;
    });
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
    
    for (const roadworkId of selectedIds) {
      await handleDismissWithUndo(roadworkId, reason, notes);
    }
    
    setSelectedRoadworks(new Set());
    setBatchMode(false);
    setShowBatchDismissModal(false);
    
    showToast(`${selectedIds.length} alerts dismissed`);
  };

  // Optimized roadwork card with enhancements
  const RoadworkCard = ({ item, index }) => {
    const [isPressed, setIsPressed] = useState(false);
    const slideAnim = dismissalAnimations.get(item.id) || new Animated.Value(0);
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
              },
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -screenWidth]
                })
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

          {/* Affected routes */}
          {item.affectedRoutes && item.affectedRoutes.length > 0 && (
            <View style={styles.routesSection}>
              <View style={styles.routesHeader}>
                <MaterialCommunityIcons name="bus-multiple" size={16} color="#93c5fd" />
                <Text style={styles.routesLabel}>Affected Routes</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.routesScroll}
              >
                {item.affectedRoutes.slice(0, 6).map((route, idx) => (
                  <View 
                    key={idx} 
                    style={styles.routeBadge}
                  >
                    <Text style={styles.routeText}>{route}</Text>
                  </View>
                ))}
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
                {/* Coordinate quality indicator */}
                <View style={[
                  styles.qualityIndicator,
                  { backgroundColor: assessCoordinateQuality(item).color }
                ]} />
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
              onPress={() => handleEscalate(item)}
              activeOpacity={0.7}
            >
              <View 
                style={[styles.actionContent, styles.escalateButton]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button escalate' })}
              >
                <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#f97316" />
                <Text style={[styles.actionText, { color: '#f97316' }]}>Escalate</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedAlert(item);
                setSmartSuggestion(getSmartSuggestion(item));
                setShowDismissModal(true);
              }}
              activeOpacity={0.7}
            >
              <View 
                style={[styles.actionContent, styles.dismissButton]}
                {...(Platform.OS === 'web' && { className: 'glass-action-button dismiss' })}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Dismiss</Text>
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
          // Use the existing geocoding service
          const geocodedResult = await geocodeLocation(locationString);
          
          if (geocodedResult && geocodedResult.latitude && geocodedResult.longitude) {
            // Update the item with geocoded coordinates
            const updatedItem = {
              ...item,
              coordinates: [geocodedResult.latitude, geocodedResult.longitude],
              coordinateSource: 'geocoded_fallback',
              coordinateAccuracy: geocodedResult.confidence || 'medium'
            };
            
            // Update the roadworks state
            setRoadworks(prev => prev.map(rw => 
              rw.id === item.id ? updatedItem : rw
            ));
            setFilteredRoadworks(prev => prev.map(rw => 
              rw.id === item.id ? updatedItem : rw
            ));
            
            setSelectedRoadworkForMap(updatedItem);
            setShowMapModal(true);
            
            await logActivity('geocoded_roadwork_location', {
              roadworkId: item.id,
              originalLocation: locationString,
              geocodedCoordinates: [geocodedResult.latitude, geocodedResult.longitude],
              confidence: geocodedResult.confidence
            });
          } else {
            // Show general area map with search functionality
            setSelectedRoadworkForMap({
              ...item,
              coordinates: null, // Will trigger fallback in modal
              geocodingAttempted: true,
              originalLocationString: locationString
            });
            setShowMapModal(true);
          }
        } else {
          // No location data available - show regional map
          setSelectedRoadworkForMap({
            ...item,
            coordinates: null,
            showRegionalMap: true
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
    await logActivity('acknowledge_roadwork', {
      roadworkId: roadwork.id,
      location: roadwork.street_name
    });
    alert(`Acknowledged: ${roadwork.street_name}`);
  };

  const handleEscalate = async (roadwork) => {
    await logActivity('escalate_roadwork', {
      roadworkId: roadwork.id,
      location: roadwork.street_name
    });
    alert(`Escalated: ${roadwork.street_name}`);
  };

  const handleDismissConfirm = async () => {
    if (!selectedAlert || !dismissReason) return;

    // Check for high-impact alert confirmation
    const affectedRoutes = selectedAlert.affectedRoutes || [];
    const duration = calculateDuration(selectedAlert);
    const isHighImpact = affectedRoutes.length >= 5 || duration > 14 || 
                        selectedAlert.sm_traffic_management_type === 'Road closure';
    
    if (isHighImpact) {
      Alert.alert(
        'Confirm High-Impact Dismissal',
        `This roadwork affects ${affectedRoutes.length} routes and lasts ${duration} days. Are you sure you want to dismiss it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm Dismiss', 
            style: 'destructive',
            onPress: proceedWithDismissal
          }
        ]
      );
    } else {
      proceedWithDismissal();
    }
  };
  
  const proceedWithDismissal = async () => {
    await handleDismissWithUndo(selectedAlert.id, dismissReason, dismissNotes);
    
    setShowDismissModal(false);
    setDismissReason('');
    setDismissNotes('');
    setSelectedAlert(null);
    setSmartSuggestion('');
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoTimeout]);

  // Filter roadworks by compartment and search
  useEffect(() => {
    let filtered = roadworks;

    // Apply compartment filter first
    filtered = filterByCompartment(filtered);

    // Then apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.street_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.affectedRoutes?.some(route => 
          route.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredRoadworks(filtered);
    setDisplayLimit(50); // Reset to initial limit when filtering changes
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
                    {' '}{supervisorName} • {compartments.find(c => c.id === activeCompartment)?.label} • {Math.min(displayLimit, filteredRoadworks.length)} of {filteredRoadworks.length}
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
                      <Text style={styles.batchDismissText}>Dismiss ({selectedRoadworks.size})</Text>
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
                <TouchableOpacity style={styles.retryButton} onPress={fetchRoadworks}>
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
                    onRefresh={() => {
                      setRefreshing(true);
                      fetchRoadworks();
                    }}
                    tintColor="#3b82f6"
                  />
                }
              >
                {filteredRoadworks.slice(0, displayLimit).map((item, index) => (
                  <View key={item.id}>
                    <RoadworkCard item={item} index={index} />
                  </View>
                ))}
                
                {filteredRoadworks.length > displayLimit && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => setDisplayLimit(prev => Math.min(prev + 50, filteredRoadworks.length))}
                  >
                    <Text style={styles.loadMoreText}>
                      Load More ({displayLimit} of {filteredRoadworks.length})
                    </Text>
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
                    <Text style={styles.dismissModalTitle}>Dismiss Roadwork Alert</Text>
                    
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

                    {/* Smart Suggestion */}
                    {smartSuggestion && (
                      <View style={[
                        styles.smartSuggestion,
                        smartSuggestion.includes('Warning') && styles.smartSuggestionWarning
                      ]}>
                        <MaterialCommunityIcons 
                          name={smartSuggestion.includes('Warning') ? "alert" : "lightbulb-on"} 
                          size={16} 
                          color={smartSuggestion.includes('Warning') ? "#f59e0b" : "#3b82f6"} 
                        />
                        <Text style={[
                          styles.smartSuggestionText,
                          smartSuggestion.includes('Warning') && { color: '#f59e0b' }
                        ]}>
                          {typeof smartSuggestion === 'string' && smartSuggestion.includes('Warning') 
                            ? smartSuggestion 
                            : `Suggested: ${dismissReasons.find(r => r.id === smartSuggestion)?.label || smartSuggestion}`}
                        </Text>
                      </View>
                    )}
                    
                    <Text style={styles.dismissModalLabel}>Select reason for dismissal:</Text>
                    <ScrollView style={styles.dismissReasonsContainer}>
                      {dismissReasons.map(reason => (
                        <TouchableOpacity
                          key={reason.id}
                          style={[
                            styles.dismissReasonOption,
                            dismissReason === reason.id && styles.dismissReasonOptionActive,
                            smartSuggestion === reason.id && styles.dismissReasonSuggested
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
                            {smartSuggestion === reason.id && (
                              <View style={styles.suggestedBadge}>
                                <Text style={styles.suggestedBadgeText}>Suggested</Text>
                              </View>
                            )}
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
                          setSmartSuggestion('');
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
                        <Text style={styles.dismissModalConfirmText}>Dismiss</Text>
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
                  <Text style={styles.dismissModalTitle}>Batch Dismiss Alerts</Text>
                  <Text style={styles.batchSummary}>
                    You are about to dismiss {selectedRoadworks.size} roadwork alerts.
                  </Text>
                  
                  <Text style={styles.dismissModalLabel}>Select reason for dismissal:</Text>
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
                      <Text style={styles.dismissModalConfirmText}>Batch Dismiss</Text>
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

          {/* Toast Notification */}
          {toastMessage && (
            <Animated.View
              style={[
                styles.toastContainer,
                {
                  opacity: toastAnim,
                  transform: [{
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.toastContent}>
                <Text style={styles.toastText}>{toastMessage.message}</Text>
                {toastMessage.action && (
                  <TouchableOpacity
                    style={styles.toastButton}
                    onPress={toastMessage.action}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toastButtonText}>UNDO</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
  
  smartSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  
  smartSuggestionWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  
  smartSuggestionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    flex: 1,
  },
  
  dismissReasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  
  dismissReasonSuggested: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  
  suggestedBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  
  suggestedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  
  batchSummary: {
    fontSize: 16,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  
  // Toast notification styles
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 40 : 80,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 25, 40, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }),
  },
  
  toastText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  
  toastButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginLeft: 12,
  },
  
  toastButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
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
});

export default RoadworksManagerDashboard;
