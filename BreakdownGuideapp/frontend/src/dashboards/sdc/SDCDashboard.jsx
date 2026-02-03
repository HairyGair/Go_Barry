/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import FilterBar from '../components/FilterBar';
import EnhancedFilterBar from './EnhancedFilterBar';
import SDCBreakdownCardEnhanced from './SDCBreakdownCardEnhanced';
import { getSDCGuidance, getSLAForIssue } from './utils/sdcGuideReference';
import PriorityAlerts from './PriorityAlerts';
import StatusWidget from './StatusWidget';
import RecentDecisions from './RecentDecisions';
import BreakdownMap from './BreakdownMap';
import DepotStatusGrid from './DepotStatusGrid';
import AssessmentProgressTracker from './AssessmentProgressTracker';
import AssessmentProgressCard from './AssessmentProgressCard';
import EngineeringTimerAlert from './EngineeringTimerAlert';
import BreakdownResolutionDialog from './components/BreakdownResolutionDialog';
import DepotContactModal from '../../components/DepotContactModal';
import { apiClient } from '../../services/api-client';
import { fetchAllActivities } from '../../api/activityAggregator';
import { enhanceBreakdownDataInline } from './dataEnhancementPatch';
import { clearCorruptedData } from './clearTestData';
import useConnectionManager from '../../hooks/useConnectionManager';
import useAssessmentData from '../../hooks/useAssessmentData';
import assessmentAPI from '../../services/assessmentAPI';
import AssessmentDataFallback from '../../components/AssessmentDataFallback';
import CoverageAlertWidget from '../../components/CoverageAlertWidget';
import SupervisorCoverageBar from '../../components/SupervisorCoverageBar';
import { useAuth } from '../../contexts/AuthContext';
import { alertSoundService } from '../../services/alertSoundService';
import './SDCDashboard.css';

