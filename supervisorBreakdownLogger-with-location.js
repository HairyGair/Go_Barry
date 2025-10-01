// =====================================================
// SUPERVISOR BREAKDOWN LOGGER - WITH LOCATION CAPTURE
// This shows the modifications needed to integrate location
// =====================================================

// Add this modification to your existing supervisorBreakdownLogger.js

class SupervisorBreakdownLogger {
    constructor() {
        // ... existing constructor code ...
        
        // ADD THESE NEW PROPERTIES
        this.breakdownLocation = null;  // Store captured location
        this.breakdownId = null;        // Store breakdown ID from API
    }

    // MODIFIED startAssessment method - ADD LOCATION CAPTURE
    async startAssessment(wizardType, fleetNumber, depot, routeNumber) {
        if (!this.supervisor) {
            console.error('No supervisor logged in');
            return false;
        }
        
        // ===== NEW SECTION: CAPTURE LOCATION FIRST =====
        try {
            console.log('Starting location capture for fleet', fleetNumber);
            
            // Show location capture modal
            this.breakdownLocation = await window.captureBreakdownLocation(fleetNumber, routeNumber);
            
            if (!this.breakdownLocation) {
                alert('Location is required for breakdown reporting. Please try again.');
                return false;
            }
            
            console.log('Location captured:', this.breakdownLocation);
        } catch (error) {
            console.error('Failed to capture location:', error);
            alert('Unable to capture location. Please try again.');
            return false;
        }
        // ===== END NEW SECTION =====
        
        // Now proceed with creating the breakdown record WITH location
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
                    depot_id: depot,
                    wizard_type: wizardType,
                    route_number: routeNumber,
                    
                    // ===== ADD LOCATION FIELDS =====
                    location: this.breakdownLocation.fullDescription || this.breakdownLocation.description,
                    location_type: this.breakdownLocation.type,
                    location_coords: this.breakdownLocation.coords,
                    location_w3w: this.breakdownLocation.w3w,
                    location_verified: this.breakdownLocation.verified || false
                    // ===== END LOCATION FIELDS =====
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.breakdownId = data.breakdown_id;
                this.currentAssessment = {
                    ...this.currentAssessment,
                    breakdown_id: data.breakdown_id,
                    daily_id: data.daily_id,
                    location: this.breakdownLocation  // Store location in assessment
                };
                
                // Show repeat warning if applicable
                if (data.data && data.data.repeat_warning) {
                    alert(data.data.repeat_warning);
                }
                
                console.log('Breakdown started successfully with ID:', this.breakdownId);
                return true;
            } else {
                console.error('Failed to start breakdown:', data.error);
                alert('Failed to start breakdown: ' + (data.error || 'Unknown error'));
                return false;
            }
        } catch (error) {
            console.error('Error starting breakdown:', error);
            alert('Error connecting to server. Please check your connection and try again.');
            return false;
        }
    }
    
    // NEW METHOD: Update location if vehicle moves
    async updateLocation() {
        if (!this.breakdownId || !this.currentAssessment) {
            console.error('No active breakdown to update location');
            return;
        }
        
        try {
            // Capture new location
            const newLocation = await window.captureBreakdownLocation(
                this.currentAssessment.fleet_number,
                this.currentAssessment.route_number
            );
            
            if (!newLocation) {
                console.log('Location update cancelled');
                return;
            }
            
            // Send update to backend
            const response = await fetch(`${BACKEND_URL}/api/breakdowns/location/${this.breakdownId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: newLocation.fullDescription || newLocation.description,
                    location_type: newLocation.type,
                    location_coords: newLocation.coords,
                    location_w3w: newLocation.w3w,
                    location_verified: newLocation.verified || false,
                    updated_by: this.supervisor.supervisorId
                })
            });
            
            if (response.ok) {
                this.breakdownLocation = newLocation;
                console.log('Location updated successfully');
                alert('Location updated successfully');
            } else {
                console.error('Failed to update location');
                alert('Failed to update location');
            }
        } catch (error) {
            console.error('Error updating location:', error);
            alert('Error updating location');
        }
    }
    
    // Keep all your existing methods unchanged
    // logWizardStep, completeWizardDiagnosis, etc.
}

// =====================================================
// INTEGRATION NOTES
// =====================================================

/*
WHAT'S CHANGED:

1. Added properties:
   - this.breakdownLocation (stores captured location)
   - this.breakdownId (stores API breakdown ID)

2. Modified startAssessment():
   - Captures location BEFORE creating breakdown
   - Includes location fields in API call
   - Returns false if location capture fails

3. Added updateLocation():
   - Allows updating location if vehicle moves
   - Can be called from UI button

WHAT YOU NEED TO DO:

1. Add these changes to your existing supervisorBreakdownLogger.js

2. Make sure guide.html includes:
   <link rel="stylesheet" href="location-capture-styles.css">
   <script src="location-capture-control-room.js"></script>

3. Update each wizard to pass route number (if available):
   await window.breakdownLogger.startAssessment(
       'wipers',           // wizard type
       fleetNumber,        // fleet number
       depot,              // depot
       routeNumber         // NEW: route number (can be null)
   );

4. Optional: Add "Update Location" button to active breakdowns:
   <button onclick="window.breakdownLogger.updateLocation()">
       📍 Update Location
   </button>

TESTING:

1. Open breakdown guide
2. Login as supervisor
3. Enter fleet number
4. Start any wizard
5. Location modal should appear
6. Select location method
7. Confirm location captured
8. Wizard continues normally

TROUBLESHOOTING:

If location modal doesn't appear:
- Check browser console for errors
- Verify location-capture-control-room.js is loaded
- Check window.captureBreakdownLocation exists

If API fails:
- Check network tab for request/response
- Verify backend has location fields
- Check database columns exist
*/