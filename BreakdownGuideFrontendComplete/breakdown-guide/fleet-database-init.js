// Fleet Database Initialization Helper
// Ensures fleet database is loaded and available for the Breakdown Guide

(function() {
    console.log('🔧 Fleet Database Init Helper starting...');
    
    // Check if fleet database is loaded, if not, create it
    function ensureFleetDatabase() {
        if (!window.fleetDatabase || !window.fleetDatabase.fleetData) {
            console.log('⚠️ Fleet database not found, initializing...');
            
            // Create the service if it doesn't exist
            if (!window.fleetDatabase) {
                window.fleetDatabase = new (function FleetDatabaseService() {
                    this.fleetData = null;
                    
                    this.loadFleetDatabase = async function() {
                        try {
                            console.log('🔄 Fleet init: Loading from /gne-fleet-database.json (with REAL depot assignments)...');
                            const response = await fetch('/gne-fleet-database.json');
                            
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            
                            const rawData = await response.json();
                            
                            // Transform the data using REAL depot assignments (no more guessing!)
                            this.fleetData = this.transformRealFleetData(rawData);
                            console.log('✅ Fleet init: Database loaded and transformed:', Object.keys(this.fleetData).length, 'vehicles');
                            return true;
                        } catch (error) {
                            console.error('❌ Fleet init: Failed to load fleet database:', error);
                            // Try fallback path
                            try {
                                console.log('🔄 Fleet init: Trying fallback path...');
                                const fallbackResponse = await fetch('./gne-fleet-database.json');
                                const rawData = await fallbackResponse.json();
                                this.fleetData = this.transformRealFleetData(rawData);
                                console.log('✅ Fleet init: Database loaded from fallback');
                                return true;
                            } catch (fallbackError) {
                                console.error('❌ Fleet init: Fallback failed:', fallbackError);
                                this.fleetData = {};
                                return false;
                            }
                        }
                    };
                    
                    // Transform real fleet data (with actual depot assignments from Excel)
                    this.transformRealFleetData = function(rawData) {
                        const transformedData = {};
                        
                        if (!rawData.fleet || !Array.isArray(rawData.fleet)) {
                            console.warn('Fleet init: Invalid fleet data structure');
                            return {};
                        }
                        
                        rawData.fleet.forEach(vehicle => {
                            const fleetNumber = vehicle.fleetNumber;
                            
                            // Use REAL depot from Excel file (no more guessing!)
                            const realDepot = vehicle.depot;
                            
                            transformedData[fleetNumber] = {
                                fleetNumber: fleetNumber,
                                registration: vehicle.regNo || 'Unknown',
                                busType: this.extractBusType(vehicle.vehicleType || ''),
                                vehicleType: vehicle.vehicleType,
                                depot: realDepot // REAL depot assignment from Excel!
                            };
                        });
                        
                        console.log(`🚌 Fleet init: Loaded ${Object.keys(transformedData).length} vehicles with REAL depot assignments`);
                        
                        return transformedData;
                    };
                    
                    // Extract bus type from vehicle type string
                    this.extractBusType = function(vehicleTypeStr) {
                        if (!vehicleTypeStr) return 'Unknown';
                        
                        const lower = vehicleTypeStr.toLowerCase();
                        if (lower.includes('solo')) return 'Solo';
                        if (lower.includes('streetlite')) return 'Streetlite';
                        if (lower.includes('streetdeck')) return 'Streetdeck';
                        if (lower.includes('enviro 400')) return 'Enviro 400';
                        if (lower.includes('versa')) return 'Versa';
                        if (lower.includes('b9tl')) return 'Volvo B9TL';
                        
                        // Use first two words if no match
                        return vehicleTypeStr.split(' ').slice(0, 2).join(' ');
                    };
                    
                    // Comprehensive depot detection for all 541 operational GNE vehicles
                    this.estimateDepot = function(fleetNumber) {
                        const num = parseInt(fleetNumber);
                        
                        // Solo vehicles (600s range) - likely Consett
                        if (num >= 638 && num <= 699) return 'Consett';
                        
                        // Additional low number ranges
                        if (num >= 700 && num <= 999) return 'Consett';
                        if (num >= 1000 && num <= 3940) return 'Consett';
                        
                        // Existing operational depot ranges
                        if (num >= 3941 && num <= 3965) return 'Consett';
                        if (num >= 5210 && num <= 5229) return 'Deptford';
                        if (num >= 5230 && num <= 5249) return 'Percy Main';
                        if (num >= 5250 && num <= 5274) return 'Deptford';
                        if (num >= 5275 && num <= 5284) return 'Percy Main';
                        if (num >= 5285 && num <= 5309) return 'Riverside';
                        if (num >= 5310 && num <= 5337) return 'Washington';
                        if (num >= 5338 && num <= 5376) return 'Consett';
                        if (num >= 5377 && num <= 5409) return 'Deptford';
                        if (num >= 5410 && num <= 5419) return 'Hexham';
                        if (num >= 5420 && num <= 5437) return 'Percy Main';
                        if (num >= 5438 && num <= 5452) return 'Riverside';
                        if (num >= 5453 && num <= 5479) return 'Washington';
                        if (num >= 5480 && num <= 5499) return 'Consett';
                        
                        // Extended 6000s ranges
                        if (num >= 6001 && num <= 6007) return 'Deptford';
                        if (num >= 6008 && num <= 6014) return 'Hexham';
                        if (num >= 6015 && num <= 6042) return 'Hexham';
                        if (num >= 6043 && num <= 6048) return 'Percy Main';
                        if (num >= 6049 && num <= 6055) return 'Riverside';
                        if (num >= 6056 && num <= 6070) return 'Washington';
                        if (num >= 6071 && num <= 6084) return 'Consett';
                        if (num >= 6085 && num <= 6098) return 'Washington';
                        if (num >= 6099 && num <= 6117) return 'Riverside';
                        if (num >= 6118 && num <= 6146) return 'Percy Main';
                        if (num >= 6147 && num <= 6161) return 'Consett';
                        if (num >= 6162 && num <= 6175) return 'Hexham';
                        if (num >= 6176 && num <= 6307) return 'Washington';
                        if (num >= 6308 && num <= 6332) return 'Consett';
                        if (num >= 6333 && num <= 6337) return 'Washington';
                        if (num >= 6338 && num <= 6355) return 'Percy Main';
                        if (num >= 6356 && num <= 6376) return 'Riverside';
                        if (num >= 6377 && num <= 6916) return 'Deptford';
                        if (num >= 6917 && num <= 6923) return 'Percy Main';
                        if (num >= 6924 && num <= 6931) return 'Riverside';
                        if (num >= 6932 && num <= 6949) return 'Percy Main';
                        if (num >= 6950 && num <= 6964) return 'Washington';
                        if (num >= 6965 && num <= 6970) return 'Percy Main';
                        if (num >= 6971 && num <= 6999) return 'Riverside';
                        if (num >= 7000 && num <= 7999) return 'Percy Main';
                        if (num >= 8000 && num <= 8305) return 'Washington';
                        
                        return 'Non-operational';
                    };
                    
                    this.searchVehicles = function(query) {
                        if (!this.fleetData || Object.keys(this.fleetData).length === 0) {
                            console.warn('Fleet database not loaded yet');
                            return [];
                        }
                        
                        const searchTerm = query.toString().toLowerCase();
                        
                        return Object.values(this.fleetData).filter(vehicle => 
                            vehicle.fleetNumber.toString().includes(searchTerm) ||
                            vehicle.registration.toLowerCase().includes(searchTerm) ||
                            (vehicle.busType && vehicle.busType.toLowerCase().includes(searchTerm))
                        );
                    };
                    
                    this.getByFleetNumber = function(fleetNumber) {
                        return this.fleetData ? this.fleetData[fleetNumber] : null;
                    };
                    
                    this.getByRegistration = function(registration) {
                        if (!this.fleetData) return null;
                        const normalizedReg = registration.replace(/\s+/g, '').toUpperCase();
                        return Object.values(this.fleetData).find(vehicle => 
                            vehicle.registration.replace(/\s+/g, '').toUpperCase() === normalizedReg
                        ) || null;
                    };
                })();
            }
            
            // Load the data
            window.fleetDatabase.loadFleetDatabase();
        } else if (!window.fleetDatabase.fleetData) {
            // Service exists but data not loaded
            console.log('⚠️ Fleet database service exists but data not loaded, loading now...');
            window.fleetDatabase.loadFleetDatabase();
        } else {
            console.log('✅ Fleet database already loaded with', 
                Object.keys(window.fleetDatabase.fleetData).length, 'vehicles');
        }
    }
    
    // Run immediately
    ensureFleetDatabase();
    
    // Also run after a delay to catch any timing issues
    setTimeout(ensureFleetDatabase, 1000);
    setTimeout(ensureFleetDatabase, 3000);
    
    // Listen for any requests to reload
    window.addEventListener('fleet-database-reload', function() {
        console.log('🔄 Fleet database reload requested');
        if (window.fleetDatabase) {
            window.fleetDatabase.loadFleetDatabase();
        }
    });
})();
