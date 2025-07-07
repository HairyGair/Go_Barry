/*
 * Go Barry - Roadworks Manager V2
 * Modern redesigned roadworks management interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../../hooks/useSupervisorSession';
import { roadworksStyles, colors, spacing } from './styles/roadworks.styles';
import StatsCard, { StatCardPresets } from './components/StatsCard';
import RoadworkCard from './components/RoadworkCard';
import FilterPanel from './components/FilterPanel';
import RoadworkQueue from '../RoadworkQueue';
import MapOverview from './components/MapOverview';
import TimelineView from './components/TimelineView';
import TestRoadworksIntegration from './test/TestRoadworksIntegration';
import DiversionTemplates from './templates/DiversionTemplates';
import RoadworksAnalytics from './analytics/RoadworksAnalytics';
import RoadworkDetailModal from './modals/RoadworkDetailModal';

const RoadworksManagerV2 = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisor();

  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [streetManagerRoadworks, setStreetManagerRoadworks] = useState([]);
  const [reviewedStreetworks, setReviewedStreetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online'); // 'online', 'offline', 'slow'
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    dateRange: 'all',
    affectedRoutes: [],
    searchQuery: ''
    // Removed gneOnly - always filter to North East only
    // Removed severity - not required
  });

  // Enhanced Statistics state with workflow statuses
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    planned: 0,
    monitoring: 0,
    completed: 0,
    archived: 0,
    rejected: 0,
    routesAffected: 0,
    streetManager: 0,
    manual: 0,
    diversions: 0,
    pendingReview: 0,
    escalated: 0,
    overdue: 0
  });

  // Streamlined Tab configuration - Essential workflow tabs only
  // Enhanced status mapping: Active includes 'approved', Completed includes 'archived' and 'rejected'
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid', badge: null },
    { id: 'queue', label: 'Review Queue', icon: 'alert-circle', badge: stats.pendingReview || null },
    { id: 'active', label: 'Active & Approved', icon: 'time', badge: stats.active > 0 ? stats.active : null },
    { id: 'monitoring', label: 'Monitoring', icon: 'eye', badge: stats.monitoring > 0 ? stats.monitoring : null },
    { id: 'completed', label: 'Completed & Archived', icon: 'checkmark-circle', badge: (stats.completed + stats.archived + stats.rejected) > 0 ? (stats.completed + stats.archived + stats.rejected) : null },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', badge: null }
  ];

  // Fetch roadworks data with improved error handling
  const fetchRoadworks = async (showLoading = true) => {
    console.log('🔄 fetchRoadworks called with baseUrl:', baseUrl);
    if (showLoading) setLoading(true);
    
    let manualData = { roadworks: [] };
    let streetManagerData = { roadworks: [] };
    let reviewedStreetworksData = { roadworks: [] };
    
    try {
      // Fetch manual roadworks with timeout
      const manualController = new AbortController();
      const manualTimeout = setTimeout(() => manualController.abort(), 10000); // 10s timeout
      
      try {
        const manualUrl = `${baseUrl}/api/roadworks`;
        console.log('📡 Fetching manual roadworks from:', manualUrl);
        const manualResponse = await fetch(manualUrl, {
          signal: manualController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(manualTimeout);
        
        console.log('📡 Manual roadworks response status:', manualResponse.status);
        if (manualResponse.ok) {
          manualData = await manualResponse.json();
          console.log('📡 Manual roadworks data:', manualData);
        } else {
          console.warn('Manual roadworks API returned:', manualResponse.status);
          console.warn('Manual roadworks API failed - likely 404 route registration issue');
        }
      } catch (manualError) {
        console.warn('Manual roadworks fetch failed:', manualError.message);
      }
      
      // Fetch Street Manager roadworks with timeout
      const streetManagerController = new AbortController();
      const streetManagerTimeout = setTimeout(() => streetManagerController.abort(), 10000);
      
      try {
        const streetManagerUrl = `${baseUrl}/api/street-manager-roadworks`;
        console.log('📡 Fetching Street Manager roadworks from:', streetManagerUrl);
        const streetManagerResponse = await fetch(streetManagerUrl, {
          signal: streetManagerController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(streetManagerTimeout);
        
        console.log('📡 Street Manager response status:', streetManagerResponse.status);
        if (streetManagerResponse.ok) {
          streetManagerData = await streetManagerResponse.json();
          console.log('📡 Street Manager data:', streetManagerData);
        } else {
          console.warn('Street Manager API returned:', streetManagerResponse.status);
          console.warn('Street Manager API failed - likely 404 route registration issue');
        }
      } catch (streetManagerError) {
        console.warn('Street Manager roadworks fetch failed:', streetManagerError.message);
      }
      
      // Fetch reviewed streetworks data (the missing piece!)
      const reviewedController = new AbortController();
      const reviewedTimeout = setTimeout(() => reviewedController.abort(), 10000);
      
      try {
        const reviewedUrl = `${baseUrl}/api/roadworks-v2/reviewed`;
        console.log('📡 Fetching reviewed streetworks from:', reviewedUrl);
        const reviewedResponse = await fetch(reviewedUrl, {
          signal: reviewedController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(reviewedTimeout);
        
        console.log('📡 Reviewed streetworks response status:', reviewedResponse.status);
        if (reviewedResponse.ok) {
          reviewedStreetworksData = await reviewedResponse.json();
          console.log('📡 ✅ SUCCESS: Reviewed streetworks data:', reviewedStreetworksData);
          console.log('📡 ✅ SUCCESS: Found', reviewedStreetworksData?.roadworks?.length || 0, 'reviewed roadworks');
        } else {
          console.error('❌ FAILED: Reviewed streetworks API returned:', reviewedResponse.status);
          console.error('❌ FAILED: Reviewed streetworks API failed - endpoint may not exist yet');
        }
      } catch (reviewedError) {
        console.warn('Reviewed streetworks fetch failed:', reviewedError.message);
      }

      // Validate and set data
      const validManualRoadworks = Array.isArray(manualData.roadworks) ? manualData.roadworks : [];
      const validStreetManagerRoadworks = Array.isArray(streetManagerData.roadworks) ? streetManagerData.roadworks : [];
      const validReviewedStreetworks = Array.isArray(reviewedStreetworksData.roadworks) ? reviewedStreetworksData.roadworks : [];
      
      console.log('🔍 API Results Summary:');
      console.log('🔍 Manual API success:', !!manualData.roadworks);
      console.log('🔍 Street Manager API success:', !!streetManagerData.roadworks);
      console.log('🔍 Reviewed Streetworks API success:', !!reviewedStreetworksData.roadworks);
      console.log('🔍 Total roadworks found:', validManualRoadworks.length + validStreetManagerRoadworks.length + validReviewedStreetworks.length);
      
      console.log('🔍 Manual roadworks count:', validManualRoadworks.length);
      console.log('🔍 Street Manager roadworks count:', validStreetManagerRoadworks.length);
      console.log('🔍 ⭐ REVIEWED STREETWORKS COUNT:', validReviewedStreetworks.length);
      console.log('🔍 Manual roadworks sample:', validManualRoadworks.slice(0, 2));
      console.log('🔍 Street Manager roadworks sample:', validStreetManagerRoadworks.slice(0, 2));
      console.log('🔍 ⭐ REVIEWED STREETWORKS SAMPLE:', validReviewedStreetworks.slice(0, 2));
      
      // DEBUG: Check monitoring items specifically
      const monitoringItems = validReviewedStreetworks.filter(r => r.status === 'monitoring');
      console.log('🔍 ⭐ MONITORING ITEMS IN REVIEWED DATA:', monitoringItems.length);
      if (monitoringItems.length > 0) {
        console.log('🔍 ⭐ MONITORING ITEMS DETAILS:', monitoringItems.slice(0, 3));
      }
      
      // Debug: Check if we have old cached data
      if (validStreetManagerRoadworks.length > 50) {
        console.warn('⚠️ LARGE DATASET DETECTED:', validStreetManagerRoadworks.length, 'Street Manager roadworks');
        console.warn('⚠️ This may include old non-North East data that should have been cleaned up');
        console.warn('⚠️ First 5 locations:', validStreetManagerRoadworks.slice(0, 5).map(r => r.location || r.title));
      }
      
      console.log('🔄 Setting roadworks state...');
      setRoadworks(validManualRoadworks);
      setStreetManagerRoadworks(validStreetManagerRoadworks);
      setReviewedStreetworks(validReviewedStreetworks);
      
      // Calculate statistics immediately with the fresh data
      console.log('🔄 Calling calculateStats...');
      calculateStats(validManualRoadworks, validStreetManagerRoadworks, validReviewedStreetworks);
      setLastUpdate(new Date());
      
      // Apply North East filtering to stats calculation
      const neManualRoadworks = validManualRoadworks.filter(roadwork => {
        const hasGNERoutes = affectsGNERoutes(roadwork);
        const inNorthEast = roadwork.coordinates && isInNorthEastRegion(roadwork.coordinates.lat, roadwork.coordinates.lng);
        return hasGNERoutes || inNorthEast;
      });
      
      const neStreetManagerRoadworks = validStreetManagerRoadworks.filter(roadwork => {
        const hasGNERoutes = affectsGNERoutes(roadwork);
        const inNorthEast = roadwork.coordinates && isInNorthEastRegion(roadwork.coordinates.lat, roadwork.coordinates.lng);
        return hasGNERoutes || inNorthEast;
      });
      
      // Force a stats update with immediate values for debugging
      const immediateStats = {
        total: neManualRoadworks.length + neStreetManagerRoadworks.length,
        active: neManualRoadworks.filter(r => r.status === 'active').length + 
                neStreetManagerRoadworks.filter(r => r.status === 'active').length,
        planned: neManualRoadworks.filter(r => r.status === 'planned').length + 
                 neStreetManagerRoadworks.filter(r => r.status === 'planned').length,
        streetManager: neStreetManagerRoadworks.length,
        manual: neManualRoadworks.length,
        routesAffected: 0,
        diversions: 0,
        pendingReview: 0
      };
      console.log('🚀 NORTH EAST FILTERED stats:', immediateStats);
      console.log('🚀 Raw data stats (should be higher):', {
        total: validManualRoadworks.length + validStreetManagerRoadworks.length,
        streetManager: validStreetManagerRoadworks.length,
        manual: validManualRoadworks.length
      });
      setStats(immediateStats);
      
    } catch (error) {
      console.error('Error fetching roadworks:', error);
      // Don't clear existing data on error - keep what we have
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics from roadworks data
  const calculateStats = (manual, streetManager, reviewed = []) => {
    console.log('📊 Calculating stats for:', {
      manual: manual.length,
      streetManager: streetManager.length,
      reviewed: reviewed.length,
      manualSample: manual.slice(0, 2),
      streetManagerSample: streetManager.slice(0, 2),
      reviewedSample: reviewed.slice(0, 2)
    });
    
    const now = new Date();
    
    // Add detailed logging for each filter operation with enhanced status mapping
    const manualActive = manual.filter(r => {
      const isActive = r.status === 'active' || r.status === 'approved';
      if (manual.length < 5) console.log('🔍 Manual roadwork status:', r.title, 'status:', r.status, 'isActive:', isActive);
      return isActive;
    });
    
    const manualPlanned = manual.filter(r => r.status === 'planned');
    
    const streetManagerActive = streetManager.filter(r => {
      const isActive = r.status === 'active' || r.status === 'approved';
      if (streetManager.length < 5) console.log('🔍 StreetManager roadwork status:', r.title, 'status:', r.status, 'isActive:', isActive);
      return isActive;
    });
    
    const streetManagerPlanned = streetManager.filter(r => r.status === 'planned');
    
    console.log('📊 Detailed counts:', {
      manualActive: manualActive.length,
      manualPlanned: manualPlanned.length,
      streetManagerActive: streetManagerActive.length,
      streetManagerPlanned: streetManagerPlanned.length
    });
    
    // Count affected routes (deduplicated)
    const allAffectedRoutes = new Set();
    [...manual, ...streetManager].forEach(r => {
      if (r.affectsRoutes) {
        r.affectsRoutes.forEach(route => allAffectedRoutes.add(route));
      }
    });
    
    // Count active diversions (include both active and approved, plus reviewed data)
    const diversions = [...manual, ...streetManager, ...reviewed].filter(r => 
      (r.status === 'active' || r.status === 'approved') && r.hasDiversion
    ).length;

    // Enhanced workflow status calculations - INCLUDE REVIEWED DATA
    const allRoadworks = [...manual, ...streetManager, ...reviewed];
    const monitoring = allRoadworks.filter(r => r.status === 'monitoring').length;
    const completed = allRoadworks.filter(r => r.status === 'completed').length;
    const archived = allRoadworks.filter(r => r.status === 'archived').length;
    const rejected = allRoadworks.filter(r => r.status === 'rejected').length;
    const escalated = allRoadworks.filter(r => r.escalation_level > 0).length;
    const overdue = allRoadworks.filter(r => r.is_overdue).length;

    console.log('🔍 Enhanced status calculations:', {
      monitoring,
      completed,
      archived,
      rejected,
      totalRoadworks: allRoadworks.length,
      reviewedContribution: reviewed.length
    });

    const newStats = {
      total: manual.length + streetManager.length + reviewed.length,
      active: manualActive.length + streetManagerActive.length,
      planned: manualPlanned.length + streetManagerPlanned.length,
      monitoring,
      completed,
      archived,
      rejected,
      routesAffected: allAffectedRoutes.size,
      streetManager: streetManager.length,
      manual: manual.length,
      reviewed: reviewed.length,
      diversions,
      pendingReview: 0, // Will be updated by fetchPendingStats
      escalated,
      overdue
    };
    
    console.log('📊 New stats calculated:', newStats);
    console.log('📊 Previous stats for comparison:', stats);
    setStats(newStats);
  };

  // Fetch pending review stats
  const fetchPendingStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/stats`, {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          pendingReview: data.stats?.pendingReview || 0
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch pending stats:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRoadworks(false);
  };

  // Check if coordinates are in North East England region
  const isInNorthEastRegion = (lat, lng) => {
    if (!lat || !lng) return false;
    
    // North East England bounding box (approximate)
    const northEastBounds = {
      north: 55.8,  // Scottish border
      south: 54.2,  // Yorkshire border
      east: -0.5,   // North Sea coast
      west: -3.0    // Cumbrian border
    };
    
    return lat >= northEastBounds.south && 
           lat <= northEastBounds.north && 
           lng >= northEastBounds.west && 
           lng <= northEastBounds.east;
  };

  // Check if roadwork affects Go North East routes
  const affectsGNERoutes = (roadwork) => {
    if (!roadwork.affectsRoutes || !Array.isArray(roadwork.affectsRoutes)) {
      return false;
    }
    
    // Check if any affected route is a GNE route (starts with route numbers 1-999 or has GNE prefix)
    return roadwork.affectsRoutes.some(route => {
      const routeStr = String(route).toUpperCase();
      return routeStr.includes('GNE') || /^[1-9][0-9]{0,2}$/.test(routeStr);
    });
  };

  // Filter roadworks based on current filters and active tab with data validation
  const getFilteredRoadworks = () => {
    try {
      // Validate input data
      const validRoadworks = Array.isArray(roadworks) ? roadworks : [];
      const validStreetManagerRoadworks = Array.isArray(streetManagerRoadworks) ? streetManagerRoadworks : [];
      const validReviewedStreetworks = Array.isArray(reviewedStreetworks) ? reviewedStreetworks : [];
      
      console.log('🔍 getFilteredRoadworks - input data:', {
        validRoadworks: validRoadworks.length,
        validStreetManagerRoadworks: validStreetManagerRoadworks.length,
        validReviewedStreetworks: validReviewedStreetworks.length,
        activeTab,
        filters
      });
      
      let allRoadworks = [
        ...validRoadworks.map(r => ({ 
          ...r, 
          source: 'manual',
          // Ensure required fields exist
          id: r.id || `manual-${Date.now()}-${Math.random()}`,
          title: r.title || r.location || 'Unnamed Roadwork',
          status: r.status || 'active',
        })),
        ...validStreetManagerRoadworks.map(r => ({ 
          ...r, 
          source: 'StreetManager',
          // Ensure required fields exist
          id: r.id || `streetmanager-${Date.now()}-${Math.random()}`,
          title: r.title || r.location || 'Street Manager Roadwork',
          status: r.status || 'active',
        })),
        ...validReviewedStreetworks.map(r => {
          const mappedRoadwork = { 
            ...r, 
            source: 'ReviewedStreetworks',
            // Ensure required fields exist
            id: r.id || `reviewed-${Date.now()}-${Math.random()}`,
            title: r.title || r.location || 'Reviewed Streetwork',
            status: r.status || 'monitoring',
          };
          console.log('🔍 ⭐ Mapping reviewed streetwork:', {
            original_status: r.status,
            final_status: mappedRoadwork.status,
            title: mappedRoadwork.title
          });
          return mappedRoadwork;
        })
      ];
      
      console.log('🔍 Combined roadworks before filtering:', allRoadworks.length);

      // **PERMANENT FILTER: Only show Go North East relevant roadworks**
      const preFilterCount = allRoadworks.length;
      allRoadworks = allRoadworks.filter(roadwork => {
        // First, exclude known non-North East locations
        const location = (roadwork.location || roadwork.title || '').toUpperCase();
        const excludePatterns = [
          // Major cities outside North East
          'CHATHAM', 'LUTON', 'BOSTON', 'LONDON', 'BIRMINGHAM', 'MANCHESTER', 
          'LIVERPOOL', 'BRISTOL', 'LEEDS', 'SHEFFIELD', 'NOTTINGHAM', 
          'LEICESTER', 'COVENTRY', 'CARDIFF', 'SWANSEA', 'GLASGOW', 'EDINBURGH',
          
          // Counties outside North East
          'KENT', 'BEDFORDSHIRE', 'LINCOLNSHIRE', 'DEVON', 'CORNWALL', 'SOMERSET',
          'DORSET', 'HAMPSHIRE', 'SUSSEX', 'SURREY', 'ESSEX', 'NORFOLK', 
          'SUFFOLK', 'HERTFORDSHIRE', 'BUCKINGHAMSHIRE', 'OXFORDSHIRE',
          'BERKSHIRE', 'WILTSHIRE', 'GLOUCESTERSHIRE', 'WORCESTERSHIRE',
          'WARWICKSHIRE', 'STAFFORDSHIRE', 'SHROPSHIRE', 'HEREFORDSHIRE',
          'CHESHIRE', 'DERBYSHIRE', 'NOTTINGHAMSHIRE', 'LEICESTERSHIRE',
          'RUTLAND', 'NORTHAMPTONSHIRE', 'CAMBRIDGESHIRE', 'ISLE OF WIGHT',
          
          // Specific problem locations
          'GRAVESEND', 'DARTFORD', 'MAIDSTONE', 'ROCHESTER', 'GILLINGHAM',
          'EXETER', 'PLYMOUTH', 'TORQUAY', 'BARNSTAPLE', 'TRURO', 'FALMOUTH',
          'HONITON', 'TIVERTON', 'OKEHAMPTON', 'TAVISTOCK', 'TOTNES',
          'BOURNEMOUTH', 'POOLE', 'WEYMOUTH', 'DORCHESTER',
          'SOUTHAMPTON', 'PORTSMOUTH', 'WINCHESTER', 'BASINGSTOKE',
          'BRIGHTON', 'WORTHING', 'HASTINGS', 'EASTBOURNE', 'CRAWLEY',
          'CAMBRIDGE', 'OXFORD', 'READING', 'SLOUGH', 'SWINDON',
          'GLOUCESTER', 'CHELTENHAM', 'BRISTOL', 'BATH', 'TAUNTON',
          'CANTERBURY', 'FOLKESTONE', 'DOVER', 'ASHFORD', 'TUNBRIDGE',
          
          // M25 and southern motorway locations
          'M25', 'M23', 'M3', 'M4', 'M40', 'A303', 'A30', 'A38',
          
          // Wales
          'CARDIFF', 'SWANSEA', 'NEWPORT', 'WREXHAM', 'BANGOR', 'CAERNARFON',
          
          // Scotland  
          'GLASGOW', 'EDINBURGH', 'DUNDEE', 'ABERDEEN', 'STIRLING', 'PERTH',
          
          // Midlands
          'WOLVERHAMPTON', 'WALSALL', 'DUDLEY', 'WEST BROMWICH', 'SOLIHULL',
          'REDDITCH', 'KIDDERMINSTER', 'STOKE', 'STAFFORD', 'LICHFIELD',
          'TAMWORTH', 'NUNEATON', 'RUGBY', 'STRATFORD', 'EVESHAM',
          
          // East of England
          'NORWICH', 'IPSWICH', 'COLCHESTER', 'CHELMSFORD', 'SOUTHEND',
          'LUTON', 'BEDFORD', 'MILTON KEYNES', 'AYLESBURY', 'HIGH WYCOMBE',
          'WATFORD', 'ST ALBANS', 'HEMEL HEMPSTEAD', 'STEVENAGE', 'HARLOW',
          
          // Southwest England
          'PENZANCE', 'ST AUSTELL', 'BODMIN', 'LAUNCESTON', 'BUDE',
          'ILFRACOMBE', 'MINEHEAD', 'BRIDGWATER', 'YEOVIL', 'FROME',
          'WELLS', 'GLASTONBURY', 'CLEVEDON', 'WESTON-SUPER-MARE'
        ];
        
        if (excludePatterns.some(pattern => location.includes(pattern))) {
          console.log(`🚫 Excluding non-North East roadwork: ${location}`);
          return false;
        }
        
        // Skip geographical filtering for reviewed streetworks (already verified as relevant)
        if (roadwork.source === 'ReviewedStreetworks') {
          console.log('🔍 ✅ Keeping reviewed streetwork (bypassing geo filter):', roadwork.title, 'Status:', roadwork.status);
          return true; // Already reviewed and confirmed as relevant to North East
        }
        
        // Check if roadwork affects GNE routes
        const hasGNERoutes = affectsGNERoutes(roadwork);
        
        // Check if roadwork is in North East region
        const inNorthEast = roadwork.coordinates && 
                           isInNorthEastRegion(roadwork.coordinates.lat, roadwork.coordinates.lng);
        
        // Include if it affects GNE routes OR is in North East region
        const shouldInclude = hasGNERoutes || inNorthEast;
        
        if (preFilterCount < 10) { // Debug logging for small datasets
          console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Roadwork "${roadwork.title}":`, {
            hasGNERoutes,
            inNorthEast,
            coordinates: roadwork.coordinates,
            affectsRoutes: roadwork.affectsRoutes,
            shouldInclude
          });
        }
        
        return shouldInclude;
      });
      
      console.log(`🎯 GNE filtering: ${preFilterCount} → ${allRoadworks.length} roadworks (${preFilterCount - allRoadworks.length} filtered out)`);
      
      if (allRoadworks.length === 0) {
        console.log('ℹ️ No North East roadworks currently active. System working correctly.');
      }

      console.log('🎯 FILTERING DEBUG:');
      console.log('🎯 All roadworks before tab filtering:', allRoadworks.length);
      console.log('🎯 Active tab:', activeTab);
      console.log('🎯 Sample roadworks statuses:', allRoadworks.slice(0, 5).map(r => ({ title: r.title, status: r.status })));

      // Filter by active tab (Enhanced Workflow with proper status mapping)
      if (activeTab === 'active') {
        // Include both 'active' and 'approved' statuses in the active tab
        allRoadworks = allRoadworks.filter(r => r.status === 'active' || r.status === 'approved');
        console.log('🎯 After active filter (active + approved):', allRoadworks.length);
      } else if (activeTab === 'monitoring') {
        const beforeFilter = allRoadworks.length;
        const monitoringStatuses = [...new Set(allRoadworks.map(r => r.status))];
        console.log('🎯 Before monitoring filter:', beforeFilter, 'Available statuses:', monitoringStatuses);
        allRoadworks = allRoadworks.filter(r => r.status === 'monitoring');
        console.log('🎯 After monitoring filter:', allRoadworks.length);
        if (allRoadworks.length === 0 && beforeFilter > 0) {
          console.log('🚨 PROBLEM: No monitoring roadworks found but', beforeFilter, 'roadworks existed before filtering');
          console.log('🚨 This suggests the reviewed streetworks may not have status="monitoring"');
        }
      } else if (activeTab === 'completed') {
        // Include completed, archived, and rejected statuses
        allRoadworks = allRoadworks.filter(r => 
          r.status === 'completed' || r.status === 'archived' || r.status === 'rejected'
        );
        console.log('🎯 After completed filter (completed + archived + rejected):', allRoadworks.length);
      }

      // Apply filters with null checks
      if (filters.status && filters.status !== 'all') {
        if (filters.status.includes(',')) {
          // Handle multiple statuses (e.g., "archived,rejected")
          const statuses = filters.status.split(',');
          allRoadworks = allRoadworks.filter(r => statuses.includes(r.status));
        } else {
          allRoadworks = allRoadworks.filter(r => r.status === filters.status);
        }
      }
      if (filters.source && filters.source !== 'all') {
        allRoadworks = allRoadworks.filter(r => r.source === filters.source);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        allRoadworks = allRoadworks.filter(r => {
          const title = (r.title || '').toLowerCase();
          const location = (r.location || '').toLowerCase();
          const description = (r.description || '').toLowerCase();
          return title.includes(query) || location.includes(query) || description.includes(query);
        });
      }
      if (filters.affectedRoutes && Array.isArray(filters.affectedRoutes) && filters.affectedRoutes.length > 0) {
        allRoadworks = allRoadworks.filter(r => {
          const routes = Array.isArray(r.affectsRoutes) ? r.affectsRoutes : [];
          return routes.some(route => filters.affectedRoutes.includes(route));
        });
      }

      console.log('🔍 Final filtered roadworks:', allRoadworks.length);
      return allRoadworks;
    } catch (error) {
      console.error('Error filtering roadworks:', error);
      return []; // Return empty array on error
    }
  };

  // Get available routes for filtering
  const getAvailableRoutes = () => {
    const routes = new Set();
    [...roadworks, ...streetManagerRoadworks].forEach(r => {
      if (r.affectsRoutes) {
        r.affectsRoutes.forEach(route => routes.add(route));
      }
    });
    return Array.from(routes).sort();
  };

  // Handle stat card press
  const handleStatPress = (statType) => {
    switch (statType) {
      case 'active':
        setActiveTab('active');
        setViewMode('list');
        break;
      case 'planned':
        setActiveTab('planned');
        setViewMode('list');
        break;
      default:
        setViewMode('list');
    }
  };

  // Handle roadwork card actions
  const handleRoadworkPress = (roadwork) => {
    setSelectedRoadwork(roadwork);
    setShowDetailModal(true);
    console.log('Opening details for:', roadwork.title);
  };

  const handleViewMap = (roadwork) => {
    setSelectedRoadwork(roadwork);
    setViewMode('map');
    console.log('View map for:', roadwork.title);
  };

  const handleViewDiversions = (roadwork) => {
    console.log('View diversions for:', roadwork.title);
    // TODO: Open diversions modal
  };

  const handleStatusChange = async (roadwork) => {
    console.log('Monitoring action for:', roadwork.title);
    
    // Monitoring-specific actions
    const actionChoice = confirm(
      `📋 Monitoring Action Required\n\n` +
      `Roadwork: "${roadwork.title}"\n` +
      `Location: ${roadwork.location}\n\n` +
      `Choose action:\n` +
      `• OK = Make ACTIVE (needs immediate attention)\n` +
      `• Cancel = ARCHIVE/DISMISS (monitoring complete)\n\n` +
      `Click OK to make active, Cancel to archive.`
    );
    
    const newStatus = actionChoice ? 'active' : 'archived';
    const action = actionChoice ? 'activated' : 'archived';
    const targetTab = actionChoice ? 'Active & Approved' : 'Completed & Archived';
    
    try {
      // Call API to update status (placeholder - would need actual API)
      console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} ${roadwork.title}: ${roadwork.status} → ${newStatus}`);
      
      // Show success message with tab guidance
      alert(
        `✅ Roadwork ${action} successfully!\n\n` +
        `"${roadwork.title}"\n\n` +
        `Status: ${roadwork.status} → ${newStatus}\n` +
        `Now available in: ${targetTab} tab\n\n` +
        `${actionChoice ? '🚨 Action required in Active tab' : '📁 Moved to archive'}`
      );
      
      // Refresh data to update tabs
      fetchRoadworks(false);
      
      // Optional: Auto-switch to the target tab
      if (actionChoice) {
        setTimeout(() => setActiveTab('active'), 1000);
      } else {
        setTimeout(() => setActiveTab('completed'), 1000);
      }
      
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
  };

  const handleCreateDiversion = (roadwork) => {
    console.log('Creating diversion message for:', roadwork.title);
    setSelectedRoadwork(roadwork);
    
    // Show message about integration
    alert(
      `📢 Message Distribution Centre Integration\n\n` +
      `For: ${roadwork.title}\n` +
      `Location: ${roadwork.location}\n\n` +
      `This will open the Message Distribution Centre with:\n` +
      `• Pre-populated roadwork details\n` +
      `• Affected routes: ${roadwork.affectsRoutes?.slice(0, 3).join(', ')}${roadwork.affectsRoutes?.length > 3 ? '...' : ''}\n` +
      `• Template suggestions based on impact\n\n` +
      `Feature coming soon!`
    );
  };

  const handleViewDetails = (roadwork) => {
    console.log('Opening details modal for:', roadwork.title);
    setSelectedRoadwork(roadwork);
    setShowDetailModal(true);
  };

  const handleViewFullMap = () => {
    setViewMode('map');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setActiveTab('timeline');
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 RoadworksManagerV2 mounting with baseUrl:', baseUrl, 'sessionId:', sessionId);
    fetchRoadworks();
    if (sessionId) {
      fetchPendingStats();
    }
  }, [baseUrl, sessionId]);

  // Auto-refresh every 90 seconds for real-time Street Manager data
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Street Manager data...');
      fetchRoadworks(false);
      if (sessionId) {
        fetchPendingStats();
      }
    }, 90 * 1000); // 90 seconds for real-time updates

    return () => clearInterval(interval);
  }, [baseUrl]);

  const renderHeader = () => (
    <View style={[roadworksStyles.header, roadworksStyles.headerGradient]}>
      <View style={roadworksStyles.row}>
        <Ionicons name="construct" size={24} color={colors.textPrimary} />
        <View style={roadworksStyles.flex1}>
          <Text style={roadworksStyles.headerTitle}>Roadworks Manager V2</Text>
          <View style={roadworksStyles.row}>
            <Text style={roadworksStyles.headerSubtitle}>
              North East England roadworks • Live Street Manager data • Updates every 90s • Last updated {lastUpdate.toLocaleTimeString()}
            </Text>
            
            {/* Connection Status Indicator */}
            <View style={[
              roadworksStyles.statusBadge,
              { 
                backgroundColor: connectionStatus === 'online' ? colors.success : 
                                connectionStatus === 'slow' ? colors.warning : colors.error,
                marginLeft: spacing.sm
              }
            ]}>
              <Ionicons 
                name={connectionStatus === 'online' ? 'wifi' : 
                     connectionStatus === 'slow' ? 'time' : 'wifi-off'} 
                size={10} 
                color={colors.textPrimary} 
              />
              <Text style={[roadworksStyles.statusBadgeText, { fontSize: 10 }]}>
                {connectionStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Loading indicator */}
        {(loading || refreshing) && (
          <ActivityIndicator 
            size="small" 
            color={colors.textPrimary} 
            style={{ marginLeft: spacing.sm }}
          />
        )}
      </View>
      
      {/* Error Message */}
      {errorMessage && (
        <View style={[
          roadworksStyles.statusBadge,
          { 
            backgroundColor: colors.error,
            marginTop: spacing.xs,
            alignSelf: 'flex-start'
          }
        ]}>
          <Ionicons name="warning" size={12} color={colors.textPrimary} />
          <Text style={roadworksStyles.statusBadgeText}>
            {errorMessage}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStatsOverview = () => {
    console.log('🎨 renderStatsOverview called with stats:', stats);
    console.log('🎨 Current roadworks arrays length:', { 
      roadworks: roadworks.length, 
      streetManagerRoadworks: streetManagerRoadworks.length 
    });
    
    return (
      <View style={roadworksStyles.statsContainer}>
        <StatsCard
          {...StatCardPresets.total(stats.total, () => handleStatPress('total'))}
          size="large"
        />
        
        
        <StatsCard
          {...StatCardPresets.active(stats.active, () => handleStatPress('active'))}
        />
        
        <StatsCard
          title="Planned"
          value={stats.planned}
          subtitle="Upcoming roadworks"
          icon="calendar"
          color={colors.info}
          onPress={() => setFilters(prev => ({ ...prev, status: 'planned' }))}
        />
        
        <StatsCard
          {...StatCardPresets.affected(stats.routesAffected, () => handleStatPress('routes'))}
        />
        
        <StatsCard
          {...StatCardPresets.diversions(stats.diversions, () => handleStatPress('diversions'))}
        />
      </View>
    );
  };

  const renderDataSourceStats = () => (
    <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
      <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
        Data Sources
      </Text>
      <View style={roadworksStyles.statsContainer}>
        <StatsCard
          {...StatCardPresets.streetManager(stats.streetManager, () => setActiveTab('streetmanager'))}
        />
        
        <StatsCard
          {...StatCardPresets.manual(stats.manual, () => setActiveTab('manual'))}
        />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={roadworksStyles.tabContainer}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[
            roadworksStyles.tab,
            activeTab === tab.id && roadworksStyles.tabActive
          ]}
          onPress={() => setActiveTab(tab.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <View style={roadworksStyles.row}>
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[
                roadworksStyles.tabText,
                activeTab === tab.id && roadworksStyles.tabTextActive
              ]}
            >
              {tab.label}
            </Text>
            {tab.badge && (
              <View style={roadworksStyles.tabBadge}>
                <Text style={roadworksStyles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={roadworksStyles.quickActionsContainer}>
      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'dashboard' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('dashboard')}
      >
        <Ionicons 
          name="grid" 
          size={16} 
          color={viewMode === 'dashboard' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'dashboard' && roadworksStyles.quickActionTextActive
        ]}>
          Dashboard
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'list' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons 
          name="list" 
          size={16} 
          color={viewMode === 'list' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'list' && roadworksStyles.quickActionTextActive
        ]}>
          List View
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'map' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('map')}
      >
        <Ionicons 
          name="map" 
          size={16} 
          color={viewMode === 'map' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'map' && roadworksStyles.quickActionTextActive
        ]}>
          Map View
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, viewMode === 'timeline' && roadworksStyles.quickActionButtonActive]}
        onPress={() => setViewMode('timeline')}
      >
        <Ionicons 
          name="time" 
          size={16} 
          color={viewMode === 'timeline' ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          viewMode === 'timeline' && roadworksStyles.quickActionTextActive
        ]}>
          Timeline
        </Text>
      </Pressable>

      <Pressable
        style={[roadworksStyles.quickActionButton, showFilters && roadworksStyles.quickActionButtonActive]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons 
          name="funnel" 
          size={16} 
          color={showFilters ? colors.textPrimary : colors.textMuted} 
        />
        <Text style={[
          roadworksStyles.quickActionText,
          showFilters && roadworksStyles.quickActionTextActive
        ]}>
          Filters
        </Text>
      </Pressable>

      <Pressable
        style={roadworksStyles.quickActionButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={16} color={colors.textMuted} />
        <Text style={roadworksStyles.quickActionText}>Refresh</Text>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => (
    <View style={roadworksStyles.emptyContainer}>
      <Ionicons 
        name="construct" 
        size={64} 
        color={colors.textMuted} 
        style={roadworksStyles.emptyIcon}
      />
      <Text style={roadworksStyles.emptyTitle}>No Roadworks Found</Text>
      <Text style={roadworksStyles.emptyDescription}>
        {(stats.active > 0 || stats.planned > 0) ? (
          `The tab stats show ${stats.active + stats.planned} total roadworks, but the backend API routes are currently experiencing 404 errors. This is a temporary deployment issue that will be resolved shortly.`
        ) : (
          activeTab === 'overview' 
            ? 'There are currently no roadworks to display. Check back later or refresh to see if new data is available.'
            : `No ${activeTab} roadworks found. Try selecting a different tab or refreshing the data.`
        )}
      </Text>
      <Pressable
        style={roadworksStyles.actionButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={16} color={colors.textPrimary} />
        <Text style={roadworksStyles.actionButtonText}>Refresh Data</Text>
      </Pressable>
    </View>
  );

  const renderRoadworksList = () => {
    const filteredRoadworks = getFilteredRoadworks();
    
    if (filteredRoadworks.length === 0) {
      return renderEmptyState();
    }

    // Performance optimization: limit rendering for very large datasets
    const maxItemsToShow = 100;
    const itemsToShow = (filteredRoadworks || []).slice(0, maxItemsToShow);
    const hasMoreItems = (filteredRoadworks || []).length > maxItemsToShow;

    return (
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>
            {activeTab === 'overview' ? 'All Roadworks' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Roadworks`}
          </Text>
          <Text style={roadworksStyles.textMuted}>
            {(filteredRoadworks || []).length} item{(filteredRoadworks || []).length === 1 ? '' : 's'}
            {hasMoreItems ? ` (showing first ${maxItemsToShow})` : ''}
          </Text>
        </View>
        
        {/* Performance warning for large datasets */}
        {hasMoreItems && (
          <View style={[
            roadworksStyles.statusBadge,
            { 
              backgroundColor: colors.warning,
              marginBottom: spacing.md,
              alignSelf: 'flex-start'
            }
          ]}>
            <Ionicons name="information-circle" size={12} color={colors.textPrimary} />
            <Text style={roadworksStyles.statusBadgeText}>
              Large dataset - showing first {maxItemsToShow || 100} items. Use filters to narrow results.
            </Text>
          </View>
        )}
        
        {itemsToShow.map((roadwork, index) => (
          <RoadworkCard
            key={roadwork.id || `${roadwork.source}-${index}`}
            roadwork={roadwork}
            onPress={handleRoadworkPress}
            onViewMap={handleViewMap}
            onViewDiversions={handleViewDiversions}
            onStatusChange={handleStatusChange}
            onCreateDiversion={handleCreateDiversion}
            onViewDetails={handleViewDetails}
            isAdmin={isAdmin}
            showActions={true}
          />
        ))}
        
        {/* Load more functionality for large datasets */}
        {hasMoreItems && (
          <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
            <Ionicons name="funnel" size={32} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>
              {((filteredRoadworks || []).length - (maxItemsToShow || 100))} more items available
            </Text>
            <Text style={roadworksStyles.emptyDescription}>
              Use the filters above to narrow down the results and find specific roadworks.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderMapView = () => {
    const allRoadworks = getFilteredRoadworks();
    
    return (
      <View style={roadworksStyles.section}>
        <MapOverview
          roadworks={allRoadworks}
          selectedRoadwork={selectedRoadwork}
          onRoadworkSelect={handleRoadworkPress}
          onViewFullMap={handleViewFullMap}
          showControls={true}
          height={400}
        />
        
        {/* Map Legend */}
        <View style={[roadworksStyles.section, { marginTop: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>Selected Roadwork Details</Text>
          {selectedRoadwork ? (
            <RoadworkCard
              roadwork={selectedRoadwork}
              onPress={handleRoadworkPress}
              onViewMap={handleViewMap}
              onViewDiversions={handleViewDiversions}
              onStatusChange={handleStatusChange}
              onCreateDiversion={handleCreateDiversion}
              onViewDetails={handleViewDetails}
              isAdmin={isAdmin}
              showActions={true}
              compact={false}
            />
          ) : (
            <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
              <Ionicons name="map" size={32} color={colors.textMuted} />
              <Text style={roadworksStyles.statTrendText}>
                Click on a roadwork marker to view details
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimelineView = () => {
    const allRoadworks = getFilteredRoadworks();
    
    return (
      <View style={roadworksStyles.section}>
        <TimelineView
          roadworks={allRoadworks}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onRoadworkSelect={handleRoadworkPress}
          viewMode="week"
          showFilters={true}
          compactMode={false}
        />
      </View>
    );
  };

  const renderContent = () => {
    console.log('🎨 renderContent called with:', { 
      loading, 
      activeTab, 
      viewMode, 
      totalStats: stats.total,
      roadworksCount: roadworks.length,
      streetManagerCount: streetManagerRoadworks.length
    });
    
    if (loading) {
      return (
        <View style={roadworksStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={roadworksStyles.loadingText}>Loading roadworks data...</Text>
        </View>
      );
    }

    // Render RoadworkQueue for queue tab
    if (activeTab === 'queue') {
      return (
        <RoadworkQueue 
          baseUrl={baseUrl}
          sessionId={sessionId}
          supervisorName={supervisorName}
          supervisorRole={supervisorRole}
          isLoggedIn={isLoggedIn}
        />
      );
    }

    // Render Analytics for analytics tab (includes templates and test tools)
    if (activeTab === 'analytics') {
      return (
        <ScrollView style={roadworksStyles.section}>
          <RoadworksAnalytics 
            baseUrl={baseUrl}
            sessionId={sessionId}
            supervisorName={supervisorName}
          />
          
          {/* Templates Section */}
          <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
            <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
              Diversion Templates
            </Text>
            <DiversionTemplates 
              baseUrl={baseUrl}
              sessionId={sessionId}
              supervisorName={supervisorName}
            />
          </View>

          {/* Test Integration Section */}
          {isAdmin && (
            <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
              <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
                Integration Testing
              </Text>
              <TestRoadworksIntegration 
                baseUrl={baseUrl}
              />
            </View>
          )}
        </ScrollView>
      );
    }

    // Render Enhanced Workflow Tabs (Phase 2)
    if (activeTab === 'monitoring') {
      return renderMonitoringTab();
    }

    if (activeTab === 'completed') {
      return renderCompletedTab();
    }

    if (activeTab === 'overview' && viewMode === 'dashboard') {
      return (
        <View style={roadworksStyles.section}>
          {renderStatsOverview()}
          {renderDataSourceStats()}
          
          {/* Additional Status Access */}
          <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
            <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
              Quick Access
            </Text>
            <View style={roadworksStyles.statsContainer}>
              <StatsCard
                title="Planned Works"
                value={stats.planned}
                subtitle="Click to view planned"
                icon="calendar"
                color={colors.info}
                onPress={() => setFilters(prev => ({ ...prev, status: 'planned' }))}
              />
              <StatsCard
                title="Archives"
                value={stats.archived + stats.rejected}
                subtitle="View archived items"
                icon="filing"
                color={colors.textMuted}
                onPress={() => setFilters(prev => ({ ...prev, status: 'archived,rejected' }))}
              />
              <StatsCard
                title="Timeline View"
                value="📅"
                subtitle="View timeline"
                icon="list"
                color={colors.primary}
                onPress={() => setViewMode('timeline')}
              />
            </View>
          </View>
          
          {/* Quick Preview Components */}
          {stats.total > 0 && (
            <>
              <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
                <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
                  Map Overview
                </Text>
                <MapOverview
                  roadworks={getFilteredRoadworks().slice(0, 20)} // Limit for performance
                  selectedRoadwork={selectedRoadwork}
                  onRoadworkSelect={handleRoadworkPress}
                  onViewFullMap={handleViewFullMap}
                  showControls={false}
                  height={250}
                />
              </View>
              
              <View style={[roadworksStyles.section, { marginTop: spacing.lg }]}>
                <Text style={[roadworksStyles.filterTitle, { marginBottom: spacing.md }]}>
                  Upcoming Events
                </Text>
                <TimelineView
                  roadworks={getFilteredRoadworks().slice(0, 10)} // Limit for performance
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onRoadworkSelect={handleRoadworkPress}
                  viewMode="week"
                  showFilters={false}
                  compactMode={true}
                />
              </View>
            </>
          )}
        </View>
      );
    }

    if (stats.total === 0) {
      return renderEmptyState();
    }

    switch (viewMode) {
      case 'map':
        return renderMapView();
      case 'timeline':
        return renderTimelineView();
      default:
        return renderRoadworksList();
    }
  };

  // Enhanced Workflow Tab Renderers (Phase 2)
  const renderMonitoringTab = () => {
    // SPECIAL HANDLING: For monitoring tab, we need to combine data differently
    // because reviewed streetworks might be filtered out by geographical filter
    // but they should still appear in monitoring tab since they're already confirmed relevant
    
    const validRoadworks = Array.isArray(roadworks) ? roadworks : [];
    const validStreetManagerRoadworks = Array.isArray(streetManagerRoadworks) ? streetManagerRoadworks : [];
    const validReviewedStreetworks = Array.isArray(reviewedStreetworks) ? reviewedStreetworks : [];
    
    // Get all monitoring roadworks directly, bypassing geographical filtering for reviewed items
    let allMonitoringRoadworks = [
      // Manual and Street Manager roadworks go through normal filtering
      ...getFilteredRoadworks().filter(r => r.status === 'monitoring'),
      // Reviewed streetworks with monitoring status - bypass geographical filtering
      ...validReviewedStreetworks.filter(r => r.status === 'monitoring').map(r => ({
        ...r,
        source: 'ReviewedStreetworks',
        id: r.id || `reviewed-${Date.now()}-${Math.random()}`,
        title: r.title || r.location || 'Reviewed Streetwork'
      }))
    ];
    
    // Remove duplicates by ID
    const uniqueIds = new Set();
    allMonitoringRoadworks = allMonitoringRoadworks.filter(roadwork => {
      if (uniqueIds.has(roadwork.id)) {
        return false;
      }
      uniqueIds.add(roadwork.id);
      return true;
    });
    
    // DEBUG: Log the filtering results
    console.log('🔍 MONITORING TAB DEBUG (FIXED):');
    console.log('🔍 Total monitoring roadworks found:', allMonitoringRoadworks.length);
    console.log('🔍 Sources breakdown:', {
      manual: allMonitoringRoadworks.filter(r => r.source === 'manual').length,
      streetManager: allMonitoringRoadworks.filter(r => r.source === 'StreetManager').length,
      reviewed: allMonitoringRoadworks.filter(r => r.source === 'ReviewedStreetworks').length
    });
    console.log('🔍 Sample monitoring roadworks:', allMonitoringRoadworks.slice(0, 3));
    
    const monitoringRoadworks = allMonitoringRoadworks;
    
    return (
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>Monitoring Dashboard</Text>
          <Text style={roadworksStyles.textMuted}>
            {monitoringRoadworks.length} monitored roadworks
          </Text>
        </View>
        
        {/* Monitoring Stats */}
        <View style={roadworksStyles.statsContainer}>
          <StatsCard
            title="Daily Checks"
            value={monitoringRoadworks.filter(r => r.sub_status === 'daily_check').length}
            subtitle="Require daily monitoring"
            icon="calendar"
            color={colors.warning}
            onPress={() => {}}
          />
          <StatsCard
            title="Weekly Checks"
            value={monitoringRoadworks.filter(r => r.sub_status === 'weekly_check').length}
            subtitle="Weekly monitoring schedule"
            icon="time"
            color={colors.info}
            onPress={() => {}}
          />
          <StatsCard
            title="Escalated"
            value={monitoringRoadworks.filter(r => r.escalation_level > 0).length}
            subtitle="Requiring attention"
            icon="alert-triangle"
            color={colors.error}
            onPress={() => {}}
          />
        </View>

        {/* Overdue Reviews Alert */}
        {monitoringRoadworks.some(r => r.is_overdue) && (
          <View style={[roadworksStyles.statusBadge, { backgroundColor: colors.error, marginBottom: spacing.md }]}>
            <Ionicons name="warning" size={16} color="#ffffff" />
            <Text style={[roadworksStyles.statusBadgeText, { color: '#ffffff' }]}>
              {monitoringRoadworks.filter(r => r.is_overdue).length} overdue reviews requiring immediate attention
            </Text>
          </View>
        )}

        {/* Monitoring List */}
        {monitoringRoadworks.length > 0 ? (
          monitoringRoadworks.map((roadwork, index) => (
            <RoadworkCard
              key={roadwork.id || `monitoring-${index}`}
              roadwork={{
                ...roadwork,
                isOverdue: roadwork.is_overdue,
                nextReviewDate: roadwork.next_review_date,
                escalationLevel: roadwork.escalation_level
              }}
              onPress={handleRoadworkPress}
              onViewMap={handleViewMap}
              onStatusChange={handleStatusChange}
              isAdmin={isAdmin}
              showActions={true}
              showWorkflowActions={true}
            />
          ))
        ) : (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="eye" size={64} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Monitoring Required</Text>
            <Text style={roadworksStyles.emptyDescription}>
              All roadworks are currently in active or completed states.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCompletedTab = () => {
    const completedRoadworks = getFilteredRoadworks().filter(r => r.status === 'completed');
    
    return (
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>Completed Roadworks</Text>
          <Text style={roadworksStyles.textMuted}>
            {completedRoadworks.length} completed works
          </Text>
        </View>

        {/* Completion Stats */}
        <View style={roadworksStyles.statsContainer}>
          <StatsCard
            title="This Week"
            value={completedRoadworks.filter(r => {
              const completedDate = new Date(r.updated_at);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return completedDate > weekAgo;
            }).length}
            subtitle="Completed this week"
            icon="checkmark-circle"
            color={colors.success}
            onPress={() => {}}
          />
          <StatsCard
            title="This Month"
            value={completedRoadworks.filter(r => {
              const completedDate = new Date(r.updated_at);
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return completedDate > monthAgo;
            }).length}
            subtitle="Completed this month"
            icon="trending-up"
            color={colors.info}
            onPress={() => {}}
          />
          <StatsCard
            title="Archived Items"
            value={stats.archived + stats.rejected}
            subtitle="View archived works"
            icon="archive"
            color={colors.primary}
            onPress={() => setFilters(prev => ({ ...prev, status: 'archived,rejected' }))}
          />
        </View>

        {/* Completed List */}
        {completedRoadworks.length > 0 ? (
          completedRoadworks.map((roadwork, index) => (
            <RoadworkCard
              key={roadwork.id || `completed-${index}`}
              roadwork={{
                ...roadwork,
                completedDate: roadwork.updated_at,
                canArchive: new Date(roadwork.updated_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }}
              onPress={handleRoadworkPress}
              onViewMap={handleViewMap}
              onStatusChange={handleStatusChange}
              isAdmin={isAdmin}
              showActions={true}
              showArchiveAction={true}
            />
          ))
        ) : (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Completed Works</Text>
            <Text style={roadworksStyles.emptyDescription}>
              Completed roadworks will appear here for review and archiving.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderArchivesTab = () => {
    const archivedRoadworks = getFilteredRoadworks().filter(r => r.status === 'archived' || r.status === 'rejected');
    
    return (
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <Text style={roadworksStyles.filterTitle}>Archived Roadworks</Text>
          <Text style={roadworksStyles.textMuted}>
            {archivedRoadworks.length} archived items
          </Text>
        </View>

        {/* Archive Stats */}
        <View style={roadworksStyles.statsContainer}>
          <StatsCard
            title="Archived"
            value={archivedRoadworks.filter(r => r.status === 'archived').length}
            subtitle="Successfully completed"
            icon="archive"
            color={colors.info}
            onPress={() => {}}
          />
          <StatsCard
            title="Rejected"
            value={archivedRoadworks.filter(r => r.status === 'rejected').length}
            subtitle="Not approved"
            icon="close-circle"
            color={colors.error}
            onPress={() => {}}
          />
          <StatsCard
            title="Total Storage"
            value={archivedRoadworks.length}
            subtitle="All archived items"
            icon="filing"
            color={colors.textMuted}
            onPress={() => {}}
          />
        </View>

        {/* Search and Filter for Archives */}
        <View style={[roadworksStyles.row, { marginBottom: spacing.md }]}>
          <TextInput
            style={[roadworksStyles.searchInput, { flex: 1 }]}
            placeholder="Search archived roadworks..."
            value={filters.searchQuery || ''}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
          />
          <Pressable
            style={roadworksStyles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="funnel" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Archives List */}
        {archivedRoadworks.length > 0 ? (
          archivedRoadworks.slice(0, 50).map((roadwork, index) => (
            <RoadworkCard
              key={roadwork.id || `archived-${index}`}
              roadwork={{
                ...roadwork,
                archivedDate: roadwork.updated_at,
                archiveReason: roadwork.status === 'rejected' ? 'Rejected' : 'Completed'
              }}
              onPress={handleRoadworkPress}
              onViewMap={handleViewMap}
              isAdmin={isAdmin}
              showActions={false}
              compact={true}
              archived={true}
            />
          ))
        ) : (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="filing" size={64} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Archived Items</Text>
            <Text style={roadworksStyles.emptyDescription}>
              Completed and rejected roadworks will be archived here for future reference.
            </Text>
          </View>
        )}

        {archivedRoadworks.length > 50 && (
          <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
            <Text style={roadworksStyles.emptyTitle}>
              Showing 50 of {archivedRoadworks.length} archived items
            </Text>
            <Text style={roadworksStyles.emptyDescription}>
              Use search and filters to find specific archived roadworks.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={roadworksStyles.container}>
      {renderHeader()}
      
      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={roadworksStyles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabs()}
        {renderQuickActions()}
        
        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({
              status: 'all',
              source: 'all',
              dateRange: 'all',
              affectedRoutes: [],
              searchQuery: ''
              // No gneOnly - permanently filtered to North East
            })}
            availableRoutes={getAvailableRoutes()}
            onClose={() => setShowFilters(false)}
            visible={showFilters}
          />
        )}
        
        {renderContent()}
      </ScrollView>

      {/* Roadwork Detail Modal */}
      <RoadworkDetailModal
        roadwork={selectedRoadwork}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onCreateDiversion={handleCreateDiversion}
        baseUrl={baseUrl}
      />
    </View>
  );
};

export default RoadworksManagerV2;