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

// Import shared components
import AppHeader from '../shared/AppHeader.jsx';

// Import supervisorBreakdownLogger and Supabase auth
import { supervisorBreakdownLogger } from './supervisorBreakdownLogger.js';
import { authHelpers } from '../services/supabase-client.js';

// Import components
import FleetSelectionModal from './components/FleetSelectionModal.jsx';
import BreakdownInfoStep from './components/common/BreakdownInfoStep.jsx';
import LocationDisplay from './components/common/LocationDisplay.jsx';
import AssessmentSummary from './components/common/AssessmentSummary.jsx';

// Import dashboard components
import LiveDashboard from './components/dashboard/LiveDashboard.jsx';

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
    'destination-display': DestinationDisplayWizard
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
    
    // Fleet selection state
    const [showFleetModal, setShowFleetModal] = useState(false);
    const [pendingWizardType, setPendingWizardType] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [breakdownInfo, setBreakdownInfo] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [assessmentDecision, setAssessmentDecision] = useState(null);
    const [assessmentNotes, setAssessmentNotes] = useState('');
    const [breakdownLocation, setBreakdownLocation] = useState(null);
    
    // Check for authentication from parent app
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // First check if we have a session from the parent app
                const savedSession = localStorage.getItem('supervisor_session');
                if (savedSession) {
                    const session = JSON.parse(savedSession);
                    setSupervisorSession(session);
                    setAuthLoading(false);
                    return;
                }
                
                // Otherwise check Supabase directly
                const { session, supervisor } = await authHelpers.getCurrentSession();
                
                if (session && supervisor) {
                    const sessionData = {
                        id: supervisor.id,
                        supervisorId: supervisor.id,
                        name: supervisor.name,
                        email: supervisor.email,
                        depot: supervisor.depot,
                        role: supervisor.role,
                        isAdmin: supervisor.role === 'admin',
                        timestamp: new Date().toISOString(),
                        authenticated: true,
                        supabaseSession: session
                    };
                    setSupervisorSession(sessionData);
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setAuthLoading(false);
            }
        };
        
        checkAuth();
    }, []);
    
    // Initialize supervisor logger when authenticated
    useEffect(() => {
        if (supervisorSession) {
            supervisorBreakdownLogger.init({
                NO_AUTH_MODE: false,
                supervisorData: supervisorSession
            });
        }
    }, [supervisorSession]);
    
    // Start assessment flow
    const startAssessment = (wizardType) => {
        setPendingWizardType(wizardType);
        setShowFleetModal(true);
    };
    
    // Handle fleet selection
    const handleFleetSelection = async (vehicleWithLocation) => {
        // Extract location from the vehicle object if present
        const vehicle = { ...vehicleWithLocation };
        const location = vehicle.location || null;
        delete vehicle.location; // Remove location from vehicle object
        
        console.log('handleFleetSelection - vehicle:', vehicle);
        console.log('handleFleetSelection - location:', location);
        console.log('handleFleetSelection - location type:', location?.type);
        
        setSelectedVehicle(vehicle);
        setShowFleetModal(false);
        setBreakdownLocation(location); // Store location in state
        
        if (pendingWizardType) {
            // Start the breakdown with location data
            const breakdownId = await supervisorBreakdownLogger.startBreakdown({
                vehicle,
                issueCategory: pendingWizardType,
                driverName: '',
                driverPhone: '',
                location: location
            });
            
            setAssessmentId(breakdownId);
            setCurrentWizard(pendingWizardType);
            setCurrentStep(1);
        }
    };
    
    // Render wizard component
    const renderWizard = () => {
        
        // Show summary if assessment is complete
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
                                location: supervisorBreakdownLogger.getCurrentBreakdown()?.location
                            }}
                            vehicle={selectedVehicle}
                            supervisor={supervisorSession}
                            decision={assessmentDecision}
                            wizardType={wizards[currentWizard]?.title || currentWizard}
                            onPrint={() => {
                                window.print();
                            }}
                            onEmail={() => {
                                const summary = document.querySelector('.assessment-summary');
                                if (summary) {
                                    const emailBody = encodeURIComponent(summary.innerText);
                                    window.location.href = `mailto:?subject=Breakdown Assessment Summary&body=${emailBody}`;
                                }
                            }}
                            onComplete={async () => {
                                console.log('🔥 Completing wizard assessment with full data...');

                                // Complete the assessment with ALL required data
                                const result = await supervisorBreakdownLogger.completeAssessment({
                                    breakdownId: assessmentId,
                                    decision: assessmentDecision,
                                    notes: assessmentNotes,
                                    wizardType: wizards[currentWizard]?.title || currentWizard,
                                    issueCategory: currentWizard,
                                    assessmentData: {
                                        responses: responses,
                                        steps: Object.entries(responses).map(([key, value]) => ({
                                            question: key,
                                            answer: value
                                        }))
                                    },
                                    description: `${wizards[currentWizard]?.title || currentWizard} assessment completed with decision: ${assessmentDecision}`
                                });

                                if (result && result.success) {
                                    console.log('✅ Wizard data successfully sent to dashboard!');
                                } else {
                                    console.error('❌ Failed to send wizard data to dashboard');
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
                            />
                        )}
                    
                    <WizardComponent
                        key={`wizard-${currentWizard}-step-${currentStep}`}
                        vehicle={selectedVehicle}
                        assessmentId={assessmentId}
                        currentStep={currentStep}
                        responses={responses}
                        updateResponse={(key, value) => {
                            setResponses({ ...responses, [key]: value });
                        }}
                        onNext={() => {
                            console.log('App.jsx - onNext called, currentStep:', currentStep);
                            const nextStep = currentStep + 1;
                            console.log('App.jsx - setting currentStep to:', nextStep);
                            setCurrentStep(nextStep);
                        }}
                        onPrevious={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        onComplete={async (decision, notes) => {
                            // Store decision and notes for summary
                            setAssessmentDecision((decision || responses.decision || 'CONTINUE').toUpperCase());
                            setAssessmentNotes(notes || responses.notes || '');
                            
                            // Show summary instead of completing immediately
                            setShowSummary(true);
                        }}
                        onCancel={() => {
                            setCurrentWizard(null);
                            setAssessmentId(null);
                            setResponses({});
                            setCurrentStep(1);
                            setSelectedVehicle(null);
                            setShowSummary(false);
                            setAssessmentDecision(null);
                            setAssessmentNotes('');
                            setBreakdownLocation(null); // Clear location
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
    
    // Redirect to main app if not authenticated
    if (!supervisorSession) {
        return (
            <div className="auth-loading">
                <div className="loading-container">
                    <p>Authentication required. Please login from the main app.</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="btn btn-primary"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <Routes>
            <Route path="/dashboard" element={<LiveDashboard />} />
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
