# Troubleshooting: Page Not Updating

If the main application isn't showing the ABS Light functionality, try these steps:

## 1. Force Refresh the Page
- **Windows/Linux**: `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Alternative**: Hold Shift and click the Reload button

## 2. Clear Browser Cache
- Open Developer Tools (F12)
- Right-click the Reload button
- Select "Empty Cache and Hard Reload"

## 3. Check System Status
1. Open `http://localhost:8080/system-check.html`
2. Verify all checks pass:
   - ✓ wizard-engine.js loaded
   - ✓ diagnostic-flows.js loaded
   - ✓ ABS Light flow available
   - ✓ ABS Light in categories

## 4. Direct Test Links
- Main App: `http://localhost:8080/index.html`
- ABS Test: `http://localhost:8080/test-abs-light.html`
- System Check: `http://localhost:8080/system-check.html`

## 5. Verify Server is Running from Correct Directory
The server should be running from the `/src` directory. Check that you see:
- index.html
- app.js
- wizard-engine.js
- styles.css
- data/diagnostic-flows.js

## What You Should See
When working correctly:
1. Click "Start Diagnosis" on the home page
2. You'll see 30 issue categories in a grid
3. "ABS Light" should appear with a ⚠️ icon
4. It should have an orange border (high priority)
5. Clicking it will start the ABS diagnostic flow

## Cache-Busting Applied
I've added version parameters (`?v=1.5`) to all script tags to force the browser to load fresh copies.

If you're still having issues, try:
1. Opening in an incognito/private window
2. Using a different browser
3. Restarting the development server
