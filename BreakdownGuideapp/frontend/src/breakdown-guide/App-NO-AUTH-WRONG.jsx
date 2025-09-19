/**
 * Go North East - Breakdown Assessment Guide
 * Main Application Component - NO AUTH MODE FIXED
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

// Import supervisorBreakdownLogger
import { supervisorBreakdownLogger } from './supervisorBreakdownLogger.js';

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
    
    // HARDCODED NO AUTH MODE - Always authenticated with mock session
    const [isAuthenticated] = useState(true);
    const [supervisorSession] = useState({
        id: 'mock-supervisor-001',
        supervisorId: 'mock-supervisor-001',
        name: 'Anthony Gair',
        email: 'anthony.gair@gonortheast.co.uk',
        depot: 'Washington',
        role: 'supervisor',
        isAdmin: true,
        timestamp: new Date().toISOString(),
        authenticated: true,
        noAuthMode: true
    });
    
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
    
    // Initialize supervisor logger immediately in NO AUTH mode
    useEffect(() => {
        console.log('🚀 NO AUTH MODE ACTIVATED - Skipping all authentication');
        supervisorBreakdownLogger.init({
            NO_AUTH_MODE: true,
            supervisorData: supervisorSession
        });
        console.log('✅ Supervisor logger initialized for:', supervisorSession.name);
    }, []);
    
    // Handle sign out (just reload the page in NO AUTH mode)
    const handleSignOut = async () => {
        window.location.reload();
    };
    
    // Start assessment flow
    const startAssessment = (wizardType) => {
        setPendingWizardType(wizardType);
        setShowFleetModal(true);
    };
    
    // Handle fleet selection
    const handleFleetSelection = async (vehicleWithLocation) => {
        // Extract location from the vehicle object if present
        const vehicle = { ...vehicleWithLocation };
        const location = vehicle.location || {};
        delete vehicle.location; // Remove location from vehicle object
        
        setSelectedVehicle(vehicle);
        setShowFleetModal(false);
        
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
    
    // Handle wizard step completion
    const handleStepComplete = async (stepData) => {
        // Log the step
        await supervisorBreakdownLogger.logAssessmentStep({
            breakdownId: assessmentId,
            wizardName: currentWizard,
            stepNumber: currentStep,
            question: stepData.question,
            answer: stepData.answer,
            decision: stepData.decision
        });
        
        // Update responses
        setResponses({
            ...responses,
            [`step_${currentStep}`]: stepData
        });
        
        if (stepData.decision) {
            // Assessment complete
            await supervisorBreakdownLogger.completeAssessment({
                breakdownId: assessmentId,
                decision: stepData.decision,
                notes: stepData.notes
            });
            
            // Reset state
            setCurrentWizard(null);
            setAssessmentId(null);
            setResponses({});
            setCurrentStep(1);
        } else {
            // Move to next step
            setCurrentStep(currentStep + 1);
        }
    };
    
    // Render wizard component
    const renderWizard = () => {
        
        // Show summary if assessment is complete
        if (showSummary && assessmentDecision) {
            return (
                <div className="min-h-screen bg-gray-900 p-4">
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
                            // TODO: Implement print functionality
                            window.print();
                        }}
                        onEmail={() => {
                            // TODO: Implement email functionality
                            const summary = document.querySelector('.assessment-summary');
                            if (summary) {
                                const emailBody = encodeURIComponent(summary.innerText);
                                window.location.href = `mailto:?subject=Breakdown Assessment Summary&body=${emailBody}`;
                            }
                        }}
                        onComplete={async () => {
                            // Complete the assessment in the system
                            await supervisorBreakdownLogger.completeAssessment({
                                breakdownId: assessmentId,
                                decision: assessmentDecision,
                                notes: assessmentNotes
                            });
                            
                            // Reset all state
                            setCurrentWizard(null);
                            setAssessmentId(null);
                            setResponses({});
                            setCurrentStep(1);
                            setSelectedVehicle(null);
                            setShowSummary(false);
                            setAssessmentDecision(null);
                            setAssessmentNotes('');
                        }}
                    />
                </div>
            );
        }
        
        if (!currentWizard || !selectedVehicle) return null;
        
        const WizardComponent = wizardComponents[currentWizard];
        if (!WizardComponent) {
            console.error(`No wizard component found for: ${currentWizard}`);
            return <div>Wizard not found: {currentWizard}</div>;
        }
        
        return (
            <div className="min-h-screen bg-gray-900 p-4">
                {/* Location Display */}
                <LocationDisplay 
                    vehicle={{
                        ...selectedVehicle,
                        assessmentId: assessmentId
                    }} 
                    location={supervisorBreakdownLogger.getCurrentBreakdown()?.location}
                />
                
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
                    }}
                />
            </div>
        );
    };
    
    // Main dashboard view
    const Dashboard = () => (
        <div className="breakdown-guide-container">
            <header className="app-header-enhanced">
                <div className="header-brand">
                    <img src="/gne-logo-horizontal-colour.png" alt="Go North East" className="header-logo" />
                    <div className="header-title">
                        <h1>Breakdown Assessment Guide</h1>
                        <p className="header-subtitle">NO AUTH MODE - Test Environment</p>
                    </div>
                </div>
                <div className="header-info-enhanced">
                    <div className="info-item">
                        <span className="info-label">Supervisor</span>
                        <span className="info-value">{supervisorSession.name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Depot</span>
                        <span className="info-value">{supervisorSession.depot}</span>
                    </div>
                    <div className="header-actions">
                        <button 
                            onClick={() => window.open('https://goahead.tranzaura.com/Safety/Main#/', '_blank')}
                            className="tranzaura-button"
                        >
                            🔧 Tranzaura
                        </button>
                        <button 
                            onClick={() => navigate('/breakdown-guide/dashboard')}
                            className="dashboard-button"
                        >
                            📊 Live Dashboard
                        </button>
                        <button 
                            onClick={handleSignOut}
                            className="signout-button"
                            title="Reload"
                        >
                            🔄 Reload
                        </button>
                    </div>
                </div>
            </header>
            
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
            </main>
        </div>
    );
    
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