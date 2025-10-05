/**
 * Go North East - Breakdown Assessment Guide
 * Main Application Component
 * 
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 * 
 * This software and associated documentation files (the "Software") are the
 * exclusive property of Anthony Gair. No part of this Software may be used,
 * copied, modified, merged, published, distributed, sublicensed, or sold
 * without the express written permission of Anthony Gair.
 * 
 * Author: Anthony Gair
 * Created: 2025
 * 
 * For licensing enquiries, contact: anthony@gobarry.co.uk
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import styles
import './styles/main.css';
import './styles/tailwind.css';
import './styles/fullwidth-override.css';  // Full width enhancements
import './styles/RouteSelection.css';  // Route selection and new component styles

// Import shared components
import AppHeader from '../shared/AppHeader.jsx';

// Import supervisorBreakdownLogger and authentication
import { supervisorBreakdownLogger } from './supervisorBreakdownLogger.js';
import enhancedAuthService from '../services/enhanced-auth-service.js';
import SupabaseLogin from './components/SupabaseLogin.jsx';
import assessmentBroadcaster from '../services/assessmentBroadcaster.js';

// Import components
import FleetSelectionModal from './components/FleetSelectionModal.jsx';
import LocationModal from './components/LocationModal.jsx';
import BreakdownInfoStep from './components/common/BreakdownInfoStep.jsx';
import LocationDisplay from './components/common/LocationDisplay.jsx';
import AssessmentSummary from './components/common/AssessmentSummary.jsx';

// Import all wizards
import SteeringWizard from './components/wizards/SteeringWizard.jsx';
import BrakesWizard from './components/wizards/BrakesWizard.jsx';
import ABSLightWizard from './components/wizards/ABSLightWizard.jsx';
import BatteryWizard from './components/wizards/BatteryWizard.jsx';
import BrokenWindowsWizard from './components/wizards/BrokenWindowsWizard.jsx';
import BuzzersWizard from './components/wizards/BuzzersWizard.jsx';
import CoolingSystemWizard from './components/wizards/CoolingSystemWizard.jsx';
import CuttingOutFuelWizard from './components/wizards/CuttingOutFuelWizard.jsx';
import DemistersHeatersWizard from './components/wizards/DemistersHeatersWizard.jsx';
import DoorsWizard from './components/wizards/DoorsWizard.jsx';
import ExcessiveSmokeWizard from './components/wizards/ExcessiveSmokeWizard.jsx';
import ExteriorLightsWizard from './components/wizards/ExteriorLightsWizard.jsx';
import GearSelectionWizard from './components/wizards/GearSelectionWizard.jsx';
import GearboxWizard from './components/wizards/GearboxWizard.jsx';
import InteriorExteriorDamageWizard from './components/wizards/InteriorExteriorDamageWizard.jsx';
import InteriorLightsWizard from './components/wizards/InteriorLightsWizard.jsx';
import LooseWheelNutsWizard from './components/wizards/LooseWheelNutsWizard.jsx';
import LowWaterWizard from './components/wizards/LowWaterWizard.jsx';
import NonStarterWizard from './components/wizards/NonStarterWizard.jsx';
import OilWarningLightWizard from './components/wizards/OilWarningLightWizard.jsx';
import PunctureWizard from './components/wizards/PunctureWizard.jsx';
import RepeatDefectsWizard from './components/wizards/RepeatDefectsWizard.jsx';
import RoadTrafficIncidentsWizardWrapper from './components/wizards/RoadTrafficIncidentsWizardWrapper.jsx';
import SpeedoWizard from './components/wizards/SpeedoWizard.jsx';
import SuspensionWizard from './components/wizards/SuspensionWizard.jsx';
import WarningLightsWizard from './components/wizards/WarningLightsWizard.jsx';
import WheelchairRampWizard from './components/wizards/WheelchairRampWizard.jsx';
import WingMirrorsWizard from './components/wizards/WingMirrorsWizard.jsx';
import WipersScreenwashWizard from './components/wizards/WipersScreenwashWizard.jsx';
import DestinationDisplayWizard from './components/wizards/DestinationDisplayWizard.jsx';
import Step3InitialAssessment from './components/Step3InitialAssessment.jsx';
import Step5IssueDetails from './components/Step5IssueDetails.jsx';
import Step7Submit from './components/Step7Submit.jsx';

// Import diagnostic flows (from src/data)
import { wizards } from '@data/diagnostic-flows-complete.js';

// Map wizard types to components
const wizardComponents = {
    'steering': SteeringWizard,
    'brakes': BrakesWizard,
    'abs-light': ABSLightWizard,
    'battery': BatteryWizard,
    'battery-light': BatteryWizard,  // Alternative key from diagnostic flows
    'broken-windows': BrokenWindowsWizard,
    'buzzers': BuzzersWizard,
    'cooling-system': CoolingSystemWizard,
    'overheating': CoolingSystemWizard,  // Alternative key from diagnostic flows
    'cutting-out-fuel': CuttingOutFuelWizard,
    'demisters-heaters': DemistersHeatersWizard,
    'doors': DoorsWizard,
    'excessive-smoke': ExcessiveSmokeWizard,
    'exterior-lights': ExteriorLightsWizard,
    'gear-selection': GearSelectionWizard,
    'gearbox': GearboxWizard,
    'gearbox-temperature': GearboxWizard,  // Alternative key from diagnostic flows
    'interior-exterior-damage': InteriorExteriorDamageWizard,
    'interior-lights': InteriorLightsWizard,
    'loose-wheel-nuts': LooseWheelNutsWizard,
    'low-water': LowWaterWizard,
    'non-starter': NonStarterWizard,
    'oil-warning': OilWarningLightWizard,  // Matches key in diagnostic-flows-complete.js
    'puncture': PunctureWizard,
    'repeat-defects': RepeatDefectsWizard,
    'road-traffic-incidents': RoadTrafficIncidentsWizardWrapper,
    'speedo': SpeedoWizard,
    'suspension': SuspensionWizard,
    'warning-lights': WarningLightsWizard,
    'ramp': WheelchairRampWizard,  // Matches key in diagnostic-flows-complete.js
    'wheelchair-ramp': WheelchairRampWizard,  // Keep for backward compatibility
    'wing-mirrors': WingMirrorsWizard,
    'wipers-screenwash': WipersScreenwashWizard,
    'destination-display': DestinationDisplayWizard,
    'initial-assessment': Step3InitialAssessment,
    'step3-initial-assessment': Step3InitialAssessment,
    'issue-details': Step5IssueDetails,
    'step5-issue-details': Step5IssueDetails,
    'submit': Step7Submit,
    'step7-submit': Step7Submit,
    'final-submission': Step7Submit
};

const App = () => {
    const navigate = useNavigate();
    
    // Get authentication state from parent app via session storage/context
    const [supervisorSession, setSupervisorSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    // Assessment state
    const [currentWizard, setCurrentWizard] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [responses, setResponses] = useState({});
    const [assessmentId, setAssessmentId] = useState(null);
    const [assessmentStartTime, setAssessmentStartTime] = useState(null);
    
    // Fleet selection state
    const [showFleetModal, setShowFleetModal] = useState(false);
    const [pendingWizardType, setPendingWizardType] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [breakdownInfo, setBreakdownInfo] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [assessmentDecision, setAssessmentDecision] = useState(null);
    const [assessmentNotes, setAssessmentNotes] = useState('');
    const [breakdownLocation, setBreakdownLocation] = useState(null);

    // Route information state
    const [selectedRoute, setSelectedRoute] = useState('');
    const [routeName, setRouteName] = useState('');
    
    // Check for authentication using enhanced auth service
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { success, session } = await enhancedAuthService.getCurrentSession();
                if (success && session) {
                    setSupervisorSession(session);
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();

        // Listen for session changes
        const removeListener = enhancedAuthService.addSessionListener((session) => {
            setSupervisorSession(session);
        });

        return removeListener;
    }, []);
    
    // Initialize supervisor logger when authenticated
    useEffect(() => {
        if (supervisorSession) {
            supervisorBreakdownLogger.init({
                supervisorData: supervisorSession
            });
        }
    }, [supervisorSession]);

    // Track summary state changes
    useEffect(() => {
        console.log('🔍 Summary state changed:', { showSummary, assessmentDecision, assessmentNotes });
    }, [showSummary, assessmentDecision, assessmentNotes]);
    
    // Start assessment flow
    const startAssessment = (wizardType) => {
        setPendingWizardType(wizardType);
        setShowFleetModal(true);
    };
    
    // Handle fleet selection
    const handleFleetSelection = async (vehicleWithLocation) => {
        // Extract location and route from the vehicle object if present
        const vehicle = { ...vehicleWithLocation };
        const location = vehicle.location || null;
        const route = vehicle.route || '';
        const routeDisplayName = vehicle.routeName || route;

        // Clean vehicle object - remove location and route data
        delete vehicle.location;
        delete vehicle.route;
        delete vehicle.routeName;

        console.log('🚗 handleFleetSelection - vehicle:', vehicle);
        console.log('🚗 Fleet number from selection:', vehicle.fleetNumber);
        console.log('🚗 Depot from selection:', vehicle.depot);
        console.log('🚗 Vehicle type from selection:', vehicle.vehicleType);
        console.log('🚗 Location:', location);
        console.log('🚗 Route:', route);

        // Update state with vehicle, location, and route data
        setSelectedVehicle(vehicle);
        setBreakdownLocation(location);
        setSelectedRoute(route);
        setRouteName(routeDisplayName);
        setShowFleetModal(false);
        
        if (pendingWizardType) {
            // Start the breakdown with location and route data
            const breakdownId = await supervisorBreakdownLogger.startBreakdown({
                vehicle,
                issueCategory: pendingWizardType,
                driverName: '',
                driverPhone: '',
                location: location,
                route: route,
                routeName: routeDisplayName
            });
            
            // Get wizard config for total steps
            const wizardConfig = wizards[pendingWizardType];
            const totalSteps = wizardConfig?.steps || 5;
            
            // Initialize assessment broadcaster for real-time tracking
            assessmentBroadcaster.initAssessment({
                assessmentId: breakdownId,
                breakdownId: breakdownId,
                wizardType: pendingWizardType,
                totalSteps: totalSteps,
                supervisor: supervisorSession,
                vehicle: vehicle,
                location: location,
                route: route
            });
            
            setAssessmentId(breakdownId);
            setCurrentWizard(pendingWizardType);
            setCurrentStep(1);
            setAssessmentStartTime(new Date().toISOString());
        }
    };
    
    // Render wizard component
    const renderWizard = () => {
        
        // Show summary if assessment is complete
        console.log('🔍 Render check - showSummary:', showSummary, 'assessmentDecision:', assessmentDecision);
        if (showSummary && assessmentDecision) {
            return (
                <>
                    <AppHeader />
                    <div className="min-h-screen bg-gray-900">
                    <div className="main-content">
                        <AssessmentSummary
                            assessmentData={{
                                breakdownId: assessmentId,
                                responses: responses,
                                notes: assessmentNotes,
                                location: supervisorBreakdownLogger.getCurrentBreakdown()?.location,
                                route: selectedRoute,
                                routeName: routeName
                            }}
                            vehicle={selectedVehicle}
                            supervisor={supervisorSession}
                            decision={assessmentDecision}
                            wizardType={wizards[currentWizard]?.title || currentWizard}
                            routeInfo={{
                                route: selectedRoute,
                                routeName: routeName
                            }}
                            onPrint={() => {
                                console.log('🖨️ Print button clicked');
                                window.print();
                            }}
                            onEmail={() => {
                                console.log('📧 Email button clicked');
                                const summary = document.querySelector('.assessment-summary');
                                if (summary) {
                                    const emailBody = encodeURIComponent(summary.innerText);
                                    window.location.href = `mailto:?subject=Breakdown Assessment Summary&body=${emailBody}`;
                                }
                            }}
                            onComplete={async () => {
                                try {
                                    console.log('🔥 AssessmentSummary onComplete called - Starting completion process...');
                                    console.log('🔍 Current state:', {
                                        assessmentId,
                                        selectedVehicle,
                                        assessmentDecision,
                                        breakdownLocation,
                                        selectedRoute,
                                        routeName
                                    });

                                    if (!assessmentDecision) {
                                        console.error('❌ No assessment decision found!');
                                        alert('Error: No assessment decision found. Please try again.');
                                        return;
                                    }

                                    if (!selectedVehicle || !selectedVehicle.fleetNumber) {
                                        console.error('❌ No vehicle selected or missing fleet number!');
                                        console.log('🔍 Current selectedVehicle state:', selectedVehicle);
                                        alert('Error: No vehicle selected. Please restart the assessment and select a vehicle.');
                                        return;
                                    }

                                    // 🎯 COMPREHENSIVE DATA CAPTURE - Capture ALL breakdown data before backend submission
                                    const timestamp = Date.now();
                                    const breakdownId = assessmentId || `BD-${timestamp}`;
                                
                                const comprehensiveBreakdownData = {
                                    // Core breakdown identification
                                    breakdown_id: breakdownId,
                                    fleet_no: selectedVehicle?.fleetNumber || selectedVehicle?.fleet_number || 'Unknown',
                                    fleet_number: selectedVehicle?.fleetNumber || selectedVehicle?.fleet_number || 'Unknown',
                                    fleetNumber: selectedVehicle?.fleetNumber || selectedVehicle?.fleet_number || 'Unknown',
                                    issue_type: (wizards[currentWizard]?.title || currentWizard).replace('Wizard', '').trim(),
                                    severity: assessmentDecision || 'CONTINUE',
                                    
                                    // Vehicle details - ensure all data is captured
                                    vehicle_type: selectedVehicle?.vehicleType || selectedVehicle?.type || null,
                                    vehicleType: selectedVehicle?.vehicleType || selectedVehicle?.type || null,
                                    depot: selectedVehicle?.depot || 'Unknown',
                                    depot_id: selectedVehicle?.depot || 'Unknown',
                                    registration: selectedVehicle?.regNo || selectedVehicle?.registration || '',
                                    regNo: selectedVehicle?.regNo || selectedVehicle?.registration || '',
                                    
                                    // Location data (multiple sources for reliability)
                                    location: breakdownLocation?.description || 
                                             breakdownLocation?.address || 
                                             breakdownLocation?.coordinates ||
                                             `${breakdownLocation?.lat}, ${breakdownLocation?.lng}` ||
                                             'Location to be added later',
                                    coordinates: breakdownLocation?.lat && breakdownLocation?.lng ? 
                                                `${breakdownLocation.lat}, ${breakdownLocation.lng}` : null, // GPS coords if available
                                    location_coords: breakdownLocation?.coords || 
                                                   (breakdownLocation?.lat && breakdownLocation?.lng ? 
                                                    { lat: breakdownLocation.lat, lng: breakdownLocation.lng } : null),
                                    
                                    // Route information
                                    route_id: selectedRoute || '',
                                    route_name: routeName || '',
                                    
                                    // Supervisor information
                                    supervisor_name: supervisorSession?.name || 'Unknown Supervisor',
                                    supervisor_badge: supervisorSession?.supervisorId || supervisorSession?.badge || 'Unknown',
                                    supervisor_email: supervisorSession?.email || '',
                                    depot: supervisorSession?.depot || 'SDC',
                                    
                                    // Assessment data
                                    wizard_type: wizards[currentWizard]?.title || currentWizard,
                                    assessment_notes: assessmentNotes || '',
                                    wizard_responses: responses || {},
                                    assessment_steps: Object.entries(responses || {}).map(([key, value]) => ({
                                        question: key,
                                        answer: value
                                    })),
                                    
                                    // Timing information
                                    created_at: new Date().toISOString(),
                                    assessment_start: assessmentStartTime || new Date().toISOString(),
                                    assessment_complete: new Date().toISOString(),
                                    
                                    // Additional context - complete vehicle object
                                    vehicle_details: selectedVehicle || {},
                                    vehicle: {
                                        fleetNumber: selectedVehicle?.fleetNumber || selectedVehicle?.fleet_number || 'Unknown',
                                        fleet_number: selectedVehicle?.fleetNumber || selectedVehicle?.fleet_number || 'Unknown',
                                        depot: selectedVehicle?.depot || 'Unknown',
                                        vehicleType: selectedVehicle?.vehicleType || selectedVehicle?.type || null,
                                        type: selectedVehicle?.vehicleType || selectedVehicle?.type || null,
                                        registration: selectedVehicle?.regNo || selectedVehicle?.registration || '',
                                        regNo: selectedVehicle?.regNo || selectedVehicle?.registration || ''
                                    },
                                    breakdown_source: 'wizard_assessment',
                                    status: 'completed',
                                    priority_level: assessmentDecision === 'STOP' ? 1 : assessmentDecision === 'AMBER' ? 2 : 3,
                                    
                                    // Metadata for tracking
                                    assessment_id: assessmentId,
                                    session_data: {
                                        current_step: currentStep,
                                        wizard_title: wizards[currentWizard]?.title,
                                        total_responses: Object.keys(responses || {}).length
                                    }
                                };

                                // 🎯 STORE LOCALLY for persistence and SDC dashboard highlighting
                                try {
                                    console.log('💾 Storing comprehensive breakdown data:', comprehensiveBreakdownData);
                                    console.log('🔍 Breakdown fleet data check:', {
                                        selectedVehicle_fleetNumber: selectedVehicle?.fleetNumber,
                                        selectedVehicle_depot: selectedVehicle?.depot,
                                        selectedVehicle_vehicleType: selectedVehicle?.vehicleType,
                                        breakdown_fleet_no: comprehensiveBreakdownData.fleet_no,
                                        breakdown_depot: comprehensiveBreakdownData.depot,
                                        breakdown_vehicle_type: comprehensiveBreakdownData.vehicle_type
                                    });
                                    localStorage.setItem(`breakdown_${breakdownId}`, JSON.stringify(comprehensiveBreakdownData));
                                    localStorage.setItem('latest_breakdown_id', breakdownId);
                                    
                                    // Store highlighting information for SDC dashboard
                                    localStorage.setItem('sdc_highlight_breakdown', JSON.stringify({
                                        breakdown_id: breakdownId,
                                        timestamp: Date.now(),
                                        decision: assessmentDecision,
                                        source: 'wizard_completion'
                                    }));
                                    
                                    console.log('✅ Comprehensive breakdown data stored locally:', breakdownId);
                                    console.log('🔍 Fleet data stored:', {
                                        fleet_no: comprehensiveBreakdownData.fleet_no,
                                        depot: comprehensiveBreakdownData.depot,
                                        vehicle_type: comprehensiveBreakdownData.vehicle_type,
                                        vehicle_object: comprehensiveBreakdownData.vehicle
                                    });
                                } catch (error) {
                                    console.warn('⚠️ Failed to store breakdown data locally:', error);
                                }

                                // Complete the assessment with ALL required data including route info
                                const result = await supervisorBreakdownLogger.completeAssessment({
                                    breakdownId: assessmentId,
                                    decision: assessmentDecision,
                                    notes: assessmentNotes,
                                    wizardType: wizards[currentWizard]?.title || currentWizard,
                                    issueCategory: currentWizard,
                                    fleet_number: selectedVehicle?.fleetNumber,
                                    route: selectedRoute,
                                    routeName: routeName,
                                    assessmentData: {
                                        responses: responses,
                                        route: selectedRoute,
                                        routeName: routeName,
                                        steps: Object.entries(responses).map(([key, value]) => ({
                                            question: key,
                                            answer: value
                                        }))
                                    },
                                    description: `${wizards[currentWizard]?.title || currentWizard} assessment completed with decision: ${assessmentDecision}${selectedRoute ? ` on route ${selectedRoute}` : ''}`
                                });

                                if (result && result.success) {
                                    console.log('✅ Wizard data successfully sent to dashboard!');
                                    
                                    // Trigger activity feed refresh in parent app
                                    if (window.homepageDataManager) {
                                        console.log('🔄 Triggering activity feed refresh...');
                                        window.homepageDataManager.fetchData();
                                    }
                                    
                                    // Show success message
                                    const message = result.offline 
                                        ? 'Assessment saved locally and will sync automatically' 
                                        : 'Assessment completed and sent to dashboard';
                                    console.log('✅', message);

                                    // 🎯 REDIRECT TO SDC DASHBOARD with highlighting using comprehensive data
                                    try {
                                        const { navigationService } = await import('../services/navigationService.js');
                                        
                                        // Use the backend breakdown ID if available, otherwise use our generated ID
                                        const highlightBreakdownId = result.breakdown?.breakdown_id || result.breakdown_id || breakdownId;
                                        
                                        navigationService.handleBreakdownGuideCompletion({
                                            breakdownId: highlightBreakdownId,
                                            decision: assessmentDecision,
                                            wizardType: wizards[currentWizard]?.title || currentWizard,
                                            supervisorBadge: supervisorSession?.supervisorId || supervisorSession?.badge,
                                            returnUrl: null // Will default to SDC dashboard
                                        });
                                        
                                        console.log(`🎯 Redirecting to SDC Dashboard with highlight: ${highlightBreakdownId}`);
                                        return; // Exit early since we're redirecting
                                    } catch (error) {
                                        console.error('⚠️ Failed to redirect to SDC dashboard:', error);
                                        // Fallback to manual redirect
                                        const fallbackUrl = `/dashboards/sdc?highlight=${breakdownId}&completed=true&decision=${assessmentDecision}`;
                                        console.log(`🔄 Fallback redirect to: ${fallbackUrl}`);
                                        window.location.href = fallbackUrl;
                                        return;
                                    }
                                } else if (result) {
                                    console.warn('⚠️ Assessment saved but not synced:', result.message);
                                }

                                // Reset all state
                                setCurrentWizard(null);
                                setAssessmentId(null);
                                setResponses({});
                                setCurrentStep(1);
                                setSelectedVehicle(null);
                                setShowSummary(false);
                                setAssessmentDecision(null);
                                setAssessmentNotes('');
                                setBreakdownLocation(null);
                                } catch (error) {
                                    console.error('❌ Critical error in onComplete:', error);
                                    alert(`Error completing assessment: ${error.message}`);
                                }
                            }}
                        />
                    </div>
                </div>
                </>
            );
        }
        
        if (!currentWizard || !selectedVehicle) return null;
        
        const WizardComponent = wizardComponents[currentWizard];
        if (!WizardComponent) {
            console.error(`No wizard component found for: ${currentWizard}`);
            return <div>Wizard not found: {currentWizard}</div>;
        }
        
        return (
            <>
                <AppHeader />
                <div className="min-h-screen bg-gray-900">
                    <div className="main-content">
                        {/* Location Display */}
                        {breakdownLocation && (
                            <LocationDisplay
                                vehicle={{
                                    ...selectedVehicle,
                                    assessmentId: assessmentId
                                }}
                                location={breakdownLocation}
                                routeInfo={{
                                    route: selectedRoute,
                                    routeName: routeName
                                }}
                            />
                        )}
                    
                    <WizardComponent
                        key={`wizard-${currentWizard}-step-${currentStep}`}
                        vehicle={selectedVehicle}
                        assessmentId={assessmentId}
                        currentStep={currentStep}
                        responses={responses}
                        routeInfo={{
                            route: selectedRoute,
                            routeName: routeName
                        }}
                        updateResponse={(key, value) => {
                            setResponses({ ...responses, [key]: value });
                        }}
                        onNext={() => {
                            console.log('App.jsx - onNext called, currentStep:', currentStep);
                            const nextStep = currentStep + 1;
                            console.log('App.jsx - setting currentStep to:', nextStep);
                            setCurrentStep(nextStep);
                            
                            // Broadcast progress update
                            assessmentBroadcaster.updateProgress(nextStep);
                        }}
                        onPrevious={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        onComplete={async (decision, notes) => {
                            console.log('🎯 Wizard onComplete called:', { decision, notes });
                            console.log('🎯 Current responses:', responses);
                            console.log('🎯 Current assessmentDecision state:', assessmentDecision);
                            console.log('🎯 Current showSummary state:', showSummary);

                            // Store decision and notes for summary
                            const finalDecision = (decision || responses.decision || 'CONTINUE').toUpperCase();
                            const finalNotes = notes || responses.notes || '';

                            console.log('🎯 Final decision:', finalDecision);
                            console.log('🎯 Final notes:', finalNotes);

                            // Broadcast assessment completion
                            try {
                                assessmentBroadcaster.completeAssessment(finalDecision, finalNotes);
                                console.log('✅ Assessment broadcasted successfully');
                            } catch (error) {
                                console.error('❌ Assessment broadcast error:', error);
                            }

                            // Update state - React will batch these updates
                            console.log('🎯 Setting assessment decision and showing summary...');
                            setAssessmentDecision(finalDecision);
                            setAssessmentNotes(finalNotes);
                            setShowSummary(true);
                            console.log('🎯 State updates called - React will re-render');

                            // 🚀 AUTO-SUBMIT: Automatically submit to backend without requiring button click
                            console.log('🚀 Auto-submitting assessment to backend...');
                            setTimeout(async () => {
                                try {
                                    console.log('🔥 Starting auto-submission process...');
                                    console.log('🔍 Current state:', {
                                        assessmentId,
                                        selectedVehicle,
                                        finalDecision,
                                        breakdownLocation,
                                        selectedRoute,
                                        routeName
                                    });

                                    if (!selectedVehicle || !selectedVehicle.fleetNumber) {
                                        console.error('❌ No vehicle selected or missing fleet number!');
                                        console.log('🔍 Current selectedVehicle state:', selectedVehicle);
                                        return;
                                    }

                                    // Generate breakdown ID
                                    const timestamp = Date.now();
                                    const breakdownId = assessmentId || `BD-${timestamp}`;

                                    // Prepare data for backend submission
                                    const wizardData = {
                                        breakdownId: assessmentId,
                                        decision: finalDecision,
                                        notes: finalNotes,
                                        wizardType: wizards[currentWizard]?.title || currentWizard,
                                        issueCategory: currentWizard,
                                        fleet_number: selectedVehicle?.fleetNumber,
                                        route: selectedRoute,
                                        routeName: routeName,
                                        assessmentData: {
                                            responses: responses,
                                            route: selectedRoute,
                                            routeName: routeName,
                                            steps: Object.entries(responses).map(([key, value]) => ({
                                                question: key,
                                                answer: value
                                            }))
                                        },
                                        description: `${wizards[currentWizard]?.title || currentWizard} assessment completed with decision: ${finalDecision}${selectedRoute ? ` on route ${selectedRoute}` : ''}`
                                    };

                                    console.log('🚀 Submitting wizard data to backend:', wizardData);

                                    const result = await supervisorBreakdownLogger.completeAssessment(wizardData);

                                    if (result && result.success) {
                                        console.log('✅ Auto-submission successful!', result);

                                        // Trigger activity feed refresh
                                        if (window.homepageDataManager) {
                                            console.log('🔄 Triggering activity feed refresh...');
                                            window.homepageDataManager.fetchData();
                                        }

                                        // Redirect to SDC dashboard with highlighting
                                        const { navigationService } = await import('../services/navigationService.js');
                                        const highlightBreakdownId = result.breakdown?.breakdown_id || result.breakdown_id || breakdownId;

                                        navigationService.handleBreakdownGuideCompletion({
                                            breakdownId: highlightBreakdownId,
                                            decision: finalDecision,
                                            wizardType: wizards[currentWizard]?.title || currentWizard,
                                            supervisorBadge: supervisorSession?.supervisorId || supervisorSession?.badge,
                                            returnUrl: null
                                        });

                                        console.log(`🎯 Redirecting to SDC Dashboard with highlight: ${highlightBreakdownId}`);
                                    } else {
                                        console.warn('⚠️ Auto-submission returned non-success result:', result);
                                    }
                                } catch (error) {
                                    console.error('❌ Auto-submission failed:', error);
                                }
                            }, 1000); // Submit after 1 second to allow summary to render
                        }}
                        onCancel={() => {
                            // Broadcast cancellation
                            assessmentBroadcaster.cancelAssessment();
                            
                            setCurrentWizard(null);
                            setAssessmentId(null);
                            setResponses({});
                            setCurrentStep(1);
                            setSelectedVehicle(null);
                            setShowSummary(false);
                            setAssessmentDecision(null);
                            setAssessmentNotes('');
                            setBreakdownLocation(null); // Clear location
                            setSelectedRoute(''); // Clear route
                            setRouteName(''); // Clear route name
                            supervisorBreakdownLogger.currentBreakdown = null; // Clear current breakdown
                        }}
                    />
                    </div>
                </div>
            </>
        );
    };
    
    // Main dashboard view
    const Dashboard = () => (
        <div className="breakdown-guide-container">
            <AppHeader />
            
            <main className="main-content">
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>Active Breakdowns</h3>
                            <p className="stat-value">0</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-content">
                            <h3>Today's Assessments</h3>
                            <p className="stat-value">0</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-content">
                            <h3>Avg Response Time</h3>
                            <p className="stat-value">- min</p>
                        </div>
                    </div>
                </div>
                
                <div className="assessment-grid-container">
                    <h2 className="section-title">Select Assessment Type</h2>
                    <div className="wizard-grid-enhanced">
                    {Object.entries(wizards).map(([key, wizard]) => {
                        // Map wizard types to available PNG icons
                        const iconMapping = {
                            'brakes': 'brakes.png',
                            'steering': 'steering.png',
                            'oil-warning': 'oil_warning.png',
                            'loose-wheel-nuts': 'loose_wheel_nuts.png',
                            'puncture': 'puncture.png',
                            'road-traffic-incidents': 'collision.png',
                            'battery': 'battery_issues.png',
                            'battery-light': 'battery_issues.png',
                            'non-starter': 'non_starter.png',
                            'doors': 'door_issues.png',
                            'broken-windows': 'smashed_window.png',
                            'gear-selection': 'gear_selector_issues.png',
                            'gearbox': 'gearbox_issues.png',
                            'gearbox-temperature': 'gearbox_issues.png',
                            'cutting-out-fuel': 'low_fuel_cutting_out.png',
                            'ramp': 'wheelchair_ramp.png',
                            'wheelchair-ramp': 'wheelchair_ramp.png',
                            'exterior-lights': 'exterior_lights.png',
                            'wing-mirrors': 'broken_mirror.png',
                            'interior-lights': 'interior_lights.png',
                            'destination-display': 'destination_display.png',
                            'demisters-heaters': 'cold_bus_demisters.png',
                            'repeat-defects': 'repeat_defects.png',
                            'abs-light': 'ABS_light.png',
                            'cooling-system': 'Overheating.png',
                            'overheating': 'Overheating.png',
                            // Missing icons - using emoji fallbacks for now
                            'low-water': null,
                            'excessive-smoke': null,
                            'wipers-screenwash': null,
                            'suspension': null,
                            'warning-lights': null,
                            'speedo': null,
                            'interior-exterior-damage': null,
                            'buzzers': null
                        };
                        
                        // Emoji fallbacks for missing icons
                        const emojiFallbacks = {
                            'cooling-system': '🌡️',
                            'overheating': '🌡️',
                            'low-water': '💧',
                            'excessive-smoke': '💨',
                            'wipers-screenwash': '🌧️',
                            'suspension': '🚙',
                            'warning-lights': '⚠️',
                            'speedo': '🏁',
                            'interior-exterior-damage': '⚠️',
                            'buzzers': '🔔'
                        };
                        
                        const iconFile = iconMapping[key];
                        const hasIcon = iconFile !== null && iconFile !== undefined;
                        
                        return (
                            <button
                                key={key}
                                className="wizard-card-enhanced"
                                onClick={() => startAssessment(key)}
                            >
                                {hasIcon ? (
                                    <div className="wizard-icon-img">
                                        <img 
                                            src={`/icons/${iconFile}`} 
                                            alt={wizard.title}
                                            className="wizard-icon-png"
                                        />
                                    </div>
                                ) : (
                                    <div className="wizard-icon">{emojiFallbacks[key] || '🔧'}</div>
                                )}
                                <h3>{wizard.title}</h3>
                                <p>{wizard.description}</p>
                            </button>
                        );
                    })}
                    </div>
                </div>
            </main>
        </div>
    );
    
    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="auth-loading">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }
    
    // Show login screen if not authenticated
    if (!supervisorSession) {
        return (
            <SupabaseLogin
                onLoginSuccess={(session) => {
                    console.log('Login successful:', session);
                    setSupervisorSession(session);
                }}
            />
        );
    }
    
    return (
        <Routes>
            <Route path="/*" element={
                <>
                    {showFleetModal && (
                        <FleetSelectionModal
                            isOpen={showFleetModal}
                            onClose={() => setShowFleetModal(false)}
                            onSelectVehicle={handleFleetSelection}
                        />
                    )}
                    
                    {currentWizard ? renderWizard() : <Dashboard />}
                </>
            } />
        </Routes>
    );
};

export default App;
