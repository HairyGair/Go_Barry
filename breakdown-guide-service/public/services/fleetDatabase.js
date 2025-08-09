// Fleet Database Service for Breakdown Guide
// Provides fast fleet lookups and validation

class FleetDatabaseService {
    constructor() {
        this.fleetData = null;
        this.loadFleetDatabase();
    }
    
    async loadFleetDatabase() {
        try {
            const response = await fetch('/backend/data/fleet-database.json');
            this.fleetData = await response.json();
            console.log('✅ Fleet database loaded:', Object.keys(this.fleetData).length, 'vehicles');
        } catch (error) {
            console.error('❌ Failed to load fleet database:', error);
            // Fallback to empty database
            this.fleetData = {};
        }
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
        const searchTerm = query.toLowerCase();
        
        return Object.values(this.fleetData).filter(vehicle => 
            vehicle.fleetNumber.includes(searchTerm) ||
            vehicle.registration.toLowerCase().includes(searchTerm) ||
            vehicle.busType.toLowerCase().includes(searchTerm)
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

// Create singleton instance
window.fleetDatabase = new FleetDatabaseService();

// Integration with existing Breakdown Guide
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

// Export for use in other modules
export default FleetDatabaseService;
