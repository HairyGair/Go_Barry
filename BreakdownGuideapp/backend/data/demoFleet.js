/**
 * Synthetic demo fleet.
 *
 * The public demo (badge DEMO01) must never expose the real operator's fleet
 * (real registrations, real depot rosters). This module is a fixed, deterministic
 * set of fake vehicles used ONLY for demo sessions, served in place of the real
 * `fleet_vehicles` table by backend/routes/fleet.js.
 *
 * It MUST include every fleet_no used by services/demoDataService.js (the demo
 * breakdown/replacement-vehicle seed) so that demo breakdowns resolve to a vehicle
 * record when looked up. If you add a new fleet_no to the demo seed, add it here
 * too (see REQUIRED_FLEET_NUMBERS).
 *
 * Registrations are deliberately non-real-format ("DEMO" + fleet number) so there
 * is no chance of colliding with, or being mistaken for, an actual vehicle plate.
 */

import { DEMO_DEPOTS as DEMO_DEPOT_TABLE } from './demoDepots.js';

// Fleet numbers referenced by services/demoDataService.js (live breakdowns,
// history rows, and replacement-vehicle dispatches). Keep in sync with that file.
const REQUIRED_FLEET_NUMBERS = [
  '6301', '6078', '5437', '5292', '6145', '5318', '6210', '5195',
  '6089', '5401', '5510', '6322', '5267', '5155', // live + history breakdowns
  '6312', '5301', // replacement vehicle dispatches
];

// The 6 fictional depots used by the demo seed (matches services/demoDataService.js
// and data/demoDepots.js - the canonical fictional depot table).
const DEMO_DEPOTS = DEMO_DEPOT_TABLE.map((d) => d.name);

// A spread of plausible (but generic/non-branded) single-deck and double-deck
// bus types, so the fleet looks like a real mixed operation without describing
// any specific real operator's actual vehicle composition.
const DEMO_VEHICLE_TYPES = [
  'Wrightbus Streetdeck',
  'Wrightbus Streetlite',
  'ADL Enviro400',
  'ADL Enviro200',
  'Volvo B5TL',
  'Optare Versa',
  'Mercedes-Benz Citaro',
];

const DEMO_STATUSES = ['active', 'active', 'active', 'maintenance'];

function makeVehicle(fleetNo, index) {
  const depot = DEMO_DEPOTS[index % DEMO_DEPOTS.length];
  const type = DEMO_VEHICLE_TYPES[index % DEMO_VEHICLE_TYPES.length];
  const status = DEMO_STATUSES[index % DEMO_STATUSES.length];
  const registration = `DEMO${fleetNo}`;
  return {
    id: index + 1,
    fleet_no: fleetNo,
    registration,
    depot,
    type,
    vehicle_type: type, // some code paths read `type`, others `vehicle_type` - populate both
    status,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

// Extra filler fleet numbers so the demo fleet list looks like a realistic-sized
// operation (~90 vehicles) rather than just the ~16 vehicles the seed happens to
// reference. Chosen to sit in the same numeric bands as the required numbers.
const FILLER_FLEET_NUMBERS = [
  '5101', '5108', '5112', '5119', '5124', '5130', '5137', '5142', '5148', '5153',
  '5160', '5167', '5172', '5178', '5183', '5188', '5192', '5198', '5203', '5209',
  '5214', '5220', '5225', '5231', '5236', '5242', '5248', '5253', '5259', '5264',
  '5271', '5276', '5282', '5288', '5295', '5304', '5309', '5315', '5321', '5327',
  '5333', '5339', '5345', '5352', '5358', '5365', '5372', '5379', '5385', '5392',
  '6012', '6018', '6025', '6031', '6038', '6044', '6051', '6057', '6063', '6070',
  '6084', '6091', '6098', '6104', '6111', '6118', '6124', '6131', '6138', '6152',
  '6159', '6166', '6173', '6180', '6188', '6195', '6203', '6217', '6224', '6231',
  '6238', '6245', '6252', '6260', '6267', '6274', '6281', '6289', '6296', '6308',
  '6315', '6329', '6336', '6343',
];

// De-duplicate while preserving required numbers first, so lookups never collide.
const ALL_FLEET_NUMBERS = [...new Set([...REQUIRED_FLEET_NUMBERS, ...FILLER_FLEET_NUMBERS])];

export const DEMO_FLEET = ALL_FLEET_NUMBERS.map((fleetNo, index) => makeVehicle(fleetNo, index));

export const DEMO_DEPOT_LIST = DEMO_DEPOTS;
export const DEMO_TYPE_LIST = DEMO_VEHICLE_TYPES;

export function findDemoVehicle(fleetNo) {
  const term = String(fleetNo || '').trim();
  return DEMO_FLEET.find((v) => v.fleet_no === term) || null;
}

export function searchDemoFleet(term) {
  const q = String(term || '').toLowerCase();
  return DEMO_FLEET.filter((v) =>
    v.fleet_no.toLowerCase().includes(q) ||
    v.registration.toLowerCase().includes(q) ||
    (v.depot || '').toLowerCase().includes(q)
  );
}

export default {
  DEMO_FLEET,
  DEMO_DEPOT_LIST,
  DEMO_TYPE_LIST,
  findDemoVehicle,
  searchDemoFleet,
};
