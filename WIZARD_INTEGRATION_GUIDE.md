# Wizard Integration Example - Adding Breakdown Tracking

## Example: Integrating Tracking into demisters-heaters-wizard.js

### 1. At Wizard Initialization
Add this when the wizard component first loads:

```javascript
// At the top of the wizard component
React.useEffect(() => {
    // Start tracking when wizard loads
    if (window.SupervisorBreakdownLogger && currentStep === 1) {
        const fleetNumber = window.currentVehicle?.fleetNumber || 'Unknown';
        const depot = window.currentVehicle?.depot || 'Unknown';
        
        window.SupervisorBreakdownLogger.startAssessment(
            'demisters_heaters',
            fleetNumber,
            depot
        );
    }
}, []);
```

### 2. Track Each Step Response
Modify the updateResponse function to log steps:

```javascript
// When user selects an answer
const handleResponse = (field, value) => {
    // Original update
    updateResponse(field, value);
    
    // Log the step
    if (window.SupervisorBreakdownLogger) {
        window.SupervisorBreakdownLogger.logWizardStep('question_answered', {
            step: currentStep,
            question: field,
            answer: value,
            timestamp: new Date().toISOString()
        });
    }
};
```

### 3. Track Navigation Between Steps
When moving to next step:

```javascript
const handleNext = () => {
    // Log step completion
    if (window.SupervisorBreakdownLogger) {
        window.SupervisorBreakdownLogger.logWizardStep('step_completed', {
            stepNumber: currentStep,
            responses: responses
        });
    }
    
    // Original next function
    onNext();
};
```

### 4. Complete Diagnosis at Final Step
When the wizard reaches a decision:

```javascript
const handleComplete = (decision, diagnosis) => {
    // Determine severity based on decision
    let severity = 'AMBER';
    if (decision === 'STOP') severity = 'STOP';
    else if (decision === 'CONTINUE') severity = 'CONTINUE';
    
    // Complete the breakdown tracking
    if (window.SupervisorBreakdownLogger) {
        window.SupervisorBreakdownLogger.completeWizardDiagnosis(
            severity,
            diagnosis
        );
    }
    
    // Original complete function
    onComplete({
        decision: decision,
        diagnosis: diagnosis,
        responses: responses
    });
};
```

## Full Example for Critical Decision Points

### When Driver Vision is Affected (STOP Decision):
```javascript
if (responses.primary_issue === 'vision_affected') {
    // This is a STOP decision
    handleComplete(
        'STOP',
        'Driver vision impaired by demisting failure - vehicle must not continue in service'
    );
}
```

### When Demisters Not Working But Vision OK (AMBER):
```javascript
if (responses.demisters_working === 'no' && responses.vision_ok === 'yes') {
    // This is an AMBER decision
    handleComplete(
        'AMBER',
        'Demisters not functioning but vision currently clear - proceed to depot for repair'
    );
}
```

### When Temperature Below 16°C (AMBER):
```javascript
if (responses.temperature < 16 && responses.heaters_working === 'partial') {
    // This is an AMBER decision
    handleComplete(
        'AMBER',
        'Saloon temperature below 16°C - arrange changeover as soon as possible'
    );
}
```

### When Everything Working (CONTINUE):
```javascript
if (responses.demisters_working === 'yes' && responses.temperature >= 16) {
    // This is a CONTINUE decision
    handleComplete(
        'CONTINUE',
        'Demisters and heaters functioning normally - continue in service'
    );
}
```

## Testing the Integration

1. **Open the breakdown guide**
2. **Start the demisters/heaters wizard**
3. **Complete the assessment**
4. **Check that:**
   - Passenger Cloud modal appears after diagnosis
   - Breakdown appears in the dashboard
   - Timer starts counting from diagnosis
   - All steps are logged

## Pattern for All Wizards

This same pattern applies to all 26 wizards:
- **Brakes**: Track pressure tests, leak checks
- **Steering**: Track play measurements, power steering checks
- **Oil Warning**: Track leak inspections, pressure readings
- **Doors**: Track jam status, safety checks
- **Suspension**: Track height measurements, air pressure

Each wizard should:
1. Call `startAssessment()` when loaded
2. Call `logWizardStep()` for each user interaction
3. Call `completeWizardDiagnosis()` with final decision
4. Let the system handle Passenger Cloud and dashboard updates

## Benefits of Full Integration

✅ **Complete Audit Trail**: Every decision documented
✅ **Pattern Detection**: System identifies repeat issues
✅ **Response Timing**: Measure diagnosis speed
✅ **Compliance Ready**: Full DVSA documentation
✅ **Performance Metrics**: Track supervisor efficiency
