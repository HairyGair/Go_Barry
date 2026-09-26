// Canonical fictional depot list used for PUBLIC DEMO sessions only.
// Real (non-demo) supervisor sessions must keep using the real GNE depot
// list/data returned by the backend — never import this into a real-session
// code path without gating it behind isDemoSession()/isDemoUser first.
//
// Mirrors backend/data/demoDepots.js — keep the two in sync.

export const DEMO_DEPOTS = [
  { code: 'NGT', name: 'Northgate', lat: 55.0180, lng: -1.6230 },
  { code: 'EFD', name: 'Eastfield', lat: 54.9830, lng: -1.4620 },
  { code: 'HBS', name: 'Harbourside', lat: 54.9120, lng: -1.3850 },
  { code: 'WMR', name: 'Westmoor', lat: 54.9560, lng: -1.7420 },
  { code: 'SBK', name: 'Southbank', lat: 54.8620, lng: -1.5760 },
  { code: 'HCR', name: 'Hillcrest', lat: 54.8720, lng: -1.8350 },
];

// Real depot name -> fictional depot code, so any leftover real-name string
// (from cached data, older records, etc.) can still be mapped to a
// fictional label when rendering in a demo session.
const REAL_TO_DEMO_CODE = {
  'riverside': 'NGT',
  'washington': 'EFD',
  'percy main': 'HBS',
  'deptford': 'SBK',
  'consett': 'HCR',
  'hexham': 'WMR',
  'chester-le-street': 'SBK',
  'chester le street': 'SBK',
  // real codes -> fictional codes
  'ncl': 'NGT',
  'was': 'EFD',
  'pm': 'HBS',
  'dar': 'SBK',
  'gts': 'SBK',
  'con': 'HCR',
  'hex': 'WMR',
};

/**
 * True when the current browser session is a demo session, per the
 * project-wide convention: sessionStorage.currentDuty.isDemo === true.
 * Safe to call anywhere (SSR-safe, never throws).
 */
export function isDemoSession() {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return JSON.parse(sessionStorage.getItem('currentDuty') || 'null')?.isDemo === true;
  } catch {
    return false;
  }
}

/**
 * Returns the depot options to show in a picker/list. In a demo session,
 * always returns the fictional DEMO_DEPOTS regardless of what the caller
 * passed in (so hard-coded lists and backend-derived lists both resolve
 * to the same fictional set). In a real session, returns realList
 * unchanged (or [] if omitted).
 */
export function getDepotOptions(realList = []) {
  return isDemoSession() ? DEMO_DEPOTS : realList;
}

/** Look up a fictional depot by its code (case-insensitive). */
export function findDemoDepotByCode(code) {
  if (!code) return null;
  const needle = String(code).trim().toLowerCase();
  return DEMO_DEPOTS.find((d) => d.code.toLowerCase() === needle) || null;
}

/** Look up a fictional depot by its name (case-insensitive, partial match ok). */
export function findDemoDepotByName(name) {
  if (!name) return null;
  const needle = String(name).trim().toLowerCase();
  return (
    DEMO_DEPOTS.find((d) => d.name.toLowerCase() === needle) ||
    DEMO_DEPOTS.find((d) => needle.includes(d.name.toLowerCase())) ||
    null
  );
}

/**
 * Maps any real GNE depot name/code that might still surface (e.g. from
 * stale cached data) to its fictional counterpart. Returns the fictional
 * depot object, or null if no mapping is known.
 */
export function mapRealDepotToDemo(nameOrCode) {
  if (!nameOrCode) return null;
  const key = String(nameOrCode).trim().toLowerCase();
  const code = REAL_TO_DEMO_CODE[key];
  return code ? findDemoDepotByCode(code) : null;
}

/**
 * Given a depot name/code string, returns the label that should be shown
 * on screen: in a demo session, the fictional name (mapping known real
 * names, or passing through anything already fictional); in a real
 * session, the original label unchanged.
 */
export function displayDepotName(nameOrCode) {
  if (!isDemoSession()) return nameOrCode;
  const mapped = mapRealDepotToDemo(nameOrCode) || findDemoDepotByCode(nameOrCode) || findDemoDepotByName(nameOrCode);
  return mapped ? mapped.name : nameOrCode;
}

/** Depot coordinate lookup (by fictional code or name) for demo sessions. */
export function getDemoDepotCoords(nameOrCode) {
  const depot = findDemoDepotByCode(nameOrCode) || findDemoDepotByName(nameOrCode) || mapRealDepotToDemo(nameOrCode);
  return depot ? { lat: depot.lat, lng: depot.lng } : null;
}

export default DEMO_DEPOTS;
