// Fleet Database Integration for Breakdown Guide Frontend
// Adds vehicle lookup and display functionality

class FleetLookupComponent {
  constructor() {
    this.apiBase = '/api/breakdown-tracker';
    this.currentVehicle = null;
  }

  // Create the vehicle lookup UI
  createLookupUI() {
    const container = document.createElement('div');
    container.className = 'fleet-lookup-container';
    container.innerHTML = `
      <div class="fleet-lookup-header">
        <h3>Vehicle Information</h3>
      </div>
      <div class="fleet-lookup-search">
        <input 
          type="text" 
          id="fleet-search" 
          placeholder="Enter fleet number or registration..."
          class="fleet-search-input"
          autocomplete="off"
        >
        <button id="fleet-search-btn" class="fleet-search-btn">
          <i class="fas fa-search"></i> Search
        </button>
      </div>
      <div id="fleet-suggestions" class="fleet-suggestions"></div>
      <div id="fleet-info" class="fleet-info-panel"></div>
    `;

    // Add styles
    this.addStyles();

    // Add event listeners
    this.attachEventListeners(container);

    return container;
  }

  // Add component styles
  addStyles() {
    if (document.getElementById('fleet-lookup-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'fleet-lookup-styles';
    styles.textContent = `
      .fleet-lookup-container {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }

      .fleet-lookup-header h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 1.2rem;
      }

      .fleet-lookup-search {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .fleet-search-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 16px;
      }

      .fleet-search-btn {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }

      .fleet-search-btn:hover {
        background: #0056b3;
      }

      .fleet-suggestions {
        position: relative;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
      }

      .fleet-suggestions.active {
        display: block;
      }

      .fleet-suggestion-item {
        padding: 10px 15px;
        cursor: pointer;
        border-bottom: 1px solid #f1f3f5;
      }

      .fleet-suggestion-item:hover {
        background: #f8f9fa;
      }

      .fleet-suggestion-item:last-child {
        border-bottom: none;
      }

      .fleet-info-panel {
        margin-top: 20px;
        display: none;
      }

      .fleet-info-panel.active {
        display: block;
      }

      .vehicle-info-card {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
      }

      .vehicle-info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #f1f3f5;
      }

      .vehicle-fleet-number {
        font-size: 2rem;
        font-weight: bold;
        color: #333;
      }

      .vehicle-reg {
        font-size: 1.2rem;
        color: #666;
        background: #f8f9fa;
        padding: 5px 15px;
        border-radius: 4px;
      }

      .vehicle-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }

      .info-section {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }

      .info-section h4 {
        margin: 0 0 10px 0;
        color: #495057;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.95rem;
      }

      .info-label {
        color: #6c757d;
      }

      .info-value {
        color: #333;
        font-weight: 500;
      }

      .vehicle-type-full {
        background: #e7f3ff;
        padding: 10px 15px;
        border-radius: 6px;
        margin-top: 15px;
        font-size: 0.9rem;
        color: #004085;
      }

      .loading-spinner {
        text-align: center;
        padding: 20px;
        color: #6c757d;
      }

      .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 6px;
        margin-top: 10px;
      }

      .depot-badge {
        display: inline-block;
        padding: 5px 15px;
        background: #28a745;
        color: white;
        border-radius: 20px;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(styles);
  }

  // Attach event listeners
  attachEventListeners(container) {
    const searchInput = container.querySelector('#fleet-search');
    const searchBtn = container.querySelector('#fleet-search-btn');
    const suggestionsDiv = container.querySelector('#fleet-suggestions');

    // Search button click
    searchBtn.addEventListener('click', () => {
      this.searchVehicle(searchInput.value);
    });

    // Enter key in search
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchVehicle(searchInput.value);
      }
    });

    // Auto-suggest as user types
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value;

      if (query.length < 2) {
        suggestionsDiv.classList.remove('active');
        return;
      }

      searchTimeout = setTimeout(() => {
        this.fetchSuggestions(query);
      }, 300);
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        suggestionsDiv.classList.remove('active');
      }
    });
  }

  // Fetch vehicle suggestions
  async fetchSuggestions(query) {
    try {
      // Use the global fleet database if available
      if (window.fleetDatabase && window.fleetDatabase.searchVehicles) {
        const vehicles = window.fleetDatabase.searchVehicles(query);
        this.displaySuggestions(vehicles);
      } else {
        console.warn('Fleet database not available for suggestions');
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }

  // Display suggestions
  displaySuggestions(vehicles) {
    const suggestionsDiv = document.querySelector('#fleet-suggestions');
    
    if (!vehicles || vehicles.length === 0) {
      suggestionsDiv.classList.remove('active');
      return;
    }

    suggestionsDiv.innerHTML = vehicles.map(vehicle => `
      <div class="fleet-suggestion-item" data-fleet="${vehicle.fleetNumber}">
        <strong>${vehicle.fleetNumber}</strong> - ${vehicle.regNo}
        <span style="color: #6c757d; font-size: 0.9rem;">
          (${vehicle.vehicleType.split(' ').slice(0, 3).join(' ')})
        </span>
      </div>
    `).join('');

    // Add click handlers
    suggestionsDiv.querySelectorAll('.fleet-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const fleetNumber = item.dataset.fleet;
        document.querySelector('#fleet-search').value = fleetNumber;
        suggestionsDiv.classList.remove('active');
        this.searchVehicle(fleetNumber);
      });
    });

    suggestionsDiv.classList.add('active');
  }

  // Search for a specific vehicle
  async searchVehicle(query) {
    if (!query) return;

    const infoPanel = document.querySelector('#fleet-info');
    infoPanel.innerHTML = '<div class="loading-spinner">Loading vehicle information...</div>';
    infoPanel.classList.add('active');

    try {
      let vehicle = null;
      
      // Use the global fleet database if available
      if (window.fleetDatabase) {
        // Try by fleet number first
        vehicle = window.fleetDatabase.getByFleetNumber(query);
        
        // If not found, try by registration
        if (!vehicle) {
          vehicle = window.fleetDatabase.getByRegistration(query);
        }
      }
      
      if (vehicle) {
        this.currentVehicle = vehicle;
        this.displayVehicleInfo(vehicle);

        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('vehicleSelected', { detail: vehicle }));
      } else {
        throw new Error('Vehicle not found');
      }
    } catch (error) {
      infoPanel.innerHTML = `
        <div class="error-message">
          <strong>Vehicle not found.</strong><br>
          Please check the fleet number or registration and try again.
        </div>
      `;
    }
  }

  // Display vehicle information
  displayVehicleInfo(vehicle) {
    const infoPanel = document.querySelector('#fleet-info');
    
    infoPanel.innerHTML = `
      <div class="vehicle-info-card">
        <div class="vehicle-info-header">
          <div>
            <span class="vehicle-fleet-number">${vehicle.fleetNumber}</span>
            <span class="depot-badge">${vehicle.depot}</span>
          </div>
          <span class="vehicle-reg">${vehicle.regNo}</span>
        </div>

        <div class="vehicle-info-grid">
          <div class="info-section">
            <h4>Vehicle Details</h4>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">${vehicle.vehicleTypeCategory}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Engine:</span>
              <span class="info-value">${vehicle.engineType}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Euro Rating:</span>
              <span class="info-value">${vehicle.euroRating}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span class="info-value">${vehicle.age ? vehicle.age + ' years' : 'Unknown'}</span>
            </div>
          </div>

          <div class="info-section">
            <h4>Breakdown Guide</h4>
            <div class="info-item">
              <span class="info-label">Common Issues:</span>
              <span class="info-value">${this.getCommonIssues(vehicle.vehicleTypeCategory)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Priority Systems:</span>
              <span class="info-value">${this.getPrioritySystems(vehicle.engineType)}</span>
            </div>
          </div>
        </div>

        <div class="vehicle-type-full">
          <strong>Full Type:</strong> ${vehicle.vehicleType}
        </div>
      </div>
    `;

    infoPanel.classList.add('active');
  }

  // Get common issues for vehicle type
  getCommonIssues(vehicleType) {
    const issues = {
      'Streetlite': 'Door sensors, Ramp',
      'Streetdeck': 'Air suspension, CCTV',
      'Volvo B9TL': 'Gearbox temp, Cooling',
      'Enviro 400': 'AdBlue, DPF',
      'Solo': 'Steering, Electrics',
      'Versa': 'Doors, Heating'
    };
    return issues[vehicleType] || 'General maintenance';
  }

  // Get priority systems for engine type
  getPrioritySystems(engineType) {
    const systems = {
      'Cummins ISBe': 'SCR, Turbo',
      'Mercedes OM934': 'EGR, Injectors',
      'Mercedes OM936': 'DPF, AdBlue',
      'Volvo D9B': 'Cooling, Gearbox',
      'Mercedes OM904': 'Fuel system'
    };
    return systems[engineType] || 'Standard checks';
  }

  // Get current vehicle
  getCurrentVehicle() {
    return this.currentVehicle;
  }
}

// Initialize and expose globally - only in browser environment
if (typeof window !== 'undefined') {
  window.FleetLookupComponent = FleetLookupComponent;
}

// Auto-initialize if breakdown guide is present - only in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the breakdown guide page
  if (document.querySelector('.breakdown-guide-container') || 
      document.querySelector('#breakdown-guide-root')) {
    
    // Create and insert the fleet lookup component
    const fleetLookup = new FleetLookupComponent();
    const lookupUI = fleetLookup.createLookupUI();
    
    // Find suitable insertion point
    const insertPoint = document.querySelector('.breakdown-guide-header') ||
                       document.querySelector('.guide-container') ||
                       document.querySelector('#breakdown-guide-root');
    
    if (insertPoint) {
      insertPoint.parentNode.insertBefore(lookupUI, insertPoint.nextSibling);
      console.log('✅ Fleet lookup component initialized');
    }
  }
  });
