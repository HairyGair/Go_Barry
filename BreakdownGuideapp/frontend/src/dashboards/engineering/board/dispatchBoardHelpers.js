/**
 * Dispatch Board — shared, non-JSX helpers.
 *
 * Job-stage derivation, engineer live-status derivation, depot coordinates,
 * straight-line distance and issue->skill matching for the "Suggested
 * engineer" ranking. Kept pure/framework-free so it's easy to unit reason
 * about and reuse from both the roster and the job board/detail panel.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import { DEPOT_COORDS } from '../EngineeringCardEnhanced';
import { DEMO_DEPOTS, isDemoSession, findDemoDepotByCode, findDemoDepotByName } from '../../../config/demoDepots';

// Real depot code -> display name, so a real engineer's home/shift depot code
// (as stored on the engineer record) can be resolved to the DEPOT_COORDS
// table above, which is keyed by name.
export const REAL_DEPOT_CODE_TO_NAME = {
  WAS: 'Washington',
  NCL: 'Riverside',
  CON: 'Consett',
  GTS: 'Deptford',
  HEX: 'Hexham',
  DAR: 'Percy Main'
};

/** Resolve a depot code or name to {lat, lng}, real or fictional (demo). */
export function getDepotCoords(codeOrName) {
  if (!codeOrName) return null;
  if (isDemoSession()) {
    const demo = findDemoDepotByCode(codeOrName) || findDemoDepotByName(codeOrName);
    return demo ? { lat: demo.lat, lng: demo.lng } : null;
  }
  const name = REAL_DEPOT_CODE_TO_NAME[String(codeOrName).toUpperCase()] || codeOrName;
  const coords = DEPOT_COORDS[name];
  return coords ? { lat: coords[0], lng: coords[1] } : null;
}

/** Haversine straight-line distance in miles between two lat/lng points. */
export function haversineMiles(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v === null || v === undefined || Number.isNaN(v))) return null;
  const R = 3958.8; // Earth radius, miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Extract [lat, lng] from a breakdown/job record, trying every field the
 *  app has historically stored coordinates under. Mirrors the logic used
 *  inside EngineeringCardEnhanced's card so the board and the detail panel
 *  never disagree about where a job actually is. */
