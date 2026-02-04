/*
 * Breakdown Tracker Component
 * Allows supervisors to log and track breakdowns with timed stages
 * Part of Go BARRY Breakdown Guide Enhancement
 */

class BreakdownTracker {
  constructor() {
    this.activeBreakdowns = [];
    this.currentBreakdown = null;
    this.supervisorBadge = localStorage.getItem('supervisorBadge') || '';
    this.supervisorName = localStorage.getItem('supervisorName') || '';
    this.updateInterval = null;
    this.apiBase = window.CONFIG?.API_BASE || 'https://api.breakdowns.gobarry.co.uk';
  }

  // Initialize the tracker
  init() {
    this.loadActiveBreakdowns();
    this.startLiveUpdates();
    this.renderUI();
  }

  // Load active breakdowns from API
  async loadActiveBreakdowns() {
    try {
      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/active`);
      const data = await response.json();
      
      if (data.success) {
        this.activeBreakdowns = data.breakdowns;
        this.updateActiveBreakdownsDisplay();
      }
    } catch (error) {
      console.error('Error loading active breakdowns:', error);
    }
  }

  // Create new breakdown
  async createBreakdown(vehicleId, routeId, serviceNumber, location) {
    try {
      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          route_id: routeId,
          service_number: serviceNumber,
          location: location,
          supervisor_badge: this.supervisorBadge,
          supervisor_name: this.supervisorName,
          initial_notes: `Breakdown reported at ${location || 'unknown location'}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentBreakdown = data.data;
        this.showSuccessMessage('Breakdown logged - timer started');
        this.loadActiveBreakdowns();
        return data.breakdown_id;
      }
    } catch (error) {
      console.error('Error creating breakdown:', error);
      this.showErrorMessage('Failed to log breakdown');
    }
    return null;
  }

  // Update breakdown stage
  async updateBreakdownStage(breakdownId, eventType, notes, metadata = {}) {
    try {
      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/${breakdownId}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          by_badge: this.supervisorBadge,
          by_name: this.supervisorName,
          notes: notes,
          metadata: metadata,
          severity: metadata.severity || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showSuccessMessage(`Stage updated: ${eventType}`);
        this.loadActiveBreakdowns();
        return true;
      }
    } catch (error) {
      console.error('Error updating breakdown stage:', error);
      this.showErrorMessage('Failed to update breakdown stage');
    }
    return false;
  }

  // Render the UI
  renderUI() {
    const container = document.getElementById('breakdown-tracker-container');
    if (!container) return;

    container.innerHTML = `
      <div class="breakdown-tracker">
        <!-- Quick Log Section -->
        <div class="tracker-section quick-log">
          <h3>🚨 Log New Breakdown</h3>
          <div class="quick-log-form">
            <input type="text" id="tracker-vehicle-id" placeholder="Vehicle ID (e.g., 6301)" class="tracker-input" />
            <input type="text" id="tracker-route-id" placeholder="Route (e.g., 21)" class="tracker-input" />
            <input type="text" id="tracker-service" placeholder="Service (e.g., 07:45)" class="tracker-input" />
            <input type="text" id="tracker-location" placeholder="Location" class="tracker-input" />
            <button onclick="breakdownTracker.quickLogBreakdown()" class="tracker-btn primary">
              Start Timer
            </button>
          </div>
        </div>

        <!-- Active Breakdowns -->
        <div class="tracker-section active-breakdowns">
          <h3>⏱️ Active Breakdowns</h3>
          <div id="active-breakdowns-list" class="breakdowns-list">
            <!-- Populated dynamically -->
          </div>
        </div>

        <!-- Stage Update Panel -->
        <div id="stage-update-panel" class="tracker-section stage-panel" style="display: none;">
          <h3>📊 Update Stage</h3>
          <div class="stage-buttons">
            <button onclick="breakdownTracker.updateStage('acknowledged')" class="stage-btn acknowledge">
              ✅ Acknowledge
            </button>
            <button onclick="breakdownTracker.showDecisionPanel()" class="stage-btn decision">
              🎯 Record Decision
            </button>
            <button onclick="breakdownTracker.updateStage('engineer_dispatched')" class="stage-btn dispatch">
              🔧 Engineer Dispatched
            </button>
            <button onclick="breakdownTracker.updateStage('on_site')" class="stage-btn onsite">
              📍 On Site
            </button>
            <button onclick="breakdownTracker.updateStage('moving')" class="stage-btn moving">
              🚍 Vehicle Moving
            </button>
            <button onclick="breakdownTracker.updateStage('cleared')" class="stage-btn cleared">
              ✨ Cleared
            </button>
          </div>
        </div>

        <!-- Decision Panel -->
        <div id="decision-panel" class="tracker-section decision-panel" style="display: none;">
          <h3>🎯 Record Decision</h3>
          <div class="decision-options">
            <button onclick="breakdownTracker.recordDecision('STOP')" class="decision-btn stop">
              🔴 STOP - Do Not Continue
            </button>
            <button onclick="breakdownTracker.recordDecision('AMBER')" class="decision-btn amber">
              🟡 AMBER - Proceed with Caution
            </button>
            <button onclick="breakdownTracker.recordDecision('CONTINUE')" class="decision-btn continue">
              🟢 CONTINUE - Safe to Operate
            </button>
          </div>
          <textarea id="decision-notes" placeholder="Add decision notes..." class="tracker-textarea"></textarea>
        </div>
      </div>
    `;

    this.addStyles();
  }

  // Quick log breakdown
  async quickLogBreakdown() {
    const vehicleId = document.getElementById('tracker-vehicle-id').value;
    const routeId = document.getElementById('tracker-route-id').value;
    const service = document.getElementById('tracker-service').value;
    const location = document.getElementById('tracker-location').value;

    if (!vehicleId) {
      this.showErrorMessage('Vehicle ID is required');
      return;
    }

    const breakdownId = await this.createBreakdown(vehicleId, routeId, service, location);
    
    if (breakdownId) {
      // Clear form
      document.getElementById('tracker-vehicle-id').value = '';
      document.getElementById('tracker-route-id').value = '';
      document.getElementById('tracker-service').value = '';
      document.getElementById('tracker-location').value = '';
      
      // Show stage panel
      document.getElementById('stage-update-panel').style.display = 'block';
      this.currentBreakdown = { id: breakdownId };
    }
  }

  // Update active breakdowns display
  updateActiveBreakdownsDisplay() {
    const container = document.getElementById('active-breakdowns-list');
    if (!container) return;

    if (this.activeBreakdowns.length === 0) {
      container.innerHTML = '<p class="no-breakdowns">No active breakdowns</p>';
      return;
    }

    container.innerHTML = this.activeBreakdowns.map(breakdown => `
      <div class="breakdown-card ${breakdown.timer_status}" data-id="${breakdown.id}">
        <div class="breakdown-header">
          <span class="vehicle-id">🚍 ${breakdown.vehicle_id}</span>
          <span class="timer ${breakdown.timer_status}">${breakdown.formatted_time}</span>
        </div>
        <div class="breakdown-info">
          <span class="depot">📍 ${breakdown.depot_id}</span>
          ${breakdown.route_id ? `<span class="route">Route ${breakdown.route_id}</span>` : ''}
          <span class="status">${this.getStatusIcon(breakdown.status)} ${breakdown.status}</span>
        </div>
        <div class="breakdown-actions">
          <button onclick="breakdownTracker.selectBreakdown('${breakdown.id}')" class="select-btn">
            Select
          </button>
          <button onclick="breakdownTracker.viewTimeline('${breakdown.id}')" class="timeline-btn">
            Timeline
          </button>
        </div>
      </div>
    `).join('');
  }

  // Select a breakdown for updates
  selectBreakdown(breakdownId) {
    this.currentBreakdown = this.activeBreakdowns.find(b => b.id === breakdownId);
    document.getElementById('stage-update-panel').style.display = 'block';
    
    // Highlight selected
    document.querySelectorAll('.breakdown-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-id="${breakdownId}"]`).classList.add('selected');
  }

  // Update stage
  async updateStage(eventType) {
    if (!this.currentBreakdown) {
      this.showErrorMessage('Please select a breakdown first');
      return;
    }

    const notes = prompt(`Add notes for ${eventType} (optional):`);
    await this.updateBreakdownStage(this.currentBreakdown.id, eventType, notes);
  }

  // Show decision panel
  showDecisionPanel() {
    if (!this.currentBreakdown) {
      this.showErrorMessage('Please select a breakdown first');
      return;
    }
    document.getElementById('decision-panel').style.display = 'block';
  }

  // Record decision
  async recordDecision(severity) {
    if (!this.currentBreakdown) return;

    const notes = document.getElementById('decision-notes').value;
    await this.updateBreakdownStage(
      this.currentBreakdown.id, 
      'decision', 
      notes || `Decision: ${severity}`,
      { severity }
    );

    document.getElementById('decision-panel').style.display = 'none';
    document.getElementById('decision-notes').value = '';
  }

  // View breakdown timeline
  async viewTimeline(breakdownId) {
    try {
      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/${breakdownId}/timeline`);
      const data = await response.json();
      
      if (data.success) {
        this.showTimeline(data);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  }

  // Show timeline modal
  showTimeline(data) {
    const modal = document.createElement('div');
    modal.className = 'timeline-modal';
    modal.innerHTML = `
      <div class="timeline-content">
        <h3>Breakdown Timeline</h3>
        <div class="timeline-header">
          <span>Vehicle: ${data.breakdown.vehicle_id}</span>
          <span>Total: ${data.breakdown.total_duration_minutes || 'In progress'} minutes</span>
        </div>
        <div class="timeline-events">
          ${data.events.map(event => `
            <div class="timeline-event">
              <span class="event-time">${new Date(event.occurred_at).toLocaleTimeString()}</span>
              <span class="event-type">${this.getStatusIcon(event.event_type)} ${event.event_type}</span>
              <span class="event-by">${event.by_badge}</span>
              ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Get status icon
  getStatusIcon(status) {
    const icons = {
      'received': '📥',
      'acknowledged': '✅',
      'decision': '🎯',
      'dispatched': '🔧',
      'engineer_dispatched': '🔧',
      'on_site': '📍',
      'moving': '🚍',
      'cleared': '✨'
    };
    return icons[status] || '⏱️';
  }

  // Start live updates
  startLiveUpdates() {
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.loadActiveBreakdowns();
      this.updateTimers();
    }, 30000);
  }

  // Update timers locally
  updateTimers() {
    // Update displayed times without API call
    this.activeBreakdowns.forEach(breakdown => {
      breakdown.minutes_elapsed += 0.5; // Add 30 seconds
      breakdown.formatted_time = this.formatElapsedTime(breakdown.minutes_elapsed);
    });
    this.updateActiveBreakdownsDisplay();
  }

  // Format elapsed time
  formatElapsedTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Show success message
  showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Show error message
  showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Add styles
  addStyles() {
    if (document.getElementById('breakdown-tracker-styles')) return;

    const style = document.createElement('style');
    style.id = 'breakdown-tracker-styles';
    style.textContent = `
      .breakdown-tracker {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .tracker-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .tracker-section h3 {
        margin: 0 0 15px 0;
        color: #333;
      }

      .quick-log-form {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .tracker-input {
        flex: 1;
        min-width: 150px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
      }

      .tracker-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tracker-btn.primary {
        background: #007AFF;
        color: white;
      }

      .tracker-btn.primary:hover {
        background: #0051D5;
      }

      .breakdowns-list {
        display: grid;
        gap: 15px;
      }

      .breakdown-card {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        transition: all 0.2s;
      }

      .breakdown-card.selected {
        border-color: #007AFF;
        background: #f0f8ff;
      }

      .breakdown-card.green { border-left: 4px solid #4CAF50; }
      .breakdown-card.amber { border-left: 4px solid #FFC107; }
      .breakdown-card.red { border-left: 4px solid #F44336; }
      .breakdown-card.critical { 
        border-left: 4px solid #D32F2F;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }

      .breakdown-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .vehicle-id {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }

      .timer {
        font-size: 16px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .timer.green { background: #E8F5E9; color: #2E7D32; }
      .timer.amber { background: #FFF8E1; color: #F57C00; }
      .timer.red { background: #FFEBEE; color: #C62828; }
      .timer.critical { background: #C62828; color: white; }

      .breakdown-info {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
        font-size: 14px;
        color: #666;
      }

      .breakdown-actions {
        display: flex;
        gap: 10px;
      }

      .select-btn, .timeline-btn {
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }

      .select-btn:hover, .timeline-btn:hover {
        background: #f5f5f5;
      }

      .stage-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }

      .stage-btn {
        padding: 12px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .stage-btn.acknowledge { background: #E3F2FD; color: #1976D2; }
      .stage-btn.decision { background: #FFF3E0; color: #E65100; }
      .stage-btn.dispatch { background: #F3E5F5; color: #7B1FA2; }
      .stage-btn.onsite { background: #E8F5E9; color: #388E3C; }
      .stage-btn.moving { background: #E0F2F1; color: #00796B; }
      .stage-btn.cleared { background: #F1F8E9; color: #558B2F; }

      .stage-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .decision-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 15px;
      }

      .decision-btn {
        padding: 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
      }

      .decision-btn.stop { background: #FFCDD2; color: #B71C1C; }
      .decision-btn.amber { background: #FFE082; color: #F57F17; }
      .decision-btn.continue { background: #C8E6C9; color: #1B5E20; }

      .tracker-textarea {
        width: 100%;
        min-height: 80px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        resize: vertical;
      }

      .timeline-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .timeline-content {
        background: white;
        border-radius: 12px;
        padding: 25px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .timeline-events {
        margin: 20px 0;
      }

      .timeline-event {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 15px;
        padding: 10px;
        border-bottom: 1px solid #eee;
      }

      .event-notes {
        grid-column: 1 / -1;
        font-size: 13px;
        color: #666;
        margin-top: 5px;
      }

      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s;
      }

      .toast.success { background: #4CAF50; }
      .toast.error { background: #F44336; }

      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      .no-breakdowns {
        text-align: center;
        color: #999;
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  // Cleanup
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize tracker
const breakdownTracker = new BreakdownTracker();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BreakdownTracker;
}