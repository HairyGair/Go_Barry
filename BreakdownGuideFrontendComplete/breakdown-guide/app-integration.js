// Updated App.js to integrate BreakdownInfoStep
// This update modifies the wizard flow to always show BreakdownInfoStep first

// Find the wizard rendering section and update it
const renderWizard = () => {
    // Always show BreakdownInfoStep as step 1 for all wizards
    if (currentStep === 1) {
        return React.createElement(window.BreakdownInfoStep, {
            responses,
            updateResponse,
            onNext: handleNext
        });
    }
    
    // For subsequent steps, render the specific wizard component
    // Adjust the step number passed to the wizard (subtract 1 since we added BreakdownInfoStep)
    const wizardStep = currentStep - 1;
    
    switch (currentWizard) {
        case 'steering':
            return React.createElement(window.SteeringWizard, {
                currentStep: wizardStep,
                responses,
                updateResponse,
                onNext: handleNext,
                onPrevious: handlePrevious,
                onComplete: handleComplete
            });
        case 'brakes':
            return React.createElement(window.BrakesWizard, {
                currentStep: wizardStep,
                responses,
                updateResponse,
                onNext: handleNext,
                onPrevious: handlePrevious,
                onComplete: handleComplete
            });
        // Add other wizard cases...
        default:
            return null;
    }
};

// Export this function to be added to App.js
window.renderWizardWithBreakdownInfo = renderWizard;