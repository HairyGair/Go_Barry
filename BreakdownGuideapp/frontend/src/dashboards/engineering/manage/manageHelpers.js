/**
 * Engineer Management — shared helpers (depots, time formatting, live status)
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import { getDepotOptions, displayDepotName } from '../../../config/demoDepots';
import { REAL_DEPOT_CODE_TO_NAME, deriveEngineerLiveStatus, getShiftWindow } from '../board/dispatchBoardHelpers';

const REAL_DEPOTS = Object.entries(REAL_DEPOT_CODE_TO_NAME).map(([code, name]) => ({ code, name }));

// Codes the API can return that aren't dropdown options (the depots table uses
// PM for Percy Main). NOTE: the GTS/DAR labels disagree with the depots table
// (GTS=Gateshead, DAR=Deptford) - pending confirmation of the real codes.
const EXTRA_DEPOT_NAMES = { PM: 'Percy Main' };

// Evaluated at call time (not module load): modules outlive logout/login, so a
// module-level list could keep the previous session's depots.
export const getDepots = () => getDepotOptions(REAL_DEPOTS);

export function depotLabel(code) {
  if (!code) return null;
  const upper = String(code).toUpperCase();
  const fromList = getDepots().find(d => d.code.toUpperCase() === upper)?.name;
  return fromList || displayDepotName(REAL_DEPOT_CODE_TO_NAME[upper] || EXTRA_DEPOT_NAMES[upper] || code);
}

export const SKILL_OPTIONS = [
  'Electrical', 'Mechanical', 'HVAC', 'Body', 'EV/Hybrid',
  'Diagnostics', 'Brakes', 'Transmission', 'Doors', 'Suspension'
];

export const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

export function minutesOf(t) {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return Number.isNaN(h) ? null : h * 60 + (m || 0);
}

/** Length of a shift in hours, handling overnight patterns (22:00-06:00 = 8h). */
export function shiftHours(start, end) {
  const s = minutesOf(start);
  const e = minutesOf(end);
  if (s === null || e === null) return null;
  const mins = e > s ? e - s : e + 1440 - s;
  return Math.round((mins / 60) * 10) / 10;
}

/** Segments of a shift on a 0-1440 minute day axis (an overnight shift splits in two). */
export function shiftSegments(start, end) {
  const s = minutesOf(start);
  const e = minutesOf(end);
  if (s === null || e === null) return [];
  if (e > s) return [[s, e]];
  return [[s, 1440], [0, e]].filter(([a, b]) => b > a);
}

export const STATUS_LABEL = {
  available: 'Available',
  en_route: 'En route',
  on_site: 'On site',
  upcoming: 'Later',
  off_shift: 'Finished',
  not_rostered: 'Not rostered',
};

/**
 * Live status for any engineer: combines today's roster entry (if any) with the
 * current jobs list, using the same rules as the dispatch board.
 */
export function liveStatusFor(engineer, rosterEntry, jobs) {
  if (!rosterEntry) {
    // Not rostered, but could still be attached to a live job
    const { status, job } = deriveEngineerLiveStatus({ ...engineer, shift_start: null, shift_end: null }, jobs);
    if (status === 'en_route' || status === 'on_site') return { status, job };
    return { status: 'not_rostered', job: null };
  }
  return deriveEngineerLiveStatus({ ...engineer, ...rosterEntry }, jobs);
}

export { getShiftWindow };