export function getBreakdownCoords(breakdown) {
  if (!breakdown) return null;
  const wCoords = breakdown.wizard_assessment_data?.location_coords;
  if (wCoords?.latitude && wCoords?.longitude) return [parseFloat(wCoords.latitude), parseFloat(wCoords.longitude)];
  if (breakdown.latitude && breakdown.longitude) return [parseFloat(breakdown.latitude), parseFloat(breakdown.longitude)];
  if (breakdown.location_lat && breakdown.location_lng) return [parseFloat(breakdown.location_lat), parseFloat(breakdown.location_lng)];
  const text = breakdown.location_description || breakdown.location
    || breakdown.wizard_assessment_data?.location || breakdown.wizard_assessment_data?.location_description || '';
  const m = String(text).match(/\(?\s*(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*\)?/);
  if (m) {
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
  }
  return null;
}

// Issue category (slug, as stored on breakdown.issue_category) -> the skill
// tags tracked on engineers (see BreakdownGuideapp/CLAUDE.md "Skills tracked").
const ISSUE_SKILL_MAP = {
  'brakes': ['Brakes', 'Diagnostics'],
  'abs-light': ['Brakes', 'Diagnostics', 'Electrical'],
  'steering': ['Suspension', 'Mechanical'],
  'suspension': ['Suspension', 'Mechanical'],
  'engine': ['Diagnostics', 'Mechanical', 'Electrical'],
  'electrical': ['Electrical', 'Diagnostics'],
  'hvac': ['HVAC', 'Electrical'],
  'doors': ['Doors', 'Mechanical'],
  'wheelchair-ramp': ['Doors', 'Mechanical', 'Electrical'],
  'windscreen': ['Body', 'Mechanical'],
  'tyres': ['Mechanical'],
  'lights': ['Electrical'],
  'transmission': ['Transmission', 'Mechanical'],
  'fuel-system': ['Diagnostics', 'Mechanical'],
  'cooling-system': ['Mechanical', 'Diagnostics'],
  'exhaust': ['Mechanical'],
  'body-damage': ['Body'],
  'power-loss': ['Electrical', 'Diagnostics'],
  'overheating': ['Mechanical', 'Diagnostics'],
  'fluid-leak': ['Mechanical'],
  'smoke-steam': ['Mechanical', 'Diagnostics'],
  'warning-light': ['Diagnostics', 'Electrical'],
  'ev-low-charge': ['EV/Hybrid', 'Electrical'],
  'ev-not-charging': ['EV/Hybrid', 'Electrical'],
  'ev-battery': ['EV/Hybrid', 'Electrical'],
  'ev-range': ['EV/Hybrid', 'Electrical'],
  'ticketer': ['Electrical', 'Diagnostics'],
  'cctv': ['Electrical', 'Diagnostics'],
  'dda': ['Electrical', 'Diagnostics'],
  'destination-blind': ['Electrical', 'Diagnostics'],
};

export function getPreferredSkills(issueCategory) {
  if (!issueCategory) return ['Mechanical'];
  const key = String(issueCategory).toLowerCase().trim();
  return ISSUE_SKILL_MAP[key] || ['Mechanical'];
}

// The `breakdowns.status` column is shared with other subsystems (e.g. the
// Operations/SDC flow) that use a different vocabulary from the engineering
// dispatch flow ('resolved'/'cleared') - a completed job can also arrive as
// 'completed'/'done'/'closed' depending on where it came from. Treat all of
// these as the board's "done" stage so a job never gets stuck looking like
// it's still awaiting dispatch just because of which flow closed it out.
const DONE_STATUSES = new Set(['resolved', 'cleared', 'completed', 'done', 'closed']);

/** Job board stage: 'awaiting' | 'en_route' | 'on_site' | 'done'. */
export function deriveStage(job) {
  if (!job) return 'awaiting';
  const status = job.status;
  if (DONE_STATUSES.has(status)) return 'done';
  if (job.engineer_on_site_at || status === 'on_site' || status === 'in_progress') return 'on_site';
  if (job.engineer_dispatched_at || status === 'dispatched') return 'en_route';
  return 'awaiting';
}

function sameCalendarDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** True when a job in the 'done' stage was actually completed/cleared today. */
export function isCompletedToday(job) {
  const ts = job.cleared_at || job.engineer_completed_at || job.completed_at || job.resolved_at || job.created_at;
  if (!ts) return false;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return false;
  return sameCalendarDay(d, new Date());
}

/** "Total active" using the same definition Operations uses for its own
 *  active count (status not in resolved/cleared) - the engineering jobs
 *  endpoint only excludes 'resolved' server-side, leaving 'cleared' rows in
 *  the payload, so this must be re-applied client-side to match Operations. */
export function isActiveJob(job) {
  return deriveStage(job) !== 'done';
}

/** Determine an on-shift engineer's live status from the current jobs list.
 *  Returns { status: 'available'|'en_route'|'on_site'|'off_shift', job }. */
export function deriveEngineerLiveStatus(engineer, jobs) {
  const badge = engineer.badge_number;
  const name = engineer.name;
  const activeJob = jobs.find(j => {
    // Match on badge (the field the real dispatch flow always sets) with a
    // name fallback - some records (e.g. the demo seed, which writes
    // engineer_name directly without engineer_badge) only carry the name.
    const badgeMatch = badge && j.engineer_badge && j.engineer_badge === badge;
    const nameMatch = name && j.engineer_name && j.engineer_name === name;
    if (!badgeMatch && !nameMatch) return false;
    const stage = deriveStage(j);
    return stage === 'en_route' || stage === 'on_site';
  });

  if (activeJob) {
    return { status: deriveStage(activeJob), job: activeJob };
  }

  // Shift-end check: an on-shift engineer whose shift has already ended and
  // who isn't on a job right now reads as "off shift" rather than idle.
  if (engineer.shift_end) {
    const [h, m] = String(engineer.shift_end).split(':').map(Number);
    if (!Number.isNaN(h)) {
      const now = new Date();
      const shiftEnd = new Date();
      shiftEnd.setHours(h, m || 0, 0, 0);
      if (now > shiftEnd) return { status: 'off_shift', job: null };
    }
  }

  return { status: 'available', job: null };
}

/**
 * Rank available on-shift engineers for a given awaiting job by skill match
 * (desc) then straight-line distance from their shift/home depot (asc).
 * Returns an array of { engineer, distanceMiles, matchedSkills, skillScore }.
 */
export function rankEngineersForJob(engineers, job, jobs) {
  const jobCoords = getBreakdownCoords(job);
  const preferredSkills = getPreferredSkills(job?.issue_category);

  return engineers
    .filter(e => deriveEngineerLiveStatus(e, jobs).status === 'available')
    .map(e => {
      const depotCode = e.shift_depot || e.home_depot_code;
      const coords = getDepotCoords(depotCode);
      const distanceMiles = (coords && jobCoords)
        ? haversineMiles(coords.lat, coords.lng, jobCoords[0], jobCoords[1])
        : null;
      const skills = Array.isArray(e.skills) ? e.skills : [];
      const matchedSkills = skills.filter(s => preferredSkills.includes(s));
      return {
        engineer: e,
        distanceMiles,
        matchedSkills,
        skillScore: matchedSkills.length
      };
    })
    .sort((a, b) => {
      if (b.skillScore !== a.skillScore) return b.skillScore - a.skillScore;
      if (a.distanceMiles === null && b.distanceMiles === null) return 0;
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
}
