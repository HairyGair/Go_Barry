# Location Capture Implementation Guide for Control Room

## 🎯 Overview

This location capture system is designed specifically for SDC (Service Delivery Centre) control room operators who are getting location information from drivers over radio/phone. Since operators are not at the breakdown location, GPS auto-detection has been removed in favor of methods that work better for remote location capture.

## 📍 Location Capture Methods

1. **What3Words** - Driver reads from bus stop signs
2. **Bus Stations** - Quick select for major interchanges  
3. **Depots** - All 6 depots with addresses
4. **Major Roads** - Common breakdown locations on A roads
5. **Map Search** - Search and click on map
6. **Manual Description** - Detailed text description with cross streets

## 🚀 Quick Implementation Steps

### Step 1: Add Files to Your Project

The following files have been created:
- `/Go_BARRY/public/breakdown-guide/location-capture-control-room.js` - Main JavaScript module
- `/Go_BARRY/public/breakdown-guide/location-capture-styles.css` - Styling for the modal

### Step 2: Update guide.html

Add these lines to the `<head>` section of your breakdown guide HTML:

```html
<!-- Add to <head> section -->
<link rel="stylesheet" href="location-capture-styles.css">
<script src="location-capture-control-room.js"></script>
```

### Step 3: Update supervisorBreakdownLogger.js

Modify the `startAssessment` method to capture location first:

```javascript
async startAssessment(wizardType, fleetNumber, depot, routeNumber) {
    if (!this.supervisor) {
        console.error('No supervisor logged in');
        return false;
    }
    
    // CAPTURE LOCATION FIRST
    try {
        // Pass route number if available
        this.breakdownLocation = await window.captureBreakdownLocation(fleetNumber, routeNumber);
        
        if (!this.breakdownLocation) {
            alert('Location is required for breakdown reporting');
            return false;
        }
    } catch (error) {
        console.error('Failed to capture location:', error);
        alert('Unable to capture location. Please try again.');
        return false;
    }
    
    // Continue with existing API call, adding location data
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
                
                // Add location data
                location: this.breakdownLocation.fullDescription || this.breakdownLocation.description,
                location_type: this.breakdownLocation.type,
                location_coords: this.breakdownLocation.coords,
                location_w3w: this.breakdownLocation.w3w,
                location_verified: this.breakdownLocation.verified,
                
                depot_id: depot,
                wizard_type: wizardType,
                route_number: routeNumber
            })
        });
        
        // Rest of existing code...
    } catch (error) {
        console.error('Error starting breakdown:', error);
        return false;
    }
}
```

### Step 4: Update Each Wizard File

In each wizard start function, the location capture now happens automatically through the `startAssessment` call:

```javascript
async function startBrakesWizard() {
    const fleetNumber = document.getElementById('fleet-number').value;
    const depot = document.getElementById('depot').value;
    const routeNumber = document.getElementById('route-number')?.value; // If available
    
    // Location capture happens inside startAssessment
    const started = await window.breakdownLogger.startAssessment(
        'brakes', 
        fleetNumber, 
        depot,
        routeNumber
    );
    
    if (!started) {
        // Location capture failed or was cancelled
        console.log('Could not start assessment - likely location not provided');
        return false;
    }
    
    // Continue with wizard...
    showWizardStep1();
}
```

### Step 5: Database Schema Update

Add these columns to your breakdowns table:

```sql
ALTER TABLE breakdowns 
ADD COLUMN location_type VARCHAR(50),
ADD COLUMN location_coords JSONB,
ADD COLUMN location_w3w VARCHAR(255),
ADD COLUMN location_verified BOOLEAN DEFAULT false,
ADD COLUMN location_updated_at TIMESTAMPTZ;

-- Create index for location queries
CREATE INDEX idx_breakdowns_location_type ON breakdowns(location_type);
CREATE INDEX idx_breakdowns_w3w ON breakdowns(location_w3w);
```

### Step 6: Backend API Update

Update your `/api/breakdowns/start` endpoint to handle the new location fields:

```javascript
router.post('/start', async (req, res) => {
    const { 
        fleet_number, 
        supervisor_badge, 
        supervisor_name,
        location,
        location_type,
        location_coords,
        location_w3w,
        location_verified,
        depot_id,
        wizard_type,
        route_number 
    } = req.body;
    
    // Validate required fields
    if (!location) {
        return res.status(400).json({ 
            success: false, 
            error: 'Location is required' 
        });
    }
    
    // Insert with location data
    const { data: breakdown, error } = await supabase
        .from('breakdowns')
        .insert({
            breakdown_id: breakdownId,
            daily_id: dailyId,
            fleet_no: fleet_number,
            supervisor_badge,
            supervisor_name,
            location,
            location_type,
            location_coords,
            location_w3w,
            location_verified,
            depot_id,
            wizard_type,
            route_number,
            status: 'in_progress',
            created_at: new Date().toISOString()
        })
        .select()
        .single();
    
    // Continue with response...
});
```

## 📱 Using the Location Capture

### Control Room Workflow

1. **Driver calls in breakdown**
2. **SDC operator enters fleet number**
3. **Location modal appears automatically**
4. **Operator asks driver**: "Can you tell me your exact location? Look for What3Words on a bus stop sign, or describe landmarks and road names."

