# Wizard Integration Guide for Breakdown Tracking
**For Developers Adding Tracking to Wizards**

## Quick Integration Steps

### 1. When Starting a Wizard

In your main App.js or wizard initialization, start the breakdown tracking:

```javascript
// When user selects a wizard and enters fleet info
const startWizard = async (wizardType, fleetNumber, depot) => {
    // Start tracking with the new system
    if (window.BreakdownTracker) {
        await window.BreakdownTracker.startBreakdownTracking(
            fleetNumber,
            supervisorSession.supervisorId,
            supervisorSession.supervisorName,
            depot,
            wizardType
        );
    }
    
    // Also use the existing logger
    if (window.SupervisorBreakdownLogger) {
        await window.SupervisorBreakdownLogger.startAssessment(
            wizardType,
            fleetNumber,
            depot
        );
    }
};
```

### 2. When User Makes a Choice/Response

Track each significant user action:

```javascript
// In your wizard component
const handleResponseUpdate = (key, value) => {
    // Update local state
    updateResponse(key, value);
    
    // Log to breakdown tracker
    if (window.BreakdownTracker) {
        window.BreakdownTracker.logStep('response_updated', {
            field: key,
            value: value,
            step: currentStep,
            timestamp: new Date().toISOString()
        });
    }
    
    // Also log with existing logger
    if (window.SupervisorBreakdownLogger) {
        window.SupervisorBreakdownLogger.logWizardStep(
            'response_updated',
            { field: key, value: value }
        );
    }
};
```

### 3. When Moving Between Steps

Track navigation:

```javascript
const handleNext = () => {
    // Log step completion
    if (window.BreakdownTracker) {
        window.BreakdownTracker.logStep(`step_${currentStep}_completed`, {
            responses: responses,
            nextStep: currentStep + 1
        });
    }
    
    // Move to next step
    setCurrentStep(prev => prev + 1);
};
```

### 4. When Completing the Wizard

Complete the diagnosis with appropriate severity:

```javascript
const handleComplete = async () => {
    // Determine severity based on responses
    let severity = 'CONTINUE';
    let diagnosis = '';
    
    // Example for steering wizard
    if (wizardType === 'steering') {
        if (responses.excessive_play || responses.difficulty_steering) {
            severity = 'STOP';
            diagnosis = 'Critical steering issue - vehicle must stop immediately';
        } else if (responses.minor_play) {
            severity = 'AMBER';
            diagnosis = 'Minor steering concern - proceed to depot with caution';
        } else {
            severity = 'CONTINUE';
            diagnosis = 'Steering system operating normally';
        }
    }
    
    // Complete tracking
    if (window.BreakdownTracker) {
        await window.BreakdownTracker.completeDiagnosis(
            severity,
            diagnosis,
            severity === 'STOP' // passenger_cloud_required
        );
    }
    
    // Also complete with existing logger
    if (window.SupervisorBreakdownLogger) {
        await window.SupervisorBreakdownLogger.completeWizardDiagnosis(
            severity,
            diagnosis
        );
    }
    
    // Navigate to completion screen
    onComplete();
};
```

## Severity Guidelines

### STOP (Red) - Vehicle Must Stop Immediately
- Brake failure or severe issues
- Steering system defects
- Oil warning light
- Loose wheel nuts
- Safety-critical failures

### AMBER (Yellow) - Proceed with Caution
- Minor defects that allow continuation to depot
- Reduced capability but safe to continue
- Non-critical warning lights
- Comfort issues that don't affect safety

### CONTINUE (Green) - Safe to Continue
- No significant issues found
- Minor cosmetic damage
- Issues that don't affect operation
- Successfully resolved problems

## Example: Complete SteeringWizard Integration

```javascript
const SteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    
    // Enhanced response handler with tracking
    const handleResponseUpdate = (key, value) => {
        updateResponse(key, value);
        
        // Track the response
        if (window.BreakdownTracker) {
            window.BreakdownTracker.logStep('steering_assessment', {
                question: key,
                answer: value,
                step: currentStep
            });
        }
    };
    
    // Enhanced next handler
    const handleNextWithTracking = () => {
        // Log step completion
        if (window.SupervisorBreakdownLogger) {
            window.SupervisorBreakdownLogger.logWizardStep(
                `steering_step_${currentStep}`,
                { responses: responses }
            );
        }
        onNext();
    };
    
    // Enhanced completion
    const handleCompleteWithDiagnosis = async () => {
        // Determine severity for steering issues
        const hasCriticalIssue = 
            responses.initial_concern === 'excessive_play' ||
            responses.initial_concern === 'difficulty_steering' ||
            responses.steering_play === 'excessive' ||
            responses.unusual_noises === 'yes' ||
            responses.vehicle_pulling === 'severe';
        
        const severity = hasCriticalIssue ? 'STOP' : 'AMBER';
        const diagnosis = hasCriticalIssue 
            ? 'Critical steering defect detected - vehicle must stop immediately'
            : 'Minor steering concern - proceed to depot for inspection';
        
        // Complete diagnosis tracking
        if (window.BreakdownTracker) {
            await window.BreakdownTracker.completeDiagnosis(
                severity,
                diagnosis,
                hasCriticalIssue
            );
        }
        
        onComplete();
    };
    
    // Rest of wizard implementation...
};
```

## Testing Your Integration

1. **Check Browser Console**:
   - Look for "Breakdown tracking started" message
   - Verify step logging messages
   - Check for any errors

2. **Verify in Dashboard**:
   - Open the breakdown dashboard
   - Confirm your breakdown appears
   - Check that timer starts after diagnosis
   - Verify severity is correct

3. **Test Passenger Cloud Modal**:
   - Complete wizard with STOP decision
   - Verify modal appears
   - Test both buttons

## Available Global Objects

### window.BreakdownTracker
- `startBreakdownTracking(fleet, badge, name, depot, wizard)`
- `logStep(type, data)`
- `completeDiagnosis(severity, diagnosis, passengerCloudRequired)`
- `getBreakdownStatus()`
- `clearSession()`

### window.SupervisorBreakdownLogger
- `startAssessment(wizard, fleet, depot)`
- `logWizardStep(type, data)`
- `completeWizardDiagnosis(severity, resolution)`
- `logAction(type, details)`
- `logDecision(type, value, reason)`

## Common Issues and Solutions

### Issue: Breakdown ID not being tracked
**Solution**: Ensure you call `startBreakdownTracking` before any step logging

### Issue: Passenger Cloud modal not appearing
**Solution**: Check that severity is set to 'STOP' or 'RED' in `completeDiagnosis`

### Issue: Steps not appearing in backend
**Solution**: Verify backend is running and check network tab for API calls

### Issue: Timer not starting
**Solution**: Ensure `completeDiagnosis` is called with valid severity

## Support

For help with integration:
1. Check existing wizard implementations
2. Review the test script: `test-breakdown-frontend.sh`
3. Check backend logs for API errors
4. Verify supervisor is logged in
