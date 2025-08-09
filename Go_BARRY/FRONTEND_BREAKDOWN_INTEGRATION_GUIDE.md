# Frontend Integration Guide - Breakdown Logging System

## Overview
This guide explains how to integrate the breakdown logging system into your Go BARRY frontend.

## Files Created

### 1. `/public/breakdownLogger.js`
The main logging helper that provides:
- `window.logBreakdown()` - Logs a breakdown to the backend
- `window.getBreakdownData()` - Helper to get current breakdown data
- `window.isBreakdownLoggingAvailable()` - Checks if logging is available

### 2. `/components/admin/BreakdownLogs.jsx`
React component for the admin dashboard that displays:
- All breakdown logs with filtering
- Export to CSV functionality
- Pagination for large datasets
- Color-coded breakdown types

### 3. `/public/breakdown-guide/components/wizards/SteeringWizard-with-logging.js`
Example showing how to integrate logging into a wizard

## Integration Steps

### Step 1: Include the Breakdown Logger Script

Add to your main HTML file (e.g., `/public/breakdown-guide/index.html`):

```html
<!-- Add after other common scripts -->
<script src="../breakdownLogger.js"></script>
```

### Step 2: Update Each Wizard Component

For each wizard that can result in a breakdown, add the logging call when the breakdown is confirmed.

#### Example for Steering Wizard:

```javascript
// In the final confirmation step
const handleBreakdownConfirmed = async () => {
    try {
        // Log the breakdown
        await window.logBreakdown({
            supervisorId: window.AppConstants.currentSupervisor,
            vehicleReg: window.selectedReg,
            fleetNo: window.selectedFleetNo,
            breakdownType: 'Steering',
            timestamp: new Date().toISOString()
        });
        
        // Continue with existing completion logic
        onComplete();
        
    } catch (error) {
        console.error('Failed to log breakdown:', error);
        // Don't block the user - continue anyway
        onComplete();
    }
};
```

### Step 3: Add to Admin Dashboard

If you have an admin dashboard HTML file, add:

```html
<!-- Include the component -->
<script type="text/babel" src="/components/admin/BreakdownLogs.jsx"></script>

<!-- Use in your admin dashboard -->
<div id="breakdown-logs-container"></div>

<script type="text/babel">
    ReactDOM.render(<BreakdownLogs />, document.getElementById('breakdown-logs-container'));
</script>
```

Or if you have a tabbed admin interface:

```javascript
// In your admin dashboard component
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = React.useState('overview');
    
    return (
        <div>
            {/* Tab navigation */}
            <div className="tabs">
                <button onClick={() => setActiveTab('breakdowns')}>
                    Breakdown Logs
                </button>
                {/* Other tabs */}
            </div>
            
            {/* Tab content */}
            {activeTab === 'breakdowns' && <BreakdownLogs />}
        </div>
    );
};
```

## Breakdown Types to Log

Based on your SDC guide, these wizards should log breakdowns:

### Critical (Red) - MUST LOG:
- `SteeringWizard.js` → 'Steering'
- `BrakesWizard.js` → 'Brakes'
- `LooseWheelNutsWizard.js` → 'Loose Wheel Nuts'
- `OilWarningLightWizard.js` → 'Oil Warning Light'

### Electrical (Yellow/Amber) - SHOULD LOG:
- `BatteryWizard.js` → 'Battery'
- `ABSLightWizard.js` → 'ABS Light'
- `WarningLightsWizard.js` → 'Warning Lights'

### Mechanical (Orange) - SHOULD LOG:
- `DoorsWizard.js` → 'Doors'
- `GearboxWizard.js` → 'Gearbox'
- `GearSelectionWizard.js` → 'Gear Selection'
- `NonStarterWizard.js` → 'Non-Starter'
- `SuspensionWizard.js` → 'Suspension'
- `WheelchairRampWizard.js` → 'Ramp Stuck'

### Environmental/Fluid (Blue/Purple) - SHOULD LOG:
- `CoolingSystemWizard.js` → 'Overheating'
- `LowWaterWizard.js` → 'Low Water'
- `CuttingOutFuelWizard.js` → 'Fuel Problem'
- `ExcessiveSmokeWizard.js` → 'Excessive Smoke'

### Visibility (Green) - MAY LOG:
- `WipersScreenwashWizard.js` → 'Wipers/Screenwash'
- `DemistersHeatersWizard.js` → 'Demisters/Heaters'
- `ExteriorLightsWizard.js` → 'Exterior Lights'
- `InteriorLightsWizard.js` → 'Interior Lights'
- `WingMirrorsWizard.js` → 'Wing Mirrors'

### Body/Structure (Gray) - MAY LOG:
- `BrokenWindowsWizard.js` → 'Broken Windows'
- `InteriorExteriorDamageWizard.js` → 'Interior/Exterior Damage'

### Other:
- `PunctureWizard.js` → 'Puncture'
- `BuzzersWizard.js` → 'Buzzers Sounding'
- `SpeedoWizard.js` → 'Speedo Not Working'
- `RoadTrafficIncidentsWizard.js` → 'Road Traffic Incident'
- `RepeatDefectsWizard.js` → 'Repeat Defect'

## Quick Integration Template

For each wizard, find the step where the breakdown is confirmed (usually the final step) and add:

```javascript
// At the top of the final confirmation handler
const handleConfirmBreakdown = async () => {
    try {
        await window.logBreakdown({
            supervisorId: window.AppConstants.currentSupervisor,
            vehicleReg: window.selectedReg,
            fleetNo: window.selectedFleetNo,
            breakdownType: 'YOUR_BREAKDOWN_TYPE_HERE',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to log breakdown:', error);
    }
    
    // Continue with existing logic
    onComplete();
};
```

## Testing

1. Open browser console
2. Check that `window.logBreakdown` is available
3. Complete a wizard that results in a breakdown
4. Check console for "Breakdown logged successfully"
5. View logs in admin dashboard

## Error Handling

The logging system is designed to be non-blocking:
- If logging fails, the wizard continues normally
- Errors are logged to console but don't interrupt user flow
- Users see notifications if available, otherwise silent fail

## Debugging

Check if logging is available:
```javascript
console.log(window.isBreakdownLoggingAvailable());
// Returns: { available: true/false, missing: {...} }
```

Test logging manually:
```javascript
window.logBreakdown({
    supervisorId: 'TEST001',
    vehicleReg: 'TEST123',
    fleetNo: 'FL999',
    breakdownType: 'Test',
    timestamp: new Date().toISOString()
}).then(console.log).catch(console.error);
```
