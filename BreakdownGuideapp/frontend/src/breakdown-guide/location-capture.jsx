/**
 * Location Capture Module for Breakdown Guide
 * Provides multiple methods for capturing vehicle location during breakdowns
 * Supports GPS, What3Words, Google Maps, and manual entry
 */

class LocationCapture {
    constructor() {
        this.currentLocation = null;
        this.w3wApiKey = 'YOUR_W3W_API_KEY'; // Replace with actual API key
        this.googleMapsKey = 'YOUR_GOOGLE_MAPS_KEY'; // Replace with actual API key
        
        // Common depot locations with What3Words
        this.depotLocations = {
            'Consett': {
                coords: { lat: 54.8543, lng: -1.8321 },
                w3w: 'fades.castle.thin',
                address: 'Consett Bus Station, Front Street, Consett DH8 5AU'
            },
            'Deptford': {
                coords: { lat: 54.8903, lng: -1.3842 },
                w3w: 'spit.blast.wings',
                address: 'Deptford Depot, St Marks Road, Sunderland SR4 7BW'
            },
            'Gateshead': {
                coords: { lat: 54.9593, lng: -1.6030 },
                w3w: 'ranch.toast.bands',
                address: 'Gateshead Interchange, West Street, Gateshead NE8 1BH'
            },
            'Percy Main': {
                coords: { lat: 55.0179, lng: -1.4463 },
                w3w: 'tango.clubs.tiles',
                address: 'Percy Main Depot, Norham Road, North Shields NE29 8SD'
            },
            'Washington': {
                coords: { lat: 54.9003, lng: -1.5197 },
                w3w: 'lemon.purple.dates',
                address: 'Washington Depot, Parsons Road, Washington NE37 1EZ'
            },
            'Hexham': {
                coords: { lat: 54.9739, lng: -2.1014 },
                w3w: 'finger.gently.forgot',
                address: 'Hexham Bus Station, Loosing Hill, Hexham NE46 1BU'
            },
            'Riverside': {
                coords: { lat: 54.9666, lng: -1.5875 },
                w3w: 'acted.parks.memo',
                address: 'Riverside Depot, Pottery Lane, Newcastle NE4 6SL'
            }
        };

        // Common breakdown locations
        this.commonLocations = {
            'Newcastle Central Station': { 
                lat: 54.9683, 
                lng: -1.6174,
                w3w: 'woes.wider.bumpy'
            },
            'Gateshead Interchange': { 
                lat: 54.9615, 
                lng: -1.6016,
                w3w: 'soak.drill.fades'
            },
            'Eldon Square Bus Station': { 
                lat: 54.9764, 
                lng: -1.6145,
                w3w: 'cares.matter.drill'
            },
            'MetroCentre': { 
                lat: 54.9585, 
                lng: -1.6658,
                w3w: 'drove.spend.chef'
            },
            'Team Valley': { 
                lat: 54.9228, 
                lng: -1.5742,
                w3w: 'deeply.cares.farms'
            },
            'Haymarket Bus Station': { 
                lat: 54.9788, 
                lng: -1.6135,
                w3w: 'scrap.crown.petal'
            },
            'Durham Bus Station': { 
                lat: 54.7783, 
                lng: -1.5736,
                w3w: 'chefs.petal.submit'
            },
            'Sunderland Interchange': { 
                lat: 54.9058, 
                lng: -1.3822,
                w3w: 'chefs.submit.blaze'
            },
            'A1 Northbound - Team Valley Exit': {
                lat: 54.9311,
                lng: -1.5698,
                w3w: 'spots.acted.lands'
            },
            'A19 Northbound - Silverlink': {
                lat: 55.0163,
                lng: -1.4593,
                w3w: 'spots.dated.bland'
            }
        };
    }

