// ===================================================
// LOCATION CAPTURE MODULE - CONTROL ROOM VERSION
// For SDC operators getting location from drivers
// ===================================================

class ControlRoomLocationCapture {
    constructor() {
        this.currentLocation = null;
        this.fleetNumber = null;
        this.routeNumber = null;
        
        // Common depot locations with What3Words
        this.depotLocations = {
            'Consett': {
                coords: { lat: 54.8543, lng: -1.8321 },
                w3w: 'fades.castle.thin',
                address: 'Hownsgill Industrial Estate, Consett'
            },
            'Deptford': {
                coords: { lat: 54.8903, lng: -1.3842 },
                w3w: 'spit.blast.wings',
                address: 'St Marks Road, Sunderland'
            },
            'Gateshead': {
                coords: { lat: 54.9593, lng: -1.6030 },
                w3w: 'ranch.toast.bands',
                address: 'Mandela Way, Gateshead'
            },
            'Percy Main': {
                coords: { lat: 55.0179, lng: -1.4463 },
                w3w: 'tango.clubs.tiles',
                address: 'Norham Road, North Shields'
            },
            'Washington': {
                coords: { lat: 54.9003, lng: -1.5197 },
                w3w: 'lemon.purple.dates',
                address: 'Parsons Road, Washington'
            },
            'Hexham': {
                coords: { lat: 54.9739, lng: -2.1014 },
                w3w: 'finger.gently.forgot',
                address: 'Alemouth Road, Hexham'
            }
        };

        // Major bus stations and interchanges
        this.busStations = {
            'Newcastle Central Station': { 
                lat: 54.9683, lng: -1.6174,
                w3w: 'cafe.pulse.risky'
            },
            'Gateshead Interchange': { 
                lat: 54.9615, lng: -1.6016,
                w3w: 'humid.energy.trend'
            },
            'Eldon Square Bus Station': { 
                lat: 54.9764, lng: -1.6145,
                w3w: 'banks.diary.begin'
            },
            'MetroCentre': { 
                lat: 54.9585, lng: -1.6658,
                w3w: 'rods.folder.logo'
            },
            'Team Valley': { 
                lat: 54.9228, lng: -1.5742,
                w3w: 'spend.blaze.fancy'
            },
            'Haymarket Bus Station': { 
                lat: 54.9788, lng: -1.6135,
                w3w: 'cloud.format.farms'
            },
            'Durham Bus Station': { 
                lat: 54.7783, lng: -1.5736,
                w3w: 'video.letter.doctor'
            },
            'Sunderland Interchange': { 
                lat: 54.9058, lng: -1.3822,
                w3w: 'dime.second.cherry'
            },
            'Four Lane Ends': {
                lat: 55.0095, lng: -1.5406,
                w3w: 'caves.sushi.drill'
            },
            'Wallsend': {
                lat: 54.9914, lng: -1.5339,
                w3w: 'alarm.budget.grin'
            }
        };

        // Common breakdown locations on major roads
        this.roadLocations = {
            'A1 Northbound - Team Valley': { lat: 54.9228, lng: -1.5742 },
            'A1 Southbound - Angel of North': { lat: 54.9146, lng: -1.5899 },
            'A19 Northbound - Tyne Tunnel': { lat: 54.9678, lng: -1.4563 },
            'A19 Southbound - Silverlink': { lat: 54.9985, lng: -1.4571 },
            'A167 - Tyne Bridge': { lat: 54.9684, lng: -1.6085 },
            'A184 - Felling Bypass': { lat: 54.9515, lng: -1.5717 },
            'Coast Road - Tynemouth': { lat: 55.0175, lng: -1.4255 }
        };
    }

