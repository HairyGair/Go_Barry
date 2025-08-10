import { create } from 'zustand'

export const useFleetStore = create((set, get) => ({
  // State
  fleetDatabase: null,
  selectedVehicle: null,
  searchResults: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Actions
  loadFleetDatabase: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Use existing fleet database service
      if (window.fleetDatabase) {
        const database = window.fleetDatabase
        set({
          fleetDatabase: database,
          lastUpdated: new Date(),
          isLoading: false
        })
        return database
      } else {
        // Fallback to direct JSON load
        const response = await fetch('/gne-fleet-database.json')
        const data = await response.json()
        
        // Transform data if needed
        const transformedData = data.fleet ? data : { fleet: data }
        
        set({
          fleetDatabase: transformedData,
          lastUpdated: new Date(),
          isLoading: false
        })
        
        return transformedData
      }
    } catch (error) {
      console.error('Failed to load fleet database:', error)
      set({
        error: error.message,
        isLoading: false
      })
      throw error
    }
  },

  searchVehicles: (query) => {
    const { fleetDatabase } = get()
    if (!fleetDatabase || !query) {
      set({ searchResults: [] })
      return []
    }

    const lowercaseQuery = query.toLowerCase()
    const results = []

    // Search through fleet data
    if (fleetDatabase.fleet) {
      fleetDatabase.fleet.forEach(vehicle => {
        if (
          vehicle.fleetNumber?.toLowerCase().includes(lowercaseQuery) ||
          vehicle.regNo?.toLowerCase().includes(lowercaseQuery) ||
          vehicle.depot?.toLowerCase().includes(lowercaseQuery) ||
          vehicle.vehicleType?.toLowerCase().includes(lowercaseQuery)
        ) {
          results.push({
            ...vehicle,
            // Add computed fields
            depot: vehicle.depot || get().estimateDepot(vehicle.fleetNumber),
            busType: vehicle.busType || get().parseBusType(vehicle.vehicleType),
            capacity: vehicle.capacity || get().estimateCapacity(vehicle.vehicleType)
          })
        }
      })
    }

    set({ searchResults: results.slice(0, 10) }) // Limit to 10 results
    return results.slice(0, 10)
  },

  getVehicleByFleetNumber: (fleetNumber) => {
    const { fleetDatabase } = get()
    if (!fleetDatabase?.fleet) return null

    return fleetDatabase.fleet.find(v => v.fleetNumber === fleetNumber)
  },

  getVehiclesByDepot: (depot) => {
    const { fleetDatabase } = get()
    if (!fleetDatabase?.fleet) return []

    return fleetDatabase.fleet.filter(v => {
      const vehicleDepot = v.depot || get().estimateDepot(v.fleetNumber)
      return vehicleDepot === depot
    })
  },

  selectVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle })
  },

  clearSelection: () => {
    set({ selectedVehicle: null, searchResults: [] })
  },

  // Helper functions
  estimateDepot: (fleetNumber) => {
    if (!fleetNumber) return 'Unknown'
    
    const num = parseInt(fleetNumber)
    if (num >= 600 && num <= 699) return 'Hexham'
    if (num >= 5200 && num <= 5499) return 'Washington'
    if (num >= 5500 && num <= 5799) return 'Gateshead Riverside'
    if (num >= 6000 && num <= 6299) return 'Percy Main'
    if (num >= 6300 && num <= 6599) return 'Consett'
    if (num >= 6900 && num <= 7199) return 'Deptford'
    
    return 'Unknown'
  },

  parseBusType: (vehicleType) => {
    if (!vehicleType) return 'Unknown'
    
    const type = vehicleType.toLowerCase()
    if (type.includes('solo')) return 'Solo'
    if (type.includes('streetlite')) return 'Streetlite'
    if (type.includes('streetdeck')) return 'Streetdeck'
    if (type.includes('enviro 400')) return 'Enviro 400'
    if (type.includes('versa')) return 'Versa'
    if (type.includes('volvo')) return 'Volvo'
    
    return vehicleType.split(' ')[0] || 'Unknown'
  },

  estimateCapacity: (vehicleType) => {
    if (!vehicleType) return 50
    
    const type = vehicleType.toLowerCase()
    if (type.includes('solo')) return 30
    if (type.includes('streetlite')) return 36
    if (type.includes('enviro 400') || type.includes('streetdeck')) return 75
    if (type.includes('versa')) return 24
    
    return 50 // Default capacity
  },

  // Statistics
  getFleetStats: () => {
    const { fleetDatabase } = get()
    if (!fleetDatabase?.fleet) return null

    const stats = {
      totalVehicles: fleetDatabase.fleet.length,
      depots: {},
      types: {},
      avgAge: 0
    }

    fleetDatabase.fleet.forEach(vehicle => {
      const depot = vehicle.depot || get().estimateDepot(vehicle.fleetNumber)
      const type = get().parseBusType(vehicle.vehicleType)
      
      stats.depots[depot] = (stats.depots[depot] || 0) + 1
      stats.types[type] = (stats.types[type] || 0) + 1
    })

    return stats
  }
}))

// Auto-load fleet database on first access
if (typeof window !== 'undefined') {
  // Load database after a short delay to ensure other systems are ready
  setTimeout(() => {
    const store = useFleetStore.getState()
    if (!store.fleetDatabase) {
      store.loadFleetDatabase().catch(console.error)
    }
  }, 1000)
}