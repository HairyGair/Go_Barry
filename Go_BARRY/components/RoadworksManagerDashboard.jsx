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
  
  // NEW: Track dismissed roadwork IDs to filter them out
  const [dismissedRoadworkIds, setDismissedRoadworkIds] = useState(() => {
    // Load dismissed IDs from localStorage on mount
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('dismissedRoadworkIds');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Failed to load dismissed roadworks:', e);
        return [];
      }
    }
    return [];
  });
  
  // Save dismissed IDs whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('dismissedRoadworkIds', JSON.stringify(dismissedRoadworkIds));
        console.log(`💾 Saved ${dismissedRoadworkIds.length} dismissed roadwork IDs`);
      } catch (e) {
        console.error('Failed to save dismissed roadworks:', e);
      }
    }
  }, [dismissedRoadworkIds]);
  
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
    timeframe: '90', // Show roadworks for next 90 days by default (increased from 30)
    sortBy: 'startDate', // 'startDate', 'endDate', 'severity', 'location'
    sortOrder: 'asc' // 'asc', 'desc'
  });
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  
  // Pagination state for handling large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Show 100 items per page

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
  const parseCoordinatesFromWKT = (wktString) => {
    if (!wktString || typeof wktString !== 'string') return null;
    
    try {
      // Parse WKT POINT format: "POINT(-1.234567 54.987654)"
      const match = wktString.match(/POINT\s*\(\s*([\-\d\.]+)\s+([\-\d\.]+)\s*\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        
        // Validate coordinates are reasonable for UK
        if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
          return [lat, lng];
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to parse WKT coordinates:', wktString, error);
      return null;
    }
  };

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

  // Enhanced filtering and sorting functions
  const applyFiltersAndSorting = (alerts) => {
    if (!alerts || alerts.length === 0) return [];
    
    console.log(`🔍 Applying filters and sorting to ${alerts.length} alerts`);
    console.log('Current filters:', filters);
    
    // Debug: Show start date distribution before filtering
    if (filters.timeframe === 'starts_7') {
      const now = new Date();
      const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      console.log(`🚨 URGENT FILTER DEBUG:`);
      console.log(`  - Current time: ${now.toISOString()}`);
      console.log(`  - 7-day cutoff: ${next7Days.toISOString()}`);
      console.log(`  - Total alerts to check: ${alerts.length}`);
      
      const dateAnalysis = {
        withStartDates: 0,
        withoutStartDates: 0,
        pastWorks: 0,
        todayWorks: 0,
        next7DayWorks: 0,
        futureWorks: 0
      };
      
      alerts.forEach((alert, index) => {
        if (alert.startDate) {
          dateAnalysis.withStartDates++;
          const startDate = new Date(alert.startDate);
          const daysFromNow = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
          
          console.log(`  Alert ${index + 1}: "${alert.location}" starts in ${daysFromNow} days (${alert.startDate})`);
          
          if (startDate < now) {
            dateAnalysis.pastWorks++;
          } else if (daysFromNow === 0) {
            dateAnalysis.todayWorks++;
          } else if (daysFromNow <= 7) {
            dateAnalysis.next7DayWorks++;
          } else {
            dateAnalysis.futureWorks++;
          }
        } else {
          dateAnalysis.withoutStartDates++;
          console.log(`  Alert ${index + 1}: "${alert.location}" - NO START DATE`);
        }
      });
      
      console.log(`📈 Date Analysis:`, dateAnalysis);
      console.log(`🎯 Should show ${dateAnalysis.todayWorks + dateAnalysis.next7DayWorks} works in urgent filter`);
    }
    
    // Apply filters
    let filteredAlerts = alerts.filter(alert => {
      // Severity filter
      if (filters.severity !== 'ALL' && alert.severity !== filters.severity) {
        return false;
      }
      
      // Area filter
      if (filters.area !== 'ALL') {
        const location = (alert.location || '').toLowerCase();
        const area = filters.area.toLowerCase();
        if (!location.includes(area)) {
          return false;
        }
      }
      
      // Timeframe filter
      if (filters.timeframe !== 'ALL') {
        const now = new Date();
        
        if (filters.timeframe === 'starts_7') {
          // Special filter: Show roadworks that are operationally relevant in the next 7 days
          // This includes: works starting soon OR works currently active
          const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
          const startDate = alert.startDate ? new Date(alert.startDate) : null;
          const endDate = alert.endDate ? new Date(alert.endDate) : null;
          
          // Debug: Show all dates we're checking
          if (startDate) {
            const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
            console.log(`🔍 DEBUG Urgent Filter: "${alert.location}"`);
            console.log(`  - Raw startDate: ${alert.startDate}`);
            console.log(`  - Parsed startDate: ${startDate.toISOString()}`);
            console.log(`  - Now: ${now.toISOString()}`);
            console.log(`  - Next7Days: ${next7Days.toISOString()}`);
            console.log(`  - Days until start: ${daysUntilStart}`);
            console.log(`  - Has ended: ${endDate ? endDate <= now : 'No end date'}`);
          } else {
            console.log(`🔍 DEBUG Urgent Filter: "${alert.location}" - NO START DATE`);
          }
          
          // Include ONLY if starts within next 7 days (future works only)
          // Exclude already started works for this specific filter
          const startsWithin7Days = startDate && startDate > now && startDate <= next7Days;
          
          const isRelevant = startsWithin7Days;
          
          if (!isRelevant) {
            return false;
          }
        } else {
          // Standard timeframe filtering (active within period)
          const daysAhead = parseInt(filters.timeframe);
          const timeframeCutoff = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
          
          const startDate = alert.startDate ? new Date(alert.startDate) : null;
          const endDate = alert.endDate ? new Date(alert.endDate) : null;
          
          // Show if starts within timeframe OR is currently active (no end date or ends in future)
          const startsWithinTimeframe = startDate && startDate <= timeframeCutoff;
          const isCurrentlyActive = !endDate || endDate > now;
          const endsWithinTimeframe = endDate && endDate <= timeframeCutoff && endDate > now;
          
          if (!startsWithinTimeframe && !isCurrentlyActive && !endsWithinTimeframe) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    console.log(`✅ After filtering: ${filteredAlerts.length} alerts remain`);
    
    // Apply sorting
    filteredAlerts.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'startDate':
          const aStart = a.startDate ? new Date(a.startDate) : new Date(0);
          const bStart = b.startDate ? new Date(b.startDate) : new Date(0);
          comparison = aStart.getTime() - bStart.getTime();
          break;
          
        case 'endDate':
          const aEnd = a.endDate ? new Date(a.endDate) : new Date('2099-12-31');
          const bEnd = b.endDate ? new Date(b.endDate) : new Date('2099-12-31');
          comparison = aEnd.getTime() - bEnd.getTime();
          break;
          
        case 'severity':
          const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
          const aSeverity = severityOrder[a.severity] || 4;
          const bSeverity = severityOrder[b.severity] || 4;
          comparison = aSeverity - bSeverity;
          break;
          
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '');
          break;
          
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    console.log(`📊 Sorted by ${filters.sortBy} (${filters.sortOrder}): ${filteredAlerts.length} alerts`);
    
    return filteredAlerts;
  };

  // Memoized filtered and sorted alerts
  const filteredAndSortedAlerts = useMemo(() => {
    // First filter out dismissed roadworks
    const nonDismissedAlerts = criticalAlerts.filter(alert => 
      !dismissedRoadworkIds.includes(alert.id)
    );
    console.log(`🚫 Filtering out ${criticalAlerts.length - nonDismissedAlerts.length} dismissed roadworks`);
    
    // Then apply regular filters and sorting
    return applyFiltersAndSorting(nonDismissedAlerts);
  }, [criticalAlerts, filters, dismissedRoadworkIds]);
  
  // Paginated alerts for display
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAlerts.slice(startIndex, endIndex);
  }, [filteredAndSortedAlerts, currentPage, itemsPerPage]);
  
  // Total pages calculation
  const totalPages = Math.ceil(filteredAndSortedAlerts.length / itemsPerPage);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, dismissedRoadworkIds]);
  
  // Add keyboard navigation for web platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (e) => {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [currentPage, totalPages]);

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
      
      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();
      
      // Include year if it's different from current year
      const options = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        ...(dateYear !== currentYear && { year: 'numeric' }), // Add year if not current year
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
  }, []);

  // Separate effect for filter changes to avoid full data reload
  useEffect(() => {
    console.log('🔍 Filters changed, recalculating route impacts...');
    if (criticalAlerts.length > 0) {
      loadRouteImpacts();
    }
  }, [filteredAndSortedAlerts]);

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
      
      console.log('Loading StreetManager alerts from Supabase...');
      
      // Fetch directly from the roadworks unified endpoint which connects to Supabase streetworks table
      const roadworksResponse = await fetch(`${baseUrl}/api/roadworks/unified`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (!roadworksResponse.ok) {
        console.error('Failed to fetch roadworks:', roadworksResponse.status, roadworksResponse.statusText);
        // Don't clear existing alerts on error
        return;
      }
      
      const roadworksData = await roadworksResponse.json();
      console.log('Supabase streetworks data received:', {
        success: roadworksData.success,
        count: roadworksData.data?.length || 0,
        source: roadworksData.metadata?.source
      });
      
      if (roadworksData.success && roadworksData.data && roadworksData.data.length > 0) {
        // Process raw Supabase streetworks data
        const streetManagerData = roadworksData.data;
        
        console.log(`🚀 MASSIVE DATA LOAD: Found ${streetManagerData.length} StreetManager webhook notifications from Supabase`);
        console.log(`📦 This is the full dataset - no limits applied!`);
        
        if (streetManagerData.length > 0) {
          // Filter active roadworks only
          const activeRoadworks = streetManagerData.filter(work => {
            // Filter out completed, cancelled, or expired works
            const isCompleted = work.sm_works_state === 'Works completed' || 
                              work.sm_works_state === 'completed' ||
                              work.sm_cancelled === true;
            const isExpired = work.sm_actual_end_date && new Date(work.sm_actual_end_date) < new Date();
            return !isCompleted && !isExpired;
          });
          
          console.log(`Filtered to ${activeRoadworks.length} active roadworks from ${streetManagerData.length} total`);
          
          // NO DATE FILTERING - Use ALL active roadworks
          const immediateRoadworks = activeRoadworks; // Use all active roadworks!
          const now = new Date(); // Still need this for sorting and other logic
          
          console.log(`📌 Using ALL ${immediateRoadworks.length} active roadworks (no date filtering applied)`);
          console.log('📅 TODAY IS:', now.toISOString(), '- Next 7 days cutoff:', new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString());
          
          // Sort by urgency: ongoing works first, then by start date
          const sortedWorks = immediateRoadworks.sort((a, b) => {
            const now = new Date();
            const aStart = new Date(a.sm_start_date || a.sm_actual_start_date || now);
            const bStart = new Date(b.sm_start_date || b.sm_actual_start_date || now);
            
            // Ongoing works (started) come first
            const aStarted = aStart <= now;
            const bStarted = bStart <= now;
            
            if (aStarted && !bStarted) return -1;
            if (!aStarted && bStarted) return 1;
            
            // Within same category, sort by start date
            return aStart - bStart;
          });
          
          const alerts = sortedWorks.map(work => ({ // Process ALL roadworks - no slicing!
            id: work.id || work.sm_reference || `streetmanager-${Date.now()}-${Math.random()}`,
            location: work.sm_street_name || work.sm_location_description || work.sm_area_name || 'Unknown location',
            description: work.sm_works_description || work.sm_works_category || 'StreetManager roadworks',
            severity: work.severity || determineSeverity({
              location: work.sm_location_description || work.sm_street_name,
              description: work.sm_works_description,
              workType: work.sm_works_category
            }),
            startDate: work.sm_start_date || work.sm_actual_start_date || work.webhook_received_at || work.created_at,
            endDate: work.sm_end_date || work.sm_actual_end_date || null,
            expectedImpact: work.sm_traffic_management_type || 'Potential traffic impact from ' + (work.sm_works_category || 'roadworks'),
            affectedRoutes: work.affectedRoutes || generateMockRoutes(work.sm_location_description || work.sm_street_name),
            status: work.sm_works_state || work.status || 'active',
            source: 'streetmanager_webhook',
            permitReference: work.sm_permit_reference || work.sm_reference,
            workCategory: work.sm_works_category,
            authority: work.sm_highway_authority || work.sm_promoter_name,
            
            // NEW: Enhanced coordinate data from backend processing
            coordinates: work.coordinates || null,
            coordinateSource: work.coordinateSource || 'none',
            coordinateAccuracy: work.coordinateAccuracy || null,
            coordinateError: work.coordinateError || null,
            originalCoordinates: work.originalCoordinates || null,
            coordinatePoints: work.coordinatePoints || null,
            
            // Add urgency indicator
            isUrgent: work.sm_start_date && new Date(work.sm_start_date) <= new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)), // Next 7 days
            daysUntilStart: work.sm_start_date ? Math.ceil((new Date(work.sm_start_date) - now) / (1000 * 60 * 60 * 24)) : null
          }));
          
          console.log(`✅ Loaded ${alerts.length} StreetManager alerts from ALL active roadworks`);
      
      // DEBUG: Analyze start dates to understand the data
      const dateAnalysis = {
        total: alerts.length,
        withStartDates: 0,
        alreadyStarted: 0,
        startingToday: 0,
        startingNext7Days: 0,
        startingNext30Days: 0,
        startingNext90Days: 0,
        startingBeyond90Days: 0,
        noStartDate: 0
      };
      
      alerts.forEach(alert => {
        if (!alert.startDate) {
          dateAnalysis.noStartDate++;
          return;
        }
        
        dateAnalysis.withStartDates++;
        const startDate = new Date(alert.startDate);
        const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilStart < 0) {
          dateAnalysis.alreadyStarted++;
        } else if (daysUntilStart === 0) {
          dateAnalysis.startingToday++;
        } else if (daysUntilStart <= 7) {
          dateAnalysis.startingNext7Days++;
        } else if (daysUntilStart <= 30) {
          dateAnalysis.startingNext30Days++;
        } else if (daysUntilStart <= 90) {
          dateAnalysis.startingNext90Days++;
        } else {
          dateAnalysis.startingBeyond90Days++;
        }
      });
      
      console.log('📊 ROADWORKS DATE ANALYSIS:', dateAnalysis);
      console.log(`🎯 Works starting in next 7 days: ${dateAnalysis.startingToday + dateAnalysis.startingNext7Days} (${dateAnalysis.startingToday} today + ${dateAnalysis.startingNext7Days} next 7 days)`);
      
      // Show sample of future works
      const futureWorks = alerts
        .filter(a => a.startDate && new Date(a.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
      
      if (futureWorks.length > 0) {
        console.log('📅 Next 5 upcoming roadworks:');
        futureWorks.forEach((work, i) => {
          const daysAway = Math.ceil((new Date(work.startDate) - now) / (1000 * 60 * 60 * 24));
          console.log(`  ${i + 1}. ${work.location} - starts in ${daysAway} days (${new Date(work.startDate).toLocaleDateString()})`);
        });
      }
          
          // Memory usage monitoring for 15000 records
          const alertMemoryEstimate = alerts.length * 2; // ~2KB per alert object
          console.log(`📊 Memory estimate: ~${(alertMemoryEstimate / 1024).toFixed(1)}MB for ${alerts.length} alerts`);
          
          if (alerts.length > 10000) {
            console.warn('⚠️ Very high alert count (10,000+) - monitor for performance impact.');
          } else if (alerts.length > 5000) {
            console.log('⚠️ High alert count (5,000+) - dismissals will help manage this.');
          }
          
          // Debug coordinate extraction success
          const alertsWithCoords = alerts.filter(alert => alert.coordinates && alert.coordinates.length === 2);
          const coordPercentage = alerts.length > 0 ? Math.round((alertsWithCoords.length / alerts.length) * 100) : 0;
          console.log(`📍 Coordinate extraction: ${alertsWithCoords.length}/${alerts.length} alerts (${coordPercentage}%) have precise coordinates`);
          
          // Debug first alert's coordinate data
          if (alerts.length > 0) {
            const firstAlert = alerts[0];
            console.log('🔍 First alert coordinate debug:', {
              id: firstAlert.id,
              location: firstAlert.location,
              coordinates: firstAlert.coordinates,
              coordinateSource: firstAlert.coordinateSource,
              originalCoordinates: firstAlert.originalCoordinates,
              rawWorkData: {
                sm_easting: sortedWorks[0]?.sm_easting,
                sm_northing: sortedWorks[0]?.sm_northing,
                works_location_coordinates: sortedWorks[0]?.works_location_coordinates,
                raw_webhook_data: sortedWorks[0]?.raw_webhook_data ? 'present' : 'missing'
              }
            });
          }
          
          // Log urgency breakdown
          const urgentAlerts = alerts.filter(alert => alert.isUrgent);
          console.log(`🚨 Urgency breakdown: ${urgentAlerts.length} urgent (next 7 days), ${alerts.length - urgentAlerts.length} near-term (8-90 days)`);
          
          // Performance warnings
          if (immediateRoadworks.length > 1000) {
            console.warn(`⚠️ High data volume: ${immediateRoadworks.length} roadworks loaded. Frontend will handle dismissals for performance.`);
          }
          
          setCriticalAlertsWithDebug(alerts);
          console.log(`🎯 FINAL RESULT: Set ${alerts.length} alerts in state for display`);
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
      console.log('Calculating route impacts from filtered StreetManager webhook data...');
      
      // Use the filtered and sorted alerts for route impact calculation
      const alertsToAnalyze = filteredAndSortedAlerts.length > 0 ? filteredAndSortedAlerts : criticalAlerts;
      
      if (alertsToAnalyze.length > 0) {
        // Group alerts by affected routes
        const routeMap = new Map();
        
        alertsToAnalyze.forEach(alert => {
          if (alert.affectedRoutes && alert.affectedRoutes.length > 0) {
            alert.affectedRoutes.forEach(route => {
              if (!routeMap.has(route.number)) {
                routeMap.set(route.number, {
                  routeNumber: route.number,
                  routeName: getRouteDescription(route.number),
                  totalDisruptions: 0,
                  criticalDisruptions: 0,
                  estimatedDelay: 0,
                  activeDisruptions: 0,
                  avgConfidence: 0,
                  disruptions: [] // Store disruption details
                });
              }
              
              const routeData = routeMap.get(route.number);
              routeData.totalDisruptions++;
              routeData.activeDisruptions++;
              
              if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
                routeData.criticalDisruptions++;
              }
              
              routeData.estimatedDelay += (alert.severity === 'CRITICAL' ? 15 : 
                                          alert.severity === 'HIGH' ? 10 : 
                                          alert.severity === 'MEDIUM' ? 5 : 2);
              
              // Add disruption details
              routeData.disruptions.push({
                location: alert.location,
                impact: alert.expectedImpact,
                severity: alert.severity,
                startDate: alert.startDate
              });
              
              // Calculate average confidence
              const totalConfidence = routeData.disruptions.reduce((sum, d, idx) => 
                sum + (alert.affectedRoutes[idx]?.confidence || 75), 0);
              routeData.avgConfidence = Math.round(totalConfidence / routeData.disruptions.length);
            });
          }
        });
        
        // Convert to array and sort by impact
        const impacts = Array.from(routeMap.values())
          .sort((a, b) => {
            // Sort by critical disruptions first, then by total disruptions
            if (b.criticalDisruptions !== a.criticalDisruptions) {
              return b.criticalDisruptions - a.criticalDisruptions;
            }
            return b.totalDisruptions - a.totalDisruptions;
          })
          .slice(0, 10);
        
        console.log(`Calculated impacts for ${impacts.length} routes from ${alertsToAnalyze.length} filtered alerts`);
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
      
      // Get StreetManager data from Supabase to find future works
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`${baseUrl}/api/roadworks/unified`, {
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
        totalRoadworks: data.data?.length || 0,
        source: data.metadata?.source
      });
      
      if (data.success && data.data) {
        // **NEW LOGIC**: Filter for advance planning works (28+ days in the future)
        const now = new Date();
        const next28Days = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
        
        const advancePlanningWorks = data.data
          .filter(work => {
            // Filter out completed, cancelled, or expired works first
            const isCompleted = work.sm_works_state === 'Works completed' || 
                              work.sm_works_state === 'completed' ||
                              work.sm_cancelled === true;
            const isExpired = work.sm_actual_end_date && new Date(work.sm_actual_end_date) < new Date();
            
            if (isCompleted || isExpired) {
              return false;
            }
            
            // Check if this is an advance planning work (starts more than 28 days ahead)
            const startDate = work.sm_start_date || work.sm_actual_start_date;
            const isAdvancePlanning = startDate && new Date(startDate) > next28Days;
            
            if (startDate) {
              const daysUntilStart = Math.ceil((new Date(startDate) - now) / (1000 * 60 * 60 * 24));
              console.log(`📅 Advance Work ${work.id || work.sm_reference}: starts in ${daysUntilStart} days (${isAdvancePlanning ? 'INCLUDED' : 'EXCLUDED'})`);
            }
            
            return isAdvancePlanning;
          })
          .sort((a, b) => new Date(a.sm_start_date || a.sm_actual_start_date) - new Date(b.sm_start_date || b.sm_actual_start_date))
          .slice(0, 10)
          .map(work => ({
            id: work.id || work.sm_reference || `future-${Date.now()}-${Math.random()}`,
            location: work.sm_location_description || work.sm_street_name || work.sm_area_name || 'Unknown location',
            description: work.sm_works_description || work.sm_works_category || 'StreetManager planned work',
            plannedStart: work.sm_start_date || work.sm_actual_start_date,
            duration: (work.sm_end_date || work.sm_actual_end_date) ? 
              Math.ceil((new Date(work.sm_end_date || work.sm_actual_end_date) - new Date(work.sm_start_date || work.sm_actual_start_date)) / (1000 * 60 * 60 * 24)) : 
              'Unknown',
            impact: work.severity || determineSeverity({
              location: work.sm_location_description || work.sm_street_name,
              description: work.sm_works_description,
              workType: work.sm_works_category
            }),
            permitReference: work.sm_permit_reference || work.sm_reference,
            authority: work.sm_highway_authority || work.sm_promoter_name
          }));
        
        console.log(`📅 Found ${advancePlanningWorks.length} future StreetManager works`);
        
        if (advancePlanningWorks.length === 0) {
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
          setFutureWorks(advancePlanningWorks);
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
    setActionModalVisible(true); // Fixed: was setShowDiversionModal
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
              
              const response = await fetch(`${baseUrl}/api/roadworks/unified/actions/${alert.id}/dismiss`, {
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
                // Add to dismissed IDs instead of removing from alerts
                setDismissedRoadworkIds(prev => {
                  const newDismissed = [...prev, alert.id];
                  console.log(`🚫 Added ${alert.id} to dismissed list. Total dismissed: ${newDismissed.length}`);
                  return newDismissed;
                });
                Alert.alert('Success', 'Alert dismissed. It won\'t appear again even after refresh.');
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

  // State for enhanced map modal
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedMapAlert, setSelectedMapAlert] = useState(null);
  const [mapProvider, setMapProvider] = useState('google'); // 'google', 'tomtom', 'openstreet'
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);

  // Enhanced map view with multiple providers and embedded modal
  const handleMapView = (alert) => {
    console.log('🗺️ Enhanced Map view clicked for alert:', {
      id: alert.id,
      location: alert.location,
      coordinates: alert.coordinates,
      coordinateSource: alert.coordinateSource,
      originalCoordinates: alert.originalCoordinates,
      coordinateAccuracy: alert.coordinateAccuracy,
      coordinateError: alert.coordinateError,
      coordinatePoints: alert.coordinatePoints,
      fullAlert: alert // Show the entire alert object
    });
    
    // Check if we have processed coordinates from Street Manager
    if (alert.coordinates && alert.coordinateSource && alert.coordinateSource.startsWith('street_manager_converted')) {
      console.log('✅ Using processed Street Manager coordinates with high accuracy');
    } else if (alert.coordinates) {
      console.log('⚠️ Using basic coordinates, accuracy may vary');
    } else {
      console.log('⚠️ No coordinates available, will use location search');
    }
    
    setSelectedMapAlert(alert);
    setMapModalVisible(true);
  };

  // Generate map URLs for different providers
  const generateMapUrls = (alert) => {
    if (!alert) return {};
    
    let lat, lng, searchLocation;
    let coordinateInfo = '';
    
    console.log('🗺️ Map URL Generation Debug:', {
      alertId: alert.id,
      hasCoordinates: !!alert.coordinates,
      coordinatesValue: alert.coordinates,
      coordinateSource: alert.coordinateSource,
      originalCoordinates: alert.originalCoordinates
    });
    
    // Check for ANY valid coordinates first (prioritize existence over source)
    if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length === 2) {
      const [latValue, lngValue] = alert.coordinates;
      
      // Validate coordinates are reasonable numbers for UK
      if (typeof latValue === 'number' && typeof lngValue === 'number' && 
          !isNaN(latValue) && !isNaN(lngValue) &&
          latValue >= 49 && latValue <= 61 && lngValue >= -8 && lngValue <= 2) {
        
        lat = latValue;
        lng = lngValue;
        
        // Determine accuracy based on source
        if (alert.coordinateSource && alert.coordinateSource.startsWith('street_manager_converted')) {
          coordinateInfo = `📍 Precise location from Street Manager data`;
        } else {
          coordinateInfo = `📍 Approximate location`;
        }
        
        console.log('✅ Using precise coordinates:', { lat, lng, source: alert.coordinateSource });
      } else {
        console.warn('⚠️ Invalid coordinate values:', alert.coordinates);
        lat = lng = null;
      }
    }
    
    // Fallback to enhanced location search if no valid coordinates
    if (!lat || !lng) {
      searchLocation = enhanceLocationString(alert.location);
      coordinateInfo = `📍 Searching by location name\n\n📧 For precise location details:\n• Check roadworks email notifications\n• Visit one.network for full site plans\n• Contact highway authority if needed`;
      console.log('⚠️ Falling back to location search:', searchLocation);
    }
    
    const urls = {};
    
    if (lat && lng) {
      // Precise coordinate-based URLs
      urls.google = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=h&layer=c`;
      urls.googleSatellite = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=k`;
      urls.googleStreetView = `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m7!1e1!3m5!1s0x0:0x0!2e0!3e5!7i13312!8i6656`;
      urls.tomtom = `https://www.tomtom.com/mapshare/tools/central/?mid=1&lat=${lat}&lng=${lng}&z=17&traffic=1`;
      urls.openstreet = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}&layers=T`;
      urls.bing = `https://www.bing.com/maps?cp=${lat}~${lng}&lvl=18&style=h`;
    } else {
      // Location search-based URLs
      const encodedLocation = encodeURIComponent(searchLocation);
      urls.google = `https://www.google.com/maps/search/${encodedLocation}&z=16`;
      urls.googleSatellite = `https://www.google.com/maps/search/${encodedLocation}&z=16&t=k`;
      urls.tomtom = `https://www.tomtom.com/mapshare/tools/central/?query=${encodedLocation}&z=16&traffic=1`;
      urls.openstreet = `https://www.openstreetmap.org/search?query=${encodedLocation}#map=16`;
      urls.bing = `https://www.bing.com/maps/search?q=${encodedLocation}`;
    }
    
    return { urls, coordinateInfo, hasCoordinates: !!(lat && lng), lat, lng };
  };

  // Open specific map provider
  const openMapProvider = (provider, alert) => {
    const { urls, coordinateInfo } = generateMapUrls(alert);
    const mapUrl = urls[provider];
    
    if (!mapUrl) {
      Alert.alert('Error', 'Map URL could not be generated');
      return;
    }
    
    console.log(`🗺️ Opening ${provider} map:`, mapUrl);
    
    try {
      if (typeof window !== 'undefined' && window.open) {
        const newWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow && !newWindow.closed) {
          console.log(`✅ ${provider} map opened successfully!`);
          Alert.alert('Success', `${provider} map opened in new tab`);
          return;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to open ${provider} map:`, error);
    }
    
    // Fallback to copy URL
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(mapUrl).then(() => {
        Alert.alert('Map URL Copied', `${provider} map URL copied to clipboard. Paste it into your browser.`);
      }).catch(() => {
        Alert.alert('Map URL', `Please copy this ${provider} URL manually:\n\n${mapUrl}`);
      });
    } else {
      Alert.alert('Map URL', `Please copy this ${provider} URL manually:\n\n${mapUrl}`);
    }
  };

  // Render enhanced map modal
  const renderMapModal = () => {
    if (!selectedMapAlert) return null;
    
    const { urls, coordinateInfo, hasCoordinates, lat, lng } = generateMapUrls(selectedMapAlert);
    
    return (
      <Modal
        visible={mapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>📍 Roadworks Location</Text>
              <TouchableOpacity 
                style={styles.mapModalCloseButton}
                onPress={() => setMapModalVisible(false)}
              >
                <Text style={styles.mapModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.mapModalLocation}>{selectedMapAlert.location}</Text>
            <Text style={styles.mapModalDescription}>{selectedMapAlert.description}</Text>
            
            <View style={styles.coordinateInfoContainer}>
              <Text style={styles.coordinateInfoText}>{coordinateInfo}</Text>
              {hasCoordinates && (
                <View style={styles.coordinateDetails}>
                  <Text style={styles.coordinateDetailText}>Latitude: {lat.toFixed(6)}</Text>
                  <Text style={styles.coordinateDetailText}>Longitude: {lng.toFixed(6)}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.mapProvidersTitle}>Choose Map Provider:</Text>
            
            <ScrollView style={styles.mapProvidersContainer}>
              {/* Google Maps Options */}
              <View style={styles.mapProviderSection}>
                <Text style={styles.mapProviderSectionTitle}>🌍 Google Maps</Text>
                <View style={styles.mapProviderButtons}>
                  <TouchableOpacity 
                    style={styles.mapProviderButton}
                    onPress={() => openMapProvider('googleSatellite', selectedMapAlert)}
                  >
                    <Text style={styles.mapProviderButtonText}>🛰️ Satellite View</Text>
                  </TouchableOpacity>
                  {hasCoordinates && (
                    <TouchableOpacity 
                      style={styles.mapProviderButton}
                      onPress={() => openMapProvider('googleStreetView', selectedMapAlert)}
                    >
                      <Text style={styles.mapProviderButtonText}>👁️ Street View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {/* OpenStreetMap */}
              <View style={styles.mapProviderSection}>
                <Text style={styles.mapProviderSectionTitle}>🗺️ OpenStreetMap</Text>
                <TouchableOpacity 
                  style={styles.mapProviderButton}
                  onPress={() => openMapProvider('openstreet', selectedMapAlert)}
                >
                  <Text style={styles.mapProviderButtonText}>🌐 Open Source Map</Text>
                </TouchableOpacity>
              </View>
              
              {/* Bing Maps */}
              <View style={styles.mapProviderSection}>
                <Text style={styles.mapProviderSectionTitle}>🅱️ Bing Maps</Text>
                <TouchableOpacity 
                  style={styles.mapProviderButton}
                  onPress={() => openMapProvider('bing', selectedMapAlert)}
                >
                  <Text style={styles.mapProviderButtonText}>🔍 Bing Satellite</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            {/* Quick Actions */}
            <View style={styles.mapQuickActions}>
              <TouchableOpacity 
                style={styles.mapQuickActionButton}
                onPress={() => {
                  const { urls } = generateMapUrls(selectedMapAlert);
                  const allUrls = Object.entries(urls)
                    .map(([provider, url]) => `${provider.toUpperCase()}: ${url}`)
                    .join('\n\n');
                  
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(allUrls).then(() => {
                      Alert.alert('All URLs Copied', 'All map URLs copied to clipboard');
                    });
                  } else {
                    Alert.alert('Map URLs', allUrls);
                  }
                }}
              >
                <Text style={styles.mapQuickActionText}>📋 Copy All URLs</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mapQuickActionButton}
                onPress={() => {
                  // Open the best available map (satellite view for precise coordinates, fallback to OpenStreetMap)
                  const provider = hasCoordinates ? 'googleSatellite' : 'openstreet';
                  openMapProvider(provider, selectedMapAlert);
                }}
              >
                <Text style={styles.mapQuickActionText}>🚀 Best Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
        endpoint = `/api/roadworks/unified/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'reviewed';
      } else if (action === 'monitor') {
        endpoint = `/api/roadworks/unified/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'monitoring';
      } else if (action === 'escalate') {
        endpoint = `/api/roadworks/unified/actions/${alert.id}/acknowledge`;
        requestBody.acknowledgmentType = 'escalated';
        requestBody.notes = `ESCALATED: ${actionNotes || 'Requires immediate attention'}`;
      } else if (action === 'plan_diversion') {
        endpoint = `/api/roadworks/unified/actions/${alert.id}/diversion`;
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
        <Text style={styles.routeTitle}>Service {route.routeNumber}</Text>
        <View style={styles.impactMetrics}>
          <Text style={styles.impactCount}>{route.activeDisruptions} active</Text>
          <Text style={styles.confidenceAvg}>Avg: {route.avgConfidence}%</Text>
        </View>
      </View>
      
      <Text style={styles.routeDescription}>{route.routeName}</Text>
      
      <View style={styles.routeStatsRow}>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatLabel}>Critical</Text>
          <Text style={[styles.routeStatValue, { color: route.criticalDisruptions > 0 ? '#dc2626' : '#6b7280' }]}>
            {route.criticalDisruptions}
          </Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatLabel}>Est. Delay</Text>
          <Text style={styles.routeStatValue}>{route.estimatedDelay}min</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatLabel}>Total</Text>
          <Text style={styles.routeStatValue}>{route.totalDisruptions}</Text>
        </View>
      </View>
      
      <View style={styles.disruptionsList}>
        {route.disruptions?.slice(0, 3).map((disruption, idx) => (
          <View key={idx} style={styles.disruptionItem}>
            <View style={styles.disruptionHeader}>
              <Text style={styles.disruptionLocation}>{disruption.location}</Text>
              <View style={[styles.severityDot, { backgroundColor: severityColors[disruption.severity] || '#6b7280' }]} />
            </View>
            <Text style={styles.disruptionImpact}>{disruption.impact}</Text>
          </View>
        ))}
        {route.disruptions?.length > 3 && (
          <Text style={styles.moreDisruptions}>+{route.disruptions.length - 3} more disruptions</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => {/* Navigate to detailed route view with all disruptions */}}
      >
        <Text style={styles.viewDetailsText}>View All {route.totalDisruptions} Disruptions</Text>
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
            
            {/* Stats bar showing total, dismissed, and visible counts */}
            <View style={styles.statsBar}>
              <Text style={styles.statsText}>
                📊 Total: {criticalAlerts.length} | 
                🚫 Dismissed: {dismissedRoadworkIds.length} | 
                👁️ Showing: {filteredAndSortedAlerts.length}
              </Text>
              {dismissedRoadworkIds.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearDismissalsButton}
                  onPress={() => {
                    Alert.alert(
                      'Clear Dismissed Roadworks',
                      `This will restore ${dismissedRoadworkIds.length} dismissed roadworks. Continue?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Clear All', 
                          style: 'destructive',
                          onPress: () => {
                            setDismissedRoadworkIds([]);
                            Alert.alert('Success', 'All dismissed roadworks restored');
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.clearDismissalsText}>Clear Dismissals</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {filteredAndSortedAlerts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                {criticalAlerts.length === 0 ? (
                  <>
                    <Text style={styles.emptyState}>No StreetManager roadworks for proactive planning</Text>
                    <Text style={styles.emptySubtext}>
                      Roadworks Manager shows StreetManager webhook data for advance planning.
                      Control room disruptions are managed separately in the Disruption Database.
                      Check console for data source debugging.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyState}>No roadworks match current filters</Text>
                    <Text style={styles.emptySubtext}>
                      {criticalAlerts.length} total roadworks available. 
                      Try adjusting severity, area, or timeframe filters.
                    </Text>
                    <TouchableOpacity 
                      style={styles.clearFiltersButton}
                      onPress={() => setFilters({
                        severity: 'ALL',
                        area: 'ALL',
                        timeframe: '30',
                        sortBy: 'startDate',
                        sortOrder: 'asc'
                      })}
                    >
                      <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <>
                {paginatedAlerts.map(renderCriticalAlert)}
                
                {/* Items per page selector */}
                <View style={styles.itemsPerPageContainer}>
                  <Text style={styles.itemsPerPageLabel}>Items per page:</Text>
                  <View style={styles.itemsPerPageButtons}>
                    {[50, 100, 200, 500].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[styles.itemsPerPageButton, itemsPerPage === size && styles.itemsPerPageButtonActive]}
                        onPress={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1); // Reset to first page when changing page size
                        }}
                      >
                        <Text style={[styles.itemsPerPageButtonText, itemsPerPage === size && styles.itemsPerPageButtonTextActive]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                      onPress={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                        ← Previous
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.paginationInfo}>
                      <Text style={styles.paginationInfoText}>
                        Page {currentPage} of {totalPages}
                      </Text>
                      <Text style={styles.paginationDetailText}>
                        {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedAlerts.length)} of {filteredAndSortedAlerts.length}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                      onPress={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                        Next →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Keyboard navigation hint for web */}
                {Platform.OS === 'web' && totalPages > 1 && (
                  <Text style={styles.keyboardHint}>
                    Tip: Use arrow keys (← →) to navigate between pages
                  </Text>
                )}
                
                {/* Quick jump to page */}
                {totalPages > 5 && (
                  <View style={styles.pageJumpContainer}>
                    <Text style={styles.pageJumpLabel}>Jump to page:</Text>
                    <View style={styles.pageJumpButtons}>
                      {[1, Math.floor(totalPages / 4), Math.floor(totalPages / 2), Math.floor(totalPages * 3 / 4), totalPages].map((pageNum) => (
                        <TouchableOpacity
                          key={pageNum}
                          style={[styles.pageJumpButton, currentPage === pageNum && styles.pageJumpButtonActive]}
                          onPress={() => setCurrentPage(pageNum)}
                        >
                          <Text style={[styles.pageJumpButtonText, currentPage === pageNum && styles.pageJumpButtonTextActive]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
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

      {/* Enhanced Filters */}
      <View style={styles.filtersContainer}>
        {/* Severity and Area Row */}
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
        
        {/* Timeframe Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Timeframe:</Text>
          <View style={styles.filterButtons}>
            {[
              { value: 'starts_7', label: 'Starting in 7 days', urgent: true },
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: 'ALL', label: 'All' }
            ].map(timeframe => (
              <TouchableOpacity
                key={timeframe.value}
                style={[
                  styles.filterButton,
                  filters.timeframe === timeframe.value && styles.activeFilterButton,
                  timeframe.urgent && styles.urgentFilterButton // Special styling for urgent filter
                ]}
                onPress={() => setFilters({...filters, timeframe: timeframe.value})}
              >
                <Text style={[
                  styles.filterButtonText,
                  filters.timeframe === timeframe.value && styles.activeFilterButtonText,
                  timeframe.urgent && styles.urgentFilterButtonText
                ]}>
                  {timeframe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Sorting Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            {[
              { value: 'startDate', label: 'Start Date' },
              { value: 'endDate', label: 'End Date' },
              { value: 'severity', label: 'Severity' },
              { value: 'location', label: 'Location' }
            ].map(sort => (
              <TouchableOpacity
                key={sort.value}
                style={[
                  styles.filterButton,
                  filters.sortBy === sort.value && styles.activeFilterButton
                ]}
                onPress={() => setFilters({...filters, sortBy: sort.value})}
              >
                <Text style={[
                  styles.filterButtonText,
                  filters.sortBy === sort.value && styles.activeFilterButtonText
                ]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Sort Order Toggle */}
            <TouchableOpacity
              style={[styles.filterButton, styles.sortOrderButton]}
              onPress={() => setFilters({...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'})}
            >
              <Text style={styles.filterButtonText}>
                {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filter Summary */}
        <View style={styles.filterSummary}>
          <Text style={styles.filterSummaryText}>
            Showing {paginatedAlerts.length} of {filteredAndSortedAlerts.length} roadworks (Total: {criticalAlerts.length})
            {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
            {filters.timeframe === 'starts_7' && ' • Scheduled to start within next 7 days (future works only)'}
            {filters.timeframe !== 'ALL' && filters.timeframe !== 'starts_7' && ` • ${filters.timeframe} day window`}
            {filters.sortBy !== 'startDate' && ` • Sorted by ${filters.sortBy}`}
            {filters.sortOrder === 'desc' && ' (descending)'}
          </Text>
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

      {/* Enhanced Map Modal */}
        {renderMapModal()}

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
  sortOrderButton: {
    backgroundColor: '#6366f1',
    minWidth: 80,
  },
  filterSummary: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  filterSummaryText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  routeStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  disruptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreDisruptions: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  
  // Enhanced Map Modal Styles
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.95,
    maxWidth: 500,
    maxHeight: screenHeight * 0.9,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  mapModalCloseButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  mapModalLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  mapModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  coordinateInfoContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  coordinateInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  coordinateDetails: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  coordinateDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  mapProvidersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mapProvidersContainer: {
    maxHeight: 300,
  },
  mapProviderSection: {
    marginBottom: 16,
  },
  mapProviderSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  mapProviderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapProviderButton: {
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  tomtomButton: {
    backgroundColor: '#fbbf24',
    minWidth: 200,
  },
  mapProviderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
  },
  mapQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mapQuickActionButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  mapQuickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Urgent filter styles for "Starts 7 days" button
  urgentFilterButton: {
    backgroundColor: '#dc2626', // Red background for urgency
    borderWidth: 2,
    borderColor: '#b91c1c',
  },
  urgentFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Stats bar styles
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  clearDismissalsButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearDismissalsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Items per page styles
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    marginTop: 16,
    marginHorizontal: -16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemsPerPageLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
  },
  itemsPerPageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  itemsPerPageButton: {
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  itemsPerPageButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  itemsPerPageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  itemsPerPageButtonTextActive: {
    color: 'white',
  },
  
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: -16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9ca3af',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paginationDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  pageJumpContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 16,
  },
  pageJumpLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  pageJumpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pageJumpButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageJumpButtonActive: {
    backgroundColor: '#1e40af',
  },
  pageJumpButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pageJumpButtonTextActive: {
    color: 'white',
  },
  keyboardHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: -8,
  },
});

export default RoadworksManagerDashboard;