    show(fleetNumber, routeNumber, callback) {
        this.callback = callback;
        this.fleetNumber = fleetNumber;
        this.routeNumber = routeNumber;
        
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Initialize the map if needed
        this.initializeMap();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'location-capture-modal';
        modal.id = 'locationModal';
        
        modal.innerHTML = `
            <div class="location-content">
                <div class="location-header">
                    <div class="location-icon">📍</div>
                    <div>
                        <div class="location-title">Capture Vehicle Location from Driver</div>
                        <div class="location-subtitle">Fleet ${this.fleetNumber} ${this.routeNumber ? `• Route ${this.routeNumber}` : ''}</div>
                    </div>
                </div>
                
                <div class="driver-instruction">
                    <div class="instruction-box">
                        <strong>Ask the driver:</strong>
                        <p>"Can you tell me your exact location? Look for What3Words on a bus stop sign, or describe landmarks and road names."</p>
                    </div>
                </div>

                <div class="location-tabs">
                    <button class="tab-btn active" onclick="controlRoomLocation.switchTab('w3w')">
                        What3Words
                    </button>
                    <button class="tab-btn" onclick="controlRoomLocation.switchTab('stations')">
                        Bus Stations
                    </button>
                    <button class="tab-btn" onclick="controlRoomLocation.switchTab('depots')">
                        Depots
                    </button>
                    <button class="tab-btn" onclick="controlRoomLocation.switchTab('roads')">
                        Major Roads
                    </button>
                    <button class="tab-btn" onclick="controlRoomLocation.switchTab('map')">
                        Map Search
                    </button>
                    <button class="tab-btn" onclick="controlRoomLocation.switchTab('manual')">
                        Description
                    </button>
                </div>

                <div class="tab-content">
                    <!-- What3Words Tab -->
                    <div id="w3w-tab" class="tab-panel active">
                        <div class="input-group">
                            <label>What3Words Address (from driver or bus stop sign)</label>
                            <div class="w3w-input-wrapper">
                                <span class="w3w-prefix">///</span>
                                <input type="text" 
                                       id="w3w-input" 
                                       placeholder="word.word.word"
                                       onkeyup="controlRoomLocation.handleW3WInput(this.value)">
                            </div>
                            <div class="help-text">
                                Ask: "Can you see a What3Words sign? Read me the three words after the slashes."
                            </div>
                            <div id="w3w-status"></div>
                            <div id="w3w-suggestions"></div>
                        </div>
                    </div>

                    <!-- Bus Stations Tab -->
                    <div id="stations-tab" class="tab-panel">
                        <div class="location-grid">
                            ${Object.entries(this.busStations).map(([name, data]) => `
                                <button class="location-btn" onclick="controlRoomLocation.selectBusStation('${name}')">
                                    <div class="location-name">${name}</div>
                                    <div class="location-w3w">:///${data.w3w}</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Depots Tab -->
                    <div id="depots-tab" class="tab-panel">
                        <div class="location-grid">
                            ${Object.entries(this.depotLocations).map(([name, data]) => `
                                <button class="location-btn depot-btn" onclick="controlRoomLocation.selectDepot('${name}')">
                                    <div class="location-name">${name} Depot</div>
                                    <div class="location-address">${data.address}</div>
                                    <div class="location-w3w">:///${data.w3w}</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Major Roads Tab -->
                    <div id="roads-tab" class="tab-panel">
                        <div class="road-selection">
                            <div class="input-group">
                                <label>Select Road</label>
                                <select id="road-select" onchange="controlRoomLocation.selectRoad(this.value)">
                                    <option value="">-- Select Road --</option>
                                    ${Object.keys(this.roadLocations).map(road => 
                                        `<option value="${road}">${road}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Additional Details (junction, mile marker, landmarks)</label>
                                <input type="text" 
                                       id="road-details" 
                                       placeholder="e.g., just past Junction 65, near McDonald's"
                                       onkeyup="controlRoomLocation.updateRoadDetails(this.value)">
                            </div>
                        </div>
                    </div>

                    <!-- Map Tab -->
                    <div id="map-tab" class="tab-panel">
                        <div class="map-search">
                            <input type="text" 
                                   id="map-search-input" 
                                   placeholder="Search for location..."
                                   onkeyup="controlRoomLocation.searchLocation(this.value)">
                            <div id="search-results"></div>
                        </div>
                        <div id="map-container"></div>
                        <div id="map-coordinates"></div>
                    </div>

                    <!-- Manual Description Tab -->
                    <div id="manual-tab" class="tab-panel">
                        <div class="input-group">
                            <label>Driver's Location Description</label>
                            <textarea id="manual-description" 
                                      rows="4" 
                                      placeholder="e.g., Outside Tesco on Clayton Street, heading towards Central Station, just past the traffic lights"
                                      onkeyup="controlRoomLocation.updateManualDescription(this.value)"></textarea>
                        </div>
                        <div class="input-group">
                            <label>Nearest Cross Street or Junction</label>
                            <input type="text" 
                                   id="cross-street" 
                                   placeholder="e.g., Junction of Market Street and Northumberland Street">
                        </div>
                        <div class="input-group">
                            <label>Direction of Travel</label>
                            <select id="direction">
                                <option value="">-- Select Direction --</option>
                                <option value="northbound">Northbound</option>
                                <option value="southbound">Southbound</option>
                                <option value="eastbound">Eastbound</option>
                                <option value="westbound">Westbound</option>
                                <option value="inbound">Inbound to City</option>
                                <option value="outbound">Outbound from City</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="location-footer">
                    <div id="location-summary"></div>
                    <div class="location-buttons">
                        <button class="btn-cancel" onclick="controlRoomLocation.cancel()">
                            Cancel
                        </button>
                        <button class="btn-continue" 
                                id="continue-btn" 
                                disabled 
                                onclick="controlRoomLocation.continue()">
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }

    handleW3WInput(value) {
        const statusDiv = document.getElementById('w3w-status');
        
        if (!value) {
            statusDiv.innerHTML = '';
            return;
        }

        // Remove any leading slashes
        value = value.replace(/^\/+/, '');
        
        // Basic format validation
        const w3wPattern = /^[a-z]+\.[a-z]+\.[a-z]+$/i;
        if (!w3wPattern.test(value)) {
            statusDiv.innerHTML = '<span class="error">Format must be: word.word.word</span>';
            return;
        }

        // Validate with known W3W addresses nearby
        this.validateW3W(value);
    }

    validateW3W(words) {
        const statusDiv = document.getElementById('w3w-status');
        const suggestionsDiv = document.getElementById('w3w-suggestions');
        
        // Check if it matches any known locations
        const knownW3W = [
            ...Object.values(this.depotLocations).map(d => d.w3w),
            ...Object.values(this.busStations).map(b => b.w3w)
        ];
        
        if (knownW3W.includes(words)) {
            statusDiv.innerHTML = '<span class="success">✓ Valid - Known location</span>';
            this.setLocation({
                type: 'w3w',
                w3w: words,
                description: `What3Words: ///${words}`,
                verified: true
            });
        } else {
            // In production, validate with W3W API
            statusDiv.innerHTML = '<span class="warning">⚠ Unverified address - Please confirm with driver</span>';
            this.setLocation({
                type: 'w3w',
                w3w: words,
                description: `What3Words: ///${words} (unverified)`,
                verified: false
            });
        }
    }

    selectBusStation(stationName) {
        const station = this.busStations[stationName];
        this.setLocation({
            type: 'bus_station',
            name: stationName,
            coords: { lat: station.lat, lng: station.lng },
            w3w: station.w3w,
            description: stationName,
            verified: true
        });
        
        // Highlight selected
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.closest('.location-btn').classList.add('selected');
    }

    selectDepot(depotName) {
        const depot = this.depotLocations[depotName];
        this.setLocation({
            type: 'depot',
            name: depotName,
            coords: depot.coords,
            w3w: depot.w3w,
            address: depot.address,
            description: `${depotName} Depot - ${depot.address}`,
            verified: true
        });
        
        // Highlight selected
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.closest('.location-btn').classList.add('selected');
    }

    selectRoad(roadName) {
        if (!roadName) return;
        
        const road = this.roadLocations[roadName];
        const details = document.getElementById('road-details').value;
        
        this.setLocation({
            type: 'road',
            road: roadName,
            coords: road,
            details: details,
            description: `${roadName}${details ? ` - ${details}` : ''}`,
            verified: false
        });
    }

    updateRoadDetails(details) {
        const roadSelect = document.getElementById('road-select');
        if (roadSelect.value) {
            this.selectRoad(roadSelect.value);
        }
    }

    updateManualDescription(description) {
        const crossStreet = document.getElementById('cross-street').value;
        const direction = document.getElementById('direction').value;
        
        if (description.length > 10) {
            this.setLocation({
                type: 'manual',
                description: description,
                crossStreet: crossStreet,
                direction: direction,
                fullDescription: `${description}${crossStreet ? ` (near ${crossStreet})` : ''}${direction ? ` - ${direction}` : ''}`,
                verified: false
            });
        }
    }

    setLocation(location) {
        this.currentLocation = location;
        
        // Update summary
        const summaryDiv = document.getElementById('location-summary');
        summaryDiv.innerHTML = `
            <div class="location-confirmed">
                <span class="check-icon">✓</span>
                <span>${location.description}</span>
                ${location.verified ? '<span class="verified-badge">Verified</span>' : ''}
            </div>
        `;
        
        // Enable continue button
        document.getElementById('continue-btn').disabled = false;
    }

    initializeMap() {
        // Initialize a simple map for clicking
        // In production, use Google Maps or OpenStreetMap
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <p>Map integration will show here</p>
                    <p>Click to set location based on driver's description</p>
                </div>
            `;
        }
    }

    searchLocation(query) {
        // In production, use geocoding API
        const resultsDiv = document.getElementById('search-results');
        if (query.length > 2) {
            resultsDiv.innerHTML = `
                <div class="search-result" onclick="controlRoomLocation.selectSearchResult('Newcastle City Centre')">
                    Newcastle City Centre
                </div>
                <div class="search-result" onclick="controlRoomLocation.selectSearchResult('Gateshead Town Centre')">
                    Gateshead Town Centre
                </div>
            `;
        }
    }

    selectSearchResult(result) {
        this.setLocation({
            type: 'search',
            description: result,
            verified: false
        });
        document.getElementById('search-results').innerHTML = '';
    }

    continue() {
        if (this.currentLocation && this.callback) {
            // Add timestamp
            this.currentLocation.timestamp = new Date().toISOString();
            this.currentLocation.capturedBy = 'SDC';
            
            this.callback(this.currentLocation);
            this.close();
        }
    }

    cancel() {
        if (confirm('Location is required for breakdown reporting. Cancel anyway?')) {
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
window.controlRoomLocation = new ControlRoomLocationCapture();

// Integration function
window.captureBreakdownLocation = function(fleetNumber, routeNumber) {
    return new Promise((resolve, reject) => {
        window.controlRoomLocation.show(fleetNumber, routeNumber, (location) => {
            if (location) {
                resolve(location);
            } else {
                reject('Location not provided');
            }
        });
    });
};