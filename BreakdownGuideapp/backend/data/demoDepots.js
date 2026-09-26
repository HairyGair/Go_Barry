/**
 * Fictional demo depots.
 *
 * The public demo (badge DEMO01) must never expose the real operator's depot
 * roster (real depot names/codes tied to real North East locations). This is
 * the canonical, fixed set of 6 fictional depots used ONLY for demo sessions -
 * shared by the demo data seed (services/demoDataService.js), the synthetic
 * demo fleet (data/demoFleet.js), and every route that resolves a depot code
 * to a name/coordinates for a demo user (replacement dispatch, engineering
 * calculate-eta, engineer roster joins, analytics depot-comparison, etc).
 *
 * Map tiles/geography stay the real North East (coordinates below are plausible
 * real-world points), but the depot identities themselves are fictional.
 *
 * IMPORTANT: keep this list in sync with frontend/src/config/demoDepots.js
 * (same codes, names and coordinates) - a separate agent maintains that file.
 */

export const DEMO_DEPOTS = [
  { code: 'NGT', name: 'Northgate', lat: 55.0180, lng: -1.6230 },
  { code: 'EFD', name: 'Eastfield', lat: 54.9830, lng: -1.4620 },
  { code: 'HBS', name: 'Harbourside', lat: 54.9120, lng: -1.3850 },
  { code: 'WMR', name: 'Westmoor', lat: 54.9560, lng: -1.7420 },
  { code: 'SBK', name: 'Southbank', lat: 54.8620, lng: -1.5760 },
  { code: 'HCR', name: 'Hillcrest', lat: 54.8720, lng: -1.8350 },
];

// Real GNE depot name -> fictional demo depot code. Used only inside the demo
// data seed / synthetic fleet to translate the old real-depot layout onto the
// fictional one without having to hand-rewrite every reference.
export const GNE_NAME_TO_DEMO_CODE = {
  'Riverside': 'NGT',
  'Washington': 'EFD',
  'Percy Main': 'HBS',
  'Deptford': 'SBK',
  'Consett': 'HCR',
  'Hexham': 'WMR',
  'Chester-le-Street': 'SBK',
};

// Real GNE depot code -> fictional demo depot code (for routes that resolve
// depot codes such as NCL/WAS/GTS/PM/CON/HEX/DAR rather than names).
export const GNE_CODE_TO_DEMO_CODE = {
  NCL: 'NGT',
  WAS: 'EFD',
  PM: 'HBS',
  GTS: 'SBK',
  CON: 'HCR',
  HEX: 'WMR',
  DAR: 'SBK',
};

const byCode = new Map(DEMO_DEPOTS.map((d) => [d.code.toUpperCase(), d]));
const byName = new Map(DEMO_DEPOTS.map((d) => [d.name.toLowerCase(), d]));

/**
 * Look up a fictional demo depot by its code or name. Also accepts a real GNE
 * depot code/name and transparently maps it onto the matching fictional depot,
 * so callers can pass through whatever a legacy demo row still holds.
 *
 * @param {string} codeOrName
 * @returns {{code: string, name: string, lat: number, lng: number} | null}
 */
export function findDemoDepot(codeOrName) {
  const term = String(codeOrName || '').trim();
  if (!term) return null;

  const upper = term.toUpperCase();
  if (byCode.has(upper)) return byCode.get(upper);

  const lower = term.toLowerCase();
  if (byName.has(lower)) return byName.get(lower);

  // Fall back: treat it as a real GNE code/name and translate.
  if (GNE_CODE_TO_DEMO_CODE[upper]) {
    return byCode.get(GNE_CODE_TO_DEMO_CODE[upper]) || null;
  }
  if (GNE_NAME_TO_DEMO_CODE[term]) {
    return byCode.get(GNE_NAME_TO_DEMO_CODE[term]) || null;
  }

  return null;
}

export function getDemoDepotNames() {
  return DEMO_DEPOTS.map((d) => d.name);
}

export default {
  DEMO_DEPOTS,
  GNE_NAME_TO_DEMO_CODE,
  GNE_CODE_TO_DEMO_CODE,
  findDemoDepot,
  getDemoDepotNames,
};
