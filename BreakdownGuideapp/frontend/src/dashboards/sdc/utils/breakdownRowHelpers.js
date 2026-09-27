/**
 * Shared display-formatting helpers for the compact breakdown triage row
 * (centre column of the Operations command centre) and the map popups.
 *
 * These mirror the equivalent logic inside SDCBreakdownCardEnhanced.jsx so
 * the row and the detail drawer never disagree about fleet number, decision
 * text or status label. Kept intentionally small/pure (no JSX) so it can be
 * imported from plain list-rendering code as well as components.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

// Fleet numbers should be 3-5 digits (like 6301, 5401, etc.)
export const isValidFleetNumber = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^\d{3,5}$/.test(trimmed);
};

export const getFleetNumber = (breakdown) => {
  const candidates = [
    breakdown.fleet_no,
    breakdown.fleet_number,
    breakdown.vehicle?.fleet_number,
    breakdown.vehicle?.fleetNumber,
    breakdown.fleetNumber
  ];
  return candidates.find(isValidFleetNumber) || 'Unknown';
};

export const getSimplifiedVehicleType = (vehicleType) => {
  if (!vehicleType) return null;
  const lower = vehicleType.toLowerCase();
  if (lower.includes('streetdeck')) return 'StreetDeck';
  if (lower.includes('streetlite')) return 'Streetlite';
  if (lower.includes('enviro')) return 'Enviro';
  if (lower.includes('versa')) return 'Versa';
  if (lower.includes('solo')) return 'Solo';
  if (lower.includes('omnidekka')) return 'Omnidekka';
  return vehicleType.split(' ')[0] || vehicleType;
};

export const getVehicleType = (breakdown) =>
  breakdown.vehicle_type ||
  breakdown.vehicleType ||
  breakdown.vehicle?.vehicleType ||
  breakdown.vehicle?.type ||
  breakdown.type ||
  null;

export const getDepot = (breakdown) =>
  breakdown.depot ||
  breakdown.depot_id ||
  breakdown.vehicle?.depot ||
  breakdown.depot_name ||
  'Unknown';

// Some rows store malformed values (e.g. "[object Object]") - filter those out.
export const cleanText = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  const str = typeof value === 'string' ? value : String(value);
  const trimmed = str.trim();
  if (!trimmed) return fallback;
  const lower = trimmed.toLowerCase();
  if (lower === '[object object]' || lower === 'null' || lower === 'undefined') return fallback;
  return trimmed;
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export const getIssueType = (breakdown) => {
  const raw = cleanText(breakdown.issue_category)
    || cleanText(breakdown.issue_type)
    || cleanText(breakdown.wizard_type?.replace(/Wizard$/i, ''))
    || 'General';
  return capitalizeWords(raw);
};

// decisionKey: 'stop' | 'amber' | 'continue' | 'pending'
export const getDecisionInfo = (breakdown) => {
  const decision = (breakdown.decision || breakdown.severity || breakdown.wizard_decision || '').toUpperCase();
  switch (decision) {
    case 'STOP':
      return { key: 'stop', text: 'STOP', className: 'sdc-decision-stop' };
    case 'AMBER':
      return { key: 'amber', text: 'AMBER', className: 'sdc-decision-amber' };
    case 'CONTINUE':
      return { key: 'continue', text: 'CONTINUE', className: 'sdc-decision-continue' };
    default:
      return { key: 'pending', text: 'PENDING', className: 'sdc-decision-pending' };
  }
};

// Higher rank = more urgent. Used to sort the centre list "most urgent first".
export const getSeverityRank = (breakdown) => {
  const key = getDecisionInfo(breakdown).key;
  switch (key) {
    case 'stop': return 3;
    case 'amber': return 2;
    case 'pending': return 1;
    case 'continue':
    default: return 0;
  }
};

export const getStatusLabel = (breakdown) => {
  if (breakdown.engineer_on_site_at) return 'Engineer On Site';
  if (breakdown.engineer_dispatched_at) return 'Engineer Dispatched';
  const stageLabels = {
    received: 'Received',
    acknowledged: 'Acknowledged',
    decision: 'Decision Made',
    engineering: 'Engineering',
    resolved: 'Resolved',
    active: 'Active'
  };
  const stage = (cleanText(breakdown.currentStage) || cleanText(breakdown.status) || 'received').toLowerCase();
  return stageLabels[stage] || capitalizeWords(stage.replace(/[_-]+/g, ' '));
};

export const getLocationSummary = (breakdown) => {
  const location = breakdown.location || '';
  const parts = location.split(',').map(p => p.trim()).filter(Boolean);
  const primary = parts[0] || location;
  return cleanText(breakdown.location_description)
    || cleanText(primary)
    || cleanText(breakdown.wizard_assessment_data?.location)
    || 'Location TBC';
};

export const formatElapsed = (minutes) => {
  if (!minutes && minutes !== 0) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h${mins}m`;
  return `${mins}m`;
};

// Simple text match across the fields a supervisor is likely to search by.
export const matchesSearch = (breakdown, query) => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    getFleetNumber(breakdown),
    breakdown.route_id,
    breakdown.location,
    breakdown.location_description,
    getIssueType(breakdown),
    getDepot(breakdown)
  ];
  return haystacks.some(v => v && String(v).toLowerCase().includes(q));
};
