# Breakdown Tracking Integration Guide
**Created**: January 2025

## 🚀 Quick Start Instructions

### 1. **Run Database Migration** (in Supabase SQL Editor)
```sql
-- Copy and run the migration script from:
-- /backend/migrations/breakdown-tracking-migration.sql
```

### 2. **Update Backend Route Registration**
In `/backend/index.js`, add or replace the breakdown routes:
```javascript
// Replace old breakdown route with V2
await routeManager.registerRoute(app, '/api/breakdowns', './routes/breakdownTrackerV2.js', 'Enhanced Breakdown Tracker');
```

### 3. **Deploy Convex Schema**
```bash
cd Go_BARRY
npx convex dev  # This will push the new schema including breakdowns table
```

## 📱 Wizard Integration Instructions

### **Step 1: Modify `supervisorBreakdownLogger.js`**

Add these methods to the existing class:

```javascript
// In /public/breakdown-guide/supervisorBreakdownLogger.js

// Add at the top of the class
constructor() {
    // ... existing code ...
    this.breakdownId = null;  // Add this
}

// Replace or enhance startAssessment method
async startAssessment(wizardType, fleetNumber, depot) {
    if (!this.supervisor) {
        console.error('No supervisor logged in');
        return false;
    }
    
    // Call new API to start breakdown
    try {
        const response = await fetch(`${BACKEND_URL}/api/breakdowns/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fleet_number: fleetNumber,
                supervisor_badge: this.supervisor.supervisorId,
                supervisor_name: this.supervisor.supervisorName,
                location: await this.getCurrentLocation(),
                depot_id: depot,
                wizard_type: wizardType
            })
        });
        
        const data = await response.json();
        if (data.success) {
            this.breakdownId = data.breakdown_id;
            this.currentAssessment = {
                ...this.currentAssessment,
                breakdown_id: data.breakdown_id,
                daily_id: data.daily_id
            };
            
            // Show repeat warning if applicable
            if (data.data.repeat_warning) {
                alert(data.data.repeat_warning);
            }
        }
    } catch (error) {
        console.error('Error starting breakdown:', error);
    }
    
    // ... rest of existing code ...
}

// Add new method for logging steps
async logWizardStep(stepType, stepData) {
    if (!this.breakdownId) return;
    
    try {
        await fetch(`${BACKEND_URL}/api/breakdowns/step`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                breakdown_id: this.breakdownId,
                step_type: stepType,
                step_data: stepData,
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error logging step:', error);
    }
}

// Add method for diagnosis completion
async completeWizardDiagnosis(severity, resolution) {
    if (!this.breakdownId) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/breakdowns/diagnose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                breakdown_id: this.breakdownId,
                diagnosis: resolution,
                severity: severity || 'AMBER',
                passenger_cloud_required: false // Will be set by button click
            })
        });
        
        if (response.ok) {
            // Show Passenger Cloud option
            this.showPassengerCloudOption();
        }
    } catch (error) {
        console.error('Error completing diagnosis:', error);
    }
}

// Add Passenger Cloud integration
showPassengerCloudOption() {
    const modalHTML = `
        <div id="passenger-cloud-modal" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
        ">
            <h3>Journey Cancellation Required?</h3>
            <p>Does this breakdown require journey cancellation in Passenger Cloud?</p>
            <div style="margin-top: 20px;">
                <button onclick="window.openPassengerCloud()" style="
                    background: #dc2626;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    margin-right: 10px;
                    cursor: pointer;
                ">Yes - Open Passenger Cloud</button>
                <button onclick="window.closePassengerModal()" style="
                    background: #059669;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">No - Continue</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Helper function for location
async getCurrentLocation() {
    // Try to get location if available
    if (navigator.geolocation) {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(`${position.coords.latitude},${position.coords.longitude}`);
                },
                () => {
                    resolve('Location unavailable');
                }
            );
        });
    }
    return 'Location unavailable';
}
```

### **Step 2: Add to Each Wizard HTML File**

In each wizard file (e.g., `demisters-heaters-wizard.js`), add tracking calls:

```javascript
// When wizard starts
window.breakdownLogger.startAssessment('demisters_heaters', fleetNumber, depot);

// When user makes a choice
window.breakdownLogger.logWizardStep('question_answered', {
    question: 'Are the demisters working?',
    answer: 'No'
});

// When wizard completes
window.breakdownLogger.completeWizardDiagnosis('AMBER', 'Replace demister unit');
```

### **Step 3: Add Global Functions to guide.html**

```html
<!-- Add to guide.html -->
<script>
// Global functions for Passenger Cloud
window.openPassengerCloud = function() {
    if (window.breakdownLogger && window.breakdownLogger.breakdownId) {
        // Log that Passenger Cloud was used
        fetch(`${BACKEND_URL}/api/breakdowns/step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                breakdown_id: window.breakdownLogger.breakdownId,
                step_type: 'passenger_cloud_opened',
                step_data: { timestamp: new Date().toISOString() }
            })
        });
    }
    
    // Open Passenger Cloud
    window.open('https://gonortheast.passenger-app.com/network/journeys/cancellations', '_blank');
    window.closePassengerModal();
};

