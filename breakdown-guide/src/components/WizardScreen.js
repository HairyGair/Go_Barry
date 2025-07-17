import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getCategoryById } from '../utils/categories';

// Import all wizard components
import InteriorLightsWizard from '../wizards/InteriorLightsWizard';
import BrakesWizard from '../wizards/BrakesWizard';
import SteeringWizard from '../wizards/SteeringWizard';
import OilWarningLightWizard from '../wizards/OilWarningLightWizard';
import LooseWheelNutsWizard from '../wizards/LooseWheelNutsWizard';
import ABSLightWizard from '../wizards/ABSLightWizard';
import OverheatingWizard from '../wizards/OverheatingWizard';
import LowWaterWizard from '../wizards/LowWaterWizard';
import BatteryLightWizard from '../wizards/BatteryLightWizard';
import DoorsNotWorkingWizard from '../wizards/DoorsNotWorkingWizard';
import BrokenWindowsWizard from '../wizards/BrokenWindowsWizard';
import ExcessiveSmokeWizard from '../wizards/ExcessiveSmokeWizard';
import GearboxTemperatureWizard from '../wizards/GearboxTemperatureWizard';
import ExteriorLightsWizard from '../wizards/ExteriorLightsWizard';
import CuttingOutFuelWizard from '../wizards/CuttingOutFuelWizard';
import BuzzersWizard from '../wizards/BuzzersWizard';
import PunctureWizard from '../wizards/PunctureWizard';
import WipersScreenwashWizard from '../wizards/WipersScreenwashWizard';
import NonStarterWizard from '../wizards/NonStarterWizard';
import GearSelectionWizard from '../wizards/GearSelectionWizard';
import RepeatDefectsWizard from '../wizards/RepeatDefectsWizard';
// TODO: Add remaining wizards as they are implemented

import CompletionScreen from './CompletionScreen';

const WizardScreen = ({ category, onExit, sessionData, saveSession }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [responses, setResponses] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    const categoryData = getCategoryById(category);

    const updateResponse = (key, value) => {
        const newResponses = { ...responses, [key]: value };
        setResponses(newResponses);
        saveSession({ currentStep, responses: newResponses, lastUpdated: new Date().toISOString() });
    };

    const getWizard = () => {
        const wizardProps = {
            currentStep,
            responses,
            updateResponse,
            onNext: () => setCurrentStep(currentStep + 1),
            onPrevious: () => setCurrentStep(Math.max(1, currentStep - 1)),
            onComplete: () => setShowConfirmation(true)
        };

        switch (category) {
            case 'brakes':
                return <BrakesWizard {...wizardProps} />;
            case 'steering':
                return <SteeringWizard {...wizardProps} />;
            case 'oil-warning-light':
                return <OilWarningLightWizard {...wizardProps} />;
            case 'loose-wheel-nuts':
                return <LooseWheelNutsWizard {...wizardProps} />;
            case 'abs-light':
                return <ABSLightWizard {...wizardProps} />;
            case 'overheating':
                return <OverheatingWizard {...wizardProps} />;
            case 'low-water':
                return <LowWaterWizard {...wizardProps} />;
            case 'battery-light':
                return <BatteryLightWizard {...wizardProps} />;
            case 'doors':
                return <DoorsNotWorkingWizard {...wizardProps} />;
            case 'broken-windows':
                return <BrokenWindowsWizard {...wizardProps} />;
            case 'excessive-smoke':
                return <ExcessiveSmokeWizard {...wizardProps} />;
            case 'gearbox-temperature':
                return <GearboxTemperatureWizard {...wizardProps} />;
            case 'exterior-lights':
                return <ExteriorLightsWizard {...wizardProps} />;
            case 'cutting-out-fuel':
                return <CuttingOutFuelWizard {...wizardProps} />;
            case 'buzzers':
                return <BuzzersWizard {...wizardProps} />;
            case 'puncture':
                return <PunctureWizard {...wizardProps} />;
            case 'wipers-screenwash':
                return <WipersScreenwashWizard {...wizardProps} />;
            case 'non-starter':
                return <NonStarterWizard {...wizardProps} />;
            case 'gear-selection':
                return <GearSelectionWizard {...wizardProps} />;
            case 'interior-lights':
                return <InteriorLightsWizard {...wizardProps} />;
            case 'repeat-defects':
                return <RepeatDefectsWizard {...wizardProps} />;
            default:
                return (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
                        <p className="text-gray-600">This category is not yet implemented.</p>
                    </div>
                );
        }
    };

    if (showConfirmation) {
        return <CompletionScreen category={categoryData} responses={responses} onExit={onExit} />;
    }

    // Calculate progress
    const totalSteps = 5; // This would ideally be dynamic based on the wizard
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={onExit}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-blue-900">Go</span>
                                <span className="text-2xl font-bold text-red-600">NorthEast</span>
                            </div>
                            <span className="ml-4 text-gray-500">
                                {categoryData ? categoryData.name : 'Diagnostic Wizard'} - Step {currentStep}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={onExit}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Step {currentStep} of {totalSteps}
                    </p>
                </div>

                {/* Wizard Content */}
                <div className="wizard-step">
                    {getWizard()}
                </div>
            </div>
        </div>
    );
};

export default WizardScreen;