const SDCDashboard = () => {
  const location = useLocation();
  const { currentUser } = useAuth(); // Get authenticated user from AuthContext
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [priorityAlerts, setPriorityAlerts] = useState([]);
  const [recentDecisions, setRecentDecisions] = useState([]);
  
  // Enhanced Assessment State Management
  const [activeAssessments, setActiveAssessments] = useState([]);
  const [assessmentsInProgress, setAssessmentsInProgress] = useState([]);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const [highlightedBreakdown, setHighlightedBreakdown] = useState(null);
  
  // Additional dashboard state
  const [engineeringTimers, setEngineeringTimers] = useState(new Map());

  // Sound alert state
  const [soundEnabled, setSoundEnabled] = useState(() => alertSoundService.isEnabled());
  const prevBreakdownsRef = useRef([]);
  const [screenFlash, setScreenFlash] = useState(null); // 'stop' | 'amber' | null

  // Resolution dialog state
  const [resolutionDialog, setResolutionDialog] = useState({
    isOpen: false,
    breakdown: null
  });

  // Contact modal state
  const [contactModal, setContactModal] = useState({
    isOpen: false,
    breakdown: null
  });

  // Full-screen map mode
  const [fullScreenMap, setFullScreenMap] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  // URL parameter handling state
  const [redirectNotification, setRedirectNotification] = useState(null);
  const [scrollToBreakdown, setScrollToBreakdown] = useState(null);
  const breakdownRefs = useRef(new Map());
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
    dispatched: 0,
    inAssessment: 0
  });
  
  // Hybrid connection manager for real-time updates
  const connectionManager = useConnectionManager({
    endpoint: '/ws?channel=sdc-dashboard',
    autoConnect: true,
    primary: 'websocket',
    fallback: 'polling',
    autoFailover: true,
    reconnectAttempts: 5,
    pollingInterval: 5000
  });

  // Debug connection status
  useEffect(() => {
    console.log('🔌 Connection Manager Status:', {
      isConnected: connectionManager.isConnected,
      currentMode: connectionManager.currentMode,
      state: connectionManager.state,
      endpoint: '/ws?channel=sdc-dashboard'
    });
  }, [connectionManager.isConnected, connectionManager.currentMode, connectionManager.state]);

  // Assessment data integration with API and WebSocket (disabled for now to reduce log noise)
  const assessmentData = useAssessmentData({
    autoConnect: false,
    enableWebSocket: false,
    enableAPI: false,
    pollInterval: 60000 // Reduced frequency when enabled
  });

  // Current supervisor state (must be declared before getEnhancedFilters)
  // Use currentUser from AuthContext instead of localStorage (SECURITY FIX)
  const currentSupervisor = currentUser ? {
    name: currentUser.name,
    badge: currentUser.badge_number,
    supervisorBadge: currentUser.badge_number,
    depot: currentUser.depot,
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role
  } : null;

  // Enhanced filter options with dynamic counts and assessment details (memoized for performance)
  const enhancedFilters = useMemo(() => {
    const totalBreakdowns = breakdowns.length;
    const criticalCount = breakdowns.filter(b => b.isCritical).length;
    const pendingCount = breakdowns.filter(b => b.isPending).length;
    const priorityRoutesCount = breakdowns.filter(b => b.isPriorityRoute).length;
    
    // Calculate in-assessment details using enhanced state management
    const allActiveAssessments = [
      ...(assessmentsInProgress || []),
      ...(activeAssessments || [])
    ];
    
    // Remove duplicates based on breakdown_id
    const uniqueAssessments = allActiveAssessments.reduce((acc, assessment) => {
      const key = assessment.breakdown_id || assessment.id || assessment.assessment_id;
      if (!acc.find(a => (a.breakdown_id || a.id || a.assessment_id) === key)) {
        acc.push(assessment);
      }
      return acc;
    }, []);
    
    const inAssessmentCount = assessmentsInProgress?.length || 0;
    const supervisorNames = [...new Set(uniqueAssessments.map(a => 
      a.supervisor_name || a.supervisor?.name || 'Unknown'
    ).filter(Boolean))];
    const assessmentTypes = [...new Set(uniqueAssessments.map(a => 
      a.wizardType || a.wizard_type || 'General'
    ).filter(Boolean))];
    const avgProgress = uniqueAssessments.length > 0 
      ? Math.round(uniqueAssessments.reduce((sum, a) => {
          const stepProgress = a.progress_percentage || 
            (() => {
              const [current, total] = (a.currentStep || a.current_step || '1/1').split('/').map(Number);
              return (current / total) * 100;
            })();
          return sum + stepProgress;
        }, 0) / uniqueAssessments.length)
      : 0;
    
    // Calculate my breakdowns count
    const myBreakdownsCount = currentSupervisor 
      ? breakdowns.filter(b => 
          b.supervisor_badge === (currentSupervisor.badge || currentSupervisor.supervisorBadge) ||
          b.supervisor_name === currentSupervisor.name
        ).length
      : 0;

    return [
      { 
        value: 'all', 
        label: 'All Breakdowns', 
        icon: '📋', 
        count: totalBreakdowns 
      },
      { 
        value: 'critical', 
        label: 'Critical', 
        icon: '🚨', 
        count: criticalCount,
        subtitle: criticalCount > 0 ? 'Immediate attention required' : 'No critical issues'
      },
      { 
        value: 'pending', 
        label: 'Pending Decision', 
        icon: '⏳', 
        count: pendingCount,
        subtitle: pendingCount > 0 ? 'Awaiting supervisor decision' : 'All acknowledged'
      },
      { 
        value: 'in-assessment', 
        label: 'In Assessment', 
        icon: '🔄', 
        count: inAssessmentCount,
        subtitle: inAssessmentCount > 0 
          ? `${supervisorNames.length} supervisor${supervisorNames.length !== 1 ? 's' : ''} active • ${avgProgress}% avg progress`
          : 'No active assessments',
        details: inAssessmentCount > 0 ? {
          supervisors: supervisorNames.slice(0, 3),
          types: assessmentTypes.slice(0, 3),
          avgProgress
        } : null
      },
      { 
        value: 'my-breakdowns', 
        label: 'My Breakdowns', 
        icon: '👤', 
        count: myBreakdownsCount,
        subtitle: currentSupervisor 
          ? `Assigned to ${currentSupervisor.name || currentSupervisor.badge}`
          : 'Login to see your breakdowns'
      },
      { 
        value: 'priority-routes', 
        label: 'Priority Routes', 
        icon: '⭐', 
        count: priorityRoutesCount,
        subtitle: priorityRoutesCount > 0 
          ? `X10, X21, 21, 56, 1 routes affected`
          : 'No priority route issues'
      }
    ];
  }, [breakdowns, assessmentsInProgress, currentSupervisor]);

  // Memoized filter computation
  const filters = enhancedFilters;

  // Priority routes
  const PRIORITY_ROUTES = ['X10', 'X21', '21', '56', '1'];

  // Enhanced assessment tracking with integrated data - DISABLED TO FIX INFINITE LOOP
  const fetchActiveAssessments = useCallback(async () => {
    console.log('📊 fetchActiveAssessments disabled to fix infinite loop');
    return;
    
    /* DISABLED CODE:
    try {
      // Use integrated assessment data as primary source
      const integratedAssessments = assessmentData.activeAssessments || [];
      
      // Fallback to legacy activity data if needed
      let legacyAssessments = [];
      if (integratedAssessments.length === 0) {
        const activityData = await fetchAllActivities(50);
        
        // Filter for wizard_started activities that don't have corresponding wizard_completed
        const wizardStarted = activityData.activities?.filter(a => 
          a.type === 'wizard_started' || a.message?.includes('started')
        ) || [];
        
        const wizardCompleted = activityData.activities?.filter(a => 
          a.type === 'wizard_completed' || a.message?.includes('completed')
        ) || [];
        
        // Find active assessments (started but not completed)
        legacyAssessments = wizardStarted.filter(started => {
          const hasCompleted = wizardCompleted.some(completed => 
            completed.breakdown_id === started.breakdown_id ||
            completed.fleet_no === started.fleet_no
          );
          
          // Only show if assessment was started in the last 30 minutes
          const startTime = new Date(started.timestamp);
          const now = new Date();
          const ageMinutes = (now - startTime) / (1000 * 60);
          
          return !hasCompleted && ageMinutes <= 30;
        });
      }
      
      // Merge and normalize assessment data
      const allAssessments = [...integratedAssessments, ...legacyAssessments];
      const uniqueAssessments = allAssessments.reduce((acc, assessment) => {
        const key = assessment.breakdown_id || assessment.id || assessment.assessment_id;
        if (!acc.find(a => (a.breakdown_id || a.id || a.assessment_id) === key)) {
          // Normalize assessment structure
          acc.push({
            breakdown_id: assessment.breakdown_id || assessment.id,
            assessment_id: assessment.assessment_id || assessment.id,
            supervisor_name: assessment.supervisor_name || assessment.supervisor?.name,
            supervisor_badge: assessment.supervisor_badge || assessment.supervisor?.badge,
            wizardType: assessment.wizardType || assessment.wizard_type || 'General',
            currentStep: assessment.currentStep || assessment.current_step || '1',
            totalSteps: assessment.totalSteps || assessment.total_steps || '5',
            stepDescription: assessment.stepDescription || assessment.step_description || 'In progress...',
            progress_percentage: assessment.progress_percentage || 0,
            timestamp: assessment.timestamp || assessment.started_at || new Date().toISOString(),
            fleet_no: assessment.fleet_no || assessment.vehicle?.fleet_number,
            location: assessment.location,
            route: assessment.route,
            estimatedCompletion: assessment.estimatedCompletion || 'Unknown',
            priority: assessment.priority || 'normal'
          });
        }
        return acc;
      }, []);
      
      setActiveAssessments(uniqueAssessments);
      console.log(`📊 Active assessments updated: ${uniqueAssessments.length} (${integratedAssessments.length} integrated, ${legacyAssessments.length} legacy)`);
      
    } catch (error) {
      console.error('Error fetching active assessments:', error);
      setActiveAssessments([]);
    }
    */
  }, [assessmentData]);

  // Enhanced assessment state management - sync with useAssessmentData hook
  useEffect(() => {
    if (assessmentData) {
      // Update assessments in progress (actively being worked on)
      const inProgressAssessments = assessmentData.activeAssessments?.filter(assessment => 
        assessment.status === 'in_progress' || 
        assessment.current_step || 
        assessment.progress_percentage > 0
      ) || [];
      
      setAssessmentsInProgress(inProgressAssessments);
      
      // Update completed assessments (recent completions)
      const recentCompletedAssessments = assessmentData.completedAssessments || [];
      setCompletedAssessments(recentCompletedAssessments);
      
      console.log(`📊 Enhanced assessment state updated:`, {
        inProgress: inProgressAssessments.length,
        completed: recentCompletedAssessments.length,
        total: (assessmentData.activeAssessments?.length || 0)
      });
    }
  }, [assessmentData.activeAssessments, assessmentData.completedAssessments]);

  // Update stats when assessment state changes
  useEffect(() => {
    if (breakdowns.length > 0) {
      const activeBreakdowns = breakdowns.filter(b => b.status !== 'resolved');
      const criticalCount = activeBreakdowns.filter(b => b.isCritical).length;
      const pendingCount = activeBreakdowns.filter(b => b.isPending).length;
      const dispatchedCount = activeBreakdowns.filter(b => b.isDispatched).length;

      setStats(prevStats => ({
        ...prevStats,
        total: activeBreakdowns.length,
        critical: criticalCount,
        pending: pendingCount,
        dispatched: dispatchedCount,
        inAssessment: assessmentsInProgress.length
      }));

      console.log(`📊 Stats updated: ${assessmentsInProgress.length} assessments in progress`);
    }
  }, [breakdowns, assessmentsInProgress.length]);

  // Sound alert effect - detect new breakdowns and play appropriate sounds
  useEffect(() => {
    // Skip on first render or when loading
    if (loading || prevBreakdownsRef.current.length === 0) {
      prevBreakdownsRef.current = breakdowns.map(b => b.breakdown_id);
      return;
    }

    // Find new breakdowns (not in previous list)
    const prevIds = new Set(prevBreakdownsRef.current);
    const newBreakdowns = breakdowns.filter(b => !prevIds.has(b.breakdown_id));

    if (newBreakdowns.length > 0) {
      console.log(`🔔 Detected ${newBreakdowns.length} new breakdown(s)`);

      // Play sound for the most critical new breakdown
      const hasStop = newBreakdowns.some(b => b.severity === 'STOP' || b.wizard_decision === 'STOP');
      const hasAmber = newBreakdowns.some(b => b.severity === 'AMBER' || b.wizard_decision === 'AMBER');

      if (hasStop) {
        alertSoundService.playStopAlert();
        alertSoundService.showNotification(
          '🛑 STOP Breakdown',
          `Critical breakdown requires immediate attention`,
          'STOP'
        );
        // Trigger screen flash for STOP
        setScreenFlash('stop');
        setTimeout(() => setScreenFlash(null), 1500);
      } else if (hasAmber) {
        alertSoundService.playAmberAlert();
        alertSoundService.showNotification(
          '⚠️ AMBER Breakdown',
          `Breakdown requires assessment`,
          'AMBER'
        );
        // Trigger screen flash for AMBER
        setScreenFlash('amber');
        setTimeout(() => setScreenFlash(null), 1000);
      } else {
        alertSoundService.playNewBreakdownAlert();
      }
    }

    // Update previous breakdowns reference
    prevBreakdownsRef.current = breakdowns.map(b => b.breakdown_id);
  }, [breakdowns, loading]);

  // Enhanced URL parameter handling for breakdown guide redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const highlightId = urlParams.get('highlight');
    const fleetParam = urlParams.get('fleet'); // Support fleet number parameter from Activity Feed
    const decision = urlParams.get('decision');
    const supervisor = urlParams.get('supervisor');
    const duration = urlParams.get('duration');
    const timestamp = urlParams.get('timestamp');
    const source = urlParams.get('source');

    // Handle fleet number parameter (from Activity Feed Details button)
    if (fleetParam && breakdowns.length > 0) {
      console.log('📍 Processing fleet parameter redirect:', { fleet: fleetParam });

      // Find breakdown by fleet number
      const targetBreakdown = breakdowns.find(b =>
        b.fleet_no === fleetParam ||
        b.fleet_number === fleetParam ||
        String(b.fleet_no) === String(fleetParam)
      );

      if (targetBreakdown) {
        console.log('✅ Found breakdown for fleet:', fleetParam, targetBreakdown);
        setHighlightedBreakdown(targetBreakdown.breakdown_id);
        setScrollToBreakdown(targetBreakdown.breakdown_id);

        // Auto-expand the card
        setExpandedCard(targetBreakdown.breakdown_id);

        // Clear highlight after 10 seconds
        setTimeout(() => {
          setHighlightedBreakdown(null);
        }, 10000);
      } else {
        console.warn('⚠️ No breakdown found for fleet:', fleetParam);
      }

      // Clean up URL parameter
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('fleet');
      if (newUrl.search !== window.location.search) {
        window.history.replaceState({}, '', newUrl.toString());
      }
    }

    if (highlightId) {
      console.log('📍 Processing breakdown guide redirect:', {
        highlightId,
        decision,
        supervisor,
        duration,
        source
      });
      
      // Set highlight state
      setHighlightedBreakdown(highlightId);
      setScrollToBreakdown(highlightId);
      
      // Create completion notification if this is from an assessment
      if (decision && source === 'breakdown-guide') {
        const notificationData = {
          id: `redirect-${highlightId}-${Date.now()}`,
          breakdownId: highlightId,
          decision: decision.toUpperCase(),
          supervisor: supervisor || 'Unknown Supervisor',
          duration: duration || 'Unknown',
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          source: 'assessment_redirect'
        };
        
        setRedirectNotification(notificationData);
        
        // Add to completed assessments for tracking
        setCompletedAssessments(prev => {
          const newCompletion = {
            id: highlightId,
            completedAt: notificationData.timestamp.toISOString(),
            decision: decision.toUpperCase(),
            supervisor: supervisor || 'Unknown',
            duration: duration || 'Unknown',
            source: 'redirect'
          };
          
          // Avoid duplicates
          const exists = prev.some(c => c.id === highlightId);
          return exists ? prev : [newCompletion, ...prev.slice(0, 9)];
        });
        
        // Start engineering timer for STOP/AMBER decisions
        if (decision.toUpperCase() === 'STOP' || decision.toUpperCase() === 'AMBER') {
          setEngineeringTimers(prev => {
            const newTimers = new Map(prev);
            if (!newTimers.has(highlightId)) {
              newTimers.set(highlightId, {
                startTime: Date.now(),
                decision: decision.toUpperCase(),
                targetTime: decision.toUpperCase() === 'STOP' ? 15 * 60 * 1000 : 30 * 60 * 1000,
                fleet: 'Redirect',
                source: 'assessment_redirect'
              });
            }
            return newTimers;
          });
        }
        
        // Clear notification after 15 seconds
        setTimeout(() => {
          setRedirectNotification(null);
        }, 15000);
      }
      
      // Clear highlight after 12 seconds (slightly longer for redirects)
      setTimeout(() => {
        setHighlightedBreakdown(null);
      }, 12000);
      
      // Clean up URL parameters after processing
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('highlight');
      newUrl.searchParams.delete('decision');
      newUrl.searchParams.delete('supervisor');
      newUrl.searchParams.delete('duration');
      newUrl.searchParams.delete('timestamp');
      newUrl.searchParams.delete('source');
      
      if (newUrl.search !== window.location.search) {
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [location.search, breakdowns]);
  
  // Auto-scroll to highlighted breakdown when data loads
  useEffect(() => {
    if (scrollToBreakdown && breakdowns.length > 0 && !loading) {
      const targetBreakdown = breakdowns.find(b => 
        b.breakdown_id === scrollToBreakdown || 
        b.id === scrollToBreakdown
      );
      
      if (targetBreakdown) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const breakdownElement = breakdownRefs.current.get(scrollToBreakdown);
          if (breakdownElement) {
            // Smooth scroll to breakdown with offset for header
            const yOffset = -100;
            const y = breakdownElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
              top: y,
              behavior: 'smooth'
            });
            
            console.log('📍 Auto-scrolled to breakdown:', scrollToBreakdown);
          }
          
          // Clear scroll target
          setScrollToBreakdown(null);
        }, 500);
      }
    }
  }, [scrollToBreakdown, breakdowns, loading]);
  
  // Function to set breakdown ref for auto-scrolling
  const setBreakdownRef = useCallback((breakdownId, element) => {
    if (element) {
      breakdownRefs.current.set(breakdownId, element);
    } else {
      breakdownRefs.current.delete(breakdownId);
    }
  }, []);
  
  // Supervisor data now comes from AuthContext (useAuth hook)
  // No need for localStorage lookup - security improvement

  // Handle real-time messages from connection manager
  useEffect(() => {
    const unsubscribe = connectionManager.onMessage((message) => {
      console.log('📨 SDC Dashboard received message:', message);
      
      if (message.type === 'poll_update' && message.activities) {
        // Handle polling updates
        message.activities.forEach(activity => {
          const activityData = {
            type: activity.type || activity.activity_type,
            breakdown_id: activity.breakdown_id,
            fleet_no: activity.fleet_no,
            ...activity
          };
          handleRealtimeUpdate(activityData);
        });
      } else {
        // Handle WebSocket updates
        handleRealtimeUpdate(message);
      }
    });

    return unsubscribe;
  }, []); // Remove connectionManager dependency to prevent loops

  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = useCallback((data) => {
    switch (data.type) {
      case 'wizard_started':
      case 'assessment_started':
        // Add to active assessments with enhanced data
        setActiveAssessments(prev => {
          const exists = prev.some(a => 
            a.breakdown_id === data.breakdown_id || 
            a.assessmentId === data.assessmentId
          );
          if (!exists) {
            const assessment = {
              ...data,
              breakdown_id: data.breakdown_id || data.breakdownId,
              fleet_no: data.vehicle?.fleetNumber || data.fleet_no,
              timestamp: data.timestamp || data.startTime || new Date().toISOString(),
              currentStep: data.currentStep || '1',
              totalSteps: data.totalSteps || '5',
              stepDescription: data.stepDescription || 'Starting assessment...',
              estimatedCompletion: data.estimatedCompletion || '5 mins',
              wizardType: data.wizardType || data.issue_type || 'General Assessment',
              supervisor_name: data.supervisor?.name || data.supervisor_name,
              location: data.location,
              route: data.route
            };
            return [assessment, ...prev];
          }
          return prev;
        });
        break;
        
      case 'wizard_completed':
      case 'assessment_completed':
        const breakdownId = data.breakdown_id || data.breakdownId;

        console.log(`✅ SDC Dashboard received wizard_completed event for breakdown ${breakdownId}:`, {
          decision: data.decision,
          supervisor: data.supervisor_name,
          fleet: data.vehicle?.fleetNumber,
          timestamp: data.timestamp
        });

        // Remove from active assessments and highlight in main list
        setActiveAssessments(prev =>
          prev.filter(a =>
            a.breakdown_id !== breakdownId &&
            a.assessmentId !== data.assessmentId
          )
        );

        // Add to completed assessments with timestamp
        const completedAssessment = {
          id: breakdownId,
          completedAt: new Date().toISOString(),
          decision: data.decision,
          supervisor: data.supervisor?.name || data.supervisor_name || 'Unknown',
          fleet: data.vehicle?.fleetNumber || data.fleet_no || 'Unknown',
          location: data.location,
          wizardType: data.wizardType || data.issue_type,
          duration: data.duration || data.elapsedTime
        };

        setCompletedAssessments(prev => [completedAssessment, ...prev.slice(0, 9)]);

        // Highlight the breakdown for 12 seconds with completion flash
        setHighlightedBreakdown(breakdownId);
        setTimeout(() => setHighlightedBreakdown(null), 12000);

        // Start engineering response timer for STOP and AMBER decisions
        if (data.decision === 'STOP' || data.decision === 'AMBER') {
          setEngineeringTimers(prev => {
            const newTimers = new Map(prev);
            newTimers.set(breakdownId, {
              startTime: Date.now(),
              decision: data.decision,
              targetTime: data.decision === 'STOP' ? 15 * 60 * 1000 : 30 * 60 * 1000, // 15 mins for STOP, 30 for AMBER
              fleet: data.vehicle?.fleetNumber || data.fleet_no || 'Unknown'
            });
            return newTimers;
          });
        }

        // Add to recent decisions
        if (data.decision) {
          setRecentDecisions(prev => [
            {
              id: breakdownId,
              time: new Date().toISOString(),
              fleet: data.vehicle?.fleetNumber || data.fleet_no || 'Unknown',
              decision: data.decision,
              notes: data.notes,
              supervisor: data.supervisor?.name || data.supervisor_name || 'Unknown',
              duration: data.duration || data.elapsedTime
            },
            ...prev.slice(0, 4)
          ]);
        }

        console.log(`🔄 Refreshing breakdown list after wizard completion for ${breakdownId}`);
        fetchBreakdowns(); // Refresh breakdown data
        break;
        
      case 'assessment_cancelled':
        // Remove from active assessments
        setActiveAssessments(prev => 
          prev.filter(a => 
            a.breakdown_id !== data.breakdown_id &&
            a.assessmentId !== data.assessmentId
          )
        );
        break;
        
      case 'breakdown_created':
        console.log('📡 SDC Dashboard: New breakdown created, refreshing list');
        // Play alert sound based on severity
        if (data.severity === 'STOP' || data.decision === 'STOP') {
          alertSoundService.playStopAlert();
          alertSoundService.showNotification(
            '🛑 New STOP Breakdown',
            `Fleet ${data.fleet_no || 'Unknown'} - ${data.location || 'Location pending'}`,
            'STOP'
          );
          // Trigger screen flash
          setScreenFlash('stop');
          setTimeout(() => setScreenFlash(null), 1500);
        } else if (data.severity === 'AMBER' || data.decision === 'AMBER') {
          alertSoundService.playAmberAlert();
          alertSoundService.showNotification(
            '⚠️ New AMBER Breakdown',
            `Fleet ${data.fleet_no || 'Unknown'} - ${data.location || 'Location pending'}`,
            'AMBER'
          );
          // Trigger screen flash
          setScreenFlash('amber');
          setTimeout(() => setScreenFlash(null), 1000);
        } else {
          alertSoundService.playNewBreakdownAlert();
        }
        fetchBreakdowns(); // Refresh breakdown data
        break;

      case 'breakdown_updated':
      case 'breakdowns_updated':
        console.log('📡 SDC Dashboard: Breakdown updated, refreshing list');
        fetchBreakdowns(); // Refresh breakdown data
        break;

      case 'engineer_assigned':
      case 'engineering_dispatched':
        // Clear engineering timer when engineer is assigned
        const assignedBreakdownId = data.breakdown_id || data.breakdownId;
        setEngineeringTimers(prev => {
          const newTimers = new Map(prev);
          newTimers.delete(assignedBreakdownId);
          return newTimers;
        });
        fetchBreakdowns(); // Refresh breakdown data
        break;

      case 'breakdown_resolved':
        // Remove resolved breakdown from view
        const resolvedBreakdownId = data.breakdown_id || data.breakdownId;
        console.log('✅ Breakdown resolved via WebSocket:', resolvedBreakdownId);

        // Remove from active breakdowns
        setBreakdowns(prev => prev.filter(b => b.breakdown_id !== resolvedBreakdownId));

        // Clear engineering timer if exists
        setEngineeringTimers(prev => {
          const newTimers = new Map(prev);
          newTimers.delete(resolvedBreakdownId);
          return newTimers;
        });

        // Remove from active assessments if exists
        setActiveAssessments(prev =>
          prev.filter(a => a.breakdown_id !== resolvedBreakdownId)
        );

        // Add to completed resolutions list
        setCompletedAssessments(prev => [
          {
            id: resolvedBreakdownId,
            completedAt: data.resolved_at || new Date().toISOString(),
            decision: data.resolution_type || 'resolved',
            supervisor: data.resolved_by || 'SDC',
            fleet: data.breakdown?.fleet_number || 'Unknown',
            location: data.breakdown?.location,
            wizardType: 'Resolution',
            duration: data.breakdown?.elapsed_time_minutes ? `${data.breakdown.elapsed_time_minutes} mins` : 'N/A'
          },
          ...prev.slice(0, 9)
        ]);

        console.log(`🎉 Breakdown ${resolvedBreakdownId} removed from dashboard`);
        break;

      case 'assessment_progress':
        // Update progress for specific assessment with detailed info
        setActiveAssessments(prev => 
          prev.map(a => {
            if (a.breakdown_id === data.breakdown_id || 
                a.assessmentId === data.assessmentId) {
              return {
                ...a,
                currentStep: data.currentStep,
                totalSteps: data.totalSteps,
                stepDescription: data.stepDescription,
                progress: data.progress,
                estimatedCompletion: data.estimatedCompletion,
                elapsedTime: data.elapsedTime
              };
            }
            return a;
          })
        );
        break;
    }
  }, []);

  // Enhanced assessment state management functions
  const getAssessmentByBreakdownId = useCallback((breakdownId) => {
    return assessmentsInProgress.find(assessment => 
      assessment.breakdown_id === breakdownId || 
      assessment.id === breakdownId
    );
  }, [assessmentsInProgress]);

  const getCompletedAssessmentByBreakdownId = useCallback((breakdownId) => {
    return completedAssessments.find(assessment => 
      assessment.breakdown_id === breakdownId || 
      assessment.id === breakdownId
    );
  }, [completedAssessments]);

  const isBreakdownInAssessment = useCallback((breakdownId) => {
    return Boolean(getAssessmentByBreakdownId(breakdownId));
  }, [getAssessmentByBreakdownId]);

  const getAssessmentProgress = useCallback((breakdownId) => {
    const assessment = getAssessmentByBreakdownId(breakdownId);
    if (!assessment) return null;
    
    return {
      progress: assessment.progress_percentage || 0,
      currentStep: assessment.currentStep || assessment.current_step || '1',
      totalSteps: assessment.totalSteps || assessment.total_steps || '5',
      stepDescription: assessment.stepDescription || assessment.step_description || 'In progress...',
      supervisor: assessment.supervisor_name || assessment.supervisor?.name || 'Unknown',
      wizardType: assessment.wizardType || assessment.wizard_type || 'General'
    };
  }, [getAssessmentByBreakdownId]);

  // Assessment error handling and retry functions
  const handleAssessmentDataError = useCallback((error) => {
    console.error('📊 Assessment data error:', error);
    // Could set additional error state here if needed
  }, []);

  const retryAssessmentConnection = useCallback(async () => {
    try {
      console.log('🔄 Retrying assessment connection...');
      await assessmentData.refresh.all();
    } catch (error) {
      console.error('❌ Failed to retry assessment connection:', error);
    }
  }, [assessmentData.refresh]);

  const manualRefreshAssessments = useCallback(async () => {
    try {
      console.log('🔄 Manual refresh of assessment data...');
      await Promise.all([
        assessmentData.refresh.assessments(),
        assessmentData.refresh.breakdowns(),
        assessmentData.refresh.statistics()
      ]);
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    }
  }, [assessmentData.refresh]);

  // Check if assessment data should show fallback
  const shouldShowAssessmentFallback = useCallback(() => {
    const hasErrors = assessmentData.errors?.api || assessmentData.errors?.websocket || assessmentData.errors?.general;
    const hasNoData = !assessmentData.hasData();
    const isDisconnected = !assessmentData.isConnected();
    
    return hasErrors && (hasNoData || isDisconnected);
  }, [assessmentData]);

  // Simplified breakdown fetching (assessment integration disabled)
  const fetchBreakdowns = async (isRefresh = false) => {
    try {
      // Only show loading spinner on initial load, not on refreshes
      if (!isRefresh) {
        setLoading(true);
      }
      
      // Fetch only regular breakdowns for now (auth automatic via apiClient)
      const data = await apiClient.get('/api/breakdowns/live');
      console.log('📊 SDC fetched breakdowns:', data);
      const breakdownsData = data.breakdowns || [];
        
        console.log('📊 SDC total breakdowns:', breakdownsData.length);
        
        if (Array.isArray(breakdownsData) && breakdownsData.length > 0) {
        // Enhance all breakdowns first
        const enhancedBreakdowns = await Promise.all(
          breakdownsData.map(b => enhanceBreakdownDataInline(b))
        );

        // Process merged breakdowns for SDC view
        const processedBreakdowns = enhancedBreakdowns.map(b => ({
          ...b, // Include all enhanced fields
          id: b.breakdown_id || b.id,
          breakdown_id: b.breakdown_id,
          daily_id: b.daily_id,
          fleet_number: b.fleet_no, // Use enhanced fleet_no
          fleet_no: b.fleet_no, // Keep original field name for map
          location: b.location, // Use enhanced location
          location_description: b.location_description, // Preserve location description
          depot_id: b.depot_id, // Use enhanced depot
          depot: b.depot, // Keep depot for map popup
          depot_display: b.depot_display || b.depot, // For display
          issue_category: b.issue_type, // Use enhanced issue type
          severity: b.severity || b.wizard_decision,
          status: b.status || 'active',
          created_at: b.created_at,

          // GPS COORDINATES - Critical for map rendering
          location_lat: b.location_lat,
          location_lng: b.location_lng,

          // Also check wizard assessment data for coordinates
          wizard_assessment_data: b.wizard_assessment_data,

          // SDC-specific fields
          isCritical: b.severity === 'STOP' || b.wizard_decision === 'STOP',
          isPending: !b.acknowledged_at,
          isDispatched: b.engineer_assigned || b.dispatched_at,
          isPriorityRoute: PRIORITY_ROUTES.some(route =>
            b.location?.includes(route)
          ),

          // Timeline for SDC stages
          timeline: {
            received: b.created_at,
            acknowledged: b.acknowledged_at || null,
            decision: b.decision_at || b.dispatched_at || null,
            engineering: b.engineer_assigned ? b.dispatched_at : null
          },

          // Supervisor info
          supervisor_name: b.supervisor_name,
          supervisor_badge: b.supervisor_badge,

          // Engineering assignment
          engineer_assigned: b.engineer_assigned,
          engineer_name: b.engineer_name,

          // Decision data
          decision: b.wizard_decision || b.severity,
          decision_notes: b.decision_notes || '',

          // Route info for map popup
          route_id: b.route_id,

          // Elapsed time for map popup
          elapsed: b.created_at ?
            Math.floor((new Date() - new Date(b.created_at)) / 1000 / 60) : 0,

          // Activities
          activities: b.activities || []
        }));
        
        setBreakdowns(processedBreakdowns);
        
        // Calculate statistics
        const activeBreakdowns = processedBreakdowns.filter(b => b.status !== 'resolved');
        const criticalCount = activeBreakdowns.filter(b => b.isCritical).length;
        const pendingCount = activeBreakdowns.filter(b => b.isPending).length;
        const dispatchedCount = activeBreakdowns.filter(b => b.isDispatched).length;
        
        setStats({
          total: activeBreakdowns.length,
          critical: criticalCount,
          pending: pendingCount,
          dispatched: dispatchedCount,
          inAssessment: assessmentsInProgress.length
        });
        
        // Generate priority alerts for critical situations
        const alerts = [];
        
        // Check for multiple critical breakdowns on priority routes
        const criticalPriorityBreakdowns = activeBreakdowns.filter(
          b => b.isCritical && b.isPriorityRoute
        );
        
        if (criticalPriorityBreakdowns.length >= 2) {
          alerts.push({
            id: 'critical-priority',
            type: 'critical',
            message: `${criticalPriorityBreakdowns.length} critical breakdowns on priority routes`,
            breakdowns: criticalPriorityBreakdowns
          });
        }
        
        // Check for unacknowledged critical breakdowns over 10 minutes old
        const unacknowledgedCritical = activeBreakdowns.filter(b => {
          if (!b.isCritical || b.timeline.acknowledged) return false;
          const age = (Date.now() - new Date(b.created_at)) / 60000;
          return age > 10;
        });
        
        if (unacknowledgedCritical.length > 0) {
          alerts.push({
            id: 'unack-critical',
            type: 'warning',
            message: `${unacknowledgedCritical.length} critical breakdown${unacknowledgedCritical.length > 1 ? 's' : ''} awaiting acknowledgement`,
            breakdowns: unacknowledgedCritical
          });
        }
        
        setPriorityAlerts(alerts);
        
        // Extract recent decisions for activity feed
        const decisions = processedBreakdowns
          .filter(b => b.decision && b.timeline.decision)
          .sort((a, b) => new Date(b.timeline.decision) - new Date(a.timeline.decision))
          .slice(0, 5)
          .map(b => ({
            id: b.breakdown_id,
            time: b.timeline.decision,
            fleet: b.fleet_number,
            decision: b.decision,
            notes: b.decision_notes,
            supervisor: b.supervisor_name
          }));
        
        setRecentDecisions(decisions);
        
        } else {
          // No backend data - set empty state (API succeeded but returned no breakdowns)
          console.log('📊 No active breakdowns found in database');
          setBreakdowns([]);
          setPriorityAlerts([]);
          setRecentDecisions([]);
          setStats({
            total: 0,
            critical: 0,
            pending: 0,
            dispatched: 0,
            inAssessment: assessmentsInProgress.length
          });
        }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      
      // 🎯 FALLBACK: Check localStorage when there's a network/server error
      console.log('📱 Network error, checking localStorage as fallback...');
      const localBreakdowns = [];
      for (let key in localStorage) {
        if (key.startsWith('breakdown_')) {
          try {
            const breakdownData = JSON.parse(localStorage.getItem(key));
            if (breakdownData && breakdownData.breakdown_id) {
              localBreakdowns.push(breakdownData);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse localStorage breakdown: ${key}`, error);
          }
        }
      }
      
      if (localBreakdowns.length > 0) {
        console.log(`📱 Using ${localBreakdowns.length} localStorage breakdown(s) due to network error`);
        const processedLocalBreakdowns = localBreakdowns.map(b => ({
          id: b.breakdown_id,
          breakdown_id: b.breakdown_id,
          
          // Enhanced fleet data
          fleet_number: b.fleet_no || b.fleet_number || b.fleetNumber || 'Unknown',
          fleet_no: b.fleet_no || b.fleet_number || b.fleetNumber || 'Unknown',
          fleetNumber: b.fleet_no || b.fleet_number || b.fleetNumber || 'Unknown',
          
          // Vehicle details
          vehicle_type: b.vehicle_type || b.vehicleType || b.vehicle?.vehicleType || null,
          vehicleType: b.vehicle_type || b.vehicleType || b.vehicle?.vehicleType || null,
          depot: b.depot || b.depot_id || b.vehicle?.depot || 'Unknown',
          depot_id: b.depot || b.depot_id || b.vehicle?.depot || 'Unknown',
          
          // Enhanced vehicle object
          vehicle: {
            fleetNumber: b.fleet_no || b.fleet_number || b.fleetNumber || 'Unknown',
            vehicleType: b.vehicle_type || b.vehicleType || b.vehicle?.vehicleType || null,
            depot: b.depot || b.depot_id || b.vehicle?.depot || 'Unknown',
            ...b.vehicle
          },
          
          location: b.location || 'Location not specified',
          issue_category: b.issue_type || b.wizard_type?.replace('Wizard', ''),
          severity: b.severity || 'CONTINUE',
          isCritical: b.severity === 'STOP',
          isPending: true,
          source: 'localStorage_offline',
          created_at: b.created_at || new Date().toISOString(),
          supervisor_name: b.supervisor_name || 'Unknown'
        }));
        
        setBreakdowns(processedLocalBreakdowns);
      } else {
        setBreakdowns([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and set up auto-refresh
  useEffect(() => {
    // Clear any corrupted data first
    clearCorruptedData();
    
    fetchBreakdowns();
    fetchActiveAssessments();
    
    // Auto-refresh based on connection status
    // If WebSocket is connected, refresh less frequently
    // If polling mode, the connection manager handles updates
    const getRefreshInterval = () => {
      if (connectionManager.isConnected) {
        return connectionManager.currentMode === 'websocket' ? 30000 : 0; // 30s for WebSocket, 0 for polling
      }
      return 10000; // 10s fallback when disconnected
    };
    
    let refreshTimeout;
    
    const scheduleNextRefresh = () => {
      const interval = getRefreshInterval();
      if (interval > 0) {
        refreshTimeout = setTimeout(() => {
          if (!loading) {
            fetchBreakdowns(true); // Pass true to indicate this is a refresh
            // fetchActiveAssessments(); // Disabled to fix infinite loop
          }
          scheduleNextRefresh();
        }, interval);
      }
    };
    
    scheduleNextRefresh();
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, []); // Remove dependencies that cause infinite loops

  // Memoized filtered breakdowns for performance
  const filteredBreakdowns = useMemo(() => {
    return breakdowns.filter(b => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'critical') return b.isCritical;
      if (activeFilter === 'pending') return b.isPending;
      if (activeFilter === 'in-assessment') {
        // Check if this breakdown has an active assessment
        return activeAssessments.some(a => 
          a.breakdown_id === b.breakdown_id || a.fleet_no === b.fleet_number
        );
      }
      if (activeFilter === 'my-breakdowns') {
        // Filter by current supervisor
        if (!currentSupervisor) return false;
        const supervisorBadge = currentSupervisor.badge || currentSupervisor.supervisorBadge;
        return b.supervisor_badge === supervisorBadge || 
               b.supervisor_name === currentSupervisor.name;
      }
      if (activeFilter === 'priority-routes') return b.isPriorityRoute;
      return true;
    });
  }, [breakdowns, activeFilter, activeAssessments, currentSupervisor]);

  // Memoized action handlers for performance
  const handleEmergencyBreakdown = useCallback(() => {
    window.location.href = '/breakdown-guide';
  }, []);

  const handleNewBreakdown = useCallback(() => {
    window.location.href = '/breakdown-guide';
  }, []);

  // Enhanced card handler for viewing standard procedure sections
  const handleViewGuide = useCallback((section, page) => {
    console.log(`📖 Opening standard procedure ${section}, Page ${page}`);
    // In a real implementation, this would open the standard procedure to the specific section
    // For now, we'll show an alert with the guide reference
    alert(`standard procedure Reference: ${section}, Page ${page}\n\nThis would open the digital operational safety procedures to the specified section.`);
  }, []);

  // Enhanced card handler for adding notes to breakdowns
  const handleAddNote = useCallback(async (breakdownId, note) => {
    if (!note.trim()) return;
    
    try {
      console.log(`📝 Adding note to breakdown ${breakdownId}:`, note);

      const result = await apiClient.post('/api/sdc/add-note', {
        breakdown_id: breakdownId,
        note: note.trim(),
        timestamp: new Date().toISOString(),
        supervisor_id: currentSupervisor?.id || 'unknown'
      });

      console.log(`✅ Note added successfully to breakdown ${breakdownId}`);
      
      // Optionally refresh data to show the new note
      await loadBreakdowns();
      
    } catch (error) {
      console.error(`❌ Failed to add note to breakdown ${breakdownId}:`, error);
      alert('Failed to add note. Please try again.');
    }
  }, [currentSupervisor]);

  const handleRequestEngineering = async (breakdownId) => {
    try {
      await apiClient.post('/api/sdc/request-engineering', {
        breakdown_id: breakdownId
      });

      fetchBreakdowns(); // Refresh data
    } catch (error) {
      console.error('Error requesting engineering:', error);
    }
  };

  // Handle contact button - show depot contacts modal
  const handleContact = useCallback((breakdown) => {
    console.log('📞 Opening contact modal for breakdown:', breakdown?.breakdown_id);
    setContactModal({
      isOpen: true,
      breakdown: breakdown
    });
  }, []);

  const handleAcknowledge = async (breakdownId) => {
    try {
      // Optimistic update
      const acknowledgeTime = new Date().toISOString();
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? {
              ...b,
              acknowledged_at: acknowledgeTime,
              isPending: false
            }
          : b
      ));

      // Update stats immediately
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1)
      }));

      // Call API in background
      await apiClient.post('/api/sdc/acknowledge', {
        breakdown_id: breakdownId,
        acknowledged_at: acknowledgeTime
      });

      console.log(`✅ Breakdown ${breakdownId} acknowledged`);
    } catch (error) {
      console.error('Error acknowledging breakdown:', error);

      // Revert optimistic update on error
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? { ...b, acknowledged_at: null, isPending: true }
          : b
      ));

      setStats(prev => ({
        ...prev,
        pending: prev.pending + 1
      }));

      alert('Failed to acknowledge breakdown. Please try again.');
    }
  };

  const handleMakeDecision = async (breakdownId, decision) => {
    try {
      // Optimistic update
      const decisionTime = new Date().toISOString();
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? {
              ...b,
              decision,
              decision_at: decisionTime,
              severity: decision,
              isCritical: decision === 'STOP'
            }
          : b
      ));

      // Update stats if decision changed critical status
      if (decision === 'STOP') {
        setStats(prev => ({
          ...prev,
          critical: prev.critical + 1
        }));
      }

      // Call API in background
      await apiClient.post('/api/sdc/decision', {
        breakdown_id: breakdownId,
        decision: decision,
        decision_at: decisionTime
      });

      console.log(`✅ Decision ${decision} made for breakdown ${breakdownId}`);
    } catch (error) {
      console.error('Error making decision:', error);

      // Revert optimistic update on error
      const oldBreakdown = breakdowns.find(b => b.breakdown_id === breakdownId);
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? { ...b, decision: oldBreakdown?.decision, decision_at: oldBreakdown?.decision_at, severity: oldBreakdown?.severity, isCritical: oldBreakdown?.isCritical }
          : b
      ));

      alert('Failed to make decision. Please try again.');
    }
  };

  // Handle breakdown resolution
  const handleResolveBreakdown = (breakdown) => {
    console.log('🔧 Opening resolution dialog for:', breakdown.breakdown_id);
    setResolutionDialog({
      isOpen: true,
      breakdown: breakdown
    });
  };

  // Confirm breakdown resolution
  const handleConfirmResolution = async (resolutionData) => {
    const breakdownId = resolutionData.breakdown_id;

    try {
      console.log('✅ Resolving breakdown:', breakdownId);

      // Optimistic UI update - mark as resolving immediately
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? { ...b, isResolving: true, status: 'resolving' }
          : b
      ));

      // Close dialog immediately for better UX
      setResolutionDialog({ isOpen: false, breakdown: null });

      // Call API in background
      const response = await apiClient.post('/api/breakdowns/resolve', resolutionData);

      if (response.success) {
        console.log('✅ Breakdown resolved successfully');

        // Remove from local state with fade-out effect
        setBreakdowns(prev => prev.map(b =>
          b.breakdown_id === breakdownId
            ? { ...b, isFadingOut: true }
            : b
        ));

        // Actually remove after animation (300ms)
        setTimeout(() => {
          setBreakdowns(prev => prev.filter(b => b.breakdown_id !== breakdownId));

          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            total: Math.max(0, prevStats.total - 1)
          }));
        }, 300);

        // Show success notification
        console.log(`🎉 Breakdown ${breakdownId} resolved successfully`);

        // No need to refresh - WebSocket will handle any new breakdowns
        // This eliminates the 10-second wait and full page refresh
      } else {
        throw new Error(response.error || 'Failed to resolve breakdown');
      }
    } catch (error) {
      console.error('❌ Error resolving breakdown:', error);

      // Revert optimistic update on error
      setBreakdowns(prev => prev.map(b =>
        b.breakdown_id === breakdownId
          ? { ...b, isResolving: false, status: 'active', isFadingOut: false }
          : b
      ));

      alert(`Failed to resolve breakdown: ${error.message || 'Unknown error'}`);
    }
  };

  // Enhanced edit assessment handler with integrated API
  const handleEditAssessment = async (breakdownId) => {
    try {
      console.log(`🔧 Initiating assessment edit for breakdown: ${breakdownId}`);
      
      // Get assessment details first
      const assessmentDetails = await assessmentData.getAssessmentDetails(breakdownId);
      
      if (!assessmentDetails.success) {
        throw new Error(assessmentDetails.error || 'Failed to retrieve assessment details');
      }
      
      // Prepare edit request
      const editRequest = {
        reason: 'sdc_dashboard_edit',
        type: 'modification',
        supervisor: currentSupervisor?.name || currentSupervisor?.badge || 'sdc_operator',
        return_url: `/dashboards/sdc?highlight=${breakdownId}`,
        breakdown_id: breakdownId,
        dashboard_state: {
          filter: activeFilter,
          highlighted_breakdown: breakdownId,
          timestamp: new Date().toISOString()
        },
        ip_address: 'dashboard', // Would be actual IP in production
        user_agent: navigator.userAgent
      };
      
      // Initiate edit session through API
      const editResult = await assessmentData.editAssessment(
        assessmentDetails.assessment.assessment_id,
        editRequest
      );
      
      if (editResult.success) {
        console.log('✅ Edit session initiated:', editResult.edit_session.id);
        
        // Log audit event through API
        await apiClient.post('/api/audit/log', {
          action: 'edit_assessment_initiated',
          breakdown_id: breakdownId,
          assessment_id: assessmentDetails.assessment.assessment_id,
          edit_session_id: editResult.edit_session.id,
          user_type: 'sdc_operator',
          supervisor: currentSupervisor?.name || currentSupervisor?.badge,
          timestamp: new Date().toISOString(),
          source: 'sdc_dashboard'
        });
        
        // Redirect to edit URL or fallback to breakdown guide
        const redirectUrl = editResult.edit_session.redirect_url || 
          `/breakdown-guide?edit=${breakdownId}&return=${encodeURIComponent(`/dashboards/sdc?highlight=${breakdownId}`)}`;
        
        window.location.href = redirectUrl;
      } else {
        throw new Error(editResult.error || 'Failed to initiate edit session');
      }
    } catch (error) {
      console.error('❌ Error initiating assessment edit:', error);
      
      // Fallback to legacy edit mode
      console.log('🔄 Falling back to legacy edit mode');
      const returnUrl = encodeURIComponent(`/dashboards/sdc?highlight=${breakdownId}`);
      window.location.href = `/breakdown-guide?edit=${breakdownId}&return=${returnUrl}`;
    }
  };

  // Handle report breakdown action
  const handleReportBreakdown = () => {
    window.open('/breakdown-guide', '_blank');
  };
  
  // Handle refresh action
  const handleRefresh = () => {
    fetchBreakdowns();
    fetchActiveAssessments();
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newState = alertSoundService.toggle();
    setSoundEnabled(newState);

    // Initialize audio context on first user interaction (required by browsers)
    alertSoundService.initializeAudio();

    // Request notification permission if enabling
    if (newState) {
      alertSoundService.requestNotificationPermission();
    }

    console.log(`🔊 Sound alerts ${newState ? 'enabled' : 'disabled'}`);
  };

  return (
    <DashboardLayout title="SDC Operations Centre" icon="🎯">
      <div className="sdc-dashboard">
      {/* Screen Flash Overlay for Critical Alerts */}
      {screenFlash && (
        <div className={`screen-flash-overlay flash-${screenFlash}`} />
      )}

      {/* LocalStorage Data Notification */}
      {breakdowns.some(b => b.source && b.source.includes('localStorage')) && (
        <div className="localStorage-notification">
          <div className="notification-content offline-mode">
            <div className="notification-header">
              <span className="notification-icon">📱</span>
              <h3>Offline Mode - Local Data</h3>
            </div>
            <div className="notification-message">
              {breakdowns.filter(b => b.source && b.source.includes('localStorage')).length} breakdown(s) 
              loaded from local storage. Data will sync automatically when connection is restored.
            </div>
          </div>
        </div>
      )}
      
      {/* Redirect Completion Notification */}
      {redirectNotification && (
        <div className="redirect-notification">
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">
                {redirectNotification.decision === 'STOP' ? '🛑' : 
                 redirectNotification.decision === 'AMBER' ? '⚠️' : '✅'}
              </span>
              <h3>Assessment Completed</h3>
              <button 
                className="close-notification"
                onClick={() => setRedirectNotification(null)}
              >
                ×
              </button>
            </div>
            <div className="notification-details">
              <div className="notification-item">
                <span className="label">Breakdown:</span>
                <span className="value">{redirectNotification.breakdownId}</span>
              </div>
              <div className="notification-item">
                <span className="label">Decision:</span>
                <span className={`value decision-${redirectNotification.decision.toLowerCase()}`}>
                  {redirectNotification.decision}
                </span>
              </div>
              <div className="notification-item">
                <span className="label">Supervisor:</span>
                <span className="value">{redirectNotification.supervisor}</span>
              </div>
              <div className="notification-item">
                <span className="label">Duration:</span>
                <span className="value">{redirectNotification.duration}</span>
              </div>
              <div className="notification-item">
                <span className="label">Completed:</span>
                <span className="value">
                  {redirectNotification.timestamp.toLocaleTimeString('en-GB')}
                </span>
              </div>
            </div>
            <div className="notification-actions">
              <span className="scroll-hint">
                📍 Breakdown highlighted below - auto-scrolling to location
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Engineering Response Timers */}
      {engineeringTimers.size > 0 && (
        <EngineeringTimerAlert engineeringTimers={engineeringTimers} />
      )}

      {/* Priority Alerts */}
      {priorityAlerts.length > 0 && (
        <PriorityAlerts alerts={priorityAlerts} />
      )}

      {/* Enhanced Assessment Progress Tracking */}
      {activeAssessments.length > 0 && (
        <div className="assessment-tracking-section">
          {/* Show detailed cards for first 2 assessments */}
          {activeAssessments.slice(0, 2).map(assessment => (
            <AssessmentProgressCard
              key={assessment.assessmentId || assessment.breakdown_id}
              breakdownId={assessment.breakdown_id}
              currentStep={`${assessment.currentStep}/${assessment.totalSteps}`}
              stepDescription={assessment.stepDescription}
              supervisor={assessment.supervisor_name}
              estimatedCompletion={assessment.estimatedCompletion}
              fleetNumber={assessment.fleet_no}
              route={assessment.route}
              location={assessment.location?.description || assessment.location}
              startTime={assessment.timestamp}
              wizardType={assessment.wizardType}
              priority={assessment.priority || 'normal'}
              onViewDetails={(id) => {
                // Open assessment in new tab
                window.open(`/breakdown-guide?continue=${id}`, '_blank');
              }}
              onCancel={(id) => {
                // Send cancellation request
                apiClient.post('/api/assessment/cancel', {
                  assessment_id: id
                }).catch(error => {
                  console.error('Error cancelling assessment:', error);
                });
              }}
            />
          ))}
          
          {/* Show tracker for additional assessments */}
          {activeAssessments.length > 2 && (
            <AssessmentProgressTracker assessments={activeAssessments.slice(2)} />
          )}
        </div>
      )}


      {/* Enhanced Filter Bar with Assessment Details */}
      <EnhancedFilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Supervisor Coverage Bar - Shows shift coverage status with stats */}
      <div className="sdc-coverage-bar-wrapper">
        <SupervisorCoverageBar refreshInterval={60000} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Breakdown List - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="breakdown-list">
            {loading ? (
              <div className="text-center py-8">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading real SDC data...</span>
                </div>
                <p className="mt-2">Fetching live breakdowns...</p>
              </div>
            ) : filteredBreakdowns.length === 0 ? (
              <div className="no-breakdowns">
                <p>No breakdowns matching filter</p>
                <small>Real-time data from assessments</small>
              </div>
            ) : (
              filteredBreakdowns.map(breakdown => {
                const isHighlighted = highlightedBreakdown === breakdown.breakdown_id;
                const hasActiveAssessment = activeAssessments.some(a => 
                  a.breakdown_id === breakdown.breakdown_id || a.fleet_no === breakdown.fleet_number
                );
                const recentlyCompleted = completedAssessments.some(c => 
                  c.id === breakdown.breakdown_id && 
                  (Date.now() - new Date(c.completedAt)) < 10000 // Within last 10 seconds
                );
                const engineeringTimer = engineeringTimers.get(breakdown.breakdown_id);
                
                return (
                  <div
                    key={breakdown.breakdown_id}
                    ref={(el) => setBreakdownRef(breakdown.breakdown_id, el)}
                    className={`breakdown-card-container ${
                      breakdown.isFadingOut ? 'fading-out' : ''
                    } ${breakdown.isResolving ? 'resolving' : ''}`}
                  >
                    <SDCBreakdownCardEnhanced
                      breakdown={{
                        ...breakdown,
                        hasActiveAssessment,
                        inAssessment: hasActiveAssessment,
                        // Add elapsed time calculation
                        elapsed: breakdown.created_at ? 
                          Math.floor((new Date() - new Date(breakdown.created_at)) / 1000 / 60) : 0,
                        // Add SLA information based on issue type
                        sla: getSLAForIssue(breakdown.issue_type || breakdown.wizard_type, breakdown.isPriorityRoute),
                        // Add SDC guidance
                        sdcGuidance: getSDCGuidance(breakdown.issue_type || breakdown.wizard_type)
                      }}
                      isHighlighted={isHighlighted}
                      recentlyCompleted={recentlyCompleted}
                      engineeringTimer={engineeringTimer ? {
                        ...engineeringTimer,
                        remaining: Math.max(0, engineeringTimer.targetTime - (Date.now() - engineeringTimer.startTime))
                      } : null}
                      onAcknowledge={() => handleAcknowledge(breakdown.breakdown_id)}
                      onMakeDecision={(decision) => handleMakeDecision(breakdown.breakdown_id, decision)}
                      onRequestEngineering={() => handleRequestEngineering(breakdown.breakdown_id)}
                      onEditAssessment={() => handleEditAssessment(breakdown.breakdown_id)}
                      onResolve={() => handleResolveBreakdown(breakdown)}
                      onViewGuide={handleViewGuide}
                      onAddNote={handleAddNote}
                      onContact={handleContact}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right sidebar - Depot Status Grid */}
        <div className="right-sidebar">
          <DepotStatusGrid
            breakdowns={filteredBreakdowns}
            onDepotClick={(depotId) => {
              // Navigate to Engineering display filtered by depot
              window.open(`/dashboards/engineering?depot=${encodeURIComponent(depotId)}`, '_blank');
            }}
          />
        </div>
      </div>

      {/* Full-Screen Map Overlay */}
      {fullScreenMap && (
        <div className="fullscreen-map-overlay">
          <div className="fullscreen-map-header">
            <div className="fullscreen-map-title">
              <span className="title-icon">🗺️</span>
              <h2>Live Breakdown Locations</h2>
              <span className="breakdown-count">
                {filteredBreakdowns.length} active breakdown{filteredBreakdowns.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="fullscreen-map-info">
              <span className="live-dot"></span>
              <span className="info-text">Auto-refreshing every 30 seconds</span>
              <span className="current-time">
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              className="close-fullscreen-btn"
              onClick={() => setFullScreenMap(false)}
              title="Close full-screen map"
            >
              ✕ Close
            </button>
          </div>
          <div className="fullscreen-map-container">
            <div className="fullscreen-map-content">
              <BreakdownMap
                breakdowns={filteredBreakdowns}
                highlightedId={highlightedBreakdown}
                onMarkerClick={(breakdownId) => {
                  setHighlightedBreakdown(breakdownId);
                  // Expand the sidebar card for this breakdown
                  setExpandedCard(breakdownId);
                  // Clear highlight after 10 seconds
                  setTimeout(() => setHighlightedBreakdown(null), 10000);
                }}
              />
            </div>
            <div className="fullscreen-map-sidebar">
              <div className="sidebar-header">
                <h3>Active Breakdowns</h3>
                <button
                  className="toggle-sidebar-btn"
                  onClick={(e) => {
                    e.currentTarget.closest('.fullscreen-map-sidebar').classList.toggle('collapsed');
                  }}
                >
                  ◀
                </button>
              </div>
              <div className="sidebar-breakdown-list">
                {filteredBreakdowns.map(breakdown => (
                  <div
                    key={breakdown.breakdown_id}
                    className={`sidebar-breakdown-card ${
                      highlightedBreakdown === breakdown.breakdown_id ? 'highlighted' : ''
                    } ${expandedCard === breakdown.breakdown_id ? 'expanded' : ''}`}
                    onClick={() => {
                      setHighlightedBreakdown(breakdown.breakdown_id);
                      setExpandedCard(expandedCard === breakdown.breakdown_id ? null : breakdown.breakdown_id);
                    }}
                  >
                    <div className="card-header-mini">
                      <span className={`severity-badge severity-${(breakdown.wizard_decision || breakdown.severity || 'continue').toLowerCase()}`}>
                        {breakdown.wizard_decision || breakdown.severity || 'PENDING'}
                      </span>
                      <span className="fleet-number">Fleet {breakdown.fleet_no}</span>
                      <span className="elapsed-time">
                        {breakdown.elapsed || Math.floor((new Date() - new Date(breakdown.created_at)) / 1000 / 60)} min
                      </span>
                    </div>
                    <div className="card-location">
                      📍 {breakdown.location_description || breakdown.location || 'Location TBC'}
                    </div>
                    {expandedCard === breakdown.breakdown_id && (
                      <div className="card-details-mini">
                        <div className="detail-row">
                          <span className="label">Route:</span>
                          <span className="value">{breakdown.route_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Depot:</span>
                          <span className="value">{breakdown.depot || 'Unknown'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Issue:</span>
                          <span className="value">{breakdown.issue_category || 'Not specified'}</span>
                        </div>
                        <button
                          className="view-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullScreenMap(false);
                            const cardElement = breakdownRefs.current.get(breakdown.breakdown_id);
                            if (cardElement) {
                              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                        >
                          View Full Details
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="dashboard-footer">
        <span className="live-indicator">
          <span className="pulse"></span>
          SDC Live Data - Real breakdowns from assessments
        </span>
        <div className="footer-controls">
          <button
            className={`sound-toggle-btn ${soundEnabled ? 'enabled' : 'disabled'}`}
            onClick={handleSoundToggle}
            title={soundEnabled ? 'Click to disable sound alerts' : 'Click to enable sound alerts'}
          >
            {soundEnabled ? '🔊' : '🔇'}
            <span className="sound-toggle-label">
              {soundEnabled ? 'Sound ON' : 'Sound OFF'}
            </span>
          </button>
          <span className="last-update">
            {filteredBreakdowns.length} breakdown{filteredBreakdowns.length !== 1 ? 's' : ''} displayed
          </span>
        </div>
      </div>

      {/* Breakdown Resolution Dialog */}
      <BreakdownResolutionDialog
        breakdown={resolutionDialog.breakdown}
        isOpen={resolutionDialog.isOpen}
        onClose={() => setResolutionDialog({ isOpen: false, breakdown: null })}
        onConfirm={handleConfirmResolution}
        currentSupervisor={currentSupervisor}
      />

      {/* Depot Contact Modal */}
      <DepotContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, breakdown: null })}
        breakdown={contactModal.breakdown}
      />

      <style>{`
        .breakdown-list {
          min-height: 400px;
        }

        .breakdown-card-container {
          margin-bottom: 16px;
          scroll-margin-top: 120px; /* Offset for header during auto-scroll */
          transition: opacity 0.3s ease-out, transform 0.3s ease-out, max-height 0.3s ease-out;
        }

        /* Fade-out animation when resolving */
        .breakdown-card-container.fading-out {
          opacity: 0;
          transform: translateX(20px) scale(0.95);
          max-height: 0;
          margin-bottom: 0;
          overflow: hidden;
        }

        /* Resolving state overlay */
        .breakdown-card-container.resolving {
          position: relative;
        }

        .breakdown-card-container.resolving::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(16, 185, 129, 0.1);
          backdrop-filter: blur(2px);
          border-radius: 12px;
          pointer-events: none;
          animation: pulse-success 2s ease-in-out infinite;
        }

        @keyframes pulse-success {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .no-breakdowns {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        /* Redirect Notification Styles */
        .redirect-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.95) 0%, 
            rgba(37, 99, 235, 0.95) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(20px);
          max-width: 420px;
          min-width: 350px;
          animation: slideInFromRight 0.5s ease-out;
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .notification-content {
          padding: 20px;
          color: white;
        }

        .notification-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .notification-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .notification-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          flex: 1;
          color: white;
        }

        .close-notification {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .close-notification:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .notification-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .notification-item .label {
          font-weight: 500;
          opacity: 0.9;
          min-width: 80px;
        }

        .notification-item .value {
          font-weight: 600;
          text-align: right;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .decision-stop {
          color: #fee2e2;
          background: rgba(220, 38, 38, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .decision-amber {
          color: #fef3c7;
          background: rgba(245, 158, 11, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .decision-continue {
          color: #dcfce7;
          background: rgba(16, 185, 129, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .notification-actions {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* LocalStorage Notification Styles */
        .localStorage-notification {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 999;
          background: linear-gradient(135deg, 
            rgba(245, 158, 11, 0.95), 
            rgba(217, 119, 6, 0.95)
          );
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
          max-width: 350px;
          min-width: 300px;
          animation: slideInFromRight 0.5s ease-out;
          backdrop-filter: blur(10px);
        }

        .localStorage-notification .notification-content.offline-mode {
          padding: 16px;
          color: white;
        }

        .localStorage-notification .notification-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .localStorage-notification .notification-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .localStorage-notification .notification-message {
          font-size: 12px;
          line-height: 1.4;
          opacity: 0.95;
          color: white;
        }

        .scroll-hint {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          font-style: italic;
        }

        .no-breakdowns p {
          font-size: 18px;
          color: #aaa;
          margin-bottom: 8px;
        }

        .no-breakdowns small {
          color: #888;
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4ade80;
          font-size: 14px;
        }

        .pulse {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }

        .footer-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sound-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sound-toggle-btn.enabled {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .sound-toggle-btn.enabled:hover {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .sound-toggle-btn.disabled {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: rgba(255, 255, 255, 0.9);
        }

        .sound-toggle-btn.disabled:hover {
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          transform: scale(1.02);
        }

        .sound-toggle-label {
          font-size: 12px;
        }

        .last-update {
          color: #888;
          font-size: 12px;
        }

        /* Screen Flash Overlay for Critical Alerts */
        .screen-flash-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9999;
          animation: screenFlash 1.5s ease-out forwards;
        }

        .screen-flash-overlay.flash-stop {
          background: radial-gradient(ellipse at center,
            rgba(220, 38, 38, 0.4) 0%,
            rgba(220, 38, 38, 0.2) 50%,
            rgba(220, 38, 38, 0) 100%
          );
          animation-duration: 1.5s;
        }

        .screen-flash-overlay.flash-amber {
          background: radial-gradient(ellipse at center,
            rgba(245, 158, 11, 0.3) 0%,
            rgba(245, 158, 11, 0.15) 50%,
            rgba(245, 158, 11, 0) 100%
          );
          animation-duration: 1s;
        }

        @keyframes screenFlash {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          30% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.9;
          }
          70% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .redirect-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            min-width: auto;
          }

          .notification-content {
            padding: 16px;
          }

          .notification-header h3 {
            font-size: 14px;
          }

          .notification-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .notification-item .value {
            text-align: left;
          }

          .breakdown-card-container {
            scroll-margin-top: 80px;
          }
        }

        /* Breakdown Map Widget Styles */
        .breakdown-map-widget {
          background:
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.02) 0%, transparent 50%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 0;
          box-shadow:
            0 10px 40px rgba(0,0,0,0.06),
            0 2px 10px rgba(0,0,0,0.04),
            inset 0 2px 0 rgba(255,255,255,0.7);
          overflow: hidden;
          height: calc(100vh - 180px);
          display: flex;
          flex-direction: column;
        }

        .map-header {
          font-size: 18px;
          color: #0f172a;
          margin: 0;
          padding: 24px 28px 20px 28px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, rgba(248,250,252,0.5) 0%, rgba(241,245,249,0.5) 100%);
          border-bottom: 1px solid rgba(226,232,240,0.3);
        }

        .breakdown-map-widget > div:last-child {
          flex: 1;
          min-height: 0;
          padding: 20px;
        }

        @media (max-width: 1200px) {
          .breakdown-map-widget {
            height: 500px;
          }
        }

        @media (max-width: 768px) {
          .breakdown-map-widget {
            height: 400px;
          }
        }

        /* Full-Screen Map Button */
        .map-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px 20px 28px;
          background: linear-gradient(135deg, rgba(248,250,252,0.5) 0%, rgba(241,245,249,0.5) 100%);
          border-bottom: 1px solid rgba(226,232,240,0.3);
        }

        .map-header-row .map-header {
          padding: 0;
          background: none;
          border: none;
        }

        .fullscreen-map-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fullscreen-map-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        /* Full-Screen Map Overlay */
        .fullscreen-map-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9998;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fullscreen-map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .fullscreen-map-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .fullscreen-map-title .title-icon {
          font-size: 28px;
        }

        .fullscreen-map-title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }

        .fullscreen-map-title .breakdown-count {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .fullscreen-map-info {
          display: flex;
          align-items: center;
          gap: 16px;
          color: rgba(248, 250, 252, 0.7);
          font-size: 14px;
        }

        .fullscreen-map-info .live-dot {
          width: 10px;
          height: 10px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .fullscreen-map-info .current-time {
          font-weight: 700;
          color: #f8fafc;
          font-size: 18px;
          font-family: 'Monaco', monospace;
        }

        .close-fullscreen-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-fullscreen-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          color: white;
          border-color: rgba(239, 68, 68, 0.5);
        }

        .fullscreen-map-container {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .fullscreen-map-content {
          flex: 1;
          position: relative;
          min-width: 0;
        }

        .fullscreen-map-content .breakdown-map-container {
          height: 100% !important;
          border-radius: 0 !important;
        }

        /* Sidebar */
        .fullscreen-map-sidebar {
          width: 380px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .fullscreen-map-sidebar.collapsed {
          width: 50px;
        }

        .fullscreen-map-sidebar.collapsed .sidebar-breakdown-list,
        .fullscreen-map-sidebar.collapsed .sidebar-header h3 {
          display: none;
        }

        .fullscreen-map-sidebar.collapsed .toggle-sidebar-btn {
          transform: rotate(180deg);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #f8fafc;
        }

        .toggle-sidebar-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .sidebar-breakdown-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .sidebar-breakdown-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-breakdown-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .sidebar-breakdown-card.highlighted {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }

        .sidebar-breakdown-card.expanded {
          border-color: #22c55e;
        }

        .card-header-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .severity-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .severity-badge.severity-stop {
          background: rgba(220, 38, 38, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .severity-badge.severity-amber {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .severity-badge.severity-continue {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .severity-badge.severity-pending {
          background: rgba(100, 116, 139, 0.2);
          color: #94a3b8;
          border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .card-header-mini .fleet-number {
          font-weight: 700;
          color: #f8fafc;
          font-size: 15px;
        }

        .card-header-mini .elapsed-time {
          margin-left: auto;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .card-location {
          font-size: 13px;
          color: #cbd5e1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-details-mini {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-details-mini .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .card-details-mini .label {
          color: #64748b;
        }

        .card-details-mini .value {
          color: #e2e8f0;
          font-weight: 600;
        }

        .view-details-btn {
          width: 100%;
          margin-top: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-details-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        @media (max-width: 768px) {
          .fullscreen-map-sidebar {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 85%;
            max-width: 380px;
            transform: translateX(100%);
            z-index: 10;
          }

          .fullscreen-map-sidebar:not(.collapsed) {
            transform: translateX(0);
          }

          .fullscreen-map-container {
            position: relative;
          }

          .toggle-sidebar-btn {
            position: fixed;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 12px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .fullscreen-map-header {
            flex-wrap: wrap;
            gap: 12px;
            padding: 12px 16px;
          }

          .fullscreen-map-title h2 {
            font-size: 18px;
          }

          .fullscreen-map-info {
            order: 1;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      </div>
    </DashboardLayout>
  );
};

export default SDCDashboard;