window.closePassengerModal = function() {
    const modal = document.getElementById('passenger-cloud-modal');
    if (modal) modal.remove();
};
</script>
```

## 📊 Dashboard Integration

### **Update `enhanced-breakdown-dashboard.html`**

Replace the data fetching logic:

```javascript
// New data fetching function
async function fetchLiveBreakdowns() {
    try {
        const response = await fetch('https://go-barry.onrender.com/api/breakdowns/live');
        const data = await response.json();
        
        if (data.success) {
            updateDashboard(data.breakdowns);
        }
    } catch (error) {
        console.error('Error fetching breakdowns:', error);
    }
}

// Update dashboard display
function updateDashboard(breakdowns) {
    const container = document.getElementById('breakdown-list');
    container.innerHTML = '';
    
    breakdowns.forEach(breakdown => {
        const card = createBreakdownCard(breakdown);
        container.appendChild(card);
    });
    
    // Update statistics
    updateStats({
        total: breakdowns.length,
        diagnosed: breakdowns.filter(b => b.status === 'diagnosed').length,
        overdue: breakdowns.filter(b => b.minutes_since_diagnosis > 30).length
    });
}

// Create breakdown card with timer
function createBreakdownCard(breakdown) {
    const isOverdue = breakdown.minutes_since_diagnosis > 30;
    const isPriority = breakdown.is_priority;
    
    const card = document.createElement('div');
    card.className = `breakdown-card ${isOverdue ? 'overdue' : ''} ${isPriority ? 'priority' : ''}`;
    
    card.innerHTML = `
        <div class="breakdown-header">
            <span class="fleet-number">${breakdown.fleet_no}</span>
            <span class="depot">${breakdown.depot_id}</span>
            ${breakdown.repeat_breakdown ? '<span class="repeat-flag">⚠️ REPEAT</span>' : ''}
        </div>
        <div class="breakdown-body">
            <div class="location">${breakdown.location || 'Location unknown'}</div>
            <div class="route">Route: ${breakdown.route_id || 'N/A'}</div>
            <div class="supervisor">Supervisor: ${breakdown.supervisor_badge}</div>
        </div>
        <div class="breakdown-timer">
            ${breakdown.diagnosed_at ? `
                <div class="timer ${isOverdue ? 'timer-overdue' : ''}">
                    <span class="timer-value">${breakdown.minutes_since_diagnosis || 0}</span>
                    <span class="timer-label">minutes</span>
                </div>
            ` : `
                <div class="status">Awaiting Diagnosis</div>
            `}
        </div>
        <div class="breakdown-actions">
            <button onclick="viewBreakdown('${breakdown.breakdown_id}')">View</button>
            <button onclick="resolveBreakdown('${breakdown.breakdown_id}')" class="btn-resolve">Resolve</button>
        </div>
    `;
    
    return card;
}

// Add resolve function
async function resolveBreakdown(breakdownId) {
    const notes = prompt('Resolution notes:');
    if (!notes) return;
    
    const supervisor = prompt('Your badge number:');
    if (!supervisor) return;
    
    try {
        const response = await fetch(`https://go-barry.onrender.com/api/breakdowns/${breakdownId}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resolution_notes: notes,
                resolving_supervisor: supervisor,
                returned_to_service: true
            })
        });
        
        if (response.ok) {
            alert('Breakdown resolved successfully');
            fetchLiveBreakdowns(); // Refresh
        }
    } catch (error) {
        console.error('Error resolving breakdown:', error);
    }
}

// Auto-refresh every 5 seconds
setInterval(fetchLiveBreakdowns, 5000);

// Initial load
fetchLiveBreakdowns();
```

## 🔧 Testing Checklist

### **Backend Testing**
- [ ] Run Supabase migration script
- [ ] Test `/api/breakdowns/start` endpoint
- [ ] Test `/api/breakdowns/step` endpoint
- [ ] Test `/api/breakdowns/diagnose` endpoint
- [ ] Test `/api/breakdowns/live` endpoint
- [ ] Verify sequential ID generation (BD-2025-00001)
- [ ] Verify daily counter reset at 1am

### **Frontend Testing**
- [ ] Open breakdown wizard
- [ ] Enter fleet number
- [ ] Complete wizard steps
- [ ] Verify steps are logged
- [ ] Check Passenger Cloud button appears
- [ ] Verify dashboard shows breakdown
- [ ] Test resolution process

### **Convex Testing**
- [ ] Deploy schema changes
- [ ] Verify real-time sync works
- [ ] Test multiple concurrent users

## 📱 Admin Features

### **Priority Routes Management**
Access at: `/admin/breakdowns`

Add new priority routes:
```sql
INSERT INTO priority_services (route_number, priority_level, color_code) VALUES
  ('307', 'secured', '#FFA500'),
  ('1', 'important', '#FFFF00');
```

### **Delete Erroneous Entries**
Only AG003 and BP009 can delete:
```javascript
DELETE /api/breakdowns/{breakdown_id}
Body: {
  "supervisor_badge": "AG003",
  "reason": "Entered in error"
}
```

## 🚨 Important Notes

1. **Memory Optimization**: All endpoints are memory-optimized for 2GB Render limit
2. **Daily Reset**: Counter resets at 1am automatically via cron job
3. **Auto-Archive**: Breakdowns older than 30 days are archived at 2am
4. **Escalation**: Breakdowns auto-escalate after 30 minutes diagnosed
5. **Real-time Sync**: Convex provides instant updates across all screens

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify supervisor is logged in
3. Check backend is running (`/api/health-extended`)
4. Verify Supabase connection
5. Check Convex dashboard for sync issues

---
**Status**: Ready for implementation
**Next Steps**: Run migration → Update backend → Test wizard → Deploy
