// backend/services/supervisorSync.js
// WebSocket service for real-time synchronization between supervisor and display screens

import { WebSocketServer } from 'ws';
import supervisorManager from './supervisorManager.js';

class SupervisorSyncService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of clientId -> { ws, type, supervisorId, lastPing }
    this.displayState = {
      alerts: [],
      acknowledgedAlerts: new Set(),
      priorityOverrides: new Map(), // alertId -> priority
      supervisorNotes: new Map(), // alertId -> note
      customMessages: [],
      activeMode: 'normal', // normal, emergency, maintenance
      lastUpdated: new Date().toISOString()
    };
    this.pingInterval = null;
  }

  // Initialize WebSocket server
  initialize(server) {
    console.log('🔌 Initializing Supervisor Sync WebSocket service...');
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/supervisor-sync'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start ping interval to check client health
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000); // Every 30 seconds

    console.log('✅ Supervisor Sync WebSocket service initialized');
  }

  // Handle new WebSocket connection
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientIp = req.socket.remoteAddress;
    
    console.log(`🔌 New WebSocket connection: ${clientId} from ${clientIp}`);

    // Set up client
    const client = {
      ws,
      id: clientId,
      type: null, // 'supervisor' or 'display'
      supervisorId: null,
      sessionId: null,
      connectedAt: new Date().toISOString(),
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString()
    });

    // Set up event handlers
    ws.on('message', (message) => {
      this.handleMessage(clientId, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error.message);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
      }
    });
  }

  // Handle incoming WebSocket messages
  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);
      
      if (!client) {
        console.error(`❌ Client ${clientId} not found`);
        return;
      }

      console.log(`📨 Message from ${clientId}:`, data.type);

      switch (data.type) {
        case 'auth':
          this.handleAuth(clientId, data);
          break;
        
        case 'acknowledge_alert':
          this.handleAcknowledgeAlert(clientId, data);
          break;
        
        case 'update_priority':
          this.handlePriorityUpdate(clientId, data);
          break;
        
        case 'add_note':
          this.handleAddNote(clientId, data);
          break;
        
        case 'broadcast_message':
          this.handleBroadcastMessage(clientId, data);
          break;
        
        case 'request_state':
          this.handleStateRequest(clientId);
          break;
        
        case 'update_alerts':
          this.handleAlertsUpdate(clientId, data);
          break;
        
        case 'set_mode':
          this.handleModeChange(clientId, data);
          break;
        
        case 'clear_message':
          this.handleClearMessage(clientId, data);
          break;
        
        case 'ping':
          this.sendToClient(client.ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        
        default:
          console.warn(`⚠️ Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`❌ Error handling message from ${clientId}:`, error.message);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  // Handle client authentication
  handleAuth(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { clientType, supervisorId, sessionId } = data;

    if (clientType === 'supervisor') {
      // Validate supervisor session
      const validation = supervisorManager.validateSupervisorSession(sessionId);
      
      if (validation.success) {
        client.type = 'supervisor';
        client.supervisorId = supervisorId;
        client.sessionId = sessionId;
        
        console.log(`✅ Supervisor ${supervisorId} authenticated`);
        
        this.sendToClient(client.ws, {
          type: 'auth_success',
          supervisor: validation.supervisor,
          currentState: this.getDisplayState(),
          connectedDisplays: this.getConnectedDisplays().length
        });

        // Notify displays of supervisor connection
        this.broadcastToDisplays({
          type: 'supervisor_connected',
          supervisorId,
          supervisorName: validation.supervisor.name
        });
      } else {
        this.sendToClient(client.ws, {
          type: 'auth_failed',
          error: validation.error
        });
      }
    } else if (clientType === 'display') {
      client.type = 'display';
      
      console.log(`✅ Display screen connected`);
      
      this.sendToClient(client.ws, {
        type: 'auth_success',
        currentState: this.getDisplayState(),
        connectedSupervisors: this.getConnectedSupervisors().length
      });

      // Notify supervisors of new display connection
      this.broadcastToSupervisors({
        type: 'display_connected',
        displayCount: this.getConnectedDisplays().length
      });
    }
  }

  // Handle alert acknowledgment
  handleAcknowledgeAlert(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can acknowledge alerts');
      return;
    }

    const { alertId, reason, notes } = data;
    
    // Record acknowledgment in supervisor manager
    const result = supervisorManager.dismissAlert(alertId, client.sessionId, reason, notes);
    
    if (result.success) {
      // Update display state
      this.displayState.acknowledgedAlerts.add(alertId);
      if (notes) {
        this.displayState.supervisorNotes.set(alertId, {
          supervisorId: client.supervisorId,
          note: notes,
          timestamp: new Date().toISOString()
        });
      }
      this.displayState.lastUpdated = new Date().toISOString();

      // Broadcast to all clients
      this.broadcast({
        type: 'alert_acknowledged',
        alertId,
        supervisorId: client.supervisorId,
        reason,
        notes,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Alert ${alertId} acknowledged by ${client.supervisorId}`);
    } else {
      this.sendError(clientId, result.error);
    }
  }

  // Handle priority update
  handlePriorityUpdate(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can update priorities');
      return;
    }

    const { alertId, priority, reason } = data;
    
    // Update display state
    this.displayState.priorityOverrides.set(alertId, {
      priority,
      supervisorId: client.supervisorId,
      reason,
      timestamp: new Date().toISOString()
    });
    this.displayState.lastUpdated = new Date().toISOString();

    // Broadcast to all clients
    this.broadcast({
      type: 'priority_updated',
      alertId,
      priority,
      supervisorId: client.supervisorId,
      reason,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Alert ${alertId} priority updated to ${priority} by ${client.supervisorId}`);
  }

  // Handle adding notes to alerts
  handleAddNote(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can add notes');
      return;
    }

    const { alertId, note } = data;
    
    // Update display state
    this.displayState.supervisorNotes.set(alertId, {
      supervisorId: client.supervisorId,
      note,
      timestamp: new Date().toISOString()
    });
    this.displayState.lastUpdated = new Date().toISOString();

    // Broadcast to all clients
    this.broadcast({
      type: 'note_added',
      alertId,
      supervisorId: client.supervisorId,
      note,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Note added to alert ${alertId} by ${client.supervisorId}`);
  }

  // Handle broadcast messages
  handleBroadcastMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can broadcast messages');
      return;
    }

    const { message, priority = 'info', duration = 30000 } = data;
    
    const broadcastMessage = {
      id: this.generateMessageId(),
      message,
      priority,
      supervisorId: client.supervisorId,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration).toISOString()
    };

    // Add to display state
    this.displayState.customMessages.push(broadcastMessage);
    this.displayState.lastUpdated = new Date().toISOString();

    // Broadcast to all clients
    this.broadcast({
      type: 'custom_message',
      message: broadcastMessage
    });

    // Auto-remove message after duration
    setTimeout(() => {
      this.removeMessage(broadcastMessage.id);
    }, duration);

    console.log(`✅ Message broadcast by ${client.supervisorId}: ${message}`);
  }

  // Handle state request
  handleStateRequest(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendToClient(client.ws, {
      type: 'state_update',
      state: this.getDisplayState(),
      timestamp: new Date().toISOString()
    });
  }

  // Handle alerts update from supervisor
  handleAlertsUpdate(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can update alerts');
      return;
    }

    const { alerts } = data;
    
    // Update display state
    this.displayState.alerts = alerts;
    this.displayState.lastUpdated = new Date().toISOString();

    // Broadcast to displays only
    this.broadcastToDisplays({
      type: 'alerts_updated',
      alerts,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Alerts updated by ${client.supervisorId}: ${alerts.length} alerts`);
  }

  // Handle mode change
  handleModeChange(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can change mode');
      return;
    }

    const { mode, reason } = data;
    
    // Update display state
    this.displayState.activeMode = mode;
    this.displayState.lastUpdated = new Date().toISOString();

    // Broadcast to all clients
    this.broadcast({
      type: 'mode_changed',
      mode,
      supervisorId: client.supervisorId,
      reason,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Display mode changed to ${mode} by ${client.supervisorId}`);
  }

  // Handle clearing custom messages
  handleClearMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'supervisor') {
      this.sendError(clientId, 'Unauthorized: Only supervisors can clear messages');
      return;
    }

    const { messageId } = data;
    this.removeMessage(messageId);
    
    console.log(`✅ Message ${messageId} cleared by ${client.supervisorId}`);
  }

  // Handle client disconnection
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`🔌 Client disconnected: ${clientId} (${client.type})`);
    
    this.clients.delete(clientId);

    if (client.type === 'supervisor') {
      // Notify displays of supervisor disconnection
      this.broadcastToDisplays({
        type: 'supervisor_disconnected',
        supervisorId: client.supervisorId,
        remainingSupervisors: this.getConnectedSupervisors().length
      });
    } else if (client.type === 'display') {
      // Notify supervisors of display disconnection
      this.broadcastToSupervisors({
        type: 'display_disconnected',
        remainingDisplays: this.getConnectedDisplays().length
      });
    }
  }

  // Remove a message
  removeMessage(messageId) {
    const index = this.displayState.customMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.displayState.customMessages.splice(index, 1);
      this.displayState.lastUpdated = new Date().toISOString();
      
      this.broadcast({
        type: 'message_removed',
        messageId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ping all clients to check health
  pingClients() {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing > timeout) {
        console.log(`⚠️ Client ${clientId} timed out`);
        client.ws.terminate();
        this.handleDisconnection(clientId);
      } else {
        client.ws.ping();
      }
    }
  }

  // Send message to specific client
  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Send error to specific client
  sendError(clientId, error) {
    const client = this.clients.get(clientId);
    if (client) {
      this.sendToClient(client.ws, {
        type: 'error',
        error,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast to all connected clients
  broadcast(data) {
    const message = JSON.stringify(data);
    
    for (const client of this.clients.values()) {
      if (client.ws.readyState === client.ws.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Broadcast to supervisors only
  broadcastToSupervisors(data) {
    const message = JSON.stringify(data);
    
    for (const client of this.clients.values()) {
      if (client.type === 'supervisor' && client.ws.readyState === client.ws.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Broadcast to displays only
  broadcastToDisplays(data) {
    const message = JSON.stringify(data);
    
    for (const client of this.clients.values()) {
      if (client.type === 'display' && client.ws.readyState === client.ws.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Get current display state
  getDisplayState() {
    return {
      ...this.displayState,
      acknowledgedAlerts: Array.from(this.displayState.acknowledgedAlerts),
      priorityOverrides: Object.fromEntries(this.displayState.priorityOverrides),
      supervisorNotes: Object.fromEntries(this.displayState.supervisorNotes),
      connectedSupervisors: this.getConnectedSupervisors().length,
      connectedDisplays: this.getConnectedDisplays().length
    };
  }

  // Get connected supervisors
  getConnectedSupervisors() {
    return Array.from(this.clients.values())
      .filter(client => client.type === 'supervisor')
      .map(client => ({
        supervisorId: client.supervisorId,
        connectedAt: client.connectedAt
      }));
  }

  // Get connected displays
  getConnectedDisplays() {
    return Array.from(this.clients.values())
      .filter(client => client.type === 'display')
      .map(client => ({
        clientId: client.id,
        connectedAt: client.connectedAt
      }));
  }

  // Generate unique client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update alerts from external source (called by alert fetching service)
  updateAlerts(alerts) {
    this.displayState.alerts = alerts;
    this.displayState.lastUpdated = new Date().toISOString();
    
    // Broadcast to all clients
    this.broadcast({
      type: 'alerts_updated',
      alerts,
      source: 'system',
      timestamp: new Date().toISOString()
    });
  }

  // Get sync statistics
  getStats() {
    return {
      connectedClients: this.clients.size,
      supervisors: this.getConnectedSupervisors().length,
      displays: this.getConnectedDisplays().length,
      acknowledgedAlerts: this.displayState.acknowledgedAlerts.size,
      priorityOverrides: this.displayState.priorityOverrides.size,
      supervisorNotes: this.displayState.supervisorNotes.size,
      customMessages: this.displayState.customMessages.length,
      activeMode: this.displayState.activeMode,
      lastUpdated: this.displayState.lastUpdated
    };
  }

  // Cleanup on shutdown
  shutdown() {
    console.log('🔌 Shutting down Supervisor Sync service...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    for (const client of this.clients.values()) {
      client.ws.close(1000, 'Server shutting down');
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log('✅ Supervisor Sync service shut down');
  }
}

// Create singleton instance
const supervisorSyncService = new SupervisorSyncService();

export default supervisorSyncService;