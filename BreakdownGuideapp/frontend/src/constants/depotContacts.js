/**
 * Depot Contact Information
 * Quick reference for engineering dispatch and coordination
 */

export const DEPOT_CONTACTS = {
  WASHINGTON: {
    name: 'Washington',
    contacts: [
      { role: 'Yardman', number: '6123', fullNumber: 'tel:6123' },
      { role: 'Engineering Manager', number: '6327', fullNumber: 'tel:6327' }
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

/**
 * Get contacts for a specific depot
 * @param {string} depotId - Depot identifier (e.g., 'WASHINGTON')
 * @returns {Array} Array of contact objects
 */
export const getDepotContacts = (depotId) => {
  const depot = DEPOT_CONTACTS[depotId];
  return depot ? depot.contacts : [];
};

/**
 * Get depot name
 * @param {string} depotId - Depot identifier
 * @returns {string} Formatted depot name
 */
export const getDepotName = (depotId) => {
  const depot = DEPOT_CONTACTS[depotId];
  return depot ? depot.name : depotId;
};

/**
 * Find depot by fleet number (basic depot detection)
 * Go North East fleet allocation:
 * - Washington: 5xxx, 6xxx
 * - Riverside: 3xxx, 8xxx
 * - Percy Main: 4xxx
 * - Sunderland: 2xxx
 * - Consett: 7xxx
 * - Deptford: 9xxx
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

  return fleetMapping[firstDigit] || null;
};

/**
 * Get all depot contacts as a flat list
 */
export const getAllContacts = () => {
  return Object.entries(DEPOT_CONTACTS).flatMap(([depotId, depot]) =>
    depot.contacts.map(contact => ({
      ...contact,
      depot: depot.name,
      depotId
    }))
  );
};