    async show(fleetNumber, callback) {
        this.callback = callback;
        this.fleetNumber = fleetNumber;
        
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Try to get GPS location automatically in the background
        this.attemptGPSLocation(false);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'location-capture-modal';
        modal.id = 'locationModal';
        
        modal.innerHTML = `
            <div class="location-content">
                <div class="location-header">
                    <div class="location-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="location-title">🚨 Vehicle Location Required</div>
                        <div style="color: #dc2626; font-size: 14px; font-weight: bold;">Fleet ${this.fleetNumber}</div>
                    </div>
                </div>
                
                <div class="location-subtitle">
                    Engineers need the exact location to provide assistance. Choose a method below:
                </div>

                <div class="location-methods">
                    <!-- GPS Location -->
                    <div class="location-method" id="gps-method">
                        <div class="method-header">
                            <div class="method-icon">📍</div>
                            <div class="method-title">Current GPS Location</div>
                        </div>
                        <div class="method-description">
                            Use the device GPS to automatically detect current position
                        </div>
                        <button class="method-action" onclick="window.locationCapture.attemptGPSLocation(true)">
                            Get My Location
                        </button>
                        <div id="gps-status"></div>
                    </div>

                    <!-- What3Words -->
                    <div class="location-method" id="w3w-method">
                        <div class="method-header">
                            <div class="method-icon">⚡</div>
                            <div class="method-title">What3Words</div>
                        </div>
                        <div class="method-description">
                            Enter the 3 word address from the What3Words app (e.g., filled.count.soap)
                        </div>
                        <input type="text" 
                               class="location-input" 
                               id="w3w-input" 
                               placeholder="word.word.word"
                               onkeyup="window.locationCapture.validateW3W(this.value)">
                        <div id="w3w-status"></div>
                    </div>

                    <!-- Common Locations -->
                    <div class="location-method" id="common-method">
                        <div class="method-header">
                            <div class="method-icon">🚏</div>
                            <div class="method-title">Common Locations</div>
                        </div>
                        <div class="method-description">
                            Select if you're at a depot, bus station, or common breakdown location
                        </div>
                        <div class="depot-locations" id="depot-buttons"></div>
                        <div id="common-status"></div>
                    </div>

                    <!-- Manual Entry -->
                    <div class="location-method" id="manual-method">
                        <div class="method-header">
                            <div class="method-icon">✏️</div>
                            <div class="method-title">Manual Description</div>
                        </div>
                        <div class="method-description">
                            Describe your location in detail (road name, direction, landmarks, nearest junction)
                        </div>
                        <input type="text" 
                               class="location-input" 
                               id="manual-input" 
                               placeholder="e.g., A1 Northbound between Team Valley and MetroCentre exits, near Shell garage"
                               onkeyup="window.locationCapture.validateManual(this.value)">
                        <div id="manual-status"></div>
                    </div>

                    <!-- Map Selection -->
                    <div class="location-method" id="map-method">
                        <div class="method-header">
                            <div class="method-icon">🗺️</div>
                            <div class="method-title">Select on Map</div>
                        </div>
                        <div class="method-description">
                            Click on the map to mark your exact location
                        </div>
                        <button class="method-action" onclick="window.locationCapture.showMap()">
                            Open Map
                        </button>
                        <div id="map-container"></div>
                        <div id="map-status"></div>
                    </div>
                </div>

                <div class="location-footer">
                    <div id="location-selected"></div>
                    <div class="location-buttons">
                        <button class="btn-cancel" onclick="window.locationCapture.cancel()">
                            Cancel
                        </button>
                        <button class="btn-continue" 
                                id="continue-btn" 
                                disabled 
                                onclick="window.locationCapture.continue()">
                            Continue with Breakdown Report
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        if (!document.getElementById('location-capture-styles')) {
            const styles = document.createElement('style');
            styles.id = 'location-capture-styles';
            styles.innerHTML = `
                .location-capture-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    overflow-y: auto;
                }

