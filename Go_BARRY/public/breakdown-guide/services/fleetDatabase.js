// Fleet Database Service for Breakdown Guide
// Provides fast fleet lookups and validation

class FleetDatabaseService {
    constructor() {
        this.fleetData = null;
        this.loadFleetDatabase();
    }
    
    async loadFleetDatabase() {
        try {
            console.log('🔄 Loading fleet database from /gne-fleet-database.json (with REAL depot assignments)...');
            const response = await fetch('/gne-fleet-database.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            console.log('📥 Real fleet data loaded:', rawData.totalVehicles, 'vehicles');
            
            // Transform the data using REAL depot assignments (no more guessing!)
            this.fleetData = this.transformRealFleetData(rawData);
            console.log('✅ Fleet database loaded with REAL depot assignments:', Object.keys(this.fleetData).length, 'vehicles');
        } catch (error) {
            console.error('❌ Failed to load fleet database:', error);
            // Try fallback to relative path
            try {
                console.log('🔄 Trying fallback path...');
                const fallbackResponse = await fetch('./gne-fleet-database.json');
                const rawData = await fallbackResponse.json();
                this.fleetData = this.transformRealFleetData(rawData);
                console.log('✅ Fleet database loaded from fallback path');
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                this.fleetData = {};
            }
        }
    }
    
    // Transform real fleet data (with actual depot assignments from Excel)
    transformRealFleetData(rawData) {
        const transformedData = {};
        
        if (!rawData.fleet || !Array.isArray(rawData.fleet)) {
            console.warn('Invalid fleet data structure');
            return {};
        }
        
        rawData.fleet.forEach(vehicle => {
            const fleetNumber = vehicle.fleetNumber;
            
            // Use REAL depot from Excel file (no more guessing!)
            const realDepot = vehicle.depot;
            
            // Extract vehicle type info for additional details
            const vehicleTypeInfo = this.parseVehicleType(vehicle.vehicleType || '');
            
            transformedData[fleetNumber] = {
                fleetNumber: fleetNumber,
                registration: vehicle.regNo || 'Unknown',
                busType: vehicleTypeInfo.busType,
                vehicleTypeCategory: vehicleTypeInfo.category,
                engineType: vehicleTypeInfo.engine,
                euroRating: vehicleTypeInfo.euroRating,
                depot: realDepot, // REAL depot assignment from Excel!
                vehicleType: vehicle.vehicleType,
                capacity: vehicleTypeInfo.capacity,
                yearOfManufacture: this.estimateYear(vehicle.regNo),
                age: null // Will be calculated when accessed
            };
            
            // Calculate age if year is available
            if (transformedData[fleetNumber].yearOfManufacture) {
                transformedData[fleetNumber].age = new Date().getFullYear() - transformedData[fleetNumber].yearOfManufacture;
            }
        });
        
        console.log(`🚌 Loaded ${Object.keys(transformedData).length} vehicles with REAL depot assignments`);
        
        return transformedData;
    }
    
    // Parse vehicle type string to extract useful information
    parseVehicleType(vehicleTypeStr) {
        const result = {
            busType: 'Unknown',
            category: 'Bus',
            engine: 'Unknown',
            euroRating: 'Unknown',
            capacity: null
        };
        
        if (!vehicleTypeStr) return result;
        
        const lower = vehicleTypeStr.toLowerCase();
        
        // Determine bus type
        if (lower.includes('solo')) {
            result.busType = 'Solo';
            result.category = 'Solo';
            result.capacity = 30; // Typical Solo capacity
        } else if (lower.includes('streetlite')) {
            result.busType = 'Streetlite';
            result.category = 'Single Deck';
            result.capacity = 43;
        } else if (lower.includes('streetdeck')) {
            result.busType = 'Streetdeck';
            result.category = 'Double Deck';
            result.capacity = 84;
        } else if (lower.includes('enviro 400') || lower.includes('enviro400')) {
            result.busType = 'Enviro 400';
            result.category = 'Double Deck';
            result.capacity = 84;
        } else if (lower.includes('versa')) {
            result.busType = 'Versa';
            result.category = 'Single Deck';
            result.capacity = 39;
        } else if (lower.includes('b9tl')) {
            result.busType = 'Volvo B9TL';
            result.category = 'Double Deck';
            result.capacity = 84;
        }
        
        // Extract engine information
        if (lower.includes('om904')) {
            result.engine = 'Mercedes OM904';
        } else if (lower.includes('om934')) {
            result.engine = 'Mercedes OM934';
        } else if (lower.includes('om936')) {
            result.engine = 'Mercedes OM936';
        } else if (lower.includes('isbe')) {
            result.engine = 'Cummins ISBe';
        } else if (lower.includes('d9b')) {
            result.engine = 'Volvo D9B';
        }
        
        // Extract Euro rating
        if (lower.includes('euro 6') || lower.includes('euro6')) {
            result.euroRating = 'Euro 6';
        } else if (lower.includes('euro 5') || lower.includes('euro5')) {
            result.euroRating = 'Euro 5';
        } else if (lower.includes('euro 4') || lower.includes('euro4')) {
            result.euroRating = 'Euro 4';
        }
        
        // Use the first few words as the bus type if we didn't match anything specific
        if (result.busType === 'Unknown') {
            const words = vehicleTypeStr.split(' ');
            result.busType = words.slice(0, 2).join(' ');
        }
        
        return result;
    }
    
    // Comprehensive depot detection for all 541 operational GNE vehicles
    estimateDepot(fleetNumber) {
        const num = parseInt(fleetNumber);
        
        // Solo vehicles (600s range) - likely Consett based on fleet numbering
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
        if (num >= 6015 && num <= 6042) return 'Hexham'; // Extended Hexham
        if (num >= 6043 && num <= 6048) return 'Percy Main';
        if (num >= 6049 && num <= 6055) return 'Riverside';
        if (num >= 6056 && num <= 6070) return 'Washington';
        if (num >= 6071 && num <= 6084) return 'Consett';
        if (num >= 6085 && num <= 6098) return 'Washington';
        if (num >= 6099 && num <= 6117) return 'Riverside';
        if (num >= 6118 && num <= 6146) return 'Percy Main';
        if (num >= 6147 && num <= 6161) return 'Consett';
        if (num >= 6162 && num <= 6175) return 'Hexham';
        
        // Additional 6000s ranges that might be operational
        if (num >= 6176 && num <= 6307) return 'Washington'; // Likely operational
        if (num >= 6308 && num <= 6332) return 'Consett';
        if (num >= 6333 && num <= 6337) return 'Washington';
        if (num >= 6338 && num <= 6355) return 'Percy Main';
        if (num >= 6356 && num <= 6376) return 'Riverside';
        if (num >= 6377 && num <= 6916) return 'Deptford'; // Large range likely operational
        if (num >= 6917 && num <= 6923) return 'Percy Main';
        if (num >= 6924 && num <= 6931) return 'Riverside';
        if (num >= 6932 && num <= 6949) return 'Percy Main';
        if (num >= 6950 && num <= 6964) return 'Washington';
        if (num >= 6965 && num <= 6970) return 'Percy Main';
        if (num >= 6971 && num <= 6999) return 'Riverside';
        
        // Additional ranges for ancillary vehicles
        if (num >= 7000 && num <= 7999) return 'Percy Main'; // Likely operational
        if (num >= 8000 && num <= 8305) return 'Washington'; // Before non-operational ranges
        
        // Non-operational vehicles (scrapped/stored) - specifically exclude these
        if (num >= 8306 && num <= 8346) return 'Non-operational'; // Chester-le-Street/Stanley
        if (num >= 8347 && num <= 9999) return 'Non-operational';
        
        // Very high numbers likely non-operational
        if (num >= 10000) return 'Non-operational';
        
        // Default for any remaining ranges
        return 'Non-operational';
    }
    
    // Estimate year from registration
    estimateYear(registration) {
        if (!registration) return null;
        
        // Extract age identifier from UK registration
        const match = registration.match(/([0-9]{2})/g);
        if (match && match.length > 0) {
            const ageId = parseInt(match[0]);
            
            // Convert age identifier to year
            if (ageId >= 51) {
                return 2000 + ageId - 50; // Second half of year (Sep-Feb)
            } else if (ageId <= 20) {
                return 2000 + ageId; // First half of year (Mar-Aug)
            }
        }
        
        return null;
    }
    
    // Get vehicle by fleet number
    getByFleetNumber(fleetNumber) {
        return this.fleetData[fleetNumber] || null;
    }
    
    // Get vehicle by registration
    getByRegistration(registration) {
        // Normalize registration (remove spaces, uppercase)
        const normalizedReg = registration.replace(/\s+/g, '').toUpperCase();
        
        return Object.values(this.fleetData).find(vehicle => 
            vehicle.registration.replace(/\s+/g, '').toUpperCase() === normalizedReg
        ) || null;
    }
    
    // Search vehicles (by fleet number or registration)
    searchVehicles(query) {
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
    }
    
    // Validate fleet number exists
    isValidFleetNumber(fleetNumber) {
        return !!this.fleetData[fleetNumber];
    }
    
    // Get all vehicles for a specific depot
    getVehiclesByDepot(depot) {
        return Object.values(this.fleetData).filter(vehicle => 
            vehicle.depot === depot
        );
    }
    
    // Get depot statistics
    getDepotStats() {
        const stats = {};
        Object.values(this.fleetData).forEach(vehicle => {
            if (!stats[vehicle.depot]) {
                stats[vehicle.depot] = {
                    count: 0,
                    busTypes: {}
                };
            }
            stats[vehicle.depot].count++;
            stats[vehicle.depot].busTypes[vehicle.busType] = 
                (stats[vehicle.depot].busTypes[vehicle.busType] || 0) + 1;
        });
        return stats;
    }
    
    // Auto-complete helper
    getFleetNumberSuggestions(partial) {
        const searchTerm = partial.toString();
        return Object.keys(this.fleetData)
            .filter(fleetNumber => fleetNumber.startsWith(searchTerm))
            .slice(0, 10); // Limit to 10 suggestions
    }
    
    // Format vehicle info for display
    formatVehicleInfo(fleetNumber) {
        const vehicle = this.getByFleetNumber(fleetNumber);
        if (!vehicle) return 'Unknown vehicle';
        
        return `Fleet ${vehicle.fleetNumber} - ${vehicle.registration} (${vehicle.busType})`;
    }
}

// Create singleton instance - check if we're in browser environment
if (typeof window !== 'undefined') {
    window.fleetDatabase = new FleetDatabaseService();
}

// Integration with existing Breakdown Guide - only in browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
    // Auto-populate vehicle info when fleet number is entered
    const fleetNumberInput = document.querySelector('input[name="fleetNumber"]');
    if (fleetNumberInput) {
        fleetNumberInput.addEventListener('blur', (e) => {
            const fleetNumber = e.target.value;
            const vehicle = window.fleetDatabase.getByFleetNumber(fleetNumber);
            
            if (vehicle) {
                // Auto-fill registration if there's a registration input
                const regInput = document.querySelector('input[name="registration"]');
                if (regInput) {
                    regInput.value = vehicle.registration;
                }
                
                // Update any display elements
                const vehicleInfo = document.querySelector('.vehicle-info');
                if (vehicleInfo) {
                    vehicleInfo.textContent = window.fleetDatabase.formatVehicleInfo(fleetNumber);
                }
                
                // Store in window for breakdown logging
                window.selectedFleetNo = vehicle.fleetNumber;
                window.selectedReg = vehicle.registration;
                
                console.log('✅ Vehicle found:', vehicle);
            } else {
                console.log('⚠️ Unknown fleet number:', fleetNumber);
            }
        });
    }
    });
}

// Export for use in other modules (if loaded as module)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FleetDatabaseService;
}
