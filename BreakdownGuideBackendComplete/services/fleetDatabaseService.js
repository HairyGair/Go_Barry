/*
 * Fleet Database Service
 * Provides fleet lookup functionality for all Go BARRY systems
 * Integrates with Breakdown Guide, Tracker, and Analytics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FleetDatabaseService {
  constructor() {
    this.fleetData = null;
    this.fleetByNumber = new Map();
    this.fleetByReg = new Map();
    this.loadDatabase();
  }

  // Load the fleet database
  loadDatabase() {
    try {
      const dbPath = path.join(__dirname, '../../gne-fleet-database.json');
      const data = fs.readFileSync(dbPath, 'utf8');
      this.fleetData = JSON.parse(data);
      
      // Create lookup maps for quick access
      this.fleetData.fleet.forEach(vehicle => {
        this.fleetByNumber.set(vehicle.fleetNumber, vehicle);
        this.fleetByReg.set(vehicle.regNo.toUpperCase(), vehicle);
      });
      
      console.log(`✅ Fleet database loaded: ${this.fleetData.totalVehicles} vehicles`);
    } catch (error) {
      console.error('❌ Error loading fleet database:', error);
      this.fleetData = { fleet: [], totalVehicles: 0, activeDepots: [] };
    }
  }

  // Reload database (useful for updates)
  reloadDatabase() {
    this.loadDatabase();
  }

  // Get vehicle by fleet number
  getByFleetNumber(fleetNumber) {
    const fleetNum = String(fleetNumber);
    return this.fleetByNumber.get(fleetNum) || null;
  }

  // Get vehicle by registration number
  getByRegNumber(regNo) {
    const reg = regNo.toUpperCase().replace(/\s+/g, '');
    return this.fleetByReg.get(reg) || null;
  }

  // Get depot from fleet number using actual depot allocations
  getDepotFromFleetNumber(fleetNumber) {
    const fleetNum = parseInt(fleetNumber);
    
    // Based on the data analysis from the Excel file:
    // These are approximate ranges based on common patterns
    if (fleetNum >= 600 && fleetNum <= 699) return 'Hexham'; // Solo vehicles
    if (fleetNum >= 5200 && fleetNum <= 5499) return 'Washington';
    if (fleetNum >= 5500 && fleetNum <= 5799) return 'Riverside';
    if (fleetNum >= 6000 && fleetNum <= 6299) return 'Percy Main';
    if (fleetNum >= 6300 && fleetNum <= 6599) return 'Consett';
    if (fleetNum >= 6900 && fleetNum <= 7199) return 'Deptford';
    if (fleetNum >= 8300 && fleetNum <= 8399) return 'Riverside'; // Coaches
    
    // Default depot allocation
    return 'Riverside'; // Largest depot
  }

  // Get vehicle type category for analytics
  getVehicleTypeCategory(vehicleType) {
    const type = vehicleType.toLowerCase();
    
    if (type.includes('streetlite')) return 'Streetlite';
    if (type.includes('streetdeck')) return 'Streetdeck';
    if (type.includes('b9tl') || type.includes('gemini')) return 'Volvo B9TL';
    if (type.includes('enviro 400')) return 'Enviro 400';
    if (type.includes('enviro 200')) return 'Enviro 200';
    if (type.includes('solo')) return 'Solo';
    if (type.includes('versa')) return 'Versa';
    if (type.includes('sprinter')) return 'Minibus';
    if (type.includes('coach')) return 'Coach';
    
    return 'Other';
  }

  // Get engine type from vehicle type
  getEngineType(vehicleType) {
    const type = vehicleType.toLowerCase();
    
    if (type.includes('isbe')) return 'Cummins ISBe';
    if (type.includes('om934')) return 'Mercedes OM934';
    if (type.includes('om936')) return 'Mercedes OM936';
    if (type.includes('d9b')) return 'Volvo D9B';
    if (type.includes('dc9')) return 'Scania DC9';
    if (type.includes('om904')) return 'Mercedes OM904';
    
    return 'Unknown';
  }

  // Get Euro rating from vehicle type
  getEuroRating(vehicleType) {
    const type = vehicleType.toLowerCase();
    
    if (type.includes('euro 6')) return 'Euro 6';
    if (type.includes('euro 5')) return 'Euro 5';
    if (type.includes('eev')) return 'EEV';
    if (type.includes('euro 4')) return 'Euro 4';
    
    // Newer vehicles are typically Euro 6
    return 'Euro 6';
  }

  // Search vehicles by partial fleet number or registration
  searchVehicles(query) {
    const searchTerm = query.toUpperCase();
    const results = [];
    
    // Search in fleet numbers
    this.fleetByNumber.forEach((vehicle, fleetNumber) => {
      if (fleetNumber.includes(searchTerm)) {
        results.push(vehicle);
      }
    });
    
    // Search in registrations
    this.fleetByReg.forEach((vehicle, regNo) => {
      if (regNo.includes(searchTerm) && !results.some(v => v.fleetNumber === vehicle.fleetNumber)) {
        results.push(vehicle);
      }
    });
    
    return results;
  }

  // Get fleet statistics
  getFleetStats() {
    const stats = {
      totalVehicles: this.fleetData.totalVehicles,
      byDepot: {},
      byType: {},
      byEuroRating: {}
    };
    
    this.fleetData.fleet.forEach(vehicle => {
      // By depot
      const depot = this.getDepotFromFleetNumber(vehicle.fleetNumber);
      stats.byDepot[depot] = (stats.byDepot[depot] || 0) + 1;
      
      // By type
      const type = this.getVehicleTypeCategory(vehicle.vehicleType);
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // By Euro rating
      const euro = this.getEuroRating(vehicle.vehicleType);
      stats.byEuroRating[euro] = (stats.byEuroRating[euro] || 0) + 1;
    });
    
    return stats;
  }

  // Get vehicle age (approximate based on registration)
  getVehicleAge(regNo) {
    // UK registration format: XX## XXX where ## is the year
    const match = regNo.match(/^[A-Z]{2}(\d{2})/);
    if (match) {
      const yearCode = parseInt(match[1]);
      let year;
      
      if (yearCode >= 51 && yearCode <= 99) {
        year = 2000 + yearCode;
      } else if (yearCode >= 0 && yearCode <= 50) {
        year = 2000 + yearCode;
      }
      
      // Handle new style (post 2001)
      if (yearCode >= 2 && yearCode <= 50) {
        year = 2000 + Math.floor(yearCode / 2) + (yearCode % 2 === 0 ? 0 : 0.5);
      } else if (yearCode >= 51 && yearCode <= 99) {
        year = 2000 + Math.floor((yearCode - 50) / 2) + (yearCode % 2 === 1 ? 0 : 0.5);
      }
      
      // Special handling for recent registrations
      if (regNo.startsWith('NK') || regNo.startsWith('NL')) {
        // These are typically 2014-2019 vehicles
        year = 2014 + (yearCode - 14);
      }
      
      return new Date().getFullYear() - year;
    }
    
    return null;
  }
}

// Create singleton instance
const fleetDatabase = new FleetDatabaseService();

export default fleetDatabase;