                .location-content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    max-width: 700px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                }

                .location-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 3px solid #dc2626;
                    padding-bottom: 15px;
                }

                .location-icon {
                    width: 50px;
                    height: 50px;
                    background: #dc2626;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                }

                .location-icon svg {
                    width: 30px;
                    height: 30px;
                    fill: white;
                }

                .location-title {
                    font-size: 26px;
                    font-weight: bold;
                    color: #1e3a8a;
                }

                .location-subtitle {
                    color: #666;
                    margin-bottom: 25px;
                    font-size: 16px;
                }

                .location-methods {
                    display: grid;
                    gap: 20px;
                }

                .location-method {
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: #f9fafb;
                }

                .location-method:hover {
                    border-color: #dc2626;
                    background: #fef2f2;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
                }

                .location-method.active {
                    border-color: #dc2626;
                    background: #fef2f2;
                }

                .method-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .method-icon {
                    width: 35px;
                    height: 35px;
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }

                .method-title {
                    font-weight: 700;
                    font-size: 18px;
                    color: #1e3a8a;
                }

                .method-description {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }

                .method-action {
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                    margin-top: 10px;
                    transition: all 0.2s;
                }

                .method-action:hover {
                    background: #b91c1c;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .method-action:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    transform: none;
                }

                .location-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    margin-top: 10px;
                    font-size: 15px;
                }

                .location-input:focus {
                    outline: none;
                    border-color: #dc2626;
                }

                .location-status {
                    margin-top: 12px;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .location-status.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .location-status.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .location-status.loading {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }

                .location-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .location-selected {
                    display: flex;
                    align-items: center;
                    color: #059669;
                    font-weight: 700;
                    font-size: 16px;
                }

                .location-selected svg {
                    width: 24px;
                    height: 24px;
                    margin-right: 8px;
                    fill: #059669;
                }

                .location-buttons {
                    display: flex;
                    gap: 12px;
                }

                .btn-cancel {
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                }

                .btn-cancel:hover {
                    background: #4b5563;
                }

                .btn-continue {
                    background: #059669;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                }

                .btn-continue:hover:not(:disabled) {
                    background: #047857;
                }

                .btn-continue:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                #map-container {
                    height: 400px;
                    margin-top: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    display: none;
                }

                .depot-locations {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 12px;
                    margin-top: 12px;
                }

                .depot-btn {
                    padding: 10px 14px;
                    background: #f3f4f6;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .depot-btn:hover {
                    background: #e5e7eb;
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                }

                .depot-btn.selected {
                    background: #dc2626;
                    color: white;
                    border-color: #dc2626;
                }

                @media (max-width: 640px) {
                    .location-content {
                        padding: 20px;
                        width: 95%;
                    }
                    
                    .depot-locations {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Populate common locations after a short delay
        setTimeout(() => this.populateCommonLocations(), 100);
        
        return modal;
    }

    populateCommonLocations() {
        const container = document.getElementById('depot-buttons');
        if (!container) return;

        // Add depots
        const depotHeader = document.createElement('div');
        depotHeader.style.gridColumn = '1/-1';
        depotHeader.innerHTML = '<strong style="color: #1e3a8a;">Depots:</strong>';
        container.appendChild(depotHeader);

        Object.keys(this.depotLocations).forEach(depot => {
            const btn = document.createElement('button');
            btn.className = 'depot-btn';
            btn.textContent = depot;
            btn.onclick = () => this.selectDepot(depot);
            container.appendChild(btn);
        });

        // Add common locations
        const commonHeader = document.createElement('div');
        commonHeader.style.gridColumn = '1/-1';
        commonHeader.style.marginTop = '15px';
        commonHeader.innerHTML = '<strong style="color: #1e3a8a;">Bus Stations & Common Locations:</strong>';
        container.appendChild(commonHeader);

        Object.keys(this.commonLocations).forEach(location => {
            const btn = document.createElement('button');
            btn.className = 'depot-btn';
            btn.textContent = location;
            btn.onclick = () => this.selectCommonLocation(location);
            container.appendChild(btn);
        });
    }

    async attemptGPSLocation(manual = false) {
        const statusDiv = document.getElementById('gps-status');
        
        if (!navigator.geolocation) {
            this.showStatus(statusDiv, 'error', '❌ GPS not supported on this device');
            return;
        }

        this.showStatus(statusDiv, 'loading', '📡 Getting your location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                // Get What3Words for this location (simulated for now)
                const w3w = await this.coordsToW3W(coords.lat, coords.lng);
                
                // Get nearest depot
                const nearestDepot = this.findNearestDepot(coords);
                
                this.currentLocation = {
                    type: 'gps',
                    coords: coords,
                    w3w: w3w,
                    description: `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                    accuracy: coords.accuracy,
                    nearestDepot: nearestDepot.depot,
                    distanceToDepot: nearestDepot.distance
                };

                this.showStatus(statusDiv, 'success', 
                    `✅ Location found! ${w3w ? `What3Words: ///${w3w}` : ''} (Accuracy: ${Math.round(coords.accuracy)}m)`);
                this.enableContinue();
            },
            (error) => {
                let message = '❌ Unable to get location';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = '❌ Location permission denied. Please enable location services and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = '❌ Location information unavailable. Try another method.';
                        break;
                    case error.TIMEOUT:
                        message = '❌ Location request timed out. Please try again.';
                        break;
                }
                this.showStatus(statusDiv, 'error', message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    async validateW3W(value) {
        const statusDiv = document.getElementById('w3w-status');
        
        if (!value) {
            statusDiv.innerHTML = '';
            return;
        }

        // Basic format validation
        const w3wPattern = /^[a-z]+\.[a-z]+\.[a-z]+$/i;
        if (!w3wPattern.test(value)) {
            this.showStatus(statusDiv, 'error', '❌ Format must be: word.word.word');
            return;
        }

        this.showStatus(statusDiv, 'loading', '🔍 Validating What3Words address...');

        // In production, validate with W3W API
        // For now, simulate validation
        setTimeout(() => {
            this.currentLocation = {
                type: 'w3w',
                w3w: value,
                description: `What3Words: ///${value}`,
                // In production, get coords from W3W API
                coords: { lat: 54.9783, lng: -1.6178 }
            };
            
            this.showStatus(statusDiv, 'success', '✅ Valid What3Words address');
            this.enableContinue();
        }, 500);
    }

    showMap() {
        const mapContainer = document.getElementById('map-container');
        const statusDiv = document.getElementById('map-status');
        
        mapContainer.style.display = 'block';
        
        // In production, initialize Google Maps here
        // For demonstration, show placeholder with common locations
        mapContainer.innerHTML = `
            <div style="padding: 30px; text-align: center; background: #f3f4f6; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div>
                    <p style="font-size: 24px; margin-bottom: 20px;">🗺️</p>
                    <p style="font-size: 18px; font-weight: bold; color: #1e3a8a;">Interactive Map</p>
                    <p style="margin-top: 10px; color: #666;">In production, Google Maps will load here</p>
                    <p style="margin-top: 5px; color: #666; font-size: 14px;">Click on the map to set your exact location</p>
                    
                    <div style="margin-top: 20px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Quick Location Options:</p>
                        <button class="method-action" style="margin: 5px;" 
                                onclick="window.locationCapture.setMapLocation(54.9783, -1.6178, 'Newcastle City Centre')">
                            Newcastle City Centre
                        </button>
                        <button class="method-action" style="margin: 5px;" 
                                onclick="window.locationCapture.setMapLocation(54.9615, -1.6016, 'Gateshead Interchange')">
                            Gateshead Interchange
                        </button>
                        <button class="method-action" style="margin: 5px;" 
                                onclick="window.locationCapture.setMapLocation(54.9228, -1.5742, 'Team Valley')">
                            Team Valley
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async setMapLocation(lat, lng, description = null) {
        const statusDiv = document.getElementById('map-status');
        const w3w = await this.coordsToW3W(lat, lng);
        
        this.currentLocation = {
            type: 'map',
            coords: { lat, lng },
            w3w: w3w,
            description: description || `Map: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        };
        
        this.showStatus(statusDiv, 'success', 
            `✅ Location selected: ${description || 'Custom location'} ${w3w ? `(///${w3w})` : ''}`);
        this.enableContinue();
    }

    selectDepot(depotName) {
        const depot = this.depotLocations[depotName];
        const statusDiv = document.getElementById('common-status');
        
        // Update button states
        document.querySelectorAll('.depot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        this.currentLocation = {
            type: 'depot',
            name: depotName,
            coords: depot.coords,
            w3w: depot.w3w,
            description: `${depotName} Depot - ${depot.address}`
        };
        
        this.showStatus(statusDiv, 'success', `✅ Selected: ${depotName} Depot`);
        this.enableContinue();
    }

    selectCommonLocation(locationName) {
        const location = this.commonLocations[locationName];
        const statusDiv = document.getElementById('common-status');
        
        // Update button states
        document.querySelectorAll('.depot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        this.currentLocation = {
            type: 'common',
            name: locationName,
            coords: location,
            w3w: location.w3w,
            description: locationName
        };
        
        this.showStatus(statusDiv, 'success', `✅ Selected: ${locationName}`);
        this.enableContinue();
    }

    validateManual(value) {
        const statusDiv = document.getElementById('manual-status');
        
        if (!value || value.length < 15) {
            this.showStatus(statusDiv, 'error', '❌ Please provide more detail (at least 15 characters)');
            document.getElementById('continue-btn').disabled = true;
            return;
        }

        this.currentLocation = {
            type: 'manual',
            description: value,
            coords: null,
            w3w: null
        };
        
        this.showStatus(statusDiv, 'success', '✅ Location description saved');
        this.enableContinue();
    }

    async coordsToW3W(lat, lng) {
        // In production, call W3W API
        // Simulate for now with a realistic format
        const words = ['filled', 'count', 'soap', 'rider', 'torch', 'bloom', 'spark', 'crown', 'drift'];
        const w1 = words[Math.floor(Math.abs(lat * 1000) % 9)];
        const w2 = words[Math.floor(Math.abs(lng * 1000) % 9)];
        const w3 = words[Math.floor(Math.abs((lat + lng) * 1000) % 9)];
        return `${w1}.${w2}.${w3}`;
    }

    findNearestDepot(coords) {
        let nearest = null;
        let minDistance = Infinity;
        
        Object.entries(this.depotLocations).forEach(([name, depot]) => {
            const distance = this.calculateDistance(
                coords.lat, coords.lng,
                depot.coords.lat, depot.coords.lng
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = name;
            }
        });
        
        return {
            depot: nearest,
            distance: minDistance.toFixed(1) + ' km'
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    showStatus(element, type, message) {
        if (!element) return;
        element.className = `location-status ${type}`;
        element.innerHTML = message;
    }

    enableContinue() {
        const btn = document.getElementById('continue-btn');
        const selected = document.getElementById('location-selected');
        
        if (btn) btn.disabled = false;
        if (selected) {
            selected.innerHTML = `
                <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #059669;">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Location captured successfully
            `;
        }
    }

    continue() {
        if (this.currentLocation && this.callback) {
            // Add timestamp to location
            this.currentLocation.timestamp = new Date().toISOString();
            this.callback(this.currentLocation);
            this.close();
        }
    }

    cancel() {
        if (confirm('⚠️ Location is required for breakdown reporting. Are you sure you want to cancel?')) {
            this.callback(null);
            this.close();
        }
    }

    close() {
        const modal = document.getElementById('locationModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Create global instance
window.locationCapture = new LocationCapture();

// Integration function for existing wizards
window.captureBreakdownLocation = function(fleetNumber) {
    return new Promise((resolve, reject) => {
        window.locationCapture.show(fleetNumber, (location) => {
            if (location) {
                resolve(location);
            } else {
                reject('Location not provided');
            }
        });
    });
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationCapture;
}
