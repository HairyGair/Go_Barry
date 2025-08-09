# Quick Frontend Setup - Breakdown Logging

## Step 1: Update `/public/breakdown-guide/index.html`

Find this section in your index.html:
```html
<!-- Load common components first -->
<script src="./components/common/constants.js"></script>
<script type="text/babel" src="./components/common/icons.js"></script>
```

Add this line after it:
```html
<!-- Load breakdown logging helper -->
<script src="../breakdownLogger.js"></script>
```

## Step 2: Test the Integration

Open the breakdown guide in your browser and check the console:
```javascript
// Should see: "🔧 Breakdown Logger loaded"
console.log(window.logBreakdown); // Should show the function
```

## Step 3: Update a Wizard (Example: SteeringWizard.js)

In `/public/breakdown-guide/components/wizards/SteeringWizard.js`, find the final step where breakdown is confirmed.

Look for something like:
```javascript
// Usually in a button click handler in the final step
<button onClick={onComplete}>
```

Replace with:
```javascript
<button onClick={async () => {
    try {
        await window.logBreakdown({
            supervisorId: window.AppConstants?.currentSupervisor || 'Unknown',
            vehicleReg: window.selectedReg || 'Unknown',
            fleetNo: window.selectedFleetNo || 'Unknown',
            breakdownType: 'Steering',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to log breakdown:', error);
    }
    onComplete();
}}>
```

## Step 4: Test with the Test Page

1. Open `/public/breakdown-logging-test.html` in your browser
2. Try logging a test breakdown
3. Check if it works with your backend

## Step 5: View Logs in Admin Dashboard

Add to your admin dashboard HTML:
```html
<!-- Include the component -->
<script type="text/babel" src="/components/admin/BreakdownLogs.jsx"></script>

<!-- Add where you want the logs to appear -->
<div id="breakdown-logs"></div>
<script type="text/babel">
    ReactDOM.render(<BreakdownLogs />, document.getElementById('breakdown-logs'));
</script>
```

## Quick Check List

- [ ] Added `breakdownLogger.js` to index.html
- [ ] Verified `window.logBreakdown` is available in console
- [ ] Updated at least one wizard to test
- [ ] Tested with the test page
- [ ] Added BreakdownLogs component to admin dashboard

## Wizards Priority List

Update these wizards first (critical breakdowns):
1. `SteeringWizard.js` - 'Steering'
2. `BrakesWizard.js` - 'Brakes'
3. `BatteryWizard.js` - 'Battery'
4. `DoorsWizard.js` - 'Doors'
5. `NonStarterWizard.js` - 'Non-Starter'

## Need Help?

1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:3001/api/health`
3. Test manually in console: `window.logBreakdown({...})`
4. Check the full guide: `FRONTEND_BREAKDOWN_INTEGRATION_GUIDE.md`
