/**
 * Depot Contact Information
 * Quick reference for engineering dispatch and coordination
 *
 * In a DEMO session (public demo account) these all resolve to the
 * fictional depot list + obviously-fake extension numbers instead of the
 * real GNE depot names/numbers, so the pitch never leaks real internal
 * contact details. Real supervisor sessions are unaffected.
 */

import { isDemoSession } from '../config/demoDepots';

export const DEPOT_CONTACTS = {
  WASHINGTON: {
    name: 'Washington',
    contacts: [
      { role: 'Engineering Manager', number: '6327', fullNumber: 'tel:6327' },
      { role: 'Yardman', number: '6123', fullNumber: 'tel:6123' }
    ]
  },
  RIVERSIDE: {
    name: 'Riverside',
    contacts: [
      { role: 'Engineering', number: '0888', fullNumber: 'tel:0888' },
      { role: 'Yardman', number: '9254', fullNumber: 'tel:9254' }
    ]
  },
  PERCY_MAIN: {
    name: 'Percy Main',
    contacts: [
      { role: 'Engineering', number: '9413', fullNumber: 'tel:9413' },
      { role: 'Depot', number: '9242', fullNumber: 'tel:9242' }
    ]
  },
  SUNDERLAND: {
    name: 'Sunderland',
    contacts: [
      { role: 'Engineering', number: '9299', fullNumber: 'tel:9299' },
      { role: 'Depot', number: '9296', fullNumber: 'tel:9296' }
    ]
  },
  CONSETT: {
    name: 'Consett',
    contacts: [
      { role: 'Engineering', number: '9286', fullNumber: 'tel:9286' },
      { role: 'Yardman', number: '9287', fullNumber: 'tel:9287' }
    ]
  },
  DEPTFORD: {
    name: 'Deptford',
    contacts: []
  },
  HEXHAM: {
    name: 'Hexham',
    contacts: []
  }
};

// Fictional demo depot contact table — keyed like DEPOT_CONTACTS but using
// the canonical DEMO_DEPOTS names and clearly-fake placeholder extensions
// (the 0100-block is the standard "this number is fictional" convention).
const DEMO_DEPOT_CONTACTS = {
  EASTFIELD: {
    name: 'Eastfield',
    contacts: [
      { role: 'Engineering Manager', number: '0100', fullNumber: 'tel:0100' },
      { role: 'Yardman', number: '0101', fullNumber: 'tel:0101' }
    ]
  },
  NORTHGATE: {
    name: 'Northgate',
    contacts: [
      { role: 'Engineering', number: '0102', fullNumber: 'tel:0102' },
      { role: 'Yardman', number: '0103', fullNumber: 'tel:0103' }
    ]
  },
  HARBOURSIDE: {
    name: 'Harbourside',
    contacts: [
      { role: 'Engineering', number: '0104', fullNumber: 'tel:0104' },
      { role: 'Depot', number: '0105', fullNumber: 'tel:0105' }
    ]
  },
  HILLCREST: {
    name: 'Hillcrest',
    contacts: [
      { role: 'Engineering', number: '0106', fullNumber: 'tel:0106' },
      { role: 'Yardman', number: '0107', fullNumber: 'tel:0107' }
    ]
  },
  SOUTHBANK: {
    name: 'Southbank',
    contacts: [
      { role: 'Engineering', number: '0108', fullNumber: 'tel:0108' },
      { role: 'Depot', number: '0109', fullNumber: 'tel:0109' }
    ]
  },
  WESTMOOR: {
    name: 'Westmoor',
    contacts: []
  }
};

// Maps the real depot keys used above onto the fictional demo depot keys,
// so any code that already has a real depotId (e.g. from getDepotByFleetNumber)
// still resolves to a fictional depot/contacts in a demo session.
const REAL_TO_DEMO_KEY = {
  WASHINGTON: 'EASTFIELD',
  RIVERSIDE: 'NORTHGATE',
  PERCY_MAIN: 'HARBOURSIDE',
  SUNDERLAND: 'SOUTHBANK',
  CONSETT: 'HILLCREST',
  DEPTFORD: 'SOUTHBANK',
  HEXHAM: 'WESTMOOR'
};

/**
 * Get contacts for a specific depot
 * @param {string} depotId - Depot identifier (e.g., 'WASHINGTON')
 * @returns {Array} Array of contact objects
 */
export const getDepotContacts = (depotId) => {
  if (isDemoSession()) {
    const demoKey = DEMO_DEPOT_CONTACTS[depotId] ? depotId : REAL_TO_DEMO_KEY[depotId];
    const depot = DEMO_DEPOT_CONTACTS[demoKey];
    return depot ? depot.contacts : [];
  }
  const depot = DEPOT_CONTACTS[depotId];
  return depot ? depot.contacts : [];
};

/**
 * Get depot name
 * @param {string} depotId - Depot identifier
 * @returns {string} Formatted depot name
 */
export const getDepotName = (depotId) => {
  if (isDemoSession()) {
    const demoKey = DEMO_DEPOT_CONTACTS[depotId] ? depotId : REAL_TO_DEMO_KEY[depotId];
    const depot = DEMO_DEPOT_CONTACTS[demoKey];
    return depot ? depot.name : depotId;
  }
  const depot = DEPOT_CONTACTS[depotId];
  return depot ? depot.name : depotId;
};

/**
 * Find depot by fleet number (basic depot detection)
 * the operator fleet allocation:
 * - Washington: 5xxx, 6xxx
 * - Riverside: 3xxx, 8xxx
 * - Percy Main: 4xxx
 * - Sunderland: 2xxx
 * - Consett: 7xxx
 * - Deptford: 9xxx
 *
 * In a demo session, resolves to the equivalent fictional depot key
 * instead (same digit scheme, fictional names).
 */
export const getDepotByFleetNumber = (fleetNumber) => {
  if (!fleetNumber) return null;

  const fleetNum = String(fleetNumber);
  const firstDigit = fleetNum.charAt(0);

  const fleetMapping = {
    '2': 'SUNDERLAND',
    '3': 'RIVERSIDE',
    '4': 'PERCY_MAIN',
    '5': 'WASHINGTON',
    '6': 'WASHINGTON',
    '7': 'CONSETT',
    '8': 'RIVERSIDE',
    '9': 'DEPTFORD'
  };

  const realKey = fleetMapping[firstDigit] || null;
  if (!realKey) return null;

  return isDemoSession() ? (REAL_TO_DEMO_KEY[realKey] || null) : realKey;
};

/**
 * Get the full depot contacts table appropriate for the current session
 * (fictional table in a demo session, real table otherwise). Prefer this
 * over importing DEPOT_CONTACTS directly when iterating "all depots".
 */
export const getDepotContactsTable = () => {
  return isDemoSession() ? DEMO_DEPOT_CONTACTS : DEPOT_CONTACTS;
};

/**
 * Get all depot contacts as a flat list
 */
export const getAllContacts = () => {
  const table = isDemoSession() ? DEMO_DEPOT_CONTACTS : DEPOT_CONTACTS;
  return Object.entries(table).flatMap(([depotId, depot]) =>
    depot.contacts.map(contact => ({
      ...contact,
      depot: depot.name,
      depotId
    }))
  );
};