### Location Options

#### Option 1: What3Words (Preferred)
- Ask: "Can you see a What3Words sign on a bus stop?"
- Driver reads three words
- System validates format and marks as verified if it's a known location

#### Option 2: Bus Station/Depot
- If driver says they're at a known location
- Quick select from pre-configured buttons
- All locations have What3Words pre-configured

#### Option 3: Major Roads
- Select road from dropdown
- Add specific details (junction, landmarks)
- Useful for motorway breakdowns

#### Option 4: Manual Description
- Full text description
- Cross streets/junctions
- Direction of travel
- Last resort but always available

## 🗺️ What3Words Integration

### Known Locations Pre-Configured

All depots and major bus stations have What3Words addresses pre-configured:

**Depots:**
- Consett: `///fades.castle.thin`
- Deptford: `///spit.blast.wings`
- Gateshead: `///ranch.toast.bands`
- Percy Main: `///tango.clubs.tiles`
- Washington: `///lemon.purple.dates`
- Hexham: `///finger.gently.forgot`

**Major Stations:**
- Newcastle Central: `///cafe.pulse.risky`
- Gateshead Interchange: `///humid.energy.trend`
- Eldon Square: `///banks.diary.begin`
- MetroCentre: `///rods.folder.logo`

### Adding What3Words API (Optional)

To validate any What3Words address:

1. Get API key from https://what3words.com/developer
2. Add to backend `.env`:
   ```
   W3W_API_KEY=your_api_key_here
   ```
3. Add validation endpoint:
   ```javascript
   router.post('/validate-w3w', async (req, res) => {
       const { words } = req.body;
       
       const response = await fetch(
           `https://api.what3words.com/v3/convert-to-coordinates?words=${words}&key=${process.env.W3W_API_KEY}`
       );
       
       const data = await response.json();
       
       if (data.coordinates) {
           res.json({
               valid: true,
               coords: data.coordinates,
               nearestPlace: data.nearestPlace
           });
       } else {
           res.json({ valid: false });
       }
   });
   ```

## 📊 Dashboard Display

Update your breakdown dashboard to show location information:

```javascript
function displayBreakdownCard(breakdown) {
    return `
        <div class="breakdown-card">
            <div class="breakdown-header">
                <span class="fleet-number">${breakdown.fleet_no}</span>
                <span class="route">${breakdown.route_number || 'N/A'}</span>
            </div>
            
            <div class="breakdown-location">
                <div class="location-main">
                    📍 ${breakdown.location}
                    ${breakdown.location_verified ? 
                        '<span class="verified">✓ Verified</span>' : 
                        '<span class="unverified">⚠ Unverified</span>'
                    }
                </div>
                
                ${breakdown.location_w3w ? `
                    <div class="location-w3w">
                        <a href="https://w3w.co/${breakdown.location_w3w}" 
                           target="_blank">
                            ///${breakdown.location_w3w}
                        </a>
                    </div>
                ` : ''}
                
                ${breakdown.location_coords ? `
                    <div class="location-actions">
                        <button onclick="openInMaps(${breakdown.location_coords.lat}, ${breakdown.location_coords.lng})">
                            Open in Maps
                        </button>
                        <button onclick="getDirections(${breakdown.location_coords.lat}, ${breakdown.location_coords.lng})">
                            Get Directions
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function openInMaps(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

function getDirections(lat, lng) {
    // Opens Google Maps with directions from engineer's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${lat},${lng}`;
                window.open(url, '_blank');
            },
            () => {
                // Fallback if engineer location not available
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
            }
        );
    } else {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
}
```

## 🧪 Testing Checklist

- [ ] Location modal appears when starting any wizard
- [ ] What3Words input validates format (word.word.word)
- [ ] Known locations show as "Verified"
- [ ] Bus station buttons work correctly
- [ ] Depot buttons work correctly
- [ ] Major roads dropdown populates
- [ ] Manual description accepts text
- [ ] Continue button only enables when location is set
- [ ] Location data saves to database
- [ ] Location displays in dashboard
- [ ] What3Words links open correctly
- [ ] Google Maps links work
- [ ] Works on mobile devices
- [ ] Works on desktop browsers

## 🚨 Troubleshooting

### Modal doesn't appear
- Check console for JavaScript errors
- Verify files are loaded in correct order
- Ensure `captureBreakdownLocation` function exists

### Location not saving
- Check network tab for API errors
- Verify database columns exist
- Check backend logs for errors

### What3Words not validating
- Check format is exactly: word.word.word
- No spaces, only periods between words
- All lowercase letters

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are loaded
3. Check network requests in DevTools
4. Review backend logs for API errors

## 🎯 Benefits

- **Engineers find vehicles faster** - Exact location every time
- **Works for control room** - No GPS needed, driver provides info
- **Multiple options** - Always a way to capture location
- **DVSA compliance** - Complete audit trail
- **Pattern analysis** - Identify breakdown hotspots
- **Emergency ready** - Share precise location with recovery

---

**Implementation Time**: ~30 minutes
**Testing Time**: ~15 minutes
**Training Required**: Minimal - intuitive interface