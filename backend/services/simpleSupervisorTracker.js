// Simple supervisor tracking service using local file storage
// This replaces the complex in-memory system with a simpler, more reliable approach

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File to store active supervisors
const ACTIVE_SUPERVISORS_FILE = path.join(__dirname, '..', 'data', 'active-supervisors.json');

// Supervisor data
const SUPERVISORS = {
  'supervisor001': { id: 'supervisor001', name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor' },
  'supervisor002': { id: 'supervisor002', name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor' },
  'supervisor003': { id: 'supervisor003', name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin' },
  'supervisor004': { id: 'supervisor004', name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor' },
  'supervisor005': { id: 'supervisor005', name: 'David Hall', badge: 'DH005', role: 'Supervisor' },
  'supervisor006': { id: 'supervisor006', name: 'James Daglish', badge: 'JD006', role: 'Supervisor' },
  'supervisor007': { id: 'supervisor007', name: 'John Paterson', badge: 'JP007', role: 'Supervisor' },
  'supervisor008': { id: 'supervisor008', name: 'Simon Glass', badge: 'SG008', role: 'Supervisor' },
  'supervisor009': { id: 'supervisor009', name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller' }
};

// Load active supervisors from file
async function loadActiveSupervisors() {
  try {
    const data = await fs.readFile(ACTIVE_SUPERVISORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Save active supervisors to file
async function saveActiveSupervisors(supervisors) {
  try {
    await fs.writeFile(ACTIVE_SUPERVISORS_FILE, JSON.stringify(supervisors, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to save active supervisors:', error);
    return false;
  }
}

// Clean up expired sessions (10 minute timeout)
async function cleanupExpiredSessions() {
  const supervisors = await loadActiveSupervisors();
  const now = Date.now();
  const timeout = 10 * 60 * 1000; // 10 minutes
  let changed = false;

  for (const [sessionId, session] of Object.entries(supervisors)) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > timeout) {
      console.log(`⏰ Removing expired session for ${session.name}`);
      delete supervisors[sessionId];
      changed = true;
    }
  }

  if (changed) {
    await saveActiveSupervisors(supervisors);
  }
}

// Login supervisor
export async function loginSupervisor(supervisorId, badge) {
  const supervisor = SUPERVISORS[supervisorId];
  
  if (!supervisor || supervisor.badge !== badge) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Clean up expired sessions first
  await cleanupExpiredSessions();

  // Create session
  const sessionId = `session_${supervisorId}_${Date.now()}`;
  const session = {
    sessionId,
    supervisorId: supervisor.id,
    name: supervisor.name,
    badge: supervisor.badge,
    role: supervisor.role,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  // Load existing sessions
  const supervisors = await loadActiveSupervisors();
  
  // Remove any existing sessions for this supervisor
  for (const [id, s] of Object.entries(supervisors)) {
    if (s.supervisorId === supervisorId) {
      delete supervisors[id];
    }
  }

  // Add new session
  supervisors[sessionId] = session;
  
  // Save to file
  await saveActiveSupervisors(supervisors);
  
  console.log(`✅ ${supervisor.name} logged in successfully`);
  
  return {
    success: true,
    sessionId,
    supervisor: {
      id: supervisor.id,
      name: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role
    }
  };
}

// Get active supervisors
export async function getActiveSupervisors() {
  // Clean up expired sessions first
  await cleanupExpiredSessions();
  
  const supervisors = await loadActiveSupervisors();
  const active = Object.values(supervisors).map(s => ({
    supervisorId: s.supervisorId,
    name: s.name,
    sessionStart: s.loginTime,
    lastActivity: s.lastActivity
  }));
  
  console.log(`📊 Active supervisors: ${active.length}`);
  return active;
}

// Update session activity
export async function updateActivity(sessionId) {
  const supervisors = await loadActiveSupervisors();
  
  if (supervisors[sessionId]) {
    supervisors[sessionId].lastActivity = new Date().toISOString();
    await saveActiveSupervisors(supervisors);
    return true;
  }
  
  return false;
}

// Logout supervisor
export async function logoutSupervisor(sessionId) {
  const supervisors = await loadActiveSupervisors();
  
  if (supervisors[sessionId]) {
    const name = supervisors[sessionId].name;
    delete supervisors[sessionId];
    await saveActiveSupervisors(supervisors);
    console.log(`🚪 ${name} logged out`);
    return { success: true };
  }
  
  return { success: false, error: 'Session not found' };
}

// Validate session
export async function validateSession(sessionId) {
  const supervisors = await loadActiveSupervisors();
  const session = supervisors[sessionId];
  
  if (!session) {
    return { success: false, error: 'Invalid session' };
  }
  
  // Check if session expired
  const now = Date.now();
  const lastActivity = new Date(session.lastActivity).getTime();
  const timeout = 10 * 60 * 1000; // 10 minutes
  
  if (now - lastActivity > timeout) {
    delete supervisors[sessionId];
    await saveActiveSupervisors(supervisors);
    return { success: false, error: 'Session expired' };
  }
  
  // Update activity
  session.lastActivity = new Date().toISOString();
  await saveActiveSupervisors(supervisors);
  
  return {
    success: true,
    supervisor: {
      id: session.supervisorId,
      name: session.name,
      badge: session.badge,
      role: session.role
    }
  };
}

export default {
  loginSupervisor,
  getActiveSupervisors,
  updateActivity,
  logoutSupervisor,
  validateSession
};
